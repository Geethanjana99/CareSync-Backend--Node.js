const { mysqlConnection } = require('../config/mysql');
const logger = require('../config/logger');

class Queue {
  // Get queue status for a doctor on a specific date
  static async getQueueStatus(doctorId, date = null) {
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const query = `
        SELECT 
          qs.*,
          d.name as doctor_name,
          d.specialty
        FROM queue_status qs
        JOIN doctors doc ON qs.doctor_id = doc.id
        JOIN users d ON doc.user_id = d.id
        WHERE qs.doctor_id = ? AND qs.queue_date = ?
      `;
      
      const result = await mysqlConnection.query(query, [doctorId, queueDate]);
      return result[0] || null;
    } catch (error) {
      logger.error('Error fetching queue status:', error);
      throw error;
    }
  }

  // Get current queue for a doctor with all appointments
  static async getDoctorQueue(doctorId, date = null) {
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    try {
      // Get queue status
      const queueStatus = await this.getQueueStatus(doctorId, queueDate);
      
      // Get all appointments in queue
      const appointmentsQuery = `
        SELECT 
          a.*,
          u.name as patient_name,
          u.phone as patient_phone,
          p.date_of_birth,
          TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) as patient_age
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE a.doctor_id = ? AND a.queue_date = ?
        ORDER BY 
          a.is_emergency DESC,
          CASE 
            WHEN a.is_emergency THEN CAST(SUBSTRING(a.queue_number, 2) AS UNSIGNED)
            ELSE CAST(a.queue_number AS UNSIGNED)
          END ASC
      `;
      
      const appointments = await mysqlConnection.query(appointmentsQuery, [doctorId, queueDate]);
      
      return {
        queueStatus,
        appointments,
        totalPatients: appointments.length,
        emergencyPatients: appointments.filter(a => a.is_emergency).length,
        regularPatients: appointments.filter(a => !a.is_emergency).length,
        pending: appointments.filter(a => a.status === 'pending').length,
        inProgress: appointments.filter(a => a.status === 'in-progress').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        // Payment statistics
        paidAppointments: appointments.filter(a => a.payment_status === 'paid').length,
        unpaidAppointments: appointments.filter(a => a.payment_status === 'unpaid').length,
        partiallyPaidAppointments: appointments.filter(a => a.payment_status === 'partially_paid').length,
        refundedAppointments: appointments.filter(a => a.payment_status === 'refunded').length
      };
    } catch (error) {
      logger.error('Error fetching doctor queue:', error);
      throw error;
    }
  }

  // Get next queue number for booking
  static async getNextQueueNumber(doctorId, isEmergency = false, date = null) {
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    try {
      // Ensure queue status exists for the date
      await this.ensureQueueExists(doctorId, queueDate);
      
      if (isEmergency) {
        // Check emergency slots availability
        const emergencyQuery = `
          SELECT emergency_used, max_emergency_slots
          FROM queue_status
          WHERE doctor_id = ? AND queue_date = ?
        `;
        
        const [queueStatus] = await mysqlConnection.query(emergencyQuery, [doctorId, queueDate]);
        
        if (queueStatus.emergency_used < queueStatus.max_emergency_slots) {
          // Assign emergency number as negative integer (e.g., -1, -2, -3)
          const emergencyNumber = -(queueStatus.emergency_used + 1);
          
          // Update emergency count
          await mysqlConnection.query(`
            UPDATE queue_status 
            SET emergency_used = emergency_used + 1
            WHERE doctor_id = ? AND queue_date = ?
          `, [doctorId, queueDate]);
          
          return emergencyNumber;
        } else {
          // No emergency slots available, assign regular number
          isEmergency = false;
        }
      }
      
      if (!isEmergency) {
        // Get next regular number
        const regularQuery = `
          SELECT regular_count
          FROM queue_status
          WHERE doctor_id = ? AND queue_date = ?
        `;
        
        const [queueStatus] = await mysqlConnection.query(regularQuery, [doctorId, queueDate]);
        const nextNumber = (queueStatus.regular_count || 0) + 1;
        
        // Update regular count
        await mysqlConnection.query(`
          UPDATE queue_status 
          SET regular_count = regular_count + 1
          WHERE doctor_id = ? AND queue_date = ?
        `, [doctorId, queueDate]);
        
        return nextNumber;
      }
    } catch (error) {
      logger.error('Error getting next queue number:', error);
      throw error;
    }
  }

  // Ensure queue status exists for doctor and date
  static async ensureQueueExists(doctorId, date) {
    try {
      const checkQuery = `
        SELECT id FROM queue_status 
        WHERE doctor_id = ? AND queue_date = ?
      `;
      
      const existing = await mysqlConnection.query(checkQuery, [doctorId, date]);
      
      if (existing.length === 0) {
        // Create queue status with default values (since doctors table doesn't have these columns)
        await mysqlConnection.query(`
          INSERT INTO queue_status (
            doctor_id, queue_date, current_number, current_emergency_number,
            max_emergency_slots, emergency_used, regular_count,
            available_from, available_to
          ) VALUES (?, ?, '0', 'E0', ?, 0, 0, ?, ?)
        `, [
          doctorId, 
          date, 
          5, // Default emergency slots
          '09:00:00', // Default start time
          '17:00:00'  // Default end time
        ]);
      }
    } catch (error) {
      logger.error('Error ensuring queue exists:', error);
      throw error;
    }
  }

  // Update current queue number being served
  static async updateCurrentNumber(doctorId, newNumber, isEmergency = false, date = null) {
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const field = isEmergency ? 'current_emergency_number' : 'current_number';
      
      await mysqlConnection.query(`
        UPDATE queue_status 
        SET ${field} = ?, updated_at = CURRENT_TIMESTAMP
        WHERE doctor_id = ? AND queue_date = ?
      `, [newNumber, doctorId, queueDate]);
      
      return true;
    } catch (error) {
      logger.error('Error updating current number:', error);
      throw error;
    }
  }

  // Get patient's position in queue
  static async getPatientQueuePosition(patientId, doctorId, date = null) {
    // Validate required parameters
    if (!patientId || !doctorId) {
      throw new Error('Patient ID and Doctor ID are required');
    }
    
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    try {
      // Get patient's appointment
      const patientQuery = `
        SELECT queue_number, is_emergency, status
        FROM appointments
        WHERE patient_id = ? AND doctor_id = ? AND queue_date = ?
      `;
      
      const [appointment] = await mysqlConnection.query(patientQuery, [patientId, doctorId, queueDate]);
      
      if (!appointment) {
        return null;
      }
      
      // Get current numbers being served
      const queueStatus = await this.getQueueStatus(doctorId, queueDate);
      
      let position = 0;
      let currentlyServing = false;
      
      if (appointment.is_emergency) {
        const emergencyNum = parseInt(appointment.queue_number.substring(1));
        const currentEmergencyNum = parseInt(queueStatus.current_emergency_number.substring(1));
        
        if (emergencyNum <= currentEmergencyNum) {
          currentlyServing = emergencyNum === currentEmergencyNum;
          position = 0;
        } else {
          position = emergencyNum - currentEmergencyNum;
        }
      } else {
        const patientNum = parseInt(appointment.queue_number);
        const currentNum = parseInt(queueStatus.current_number);
        
        if (patientNum <= currentNum) {
          currentlyServing = patientNum === currentNum;
          position = 0;
        } else {
          // Count pending emergency appointments that will be served first
          const emergencyQuery = `
            SELECT COUNT(*) as emergency_ahead
            FROM appointments
            WHERE doctor_id = ? AND queue_date = ? AND is_emergency = true 
              AND status IN ('pending', 'confirmed')
              AND CAST(SUBSTRING(queue_number, 2) AS UNSIGNED) > CAST(SUBSTRING(?, 2) AS UNSIGNED)
          `;
          
          const [emergencyCount] = await mysqlConnection.query(emergencyQuery, [
            doctorId, queueDate, queueStatus.current_emergency_number
          ]);
          
          position = (patientNum - currentNum) + (emergencyCount.emergency_ahead || 0);
        }
      }
      
      return {
        queueNumber: appointment.queue_number,
        isEmergency: appointment.is_emergency,
        status: appointment.status,
        position: Math.max(0, position),
        currentlyServing,
        currentNumber: appointment.is_emergency ? queueStatus.current_emergency_number : queueStatus.current_number
      };
    } catch (error) {
      logger.error('Error getting patient queue position:', error);
      throw error;
    }
  }

  // Check if doctor is available for booking on a specific date
  static async isDoctorAvailable(doctorId, date = null) {
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const query = `
        SELECT 
          d.working_hours,
          qs.regular_count,
          qs.emergency_used,
          qs.is_active
        FROM doctors d
        LEFT JOIN queue_status qs ON d.id = qs.doctor_id AND qs.queue_date = ?
        WHERE d.id = ?
      `;
      
      const [result] = await mysqlConnection.query(query, [queueDate, doctorId]);
      
      if (!result) {
        return { available: false, reason: 'Doctor not found' };
      }
      
      // Use default max patients per day (can be configured later)
      const totalPatients = (result.regular_count || 0) + (result.emergency_used || 0);
      const maxPatients = 50; // Default maximum patients per day
      
      if (totalPatients >= maxPatients) {
        return { available: false, reason: 'Daily patient limit reached' };
      }
      
      if (result.is_active === false) {
        return { available: false, reason: 'Doctor not available today' };
      }
      
      return { 
        available: true, 
        availableFrom: result.available_from,
        availableTo: result.available_to,
        currentPatients: totalPatients,
        maxPatients: maxPatients
      };
    } catch (error) {
      logger.error('Error checking doctor availability:', error);
      throw error;
    }
  }

  // Get queue summary for display
  static async getQueueSummary(doctorId, date = null) {
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const queue = await this.getDoctorQueue(doctorId, queueDate);
      
      return {
        date: queueDate,
        doctor: queue.queueStatus?.doctor_name,
        specialty: queue.queueStatus?.specialty,
        currentNumber: queue.queueStatus?.current_number || '0',
        currentEmergencyNumber: queue.queueStatus?.current_emergency_number || 'E0',
        totalPatients: queue.totalPatients,
        pendingPatients: queue.pending,
        emergencyPatients: queue.emergencyPatients,
        regularPatients: queue.regularPatients,
        completed: queue.completed,
        availableFrom: queue.queueStatus?.available_from,
        availableTo: queue.queueStatus?.available_to,
        emergencySlotsUsed: queue.queueStatus?.emergency_used || 0,
        maxEmergencySlots: queue.queueStatus?.max_emergency_slots || 5
      };
    } catch (error) {
      logger.error('Error getting queue summary:', error);
      throw error;
    }
  }
}

module.exports = Queue;
