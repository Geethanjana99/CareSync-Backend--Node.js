const { mysqlConnection } = require('../config/mysql');
const { v4: uuidv4 } = require('uuid');

class Appointment {
  constructor(appointmentData) {
    this.id = appointmentData.id || uuidv4();
    this.appointment_id = appointmentData.appointment_id;
    this.patient_id = appointmentData.patient_id;
    this.doctor_id = appointmentData.doctor_id;
    this.appointment_date = appointmentData.appointment_date;
    this.appointment_time = appointmentData.appointment_time;
    this.duration = appointmentData.duration || 30;
    this.appointment_type = appointmentData.appointment_type;
    this.status = appointmentData.status || 'scheduled';
    this.reason_for_visit = appointmentData.reason_for_visit;
    this.symptoms = appointmentData.symptoms;
    this.priority = appointmentData.priority || 'medium';
    this.notes = appointmentData.notes;
    this.cancellation_reason = appointmentData.cancellation_reason;
    this.cancelled_by = appointmentData.cancelled_by;
    this.cancelled_at = appointmentData.cancelled_at;
    this.confirmed_at = appointmentData.confirmed_at;
    this.completed_at = appointmentData.completed_at;
    this.estimated_wait_time = appointmentData.estimated_wait_time;
    this.actual_wait_time = appointmentData.actual_wait_time;
    this.consultation_fee = appointmentData.consultation_fee;
  }

  async save() {
    // Generate appointment ID if not provided
    if (!this.appointment_id) {
      this.appointment_id = await this.generateAppointmentId();
    }

    const query = `
      INSERT INTO appointments (
        id, appointment_id, patient_id, doctor_id, appointment_date, appointment_time,
        duration, appointment_type, status, reason_for_visit, symptoms, priority,
        notes, consultation_fee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      this.id, this.appointment_id, this.patient_id, this.doctor_id,
      this.appointment_date, this.appointment_time, this.duration,
      this.appointment_type, this.status, this.reason_for_visit,
      this.symptoms, this.priority, this.notes, this.consultation_fee
    ];

    await mysqlConnection.query(query, params);
    return this;
  }

  static async findById(id) {
    const query = 'SELECT * FROM appointments WHERE id = ?';
    const appointments = await mysqlConnection.query(query, [id]);
    return appointments.length > 0 ? new Appointment(appointments[0]) : null;
  }

  static async findByAppointmentId(appointmentId) {
    const query = 'SELECT * FROM appointments WHERE appointment_id = ?';
    const appointments = await mysqlConnection.query(query, [appointmentId]);
    return appointments.length > 0 ? new Appointment(appointments[0]) : null;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT a.*, 
             p.patient_id, pu.name as patient_name, pu.phone as patient_phone,
             d.doctor_id, du.name as doctor_name, d.specialty
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.patient_id) {
      query += ' AND a.patient_id = ?';
      params.push(filters.patient_id);
    }

    if (filters.doctor_id) {
      query += ' AND a.doctor_id = ?';
      params.push(filters.doctor_id);
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query += ` AND a.status IN (${filters.status.map(() => '?').join(',')})`;
        params.push(...filters.status);
      } else {
        query += ' AND a.status = ?';
        params.push(filters.status);
      }
    }

    if (filters.date_from) {
      query += ' AND a.appointment_date >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND a.appointment_date <= ?';
      params.push(filters.date_to);
    }

    if (filters.appointment_type) {
      query += ' AND a.appointment_type = ?';
      params.push(filters.appointment_type);
    }

    if (filters.priority) {
      query += ' AND a.priority = ?';
      params.push(filters.priority);
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

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
      'appointment_date', 'appointment_time', 'duration', 'appointment_type',
      'status', 'reason_for_visit', 'symptoms', 'priority', 'notes',
      'cancellation_reason', 'cancelled_by', 'cancelled_at', 'confirmed_at',
      'completed_at', 'estimated_wait_time', 'actual_wait_time', 'consultation_fee'
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
    const query = `UPDATE appointments SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    await mysqlConnection.query(query, params);

    // Update current instance
    Object.assign(this, updateData);
    return this;
  }

  async generateAppointmentId() {
    const query = 'SELECT COUNT(*) as count FROM appointments';
    const result = await mysqlConnection.query(query);
    const count = result[0].count + 1;
    return `APT-${count.toString().padStart(3, '0')}`;
  }

  // Check if appointment slot is available
  static async isSlotAvailable(doctorId, appointmentDate, appointmentTime, excludeId = null) {
    let query = `
      SELECT COUNT(*) as count FROM appointments 
      WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
      AND status NOT IN ('cancelled', 'no-show')
    `;
    const params = [doctorId, appointmentDate, appointmentTime];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const result = await mysqlConnection.query(query, params);
    return result[0].count === 0;
  }

