package com.workforce.backend.repository;

import com.workforce.backend.model.EmployeeSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmployeeSessionRepository extends JpaRepository<EmployeeSession, Long> {
    List<EmployeeSession> findBySessionId(Long sessionId);
    List<EmployeeSession> findByEmployeeId(Long employeeId);
}
