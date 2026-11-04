package com.bow.backend.config;

import com.bow.backend.model.Project;
import com.bow.backend.model.ProjectTask;
import com.bow.backend.model.User;
import com.bow.backend.repository.ProjectRepository;
import com.bow.backend.repository.ProjectTaskRepository;
import com.bow.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDate;
import java.util.Optional;

@Component
public class AccessControlInterceptor implements HandlerInterceptor {
    public static final String USERNAME_ATTRIBUTE = "authenticatedUsername";
    public static final String ROLE_ATTRIBUTE = "authenticatedRole";

    private final UserRepository users;
    private final ProjectRepository projects;
    private final ProjectTaskRepository tasks;
    private final String frontendOrigin;

    public AccessControlInterceptor(UserRepository users, ProjectRepository projects, ProjectTaskRepository tasks,
                                    @Value("${app.frontend-origin:http://localhost:5173}") String frontendOrigin) {
        this.users = users;
        this.projects = projects;
        this.tasks = tasks;
        this.frontendOrigin = frontendOrigin;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        String path = request.getRequestURI();
        response.setHeader("Cache-Control", "no-store");
        String method = request.getMethod();
        if (!"GET".equals(method) && !"HEAD".equals(method)) {
            String origin = request.getHeader("Origin");
            if (!frontendOrigin.equals(origin)) return forbidden(response);
        }
        if ("/api/auth/login".equals(path)) return true;

        HttpSession session = request.getSession(false);
        String username = session == null ? null : (String) session.getAttribute("username");
        Optional<User> user = username == null ? Optional.empty() : users.findByUsername(username);
        if (user.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }
        Object sessionCredentialVersion = session.getAttribute("credentialVersion");
        if (!(sessionCredentialVersion instanceof Integer version)
                || version != user.get().getCredentialVersion()) {
            session.invalidate();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }

        String role = user.get().getRole() == null ? "" : user.get().getRole().getName();
        request.setAttribute(USERNAME_ATTRIBUTE, username);
        request.setAttribute(ROLE_ATTRIBUTE, role);
        boolean admin = "Boss".equals(role);
        if (path.startsWith("/api/admin/")) {
            boolean sharedRead = "GET".equals(method)
                    && (path.equals("/api/admin/categories") || path.equals("/api/admin/fields")
                    || path.equals("/api/admin/regions"));
            if (!admin && !sharedRead) return forbidden(response);
        }

        if (path.equals("/api/projects") && "POST".equals(method) && !admin) return forbidden(response);
        if (path.startsWith("/api/projects/") && path.endsWith("/status") && !admin) return forbidden(response);
        if (path.matches("/api/projects/\\d+/schedule") && !admin) return forbidden(response);
        if (path.equals("/api/projects/schedule/export") && !"GET".equals(method)) return forbidden(response);

        if (path.equals("/api/users/curators") && !"GET".equals(method)) return forbidden(response);

        if (path.equals("/api/projects") && "GET".equals(method)) {
            String requestedOwner = request.getParameter("mine");
            if (!admin && requestedOwner != null && !requestedOwner.equals(username)) return forbidden(response);
        }

        if (path.equals("/api/settings") && "GET".equals(method) && !admin) {
            String requestedUser = request.getParameter("username");
            if (requestedUser != null && !requestedUser.equals(username)) return forbidden(response);
        }

        if (path.matches("/api/projects/\\d+") && "PATCH".equals(method) && !admin) {
            Long projectId = pathId(path);
            if (projectId == null || !isCuratorOf(projectId, username)) return forbidden(response);
        }

        if (path.equals("/api/tasks") && "GET".equals(method)) {
            String requestedUser = request.getParameter("username");
            if (!admin && !username.equals(requestedUser)) return forbidden(response);
        }

        if (path.matches("/api/tasks/\\d+(/transfer)?") && "PATCH".equals(method) && !admin) {
            Long taskId = pathId(path);
            Optional<ProjectTask> task = taskId == null ? Optional.empty() : tasks.findById(taskId);
            if (task.isEmpty()) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                return false;
            }
            if (path.endsWith("/transfer")) {
                if (!username.equals(task.get().getUsername())) return forbidden(response);
            } else if (!username.equals(task.get().getUsername()) && !isActiveSubstitute(task.get(), username)) {
                return forbidden(response);
            }
        }
        return true;
    }

    private boolean isCuratorOf(Long projectId, String username) {
        boolean assigned = projects.findById(projectId)
                .map(project -> project.getCurators().contains(username)).orElse(false);
        return assigned || tasks.findByProjectId(projectId).stream()
                .anyMatch(task -> isActiveSubstitute(task, username));
    }

    private boolean isActiveSubstitute(ProjectTask task, String username) {
        return username.equals(task.getSubstituteUsername()) && task.getTransferUntil() != null
                && !task.getTransferUntil().isBefore(LocalDate.now());
    }

    private Long pathId(String path) {
        String[] parts = path.split("/");
        try {
            return Long.parseLong(parts[3]);
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private boolean forbidden(HttpServletResponse response) {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        return false;
    }
}
