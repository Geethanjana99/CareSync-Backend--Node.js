-- Remove Doctor Availability System Migration
-- Migration: 011_remove_availability_system.sql  
-- Created: 2025-01-21
-- Description: Remove all availability-related tables, columns, and stored procedures

USE `caresync`;

-- Drop availability-related tables
DROP TABLE IF EXISTS `doctor_date_overrides`;
DROP TABLE IF EXISTS `doctor_default_availability`;
DROP TABLE IF EXISTS `doctor_availability`;

-- Remove availability-related columns from doctors table
ALTER TABLE `doctors` 
DROP COLUMN IF EXISTS `availability_status`,
DROP COLUMN IF EXISTS `default_start_time`,
DROP COLUMN IF EXISTS `default_end_time`, 
DROP COLUMN IF EXISTS `break_between_appointments`,
DROP COLUMN IF EXISTS `auto_accept_appointments`;

-- Drop availability-related stored procedures if they exist
DROP PROCEDURE IF EXISTS `GenerateDoctorTimeSlots`;
DROP PROCEDURE IF EXISTS `CheckDoctorAvailability`;
DROP PROCEDURE IF EXISTS `GetDoctorAvailableSlots`;

-- Drop availability-related views if they exist
DROP VIEW IF EXISTS `doctor_availability_view`;
DROP VIEW IF EXISTS `doctor_schedule_view`;

-- Drop availability-related triggers if they exist
DROP TRIGGER IF EXISTS `tr_doctor_availability_update`;
DROP TRIGGER IF EXISTS `tr_doctor_availability_insert`;

-- Drop availability-related indexes if they exist
-- (These will be automatically dropped when tables are dropped)

-- Create updated doctors table structure without availability columns
-- This is informational - the actual structure is maintained by previous migrations
/*
Doctors table structure after this migration:
- id (INT, Primary Key)
- user_id (INT, Foreign Key to users)
- doctor_id (VARCHAR(20), Unique)
- license_number (VARCHAR(100), Unique) 
- specialization (VARCHAR(200))
- subspecialty (VARCHAR(200))
- years_of_experience (INT)
- education (TEXT)
- certifications (TEXT)
- languages_spoken (JSON)
- consultation_fee (DECIMAL(8,2))
- bio (TEXT)
- hospital_affiliations (TEXT)
- awards_recognitions (TEXT)
- research_interests (TEXT)
- availability_hours (JSON) -- Basic availability still kept for simple schedule info
- appointment_duration (INT)
- advance_booking_days (INT)
- is_approved (BOOLEAN)
- approval_date (TIMESTAMP)
- approved_by (INT)
- rating (DECIMAL(3,2))
- total_reviews (INT)
- total_patients (INT)
- total_appointments (INT)
- working_hours (JSON) -- Basic working hours still kept
- commission_rate (DECIMAL(5,2))
- status (ENUM)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
*/

-- Add comment to indicate availability system removal
ALTER TABLE `doctors` COMMENT = 'Doctors table - availability management system removed in migration 011';
