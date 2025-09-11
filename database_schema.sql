-- CareSync Database Schema
-- Generated on: 2025-09-11T03:36:11.467Z
-- Database: caresync

-- Drop existing database and recreate
DROP DATABASE IF EXISTS `caresync`;
CREATE DATABASE `caresync` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `caresync`;

-- Table: admin_medical_reports
CREATE TABLE "admin_medical_reports" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "patient_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "admin_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "report_type" enum('blood_test','urine_test','x_ray','mri','ct_scan','ultrasound','ecg','prescription','discharge_summary','lab_report','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  "title" varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "description" text COLLATE utf8mb4_unicode_ci,
  "file_name" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "original_file_name" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "file_path" varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  "file_size" bigint NOT NULL,
  "mime_type" varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  "file_hash" varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "tags" json DEFAULT NULL,
  "metadata" json DEFAULT NULL,
  "is_confidential" tinyint(1) NOT NULL DEFAULT '0',
  "expiry_date" datetime DEFAULT NULL,
  "status" enum('uploaded','processing','processed','reviewed','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'uploaded',
  "notes" text COLLATE utf8mb4_unicode_ci,
  "upload_source" varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin_portal',
  "reviewed_at" datetime DEFAULT NULL,
  "reviewed_by" varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "created_at" datetime NOT NULL,
  "updated_at" datetime NOT NULL,
  PRIMARY KEY ("id"),
  KEY "idx_amr_patient" ("patient_id"),
  KEY "idx_amr_admin" ("admin_id"),
  KEY "idx_amr_type" ("report_type"),
  KEY "idx_amr_status" ("status"),
  KEY "idx_amr_created" ("created_at")
);

-- Table: ai_prediction_certifications
CREATE TABLE "ai_prediction_certifications" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  "prediction_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "doctor_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "certification_status" enum('certified','rejected') COLLATE utf8mb4_unicode_ci NOT NULL,
  "doctor_notes" text COLLATE utf8mb4_unicode_ci NOT NULL,
  "clinical_assessment" text COLLATE utf8mb4_unicode_ci,
  "recommendations" text COLLATE utf8mb4_unicode_ci,
  "follow_up_required" tinyint(1) DEFAULT '0',
  "follow_up_date" date DEFAULT NULL,
  "severity_assessment" enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "certified_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "unique_prediction_certification" ("prediction_id","doctor_id"),
  KEY "idx_prediction_id" ("prediction_id"),
  KEY "idx_doctor_id" ("doctor_id"),
  KEY "idx_certification_status" ("certification_status"),
  KEY "idx_certified_at" ("certified_at"),
  KEY "idx_follow_up_required" ("follow_up_required"),
  KEY "idx_severity_assessment" ("severity_assessment"),
  CONSTRAINT "ai_prediction_certifications_ibfk_1" FOREIGN KEY ("prediction_id") REFERENCES "diabetes_predictions" ("id") ON DELETE CASCADE,
  CONSTRAINT "fk_doctor_certification" FOREIGN KEY ("doctor_id") REFERENCES "doctors" ("id") ON DELETE CASCADE
);

-- Table: appointment_details_view
undefined;

