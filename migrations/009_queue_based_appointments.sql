-- Migration: Convert to Queue-Based Appointment System
-- Date: 2025-06-30

-- 1. Modify appointments table for queue system
ALTER TABLE appointments 
ADD COLUMN queue_number VARCHAR(10) DEFAULT NULL COMMENT 'Queue number (e.g., 1, 2, E1, E2)',
ADD COLUMN is_emergency BOOLEAN DEFAULT FALSE COMMENT 'Emergency appointment flag',
ADD COLUMN queue_date DATE NOT NULL DEFAULT (CURDATE()) COMMENT 'Date for queue ordering';

-- 2. Create queue_status table to track daily queue progress
CREATE TABLE IF NOT EXISTS queue_status (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  doctor_id VARCHAR(36) NOT NULL,
  queue_date DATE NOT NULL,
  current_number VARCHAR(10) DEFAULT '0' COMMENT 'Current queue number being served',
  current_emergency_number VARCHAR(10) DEFAULT 'E0' COMMENT 'Current emergency number being served',
  max_emergency_slots INT DEFAULT 5 COMMENT 'Maximum emergency slots per day',
  emergency_used INT DEFAULT 0 COMMENT 'Emergency slots used today',
  regular_count INT DEFAULT 0 COMMENT 'Regular queue count',
  available_from TIME DEFAULT '09:00:00' COMMENT 'Doctor available from time',
  available_to TIME DEFAULT '17:00:00' COMMENT 'Doctor available to time',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Queue is active for the day',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  UNIQUE KEY unique_doctor_date (doctor_id, queue_date),
  INDEX idx_queue_date (queue_date),
  INDEX idx_doctor_date (doctor_id, queue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Add doctor availability fields
ALTER TABLE doctors 
ADD COLUMN available_from TIME DEFAULT '09:00:00' COMMENT 'Daily availability start time',
ADD COLUMN available_to TIME DEFAULT '17:00:00' COMMENT 'Daily availability end time',
ADD COLUMN max_daily_patients INT DEFAULT 50 COMMENT 'Maximum patients per day',
ADD COLUMN emergency_slots_per_day INT DEFAULT 5 COMMENT 'Emergency slots available per day';

-- 4. Update appointment status values (ensure they match our new system)
ALTER TABLE appointments 
MODIFY COLUMN status ENUM('pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show') DEFAULT 'pending';

-- 5. Create indexes for better performance
CREATE INDEX idx_appointments_queue ON appointments(doctor_id, queue_date, queue_number);
CREATE INDEX idx_appointments_emergency ON appointments(doctor_id, queue_date, is_emergency);
CREATE INDEX idx_appointments_status_queue ON appointments(doctor_id, queue_date, status);

-- 6. Create a trigger to automatically create queue_status when first appointment is booked
DELIMITER $$
CREATE TRIGGER create_queue_status_on_first_appointment
BEFORE INSERT ON appointments
FOR EACH ROW
BEGIN
  DECLARE queue_exists INT DEFAULT 0;
  
  -- Check if queue_status exists for this doctor and date
  SELECT COUNT(*) INTO queue_exists 
  FROM queue_status 
  WHERE doctor_id = NEW.doctor_id AND queue_date = NEW.queue_date;
  
  -- If no queue exists, create one with doctor's default availability
  IF queue_exists = 0 THEN
    INSERT INTO queue_status (
      doctor_id, 
      queue_date, 
      current_number, 
      current_emergency_number,
      max_emergency_slots,
      emergency_used,
      regular_count,
      available_from,
      available_to
    )
    SELECT 
      NEW.doctor_id,
      NEW.queue_date,
      '0',
      'E0',
      COALESCE(d.emergency_slots_per_day, 5),
      0,
      0,
      COALESCE(d.available_from, '09:00:00'),
      COALESCE(d.available_to, '17:00:00')
    FROM doctors d 
    WHERE d.id = NEW.doctor_id;
  END IF;
END$$
DELIMITER ;

-- 7. Create function to get next queue number
DELIMITER $$
CREATE FUNCTION get_next_queue_number(
  p_doctor_id VARCHAR(36), 
  p_queue_date DATE, 
  p_is_emergency BOOLEAN
) RETURNS VARCHAR(10)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE next_number VARCHAR(10);
  DECLARE current_count INT;
  DECLARE emergency_count INT;
  DECLARE max_emergency INT;
  
  IF p_is_emergency THEN
    -- Get current emergency count and max allowed
    SELECT 
      COALESCE(emergency_used, 0),
      COALESCE(max_emergency_slots, 5)
    INTO emergency_count, max_emergency
    FROM queue_status 
    WHERE doctor_id = p_doctor_id AND queue_date = p_queue_date;
    
    -- Check if emergency slots available
    IF emergency_count < max_emergency THEN
      SET next_number = CONCAT('E', emergency_count + 1);
      
      -- Update emergency count
      UPDATE queue_status 
      SET emergency_used = emergency_used + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE doctor_id = p_doctor_id AND queue_date = p_queue_date;
    ELSE
      -- No emergency slots, assign regular number
      SELECT COALESCE(regular_count, 0) INTO current_count
      FROM queue_status 
      WHERE doctor_id = p_doctor_id AND queue_date = p_queue_date;
      
      SET next_number = current_count + 1;
      
      UPDATE queue_status 
      SET regular_count = regular_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE doctor_id = p_doctor_id AND queue_date = p_queue_date;
    END IF;
  ELSE
    -- Regular appointment
    SELECT COALESCE(regular_count, 0) INTO current_count
    FROM queue_status 
    WHERE doctor_id = p_doctor_id AND queue_date = p_queue_date;
    
    SET next_number = current_count + 1;
    
    UPDATE queue_status 
    SET regular_count = regular_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE doctor_id = p_doctor_id AND queue_date = p_queue_date;
  END IF;
  
  RETURN next_number;
END$$
DELIMITER ;

-- 8. Sample data for testing
-- Insert default availability for existing doctors
INSERT IGNORE INTO queue_status (doctor_id, queue_date, current_number, current_emergency_number)
SELECT 
  id,
  CURDATE(),
  '0',
  'E0'
FROM doctors;

-- Update existing doctors with default availability
UPDATE doctors 
SET 
  available_from = '09:00:00',
  available_to = '17:00:00',
  max_daily_patients = 50,
  emergency_slots_per_day = 5
WHERE available_from IS NULL;

COMMIT;
