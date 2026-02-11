package com.eduplatform.service;

import com.eduplatform.dto.CreateExamRequest;
import com.eduplatform.dto.ExamWithQuestions;
import com.eduplatform.dto.SubmitExamRequest;
import com.eduplatform.model.*;
import com.eduplatform.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExamService {

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final OptionRepository optionRepository;
    private final SubmissionRepository submissionRepository;
    private final AnswerRepository answerRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public ExamService(ExamRepository examRepository, QuestionRepository questionRepository,
                       OptionRepository optionRepository, SubmissionRepository submissionRepository,
                       AnswerRepository answerRepository, UserRepository userRepository,
                       NotificationRepository notificationRepository) {
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
        this.submissionRepository = submissionRepository;
        this.answerRepository = answerRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    public List<Exam> getAllExams() {
        return examRepository.findAllByOrderByCreatedAtAsc();
    }

    public ExamWithQuestions getExamWithQuestions(Integer examId, boolean isAdmin) {
        Exam exam = examRepository.findById(examId).orElse(null);
        if (exam == null) return null;

        List<Question> questions = questionRepository.findByExamId(examId);
        List<ExamWithQuestions.QuestionWithOptions> questionsDto = questions.stream().map(q -> {
            List<Option> opts = optionRepository.findByQuestionId(q.getId());
            List<ExamWithQuestions.OptionDto> optDtos = opts.stream()
                    .map(o -> new ExamWithQuestions.OptionDto(o, isAdmin))
                    .collect(Collectors.toList());
            return new ExamWithQuestions.QuestionWithOptions(q, optDtos, isAdmin);
        }).collect(Collectors.toList());

        return new ExamWithQuestions(exam, questionsDto);
    }

    @Transactional
    public Exam createExam(Integer adminId, CreateExamRequest request) {
        Exam exam = new Exam();
        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setDuration(request.getDuration());
        exam.setIsActive(request.getIsActive() != null ? request.getIsActive() : false);
        exam.setCreatedById(adminId);
        exam = examRepository.save(exam);

        saveQuestionsAndOptions(exam.getId(), request.getQuestions());

        List<User> students = userRepository.findByRole("STUDENT");
        for (User student : students) {
            Notification n = new Notification();
            n.setUserId(student.getId());
            n.setTitle("New Exam Available");
            n.setMessage("A new exam \"" + exam.getTitle() + "\" has been published. Check your dashboard to take it!");
            n.setType("NEW_EXAM");
            notificationRepository.save(n);
        }

        return exam;
    }

    @Transactional
    public Exam updateExam(Integer examId, CreateExamRequest request) {
        Exam exam = examRepository.findById(examId).orElse(null);
        if (exam == null) return null;

        List<Submission> subs = submissionRepository.findByExamId(examId);
        if (!subs.isEmpty()) {
            throw new RuntimeException("Cannot edit an exam that already has student submissions");
        }

        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setDuration(request.getDuration());
        exam.setIsActive(request.getIsActive() != null ? request.getIsActive() : false);
        exam = examRepository.save(exam);

        List<Question> oldQuestions = questionRepository.findByExamId(examId);
        List<Integer> oldQIds = oldQuestions.stream().map(Question::getId).collect(Collectors.toList());
        if (!oldQIds.isEmpty()) {
            optionRepository.deleteByQuestionIdIn(oldQIds);
        }
        questionRepository.deleteByExamId(examId);

        saveQuestionsAndOptions(examId, request.getQuestions());

        return exam;
    }

    @Transactional
    public void deleteExam(Integer examId) {
        List<Question> questions = questionRepository.findByExamId(examId);
        List<Integer> qIds = questions.stream().map(Question::getId).collect(Collectors.toList());
        if (!qIds.isEmpty()) {
            optionRepository.deleteByQuestionIdIn(qIds);
        }
        questionRepository.deleteByExamId(examId);
        examRepository.deleteById(examId);
    }

    public Submission startExam(Integer studentId, Integer examId) {
        List<Submission> userSubs = submissionRepository.findByStudentIdOrderByStartTimeAsc(studentId);
        Optional<Submission> existing = userSubs.stream()
                .filter(s -> s.getExamId().equals(examId) && "IN_PROGRESS".equals(s.getStatus()))
                .findFirst();
        if (existing.isPresent()) return existing.get();

        Submission sub = new Submission();
        sub.setStudentId(studentId);
        sub.setExamId(examId);
        sub.setStartTime(LocalDateTime.now());
        sub.setStatus("IN_PROGRESS");
        return submissionRepository.save(sub);
    }

    @Transactional
    public Submission submitExam(Integer submissionId, SubmitExamRequest request) {
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) return null;

        Exam exam = examRepository.findById(submission.getExamId()).orElse(null);
        int score = 0;
        int totalPossiblePoints = 0;

        if (exam != null) {
            List<Question> questions = questionRepository.findByExamId(exam.getId());
            for (Question question : questions) {
                totalPossiblePoints += question.getPoints() != null ? question.getPoints() : 0;
                SubmitExamRequest.AnswerDto studentAnswer = request.getAnswers().stream()
                        .filter(a -> a.getQuestionId().equals(question.getId()))
                        .findFirst().orElse(null);

                if (studentAnswer == null) continue;

                if ("MCQ".equals(question.getType()) && studentAnswer.getSelectedOptionId() != null) {
                    Option selectedOpt = optionRepository.findById(studentAnswer.getSelectedOptionId()).orElse(null);
                    if (selectedOpt != null && Boolean.TRUE.equals(selectedOpt.getIsCorrect())) {
                        score += question.getPoints() != null ? question.getPoints() : 0;
                    }
                } else if ("SHORT_ANSWER".equals(question.getType()) && studentAnswer.getTextAnswer() != null) {
                    List<String> keywords = question.getKeywords();
                    if (keywords != null && !keywords.isEmpty()) {
                        String answerLower = studentAnswer.getTextAnswer().toLowerCase();
                        long matchedCount = keywords.stream()
                                .filter(kw -> answerLower.contains(kw.toLowerCase()))
                                .count();
                        double ratio = (double) matchedCount / keywords.size();
                        score += Math.round((question.getPoints() != null ? question.getPoints() : 0) * ratio);
                    } else {
                        score += question.getPoints() != null ? question.getPoints() : 0;
                    }
                }
            }
        }

        int finalPercentage = totalPossiblePoints > 0 ? Math.round((float) score / totalPossiblePoints * 100) : 0;

        for (SubmitExamRequest.AnswerDto a : request.getAnswers()) {
            Answer answer = new Answer();
            answer.setSubmissionId(submissionId);
            answer.setQuestionId(a.getQuestionId());
            answer.setSelectedOptionId(a.getSelectedOptionId());
            answer.setTextAnswer(a.getTextAnswer());
            answerRepository.save(answer);
        }

        submission.setStatus("COMPLETED");
        submission.setScore(finalPercentage);
        submission.setEndTime(LocalDateTime.now());
        return submissionRepository.save(submission);
    }

    public List<Map<String, Object>> getUserSubmissions(Integer userId) {
        User user = userRepository.findById(userId).orElse(null);
        List<Submission> subs;
        if (user != null && "ADMIN".equals(user.getRole())) {
            subs = submissionRepository.findAllByOrderByStartTimeAsc();
        } else {
            subs = submissionRepository.findByStudentIdOrderByStartTimeAsc(userId);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Submission sub : subs) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", sub.getId());
            map.put("examId", sub.getExamId());
            map.put("studentId", sub.getStudentId());
            map.put("startTime", sub.getStartTime());
            map.put("endTime", sub.getEndTime());
            map.put("score", sub.getScore());
            map.put("status", sub.getStatus());
            Exam exam = examRepository.findById(sub.getExamId()).orElse(null);
            map.put("exam", exam);
            result.add(map);
        }
        return result;
    }

    public Submission getSubmission(Integer id) {
        return submissionRepository.findById(id).orElse(null);
    }

    private void saveQuestionsAndOptions(Integer examId, List<CreateExamRequest.QuestionDto> questionDtos) {
        if (questionDtos == null) return;
        for (CreateExamRequest.QuestionDto qDto : questionDtos) {
            Question q = new Question();
            q.setExamId(examId);
            q.setText(qDto.getText());
            q.setType(qDto.getType());
            q.setPoints(qDto.getPoints());
            q.setKeywords(qDto.getKeywords());
            q = questionRepository.save(q);

            if (qDto.getOptions() != null) {
                for (CreateExamRequest.OptionDto oDto : qDto.getOptions()) {
                    Option o = new Option();
                    o.setQuestionId(q.getId());
                    o.setText(oDto.getText());
                    o.setIsCorrect(oDto.getIsCorrect() != null ? oDto.getIsCorrect() : false);
                    optionRepository.save(o);
                }
            }
        }
    }
}
