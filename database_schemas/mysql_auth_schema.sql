-- MySQL Database Schema for Authentication System
-- Compatible with authController.js and existing models
-- Version: 1.0

-- Create database
CREATE DATABASE IF NOT EXISTS `clinical_appointment_system` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `clinical_appointment_system`;

-- =====================================================
-- AUTHENTICATION & USER MANAGEMENT TABLES
-- =====================================================

-- 1. Users Table (Main authentication table)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('patient', 'doctor', 'admin', 'billing') NOT NULL DEFAULT 'patient',
  `avatar_url` VARCHAR(500) NULL,
  `phone` VARCHAR(20) NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `email_verified` BOOLEAN DEFAULT FALSE,
  `last_login` TIMESTAMP NULL,
  `password_reset_token` VARCHAR(255) NULL,doctors
  `password_reset_expires` TIMESTAMP NULL,
  `email_verification_token` VARCHAR(255) NULL,
  `email_verification_expires` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_active` (`is_active`),
  INDEX `idx_last_login` (`last_login`),
  INDEX `idx_password_reset_token` (`password_reset_token`),
  INDEX `idx_email_verification_token` (`email_verification_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Patients Table (Extended profile for patients)
CREATE TABLE IF NOT EXISTS `patients` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `patient_id` VARCHAR(20) UNIQUE NOT NULL, -- Auto-generated: P001, P002, etc.
  `date_of_birth` DATE NULL,
  `gender` ENUM('male', 'female', 'other') NULL,
  `address` TEXT NULL,
  `emergency_contact_name` VARCHAR(255) NULL,
  `emergency_contact_phone` VARCHAR(20) NULL,
  `medical_history` TEXT NULL,
  `allergies` TEXT NULL,
  `current_medications` TEXT NULL,
  `insurance_provider` VARCHAR(255) NULL,
  `insurance_policy_number` VARCHAR(100) NULL,
  `blood_type` VARCHAR(5) NULL,
  `height` DECIMAL(5,2) NULL COMMENT 'Height in cm',
  `weight` DECIMAL(5,2) NULL COMMENT 'Weight in kg',
  `occupation` VARCHAR(255) NULL,
  `marital_status` ENUM('single', 'married', 'divorced', 'widowed') NULL,
  `preferred_language` VARCHAR(50) DEFAULT 'English',
  `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_patient_id` (`patient_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_date_of_birth` (`date_of_birth`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Doctors Table (Extended profile for doctors)
CREATE TABLE IF NOT EXISTS `doctors` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `doctor_id` VARCHAR(20) UNIQUE NOT NULL, -- Auto-generated: D001, D002, etc.
  `specialty` VARCHAR(255) NOT NULL,
  `license_number` VARCHAR(100) UNIQUE NOT NULL,
  `years_of_experience` INT NULL,
  `education` TEXT NULL,
  `certifications` TEXT NULL,
  `consultation_fee` DECIMAL(10,2) NULL,
  `languages_spoken` JSON NULL COMMENT 'Array of languages: ["English", "Spanish"]',
  `office_address` TEXT NULL,
  `bio` TEXT NULL,
  `rating` DECIMAL(3,2) DEFAULT 0.00,
  `total_reviews` INT DEFAULT 0,
  `working_hours` JSON NULL COMMENT 'Weekly schedule object',
  `availability_status` ENUM('available', 'busy', 'offline') DEFAULT 'available',
  `commission_rate` DECIMAL(5,2) DEFAULT 25.00 COMMENT 'Percentage commission',
  `status` ENUM('active', 'inactive', 'suspended', 'pending_approval') DEFAULT 'pending_approval',
  `approved_at` TIMESTAMP NULL,
  `approved_by` VARCHAR(36) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_doctor_id` (`doctor_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_specialty` (`specialty`),
  INDEX `idx_license_number` (`license_number`),
  INDEX `idx_status` (`status`),
  INDEX `idx_rating` (`rating`),
  INDEX `idx_availability_status` (`availability_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Refresh Tokens Table (For JWT refresh token management)
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `is_revoked` BOOLEAN DEFAULT FALSE,
  `device_info` JSON NULL COMMENT 'Device information for security',
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_token_hash` (`token_hash`),
  INDEX `idx_expires_at` (`expires_at`),
  INDEX `idx_is_revoked` (`is_revoked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. User Sessions Table (Optional: for tracking active sessions)
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `session_token` VARCHAR(255) NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_session_token` (`session_token`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Password Reset Requests Table (For tracking reset attempts)
CREATE TABLE IF NOT EXISTS `password_reset_requests` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `is_used` BOOLEAN DEFAULT FALSE,
  `used_at` TIMESTAMP NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_token` (`token`),
  INDEX `idx_expires_at` (`expires_at`),
  INDEX `idx_is_used` (`is_used`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Email Verification Tokens Table
CREATE TABLE IF NOT EXISTS `email_verification_tokens` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `is_used` BOOLEAN DEFAULT FALSE,
  `used_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_token` (`token`),
  INDEX `idx_expires_at` (`expires_at`),
  INDEX `idx_is_used` (`is_used`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Login Attempts Table (For security monitoring)
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `email` VARCHAR(255) NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` TEXT NULL,
  `success` BOOLEAN NOT NULL,
  `failure_reason` VARCHAR(255) NULL,
  `attempted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_email` (`email`),
  INDEX `idx_ip_address` (`ip_address`),
  INDEX `idx_success` (`success`),
  INDEX `idx_attempted_at` (`attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TRIGGERS FOR AUTO-GENERATING IDs
-- =====================================================

-- Trigger for auto-generating patient_id
DELIMITER $$
CREATE TRIGGER `generate_patient_id` 
BEFORE INSERT ON `patients` 
FOR EACH ROW
BEGIN
  IF NEW.patient_id IS NULL OR NEW.patient_id = '' THEN
    SET @max_id = (SELECT COALESCE(MAX(CAST(SUBSTRING(patient_id, 2) AS UNSIGNED)), 0) FROM patients WHERE patient_id REGEXP '^P[0-9]+$');
    SET NEW.patient_id = CONCAT('P', LPAD(@max_id + 1, 3, '0'));
  END IF;
END$$
DELIMITER ;

-- Trigger for auto-generating doctor_id
DELIMITER $$
CREATE TRIGGER `generate_doctor_id` 
BEFORE INSERT ON `doctors` 
FOR EACH ROW
BEGIN
  IF NEW.doctor_id IS NULL OR NEW.doctor_id = '' THEN
    SET @max_id = (SELECT COALESCE(MAX(CAST(SUBSTRING(doctor_id, 2) AS UNSIGNED)), 0) FROM doctors WHERE doctor_id REGEXP '^D[0-9]+$');
    SET NEW.doctor_id = CONCAT('D', LPAD(@max_id + 1, 3, '0'));
  END IF;
END$$
DELIMITER ;

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Insert default admin user
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `is_active`, `email_verified`) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'System Administrator',
  'admin@clinicalapp.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LetvU7g.w.x8xgK8G', -- password: admin123
  'admin',
  TRUE,
  TRUE
);