  // Get available time slots for a doctor on a specific date
  static async getAvailableSlots(doctorId, appointmentDate) {
    // Get doctor's availability for the day
    const dayOfWeek = new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long' });
    
    const availabilityQuery = `
      SELECT start_time, end_time, slot_duration, max_appointments_per_slot
      FROM doctor_availability
      WHERE doctor_id = ? AND day_of_week = ? AND is_active = true
      AND effective_date <= ? AND (expiry_date IS NULL OR expiry_date >= ?)
    `;
    
    const availability = await mysqlConnection.query(availabilityQuery, [
      doctorId, dayOfWeek, appointmentDate, appointmentDate
    ]);

    if (availability.length === 0) {
      return [];
    }

    // Get existing appointments for the date
    const appointmentsQuery = `
      SELECT appointment_time, COUNT(*) as count
      FROM appointments
      WHERE doctor_id = ? AND appointment_date = ?
      AND status NOT IN ('cancelled', 'no-show')
      GROUP BY appointment_time
    `;
    
    const existingAppointments = await mysqlConnection.query(appointmentsQuery, [
      doctorId, appointmentDate
    ]);

    const bookedSlots = {};
    existingAppointments.forEach(apt => {
      bookedSlots[apt.appointment_time] = apt.count;
    });

    // Generate available slots
    const availableSlots = [];
    const { start_time, end_time, slot_duration, max_appointments_per_slot } = availability[0];
    
    const startTime = new Date(`1970-01-01T${start_time}`);
    const endTime = new Date(`1970-01-01T${end_time}`);
    
    let currentTime = new Date(startTime);
    
    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      const bookedCount = bookedSlots[timeString] || 0;
      
      if (bookedCount < max_appointments_per_slot) {
        availableSlots.push({
          time: timeString,
          available_slots: max_appointments_per_slot - bookedCount
        });
      }
      
      currentTime.setMinutes(currentTime.getMinutes() + slot_duration);
    }

    return availableSlots;
  }

  // Confirm appointment
  async confirm() {
    await this.update({
      status: 'confirmed',
      confirmed_at: new Date()
    });
    return this;
  }

  // Cancel appointment
  async cancel(cancelledBy, reason) {
    await this.update({
      status: 'cancelled',
      cancelled_by: cancelledBy,
      cancelled_at: new Date(),
      cancellation_reason: reason
    });
    return this;
  }

  // Complete appointment
  async complete(actualWaitTime = null) {
    await this.update({
      status: 'completed',
      completed_at: new Date(),
      actual_wait_time: actualWaitTime
    });
    return this;
  }

  // Mark as no-show
  async markNoShow() {
    await this.update({
      status: 'no-show'
    });
    return this;
  }

  // Get appointment with full details
  static async findWithDetails(appointmentId) {
    const query = `
      SELECT a.*, 
             p.patient_id, pu.name as patient_name, pu.email as patient_email, 
             pu.phone as patient_phone, p.date_of_birth, p.gender,
             d.doctor_id, du.name as doctor_name, du.email as doctor_email,
             d.specialty, d.consultation_fee as doctor_fee
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE a.id = ?
    `;
    
    const appointments = await mysqlConnection.query(query, [appointmentId]);
    return appointments.length > 0 ? appointments[0] : null;
  }

  // Get upcoming appointments for reminders
  static async getUpcomingForReminders(hours = 24) {
    const query = `
      SELECT a.*, 
             pu.name as patient_name, pu.email as patient_email, pu.phone as patient_phone,
             du.name as doctor_name, d.specialty
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE a.status IN ('scheduled', 'confirmed')
      AND CONCAT(a.appointment_date, ' ', a.appointment_time) 
          BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? HOUR)
    `;
    
    return await mysqlConnection.query(query, [hours]);
  }

  // Get appointment statistics
  static async getStatistics(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status = 'no-show' THEN 1 END) as no_shows,
        COUNT(CASE WHEN status IN ('scheduled', 'confirmed') THEN 1 END) as upcoming,
        AVG(CASE WHEN consultation_fee IS NOT NULL THEN consultation_fee END) as avg_fee,
        SUM(CASE WHEN status = 'completed' AND consultation_fee IS NOT NULL THEN consultation_fee ELSE 0 END) as total_revenue
      FROM appointments
      WHERE 1=1
    `;
    const params = [];

    if (filters.date_from) {
      query += ' AND appointment_date >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND appointment_date <= ?';
      params.push(filters.date_to);
    }

    if (filters.doctor_id) {
      query += ' AND doctor_id = ?';
      params.push(filters.doctor_id);
    }

    const result = await mysqlConnection.query(query, params);
    return result[0];
  }
}

module.exports = Appointment;
