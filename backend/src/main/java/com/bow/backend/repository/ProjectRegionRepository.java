package com.bow.backend.repository;

import com.bow.backend.model.ProjectRegion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRegionRepository extends JpaRepository<ProjectRegion, Long> {
    List<ProjectRegion> findAllByOrderByNameAsc();
}
