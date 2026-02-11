package com.eduplatform.config;

import com.eduplatform.model.User;
import com.eduplatform.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AppStartupRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AppStartupRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername("admin@example.com").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin@example.com");
            admin.setPassword(passwordEncoder.encode("adminpassword"));
            admin.setFullName("System Admin");
            admin.setRole("ADMIN");
            userRepository.save(admin);
            System.out.println("Default admin user created: admin@example.com / adminpassword");
        }
    }
}
