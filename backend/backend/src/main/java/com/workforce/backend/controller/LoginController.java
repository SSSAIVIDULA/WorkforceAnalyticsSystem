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
import com.workforce.backend.model.Order;
import com.workforce.backend.model.Task;
import com.workforce.backend.model.User;
import com.workforce.backend.repository.AttendanceRepository;
import com.workforce.backend.repository.OrderRepository;
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

    @Autowired
    private OrderRepository orderRepository;

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
    public Map<String, Integer> getEmployeeStats(@RequestParam("employeeName") String employeeName) {

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
    public List<User> getEmployeesBySkill(
            @RequestParam("skill") String skill,
            @RequestParam(value = "date", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate date) {

        if (skill == null || skill.trim().isEmpty()) {
            return List.of();
        }

        List<User> employees = userRepository.findByRole("employee");

        // Filter by attendance if date is provided
        if (date != null) {
            List<Attendance> attendanceRecords = attendanceRepository.findByDate(date);
            java.util.Set<String> presentUsernames = new java.util.HashSet<>();
            for (Attendance a : attendanceRecords) {
                if ("Present".equalsIgnoreCase(a.getStatus())) {
                    presentUsernames.add(a.getEmployeeName());
                }
            }
            employees = employees.stream()
                    .filter(e -> presentUsernames.contains(e.getUsername()))
                    .collect(java.util.stream.Collectors.toList());
        }

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

    @PostMapping("/updateTaskSkills")
    public Task updateTaskSkills(@RequestParam("taskId") Long taskId, @RequestParam("skill") String skill) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task != null) {
            task.setRequiredSkill(skill);
            return taskRepository.save(task);
        }
        return null;
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
    public Task updateTaskStatus(@RequestParam("taskId") Long taskId, @RequestParam("status") String status) {

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
    public User getEmployeeProfile(@RequestParam("username") String username) {
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
    public List<Attendance> getEmployeeAttendanceRecords(@RequestParam("username") String username) {
        return attendanceRepository.findByEmployeeName(username);
    }

    // ===================================
    // ORDER MANAGEMENT APIs
    // ===================================

    @PostMapping("/placeOrder")
    public Order placeOrder(@RequestBody Order order) {
        if (order.getCreatedAt() == null) {
            order.setCreatedAt(LocalDate.now());
        }
        // Generate a simple Order ID if not provided
        if (order.getOrderId() == null || order.getOrderId().isEmpty()) {
            order.setOrderId("ORD-" + System.currentTimeMillis() % 10000);
        }
        order.setStatus("Pending");
        return orderRepository.save(order);
    }

    @GetMapping("/orders")
    public List<Order> getOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/ordersByStatus")
    public List<Order> getOrdersByStatus(@RequestParam("status") String status) {
        return orderRepository.findByStatus(status);
    }

    @PostMapping("/updateOrderStatus")
    public Order updateOrderStatus(@RequestParam("orderId") Long id, @RequestParam("status") String status) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order != null) {
            order.setStatus(status);
            return orderRepository.save(order);
        }
        return null;
    }

    @GetMapping("/orderByCode")
    public Order getOrderByCode(@RequestParam("orderId") String orderId) {
        return orderRepository.findByOrderId(orderId).orElse(null);
    }

    @PostMapping("/rejectOrder")
    public Order rejectOrder(@RequestParam("orderId") Long id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order != null) {
            order.setStatus("Cancelled");
            return orderRepository.save(order);
        }
        return null;
    }

    @PostMapping("/convertOrderToTask")
    public Task convertOrderToTask(@RequestParam("orderId") Long orderId, @RequestBody Task task) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            // Mark order as In Progress
            order.setStatus("In Progress");
            orderRepository.save(order);

            // Link task to order
            task.setOrderId(orderId);
            if (task.getDate() == null) {
                task.setDate(LocalDate.now());
            }
            if (task.getStatus() == null) {
                task.setStatus("Pending");
            }
            return taskRepository.save(task);
        }
        return null;
    }

    @GetMapping("/orderAnalytics")
    public Map<String, Object> getOrderAnalytics() {
        Map<String, Object> stats = new HashMap<>();
        List<Order> allOrders = orderRepository.findAll();

        long total = allOrders.size();
        long pending = allOrders.stream().filter(o -> "Pending".equalsIgnoreCase(o.getStatus())).count();
        long inProgress = allOrders.stream().filter(o -> "In Progress".equalsIgnoreCase(o.getStatus())).count();
        long completed = allOrders.stream().filter(o -> "Completed".equalsIgnoreCase(o.getStatus())).count();
        long cancelled = allOrders.stream().filter(o -> "Cancelled".equalsIgnoreCase(o.getStatus())).count();

        stats.put("totalOrders", total);
        stats.put("pendingOrders", pending);
        stats.put("inProgressOrders", inProgress);
        stats.put("completedOrders", completed);
        stats.put("cancelledOrders", cancelled);
        stats.put("recentOrders", allOrders.stream().limit(10).collect(java.util.stream.Collectors.toList()));

        return stats;
    }

}