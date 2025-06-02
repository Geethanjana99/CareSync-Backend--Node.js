-- Initial database schema for Clinical Appointment Scheduling System
-- Migration: 001_initial_schema.sql
-- Created: 2025-01-01
-- Description: Create initial tables and relationships

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `clinical_appointment_system` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `clinical_appointment_system`;

-- Users table (authentication and basic info)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `phone` VARCHAR(20),
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('patient', 'doctor', 'admin') NOT NULL DEFAULT 'patient',
  `is_active` BOOLEAN DEFAULT TRUE,
  `email_verified` BOOLEAN DEFAULT FALSE,
  `phone_verified` BOOLEAN DEFAULT FALSE,
  `profile_picture` VARCHAR(500),
  `date_of_birth` DATE,
  `gender` ENUM('male', 'female', 'other') NULL,
  `address` TEXT,
  `emergency_contact_name` VARCHAR(200),
  `emergency_contact_phone` VARCHAR(20),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` TIMESTAMP NULL,
  `password_reset_token` VARCHAR(255) NULL,
  `password_reset_expires` TIMESTAMP NULL,
  `email_verification_token` VARCHAR(255) NULL,
  `email_verification_expires` TIMESTAMP NULL,
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_active` (`is_active`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patients table (patient-specific information)
CREATE TABLE IF NOT EXISTS `patients` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `patient_id` VARCHAR(20) UNIQUE NOT NULL,
  `medical_history` TEXT,
  `allergies` TEXT,
  `current_medications` TEXT,
  `insurance_provider` VARCHAR(200),
  `insurance_number` VARCHAR(100),
  `blood_type` VARCHAR(5),
  `height` DECIMAL(5,2),
  `weight` DECIMAL(5,2),
  `preferred_language` VARCHAR(50) DEFAULT 'English',
  `preferred_doctor_gender` ENUM('male', 'female', 'no_preference') DEFAULT 'no_preference',
  `chronic_conditions` TEXT,
  `family_medical_history` TEXT,
  `smoking_status` ENUM('never', 'former', 'current') DEFAULT 'never',
  `alcohol_consumption` ENUM('none', 'occasional', 'moderate', 'heavy') DEFAULT 'none',
  `exercise_frequency` ENUM('none', 'rarely', 'sometimes', 'often', 'daily') DEFAULT 'sometimes',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_patient_id` (`patient_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Doctors table (doctor-specific information)
CREATE TABLE IF NOT EXISTS `doctors` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `doctor_id` VARCHAR(20) UNIQUE NOT NULL,
  `license_number` VARCHAR(100) UNIQUE NOT NULL,
  `specialization` VARCHAR(200) NOT NULL,
  `subspecialty` VARCHAR(200),
  `years_of_experience` INT DEFAULT 0,
  `education` TEXT,
  `certifications` TEXT,
  `languages_spoken` JSON,
  `consultation_fee` DECIMAL(8,2) DEFAULT 0.00,
  `bio` TEXT,
  `hospital_affiliations` TEXT,
  `awards_recognitions` TEXT,
  `research_interests` TEXT,
  `availability_hours` JSON,
  `appointment_duration` INT DEFAULT 30,
  `advance_booking_days` INT DEFAULT 30,
  `is_approved` BOOLEAN DEFAULT FALSE,
  `approval_date` TIMESTAMP NULL,
  `approved_by` INT NULL,
  `rating` DECIMAL(3,2) DEFAULT 0.00,
  `total_reviews` INT DEFAULT 0,
  `total_patients` INT DEFAULT 0,
  `total_appointments` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_doctor_id` (`doctor_id`),
  INDEX `idx_license_number` (`license_number`),
  INDEX `idx_specialization` (`specialization`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_approved` (`is_approved`),
  INDEX `idx_rating` (`rating`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointments table
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `appointment_id` VARCHAR(20) UNIQUE NOT NULL,
  `patient_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `appointment_date` DATE NOT NULL,
  `appointment_time` TIME NOT NULL,
  `appointment_datetime` DATETIME GENERATED ALWAYS AS (CONCAT(appointment_date, ' ', appointment_time)) STORED,
  `duration` INT DEFAULT 30,
  `type` ENUM('consultation', 'follow-up', 'emergency', 'routine', 'specialist') DEFAULT 'consultation',
  `status` ENUM('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show') DEFAULT 'scheduled',
  `reason` TEXT,
  `symptoms` TEXT,
  `notes` TEXT,
  `consultation_fee` DECIMAL(8,2) DEFAULT 0.00,
  `payment_status` ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  `payment_method` VARCHAR(50),
  `payment_reference` VARCHAR(100),
  `scheduled_by` INT NOT NULL,
  `confirmed_at` TIMESTAMP NULL,
  `completed_at` TIMESTAMP NULL,
  `cancelled_at` TIMESTAMP NULL,
  `cancelled_by` INT NULL,
  `cancellation_reason` TEXT,
  `actual_wait_time` INT NULL,
  `is_follow_up_needed` BOOLEAN DEFAULT FALSE,
  `follow_up_date` DATE NULL,
  `prescription_given` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`scheduled_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`cancelled_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_appointment_id` (`appointment_id`),
  INDEX `idx_patient_id` (`patient_id`),
  INDEX `idx_doctor_id` (`doctor_id`),
  INDEX `idx_appointment_datetime` (`appointment_datetime`),
  INDEX `idx_status` (`status`),
  INDEX `idx_date_time` (`appointment_date`, `appointment_time`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Doctor availability table
CREATE TABLE IF NOT EXISTS `doctor_availability` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `doctor_id` INT NOT NULL,
  `day_of_week` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `is_available` BOOLEAN DEFAULT TRUE,
  `break_start_time` TIME NULL,
  `break_end_time` TIME NULL,
  `max_appointments` INT DEFAULT 20,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_doctor_day` (`doctor_id`, `day_of_week`),
  INDEX `idx_doctor_id` (`doctor_id`),
  INDEX `idx_day_of_week` (`day_of_week`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Doctor leave/unavailability table
CREATE TABLE IF NOT EXISTS `doctor_leaves` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `doctor_id` INT NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `reason` VARCHAR(255),
  `is_approved` BOOLEAN DEFAULT FALSE,
  `approved_by` INT NULL,
  `approved_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_doctor_id` (`doctor_id`),
  INDEX `idx_date_range` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Prescription table
CREATE TABLE IF NOT EXISTS `prescriptions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `prescription_id` VARCHAR(20) UNIQUE NOT NULL,
  `appointment_id` INT NOT NULL,
  `patient_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `medications` JSON NOT NULL,
  `instructions` TEXT,
  `dosage_instructions` TEXT,
  `duration` VARCHAR(100),
  `notes` TEXT,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE,
  INDEX `idx_prescription_id` (`prescription_id`),
  INDEX `idx_appointment_id` (`appointment_id`),
  INDEX `idx_patient_id` (`patient_id`),
  INDEX `idx_doctor_id` (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Doctor reviews table
CREATE TABLE IF NOT EXISTS `doctor_reviews` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `patient_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `appointment_id` INT NOT NULL,
  `rating` INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  `review_text` TEXT,
  `communication_rating` INT CHECK (communication_rating >= 1 AND communication_rating <= 5),
  `punctuality_rating` INT CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  `professionalism_rating` INT CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  `would_recommend` BOOLEAN DEFAULT TRUE,
  `is_verified` BOOLEAN DEFAULT FALSE,
  `is_anonymous` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_review` (`patient_id`, `doctor_id`, `appointment_id`),
  INDEX `idx_doctor_id` (`doctor_id`),
  INDEX `idx_rating` (`rating`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `type` ENUM('appointment_reminder', 'appointment_confirmation', 'appointment_cancellation', 'system_message', 'payment_reminder') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `related_appointment_id` INT NULL,
  `scheduled_for` TIMESTAMP NULL,
  `sent_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`related_appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_is_read` (`is_read`),
  INDEX `idx_scheduled_for` (`scheduled_for`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Billing table
CREATE TABLE IF NOT EXISTS `billing` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `bill_id` VARCHAR(20) UNIQUE NOT NULL,
  `appointment_id` INT NOT NULL,
  `patient_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `consultation_fee` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `additional_charges` DECIMAL(8,2) DEFAULT 0.00,
  `discount` DECIMAL(8,2) DEFAULT 0.00,
  `tax_amount` DECIMAL(8,2) DEFAULT 0.00,
  `total_amount` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('pending', 'paid', 'partially_paid', 'refunded', 'cancelled') DEFAULT 'pending',
  `payment_method` VARCHAR(50),
  `payment_reference` VARCHAR(100),
  `payment_date` TIMESTAMP NULL,
  `due_date` DATE NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE,
  INDEX `idx_bill_id` (`bill_id`),
  INDEX `idx_appointment_id` (`appointment_id`),
  INDEX `idx_patient_id` (`patient_id`),
  INDEX `idx_doctor_id` (`doctor_id`),
  INDEX `idx_payment_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System settings table
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `setting_key` VARCHAR(100) UNIQUE NOT NULL,
  `setting_value` TEXT,
  `setting_type` ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  `description` TEXT,
  `is_public` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_setting_key` (`setting_key`),
  INDEX `idx_is_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration tracking table
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `migration_name` VARCHAR(255) UNIQUE NOT NULL,
  `executed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_migration_name` (`migration_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial migration record
INSERT INTO `migrations` (`migration_name`) VALUES ('001_initial_schema.sql');

-- Insert default system settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`, `description`, `is_public`) VALUES
('app_name', 'Clinical Appointment Scheduling System', 'string', 'Application name', TRUE),
('app_version', '1.0.0', 'string', 'Application version', TRUE),
('default_appointment_duration', '30', 'number', 'Default appointment duration in minutes', FALSE),
('max_advance_booking_days', '30', 'number', 'Maximum days in advance for booking', FALSE),
('appointment_reminder_hours', '24', 'number', 'Hours before appointment to send reminder', FALSE),
('max_cancellation_hours', '24', 'number', 'Minimum hours before appointment for cancellation', FALSE),
('default_consultation_fee', '50.00', 'number', 'Default consultation fee', FALSE),
('currency', 'USD', 'string', 'Currency symbol', TRUE),
('timezone', 'America/New_York', 'string', 'Default timezone', FALSE),
('patient_id_prefix', 'PAT', 'string', 'Prefix for patient IDs', FALSE),
('doctor_id_prefix', 'DOC', 'string', 'Prefix for doctor IDs', FALSE),
('appointment_id_prefix', 'APT', 'string', 'Prefix for appointment IDs', FALSE),
('prescription_id_prefix', 'PRX', 'string', 'Prefix for prescription IDs', FALSE),
('bill_id_prefix', 'BIL', 'string', 'Prefix for bill IDs', FALSE);

-- Create triggers for automatic ID generation
DELIMITER //

CREATE TRIGGER `tr_patients_insert` BEFORE INSERT ON `patients`
FOR EACH ROW
BEGIN
  DECLARE next_id INT;
  SELECT COALESCE(MAX(CAST(SUBSTRING(patient_id, 4) AS UNSIGNED)), 0) + 1 INTO next_id FROM patients;
  SET NEW.patient_id = CONCAT('PAT', LPAD(next_id, 6, '0'));
END//

CREATE TRIGGER `tr_doctors_insert` BEFORE INSERT ON `doctors`
FOR EACH ROW
BEGIN
  DECLARE next_id INT;
  SELECT COALESCE(MAX(CAST(SUBSTRING(doctor_id, 4) AS UNSIGNED)), 0) + 1 INTO next_id FROM doctors;
  SET NEW.doctor_id = CONCAT('DOC', LPAD(next_id, 6, '0'));
END//

CREATE TRIGGER `tr_appointments_insert` BEFORE INSERT ON `appointments`
FOR EACH ROW
BEGIN
  DECLARE next_id INT;
  SELECT COALESCE(MAX(CAST(SUBSTRING(appointment_id, 4) AS UNSIGNED)), 0) + 1 INTO next_id FROM appointments;
  SET NEW.appointment_id = CONCAT('APT', LPAD(next_id, 6, '0'));
END//

CREATE TRIGGER `tr_prescriptions_insert` BEFORE INSERT ON `prescriptions`
FOR EACH ROW
BEGIN
  DECLARE next_id INT;
  SELECT COALESCE(MAX(CAST(SUBSTRING(prescription_id, 4) AS UNSIGNED)), 0) + 1 INTO next_id FROM prescriptions;
  SET NEW.prescription_id = CONCAT('PRX', LPAD(next_id, 6, '0'));
END//

CREATE TRIGGER `tr_billing_insert` BEFORE INSERT ON `billing`
FOR EACH ROW
BEGIN
  DECLARE next_id INT;
  SELECT COALESCE(MAX(CAST(SUBSTRING(bill_id, 4) AS UNSIGNED)), 0) + 1 INTO next_id FROM billing;
  SET NEW.bill_id = CONCAT('BIL', LPAD(next_id, 6, '0'));
END//

DELIMITER ;
