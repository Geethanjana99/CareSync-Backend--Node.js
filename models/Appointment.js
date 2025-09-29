const { mysqlConnection } = require('../config/mysql');
const { v4: uuidv4 } = require('uuid');
const Queue = require('./Queue');

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
    this.status = appointmentData.status || 'pending';
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
    this.payment_status = appointmentData.payment_status; // Add payment_status field
    // Queue-based fields
    this.queue_number = appointmentData.queue_number;
    this.is_emergency = appointmentData.is_emergency || false;
    this.queue_date = appointmentData.queue_date || appointmentData.appointment_date;
    
    // Additional fields for queue display (preserve JOIN data)
    this.patient_name = appointmentData.patient_name;
    this.patient_phone = appointmentData.patient_phone;
    this.doctor_name = appointmentData.doctor_name;
    this.specialty = appointmentData.specialty;
  }

  // Create queue-based appointment
  static async createQueueAppointment(appointmentData) {
    try {
      const appointment = new Appointment(appointmentData);
      
      // Generate appointment ID if not provided
      if (!appointment.appointment_id) {
        appointment.appointment_id = await appointment.generateAppointmentId();
      }

      // Set queue date to appointment date
      appointment.queue_date = appointment.appointment_date;

      // Get next queue number
      appointment.queue_number = await Queue.getNextQueueNumber(
        appointment.doctor_id, 
        false, // Always false - no emergency appointments
        appointment.queue_date
      );

      // For queue-based appointments, we don't need specific appointment_time
      // Set a default time or null since queue determines the order
      appointment.appointment_time = appointment.appointment_time || null;

      const query = `
        INSERT INTO appointments (
          id, appointment_id, patient_id, doctor_id, appointment_date,
          appointment_type, status, reason_for_visit, symptoms, priority,
          notes, consultation_fee, payment_status, queue_number, is_emergency, queue_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Ensure all required fields have values (no undefined)
      const params = [
        appointment.id, 
        appointment.appointment_id, 
        appointment.patient_id, 
        appointment.doctor_id,
        appointment.appointment_date, 
        appointment.appointment_type || 'consultation', 
        appointment.status || 'scheduled',
        appointment.reason_for_visit || '',
        appointment.symptoms || '',
        appointment.priority || 'normal',
        appointment.notes || '',
        appointment.consultation_fee || 0,
        appointment.payment_status || 'unpaid',
        appointment.queue_number,
        appointment.is_emergency ? 1 : 0,
        appointment.queue_date
      ];

      // Debug: Check for undefined parameters
      console.log('🔍 Appointment creation parameters:');
      params.forEach((param, index) => {
        if (param === undefined) {
          console.log(`❌ Parameter ${index} is undefined`);
        }
      });
      console.log('📋 Appointment data:', {
        id: appointment.id,
        appointment_id: appointment.appointment_id,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        appointment_date: appointment.appointment_date,
        appointment_type: appointment.appointment_type,
        status: appointment.status,
        queue_number: appointment.queue_number,
        is_emergency: appointment.is_emergency
      });

      await mysqlConnection.query(query, params);
      
      // Return the appointment object we just created
      return appointment;
    } catch (error) {
      console.error('Error creating queue appointment:', error);
      throw error;
    }
  }

  // Get patient's queue position
  static async getPatientQueuePosition(patientId, doctorId, date = null) {
    return await Queue.getPatientQueuePosition(patientId, doctorId, date);
  }

  // Get patient's queue positions for all doctors on a date
  static async getAllPatientQueuePositions(patientId, date = null) {
    return await Queue.getAllPatientQueuePositions(patientId, date);
  }

  // Get doctor's queue for a specific date
  static async getDoctorQueue(doctorId, date = null) {
    return await Queue.getDoctorQueue(doctorId, date);
  }

  // Update appointment status and queue progression
  static async updateAppointmentStatus(appointmentId, newStatus, notes = null) {
    try {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const query = `
        UPDATE appointments 
        SET status = ?, 
            notes = COALESCE(?, notes),
            ${newStatus === 'completed' ? 'completed_at = CURRENT_TIMESTAMP,' : ''}
            ${newStatus === 'in-progress' ? 'confirmed_at = CURRENT_TIMESTAMP,' : ''}
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await mysqlConnection.query(query, [newStatus, notes, appointmentId]);

      // If starting or completing appointment, update queue current number
      if (newStatus === 'in-progress') {
        await Queue.updateCurrentNumber(
          appointment.doctor_id, 
          appointment.queue_number, 
          appointment.is_emergency,
          appointment.queue_date
        );
      }

      return await Appointment.findById(appointmentId);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  async save() {
    // Generate appointment ID if not provided
    if (!this.appointment_id) {
      this.appointment_id = await this.generateAppointmentId();
    }

    const query = `
      INSERT INTO appointments (
        id, appointment_id, patient_id, doctor_id, appointment_date,
        appointment_type, status, reason_for_visit, symptoms, priority,
        notes, consultation_fee, payment_status, queue_number, is_emergency, queue_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      this.id, 
      this.appointment_id, 
      this.patient_id, 
      this.doctor_id,
      this.appointment_date, 
      this.appointment_type, 
      this.status || 'scheduled', 
      this.reason_for_visit || null,
      this.symptoms || null, 
      this.priority || 'medium', 
      this.notes || null, 
      this.consultation_fee || null,
      this.payment_status || 'unpaid',
      this.queue_number || null,
      this.is_emergency || false,
      this.queue_date || this.appointment_date
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

  // Find today's appointments for a specific doctor
  static async findTodayByDoctorId(doctorId) {
    const query = `
      SELECT a.*, 
             p.patient_id, pu.name as patient_name, pu.phone as patient_phone,
             d.doctor_id, du.name as doctor_name, d.specialty
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users pu ON p.user_id = pu.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      WHERE a.doctor_id = ? AND DATE(a.appointment_date) = CURDATE()
      ORDER BY 
        a.is_emergency DESC,
        CASE 
          WHEN a.is_emergency THEN ABS(a.queue_number)
          ELSE a.queue_number
        END ASC
    `;
    
    const results = await mysqlConnection.query(query, [doctorId]);
    return results.map(row => new Appointment(row));
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

    if (filters.date_from && filters.date_to && filters.date_from === filters.date_to) {
      // If startDate and endDate are the same, filter for exact date match
      query += ' AND DATE(a.queue_date) = ?';
      params.push(filters.date_from);
    } else {
      // If different dates, use range filtering
      if (filters.date_from) {
        query += ' AND a.queue_date >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ' AND a.queue_date <= ?';
        params.push(filters.date_to);
      }
    }

    if (filters.appointment_type) {
      query += ' AND a.appointment_type = ?';
      params.push(filters.appointment_type);
    }

    if (filters.priority) {
      query += ' AND a.priority = ?';
      params.push(filters.priority);
    }

    query += ' ORDER BY a.queue_date DESC, a.created_at DESC';    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit.toString());
    }    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset.toString());
    }

    return await mysqlConnection.query(query, params);
  }

  async update(updateData) {
    const allowedFields = [
      'appointment_date', 'appointment_type',
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
    return parseInt(result[0].count) === 0;
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
      ORDER BY start_time
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
      bookedSlots[apt.appointment_time] = parseInt(apt.count);
    });

    // Generate available slots for all availability windows
    const availableSlots = [];
    
    availability.forEach(window => {
      const { start_time, end_time, slot_duration, max_appointments_per_slot } = window;
      
      const startTime = new Date(`1970-01-01T${start_time}`);
      const endTime = new Date(`1970-01-01T${end_time}`);
      
      let currentTime = new Date(startTime);
        while (currentTime < endTime) {
        const timeString = currentTime.toTimeString().slice(0, 5); // HH:MM format
        const timeStringWithSeconds = timeString + ':00'; // Convert to HH:MM:SS format for database lookup
        const bookedCount = bookedSlots[timeStringWithSeconds] || 0;
        
        if (bookedCount < max_appointments_per_slot) {
          availableSlots.push(timeString);
        }
        
        currentTime.setMinutes(currentTime.getMinutes() + slot_duration);
      }
    });    // Remove duplicates and sort
    return [...new Set(availableSlots)].sort();
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

  // Static method to update appointment status - for backward compatibility
  static async updateStatus(appointmentId, status, notes = null) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const updateData = { status };
    if (notes) {
      updateData.notes = notes;
    }

    // Set appropriate timestamp based on status
    if (status === 'confirmed') {
      updateData.confirmed_at = new Date();
    } else if (status === 'completed') {
      updateData.completed_at = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date();
    }

    await appointment.update(updateData);
    return appointment;
  }

  // Get all appointments with filters and full details
  static async findAll(filters = {}) {
    let query = `
      SELECT a.*, 
             a.id as appointmentId,
             p.patient_id, pu.name as patientName, pu.email as patientEmail, 
             pu.phone as patient_phone, p.date_of_birth, p.gender,
             d.doctor_id, du.name as doctor_name, du.email as doctor_email,
             d.specialty, d.consultation_fee as doctor_fee,
             a.appointment_date as appointmentDate,
             a.queue_number,
             a.appointment_type as appointmentType,
             a.reason_for_visit as reasonForVisit
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE 1=1
    `;
    
    const params = [];

    // Apply filters
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

    if (filters.date_from && filters.date_to && filters.date_from === filters.date_to) {
      // If startDate and endDate are the same, filter for exact date match
      query += ' AND DATE(a.queue_date) = ?';
      params.push(filters.date_from);
    } else {
      // If different dates, use range filtering
      if (filters.date_from) {
        query += ' AND a.queue_date >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ' AND a.queue_date <= ?';
        params.push(filters.date_to);
      }
    }

    if (filters.appointment_type) {
      query += ' AND a.appointment_type = ?';
      params.push(filters.appointment_type);
    }

    if (filters.priority) {
      query += ' AND a.priority = ?';
      params.push(filters.priority);
    }

    // Order by appointment date and queue number
    query += ' ORDER BY a.queue_date DESC, a.queue_number ASC';

    // Add pagination
    if (filters.limit) {
      query += ` LIMIT ${parseInt(filters.limit)}`;
      if (filters.offset) {
        query += ` OFFSET ${parseInt(filters.offset)}`;
      }
    }
    
    const appointments = await mysqlConnection.query(query, params);
    return appointments;
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

  // Add medical notes to appointment - for doctor use
  static async addMedicalNotes(appointmentId, medicalData) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const { diagnosis, prescription, notes, follow_up_required, follow_up_date } = medicalData;
    
    // Update appointment with medical information
    const updateData = {
      status: 'completed', // Mark as completed when notes are added
      completed_at: new Date()
    };

    // Add medical notes to the existing notes field (combining consultation and medical notes)
    const medicalNotes = {
      diagnosis: diagnosis || '',
      prescription: prescription || '',
      medical_notes: notes || '',
      follow_up_required: follow_up_required || false,
      follow_up_date: follow_up_date || null,
      added_at: new Date().toISOString()
    };

    // Combine with existing notes if any
    let combinedNotes = appointment.notes || '';
    if (combinedNotes) {
      combinedNotes += '\n\n--- MEDICAL NOTES ---\n';
    } else {
      combinedNotes = '--- MEDICAL NOTES ---\n';
    }
    
    combinedNotes += `Diagnosis: ${diagnosis || 'Not specified'}\n`;
    combinedNotes += `Prescription: ${prescription || 'None'}\n`;
    combinedNotes += `Medical Notes: ${notes || 'None'}\n`;
    combinedNotes += `Follow-up Required: ${follow_up_required ? 'Yes' : 'No'}\n`;
    if (follow_up_date) {
      combinedNotes += `Follow-up Date: ${follow_up_date}\n`;
    }
    combinedNotes += `Added: ${new Date().toLocaleString()}\n`;

    updateData.notes = combinedNotes;

    await appointment.update(updateData);

    // Return the structured medical notes for the response
    return {
      appointment_id: appointmentId,
      diagnosis,
      prescription,
      notes,
      follow_up_required,
      follow_up_date,
      added_at: new Date(),
      appointment_status: 'completed'
    };
  }

  // Get appointments by patient ID with pagination and filters
  static async findByPatientId(patientId, options = {}) {
    const { page = 1, limit = 10, status, startDate, endDate } = options;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT a.*, 
             d.doctor_id, d.specialty, d.consultation_fee as doctor_fee,
             u.name as doctor_name, u.phone as doctor_phone, u.avatar_url as doctor_avatar
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = ?
    `;
    const params = [patientId];

    if (status) {
      if (Array.isArray(status)) {
        query += ` AND a.status IN (${status.map(() => '?').join(',')})`;
        params.push(...status);
      } else {
        query += ' AND a.status = ?';
        params.push(status);
      }
    }

    if (startDate) {
      query += ' AND a.appointment_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND a.appointment_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY a.appointment_date DESC, a.created_at DESC';
    query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const appointments = await mysqlConnection.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM appointments a
      WHERE a.patient_id = ?
    `;
    const countParams = [patientId];

    if (status) {
      if (Array.isArray(status)) {
        countQuery += ` AND a.status IN (${status.map(() => '?').join(',')})`;
        countParams.push(...status);
      } else {
        countQuery += ' AND a.status = ?';
        countParams.push(status);
      }
    }

    if (startDate) {
      countQuery += ' AND a.appointment_date >= ?';
      countParams.push(startDate);
    }

    if (endDate) {
      countQuery += ' AND a.appointment_date <= ?';
      countParams.push(endDate);
    }

    const countResult = await mysqlConnection.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    return {
      appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  // Get upcoming appointments by patient ID
  static async findUpcomingByPatientId(patientId, limit = null) {
    let query = `
      SELECT a.*, 
             d.doctor_id, d.specialty, d.consultation_fee as doctor_fee,
             u.name as doctor_name, u.phone as doctor_phone, u.avatar_url as doctor_avatar
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = ? 
        AND a.status IN ('scheduled', 'confirmed')
        AND a.appointment_date >= CURDATE()
      ORDER BY a.appointment_date ASC, a.created_at ASC
    `;

    const params = [patientId];

    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }

    return await mysqlConnection.query(query, params);
  }

  // Find appointment by patient, doctor and date
  static async findByPatientAndDoctorAndDate(patientId, doctorId, date) {
    try {
      const query = `
        SELECT * FROM appointments 
        WHERE patient_id = ? AND doctor_id = ? AND queue_date = ?
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await mysqlConnection.query(query, [patientId, doctorId, date]);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding appointment by patient, doctor and date:', error);
      throw error;
    }
  }

  // Add medical notes to appointment - for doctor use
  static async addMedicalNotes(appointmentId, medicalData) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const { diagnosis, prescription, notes, follow_up_required, follow_up_date } = medicalData;
    
    // Update appointment with medical information
    const updateData = {
      status: 'completed', // Mark as completed when notes are added
      completed_at: new Date()
    };

    // Add medical notes to the existing notes field (combining consultation and medical notes)
    const medicalNotes = {
      diagnosis: diagnosis || '',
      prescription: prescription || '',
      medical_notes: notes || '',
      follow_up_required: follow_up_required || false,
      follow_up_date: follow_up_date || null,
      added_at: new Date().toISOString()
    };

    // Combine with existing notes if any
    let combinedNotes = appointment.notes || '';
    if (combinedNotes) {
      combinedNotes += '\n\n--- MEDICAL NOTES ---\n';
    } else {
      combinedNotes = '--- MEDICAL NOTES ---\n';
    }
    
    combinedNotes += `Diagnosis: ${diagnosis || 'Not specified'}\n`;
    combinedNotes += `Prescription: ${prescription || 'None'}\n`;
    combinedNotes += `Medical Notes: ${notes || 'None'}\n`;
    combinedNotes += `Follow-up Required: ${follow_up_required ? 'Yes' : 'No'}\n`;
    if (follow_up_date) {
      combinedNotes += `Follow-up Date: ${follow_up_date}\n`;
    }
    combinedNotes += `Added: ${new Date().toLocaleString()}\n`;

    updateData.notes = combinedNotes;

    await appointment.update(updateData);

    // Return the structured medical notes for the response
    return {
      appointment_id: appointmentId,
      diagnosis,
      prescription,
      notes,
      follow_up_required,
      follow_up_date,
      added_at: new Date(),
      appointment_status: 'completed'
    };
  }
}

module.exports = Appointment;
