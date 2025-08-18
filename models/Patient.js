const { mysqlConnection } = require('../config/mysql');
const { v4: uuidv4 } = require('uuid');

class Patient {
  constructor(patientData) {
    this.id = patientData.id || uuidv4();
    this.user_id = patientData.user_id;
    this.patient_id = patientData.patient_id;
    this.date_of_birth = patientData.date_of_birth;
    this.gender = patientData.gender;
    this.address = patientData.address;
    this.emergency_contact_name = patientData.emergency_contact_name;
    this.emergency_contact_phone = patientData.emergency_contact_phone;
    this.medical_history = patientData.medical_history;
    this.allergies = patientData.allergies;
    this.current_medications = patientData.current_medications;
    this.insurance_provider = patientData.insurance_provider;
    this.insurance_policy_number = patientData.insurance_policy_number;
    this.blood_type = patientData.blood_type;
    this.height = patientData.height;
    this.weight = patientData.weight;
    this.occupation = patientData.occupation;
    this.marital_status = patientData.marital_status;
    this.preferred_language = patientData.preferred_language || 'English';
    this.status = patientData.status || 'active';
  }

  async save() {
    // Generate patient ID if not provided
    if (!this.patient_id) {
      this.patient_id = await this.generatePatientId();
    }

    const query = `
      INSERT INTO patients (
        id, user_id, patient_id, date_of_birth, gender, address,
        emergency_contact_name, emergency_contact_phone, medical_history,
        allergies, current_medications, insurance_provider, insurance_policy_number,
        blood_type, height, weight, occupation, marital_status,
        preferred_language, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;    const params = [
      this.id, 
      this.user_id, 
      this.patient_id, 
      this.date_of_birth || null, 
      this.gender || null,
      this.address || null, 
      this.emergency_contact_name || null, 
      this.emergency_contact_phone || null,
      this.medical_history || null, 
      this.allergies || null, 
      this.current_medications || null,
      this.insurance_provider || null, 
      this.insurance_policy_number || null, 
      this.blood_type || null,
      this.height || null, 
      this.weight || null, 
      this.occupation || null, 
      this.marital_status || null,
      this.preferred_language || 'English', 
      this.status || 'active'
    ];

    await mysqlConnection.query(query, params);
    return this;
  }

  static async findById(id) {
    const query = 'SELECT * FROM patients WHERE id = ?';
    const patients = await mysqlConnection.query(query, [id]);
    return patients.length > 0 ? new Patient(patients[0]) : null;
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM patients WHERE user_id = ?';
    const patients = await mysqlConnection.query(query, [userId]);
    return patients.length > 0 ? new Patient(patients[0]) : null;
  }

  static async findByPatientId(patientId) {
    const query = 'SELECT * FROM patients WHERE patient_id = ?';
    const patients = await mysqlConnection.query(query, [patientId]);
    return patients.length > 0 ? new Patient(patients[0]) : null;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT p.*, u.name, u.email, u.phone, u.avatar_url, u.created_at
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'active' AND u.is_active = true
    `;
    const params = [];

    if (filters.search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR p.patient_id LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.gender) {
      query += ' AND p.gender = ?';
      params.push(filters.gender);
    }

    if (filters.insurance_provider) {
      query += ' AND p.insurance_provider = ?';
      params.push(filters.insurance_provider);
    }

    query += ' ORDER BY u.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(parseInt(filters.offset));
    }

