const { mysqlConnection } = require('../config/mysql');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {  constructor(userData) {
    this.id = userData.id || uuidv4();
    this.name = userData.name;
    this.email = userData.email;
    this.password_hash = userData.password_hash;
    this.role = userData.role;
    this.avatar_url = userData.avatar_url || null;
    this.phone = userData.phone || null;
    this.is_active = userData.is_active !== undefined ? userData.is_active : true;
    this.email_verified = userData.email_verified || false;
    this.last_login = userData.last_login || null;
  }  async save() {
    const query = `
      INSERT INTO users (id, name, email, password_hash, role, avatar_url, phone, is_active, email_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      this.id, 
      this.name, 
      this.email, 
      this.password_hash, 
      this.role,
      this.avatar_url, 
      this.phone, 
      this.is_active, 
      this.email_verified
    ];

    await mysqlConnection.query(query, params);
    return this;
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = ? AND is_active = true';
    const users = await mysqlConnection.query(query, [id]);
    return users.length > 0 ? new User(users[0]) : null;
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ? AND is_active = true';
    const users = await mysqlConnection.query(query, [email]);
    return users.length > 0 ? new User(users[0]) : null;
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM users WHERE is_active = true';
    const params = [];

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(parseInt(filters.offset));
    }

    const users = await mysqlConnection.query(query, params);
    return users.map(user => new User(user));
  }

  async update(updateData) {
    const allowedFields = ['name', 'phone', 'avatar_url', 'email_verified', 'last_login'];
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
    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    await mysqlConnection.query(query, params);

    // Update current instance
    Object.assign(this, updateData);
    return this;
  }

  async updatePassword(newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const query = 'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await mysqlConnection.query(query, [hashedPassword, this.id]);
    this.password_hash = hashedPassword;
    return this;
  }

  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password_hash);
  }

  async deactivate() {
    const query = 'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await mysqlConnection.query(query, [this.id]);
    this.is_active = false;
    return this;
  }

  async updateLastLogin() {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
    await mysqlConnection.query(query, [this.id]);
    this.last_login = new Date();
    return this;
  }

  // Get user with extended profile information
  static async findWithProfile(id) {
    const query = `
      SELECT u.*, 
             p.patient_id, p.date_of_birth, p.gender, p.address, p.medical_history,
             p.allergies, p.blood_type, p.height, p.weight, p.insurance_provider,
             p.status as patient_status,
             d.doctor_id, d.specialty, d.license_number, d.years_of_experience,
             d.consultation_fee, d.bio, d.rating, d.total_reviews,
             d.status as doctor_status
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.id = ? AND u.is_active = true
    `;
    
    const users = await mysqlConnection.query(query, [id]);
    return users.length > 0 ? users[0] : null;
  }

  toJSON() {
    const { password_hash, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;
