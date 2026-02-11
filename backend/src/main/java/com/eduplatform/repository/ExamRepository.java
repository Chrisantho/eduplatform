package com.eduplatform.repository;

import com.eduplatform.model.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Integer> {
    List<Exam> findAllByOrderByCreatedAtAsc();
}
