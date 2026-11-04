package com.bow.backend.controller;

import com.bow.backend.model.Project;
import com.bow.backend.model.ProjectTask;
import com.bow.backend.repository.ProjectRepository;
import com.bow.backend.repository.ProjectTaskRepository;
import com.bow.backend.repository.UserRepository;
import com.bow.backend.service.ProjectComplexityService;
import com.bow.backend.config.AccessControlInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ProjectsController {
    private static final String DEFAULT_STATUS = "Новый";

    private final ProjectRepository projects;
    private final ProjectTaskRepository tasks;
    private final ProjectComplexityService complexity;
    private final UserRepository users;

    public ProjectsController(ProjectRepository projects, ProjectTaskRepository tasks,
                              ProjectComplexityService complexity, UserRepository users) {
        this.projects = projects;
        this.tasks = tasks;
        this.complexity = complexity;
        this.users = users;
    }

    @GetMapping("/projects")
    public List<Project> list(@RequestParam(required = false) String mine,
                              @RequestParam(required = false) Boolean team,
                              HttpServletRequest request) {
        List<Project> all = projects.findAll();
        if (!"Boss".equals(request.getAttribute(AccessControlInterceptor.ROLE_ATTRIBUTE))) {
            String username = (String) request.getAttribute(AccessControlInterceptor.USERNAME_ATTRIBUTE);
            all = all.stream().filter(project ->
                    project.getCurators().contains(username) || tasks.findByProjectId(project.getId()).stream()
                            .anyMatch(task -> task.getSubstituteUsername() != null
                                    && task.getSubstituteUsername().equals(username)
                                    && task.getTransferUntil() != null
                                    && !task.getTransferUntil().isBefore(LocalDate.now()))).toList();
        }
        if (mine != null && !mine.isBlank()) {
            return all.stream().filter(project ->
                    mine.equals(project.getOwner()) || project.getCurators().contains(mine)).toList();
        }
        if (Boolean.TRUE.equals(team)) return all.stream().filter(Project::isTeamProject).toList();
        return all;
    }

    @GetMapping("/users/curators")
    public List<Map<String, Object>> listCurators() {
        return users.findAll().stream()
                .filter(user -> user.getRole() == null || !"Boss".equals(user.getRole().getName()))
                .map(user -> Map.<String, Object>of(
                        "username", user.getUsername(),
                        "role", user.getRole() == null ? "" : user.getRole().getName()))
                .toList();
    }

    @PostMapping("/projects")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> payload) {
        String name = stringValue(payload.get("name"));
        if (name.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "project_name_required"));
        if (!(payload.get("curators") instanceof List<?> curatorList) || curatorList.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "at_least_one_curator_required"));
        }
        if (hasUnknownCurators(curatorList)) {
            return ResponseEntity.badRequest().body(Map.of("error", "curators_must_be_existing_users"));
        }
        Project project = new Project(name);
        project.setStatus(DEFAULT_STATUS);
        apply(project, payload);
        Project saved = projects.save(project);
        synchronizeTasks(saved);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/projects/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> payload,
                                    HttpServletRequest request) {
        Optional<Project> found = projects.findById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        if (payload.get("curators") instanceof List<?> curatorList && hasUnknownCurators(curatorList)) {
            return ResponseEntity.badRequest().body(Map.of("error", "curators_must_be_existing_users"));
        }
        if (!"Boss".equals(request.getAttribute(AccessControlInterceptor.ROLE_ATTRIBUTE))) {
            payload = curatorFieldsOnly(payload);
        }
        Project project = found.get();
        apply(project, payload);
        Project saved = projects.save(project);
        synchronizeTasks(saved);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/projects/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return projects.findById(id).map(project -> {
            String status = stringValue(payload.get("status"));
            if (status.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "status_required"));
            project.setStatus(status);
            return ResponseEntity.ok(projects.save(project));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/tasks")
    public ResponseEntity<?> listTasks(@RequestParam String username,
                                       @RequestParam(defaultValue = "false") boolean archived) {
        if (username.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "username_required"));
        List<Map<String, Object>> result = tasks.findAll().stream()
                .filter(task -> task.getUsername().equals(username)
                        || (username.equals(task.getSubstituteUsername()) && task.getTransferUntil() != null
                        && !task.getTransferUntil().isBefore(LocalDate.now())))
                .sorted(Comparator.comparing(ProjectTask::getId).reversed())
                .filter(task -> task.isCompleted() == archived)
                .map(this::taskView)
                .toList();
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/tasks/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Optional<ProjectTask> found = tasks.findById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        Object completedValue = payload.get("completed");
        if (!(completedValue instanceof Boolean completed)) {
            return ResponseEntity.badRequest().body(Map.of("error", "completed_boolean_required"));
        }
        ProjectTask task = found.get();
        task.setCompleted(completed);
        ProjectTask saved = tasks.save(task);
        List<ProjectTask> projectTasks = tasks.findByProjectId(saved.getProject().getId());
        Project project = projects.findById(saved.getProject().getId()).orElseThrow();
        boolean allTasksCompleted = !projectTasks.isEmpty() && projectTasks.stream().allMatch(ProjectTask::isCompleted);
        project.setCuratorStatus(allTasksCompleted ? "Готово" : "В работе");
        if (allTasksCompleted && (project.getStatus() == null
                || !Set.of("Выполнено", "Отменено", "Закрыто", "Hold").contains(project.getStatus()))) {
            project.setStatus("Согласование руководителя");
        } else if (!allTasksCompleted && ("Согласование руководителя".equals(project.getStatus())
                || "Выполнено".equals(project.getStatus()))) {
            project.setStatus("В работе");
        }
        projects.save(project);
        return ResponseEntity.ok(taskView(saved));
    }

    @PatchMapping("/tasks/{id}/transfer")
    public ResponseEntity<?> transferTask(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Optional<ProjectTask> found = tasks.findById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        String username = stringValue(payload.get("username"));
        String untilValue = stringValue(payload.get("until"));
        if (username.isBlank()) {
            found.get().transferTo(null, null);
            return ResponseEntity.ok(taskView(tasks.save(found.get())));
        }
        if (users.findByUsername(username).isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "substitute_must_be_existing_user"));
        }
        LocalDate until = parseDate(untilValue);
        if (until == null || until.isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "transfer_until_must_be_today_or_later"));
        }
        found.get().transferTo(username, until);
        return ResponseEntity.ok(taskView(tasks.save(found.get())));
    }

    @GetMapping("/projects/schedule")
    public List<Map<String, Object>> schedule(@RequestParam(required = false) String from,
                                               @RequestParam(required = false) String to,
                                               @RequestParam(defaultValue = "false") boolean includeDone,
                                               HttpServletRequest request) {
        LocalDate start = parseDate(from);
        LocalDate end = parseDate(to);
        boolean admin = "Boss".equals(request.getAttribute(AccessControlInterceptor.ROLE_ATTRIBUTE));
        String username = (String) request.getAttribute(AccessControlInterceptor.USERNAME_ATTRIBUTE);
        return projects.findAll().stream()
                .filter(project -> admin || canViewProject(project, username))
                .filter(project -> !project.isGraphDone() || includeDone)
                .filter(this::isTransferred)
                .filter(project -> inRangeIfSpecified(project.getLaunchDate(), start, end))
                .map(this::scheduleView)
                .toList();
    }

    private boolean canViewProject(Project project, String username) {
        return project.getCurators().contains(username)
                || tasks.findByProjectId(project.getId()).stream().anyMatch(task ->
                username.equals(task.getSubstituteUsername()) && task.getTransferUntil() != null
                        && !task.getTransferUntil().isBefore(LocalDate.now()));
    }

    @PatchMapping("/projects/{id}/schedule")
    public ResponseEntity<?> updateSchedule(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Optional<Project> found = projects.findById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        Project project = found.get();
        if (payload.get("graphDone") instanceof Boolean graphDone) project.setGraphDone(graphDone);
        Object rawOverrides = payload.get("graphOverrides");
        if (rawOverrides instanceof Map<?, ?> overrideMap) {
            Map<String, Object> cleaned = new LinkedHashMap<>();
            overrideMap.forEach((key, value) -> {
                if (key instanceof String stringKey) cleaned.put(stringKey, value);
            });
            project.setGraphOverrides(cleaned);
        }
        return ResponseEntity.ok(scheduleView(projects.save(project)));
    }

    @GetMapping(value = "/projects/schedule/export",
            produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<byte[]> exportSchedule(@RequestParam(required = false) String from,
                                                  @RequestParam(required = false) String to,
                                                  @RequestParam(defaultValue = "false") boolean includeDone,
                                                  HttpServletRequest request) throws IOException {
        List<String> headers = List.of("Проект", "Описание", "Отправляем?", "Категория", "Дата запуска",
                "Дата утверждена?", "География", "Название статьи в KMS", "Информирование Розница Т2",
                "Информирование Партнёры", "Информирование Розница ФД", "Информирование ЛД",
                "Информирование ДС", "Информирование Внутренние", "Ежемесячный дайджест", "Готово");
        LocalDate start = parseDate(from);
        LocalDate end = parseDate(to);
        boolean admin = "Boss".equals(request.getAttribute(AccessControlInterceptor.ROLE_ATTRIBUTE));
        String username = (String) request.getAttribute(AccessControlInterceptor.USERNAME_ATTRIBUTE);
        List<Map<String, Object>> scheduleRows = projects.findAll().stream()
                .filter(project -> admin || canViewProject(project, username))
                .filter(this::isTransferred)
                .filter(project -> !project.isGraphDone() || includeDone)
                .filter(project -> inRangeIfSpecified(project.getLaunchDate(), start, end))
                .map(this::scheduleView)
                .toList();
        byte[] workbookBytes;
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("График проектов");
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            Row header = sheet.createRow(0);
            for (int column = 0; column < headers.size(); column++) {
                Cell cell = header.createCell(column);
                cell.setCellValue(headers.get(column));
                cell.setCellStyle(headerStyle);
            }
            for (int rowIndex = 0; rowIndex < scheduleRows.size(); rowIndex++) {
                Row excelRow = sheet.createRow(rowIndex + 1);
                Map<String, Object> values = scheduleRows.get(rowIndex);
                for (int column = 0; column < headers.size(); column++) {
                    Object value = values.get(headers.get(column));
                    excelRow.createCell(column).setCellValue(value == null ? "" : String.valueOf(value));
                }
            }
            for (int column = 0; column < headers.size(); column++) sheet.autoSizeColumn(column);
            workbook.write(output);
            workbookBytes = output.toByteArray();
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"project-schedule.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(workbookBytes);
    }

    private void apply(Project project, Map<String, Object> payload) {
        if (payload.containsKey("name")) project.setName(stringValue(payload.get("name")));
        if (payload.containsKey("owner")) project.setOwner(stringValue(payload.get("owner")));
        if (payload.containsKey("description")) project.setDescription(stringValue(payload.get("description")));
        if (payload.containsKey("descriptionBefore")) project.setDescriptionBefore(stringValue(payload.get("descriptionBefore")));
        if (payload.containsKey("descriptionAfter")) project.setDescriptionAfter(stringValue(payload.get("descriptionAfter")));
        if (payload.containsKey("pilotPlan")) project.setPilotPlan(stringValue(payload.get("pilotPlan")));
        if (payload.containsKey("status")) project.setStatus(stringValue(payload.get("status")));
        if (payload.containsKey("sendFlag")) project.setSendFlag(stringValue(payload.get("sendFlag")));
        if (payload.containsKey("level")) project.setLevel(stringValue(payload.get("level")));
        if (payload.containsKey("secrecy")) project.setSecrecy(stringValue(payload.get("secrecy")));
        if (payload.containsKey("category")) project.setCategory(stringValue(payload.get("category")));
        if (payload.containsKey("launchDate")) project.setLaunchDate(stringValue(payload.get("launchDate")));
        if (payload.containsKey("approved")) project.setApproved(stringValue(payload.get("approved")));
        if (payload.containsKey("geography")) project.setGeography(stringValue(payload.get("geography")));
        if (payload.get("geographyRegions") instanceof List<?> values) {
            project.setGeographyRegions(values.stream().map(String::valueOf).toList());
        }
        if (payload.containsKey("typeField")) project.setTypeField(stringValue(payload.get("typeField")));
        if (payload.containsKey("dateField")) project.setDateField(stringValue(payload.get("dateField")));
        if (payload.containsKey("volume")) project.setVolume(stringValue(payload.get("volume")));
        if (payload.containsKey("abBaseVolume")) project.setAbBaseVolume(stringValue(payload.get("abBaseVolume")));
        if (payload.containsKey("kms")) project.setKms(stringValue(payload.get("kms")));
        if (payload.containsKey("wt")) project.setWt(stringValue(payload.get("wt")));
        if (payload.containsKey("ivr")) project.setIvr(stringValue(payload.get("ivr")));
        if (payload.containsKey("smsTemplates")) project.setSmsTemplates(stringValue(payload.get("smsTemplates")));
        if (payload.containsKey("cmsArticleTitle")) project.setCmsArticleTitle(stringValue(payload.get("cmsArticleTitle")));
        if (payload.containsKey("website")) project.setWebsite(stringValue(payload.get("website")));
        if (payload.containsKey("sellerTask")) project.setSellerTask(stringValue(payload.get("sellerTask")));
        if (payload.containsKey("ownerProject")) project.setOwnerProject(stringValue(payload.get("ownerProject")));
        if (payload.containsKey("curator")) project.setCurator(stringValue(payload.get("curator")));
        if (payload.containsKey("codeName")) project.setCodeName(stringValue(payload.get("codeName")));
        if (payload.containsKey("customer")) project.setCustomer(stringValue(payload.get("customer")));
        if (payload.containsKey("orp")) project.setOrp(stringValue(payload.get("orp")));
        if (payload.containsKey("zniLink")) project.setZniLink(stringValue(payload.get("zniLink")));
        if (payload.containsKey("curatorStatus")) project.setCuratorStatus(stringValue(payload.get("curatorStatus")));
        if (payload.containsKey("graphName")) project.setGraphName(stringValue(payload.get("graphName")));
        if (payload.containsKey("graphTransferMode")) project.setGraphTransferMode(stringValue(payload.get("graphTransferMode")));
        if (payload.containsKey("graphInfoDate")) project.setGraphInfoDate(stringValue(payload.get("graphInfoDate")));
        if (payload.get("graphDone") instanceof Boolean graphDone) project.setGraphDone(graphDone);
        if (payload.get("teamProject") instanceof Boolean teamProject) project.setTeamProject(teamProject);
        if (payload.get("curators") instanceof List<?> values) {
            project.setCurators(values.stream().map(String::valueOf).filter(value -> !value.isBlank())
                    .collect(Collectors.toCollection(LinkedHashSet::new)));
        }
        if (payload.get("details") instanceof Map<?, ?> rawDetails) {
            Map<String, Object> details = new LinkedHashMap<>();
            rawDetails.forEach((key, value) -> {
                if (key instanceof String stringKey) details.put(stringKey, value);
            });
            project.setDetails(details);
        }
        if (payload.get("graphOverrides") instanceof Map<?, ?> rawOverrides) {
            Map<String, Object> overrides = new LinkedHashMap<>();
            rawOverrides.forEach((key, value) -> {
                if (key instanceof String stringKey) overrides.put(stringKey, value);
            });
            project.setGraphOverrides(overrides);
        }
        if (payload.get("complexity") instanceof Number complexity) project.setComplexity(complexity.doubleValue());
        project.setComplexity(complexity.calculate(project.getDetails()));
    }

    private void synchronizeTasks(Project project) {
        Set<String> curatorNames = new LinkedHashSet<>(project.getCurators());
        tasks.findByProjectId(project.getId()).stream()
                .filter(task -> !curatorNames.contains(task.getUsername()))
                .forEach(tasks::delete);
        for (String username : curatorNames) {
            tasks.findByProjectIdAndUsername(project.getId(), username)
                    .orElseGet(() -> tasks.save(new ProjectTask(project, username)));
        }
        List<ProjectTask> assignments = tasks.findByProjectId(project.getId());
        if (!assignments.isEmpty()) {
            project.setCuratorStatus(assignments.stream().allMatch(ProjectTask::isCompleted)
                    ? "Готово" : "В работе");
        } else {
            project.setCuratorStatus("");
        }
        projects.save(project);
    }

    private boolean hasUnknownCurators(List<?> curatorNames) {
        return curatorNames.stream().map(String::valueOf).map(String::trim)
                .filter(name -> !name.isBlank()).anyMatch(name -> users.findByUsername(name).isEmpty());
    }

    private Map<String, Object> curatorFieldsOnly(Map<String, Object> payload) {
        Set<String> allowed = Set.of("description", "descriptionBefore", "descriptionAfter", "pilotPlan",
                "graphName", "launchDate", "approved", "secrecy",
                "geography", "geographyRegions", "graphInfoDate", "graphTransferMode", "details");
        Map<String, Object> safePayload = new LinkedHashMap<>();
        payload.forEach((key, value) -> {
            if (allowed.contains(key)) safePayload.put(key, value);
        });
        return safePayload;
    }

    private Map<String, Object> taskView(ProjectTask task) {
        Project project = task.getProject();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", task.getId());
        result.put("username", task.getUsername());
        result.put("completed", task.isCompleted());
        result.put("completedAt", task.getCompletedAt() == null ? "" : task.getCompletedAt().toString());
        result.put("substituteUsername", task.getSubstituteUsername() == null ? "" : task.getSubstituteUsername());
        result.put("transferUntil", task.getTransferUntil() == null ? "" : task.getTransferUntil().toString());
        result.put("project", taskProjectView(project));
        return result;
    }

    private Map<String, Object> taskProjectView(Project project) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", project.getId());
        result.put("name", project.getName());
        result.put("owner", project.getOwner());
        result.put("codeName", project.getCodeName());
        result.put("customer", project.getCustomer());
        result.put("orp", project.getOrp());
        result.put("category", project.getCategory());
        result.put("curators", project.getCurators());
        result.put("status", project.getStatus());
        result.put("curatorStatus", project.getCuratorStatus());
        result.put("zniLink", project.getZniLink());
        result.put("description", project.getDescription());
        result.put("descriptionBefore", project.getDescriptionBefore());
        result.put("descriptionAfter", project.getDescriptionAfter());
        result.put("pilotPlan", project.getPilotPlan());
        result.put("graphName", project.getGraphName());
        result.put("launchDate", project.getLaunchDate());
        result.put("approved", project.getApproved());
        result.put("secrecy", project.getSecrecy());
        result.put("graphInfoDate", project.getGraphInfoDate());
        result.put("graphTransferMode", project.getGraphTransferMode());
        result.put("geography", project.getGeography());
        result.put("geographyRegions", project.getGeographyRegions());
        result.put("details", project.getDetails());
        result.put("complexity", project.getComplexity());
        return result;
    }

    private Map<String, Object> scheduleView(Project project) {
        Map<String, Object> row = new LinkedHashMap<>();
        Map<String, Object> overrides = project.getGraphOverrides() == null ? Map.of() : project.getGraphOverrides();
        List<String> regions = project.getGeographyRegions() == null ? List.of() : project.getGeographyRegions();
        List<String> selectedRegions = regions.isEmpty() && project.getGeography() != null
                ? Arrays.stream(project.getGeography().split(",")).map(String::trim).filter(value -> !value.isBlank()).toList()
                : regions;
        String fullGeography = String.join(", ", selectedRegions);
        String geography = selectedRegions.size() > 3 ? String.valueOf(selectedRegions.size()) : fullGeography;
        String description = String.join("\n", Arrays.stream(new String[] {
                descriptionLine("КОГДА", project.getLaunchDate()),
                descriptionLine("ГЕОГРАФИЯ", fullGeography),
                descriptionLine("ОПИСАНИЕ", project.getDescription()),
                descriptionLine("БЫЛО", project.getDescriptionBefore()),
                descriptionLine("СТАЛО", project.getDescriptionAfter()),
                descriptionLine("КАК БУДЕТ ПРОХОДИТЬ ПИЛОТ", project.getPilotPlan())
        }).filter(value -> !value.isBlank()).toList());
        row.put("id", project.getId());
        row.put("Проект", overrides.getOrDefault("Проект",
                project.getGraphName() == null || project.getGraphName().isBlank() ? project.getName() : project.getGraphName()));
        row.put("Описание", overrides.getOrDefault("Описание", description));
        row.put("Отправляем?", overrides.getOrDefault("Отправляем?",
                isTransferred(project) ? "Да" : "Нет"));
        row.put("Категория", overrides.getOrDefault("Категория", project.getCategory()));
        row.put("Дата запуска", overrides.getOrDefault("Дата запуска", project.getLaunchDate()));
        row.put("Дата утверждена?", overrides.getOrDefault("Дата утверждена?", project.getApproved()));
        row.put("География", overrides.getOrDefault("География", geography));
        Map<String, Object> details = project.getDetails() == null ? Map.of() : project.getDetails();
        row.put("Название статьи в KMS", overrides.getOrDefault("Название статьи в KMS",
                details.getOrDefault("kmsArticleTitle", project.getCmsArticleTitle())));
        String retailT2 = List.of(
                stringValue(details.get("communicationsRetailChannel0")),
                stringValue(details.get("communicationsRetailChannel1"))
        ).stream().filter(value -> !value.isBlank()).collect(Collectors.joining(", "));
        row.put("Информирование Розница Т2", overrides.getOrDefault("Информирование Розница Т2", retailT2));
        row.put("Информирование Партнёры", overrides.getOrDefault("Информирование Партнёры", details.get("communicationsPartners")));
        row.put("Информирование Розница ФД", overrides.getOrDefault("Информирование Розница ФД", details.get("communicationsRetailChannel3")));
        row.put("Информирование ЛД", overrides.getOrDefault("Информирование ЛД", details.get("communicationsRetailChannel2")));
        row.put("Информирование ДС", overrides.getOrDefault("Информирование ДС", details.get("communicationsRemoteService")));
        row.put("Информирование Внутренние", overrides.getOrDefault("Информирование Внутренние", details.get("communicationsInternal")));
        row.put("Ежемесячный дайджест", overrides.getOrDefault("Ежемесячный дайджест", details.get("communicationsMonthlyDigest")));
        row.put("Готово", project.isGraphDone() ? "Да" : "Нет");
        row.put("graphDone", project.isGraphDone());
        row.put("graphTransferMode", project.getGraphTransferMode());
        row.put("graphOverrides", overrides);
        return row;
    }

    private String stringValue(Object value) { return value == null ? "" : String.valueOf(value).trim(); }
    private String descriptionLine(String label, String value) {
        return value == null || value.isBlank() ? "" : label + ": " + value.trim();
    }
    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try { return LocalDate.parse(value); } catch (Exception exception) {
            throw new IllegalArgumentException("Date must use ISO format yyyy-MM-dd", exception);
        }
    }
    private boolean inRange(String dateValue, LocalDate start, LocalDate end) {
        LocalDate date = parseDate(dateValue);
        return date != null && (start == null || !date.isBefore(start)) && (end == null || !date.isAfter(end));
    }
    private boolean inRangeIfSpecified(String dateValue, LocalDate start, LocalDate end) {
        if (start == null && end == null) return true;
        return dateValue != null && !dateValue.isBlank() && inRange(dateValue, start, end);
    }
    private boolean isTransferred(Project project) {
        String mode = project.getGraphTransferMode();
        boolean graphTransferEnabled = mode != null && !mode.isBlank()
                && !"Не передавать".equalsIgnoreCase(mode);
        boolean sendingEnabled = project.getSendFlag() != null
                && Set.of("yes", "да", "true").contains(project.getSendFlag().trim().toLowerCase(Locale.ROOT));
        return graphTransferEnabled || sendingEnabled;
    }
}
