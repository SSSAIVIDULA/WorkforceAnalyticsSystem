package com.workforce.backend.repository;

import com.workforce.backend.model.SectionSkillMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import jakarta.transaction.Transactional;

@Repository
public interface SectionSkillRepository extends JpaRepository<SectionSkillMap, Long> {
    List<SectionSkillMap> findBySectionId(Long sectionId);
    List<SectionSkillMap> findBySkillId(Long skillId);
    
    @org.springframework.data.jpa.repository.Modifying
    @Transactional
    void deleteBySectionIdAndSkillId(Long sectionId, Long skillId);
    
    @org.springframework.data.jpa.repository.Modifying
    @Transactional
    void deleteBySectionId(Long sectionId);
    
    @org.springframework.data.jpa.repository.Modifying
    @Transactional
    void deleteBySkillId(Long skillId);
}