-- Table: appointments
CREATE TABLE "appointments" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  "appointment_id" varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  "patient_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "doctor_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "appointment_date" date NOT NULL,
  "queue_number" int DEFAULT NULL,
  "appointment_type" enum('consultation','follow-up','emergency','procedure') COLLATE utf8mb4_unicode_ci DEFAULT 'consultation',
  "status" enum('scheduled','confirmed','in-progress','completed','cancelled','no-show') COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  "reason_for_visit" text COLLATE utf8mb4_unicode_ci,
  "symptoms" text COLLATE utf8mb4_unicode_ci,
  "priority" enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  "notes" text COLLATE utf8mb4_unicode_ci,
  "cancellation_reason" text COLLATE utf8mb4_unicode_ci,
  "cancelled_by" varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "cancelled_at" timestamp NULL DEFAULT NULL,
  "confirmed_at" timestamp NULL DEFAULT NULL,
  "completed_at" timestamp NULL DEFAULT NULL,
  "consultation_fee" decimal(10,2) DEFAULT NULL,
  "scheduled_by" varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User who scheduled the appointment',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  "is_emergency" tinyint(1) DEFAULT '0',
  "queue_date" date NOT NULL DEFAULT (curdate()),
  PRIMARY KEY ("id"),
  UNIQUE KEY "appointment_id" ("appointment_id"),
  KEY "cancelled_by" ("cancelled_by"),
  KEY "scheduled_by" ("scheduled_by"),
  KEY "idx_appointment_id" ("appointment_id"),
  KEY "idx_patient_id" ("patient_id"),
  KEY "idx_doctor_id" ("doctor_id"),
  KEY "idx_appointment_date" ("appointment_date"),
  KEY "idx_status" ("status"),
  KEY "idx_appointment_type" ("appointment_type"),
  KEY "idx_priority" ("priority"),
  KEY "idx_created_at" ("created_at"),
  KEY "idx_appointments_doctor_date" ("doctor_id","appointment_date"),
  KEY "idx_appointments_patient_date" ("patient_id","appointment_date"),
  KEY "idx_appointments_status_date" ("status","appointment_date"),
  KEY "idx_queue_number" ("queue_number"),
  KEY "idx_doctor_date_time_queue" ("doctor_id","appointment_date","queue_number"),
  CONSTRAINT "appointments_ibfk_1" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE,
  CONSTRAINT "appointments_ibfk_2" FOREIGN KEY ("doctor_id") REFERENCES "doctors" ("id") ON DELETE CASCADE,
  CONSTRAINT "appointments_ibfk_3" FOREIGN KEY ("cancelled_by") REFERENCES "users" ("id") ON DELETE SET NULL,
  CONSTRAINT "appointments_ibfk_4" FOREIGN KEY ("scheduled_by") REFERENCES "users" ("id") ON DELETE SET NULL
);

-- Table: billing
CREATE TABLE "billing" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  "appointment_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "patient_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "doctor_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "invoice_number" varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  "amount" decimal(10,2) NOT NULL,
  "tax_amount" decimal(10,2) DEFAULT '0.00',
  "total_amount" decimal(10,2) NOT NULL,
  "payment_method" enum('cash','card','insurance','transfer','online') COLLATE utf8mb4_unicode_ci DEFAULT 'card',
  "payment_status" enum('pending','paid','partially_paid','refunded','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  "transaction_id" varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "payment_gateway" varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "due_date" date DEFAULT NULL,
  "paid_at" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "invoice_number" ("invoice_number"),
  KEY "idx_appointment_id" ("appointment_id"),
  KEY "idx_patient_id" ("patient_id"),
  KEY "idx_doctor_id" ("doctor_id"),
  KEY "idx_invoice_number" ("invoice_number"),
  KEY "idx_payment_status" ("payment_status"),
  KEY "idx_due_date" ("due_date"),
  KEY "idx_created_at" ("created_at"),
  CONSTRAINT "billing_ibfk_1" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE CASCADE,
  CONSTRAINT "billing_ibfk_2" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE,
  CONSTRAINT "billing_ibfk_3" FOREIGN KEY ("doctor_id") REFERENCES "doctors" ("id") ON DELETE CASCADE
);

-- Table: diabetes_predictions
CREATE TABLE "diabetes_predictions" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "patient_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "admin_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "pregnancies" int DEFAULT '0',
  "glucose" decimal(10,2) NOT NULL,
  "bmi" decimal(10,2) NOT NULL,
  "age" int NOT NULL,
  "insulin" decimal(10,2) DEFAULT '0.00',
  "prediction_result" tinyint DEFAULT NULL,
  "prediction_probability" decimal(5,4) DEFAULT NULL,
  "risk_level" enum('low','medium','high') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "status" enum('pending','processed','reviewed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  "notes" text COLLATE utf8mb4_unicode_ci,
  "processed_at" datetime DEFAULT NULL,
  "created_at" datetime NOT NULL,
  "updated_at" datetime NOT NULL,
  PRIMARY KEY ("id"),
  KEY "idx_dp_patient" ("patient_id"),
  KEY "idx_dp_admin" ("admin_id"),
  KEY "idx_dp_status" ("status"),
  KEY "idx_dp_risk" ("risk_level"),
  KEY "idx_dp_created" ("created_at")
);

