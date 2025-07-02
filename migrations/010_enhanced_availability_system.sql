-- Enhanced Doctor Availability System Migration
-- Migration: 010_enhanced_availability_system.sql
-- Created: 2025-07-02
-- Description: Enhance availability system with default hours, date overrides, and better configuration

USE `caresync`;

-- Add enhanced availability settings to doctors table
ALTER TABLE `doctors` 
ADD COLUMN `default_start_time` TIME DEFAULT '09:00:00' AFTER `working_hours`,
ADD COLUMN `default_end_time` TIME DEFAULT '17:00:00' AFTER `default_start_time`,
ADD COLUMN `break_between_appointments` INT DEFAULT 5 AFTER `default_end_time`,
ADD COLUMN `auto_accept_appointments` BOOLEAN DEFAULT FALSE AFTER `break_between_appointments`;

-- Create doctor default availability settings table
CREATE TABLE IF NOT EXISTS `doctor_default_availability` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `doctor_id` INT NOT NULL,
  `start_time` TIME NOT NULL DEFAULT '09:00:00',
  `end_time` TIME NOT NULL DEFAULT '17:00:00',
  `break_duration` INT NOT NULL DEFAULT 5,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_doctor_default` (`doctor_id`),
  INDEX `idx_doctor_id` (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhance doctor_availability table with additional fields
ALTER TABLE `doctor_availability` 
ADD COLUMN `is_default` BOOLEAN DEFAULT TRUE AFTER `max_appointments`,
ADD COLUMN `break_duration` INT DEFAULT 5 AFTER `is_default`;

-- Create doctor date overrides table for specific date availability
CREATE TABLE IF NOT EXISTS `doctor_date_overrides` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `doctor_id` INT NOT NULL,
  `override_date` DATE NOT NULL,
  `is_unavailable` BOOLEAN DEFAULT FALSE,
  `custom_start_time` TIME NULL,
  `custom_end_time` TIME NULL,
  `reason` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_doctor_date` (`doctor_id`, `override_date`),
  INDEX `idx_doctor_id` (`doctor_id`),
  INDEX `idx_override_date` (`override_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create doctor availability slots table for more granular time slot management
CREATE TABLE IF NOT EXISTS `doctor_availability_slots` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `doctor_id` INT NOT NULL,
  `slot_date` DATE NOT NULL,
  `slot_time` TIME NOT NULL,
  `is_available` BOOLEAN DEFAULT TRUE,
  `is_booked` BOOLEAN DEFAULT FALSE,
  `appointment_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `unique_doctor_slot` (`doctor_id`, `slot_date`, `slot_time`),
  INDEX `idx_doctor_id` (`doctor_id`),
  INDEX `idx_slot_date` (`slot_date`),
  INDEX `idx_availability` (`is_available`, `is_booked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default availability settings for existing doctors
INSERT INTO `doctor_default_availability` (`doctor_id`, `start_time`, `end_time`, `break_duration`)
SELECT 
  `id` as doctor_id,
  COALESCE(`default_start_time`, '09:00:00') as start_time,
  COALESCE(`default_end_time`, '17:00:00') as end_time,
  COALESCE(`break_between_appointments`, 5) as break_duration
FROM `doctors`
WHERE NOT EXISTS (
  SELECT 1 FROM `doctor_default_availability` 
  WHERE `doctor_default_availability`.`doctor_id` = `doctors`.`id`
);

-- Update existing doctor_availability records to mark them as default
UPDATE `doctor_availability` SET 
  `is_default` = TRUE,
  `break_duration` = 5
WHERE `is_default` IS NULL;

-- Create indexes for better performance
CREATE INDEX `idx_doctors_availability_status` ON `doctors`(`availability_status`);
CREATE INDEX `idx_doctors_auto_accept` ON `doctors`(`auto_accept_appointments`);
CREATE INDEX `idx_date_overrides_date_range` ON `doctor_date_overrides`(`override_date`, `is_unavailable`);

-- Create view for doctor complete availability
CREATE OR REPLACE VIEW `doctor_complete_availability` AS
SELECT 
  d.id as doctor_id,
  d.doctor_id as doctor_code,
  CONCAT(u.first_name, ' ', u.last_name) as doctor_name,
  d.availability_status,
  d.auto_accept_appointments,
  d.default_start_time,
  d.default_end_time,
  d.break_between_appointments,
  dda.start_time as default_hours_start,
  dda.end_time as default_hours_end,
  dda.break_duration as default_break,
  da.day_of_week,
  da.start_time as weekly_start,
  da.end_time as weekly_end,
  da.is_available as weekly_available,
  da.is_default as is_weekly_default
FROM `doctors` d
LEFT JOIN `users` u ON d.user_id = u.id
LEFT JOIN `doctor_default_availability` dda ON d.id = dda.doctor_id
LEFT JOIN `doctor_availability` da ON d.id = da.doctor_id
WHERE d.is_approved = TRUE AND u.is_active = TRUE;

-- Create stored procedure to check doctor availability for a specific date and time
DELIMITER $$
CREATE PROCEDURE `CheckDoctorAvailability`(
  IN p_doctor_id INT,
  IN p_check_date DATE,
  IN p_check_time TIME
)
BEGIN
  DECLARE v_day_name VARCHAR(10);
  DECLARE v_is_available BOOLEAN DEFAULT FALSE;
  DECLARE v_has_override BOOLEAN DEFAULT FALSE;
  DECLARE v_override_unavailable BOOLEAN DEFAULT FALSE;
  
  -- Get day name
  SET v_day_name = DAYNAME(p_check_date);
  
  -- Check if there's a date override
  SELECT COUNT(*) > 0, COALESCE(MAX(is_unavailable), FALSE)
  INTO v_has_override, v_override_unavailable
  FROM doctor_date_overrides 
  WHERE doctor_id = p_doctor_id AND override_date = p_check_date;
  
  -- If there's an override and it's unavailable, return not available
  IF v_has_override AND v_override_unavailable THEN
    SELECT FALSE as is_available, 'Doctor is unavailable on this date' as reason;
  ELSE
    -- Check regular availability or override custom hours
    IF v_has_override THEN
      -- Check custom hours from override
      SELECT COUNT(*) > 0 INTO v_is_available
      FROM doctor_date_overrides 
      WHERE doctor_id = p_doctor_id 
        AND override_date = p_check_date
        AND is_unavailable = FALSE
        AND p_check_time BETWEEN custom_start_time AND custom_end_time;
    ELSE
      -- Check regular weekly availability
      SELECT COUNT(*) > 0 INTO v_is_available
      FROM doctor_availability 
      WHERE doctor_id = p_doctor_id 
        AND day_of_week = v_day_name
        AND is_available = TRUE
        AND p_check_time BETWEEN start_time AND end_time;
    END IF;
    
    SELECT v_is_available as is_available, 
           CASE WHEN v_is_available THEN 'Available' ELSE 'Not available at this time' END as reason;
  END IF;
END$$
DELIMITER ;

-- Create stored procedure to generate available time slots for a doctor on a specific date
DELIMITER $$
CREATE PROCEDURE `GenerateDoctorTimeSlots`(
  IN p_doctor_id INT,
  IN p_slot_date DATE
)
BEGIN
  DECLARE v_day_name VARCHAR(10);
  DECLARE v_start_time TIME;
  DECLARE v_end_time TIME;
  DECLARE v_break_duration INT;
  DECLARE v_current_time TIME;
  DECLARE v_has_override BOOLEAN DEFAULT FALSE;
  DECLARE v_override_unavailable BOOLEAN DEFAULT FALSE;
  
  SET v_day_name = DAYNAME(p_slot_date);
  
  -- Check for date override
  SELECT COUNT(*) > 0, COALESCE(MAX(is_unavailable), FALSE),
         COALESCE(MAX(custom_start_time), NULL),
         COALESCE(MAX(custom_end_time), NULL)
  INTO v_has_override, v_override_unavailable, v_start_time, v_end_time
  FROM doctor_date_overrides 
  WHERE doctor_id = p_doctor_id AND override_date = p_slot_date;
  
  -- If unavailable, return empty result
  IF v_override_unavailable THEN
    SELECT 'No slots available - Doctor unavailable' as message;
  ELSE
    -- If no override, get regular availability
    IF NOT v_has_override OR v_start_time IS NULL THEN
      SELECT da.start_time, da.end_time, 
             COALESCE(d.break_between_appointments, 5)
      INTO v_start_time, v_end_time, v_break_duration
      FROM doctor_availability da
      JOIN doctors d ON da.doctor_id = d.id
      WHERE da.doctor_id = p_doctor_id 
        AND da.day_of_week = v_day_name 
        AND da.is_available = TRUE
      LIMIT 1;
    ELSE
      -- Use override custom hours
      SELECT COALESCE(d.break_between_appointments, 5)
      INTO v_break_duration
      FROM doctors d WHERE d.id = p_doctor_id;
    END IF;
    
    -- Generate time slots if we have valid times
    IF v_start_time IS NOT NULL AND v_end_time IS NOT NULL THEN
      -- Create temporary table for slots
      DROP TEMPORARY TABLE IF EXISTS temp_slots;
      CREATE TEMPORARY TABLE temp_slots (
        slot_time TIME,
        is_available BOOLEAN DEFAULT TRUE,
        is_booked BOOLEAN DEFAULT FALSE
      );
      
      SET v_current_time = v_start_time;
      
      -- Generate slots (using 30-minute default slots)
      WHILE v_current_time < v_end_time DO
        INSERT INTO temp_slots (slot_time) VALUES (v_current_time);
        SET v_current_time = ADDTIME(v_current_time, SEC_TO_TIME((30 + v_break_duration) * 60));
      END WHILE;
      
      -- Update booked slots
      UPDATE temp_slots ts
      JOIN appointments a ON DATE(a.appointment_datetime) = p_slot_date 
        AND TIME(a.appointment_datetime) = ts.slot_time
        AND a.doctor_id = p_doctor_id
        AND a.status NOT IN ('cancelled', 'no-show')
      SET ts.is_booked = TRUE, ts.is_available = FALSE;
      
      -- Return available slots
      SELECT slot_time, is_available, is_booked FROM temp_slots ORDER BY slot_time;
      
      DROP TEMPORARY TABLE temp_slots;
    ELSE
      SELECT 'No availability configured for this day' as message;
    END IF;
  END IF;
END$$
DELIMITER ;

-- Add triggers to maintain data consistency
DELIMITER $$
CREATE TRIGGER `tr_doctor_default_availability_insert` 
AFTER INSERT ON `doctor_default_availability`
FOR EACH ROW
BEGIN
  -- Update doctor's default times when default availability is created
  UPDATE `doctors` SET 
    `default_start_time` = NEW.start_time,
    `default_end_time` = NEW.end_time,
    `break_between_appointments` = NEW.break_duration
  WHERE `id` = NEW.doctor_id;
END$$

CREATE TRIGGER `tr_doctor_default_availability_update` 
AFTER UPDATE ON `doctor_default_availability`
FOR EACH ROW
BEGIN
  -- Update doctor's default times when default availability is updated
  UPDATE `doctors` SET 
    `default_start_time` = NEW.start_time,
    `default_end_time` = NEW.end_time,
    `break_between_appointments` = NEW.break_duration
  WHERE `id` = NEW.doctor_id;
END$$
DELIMITER ;

-- Insert initial data for testing
INSERT INTO `doctor_date_overrides` (`doctor_id`, `override_date`, `is_unavailable`, `reason`) 
SELECT id, '2025-12-25', TRUE, 'Christmas Holiday' FROM `doctors` WHERE is_approved = TRUE;

INSERT INTO `doctor_date_overrides` (`doctor_id`, `override_date`, `is_unavailable`, `reason`) 
SELECT id, '2025-01-01', TRUE, 'New Year Holiday' FROM `doctors` WHERE is_approved = TRUE;

-- Create indexes for optimal performance
CREATE INDEX `idx_appointments_doctor_datetime` ON `appointments`(`doctor_id`, `appointment_datetime`);
CREATE INDEX `idx_availability_doctor_day` ON `doctor_availability`(`doctor_id`, `day_of_week`, `is_available`);

COMMIT;
