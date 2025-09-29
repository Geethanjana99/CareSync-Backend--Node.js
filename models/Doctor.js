const { mysqlConnection } = require('../config/mysql');
const { v4: uuidv4 } = require('uuid');

class Doctor {
  constructor(doctorData) {
    this.id = doctorData.id || uuidv4();
    this.user_id = doctorData.user_id;
    this.doctor_id = doctorData.doctor_id;
    this.specialty = doctorData.specialty;
    this.license_number = doctorData.license_number;
    this.years_of_experience = doctorData.years_of_experience;
    this.education = doctorData.education;
    this.certifications = doctorData.certifications;
    this.consultation_fee = doctorData.consultation_fee;
    this.languages_spoken = doctorData.languages_spoken;
    this.office_address = doctorData.office_address;
    this.bio = doctorData.bio;
    this.rating = doctorData.rating || 0.00;
    this.total_reviews = doctorData.total_reviews || 0;
    this.working_hours = doctorData.working_hours;
    this.availability_status = doctorData.availability_status || 'offline';
    this.commission_rate = doctorData.commission_rate || 25.00;
    this.status = doctorData.status || 'active';
  }

  async save() {
    // Generate doctor ID if not provided
    if (!this.doctor_id) {
      this.doctor_id = await this.generateDoctorId();
    }

    const query = `
      INSERT INTO doctors (
        id, user_id, doctor_id, specialty, license_number, years_of_experience,
        education, certifications, consultation_fee, languages_spoken,
        office_address, bio, rating, total_reviews, working_hours,
        commission_rate, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;    const params = [
      this.id, 
      this.user_id, 
      this.doctor_id, 
      this.specialty || null, 
      this.license_number || null,
      this.years_of_experience || null, 
      this.education || null, 
      this.certifications || null,
      this.consultation_fee || null, 
      this.languages_spoken ? JSON.stringify(this.languages_spoken) : null,
      this.office_address || null, 
      this.bio || null, 
      this.rating || 0.00, 
      this.total_reviews || 0,
      this.working_hours ? JSON.stringify(this.working_hours) : null, 
      this.commission_rate || 25.00, 
      this.status || 'active'
    ];

    await mysqlConnection.query(query, params);
    return this;
  }

  static async findById(id) {
    const query = 'SELECT * FROM doctors WHERE id = ?';
    const doctors = await mysqlConnection.query(query, [id]);
    return doctors.length > 0 ? new Doctor(doctors[0]) : null;
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM doctors WHERE user_id = ?';
    const doctors = await mysqlConnection.query(query, [userId]);
    return doctors.length > 0 ? new Doctor(doctors[0]) : null;
  }

  static async findByDoctorId(doctorId) {
    const query = 'SELECT * FROM doctors WHERE doctor_id = ?';
    const doctors = await mysqlConnection.query(query, [doctorId]);
    return doctors.length > 0 ? new Doctor(doctors[0]) : null;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT id, name FROM users WHERE role = 'doctor' AND is_active = true
    `;
    const params = [];

    if (filters.search) {
      query += ` AND name LIKE ?`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm);
    }

    // Sort by name
    query += ' ORDER BY name ASC';

    // Add LIMIT and OFFSET using string concatenation (MySQL2 doesn't like parameterized LIMIT/OFFSET sometimes)
    const limit = filters.limit && !isNaN(parseInt(filters.limit)) && parseInt(filters.limit) > 0 
      ? parseInt(filters.limit) 
      : 50; // Default limit
    
    const offset = filters.offset && !isNaN(parseInt(filters.offset)) && parseInt(filters.offset) >= 0 
      ? parseInt(filters.offset) 
      : 0; // Default offset

