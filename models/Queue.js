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
          u.name as doctor_name,
          doc.specialty
        FROM queue_status qs
        JOIN doctors doc ON qs.doctor_id = doc.id
        JOIN users u ON doc.user_id = u.id
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
  static async getDoctorQueue(doctorId, date = null, onlyPaid = null) {
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    try {
      // Get queue status
      const queueStatus = await this.getQueueStatus(doctorId, queueDate);
      
      // Determine if we should filter by paid patients only
      // If onlyPaid is explicitly set, use that. Otherwise, use queue active status
      const filterPaidOnly = onlyPaid !== null ? onlyPaid : (queueStatus && queueStatus.is_active);
      
      // Build appointments query with conditional payment filter
      let appointmentsQuery = `
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
      `;
      
      // Add payment filter if queue is active
      if (filterPaidOnly) {
        appointmentsQuery += ` AND a.payment_status = 'paid'`;
      }
      
      appointmentsQuery += `
        ORDER BY 
          a.is_emergency DESC,
          CASE 
            WHEN a.is_emergency THEN CAST(SUBSTRING(a.queue_number, 2) AS UNSIGNED)
            ELSE CAST(a.queue_number AS UNSIGNED)
          END ASC
      `;
      
      const appointments = await mysqlConnection.query(appointmentsQuery, [doctorId, queueDate]);
      
      // Get all appointments for statistics (regardless of payment status)
      const allAppointmentsQuery = `
        SELECT * FROM appointments 
        WHERE doctor_id = ? AND queue_date = ?
      `;
      const allAppointments = await mysqlConnection.query(allAppointmentsQuery, [doctorId, queueDate]);
      
      // Ensure queueStatus has properly converted boolean values and all necessary fields
      const enhancedQueueStatus = queueStatus ? {
        id: queueStatus.id,
        doctor_id: queueStatus.doctor_id,
        is_active: Boolean(queueStatus.is_active), // Ensure boolean conversion
        available_from: queueStatus.available_from,
        available_to: queueStatus.available_to,
        current_number: queueStatus.current_number,
        current_emergency_number: queueStatus.current_emergency_number,
        regular_count: queueStatus.regular_count || 0,
        emergency_used: queueStatus.emergency_used || 0,
        max_emergency_slots: queueStatus.max_emergency_slots || 5,
        queue_date: queueStatus.queue_date,
        created_at: queueStatus.created_at,
        updated_at: queueStatus.updated_at,
        doctor_name: queueStatus.doctor_name,
        specialty: queueStatus.specialty
      } : {
        doctor_id: doctorId,
        is_active: false,
        available_from: '09:00:00',
        available_to: '17:00:00',
        current_number: '0',
        current_emergency_number: 'E0',
        regular_count: 0,
        emergency_used: 0,
        max_emergency_slots: 5,
        queue_date: queueDate,
        created_at: null,
        updated_at: null,
        message: 'No queue found for this date'
      };

      return {
        queueStatus: enhancedQueueStatus,
        appointments, // Filtered appointments (paid only if queue is active)
        allAppointments, // All appointments for complete statistics
        isFiltered: filterPaidOnly,
        totalPatients: allAppointments.length,
        displayedPatients: appointments.length, // Patients currently shown (paid only if filtered)
        emergencyPatients: allAppointments.filter(a => a.is_emergency).length,
        regularPatients: allAppointments.filter(a => !a.is_emergency).length,
        pending: allAppointments.filter(a => a.status === 'pending').length,
        inProgress: allAppointments.filter(a => a.status === 'in-progress').length,
        completed: allAppointments.filter(a => a.status === 'completed').length,
        // Payment statistics (from all appointments)
        paidAppointments: allAppointments.filter(a => a.payment_status === 'paid').length,
        unpaidAppointments: allAppointments.filter(a => a.payment_status === 'unpaid').length,
        partiallyPaidAppointments: allAppointments.filter(a => a.payment_status === 'partially_paid').length,
        refundedAppointments: allAppointments.filter(a => a.payment_status === 'refunded').length,
        // Filtered statistics (from displayed appointments)
        filteredStats: {
          pending: appointments.filter(a => a.status === 'pending').length,
          inProgress: appointments.filter(a => a.status === 'in-progress').length,
          completed: appointments.filter(a => a.status === 'completed').length,
          emergency: appointments.filter(a => a.is_emergency).length,
          regular: appointments.filter(a => !a.is_emergency).length
        }
      };
    } catch (error) {
      logger.error('Error fetching doctor queue:', error);
      throw error;
    }
  }

  // Get next queue number for booking (regular appointments only)
  static async getNextQueueNumber(doctorId, isEmergency = false, date = null) {
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    try {
      // Ensure queue status exists for the date
      await this.ensureQueueExists(doctorId, queueDate);
      
      // Always assign regular number (no emergency appointments)
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
      
      // Default values if queue status doesn't exist
      const currentNumber = queueStatus?.current_number || '0';
      const currentEmergencyNumber = queueStatus?.current_emergency_number || 'E0';
      
      let position = 0;
      let currentlyServing = false;
      
      if (appointment.is_emergency) {
        const emergencyNum = parseInt(appointment.queue_number.toString().substring(1));
        const currentEmergencyNum = parseInt(currentEmergencyNumber.substring(1));
        
        if (emergencyNum <= currentEmergencyNum) {
          currentlyServing = emergencyNum === currentEmergencyNum;
          position = 0;
        } else {
          position = emergencyNum - currentEmergencyNum;
        }
      } else {
        const patientNum = parseInt(appointment.queue_number);
        const currentNum = parseInt(currentNumber);
        
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
        currentNumber: appointment.is_emergency ? currentEmergencyNumber : currentNumber
      };
    } catch (error) {
      logger.error('Error getting patient queue position:', error);
      throw error;
    }
  }

  // Get patient's positions in all queues for a specific date
  static async getAllPatientQueuePositions(patientId, date = null) {
    if (!patientId) {
      throw new Error('Patient ID is required');
    }
    
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    try {
      // Get all appointments for the patient on the given date
      const appointmentsQuery = `
        SELECT 
          a.doctor_id, a.queue_number, a.is_emergency, a.status,
          u.name as doctor_name, d.specialty
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users u ON d.user_id = u.id
        WHERE a.patient_id = ? AND a.queue_date = ?
        ORDER BY a.is_emergency DESC, a.queue_number ASC
      `;
      
      const appointments = await mysqlConnection.query(appointmentsQuery, [patientId, queueDate]);
      
      if (!appointments || appointments.length === 0) {
        return [];
      }
      
      // Get queue position for each appointment
      const positions = [];
      for (const appointment of appointments) {
        try {
          const position = await this.getPatientQueuePosition(
            patientId, 
            appointment.doctor_id, 
            queueDate
          );
          
          if (position) {
            positions.push({
              doctorId: appointment.doctor_id,
              doctorName: appointment.doctor_name,
              specialty: appointment.specialty,
              ...position
            });
          }
        } catch (error) {
          logger.error(`Error getting position for doctor ${appointment.doctor_id}:`, error);
          // Continue with other appointments even if one fails
        }
      }
      
      return positions;
    } catch (error) {
      logger.error('Error getting all patient queue positions:', error);
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

  // Get next paid patient in queue (simplified - no emergency handling)
  static async getNextPaidPatient(doctorId, date = null) {
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    try {
      // Get queue status to check if active
      const queueStatus = await this.getQueueStatus(doctorId, queueDate);
      
      if (!queueStatus || !queueStatus.is_active) {
        return {
          success: false,
          message: 'Queue is not active'
        };
      }

      // Get current number being served
      const currentNumber = queueStatus.current_number || '0';

      // Look for next patient (paid and scheduled/confirmed/in-progress)
      const patientQuery = `
        SELECT 
          a.*,
          u.name as patient_name,
          u.phone as patient_phone,
          p.date_of_birth,
          TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) as patient_age
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE a.doctor_id = ? 
          AND a.queue_date = ?
          AND a.payment_status = 'paid'
          AND a.status IN ('scheduled', 'confirmed', 'in-progress')
          AND CAST(a.queue_number AS UNSIGNED) > CAST(? AS UNSIGNED)
        ORDER BY CAST(a.queue_number AS UNSIGNED) ASC
        LIMIT 1
      `;
      
      const [patient] = await mysqlConnection.query(patientQuery, [doctorId, queueDate, currentNumber]);

      if (patient) {
        return {
          success: true,
          type: 'regular',
          patient: patient
        };
      }

      return {
        success: false,
        message: 'No more paid patients in queue'
      };
    } catch (error) {
      logger.error('Error getting next paid patient:', error);
      throw error;
    }
  }

  // Advance queue to next paid patient and update current number
  static async advanceToNextPaidPatient(doctorId, date = null) {
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const nextPatient = await this.getNextPaidPatient(doctorId, queueDate);
      
      if (!nextPatient.success) {
        return nextPatient;
      }

      const patient = nextPatient.patient;
      const isEmergency = patient.is_emergency;
      
      // Update current number in queue_status
      await this.updateCurrentNumber(doctorId, patient.queue_number, isEmergency, queueDate);
      
      return {
        success: true,
        message: 'Queue advanced to next paid patient',
        patient: patient,
        type: nextPatient.type,
        currentNumber: patient.queue_number
      };
    } catch (error) {
      logger.error('Error advancing queue to next paid patient:', error);
      throw error;
    }
  }
}

module.exports = Queue;
