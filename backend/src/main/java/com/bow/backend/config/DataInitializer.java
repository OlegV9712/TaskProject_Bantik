package com.bow.backend.config;

import com.bow.backend.model.Role;
import com.bow.backend.model.User;
import com.bow.backend.repository.RoleRepository;
import com.bow.backend.repository.UserRepository;
import com.bow.backend.model.ProjectCategory;
import com.bow.backend.repository.ProjectCategoryRepository;
import com.bow.backend.model.Project;
import com.bow.backend.model.ProjectTask;
import com.bow.backend.repository.ProjectRepository;
import com.bow.backend.repository.ProjectTaskRepository;
import com.bow.backend.model.ProjectRegion;
import com.bow.backend.repository.ProjectRegionRepository;
import com.bow.backend.service.PasswordService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepo;
    private final UserRepository userRepo;
    private final ProjectCategoryRepository categoryRepo;
    private final ProjectRepository projectRepo;
    private final ProjectTaskRepository taskRepo;
    private final PasswordService passwordService;
    private final ProjectRegionRepository regionRepo;
    private final String bootstrapAdminUsername;
    private final String bootstrapAdminPassword;

    public DataInitializer(RoleRepository roleRepo, UserRepository userRepo,
                           ProjectCategoryRepository categoryRepo, ProjectRepository projectRepo,
                           ProjectTaskRepository taskRepo, PasswordService passwordService,
                           ProjectRegionRepository regionRepo,
                           @Value("${app.bootstrap-admin.username:}") String bootstrapAdminUsername,
                           @Value("${app.bootstrap-admin.password:}") String bootstrapAdminPassword) {
        this.roleRepo = roleRepo;
        this.userRepo = userRepo;
        this.categoryRepo = categoryRepo;
        this.projectRepo = projectRepo;
        this.taskRepo = taskRepo;
        this.passwordService = passwordService;
        this.regionRepo = regionRepo;
        this.bootstrapAdminUsername = bootstrapAdminUsername.trim();
        this.bootstrapAdminPassword = bootstrapAdminPassword;
    }

    @Override
    public void run(String... args) throws Exception {
        String[] defaultCategories = {
                "MiXX", "Акции", "Акции для клиентов", "Акции для продаж", "Внутренние проекты",
                "Изменения в роуминге и МГ", "Конвергент", "Пилот",
                "Продукты частных клиентов и общего влияния", "Процессы", "Флайт"
        };
        if (categoryRepo.count() == 0) {
            for (String category : defaultCategories) {
                categoryRepo.save(new ProjectCategory(category));
            }
        }
        if (regionRepo.count() == 0) {
            for (String region : defaultRegions()) regionRepo.save(new ProjectRegion(region));
        }
        roleRepo.findByName("Guest").orElseGet(() -> roleRepo.save(new Role("Guest")));
        Role adminRole = roleRepo.findByName("Boss").orElseGet(() -> roleRepo.save(new Role("Boss")));
        roleRepo.findByName("Kotik").orElseGet(() -> roleRepo.save(new Role("Kotik")));
        if (bootstrapAdminUsername.isBlank() != bootstrapAdminPassword.isBlank()) {
            throw new IllegalStateException("Set both BOOTSTRAP_ADMIN_USERNAME and BOOTSTRAP_ADMIN_PASSWORD, or leave both empty");
        }
        if (!bootstrapAdminUsername.isBlank()) {
            if (bootstrapAdminPassword.length() < 12
                    || !passwordService.isAcceptableRawPassword(bootstrapAdminPassword)) {
                throw new IllegalStateException("Bootstrap admin password must be at least 12 characters and at most 72 UTF-8 bytes");
            }
            if (userRepo.findByUsername(bootstrapAdminUsername).isEmpty()) {
                userRepo.save(new User(bootstrapAdminUsername, passwordService.encode(bootstrapAdminPassword), adminRole));
            }
        }
        userRepo.findAll().stream()
                .filter(user -> !passwordService.isEncoded(user.getPassword()))
                .forEach(user -> {
                    user.setPassword(passwordService.encode(user.getPassword()));
                    userRepo.save(user);
                });
        for (Project project : projectRepo.findAll()) {
            project.normalizeLegacyDefaults();
            if (project.getStatus() != null) {
                project.setStatus(switch (project.getStatus()) {
                    case "New" -> "Новый";
                    case "InProgress" -> "В работе";
                    case "Done" -> "Выполнено";
                    case "Cancelled" -> "Отменено";
                    case "Frozen" -> "Hold";
                    default -> project.getStatus();
                });
            }
            if (project.getCurators().isEmpty() && project.getOwner() != null && !project.getOwner().isBlank()) {
                project.setCurators(java.util.Set.of(project.getOwner()));
            }
            if (project.getGraphTransferMode() == null || project.getGraphTransferMode().isBlank()) {
                project.setGraphTransferMode("Не передавать");
            }
            Project saved = projectRepo.save(project);
            for (String curator : saved.getCurators()) {
                if (taskRepo.findByProjectIdAndUsername(saved.getId(), curator).isEmpty()) {
                    taskRepo.save(new ProjectTask(saved, curator));
                }
            }

        }
    }

    private String[] defaultRegions() {
        return new String[] {
                "Адыгея", "Алтай", "Алтайский край", "Амурская область", "Архангельская область", "Астраханская область",
                "Башкортостан", "Белгородская область", "Брянская область", "Бурятия", "Владимирская область",
                "Волгоградская область", "Вологодская область", "Воронежская область", "Дагестан", "Еврейская АО",
                "Забайкальский край", "Ивановская область", "Ингушетия", "Иркутская область", "Кабардино-Балкария",
                "Калининградская область", "Калмыкия", "Калужская область", "Камчатский край", "Карачаево-Черкесия",
                "Карелия", "Кемеровская область", "Кировская область", "Коми", "Костромская область", "Краснодарский край",
                "Красноярский край", "Крым", "Курганская область", "Курская область", "Ленинградская область", "Липецкая область",
                "Магаданская область", "Марий Эл", "Мордовия", "Москва", "Московская область", "Мурманская область",
                "Ненецкий АО", "Нижегородская область", "Новгородская область", "Новосибирская область", "Омская область",
                "Оренбургская область", "Орловская область", "Пензенская область", "Пермский край", "Приморский край",
                "Псковская область", "Ростовская область", "Рязанская область", "Самарская область", "Санкт-Петербург",
                "Саратовская область", "Саха (Якутия)", "Сахалинская область", "Свердловская область", "Севастополь",
                "Северная Осетия — Алания", "Смоленская область", "Ставропольский край", "Тамбовская область",
                "Татарстан", "Тверская область", "Томская область", "Тульская область", "Тыва", "Тюменская область",
                "Удмуртия", "Ульяновская область", "Хабаровский край", "Хакасия", "Ханты-Мансийский АО", "Челябинская область",
                "Чечня", "Чувашия", "Чукотский АО", "Ямало-Ненецкий АО", "Ярославская область",
                "Донецкая область", "Луганская область", "Запорожская область", "Херсонская область"
        };
    }
}