    // Use string concatenation for LIMIT/OFFSET to avoid MySQL2 parameter issues
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    return await mysqlConnection.query(query, params);
  }

  async update(updateData) {
    const allowedFields = [
      'specialty', 'years_of_experience', 'education', 'certifications',
      'consultation_fee', 'languages_spoken', 'office_address', 'bio',
      'working_hours', 'commission_rate', 'status'
    ];

    const updates = [];
    const params = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'languages_spoken' || key === 'working_hours') {
          updates.push(`${key} = ?`);
          params.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = ?`);
          params.push(value);
        }
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    params.push(this.id);
    const query = `UPDATE doctors SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    await mysqlConnection.query(query, params);

    // Update current instance
    Object.assign(this, updateData);
    return this;
  }

  async generateDoctorId() {
    const query = 'SELECT COUNT(*) as count FROM doctors';
    const result = await mysqlConnection.query(query);
    const count = result[0].count + 1;
    return `D${count.toString().padStart(3, '0')}`;
  }

  // Get doctor with user information
  static async findWithUserInfo(doctorId) {
    const query = `
      SELECT d.*, u.name, u.email, u.phone, u.avatar_url, u.created_at, u.last_login
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ? AND d.status = 'active' AND u.is_active = true
    `;
    
    const doctors = await mysqlConnection.query(query, [doctorId]);
    if (doctors.length > 0) {
      const doctor = doctors[0];
      // Parse JSON fields
      if (doctor.languages_spoken) {
        doctor.languages_spoken = JSON.parse(doctor.languages_spoken);
      }
      if (doctor.working_hours) {
        doctor.working_hours = JSON.parse(doctor.working_hours);
      }
      return doctor;
    }
    return null;
  }



  // Get today's appointments
  async getTodayAppointments() {
    const query = `
      SELECT a.*, p.patient_id, u.name as patient_name, u.phone as patient_phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ? AND a.appointment_date = CURDATE()
      ORDER BY a.appointment_time ASC
    `;
    
    return await mysqlConnection.query(query, [this.id]);
  }

  // Get upcoming appointments
  async getUpcomingAppointments(days = 7) {
    const query = `
      SELECT a.*, p.patient_id, u.name as patient_name, u.phone as patient_phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ? 
        AND a.status IN ('scheduled', 'confirmed')
        AND a.appointment_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `;
    
    return await mysqlConnection.query(query, [this.id, days]);
  }

  // Get patient list
  async getPatients() {
    const query = `
      SELECT DISTINCT p.*, u.name, u.email, u.phone, u.avatar_url,
             COUNT(a.id) as total_appointments,
             MAX(a.appointment_date) as last_appointment_date
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ?
      GROUP BY p.id, u.name, u.email, u.phone, u.avatar_url
      ORDER BY last_appointment_date DESC
    `;
    
    return await mysqlConnection.query(query, [this.id]);
  }

  // Update rating
  async updateRating() {
    const query = `
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
      FROM doctor_reviews
      WHERE doctor_id = ? AND status = 'approved'
    `;
    
    const result = await mysqlConnection.query(query, [this.id]);
    const { avg_rating, review_count } = result[0];

    const updateQuery = `
      UPDATE doctors 
      SET rating = ?, total_reviews = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await mysqlConnection.query(updateQuery, [
      avg_rating || 0.00,
      review_count || 0,
      this.id
    ]);

    this.rating = avg_rating || 0.00;
    this.total_reviews = review_count || 0;
    
    return this;
  }

  // Get monthly earnings
  async getMonthlyEarnings(year, month) {
    const query = `
      SELECT 
        COUNT(a.id) as total_appointments,
        SUM(a.consultation_fee) as total_revenue,
        SUM(a.consultation_fee * d.commission_rate / 100) as total_commission
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.doctor_id = ? 
        AND YEAR(a.appointment_date) = ?
        AND MONTH(a.appointment_date) = ?
        AND a.status = 'completed'
    `;
    
    const result = await mysqlConnection.query(query, [this.id, year, month]);
    return result[0];
  }

  toJSON() {
    const doctor = { ...this };
    
    // Parse JSON fields if they're strings
    if (typeof doctor.languages_spoken === 'string') {
      try {
        doctor.languages_spoken = JSON.parse(doctor.languages_spoken);
      } catch (e) {
        doctor.languages_spoken = [];
      }
    }
    
    if (typeof doctor.working_hours === 'string') {
      try {
        doctor.working_hours = JSON.parse(doctor.working_hours);
      } catch (e) {
        doctor.working_hours = {};
      }
    }
    
    return doctor;
  }
}

module.exports = Doctor;
