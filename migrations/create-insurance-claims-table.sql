-- Create insurance_claims table
CREATE TABLE IF NOT EXISTS insurance_claims (
    id VARCHAR(50) PRIMARY KEY,
    patient_name VARCHAR(255) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    service_date DATE NOT NULL,
    claim_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    insurance_provider VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'processing') DEFAULT 'pending',
    service_type VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_patient_name (patient_name),
    INDEX idx_doctor_name (doctor_name),
    INDEX idx_status (status),
    INDEX idx_claim_date (claim_date)
);
