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
    public org.springframework.http.ResponseEntity<?> addEmployee(@RequestBody User user) {
        try {
            if (user.getUsername() == null || user.getUsername().isEmpty()) {
                return org.springframework.http.ResponseEntity.badRequest()
                        .body(java.util.Map.of("message", "Username is required"));
            }
            List<User> existingUsers = userRepository.findByUsername(user.getUsername());
            if (!existingUsers.isEmpty()) {
                return org.springframework.http.ResponseEntity.badRequest()
                        .body(java.util.Map.of("message", "Username '" + user.getUsername() + "' already exists"));
            }
            if (user.getRole() == null || user.getRole().isEmpty()) {
                user.setRole("employee");
            }
            if (user.getDepartment() == null) {
                user.setDepartment(""); // Fallback for database NOT NULL constraints
            }
            System.out.println("Attempting to save user: " + user.getUsername());
            User savedUser = userRepository.save(user);
            return org.springframework.http.ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            System.err.println("Error saving employee: " + e.getMessage());
            e.printStackTrace();
            return org.springframework.http.ResponseEntity.internalServerError()
                    .body(java.util.Map.of("message", "Database error: " + e.getMessage()));
        }
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
            @RequestParam("taskId") Long taskId,
            @RequestParam("employees") String employees) {

        Task task = taskRepository.findById(taskId).orElse(null);

        if (task != null) {
            String currentAssigned = task.getAssignedEmployees();
            if (currentAssigned == null || currentAssigned.trim().isEmpty()) {
                task.setAssignedEmployees(employees);
            } else {
                // split, add, convert back to maintain unique
                java.util.Set<String> assignedSet = new java.util.LinkedHashSet<>(
                        java.util.Arrays.asList(currentAssigned.split(", ")));
                String[] newAssigns = employees.split(", ");
                for (String s : newAssigns) {
                    assignedSet.add(s.trim());
                }
                task.setAssignedEmployees(String.join(", ", assignedSet));
            }
            return taskRepository.save(task);
        }

        return null;
    }

    @PostMapping("/unassignEmployee")
    public Task unassignEmployee(
            @RequestParam("taskId") Long taskId,
            @RequestParam("employee") String employee) {

        Task task = taskRepository.findById(taskId).orElse(null);

        if (task != null && task.getAssignedEmployees() != null) {
            String[] currentAssigned = task.getAssignedEmployees().split(", ");
            java.util.List<String> updatedList = new java.util.ArrayList<>();

            for (String emp : currentAssigned) {
                if (!emp.trim().equals(employee.trim())) {
                    updatedList.add(emp.trim());
                }
            }

            if (updatedList.isEmpty()) {
                task.setAssignedEmployees(""); // Or null, depending on preference
            } else {
                task.setAssignedEmployees(String.join(", ", updatedList));
            }
            return taskRepository.save(task);
        }

        return null;
    }

    @PostMapping("/updateTaskStatus")
    public Task updateTaskStatus(@RequestParam Long taskId, @RequestParam String status) {

        Task task = taskRepository.findById(taskId).orElse(null);

        if (task != null) {

            task.setStatus(status);

            if (status.equalsIgnoreCase("Completed")) {
                task.setCompletedDate(LocalDate.now());
            }

            return taskRepository.save(task);
        }

        return null;
    }

    @GetMapping("/tasksByEmployee")
    public List<Task> getTasksByEmployee(@RequestParam("employeeName") String employeeName) {
        List<Task> potentialMatches = taskRepository.findByAssignedEmployeesContaining(employeeName);
        List<Task> exactMatches = new java.util.ArrayList<>();

        if (potentialMatches != null) {
            for (Task t : potentialMatches) {
                if (t.getAssignedEmployees() != null) {
                    String[] emps = t.getAssignedEmployees().split(",");
                    for (String e : emps) {
                        if (e.trim().equalsIgnoreCase(employeeName.trim())) {
                            exactMatches.add(t);
                            break;
                        }
                    }
                }
            }
        }
        return exactMatches;
    }

    @PostMapping("/deleteTask")
    public void deleteTask(@RequestParam("taskId") Long taskId) {
        if (taskRepository.existsById(taskId)) {
            taskRepository.deleteById(taskId);
        }
    }

    @GetMapping("/employeeProfile")
    public User getEmployeeProfile(@RequestParam String username) {
        List<User> users = userRepository.findByUsername(username);
        return users.isEmpty() ? null : users.get(0);
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

    // =========================
    // ATTENDANCE CALENDAR API
    // =========================
    @GetMapping("/attendanceSummaryByMonth")
    public Map<String, Object> getAttendanceSummaryByMonth(
            @RequestParam("year") int year,
            @RequestParam("month") int month) {

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        List<Attendance> records = attendanceRepository.findByDateBetween(startDate, endDate);

        // Group by date
        Map<String, Map<String, Object>> dailySummary = new HashMap<>();

        for (Attendance a : records) {
            String dateKey = a.getDate().toString(); // YYYY-MM-DD
            dailySummary.putIfAbsent(dateKey, new HashMap<>());
            Map<String, Object> dayStat = dailySummary.get(dateKey);

            dayStat.putIfAbsent("present", 0);
            dayStat.putIfAbsent("absent", 0);
            dayStat.putIfAbsent("presentNames", new java.util.ArrayList<String>());
            dayStat.putIfAbsent("absentNames", new java.util.ArrayList<String>());

            if ("Present".equalsIgnoreCase(a.getStatus())) {
                dayStat.put("present", (int) dayStat.get("present") + 1);
                ((java.util.List<String>) dayStat.get("presentNames")).add(a.getEmployeeName());
            } else if ("Absent".equalsIgnoreCase(a.getStatus())) {
                dayStat.put("absent", (int) dayStat.get("absent") + 1);
                ((java.util.List<String>) dayStat.get("absentNames")).add(a.getEmployeeName());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("summary", dailySummary);
        return result;
    }

    // ===================================
    // EMPLOYEE DAILY PROGRESS API
    // ===================================
    @GetMapping("/employeeAttendanceRecords")
    public List<Attendance> getEmployeeAttendanceRecords(@RequestParam String username) {
        return attendanceRepository.findByEmployeeName(username);
    }

}