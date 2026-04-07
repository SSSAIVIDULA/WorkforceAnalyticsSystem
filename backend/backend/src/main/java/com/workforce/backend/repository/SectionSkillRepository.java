package com.workforce.backend.repository;

import com.workforce.backend.model.SectionSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import jakarta.transaction.Transactional;

@Repository
public interface SectionSkillRepository extends JpaRepository<SectionSkill, Long> {
    List<SectionSkill> findBySectionId(Long sectionId);
    List<SectionSkill> findBySkillId(Long skillId);
    
    @Transactional
    void deleteBySectionIdAndSkillId(Long sectionId, Long skillId);
    
    @Transactional
    void deleteBySectionId(Long sectionId);
    
    @Transactional
    void deleteBySkillId(Long skillId);
}