-- Table: doctor_dashboard_view
undefined;

-- Table: doctors
CREATE TABLE "doctors" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  "user_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "doctor_id" varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  "specialty" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "license_number" varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  "years_of_experience" int DEFAULT NULL,
  "education" text COLLATE utf8mb4_unicode_ci,
  "certifications" text COLLATE utf8mb4_unicode_ci,
  "consultation_fee" decimal(10,2) DEFAULT NULL,
  "languages_spoken" json DEFAULT NULL COMMENT 'Array of languages: ["English", "Spanish"]',
  "office_address" text COLLATE utf8mb4_unicode_ci,
  "bio" text COLLATE utf8mb4_unicode_ci,
  "rating" decimal(3,2) DEFAULT '0.00',
  "total_reviews" int DEFAULT '0',
  "working_hours" json DEFAULT NULL COMMENT 'Weekly schedule object',
  "availability_status" enum('available','busy','offline') COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  "commission_rate" decimal(5,2) DEFAULT '25.00' COMMENT 'Percentage commission',
  "status" enum('active','inactive','suspended','pending_approval') COLLATE utf8mb4_unicode_ci DEFAULT 'pending_approval',
  "approved_at" timestamp NULL DEFAULT NULL,
  "approved_by" varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "total_appointments" int DEFAULT '0',
  "total_earnings" decimal(12,2) DEFAULT '0.00',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "doctor_id" ("doctor_id"),
  UNIQUE KEY "license_number" ("license_number"),
  KEY "approved_by" ("approved_by"),
  KEY "idx_doctor_id" ("doctor_id"),
  KEY "idx_user_id" ("user_id"),
  KEY "idx_specialty" ("specialty"),
  KEY "idx_license_number" ("license_number"),
  KEY "idx_status" ("status"),
  KEY "idx_rating" ("rating"),
  KEY "idx_availability_status" ("availability_status"),
  KEY "idx_doctors_specialty_status" ("specialty","status"),
  CONSTRAINT "doctors_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "doctors_ibfk_2" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE SET NULL
);

-- Table: email_verification_tokens
CREATE TABLE "email_verification_tokens" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  "user_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "token" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "expires_at" timestamp NOT NULL,
  "is_used" tinyint(1) DEFAULT '0',
  "used_at" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "idx_user_id" ("user_id"),
  KEY "idx_token" ("token"),
  KEY "idx_expires_at" ("expires_at"),
  KEY "idx_is_used" ("is_used"),
  CONSTRAINT "email_verification_tokens_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Table: invoice_items
CREATE TABLE "invoice_items" (
  "id" varchar(36) NOT NULL,
  "invoice_id" varchar(36) NOT NULL,
  "description" varchar(255) NOT NULL,
  "quantity" int NOT NULL DEFAULT '1',
  "rate" decimal(10,2) NOT NULL,
  "amount" decimal(10,2) NOT NULL,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "idx_invoice_id" ("invoice_id"),
  CONSTRAINT "invoice_items_ibfk_1" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE
);

-- Table: invoices
CREATE TABLE "invoices" (
  "id" varchar(36) NOT NULL,
  "invoice_number" varchar(50) NOT NULL,
  "patient_name" varchar(255) NOT NULL,
  "appointment_date" date DEFAULT NULL,
  "due_date" date NOT NULL,
  "total_amount" decimal(10,2) NOT NULL,
  "status" enum('pending','paid','overdue','cancelled') DEFAULT 'pending',
  "notes" text,
  "generated_date" date NOT NULL,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "invoice_number" ("invoice_number"),
  KEY "idx_status" ("status"),
  KEY "idx_generated_date" ("generated_date")
);

-- Table: login_attempts
CREATE TABLE "login_attempts" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  "email" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "ip_address" varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  "user_agent" text COLLATE utf8mb4_unicode_ci,
  "success" tinyint(1) NOT NULL,
  "failure_reason" varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "attempted_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "idx_email" ("email"),
  KEY "idx_ip_address" ("ip_address"),
  KEY "idx_success" ("success"),
  KEY "idx_attempted_at" ("attempted_at")
);

