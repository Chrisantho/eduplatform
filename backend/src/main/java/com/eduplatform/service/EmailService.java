package com.eduplatform.service;

import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private final String emailServiceUrl;

    public EmailService() {
        this.emailServiceUrl = System.getenv("EMAIL_SERVICE_URL");
    }

    public boolean sendPasswordResetCode(String toEmail, String code, String userName) {
        if (emailServiceUrl == null || emailServiceUrl.isEmpty()) {
            System.out.println("EMAIL_SERVICE_URL not configured. Password reset code for " + toEmail + ": " + code);
            return false;
        }

        String html = "<div style=\"font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;\">"
                + "<div style=\"text-align: center; padding: 20px 0;\">"
                + "<h2 style=\"color: #3b82f6; margin: 0;\">EduPlatform</h2>"
                + "</div>"
                + "<div style=\"background: #f8fafc; border-radius: 8px; padding: 30px; text-align: center;\">"
                + "<h3 style=\"margin-top: 0;\">Password Reset Request</h3>"
                + "<p>Hi " + escapeHtml(userName) + ",</p>"
                + "<p>You requested a password reset. Use the code below to verify your identity:</p>"
                + "<div style=\"background: #ffffff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;\">"
                + "<span style=\"font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;\">" + code + "</span>"
                + "</div>"
                + "<p style=\"color: #64748b; font-size: 14px;\">This code expires in 15 minutes.</p>"
                + "<p style=\"color: #64748b; font-size: 14px;\">If you didn't request this, you can safely ignore this email.</p>"
                + "</div>"
                + "</div>";

        String subject = "Your EduPlatform Password Reset Code";

        String text = "Hi " + userName + ",\n\n"
                + "You requested a password reset for your EduPlatform account.\n\n"
                + "Your verification code is: " + code + "\n\n"
                + "This code expires in 15 minutes.\n\n"
                + "If you didn't request this, you can safely ignore this email.\n\n"
                + "- EduPlatform Team";

        try {
            String jsonBody = "{\"to\":\"" + escapeJson(toEmail) + "\","
                    + "\"subject\":\"" + escapeJson(subject) + "\","
                    + "\"text\":\"" + escapeJson(text) + "\","
                    + "\"html\":\"" + escapeJson(html) + "\"}";

            URL url = new URL(emailServiceUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(jsonBody.getBytes(StandardCharsets.UTF_8));
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                System.out.println("Password reset email sent to " + toEmail);
                return true;
            } else {
                System.out.println("Email service returned status " + responseCode + " for " + toEmail);
                System.out.println("FALLBACK: Password reset code for " + toEmail + ": " + code);
                return false;
            }
        } catch (Exception e) {
            System.out.println("Failed to send email to " + toEmail + ": " + e.getMessage());
            System.out.println("FALLBACK: Password reset code for " + toEmail + ": " + code);
            return false;
        }
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
