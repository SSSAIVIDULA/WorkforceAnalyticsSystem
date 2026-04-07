package com.workforce.backend.controller;

import com.workforce.backend.model.*;
import com.workforce.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@RestController
@CrossOrigin
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private SectionRepository sectionRepository;

    @Autowired
    private SectionSkillRepository sectionSkillRepository;

    @Autowired
    private EmployeeSkillRepository employeeSkillRepository;

    @Autowired
    private UserRepository userRepository;

    // --- SKILLS ---
    @GetMapping("/skills")
    public List<Skill> getAllSkills() {
        return skillRepository.findAll();
    }

    @PostMapping("/addSkill")
    public Skill addSkill(@RequestBody Skill skill) {
        return skillRepository.save(skill);
    }

    @DeleteMapping("/skills/{id}")
    public ResponseEntity<?> deleteSkill(@PathVariable Long id) {
        skillRepository.deleteById(id);
        sectionSkillRepository.deleteBySkillId(id);
        return ResponseEntity.ok().build();
    }

    // --- SECTIONS ---
    @GetMapping("/sections")
    public List<Section> getAllSections() {
        return sectionRepository.findAll();
    }

    @PostMapping("/addSection")
    public Section addSection(@RequestBody Section section) {
        return sectionRepository.save(section);
    }

    @DeleteMapping("/sections/{id}")
    public ResponseEntity<?> deleteSection(@PathVariable Long id) {
        sectionRepository.deleteById(id);
        sectionSkillRepository.deleteBySectionId(id);
        return ResponseEntity.ok().build();
    }

    // --- SECTION SKILLS (MAPPING) ---
    @GetMapping("/sectionSkills/{sectionId}")
    public List<Skill> getSkillsForSection(@PathVariable Long sectionId) {
        List<SectionSkill> mappings = sectionSkillRepository.findBySectionId(sectionId);
        List<Skill> skills = new ArrayList<>();
        for (SectionSkill ss : mappings) {
            skillRepository.findById(ss.getSkillId()).ifPresent(skills::add);
        }
        return skills;
    }

    @PostMapping("/mapSectionSkill")
    public SectionSkill mapSectionSkill(@RequestBody SectionSkill sectionSkill) {
        return sectionSkillRepository.save(sectionSkill);
    }

    @DeleteMapping("/removeSectionSkill")
    public ResponseEntity<?> removeSectionSkill(
            @RequestParam("sectionId") Long sectionId, 
            @RequestParam("skillId") Long skillId) {
        sectionSkillRepository.deleteBySectionIdAndSkillId(sectionId, skillId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/allSectionSkillMap")
    public java.util.Map<String, List<String>> getAllSectionSkillMap() {
        java.util.Map<String, List<String>> map = new java.util.HashMap<>();
        List<Section> sections = sectionRepository.findAll();
        for (Section sec : sections) {
            List<SectionSkill> mappings = sectionSkillRepository.findBySectionId(sec.getId());
            List<String> skillNames = mappings.stream()
                .map(ss -> skillRepository.findById(ss.getSkillId()).map(Skill::getName).orElse(null))
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
            map.put(sec.getName(), skillNames);
        }
        return map;
    }
}