    return await mysqlConnection.query(query, params);
  }

  async update(updateData) {
    const allowedFields = [
      'date_of_birth', 'gender', 'address', 'emergency_contact_name',
      'emergency_contact_phone', 'medical_history', 'allergies',
      'current_medications', 'insurance_provider', 'insurance_policy_number',
      'blood_type', 'height', 'weight', 'occupation', 'marital_status',
      'preferred_language', 'status'
    ];

    const updates = [];
    const params = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    params.push(this.id);
    const query = `UPDATE patients SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    await mysqlConnection.query(query, params);

    // Update current instance
    Object.assign(this, updateData);
    return this;
  }

  async generatePatientId() {
    const query = 'SELECT COUNT(*) as count FROM patients';
    const result = await mysqlConnection.query(query);
    const count = result[0].count + 1;
    return `P${count.toString().padStart(3, '0')}`;
  }

  // Get patient with user information
  static async findWithUserInfo(patientId) {
    const query = `
      SELECT p.*, u.name, u.email, u.phone, u.avatar_url, u.created_at, u.last_login
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND p.status = 'active' AND u.is_active = true
    `;
    
    const patients = await mysqlConnection.query(query, [patientId]);
    return patients.length > 0 ? patients[0] : null;
  }

  // Get patient's appointment history
  async getAppointmentHistory(limit = 10) {
    const query = `
      SELECT a.*, d.doctor_id, u.name as doctor_name, d.specialty
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT ?
    `;
    
    return await mysqlConnection.query(query, [this.id, limit]);
  }

  // Get upcoming appointments
  async getUpcomingAppointments() {
    const query = `
      SELECT a.*, d.doctor_id, u.name as doctor_name, d.specialty
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = ? 
        AND a.status IN ('scheduled', 'confirmed')
        AND (a.appointment_date > CURDATE() 
             OR (a.appointment_date = CURDATE() AND a.appointment_time > CURTIME()))
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `;
    
    return await mysqlConnection.query(query, [this.id]);
  }

  // Get outstanding invoices
  async getOutstandingInvoices() {
    const query = `
      SELECT i.*, d.doctor_id, u.name as doctor_name
      FROM invoices i
      JOIN doctors d ON i.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE i.patient_id = ? AND i.status != 'paid' AND i.outstanding_amount > 0
      ORDER BY i.due_date ASC
    `;
    
    return await mysqlConnection.query(query, [this.id]);
  }

  // Calculate BMI
  getBMI() {
    if (this.height && this.weight) {
      const heightInMeters = this.height / 100;
      return (this.weight / (heightInMeters * heightInMeters)).toFixed(2);
    }
    return null;
  }

  // Get age
  getAge() {
    if (this.date_of_birth) {
      const today = new Date();
      const birthDate = new Date(this.date_of_birth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    }
    return null;
  }

  // Static method to search doctors for patients
  static async searchDoctors(filters = {}) {
    try {
      const {
        specialty,
        name,
        location,
        rating,
        page = 1,
        limit = 10
      } = filters;

      let query = `
        SELECT 
          d.id,
          d.doctor_id,
          d.specialty,
          d.license_number,
          d.years_of_experience,
          d.consultation_fee,
          d.bio,
          d.rating,
          d.total_reviews,
          d.availability_status,
          d.working_hours,
          u.name,
          u.email,
          u.phone,
          u.avatar_url
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE d.status = 'active' 
          AND u.is_active = true 
          AND d.availability_status IN ('available', 'busy')
      `;
      
      const params = [];

      if (specialty && specialty.trim() !== '') {
        query += ' AND d.specialty = ?';
        params.push(specialty);
      }

      if (name && name.trim() !== '') {
        query += ' AND u.name LIKE ?';
        params.push(`%${name}%`);
      }

      if (rating && !isNaN(parseFloat(rating))) {
        query += ' AND d.rating >= ?';
        params.push(parseFloat(rating));
      }      // Order by rating and availability
      query += ' ORDER BY d.rating DESC, d.total_reviews DESC, u.name ASC';

      // Add pagination - use direct values for LIMIT and OFFSET to avoid MySQL parameter binding issues
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

      const pool = mysqlConnection.getPool();
      const [doctors] = await pool.execute(query, params);

      // Format the response
      return doctors.map(doctor => ({
        id: doctor.id,
        doctor_id: doctor.doctor_id,
        name: doctor.name,
        specialty: doctor.specialty,
        license_number: doctor.license_number,        years_of_experience: doctor.years_of_experience,
        consultation_fee: parseFloat(doctor.consultation_fee || 0),
        bio: doctor.bio,
        rating: parseFloat(doctor.rating || 0),
        total_reviews: doctor.total_reviews || 0,
        availability_status: doctor.availability_status,
        working_hours: doctor.working_hours 
          ? (typeof doctor.working_hours === 'string' 
             ? JSON.parse(doctor.working_hours) 
             : doctor.working_hours)
          : null,
        email: doctor.email,
        phone: doctor.phone,
        avatar_url: doctor.avatar_url
      }));

    } catch (error) {
      console.error('Error searching doctors:', error);
      throw error;
    }
  }

  toJSON() {
    return {
      ...this,
      bmi: this.getBMI(),
      age: this.getAge()
    };
  }
}

module.exports = Patient;
