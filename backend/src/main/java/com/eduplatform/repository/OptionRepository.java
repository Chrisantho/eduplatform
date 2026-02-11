package com.eduplatform.repository;

import com.eduplatform.model.Option;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OptionRepository extends JpaRepository<Option, Integer> {
    List<Option> findByQuestionId(Integer questionId);
    void deleteByQuestionId(Integer questionId);
    void deleteByQuestionIdIn(List<Integer> questionIds);
}
