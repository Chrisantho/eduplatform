package com.eduplatform.dto;

import java.util.List;

public class SubmitExamRequest {
    private List<AnswerDto> answers;

    public List<AnswerDto> getAnswers() { return answers; }
    public void setAnswers(List<AnswerDto> answers) { this.answers = answers; }

    public static class AnswerDto {
        private Integer questionId;
        private Integer selectedOptionId;
        private String textAnswer;

        public Integer getQuestionId() { return questionId; }
        public void setQuestionId(Integer questionId) { this.questionId = questionId; }
        public Integer getSelectedOptionId() { return selectedOptionId; }
        public void setSelectedOptionId(Integer selectedOptionId) { this.selectedOptionId = selectedOptionId; }
        public String getTextAnswer() { return textAnswer; }
        public void setTextAnswer(String textAnswer) { this.textAnswer = textAnswer; }
    }
}
