package com.workforce.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.workforce.backend.model.User;

public interface UserRepository extends JpaRepository<User, Long> {

    // LOGIN
    User findByUsernameAndPassword(String username, String password);

    User findByUsername(String username);

    // GET ALL EMPLOYEES (for attendance list)
    List<User> findByRole(String role);

    // GET EMPLOYEES BY SKILL (for task assignment)
    List<User> findByRoleAndSkillContaining(String role, String skill);
}