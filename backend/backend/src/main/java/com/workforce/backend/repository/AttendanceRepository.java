package com.workforce.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.workforce.backend.model.Attendance;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Attendance findByEmployeeNameAndDate(String employeeName, LocalDate date);

    List<Attendance> findByDate(LocalDate date);

    List<Attendance> findByEmployeeName(String employeeName);
}