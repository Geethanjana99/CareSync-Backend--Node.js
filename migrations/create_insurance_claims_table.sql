-- SQL for insurance_claims table
CREATE TABLE insurance_claims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  appointment_id INT NOT NULL,
  claim_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(32) DEFAULT 'pending',
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  notes TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);
