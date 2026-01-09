-- SQL for insurance_claims table

CREATE TABLE insurance_claims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  claim_id VARCHAR(50) NOT NULL,
  patient_id VARCHAR(50) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  appointment_id VARCHAR(50),
  doctor_name VARCHAR(255),
  service_date DATE,
  claim_date DATE,
  amount DECIMAL(10,2),
  insurance_provider VARCHAR(255),
  status ENUM('pending','approved','denied','processing','paid') DEFAULT 'pending',
  denial_reason TEXT,
  approved_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2),
  service_type VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
