package com.eduplatform.dto;

import com.eduplatform.model.Exam;
import java.time.LocalDateTime;
import java.util.List;

public class ExamWithQuestions {
    private Integer id;
    private String title;
    private String description;
    private Integer duration;
    private Integer createdById;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private List<QuestionWithOptions> questions;

    public ExamWithQuestions(Exam exam, List<QuestionWithOptions> questions) {
        this.id = exam.getId();
        this.title = exam.getTitle();
        this.description = exam.getDescription();
        this.duration = exam.getDuration();
        this.createdById = exam.getCreatedById();
        this.isActive = exam.getIsActive();
        this.createdAt = exam.getCreatedAt();
        this.questions = questions;
    }

    public Integer getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Integer getDuration() { return duration; }
    public Integer getCreatedById() { return createdById; }
    public Boolean getIsActive() { return isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<QuestionWithOptions> getQuestions() { return questions; }

    public static class QuestionWithOptions {
        private Integer id;
        private Integer examId;
        private String text;
        private String type;
        private Integer points;
        private List<String> keywords;
        private List<OptionDto> options;

        public QuestionWithOptions(com.eduplatform.model.Question q, List<OptionDto> options, boolean includeAnswers) {
            this.id = q.getId();
            this.examId = q.getExamId();
            this.text = q.getText();
            this.type = q.getType();
            this.points = q.getPoints();
            this.keywords = includeAnswers ? q.getKeywords() : null;
            this.options = options;
        }

        public Integer getId() { return id; }
        public Integer getExamId() { return examId; }
        public String getText() { return text; }
        public String getType() { return type; }
        public Integer getPoints() { return points; }
        public List<String> getKeywords() { return keywords; }
        public List<OptionDto> getOptions() { return options; }
    }

    public static class OptionDto {
        private Integer id;
        private Integer questionId;
        private String text;
        private Boolean isCorrect;

        public OptionDto(com.eduplatform.model.Option o, boolean includeCorrect) {
            this.id = o.getId();
            this.questionId = o.getQuestionId();
            this.text = o.getText();
            this.isCorrect = includeCorrect ? o.getIsCorrect() : null;
        }

        public Integer getId() { return id; }
        public Integer getQuestionId() { return questionId; }
        public String getText() { return text; }
        public Boolean getIsCorrect() { return isCorrect; }
    }
}
