-- ===================================================================
-- ADMIN REPORT UPLOAD SYSTEM - DATABASE SCHEMA ADDITIONS
-- ===================================================================
-- Tables for admin diabetes prediction inputs and PDF report uploads
-- ===================================================================

USE `caresync`;

-- ===================================================================
-- DIABETES PREDICTION REPORTS TABLE (Essential inputs only)
-- ===================================================================
CREATE TABLE IF NOT EXISTS `diabetes_predictions` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `patient_id` VARCHAR(36) NOT NULL,
  `admin_id` VARCHAR(36) NOT NULL,
  -- Essential prediction inputs (based on diabetes prediction model)
  `pregnancies` INT DEFAULT 0,
  `glucose` DECIMAL(5,2) NOT NULL,
  `bmi` DECIMAL(4,1) NOT NULL,
  `age` INT NOT NULL,
  `insulin` DECIMAL(6,2) DEFAULT 0,
  -- Prediction results from model
  `prediction_result` TINYINT(1) NULL COMMENT '0 = No Diabetes, 1 = Diabetes',
  `prediction_probability` DECIMAL(5,4) NULL COMMENT 'Probability score (0-1)',
  `risk_level` ENUM('low', 'medium', 'high') NULL,
  -- Status tracking
  `status` ENUM('pending', 'processed', 'reviewed') DEFAULT 'pending',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `processed_at` TIMESTAMP NULL,
  
  INDEX `idx_patient_id` (`patient_id`),
  INDEX `idx_admin_id` (`admin_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_prediction_result` (`prediction_result`),
  INDEX `idx_risk_level` (`risk_level`),
  
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- PDF REPORTS TABLE (Enhanced medical reports)
-- ===================================================================
CREATE TABLE IF NOT EXISTS `admin_medical_reports` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `patient_id` VARCHAR(36) NOT NULL,
  `admin_id` VARCHAR(36) NOT NULL,
  `report_type` ENUM('blood_test', 'urine_test', 'x_ray', 'mri', 'ct_scan', 'ultrasound', 'ecg', 'prescription', 'discharge_summary', 'lab_report', 'other') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `original_file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` BIGINT NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `file_hash` VARCHAR(64) NULL, -- For file integrity verification
  `tags` JSON NULL, -- For categorization and search
  `metadata` JSON NULL, -- Store additional file metadata
  `is_confidential` BOOLEAN DEFAULT FALSE,
  `expiry_date` DATE NULL,
  `status` ENUM('uploaded', 'processing', 'processed', 'reviewed', 'archived') DEFAULT 'uploaded',
  `notes` TEXT NULL,
  `upload_source` ENUM('admin_portal', 'api', 'bulk_upload') DEFAULT 'admin_portal',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reviewed_at` TIMESTAMP NULL,
  `reviewed_by` VARCHAR(36) NULL,
  
  INDEX `idx_patient_id` (`patient_id`),
  INDEX `idx_admin_id` (`admin_id`),
  INDEX `idx_report_type` (`report_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_file_name` (`file_name`),
  INDEX `idx_is_confidential` (`is_confidential`),
  INDEX `idx_upload_source` (`upload_source`),
  
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- REPORT ACCESS LOG TABLE (For audit trails)
-- ===================================================================
CREATE TABLE IF NOT EXISTS `report_access_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `report_id` VARCHAR(36) NOT NULL,
  `report_type` ENUM('diabetes_prediction', 'medical_report') NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `action` ENUM('created', 'viewed', 'downloaded', 'updated', 'deleted', 'shared') NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_report_id` (`report_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_report_type` (`report_type`),
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- NOTIFICATION SYSTEM FOR REPORTS
-- ===================================================================
CREATE TABLE IF NOT EXISTS `report_notifications` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `recipient_id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `report_id` VARCHAR(36) NULL,
  `report_type` ENUM('diabetes_prediction', 'medical_report') NULL,
  `notification_type` ENUM('new_report', 'report_processed', 'report_reviewed', 'urgent_finding') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `is_urgent` BOOLEAN DEFAULT FALSE,
  `read_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_recipient_id` (`recipient_id`),
  INDEX `idx_sender_id` (`sender_id`),
  INDEX `idx_is_read` (`is_read`),
  INDEX `idx_is_urgent` (`is_urgent`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_notification_type` (`notification_type`),
  
  FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- INSERT SAMPLE DATA FOR TESTING
-- ===================================================================

-- Sample diabetes prediction data
INSERT IGNORE INTO `diabetes_predictions` 
(`id`, `patient_id`, `admin_id`, `pregnancies`, `glucose`, `bmi`, `age`, `insulin`, `prediction_result`, `prediction_probability`, `risk_level`, `status`, `notes`)
SELECT 
  UUID(),
  p.id as patient_id,
  u.id as admin_id,
  2 as pregnancies,
  140.5 as glucose,
  28.5 as bmi,
  45 as age,
  168.0 as insulin,
  1 as prediction_result,
  0.7853 as prediction_probability,
  'medium' as risk_level,
  'processed' as status,
  'Sample diabetes prediction record for testing'
FROM patients p 
CROSS JOIN users u 
WHERE u.role = 'admin' AND p.patient_id LIKE 'PAT%'
LIMIT 1;

COMMIT;
