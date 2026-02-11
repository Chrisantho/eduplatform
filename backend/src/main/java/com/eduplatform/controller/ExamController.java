package com.eduplatform.controller;

import com.eduplatform.dto.CreateExamRequest;
import com.eduplatform.dto.ExamWithQuestions;
import com.eduplatform.dto.SubmitExamRequest;
import com.eduplatform.model.Exam;
import com.eduplatform.model.Submission;
import com.eduplatform.model.User;
import com.eduplatform.repository.ExamRepository;
import com.eduplatform.repository.UserRepository;
import com.eduplatform.service.ExamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ExamController {

    private final ExamService examService;
    private final UserRepository userRepository;
    private final ExamRepository examRepository;

    public ExamController(ExamService examService, UserRepository userRepository, ExamRepository examRepository) {
        this.examService = examService;
        this.userRepository = userRepository;
        this.examRepository = examRepository;
    }

    @GetMapping("/exams")
    public ResponseEntity<?> listExams() {
        return ResponseEntity.ok(examService.getAllExams());
    }

    @GetMapping("/exams/{id}")
    public ResponseEntity<?> getExam(@PathVariable Integer id) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        boolean isAdmin = "ADMIN".equals(user.getRole());
        ExamWithQuestions exam = examService.getExamWithQuestions(id, isAdmin);
        if (exam == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Exam not found"));
        return ResponseEntity.ok(exam);
    }

    @PostMapping("/exams")
    public ResponseEntity<?> createExam(@RequestBody CreateExamRequest request) {
        User user = getAuthenticatedUser();
        if (user == null || !"ADMIN".equals(user.getRole())) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            Exam exam = examService.createExam(user.getId(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(exam);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/exams/{id}")
    public ResponseEntity<?> updateExam(@PathVariable Integer id, @RequestBody CreateExamRequest request) {
        User user = getAuthenticatedUser();
        if (user == null || !"ADMIN".equals(user.getRole())) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            Exam exam = examService.updateExam(id, request);
            if (exam == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Exam not found"));
            return ResponseEntity.ok(exam);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/exams/{id}")
    public ResponseEntity<?> deleteExam(@PathVariable Integer id) {
        User user = getAuthenticatedUser();
        if (user == null || !"ADMIN".equals(user.getRole())) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        examService.deleteExam(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/exams/{id}/start")
    public ResponseEntity<?> startExam(@PathVariable Integer id) {
        User user = getAuthenticatedUser();
        if (user == null || !"STUDENT".equals(user.getRole())) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Submission submission = examService.startExam(user.getId(), id);
        return ResponseEntity.status(HttpStatus.CREATED).body(submission);
    }

    @GetMapping("/submissions")
    public ResponseEntity<?> listSubmissions() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(examService.getUserSubmissions(user.getId()));
    }

    @GetMapping("/submissions/{id}")
    public ResponseEntity<?> getSubmission(@PathVariable Integer id) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Submission submission = examService.getSubmission(id);
        if (submission == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Submission not found"));
        if (!"ADMIN".equals(user.getRole()) && !submission.getStudentId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Exam exam = examRepository.findById(submission.getExamId()).orElse(null);
        return ResponseEntity.ok(Map.of(
                "id", submission.getId(),
                "examId", submission.getExamId(),
                "studentId", submission.getStudentId(),
                "startTime", submission.getStartTime(),
                "endTime", submission.getEndTime() != null ? submission.getEndTime() : "",
                "score", submission.getScore() != null ? submission.getScore() : "",
                "status", submission.getStatus(),
                "exam", exam != null ? exam : "",
                "answers", List.of()
        ));
    }

    @PostMapping("/submissions/{id}/submit")
    public ResponseEntity<?> submitExam(@PathVariable Integer id, @RequestBody SubmitExamRequest request) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Submission submission = examService.getSubmission(id);
        if (submission == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        if (!submission.getStudentId().equals(user.getId())) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        if ("COMPLETED".equals(submission.getStatus())) return ResponseEntity.badRequest().body(Map.of("message", "Already submitted"));

        Submission updated = examService.submitExam(id, request);
        return ResponseEntity.ok(updated);
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) return null;
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }
}
