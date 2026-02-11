package com.eduplatform.repository;

import com.eduplatform.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, Integer> {
    List<Submission> findByStudentIdOrderByStartTimeAsc(Integer studentId);
    List<Submission> findAllByOrderByStartTimeAsc();
    List<Submission> findByExamId(Integer examId);
}
