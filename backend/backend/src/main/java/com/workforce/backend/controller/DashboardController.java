package com.workforce.backend.controller;

import com.workforce.backend.model.Task;
import com.workforce.backend.model.Attendance;
import com.workforce.backend.model.User;
import com.workforce.backend.repository.TaskRepository;
import com.workforce.backend.repository.UserRepository;
import com.workforce.backend.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @GetMapping("/dashboard/summary")
    public Map<String, Object> getSummary() {
        Map<String, Object> summary = new HashMap<>();
        LocalDate today = LocalDate.now();

        List<Attendance> todayAttendance = attendanceRepository.findByDate(today);
        long activeStaff = todayAttendance.stream().filter(a -> "Present".equalsIgnoreCase(a.getStatus())).count();
        
        long totalEmployees = userRepository.findByRole("employee").size();
        long absentStaff = Math.max(0, totalEmployees - activeStaff);

        List<Task> allTasks = taskRepository.findAll();
        long totalPendingTasks = allTasks.stream().filter(t -> !"Completed".equalsIgnoreCase(t.getStatus())).count();
        long approvalsNeeded = allTasks.stream().filter(t -> "Waiting Verification".equalsIgnoreCase(t.getStatus())).count();
        long newTasks = allTasks.stream().filter(t -> t.getDate() != null && t.getDate().equals(today)).count();
        long unassigned = allTasks.stream().filter(t -> t.getAssignedEmployees() == null || t.getAssignedEmployees().isEmpty() || "Pending".equalsIgnoreCase(t.getStatus())).count();
        
        long completed = allTasks.stream().filter(t -> "Completed".equalsIgnoreCase(t.getStatus())).count();
        long shiftOutput = allTasks.size() > 0 ? (completed * 100 / allTasks.size()) : 0;

        summary.put("activeStaff", activeStaff);
        summary.put("absentStaff", absentStaff);
        summary.put("totalStaff", totalEmployees);
        summary.put("totalPendingTasks", totalPendingTasks);
        summary.put("approvalsNeeded", approvalsNeeded);
        summary.put("newTasks", newTasks);
        summary.put("unassignedTasks", unassigned);
        summary.put("shiftOutput", shiftOutput);
        return summary;
    }

    @GetMapping("/dashboard/today")
    public Map<String, Object> getTodayOverview() {
        Map<String, Object> todayMap = new HashMap<>();
        List<Task> allTasks = taskRepository.findAll();
        LocalDate now = LocalDate.now();

        long totalPendingTasks = allTasks.stream().filter(t -> !"Completed".equalsIgnoreCase(t.getStatus())).count();
        long inProgress = allTasks.stream().filter(t -> "Started".equalsIgnoreCase(t.getStatus()) || "In Progress".equalsIgnoreCase(t.getStatus())).count();
        long delayed = allTasks.stream().filter(t -> !"Completed".equalsIgnoreCase(t.getStatus()) && t.getDeadline() != null && t.getDeadline().isBefore(now)).count();
        
        long totalStaffCount = userRepository.findByRole("employee").size();
        long activeStaff = attendanceRepository.findByDate(now).stream().filter(a -> "Present".equalsIgnoreCase(a.getStatus())).count();

        todayMap.put("totalTasks", totalPendingTasks);
        todayMap.put("inProgress", inProgress);
        todayMap.put("delayed", delayed);
        todayMap.put("activeStaffCount", activeStaff);
        todayMap.put("totalStaffCount", totalStaffCount);
        return todayMap;
    }

    @GetMapping("/dashboard/team-performance")
    public Map<String, Object> getTeamPerformance() {
        Map<String, Object> perf = new HashMap<>();
        List<Task> allTasks = taskRepository.findAll();
        long total = allTasks.size();
        long completed = allTasks.stream().filter(t -> "Completed".equalsIgnoreCase(t.getStatus())).count();
        
        int completionRate = total > 0 ? (int)(completed * 100 / total) : 0;
        
        long totalEmps = userRepository.findAll().stream().filter(u -> "Employee".equalsIgnoreCase(u.getRole())).count();
        long presentToday = attendanceRepository.findByDate(LocalDate.now()).stream().filter(a -> "Present".equalsIgnoreCase(a.getStatus())).count();
        int attendanceRate = totalEmps > 0 ? (int)(presentToday * 100 / totalEmps) : 0;

        // Efficiency: On-time completions / Total completions
        long onTime = allTasks.stream()
            .filter(t -> "Completed".equalsIgnoreCase(t.getStatus()))
            .filter(t -> t.getDeadline() == null || t.getCompletedDate() == null || !t.getCompletedDate().isAfter(t.getDeadline()))
            .count();
        int efficiency = completed > 0 ? (int)(onTime * 100 / completed) : 0;

        perf.put("completionRate", completionRate);
        perf.put("attendanceRate", attendanceRate);
        perf.put("efficiencyRate", efficiency);
        return perf;
    }

    @GetMapping("/tasks/status-count")
    public Map<String, Long> getStatusCount() {
        List<Task> tasks = taskRepository.findAll();
        Map<String, Long> counts = new HashMap<>();
        counts.put("Completed", tasks.stream().filter(t -> "Completed".equalsIgnoreCase(t.getStatus())).count());
        counts.put("Pending", tasks.stream().filter(t -> "Pending".equalsIgnoreCase(t.getStatus())).count());
        counts.put("InProgress", tasks.stream().filter(t -> "In Progress".equalsIgnoreCase(t.getStatus()) || "Started".equalsIgnoreCase(t.getStatus())).count());
        return counts;
    }

    @GetMapping("/sections/performance")
    public List<Map<String, Object>> getSectionsPerformance() {
        List<String> sections = Arrays.asList("Yarn Preparation", "Knitting", "Packaging", "Dispatch");
        List<Task> allTasks = taskRepository.findAll();
        LocalDate now = LocalDate.now();
        List<Map<String, Object>> response = new ArrayList<>();

        for (String section : sections) {
            List<Task> secTasks = allTasks.stream().filter(t -> section.equalsIgnoreCase(t.getSection())).collect(Collectors.toList());
            long total = secTasks.size();
            long completed = secTasks.stream().filter(t -> "Completed".equalsIgnoreCase(t.getStatus())).count();
            long pending = secTasks.stream().filter(t -> !"Completed".equalsIgnoreCase(t.getStatus())).count();
            long delayed = secTasks.stream().filter(t -> !"Completed".equalsIgnoreCase(t.getStatus()) && t.getDeadline() != null && t.getDeadline().isBefore(now)).count();
            
            int output = total > 0 ? (int)(completed * 100 / total) : 0;

            Map<String, Object> map = new HashMap<>();
            map.put("section", section);
            map.put("output", output);
            map.put("total", total);
            map.put("completed", completed);
            map.put("pending", pending);
            map.put("delayed", delayed);
            response.add(map);
        }
        return response;
    }

    @GetMapping("/dashboard/alerts")
    public List<Map<String, String>> getAlerts() {
        List<Map<String, String>> alerts = new ArrayList<>();
        LocalDate now = LocalDate.now();
        List<Task> allTasks = taskRepository.findAll();

        // 1. Overdue Tasks (Detailed)
        List<Task> overdue = allTasks.stream()
            .filter(t -> !"Completed".equalsIgnoreCase(t.getStatus()))
            .filter(t -> t.getDeadline() != null && t.getDeadline().isBefore(now))
            .limit(3)
            .collect(Collectors.toList());

        for (Task t : overdue) {
            Map<String, String> alert = new HashMap<>();
            alert.put("type", "Critical");
            alert.put("icon", "fa-circle");
            alert.put("color", "#ef4444"); // Red 🔴
            String emp = (t.getAssignedEmployees() != null && !t.getAssignedEmployees().isEmpty()) ? t.getAssignedEmployees() : "Unassigned";
            alert.put("title", "🔴 Task overdue → " + t.getSection() + " (" + emp + ")");
            alert.put("text", t.getTaskName());
            alerts.add(alert);
        }

        // 2. Due Today (Detailed)
        List<Task> dueToday = allTasks.stream()
            .filter(t -> !"Completed".equalsIgnoreCase(t.getStatus()))
            .filter(t -> t.getDeadline() != null && t.getDeadline().equals(now))
            .limit(2)
            .collect(Collectors.toList());

        for (Task t : dueToday) {
            Map<String, String> alert = new HashMap<>();
            alert.put("type", "Warning");
            alert.put("icon", "fa-circle");
            alert.put("color", "#f59e0b"); // Yellow/Orange 🟡
            String emp = (t.getAssignedEmployees() != null && !t.getAssignedEmployees().isEmpty()) ? t.getAssignedEmployees() : "Unassigned";
            alert.put("title", "🟡 Task due today → " + t.getSection() + " (" + emp + ")");
            alert.put("text", t.getTaskName());
            alerts.add(alert);
        }

        return alerts;
    }
}
