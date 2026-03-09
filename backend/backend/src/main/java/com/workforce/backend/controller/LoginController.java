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
import com.workforce.backend.model.User;
import com.workforce.backend.repository.AttendanceRepository;
import com.workforce.backend.repository.UserRepository;

@RestController
@CrossOrigin
@RequestMapping("/api")
public class LoginController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;


    // =========================
    // LOGIN API
    // =========================
    @PostMapping("/login")
    public User login(@RequestBody User user) {

        return userRepository.findByUsernameAndPassword(
                user.getUsername(),
                user.getPassword()
        );
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
    public List<User> getEmployees(){

        return userRepository.findByRole("employee");
    }


    // =========================
    // MARK ATTENDANCE
    // =========================
    @PostMapping("/markAttendance")
    public Attendance markAttendance(@RequestBody Attendance attendance){

        Attendance existing =
            attendanceRepository.findByEmployeeNameAndDate(
                attendance.getEmployeeName(),
                attendance.getDate()
            );

        if(existing != null){
            existing.setStatus(attendance.getStatus());
            return attendanceRepository.save(existing);
        }

        return attendanceRepository.save(attendance);
    }


    // =========================
    // TODAY ATTENDANCE
    // =========================
    @GetMapping("/todayAttendance")
    public List<Attendance> getTodayAttendance(){

        LocalDate today = LocalDate.now();

        return attendanceRepository.findByDate(today);
    }


    // =========================
    // ATTENDANCE BY SELECTED DATE
    // ⭐ VERY IMPORTANT (NEW)
    // =========================
    @GetMapping("/attendanceByDate")
    public List<Attendance> getAttendanceByDate(
            @RequestParam LocalDate date){

        return attendanceRepository.findByDate(date);
    }
@GetMapping("/employeeStats")
public Map<String, Integer> getEmployeeStats(@RequestParam String employeeName){

    List<Attendance> records = attendanceRepository.findByEmployeeName(employeeName);

    int present = 0;
    int absent = 0;

    for(Attendance a : records){
        if(a.getStatus().equalsIgnoreCase("Present")){
            present++;
        }else{
            absent++;
        }
    }

    Map<String, Integer> stats = new HashMap<>();
    stats.put("present", present);
    stats.put("absent", absent);

    return stats;
}
}