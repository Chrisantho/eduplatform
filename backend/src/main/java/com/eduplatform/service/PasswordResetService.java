package com.eduplatform.service;

import com.eduplatform.model.PasswordReset;
import com.eduplatform.model.User;
import com.eduplatform.repository.PasswordResetRepository;
import com.eduplatform.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class PasswordResetService {

    private final PasswordResetRepository passwordResetRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordResetService(PasswordResetRepository passwordResetRepository,
                                UserRepository userRepository,
                                PasswordEncoder passwordEncoder) {
        this.passwordResetRepository = passwordResetRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public String createResetCode(Integer userId) {
        String code = String.valueOf(100000 + new SecureRandom().nextInt(900000));
        PasswordReset reset = new PasswordReset();
        reset.setUserId(userId);
        reset.setCode(code);
        reset.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        passwordResetRepository.save(reset);
        return code;
    }

    public Optional<PasswordReset> verifyCode(Integer userId, String code) {
        return passwordResetRepository.findByUserIdAndCodeAndUsedFalse(userId, code)
                .filter(r -> LocalDateTime.now().isBefore(r.getExpiresAt()));
    }

    public String createResetToken(Integer userId) {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        String token = sb.toString();

        PasswordReset reset = new PasswordReset();
        reset.setUserId(userId);
        reset.setCode(token);
        reset.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        passwordResetRepository.save(reset);
        return token;
    }

    public Optional<PasswordReset> verifyToken(String token) {
        return passwordResetRepository.findByCodeAndUsedFalse(token)
                .filter(r -> LocalDateTime.now().isBefore(r.getExpiresAt()));
    }

    public void markUsed(Integer id) {
        PasswordReset reset = passwordResetRepository.findById(id).orElse(null);
        if (reset != null) {
            reset.setUsed(true);
            passwordResetRepository.save(reset);
        }
    }

    public void resetPassword(Integer userId, String newPassword) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
        }
    }
}
