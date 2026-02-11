package com.eduplatform.repository;

import com.eduplatform.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Integer> {
    List<Question> findByExamId(Integer examId);
    void deleteByExamId(Integer examId);
}
