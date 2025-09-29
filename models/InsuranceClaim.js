// models/InsuranceClaim.js
const { mysqlConnection } = require('../config/mysql');

class InsuranceClaim {
  constructor(data) {
    this.id = data.id || `CLM-${Date.now().toString().slice(-6)}`;
    this.claim_id = data.claim_id;
    this.patient_id = data.patient_id;
    this.patient_name = data.patient_name;
    this.appointment_id = data.appointment_id;
    this.doctor_name = data.doctor_name;
    this.service_date = data.service_date;
    this.claim_date = data.claim_date || new Date().toISOString().split('T')[0];
    this.amount = data.amount;
    this.insurance_provider = data.insurance_provider;
    this.status = data.status || 'pending';
    this.denial_reason = data.denial_reason;
    this.approved_amount = data.approved_amount;
    this.paid_amount = data.paid_amount;
    this.service_type = data.service_type;
    this.notes = data.notes;
    this.created_at = data.created_at;
  }

  static async create(claimData) {
    const id = claimData.id || `CLM-${Date.now().toString().slice(-6)}`;
    
    const query = `
      INSERT INTO insurance_claims (
        id, patient_name, doctor_name, service_date, claim_date, 
        amount, insurance_provider, status, service_type, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      claimData.patient_name || claimData.patientName,
      claimData.doctor_name || claimData.doctorName,
      claimData.service_date || claimData.serviceDate,
      claimData.claim_date || claimData.claimDate || new Date().toISOString().split('T')[0],
      claimData.amount,
      claimData.insurance_provider || claimData.insuranceProvider,
      claimData.status || 'pending',
      claimData.service_type || claimData.serviceType,
      claimData.notes || ''
    ];

    await mysqlConnection.query(query, params);
    return { id, ...claimData };
  }

  static async findAll() {
    const query = 'SELECT * FROM insurance_claims ORDER BY created_at DESC';
    const rows = await mysqlConnection.query(query);
    return rows.map(row => new InsuranceClaim(row));
  }

  static async findById(id) {
    const query = 'SELECT * FROM insurance_claims WHERE id = ?';
    const rows = await mysqlConnection.query(query, [id]);
    return rows.length ? new InsuranceClaim(rows[0]) : null;
  }

  static async updateStatus(id, status) {
    const query = 'UPDATE insurance_claims SET status = ? WHERE id = ?';
    const result = await mysqlConnection.query(query, [status, id]);
    return result;
  }
}

module.exports = InsuranceClaim;
