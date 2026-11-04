package com.bow.backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_tasks", uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "username"}))
public class ProjectTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(nullable = false)
    private String username;

    private boolean completed;
    private LocalDateTime completedAt;
    private String substituteUsername;
    private LocalDate transferUntil;

    public ProjectTask() {}

    public ProjectTask(Project project, String username) {
        this.project = project;
        this.username = username;
    }

    public Long getId() { return id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) {
        this.completed = completed;
        this.completedAt = completed ? LocalDateTime.now() : null;
    }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public String getSubstituteUsername() { return substituteUsername; }
    public LocalDate getTransferUntil() { return transferUntil; }
    public void transferTo(String username, LocalDate until) {
        this.substituteUsername = username;
        this.transferUntil = until;
    }
}
