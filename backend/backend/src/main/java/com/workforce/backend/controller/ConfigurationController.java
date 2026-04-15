package com.workforce.backend.controller;

import com.workforce.backend.model.*;
import com.workforce.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class ConfigurationController {

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private SectionRepository sectionRepository;

    @Autowired
    private SectionSkillRepository sectionSkillRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private EmployeeSessionRepository employeeSessionRepository;
    
    @Autowired
    private EmployeeSkillRepository employeeSkillRepository;

    // SKILL MANAGEMENT
    @PostMapping("/skills")
    public ResponseEntity<?> createSkill(@RequestBody Skill skill) {
        if (!skillRepository.findByName(skill.getName()).isEmpty()) {
            return ResponseEntity.badRequest().body("Skill already exists");
        }
        return ResponseEntity.ok(skillRepository.save(skill));
    }

    @GetMapping("/skills")
    public List<Skill> getAllSkills() {
        return skillRepository.findAll();
    }

    @DeleteMapping("/skills/{id}")
    public ResponseEntity<?> deleteSkill(@PathVariable Long id) {
        sectionSkillRepository.deleteBySkillId(id);
        skillRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // SECTION MANAGEMENT
    @PostMapping("/sections")
    public ResponseEntity<?> createSection(@RequestBody Section section) {
        if (!sectionRepository.findByName(section.getName()).isEmpty()) {
            return ResponseEntity.badRequest().body("Section already exists");
        }
        return ResponseEntity.ok(sectionRepository.save(section));
    }

    @GetMapping("/sections")
    public List<Section> getAllSections() {
        return sectionRepository.findAll();
    }

    @DeleteMapping("/sections/{id}")
    public ResponseEntity<?> deleteSection(@PathVariable Long id) {
        sectionSkillRepository.deleteBySectionId(id);
        sectionRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // SECTION-SKILL MAPPING
    @PostMapping("/section-skill-map")
    public SectionSkillMap mapSkillToSection(@RequestBody SectionSkillMap request) {
        return sectionSkillRepository.save(request);
    }

    @GetMapping("/sections/{id}/skills")
    public List<Skill> getSkillsBySection(@PathVariable Long id) {
        List<SectionSkillMap> mappings = sectionSkillRepository.findBySectionId(id);
        List<Long> skillIds = mappings.stream().map(SectionSkillMap::getSkillId).collect(Collectors.toList());
        return skillRepository.findAllById(skillIds);
    }

    @DeleteMapping("/section-skill-map/{sectionId}/{skillId}")
    public ResponseEntity<?> deleteSectionSkillMapping(@PathVariable Long sectionId, @PathVariable Long skillId) {
        sectionSkillRepository.deleteBySectionIdAndSkillId(sectionId, skillId);
        return ResponseEntity.ok().build();
    }

    // SESSION MANAGEMENT
    @PostMapping("/sessions")
    public ResponseEntity<?> createSession(@RequestBody Session session) {
        if (!sessionRepository.findByName(session.getName()).isEmpty()) {
            return ResponseEntity.badRequest().body("Session name already exists");
        }
        return ResponseEntity.ok(sessionRepository.save(session));
    }

    @GetMapping("/sessions")
    public List<Session> getAllSessions() {
        return sessionRepository.findAll();
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<?> deleteSession(@PathVariable Long id) {
        sessionRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // EMPLOYEE SESSIONS
    @PostMapping("/employee-sessions")
    public EmployeeSession assignEmployeeToSession(@RequestBody EmployeeSession es) {
        return employeeSessionRepository.save(es);
    }

    @GetMapping("/employee-sessions")
    public List<EmployeeSession> getAllEmployeeSessions() {
        return employeeSessionRepository.findAll();
    }

    @DeleteMapping("/employee-sessions/{id}")
    public ResponseEntity<?> deleteEmployeeSession(@PathVariable Long id) {
        employeeSessionRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
