package com.workforce.backend.config;

import com.workforce.backend.repository.EmployeeSkillRepository;
import com.workforce.backend.repository.SectionRepository;
import com.workforce.backend.repository.SectionSkillRepository;
import com.workforce.backend.repository.SkillRepository;
import com.workforce.backend.repository.SessionRepository;
import com.workforce.backend.repository.EmployeeSessionRepository;
import com.workforce.backend.repository.AttendanceRepository;
import com.workforce.backend.repository.TaskRepository;
import com.workforce.backend.repository.OrderRepository;
import com.workforce.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataCleaner implements CommandLineRunner {

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private SectionRepository sectionRepository;

    @Autowired
    private SectionSkillRepository sectionSkillRepository;

    @Autowired
    private EmployeeSkillRepository employeeSkillRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private EmployeeSessionRepository employeeSessionRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        /*
        System.out.println(">>> TARGETED DATA WIPE INITIATED <<<");
        
        // 1. Clear transactional data
        attendanceRepository.deleteAll();
        taskRepository.deleteAll();
        orderRepository.deleteAll();
        
        // 2. Clear employee-specific mappings
        employeeSkillRepository.deleteAll();
        employeeSessionRepository.deleteAll();
        
        // 3. Clear employee accounts (Preserve Admin/Supervisor)
        userRepository.deleteByRole("employee");
        
        System.out.println(">>> EMPLOYEE DATABASE CLEARED | CONFIGURATION PRESERVED <<<");
        System.out.println("IMPORTANT: Remove this logic from DataCleaner.java after restart to prevent future wipes.");
        */
        System.out.println(">>> DATA PERSISTENCE ACTIVE - NO WIPE PERFORMED <<<");
    }
}