-- Table: medical_reports
CREATE TABLE "medical_reports" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  "patient_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "doctor_id" varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "appointment_id" varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "title" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "description" text COLLATE utf8mb4_unicode_ci,
  "report_type" enum('lab-report','prescription','scan','x-ray','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  "file_name" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "file_path" varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  "file_size" bigint DEFAULT NULL,
  "mime_type" varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "status" enum('pending','reviewed','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  "reviewed_by" varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "reviewed_at" timestamp NULL DEFAULT NULL,
  "review_notes" text COLLATE utf8mb4_unicode_ci,
  "uploaded_by" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "reviewed_by" ("reviewed_by"),
  KEY "uploaded_by" ("uploaded_by"),
  KEY "idx_patient_id" ("patient_id"),
  KEY "idx_doctor_id" ("doctor_id"),
  KEY "idx_appointment_id" ("appointment_id"),
  KEY "idx_report_type" ("report_type"),
  KEY "idx_status" ("status"),
  KEY "idx_created_at" ("created_at"),
  CONSTRAINT "medical_reports_ibfk_1" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE,
  CONSTRAINT "medical_reports_ibfk_2" FOREIGN KEY ("doctor_id") REFERENCES "doctors" ("id") ON DELETE SET NULL,
  CONSTRAINT "medical_reports_ibfk_3" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE SET NULL,
  CONSTRAINT "medical_reports_ibfk_4" FOREIGN KEY ("reviewed_by") REFERENCES "users" ("id") ON DELETE SET NULL,
  CONSTRAINT "medical_reports_ibfk_5" FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Table: medical_specialties
CREATE TABLE "medical_specialties" (
  "id" int NOT NULL AUTO_INCREMENT,
  "name" varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  "description" text COLLATE utf8mb4_unicode_ci,
  "is_active" tinyint(1) DEFAULT '1',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "name" ("name")
);

-- Table: password_reset_requests
CREATE TABLE "password_reset_requests" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  "user_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "token" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "expires_at" timestamp NOT NULL,
  "is_used" tinyint(1) DEFAULT '0',
  "used_at" timestamp NULL DEFAULT NULL,
  "ip_address" varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "user_agent" text COLLATE utf8mb4_unicode_ci,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "idx_user_id" ("user_id"),
  KEY "idx_token" ("token"),
  KEY "idx_expires_at" ("expires_at"),
  KEY "idx_is_used" ("is_used"),
  CONSTRAINT "password_reset_requests_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Table: patients
CREATE TABLE "patients" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  "user_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "patient_id" varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  "date_of_birth" date DEFAULT NULL,
  "gender" enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "address" text COLLATE utf8mb4_unicode_ci,
  "emergency_contact_name" varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "emergency_contact_phone" varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "medical_history" text COLLATE utf8mb4_unicode_ci,
  "allergies" text COLLATE utf8mb4_unicode_ci,
  "current_medications" text COLLATE utf8mb4_unicode_ci,
  "insurance_provider" varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "insurance_policy_number" varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "blood_type" varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "height" decimal(5,2) DEFAULT NULL COMMENT 'Height in cm',
  "weight" decimal(5,2) DEFAULT NULL COMMENT 'Weight in kg',
  "occupation" varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "marital_status" enum('single','married','divorced','widowed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "preferred_language" varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'English',
  "status" enum('active','inactive','suspended') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "patient_id" ("patient_id"),
  KEY "idx_patient_id" ("patient_id"),
  KEY "idx_user_id" ("user_id"),
  KEY "idx_status" ("status"),
  KEY "idx_date_of_birth" ("date_of_birth"),
  CONSTRAINT "patients_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Table: queue_status
CREATE TABLE "queue_status" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  "doctor_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "queue_date" date NOT NULL,
  "current_number" varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '0',
  "current_emergency_number" varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'E0',
  "max_emergency_slots" int DEFAULT '5',
  "emergency_used" int DEFAULT '0',
  "regular_count" int DEFAULT '0',
  "available_from" time DEFAULT '09:00:00',
  "available_to" time DEFAULT '17:00:00',
  "is_active" tinyint(1) DEFAULT '1',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "idx_queue_date" ("queue_date"),
  KEY "idx_doctor_date" ("doctor_id","queue_date")
);

-- Table: refresh_tokens
CREATE TABLE "refresh_tokens" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  "user_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "token_hash" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "expires_at" timestamp NOT NULL,
  "is_revoked" tinyint(1) DEFAULT '0',
  "device_info" json DEFAULT NULL COMMENT 'Device information for security',
  "ip_address" varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "user_agent" text COLLATE utf8mb4_unicode_ci,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "idx_user_id" ("user_id"),
  KEY "idx_token_hash" ("token_hash"),
  KEY "idx_expires_at" ("expires_at"),
  KEY "idx_is_revoked" ("is_revoked"),
  CONSTRAINT "refresh_tokens_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Table: reviews
CREATE TABLE "reviews" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  "appointment_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "patient_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "doctor_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "rating" int NOT NULL,
  "review_text" text COLLATE utf8mb4_unicode_ci,
  "is_anonymous" tinyint(1) DEFAULT '0',
  "is_approved" tinyint(1) DEFAULT '1',
  "approved_by" varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "approved_at" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "unique_review" ("appointment_id","patient_id"),
  KEY "approved_by" ("approved_by"),
  KEY "idx_appointment_id" ("appointment_id"),
  KEY "idx_patient_id" ("patient_id"),
  KEY "idx_doctor_id" ("doctor_id"),
  KEY "idx_rating" ("rating"),
  KEY "idx_is_approved" ("is_approved"),
  KEY "idx_created_at" ("created_at"),
  CONSTRAINT "reviews_ibfk_1" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE CASCADE,
  CONSTRAINT "reviews_ibfk_2" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE,
  CONSTRAINT "reviews_ibfk_3" FOREIGN KEY ("doctor_id") REFERENCES "doctors" ("id") ON DELETE CASCADE,
  CONSTRAINT "reviews_ibfk_4" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE SET NULL,
  CONSTRAINT "reviews_chk_1" CHECK (((`rating` >= 1) and (`rating` <= 5)))
);

-- Table: user_sessions
CREATE TABLE "user_sessions" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  "user_id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  "session_token" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "ip_address" varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "user_agent" text COLLATE utf8mb4_unicode_ci,
  "is_active" tinyint(1) DEFAULT '1',
  "last_activity" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "idx_user_id" ("user_id"),
  KEY "idx_session_token" ("session_token"),
  KEY "idx_is_active" ("is_active"),
  KEY "idx_expires_at" ("expires_at"),
  CONSTRAINT "user_sessions_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Table: users
CREATE TABLE "users" (
  "id" varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  "name" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "email" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "password_hash" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "role" enum('patient','doctor','admin','billing') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'patient',
  "avatar_url" varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "phone" varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "is_active" tinyint(1) DEFAULT '1',
  "email_verified" tinyint(1) DEFAULT '0',
  "last_login" timestamp NULL DEFAULT NULL,
  "password_reset_token" varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "password_reset_expires" timestamp NULL DEFAULT NULL,
  "email_verification_token" varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "email_verification_expires" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "email" ("email"),
  KEY "idx_email" ("email"),
  KEY "idx_role" ("role"),
  KEY "idx_active" ("is_active"),
  KEY "idx_last_login" ("last_login"),
  KEY "idx_password_reset_token" ("password_reset_token"),
  KEY "idx_email_verification_token" ("email_verification_token"),
  KEY "idx_users_role_active" ("role","is_active")
);

-- Foreign Key Constraints
-- Foreign key relationships found:
-- ai_prediction_certifications.prediction_id -> diabetes_predictions.id
-- ai_prediction_certifications.doctor_id -> doctors.id
-- appointments.patient_id -> patients.id
-- appointments.doctor_id -> doctors.id
-- appointments.cancelled_by -> users.id
-- appointments.scheduled_by -> users.id
-- billing.appointment_id -> appointments.id
-- billing.patient_id -> patients.id
-- billing.doctor_id -> doctors.id
-- doctors.user_id -> users.id
-- doctors.approved_by -> users.id
-- email_verification_tokens.user_id -> users.id
-- invoice_items.invoice_id -> invoices.id
-- medical_reports.patient_id -> patients.id
-- medical_reports.doctor_id -> doctors.id
-- medical_reports.appointment_id -> appointments.id
-- medical_reports.reviewed_by -> users.id
-- medical_reports.uploaded_by -> users.id
-- password_reset_requests.user_id -> users.id
-- patients.user_id -> users.id
-- refresh_tokens.user_id -> users.id
-- reviews.appointment_id -> appointments.id
-- reviews.patient_id -> patients.id
-- reviews.doctor_id -> doctors.id
-- reviews.approved_by -> users.id
-- user_sessions.user_id -> users.id

-- Indexes
-- Indexes for table: admin_medical_reports
--  INDEX idx_amr_patient on patient_id
--  INDEX idx_amr_admin on admin_id
--  INDEX idx_amr_type on report_type
--  INDEX idx_amr_status on status
--  INDEX idx_amr_created on created_at

-- Indexes for table: ai_prediction_certifications
-- UNIQUE INDEX unique_prediction_certification on prediction_id
--  INDEX idx_prediction_id on prediction_id
--  INDEX idx_doctor_id on doctor_id
--  INDEX idx_certification_status on certification_status
--  INDEX idx_certified_at on certified_at
--  INDEX idx_follow_up_required on follow_up_required
--  INDEX idx_severity_assessment on severity_assessment

-- Indexes for table: appointments
-- UNIQUE INDEX appointment_id on appointment_id
--  INDEX cancelled_by on cancelled_by
--  INDEX scheduled_by on scheduled_by
--  INDEX idx_appointment_id on appointment_id
--  INDEX idx_patient_id on patient_id
--  INDEX idx_doctor_id on doctor_id
--  INDEX idx_appointment_date on appointment_date
--  INDEX idx_status on status
--  INDEX idx_appointment_type on appointment_type
--  INDEX idx_priority on priority
--  INDEX idx_created_at on created_at
--  INDEX idx_appointments_doctor_date on doctor_id
--  INDEX idx_appointments_patient_date on patient_id
--  INDEX idx_appointments_status_date on status
--  INDEX idx_queue_number on queue_number
--  INDEX idx_doctor_date_time_queue on doctor_id

-- Indexes for table: billing
-- UNIQUE INDEX invoice_number on invoice_number
--  INDEX idx_appointment_id on appointment_id
--  INDEX idx_patient_id on patient_id
--  INDEX idx_doctor_id on doctor_id
--  INDEX idx_invoice_number on invoice_number
--  INDEX idx_payment_status on payment_status
--  INDEX idx_due_date on due_date
--  INDEX idx_created_at on created_at

-- Indexes for table: diabetes_predictions
--  INDEX idx_dp_patient on patient_id
--  INDEX idx_dp_admin on admin_id
--  INDEX idx_dp_status on status
--  INDEX idx_dp_risk on risk_level
--  INDEX idx_dp_created on created_at

-- Indexes for table: doctors
-- UNIQUE INDEX doctor_id on doctor_id
-- UNIQUE INDEX license_number on license_number
--  INDEX approved_by on approved_by
--  INDEX idx_doctor_id on doctor_id
--  INDEX idx_user_id on user_id
--  INDEX idx_specialty on specialty
--  INDEX idx_license_number on license_number
--  INDEX idx_status on status
--  INDEX idx_rating on rating
--  INDEX idx_availability_status on availability_status
--  INDEX idx_doctors_specialty_status on specialty

-- Indexes for table: email_verification_tokens
--  INDEX idx_user_id on user_id
--  INDEX idx_token on token
--  INDEX idx_expires_at on expires_at
--  INDEX idx_is_used on is_used

-- Indexes for table: invoice_items
--  INDEX idx_invoice_id on invoice_id

-- Indexes for table: invoices
-- UNIQUE INDEX invoice_number on invoice_number
--  INDEX idx_status on status
--  INDEX idx_generated_date on generated_date

-- Indexes for table: login_attempts
--  INDEX idx_email on email
--  INDEX idx_ip_address on ip_address
--  INDEX idx_success on success
--  INDEX idx_attempted_at on attempted_at

-- Indexes for table: medical_reports
--  INDEX reviewed_by on reviewed_by
--  INDEX uploaded_by on uploaded_by
--  INDEX idx_patient_id on patient_id
--  INDEX idx_doctor_id on doctor_id
--  INDEX idx_appointment_id on appointment_id
--  INDEX idx_report_type on report_type
--  INDEX idx_status on status
--  INDEX idx_created_at on created_at

-- Indexes for table: medical_specialties
-- UNIQUE INDEX name on name

-- Indexes for table: password_reset_requests
--  INDEX idx_user_id on user_id
--  INDEX idx_token on token
--  INDEX idx_expires_at on expires_at
--  INDEX idx_is_used on is_used

-- Indexes for table: patients
-- UNIQUE INDEX patient_id on patient_id
--  INDEX idx_patient_id on patient_id
--  INDEX idx_user_id on user_id
--  INDEX idx_status on status
--  INDEX idx_date_of_birth on date_of_birth

-- Indexes for table: queue_status
--  INDEX idx_queue_date on queue_date
--  INDEX idx_doctor_date on doctor_id

-- Indexes for table: refresh_tokens
--  INDEX idx_user_id on user_id
--  INDEX idx_token_hash on token_hash
--  INDEX idx_expires_at on expires_at
--  INDEX idx_is_revoked on is_revoked

-- Indexes for table: reviews
-- UNIQUE INDEX unique_review on appointment_id
--  INDEX approved_by on approved_by
--  INDEX idx_appointment_id on appointment_id
--  INDEX idx_patient_id on patient_id
--  INDEX idx_doctor_id on doctor_id
--  INDEX idx_rating on rating
--  INDEX idx_is_approved on is_approved
--  INDEX idx_created_at on created_at

-- Indexes for table: user_sessions
--  INDEX idx_user_id on user_id
--  INDEX idx_session_token on session_token
--  INDEX idx_is_active on is_active
--  INDEX idx_expires_at on expires_at

-- Indexes for table: users
-- UNIQUE INDEX email on email
--  INDEX idx_email on email
--  INDEX idx_role on role
--  INDEX idx_active on is_active
--  INDEX idx_last_login on last_login
--  INDEX idx_password_reset_token on password_reset_token
--  INDEX idx_email_verification_token on email_verification_token
--  INDEX idx_users_role_active on role

-- Table Statistics
-- admin_medical_reports: 0 rows, 16 KB data, 80 KB indexes
-- ai_prediction_certifications: 4 rows, 16 KB data, 112 KB indexes
-- appointment_details_view: null rows, 0 KB data, 0 KB indexes
-- appointments: 85 rows, 48 KB data, 256 KB indexes
-- billing: 0 rows, 16 KB data, 128 KB indexes
-- diabetes_predictions: 6 rows, 16 KB data, 80 KB indexes
-- doctor_dashboard_view: null rows, 0 KB data, 0 KB indexes
-- doctors: 38 rows, 16 KB data, 176 KB indexes
-- email_verification_tokens: 0 rows, 16 KB data, 64 KB indexes
-- invoice_items: 23 rows, 16 KB data, 16 KB indexes
-- invoices: 8 rows, 16 KB data, 48 KB indexes
-- login_attempts: 0 rows, 16 KB data, 64 KB indexes
-- medical_reports: 0 rows, 16 KB data, 128 KB indexes
-- medical_specialties: 12 rows, 16 KB data, 16 KB indexes
-- password_reset_requests: 0 rows, 16 KB data, 64 KB indexes
-- patients: 14 rows, 16 KB data, 80 KB indexes
-- queue_status: 52 rows, 16 KB data, 32 KB indexes
-- refresh_tokens: 0 rows, 16 KB data, 64 KB indexes
-- reviews: 0 rows, 16 KB data, 128 KB indexes
-- user_sessions: 0 rows, 16 KB data, 64 KB indexes
-- users: 63 rows, 16 KB data, 128 KB indexes
