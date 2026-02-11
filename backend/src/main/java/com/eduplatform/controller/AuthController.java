package com.eduplatform.controller;

import com.eduplatform.dto.*;
import com.eduplatform.model.PasswordReset;
import com.eduplatform.model.User;
import com.eduplatform.repository.UserRepository;
import com.eduplatform.service.NotificationService;
import com.eduplatform.service.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final NotificationService notificationService;
    private final PasswordResetService passwordResetService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder,
                          AuthenticationManager authenticationManager,
                          NotificationService notificationService,
                          PasswordResetService passwordResetService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.notificationService = notificationService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole() != null ? request.getRole() : "STUDENT");
        user = userRepository.save(user);

        notificationService.createNotification(user.getId(),
                "Welcome to EduPlatform!",
                "Hi " + user.getFullName() + ", welcome to our learning platform! Start by browsing available exams from your dashboard.",
                "WELCOME");

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(auth);
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

        return ResponseEntity.status(HttpStatus.CREATED).body(sanitizeUser(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
            SecurityContextHolder.getContext().setAuthentication(auth);
            HttpSession session = httpRequest.getSession(true);
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

            User user = userRepository.findByUsername(request.getUsername()).orElse(null);
            return ResponseEntity.ok(sanitizeUser(user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid username or password"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/user")
    public ResponseEntity<?> getCurrentUser() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(sanitizeUser(user));
    }

    @PutMapping("/user/profile")
    public ResponseEntity<?> updateProfile(@RequestBody ProfileUpdateRequest request) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getEmail() != null) user.setEmail(request.getEmail().isEmpty() ? null : request.getEmail());
        if (request.getBio() != null) user.setBio(request.getBio().isEmpty() ? null : request.getBio());
        user = userRepository.save(user);
        return ResponseEntity.ok(sanitizeUser(user));
    }

    @PostMapping("/user/profile-pic")
    public ResponseEntity<?> uploadProfilePic(@RequestParam("profilePic") MultipartFile file) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "No file uploaded"));

        try {
            String uploadDir = System.getProperty("user.dir") + "/uploads";
            Files.createDirectories(Paths.get(uploadDir));
            String filename = "profile-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8) +
                    getExtension(file.getOriginalFilename());
            Path filepath = Paths.get(uploadDir, filename);
            file.transferTo(filepath.toFile());

            String url = "/uploads/" + filename;
            user.setProfilePicUrl(url);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Upload failed"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        String genericMessage = "If an account with that email exists, a reset code has been sent";
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null) return ResponseEntity.ok(Map.of("message", genericMessage));

        String code = passwordResetService.createResetCode(user.getId());
        System.out.println("Password reset code for " + request.getEmail() + ": " + code);

        return ResponseEntity.ok(Map.of("message", genericMessage));
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyResetCode(@RequestBody VerifyResetCodeRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body(Map.of("message", "Invalid email"));

        Optional<PasswordReset> reset = passwordResetService.verifyCode(user.getId(), request.getCode());
        if (reset.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired code"));

        passwordResetService.markUsed(reset.get().getId());
        String token = passwordResetService.createResetToken(user.getId());

        return ResponseEntity.ok(Map.of("message", "Code verified successfully", "token", token));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters"));
        }

        Optional<PasswordReset> reset = passwordResetService.verifyToken(request.getToken());
        if (reset.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired reset token"));

        passwordResetService.resetPassword(reset.get().getUserId(), request.getNewPassword());
        passwordResetService.markUsed(reset.get().getId());

        return ResponseEntity.ok(Map.of("message", "Password reset successful. You can now log in with your new password."));
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) return null;
        String username = auth.getName();
        return userRepository.findByUsername(username).orElse(null);
    }

    private Map<String, Object> sanitizeUser(User user) {
        if (user == null) return null;
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("email", user.getEmail());
        map.put("fullName", user.getFullName());
        map.put("role", user.getRole());
        map.put("bio", user.getBio());
        map.put("profilePicUrl", user.getProfilePicUrl());
        map.put("createdAt", user.getCreatedAt());
        return map;
    }

    private String getExtension(String filename) {
        if (filename == null) return ".jpg";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".jpg";
    }
}
