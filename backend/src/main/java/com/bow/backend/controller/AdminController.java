package com.bow.backend.controller;

import com.bow.backend.model.Role;
import com.bow.backend.model.User;
import com.bow.backend.repository.RoleRepository;
import com.bow.backend.repository.UserRepository;
import com.bow.backend.model.ProjectCategory;
import com.bow.backend.model.ComplexityWeight;
import com.bow.backend.repository.ProjectCategoryRepository;
import com.bow.backend.repository.ComplexityWeightRepository;
import com.bow.backend.model.ProjectTask;
import com.bow.backend.model.Project;
import com.bow.backend.repository.ProjectTaskRepository;
import com.bow.backend.model.ProjectField;
import com.bow.backend.repository.ProjectFieldRepository;
import com.bow.backend.model.ProjectRegion;
import com.bow.backend.repository.ProjectRegionRepository;
import com.bow.backend.repository.ProjectRepository;
import com.bow.backend.service.ProjectComplexityService;
import com.bow.backend.service.PasswordService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Objects;
import java.util.Comparator;
import java.util.stream.Collectors;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ProjectCategoryRepository categoryRepository;
    private final ComplexityWeightRepository complexityWeightRepository;
    private final ProjectTaskRepository projectTaskRepository;
    private final ProjectFieldRepository projectFieldRepository;
    private final ProjectRepository projectRepository;
    private final ProjectComplexityService complexityService;
    private final PasswordService passwordService;
    private final ProjectRegionRepository regionRepository;

    public AdminController(UserRepository userRepository, RoleRepository roleRepository,
                           ProjectCategoryRepository categoryRepository,
                           ComplexityWeightRepository complexityWeightRepository,
                           ProjectTaskRepository projectTaskRepository,
                           ProjectFieldRepository projectFieldRepository,
                           ProjectRepository projectRepository,
                           ProjectComplexityService complexityService,
                           PasswordService passwordService,
                           ProjectRegionRepository regionRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.categoryRepository = categoryRepository;
        this.complexityWeightRepository = complexityWeightRepository;
        this.projectTaskRepository = projectTaskRepository;
        this.projectFieldRepository = projectFieldRepository;
        this.projectRepository = projectRepository;
        this.complexityService = complexityService;
        this.passwordService = passwordService;
        this.regionRepository = regionRepository;
    }

    @GetMapping("/users")
    public List<Map<String,Object>> listUsers() {
        return userRepository.findAll().stream().map(u -> Map.<String,Object>of(
                "id", u.getId(),
                "username", u.getUsername(),
                "role", u.getRole() != null ? u.getRole().getName() : ""
        )).collect(Collectors.toList());
    }

    @GetMapping("/roles")
    public List<String> listRoles() {
        return roleRepository.findAll().stream().map(Role::getName).collect(Collectors.toList());
    }

    @GetMapping("/categories")
    public List<String> listCategories() {
        return categoryRepository.findAll().stream().map(ProjectCategory::getName).toList();
    }

    @GetMapping("/regions")
    public List<String> listRegions() {
        return regionRepository.findAllByOrderByNameAsc().stream().map(ProjectRegion::getName).toList();
    }

    @PutMapping("/regions")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> saveRegions(@RequestBody Map<String, List<String>> body) {
        List<String> names = body.get("regions");
        if (names == null) return ResponseEntity.badRequest().body(Map.of("error", "regions_required"));
        Map<String, String> uniqueNames = new LinkedHashMap<>();
        names.stream().filter(Objects::nonNull).map(String::trim).filter(name -> !name.isEmpty())
                .forEach(name -> uniqueNames.putIfAbsent(name.toLowerCase(Locale.ROOT), name));
        if (uniqueNames.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "at_least_one_region_required"));
        }
        List<String> cleaned = List.copyOf(uniqueNames.values());
        regionRepository.deleteAllInBatch();
        regionRepository.saveAll(cleaned.stream().map(ProjectRegion::new).toList());
        return ResponseEntity.ok(cleaned);
    }

    @PutMapping("/categories")
    public ResponseEntity<?> saveCategories(@RequestBody Map<String, List<String>> body) {
        List<String> names = body.get("categories");
        if (names == null) return ResponseEntity.badRequest().body(Map.of("error", "categories_required"));
        List<String> cleaned = names.stream().map(String::trim).filter(name -> !name.isEmpty()).distinct().toList();
        categoryRepository.deleteAll();
        categoryRepository.saveAll(cleaned.stream().map(ProjectCategory::new).toList());
        return ResponseEntity.ok(cleaned);
    }

    @GetMapping("/complexity")
    public Map<String, Double> listComplexityWeights() {
        return complexityWeightRepository.findAll().stream()
                .collect(Collectors.toMap(ComplexityWeight::getFieldKey, ComplexityWeight::getWeight));
    }

    @PutMapping("/complexity")
    public ResponseEntity<?> saveComplexityWeights(@RequestBody Map<String, Double> body) {
        if (body.values().stream().anyMatch(value -> value == null || value < 0)) {
            return ResponseEntity.badRequest().body(Map.of("error", "weights_must_be_non_negative"));
        }
        body.forEach((key, value) -> complexityWeightRepository.save(
                complexityWeightRepository.findById(key).map(weight -> {
                    weight.setWeight(value);
                    return weight;
                }).orElseGet(() -> new ComplexityWeight(key, value))));
        projectRepository.findAll().forEach(project -> {
            project.setComplexity(complexityService.calculate(project.getDetails()));
            projectRepository.save(project);
        });
        return ResponseEntity.ok(listComplexityWeights());
    }

    @GetMapping("/fields")
    public List<ProjectField> listProjectFields() {
        return projectFieldRepository.findAll();
    }

    @PutMapping("/fields")
    public ResponseEntity<?> saveProjectFields(@RequestBody List<Map<String, Object>> body) {
        List<ProjectField> fields = new java.util.ArrayList<>();
        for (Map<String, Object> item : body) {
            String key = String.valueOf(item.getOrDefault("fieldKey", "")).trim();
            String label = String.valueOf(item.getOrDefault("label", "")).trim();
            String type = String.valueOf(item.getOrDefault("type", "text")).trim();
            if (key.isBlank() || label.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "field_key_and_label_required"));
            }
            List<String> options = item.get("options") instanceof List<?> values
                    ? values.stream().map(String::valueOf).toList() : List.of();
            fields.add(new ProjectField(key, label, type, options));
        }
        projectFieldRepository.deleteAll();
        return ResponseEntity.ok(projectFieldRepository.saveAll(fields));
    }

    @GetMapping("/workload")
    public List<Map<String, Object>> workload(@RequestParam(defaultValue = "year") String period) {
        LocalDate today = LocalDate.now();
        LocalDate start = switch (period.toLowerCase(java.util.Locale.ROOT)) {
            case "day", "today" -> today;
            case "month" -> today.withDayOfMonth(1);
            default -> today.withDayOfYear(1);
        };
        LocalDate end = switch (period.toLowerCase(java.util.Locale.ROOT)) {
            case "day", "today" -> today;
            case "month" -> today.withDayOfMonth(today.lengthOfMonth());
            default -> today.withDayOfYear(today.lengthOfYear());
        };
        Map<String, List<ProjectTask>> tasksByUser = projectTaskRepository.findAll().stream()
                .collect(Collectors.groupingBy(ProjectTask::getUsername));
        return userRepository.findAll().stream()
                .map(user -> {
                    List<ProjectTask> assignments = tasksByUser.getOrDefault(user.getUsername(), List.of());
                    List<ProjectTask> completedInPeriod = assignments.stream()
                            .filter(ProjectTask::isCompleted)
                            .filter(task -> task.getCompletedAt() != null
                                    && !task.getCompletedAt().toLocalDate().isBefore(start)
                                    && !task.getCompletedAt().toLocalDate().isAfter(end))
                            .toList();
                    List<ProjectTask> relevant = switch (period.toLowerCase(java.util.Locale.ROOT)) {
                        case "day", "today", "month" -> java.util.stream.Stream.concat(
                                assignments.stream().filter(task -> !task.isCompleted()),
                                completedInPeriod.stream()).distinct().toList();
                        default -> assignments;
                    };
                    return Map.<String, Object>of(
                            "username", user.getUsername(),
                            "activeTasks", relevant.stream().filter(task -> !task.isCompleted()).count(),
                            "completedInPeriod", completedInPeriod.size(),
                            "totalTasks", relevant.size(),
                            "complexity", relevant.stream().mapToDouble(task -> task.getProject().getComplexity()).sum()
                    );
                }).sorted(Comparator.comparing(row -> (String) row.get("username"))).toList();
    }

    @GetMapping("/tasks")
    public List<Map<String, Object>> listTasks() {
        return projectTaskRepository.findAll().stream().map(task -> {
            Project projectValue = task.getProject();
            Map<String, Object> project = new java.util.LinkedHashMap<>();
            project.put("id", projectValue.getId());
            project.put("name", projectValue.getName());

            Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("id", task.getId());
            row.put("username", task.getUsername());
            row.put("completed", task.isCompleted());
            row.put("completedAt", task.getCompletedAt() == null ? "" : task.getCompletedAt().toString());
            row.put("substituteUsername", task.getSubstituteUsername() == null ? "" : task.getSubstituteUsername());
            row.put("transferUntil", task.getTransferUntil() == null ? "" : task.getTransferUntil().toString());
            row.put("project", project);
            return row;
        }).toList();
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String,String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String role = body.get("role");
        if (username == null || username.isBlank() || password == null || password.length() < 12
                || !passwordService.isAcceptableRawPassword(password)) {
            return ResponseEntity.badRequest().body(Map.of("error", "username_and_password_required",
                    "passwordPolicy", "minimum_12_characters"));
        }
        username = username.trim();
        if (role == null || !Set.of("Boss", "Kotik", "Guest").contains(role)) {
            return ResponseEntity.badRequest().body(Map.of("error", "invalid_role"));
        }
        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error","user_exists"));
        }
        Role r = roleRepository.findByName(role).orElseGet(() -> roleRepository.save(new Role(role)));
        User u = new User(username.trim(), passwordService.encode(password), r);
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("id", u.getId(), "username", u.getUsername(), "role", r.getName()));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String,String> body) {
        Optional<User> ou = userRepository.findById(id);
        if (ou.isEmpty()) return ResponseEntity.notFound().build();
        User u = ou.get();
        if (body.containsKey("username")) {
            String username = body.get("username");
            if (username == null || username.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "username_required"));
            }
            if (userRepository.findByUsername(username.trim()).filter(existing -> !existing.getId().equals(id)).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "user_exists"));
            }
            u.setUsername(username.trim());
        }
        if (body.containsKey("password")) {
            String password = body.get("password");
            if (password == null || password.length() < 12 || !passwordService.isAcceptableRawPassword(password)) {
                return ResponseEntity.badRequest().body(Map.of("error", "password_too_short",
                        "passwordPolicy", "minimum_12_characters"));
            }
            u.setPassword(passwordService.encode(password));
            u.incrementCredentialVersion();
        }
        if (body.containsKey("role")) {
            String rn = body.get("role");
            if (rn == null || !Set.of("Boss", "Kotik", "Guest").contains(rn)) {
                return ResponseEntity.badRequest().body(Map.of("error", "invalid_role"));
            }
            Role r = roleRepository.findByName(rn).orElseGet(() -> roleRepository.save(new Role(rn)));
            u.setRole(r);
        }
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("id", u.getId(), "username", u.getUsername(), "role", u.getRole().getName()));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("deleted", true));
        }
        return ResponseEntity.notFound().build();
    }
}
