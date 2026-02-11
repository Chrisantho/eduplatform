-- Seed data for EduPlatform
-- Creates a default admin user (password: adminpassword)
-- Password hash format: scrypt hash.salt (handled by the application)
-- This seed should be run via the application's startup logic, not directly,
-- because passwords need to be hashed by the application.

-- The application automatically creates an admin user on startup:
-- Username: admin@example.com
-- Password: adminpassword
-- Role: ADMIN
