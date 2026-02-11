package com.eduplatform.dto;

import java.util.List;

public class CreateExamRequest {
    private String title;
    private String description;
    private Integer duration;
    private Boolean isActive;
    private List<QuestionDto> questions;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public List<QuestionDto> getQuestions() { return questions; }
    public void setQuestions(List<QuestionDto> questions) { this.questions = questions; }

    public static class QuestionDto {
        private String text;
        private String type;
        private Integer points;
        private List<String> keywords;
        private List<OptionDto> options;

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public Integer getPoints() { return points; }
        public void setPoints(Integer points) { this.points = points; }
        public List<String> getKeywords() { return keywords; }
        public void setKeywords(List<String> keywords) { this.keywords = keywords; }
        public List<OptionDto> getOptions() { return options; }
        public void setOptions(List<OptionDto> options) { this.options = options; }
    }

    public static class OptionDto {
        private String text;
        private Boolean isCorrect;

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public Boolean getIsCorrect() { return isCorrect; }
        public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
    }
}
