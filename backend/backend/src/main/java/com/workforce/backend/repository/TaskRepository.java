package com.workforce.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.workforce.backend.model.Task;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByDate(LocalDate date);

    List<Task> findByAssignedEmployeesContaining(String assignedEmployees);
}
