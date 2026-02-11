package com.eduplatform.dto;

import com.eduplatform.model.Exam;
import com.eduplatform.model.Submission;
import java.time.LocalDateTime;

public class SubmissionWithExam {
    private Integer id;
    private Integer examId;
    private Integer studentId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer score;
    private String status;
    private Exam exam;

    public SubmissionWithExam(Submission s, Exam exam) {
        this.id = s.getId();
        this.examId = s.getExamId();
        this.studentId = s.getStudentId();
        this.startTime = s.getStartTime();
        this.endTime = s.getEndTime();
        this.score = s.getScore();
        this.status = s.getStatus();
        this.exam = exam;
    }

    public Integer getId() { return id; }
    public Integer getExamId() { return examId; }
    public Integer getStudentId() { return studentId; }
    public LocalDateTime getStartTime() { return startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public Integer getScore() { return score; }
    public String getStatus() { return status; }
    public Exam getExam() { return exam; }
}
