package com.eduplatform.repository;

import com.eduplatform.model.PasswordReset;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PasswordResetRepository extends JpaRepository<PasswordReset, Integer> {
    Optional<PasswordReset> findByUserIdAndCodeAndUsedFalse(Integer userId, String code);
    Optional<PasswordReset> findByCodeAndUsedFalse(String code);
}
