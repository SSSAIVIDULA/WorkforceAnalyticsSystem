package com.workforce.backend.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.workforce.backend.model.Attendance;
import com.workforce.backend.model.Task;
import com.workforce.backend.model.User;
import com.workforce.backend.repository.AttendanceRepository;
import com.workforce.backend.repository.TaskRepository;
import com.workforce.backend.repository.UserRepository;

@RestController
@CrossOrigin
@RequestMapping("/api")
public class LoginController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private TaskRepository taskRepository;

    // =========================
    // LOGIN API
    // =========================
    @PostMapping("/login")
    public User login(@RequestBody User user) {

        return userRepository.findByUsernameAndPassword(
                user.getUsername(),
                user.getPassword());
    }

    // =========================
    // ADD EMPLOYEE
    // =========================
    @PostMapping("/addEmployee")
    public User addEmployee(@RequestBody User user) {

        user.setRole("employee");

        return userRepository.save(user);
    }

    // =========================
    // GET EMPLOYEES
    // =========================
    @GetMapping("/employees")
    public List<User> getEmployees() {

        return userRepository.findByRole("employee");
    }

    // =========================
    // MARK ATTENDANCE
    // =========================
    @PostMapping("/markAttendance")
    public Attendance markAttendance(@RequestBody Attendance attendance) {

        Attendance existing = attendanceRepository.findByEmployeeNameAndDate(
                attendance.getEmployeeName(),
                attendance.getDate());

        if (existing != null) {
            existing.setStatus(attendance.getStatus());
            return attendanceRepository.save(existing);
        }

        return attendanceRepository.save(attendance);
    }

    // =========================
    // TODAY ATTENDANCE
    // =========================
    @GetMapping("/todayAttendance")
    public List<Attendance> getTodayAttendance() {

        LocalDate today = LocalDate.now();

        return attendanceRepository.findByDate(today);
    }

    // =========================
    // ATTENDANCE BY SELECTED DATE
    // ⭐ VERY IMPORTANT (NEW)
    // =========================
    @GetMapping("/attendanceByDate")
    public List<Attendance> getAttendanceByDate(
            @RequestParam("date") LocalDate date) {

        return attendanceRepository.findByDate(date);
    }

    @GetMapping("/employeeStats")
    public Map<String, Integer> getEmployeeStats(@RequestParam String employeeName) {

        List<Attendance> records = attendanceRepository.findByEmployeeName(employeeName);

        int present = 0;
        int absent = 0;

        for (Attendance a : records) {
            if (a.getStatus().equalsIgnoreCase("Present")) {
                present++;
            } else {
                absent++;
            }
        }

        Map<String, Integer> stats = new HashMap<>();
        stats.put("present", present);
        stats.put("absent", absent);

        return stats;
    }

    @GetMapping("/employeesBySkill")
    public List<User> getEmployeesBySkill(@RequestParam("skill") String skill) {

        if (skill == null || skill.trim().isEmpty()) {
            return List.of();
        }

        List<User> employees = userRepository.findByRole("employee");
        java.util.Set<User> matched = new java.util.LinkedHashSet<>();

        String[] requiredSkills = skill.toLowerCase().split(",");

        for (User user : employees) {

            if (user.getSkill() == null)
                continue;

            String[] userSkills = user.getSkill().toLowerCase().split(",");

            for (String req : requiredSkills) {

                for (String s : userSkills) {

                    if (s.trim().equals(req.trim())) {
                        matched.add(user);
                        break;
                    }
                }
            }
        }

        return new java.util.ArrayList<>(matched);
    }

    @PostMapping("/createTask")
    public Task createTask(@RequestBody Task task) {
        if (task.getDate() == null) {
            task.setDate(LocalDate.now());
        }
        task.setStatus("Pending");
        return taskRepository.save(task);
    }

    @GetMapping("/tasksByDate")
    public List<Task> getTasksByDate(@RequestParam("date") LocalDate date) {
        return taskRepository.findByDate(date);
    }

    @PostMapping("/assignEmployees")
    public Task assignEmployees(
            @RequestParam Long taskId,
            @RequestParam String employees) {

        Task task = taskRepository.findById(taskId).orElse(null);

        if (task != null) {
            task.setAssignedEmployees(employees);
            return taskRepository.save(task);
        }

        return null;
    }

    @PostMapping("/updateTaskStatus")
    public Task updateTaskStatus(@RequestParam Long taskId, @RequestParam String status) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task != null) {
            task.setStatus(status);
            return taskRepository.save(task);
        }
        return null;
    }

    @GetMapping("/tasksByEmployee")
    public List<Task> getTasksByEmployee(@RequestParam String employeeName) {
        return taskRepository.findByAssignedEmployeesContaining(employeeName);
    }

    // =========================
    // MANAGER ANALYTICS API
    // =========================
    @GetMapping("/managerAnalytics")
    public Map<String, Object> getManagerAnalytics() {
        Map<String, Object> stats = new HashMap<>();

        LocalDate today = LocalDate.now();
        List<Task> allTasks = taskRepository.findAll();
        long totalTasks = allTasks.size();
        long completedTasks = allTasks.stream().filter(t -> "Completed".equalsIgnoreCase(t.getStatus())).count();
        long pendingTasks = allTasks.stream().filter(t -> "Pending".equalsIgnoreCase(t.getStatus())).count();

        stats.put("totalTasks", totalTasks);
        stats.put("completedTasks", completedTasks);
        stats.put("pendingTasks", pendingTasks);

        // Calculate most demanded skills
        Map<String, Integer> skillsDemand = new HashMap<>();
        for (Task t : allTasks) {
            String skill = t.getRequiredSkill();
            if (skill != null) {
                String[] skills = skill.split(",");
                for (String s : skills) {
                    s = s.trim();
                    skillsDemand.put(s, skillsDemand.getOrDefault(s, 0) + 1);
                }
            }
        }
        stats.put("skillsDemand", skillsDemand);

        List<Attendance> todayAttendance = attendanceRepository.findByDate(today);
        long present = todayAttendance.stream().filter(a -> "Present".equalsIgnoreCase(a.getStatus())).count();
        long absent = todayAttendance.stream().filter(a -> "Absent".equalsIgnoreCase(a.getStatus())).count();

        stats.put("presentEmployees", present);
        stats.put("absentEmployees", absent);

        return stats;
    }

}