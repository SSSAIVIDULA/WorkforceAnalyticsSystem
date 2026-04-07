package com.workforce.backend.repository;

import com.workforce.backend.model.EmployeeSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import jakarta.transaction.Transactional;

@Repository
public interface EmployeeSkillRepository extends JpaRepository<EmployeeSkill, Long> {
    List<EmployeeSkill> findByEmployeeId(Long employeeId);
    List<EmployeeSkill> findBySkillId(Long skillId);
    
    @Transactional
    void deleteByEmployeeId(Long employeeId);
}
