-- Migration: Add payment status to appointments table for queue management
-- Date: 2025-09-11
-- Description: Adds payment_status column to appointments table to track payment status directly in queue

USE `caresync`;

-- Add payment_status column to appointments table
ALTER TABLE `appointments` 
ADD COLUMN `payment_status` ENUM('unpaid', 'paid', 'partially_paid', 'refunded') 
DEFAULT 'unpaid' 
AFTER `consultation_fee`;

-- Add index for payment_status for better query performance
ALTER TABLE `appointments` 
ADD INDEX `idx_payment_status` (`payment_status`);

-- Add composite index for queue management with payment status
ALTER TABLE `appointments` 
ADD INDEX `idx_doctor_date_queue_payment` (`doctor_id`, `appointment_date`, `queue_number`, `payment_status`);

-- Update existing appointments to have payment status based on billing table if exists
UPDATE `appointments` a
LEFT JOIN `billing` b ON a.id = b.appointment_id
SET a.payment_status = CASE 
    WHEN b.payment_status = 'paid' THEN 'paid'
    WHEN b.payment_status = 'partially_paid' THEN 'partially_paid'
    WHEN b.payment_status = 'refunded' THEN 'refunded'
    ELSE 'unpaid'
END
WHERE a.payment_status = 'unpaid';

-- Add trigger to sync payment status with billing table when billing is updated
DELIMITER //
CREATE TRIGGER `sync_appointment_payment_status`
AFTER UPDATE ON `billing`
FOR EACH ROW
BEGIN
    IF NEW.payment_status != OLD.payment_status THEN
        UPDATE `appointments` 
        SET `payment_status` = CASE 
            WHEN NEW.payment_status = 'paid' THEN 'paid'
            WHEN NEW.payment_status = 'partially_paid' THEN 'partially_paid'
            WHEN NEW.payment_status = 'refunded' THEN 'refunded'
            ELSE 'unpaid'
        END
        WHERE id = NEW.appointment_id;
    END IF;
END//
DELIMITER ;

-- Add trigger to set payment status when billing is created
DELIMITER //
CREATE TRIGGER `set_appointment_payment_status_on_billing_insert`
AFTER INSERT ON `billing`
FOR EACH ROW
BEGIN
    UPDATE `appointments` 
    SET `payment_status` = CASE 
        WHEN NEW.payment_status = 'paid' THEN 'paid'
        WHEN NEW.payment_status = 'partially_paid' THEN 'partially_paid'
        WHEN NEW.payment_status = 'refunded' THEN 'refunded'
        ELSE 'unpaid'
    END
    WHERE id = NEW.appointment_id;
END//
DELIMITER ;
