// models/InsuranceClaim.js
const db = require('../config/mysql');

class InsuranceClaim {
  constructor(data) {
    this.id = data.id;
    this.patient_id = data.patient_id;
    this.appointment_id = data.appointment_id;
    this.claim_amount = data.claim_amount;
    this.status = data.status;
    this.submitted_at = data.submitted_at;
    this.processed_at = data.processed_at;
    this.notes = data.notes;
  }

  static async create(claimData) {
    const [result] = await db.execute(
      'INSERT INTO insurance_claims (patient_id, appointment_id, claim_amount, status, submitted_at, notes) VALUES (?, ?, ?, ?, NOW(), ?)',
      [claimData.patient_id, claimData.appointment_id, claimData.claim_amount, claimData.status || 'pending', claimData.notes || null]
    );
    return { id: result.insertId, ...claimData };
  }

  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM insurance_claims');
    return rows.map(row => new InsuranceClaim(row));
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM insurance_claims WHERE id = ?', [id]);
    return rows.length ? new InsuranceClaim(rows[0]) : null;
  }
}

module.exports = InsuranceClaim;
