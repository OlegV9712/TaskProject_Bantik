package com.bow.backend.repository;

import com.bow.backend.model.ProjectTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectTaskRepository extends JpaRepository<ProjectTask, Long> {
    List<ProjectTask> findByUsernameOrderByIdDesc(String username);
    List<ProjectTask> findByProjectId(Long projectId);
    Optional<ProjectTask> findByProjectIdAndUsername(Long projectId, String username);
}
