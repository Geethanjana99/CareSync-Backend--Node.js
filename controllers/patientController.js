const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const logger = require('../config/logger');

class PatientController {
  // Get patient profile
  static async getProfile(req, res, next) {
    try {
      const patient = await Patient.findByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }

      res.json({
        success: true,
        data: patient
      });
    } catch (error) {
      logger.error('Error fetching patient profile:', error);
      next(error);
    }
  }

  // Update patient profile
  static async updateProfile(req, res, next) {
    try {
      const {
        emergency_contact_name,
        emergency_contact_phone,
        medical_history,
        allergies,
        current_medications,
        insurance_provider,
        insurance_policy_number,
        blood_type,
        height,
        weight
      } = req.body;

      const patient = await Patient.findByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }

      const updatedPatient = await Patient.update(patient.id, {
        emergency_contact_name,
        emergency_contact_phone,
        medical_history,
        allergies,
        current_medications,
        insurance_provider,
        insurance_policy_number,
        blood_type,
        height,
        weight
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedPatient
      });

      logger.info(`Patient profile updated: ${patient.id}`);
    } catch (error) {
      logger.error('Error updating patient profile:', error);
      next(error);
    }
  }

  // Get patient appointment history
  static async getAppointmentHistory(req, res, next) {
    try {
      const patient = await Patient.findByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }

      const {
        page = 1,
        limit = 10,
        status,
        startDate,
        endDate
      } = req.query;      const filters = {
        patient_id: patient.id,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      };

      if (status) {
        if (typeof status === 'string') {
          filters.status = [status];
        } else {
          filters.status = status;
        }
      }

      if (startDate) {
        filters.date_from = startDate;
      }

      if (endDate) {
        filters.date_to = endDate;
      }

      const appointments = await Appointment.findAll(filters);
      
      console.log('Patient appointments query result:');
      console.log('Filters used:', filters);
      console.log('Number of appointments found:', appointments.length);
      if (appointments.length > 0) {
        console.log('Sample appointment data:', {
          id: appointments[0].id,
          doctor_name: appointments[0].doctor_name,
          doctorName: appointments[0].doctorName,
          specialty: appointments[0].specialty,
          doctorSpecialty: appointments[0].doctorSpecialty,
          doctor_id: appointments[0].doctor_id
        });
      }

      res.json({
        success: true,
        data: {
          appointments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: appointments.length
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching appointment history:', error);
      next(error);
    }
  }

  // Get upcoming appointments for patient
  static async getUpcomingAppointments(req, res, next) {
    try {
      const patient = await Patient.findByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }

      const { limit = 5 } = req.query;

      const filters = {
        patient_id: patient.id,
        status: ['scheduled', 'confirmed'],
        date_from: new Date().toISOString().split('T')[0], // Today onwards
        limit: parseInt(limit)
      };

      const appointments = await Appointment.findAll(filters);

      res.json({
        success: true,
        data: {
          appointments
        }
      });
    } catch (error) {
      logger.error('Error fetching upcoming appointments:', error);
      next(error);
    }
  }

  // Get patient's medical reports
  static async getMedicalReports(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      const patient = await Patient.findByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }

      const reports = await Patient.getMedicalReports(patient.id, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: reports
      });
    } catch (error) {
      logger.error('Error fetching medical reports:', error);
      next(error);
    }
  }

  // Update health metrics
  static async updateHealthMetrics(req, res, next) {
    try {
      const { blood_pressure, heart_rate, temperature, weight, notes } = req.body;
      
      const patient = await Patient.findByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }

      const healthMetric = await Patient.addHealthMetric(patient.id, {
        blood_pressure,
        heart_rate,
        temperature,
        weight,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Health metrics updated successfully',
        data: healthMetric
      });

      logger.info(`Health metrics updated for patient: ${patient.id}`);
    } catch (error) {
      logger.error('Error updating health metrics:', error);
      next(error);
    }
  }

  // Get health metrics history
  static async getHealthMetrics(req, res, next) {
    try {
      const { page = 1, limit = 20, startDate, endDate } = req.query;
      
      const patient = await Patient.findByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }

      const metrics = await Patient.getHealthMetrics(patient.id, {
        page: parseInt(page),
        limit: parseInt(limit),
        startDate,
        endDate
      });

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error fetching health metrics:', error);
      next(error);
    }
  }

  // Search doctors
  static async searchDoctors(req, res, next) {
    try {
      const { specialty, name, location, rating, page = 1, limit = 10 } = req.query;
      
      const doctors = await Patient.searchDoctors({
        specialty,
        name,
        location,
        rating: rating ? parseFloat(rating) : null,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: doctors
      });
    } catch (error) {
      logger.error('Error searching doctors:', error);
      next(error);
    }
  }

  // Get patient dashboard data
  static async getDashboard(req, res, next) {
    try {
      const patient = await Patient.findByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }

      const [upcomingAppointments, recentMetrics, pendingReports] = await Promise.all([
        Appointment.findUpcomingByPatientId(patient.id, 3),
        Patient.getRecentHealthMetrics(patient.id, 5),
        Patient.getPendingReports(patient.id)
      ]);

      res.json({
        success: true,
        data: {
          patient: {
            id: patient.id,
            name: `${patient.first_name} ${patient.last_name}`,
            next_appointment: upcomingAppointments[0] || null
          },
          upcomingAppointments,
          recentMetrics,
          pendingReports: pendingReports.length,
          notifications: {
            unread: 0 // Will be implemented with notification service
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching patient dashboard:', error);
      next(error);
    }
  }

  // Book queue-based appointment
  static async bookQueueAppointment(req, res, next) {
    try {
      const {
        doctorId,
        appointmentDate,
        appointmentType = 'consultation',
        reasonForVisit,
        symptoms,
        priority = 'medium',
        paymentMethod = 'counter',
        paymentStatus = 'unpaid'
      } = req.body;

      const patient = await Patient.findByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }

      // Convert public doctor ID to internal ID if needed
      let internalDoctorId = doctorId;
      
      // Check if doctorId is a public ID (like 'D001') and convert to internal ID
      if (typeof doctorId === 'string' && doctorId.startsWith('D')) {
        const { mysqlConnection } = require('../config/mysql');
        const doctorResult = await mysqlConnection.query(
          'SELECT id FROM doctors WHERE doctor_id = ?',
          [doctorId]
        );
        
        if (doctorResult.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Doctor not found'
          });
        }
        
        internalDoctorId = doctorResult[0].id;
      }

      // Check if doctor is available for the date
      const availability = await Queue.isDoctorAvailable(internalDoctorId, appointmentDate);
      if (!availability.available) {
        return res.status(400).json({
          success: false,
          message: availability.reason
        });
      }

      // Get doctor information for consultation fee
      const { mysqlConnection } = require('../config/mysql');
      const doctorInfoResult = await mysqlConnection.query(
        'SELECT consultation_fee FROM doctors WHERE id = ?',
        [internalDoctorId]
      );
      
      const doctorInfo = doctorInfoResult[0] || {};

      // Check if patient already has appointment with this doctor on this date
      const existingAppointment = await Appointment.findByPatientAndDoctorAndDate(
        patient.id, 
        internalDoctorId, 
        appointmentDate
      );

      if (existingAppointment && existingAppointment.status !== 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'You already have an appointment with this doctor on this date'
        });
      }

      // Create queue-based appointment
      const appointmentData = {
        patient_id: patient.id,
        doctor_id: internalDoctorId,
        appointment_date: appointmentDate,
        appointment_type: appointmentType,
        reason_for_visit: reasonForVisit || '',
        symptoms: symptoms || '',
        priority: priority || 'normal',
        notes: '', // Default empty notes
        consultation_fee: doctorInfo.consultation_fee || 0, // Use doctor's fee or default to 0
        is_emergency: false, // Always set to false (no emergency appointments)
        status: 'scheduled', // Use valid enum value instead of 'pending'
        payment_status: paymentStatus, // Add payment status
        scheduled_by: req.user.id // Track who scheduled the appointment
      };

      const appointment = await Appointment.createQueueAppointment(appointmentData);

      // If payment was made immediately, create billing record
      if (paymentStatus === 'paid' && paymentMethod !== 'counter') {
        try {
          const invoiceNumber = `INV-${Date.now()}-${appointment.appointment_id}`;
          const billingData = {
            appointment_id: appointment.id,
            patient_id: patient.id,
            doctor_id: internalDoctorId,
            invoice_number: invoiceNumber,
            amount: doctorInfo.consultation_fee || 0,
            tax_amount: 0,
            total_amount: doctorInfo.consultation_fee || 0,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            transaction_id: `TXN-${Date.now()}`,
            payment_gateway: paymentMethod === 'card' ? 'stripe' : paymentMethod,
            paid_at: new Date()
          };

          await mysqlConnection.query(`
            INSERT INTO billing (
              appointment_id, patient_id, doctor_id, invoice_number, 
              amount, tax_amount, total_amount, payment_method, 
              payment_status, transaction_id, payment_gateway, paid_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            billingData.appointment_id,
            billingData.patient_id,
            billingData.doctor_id,
            billingData.invoice_number,
            billingData.amount,
            billingData.tax_amount,
            billingData.total_amount,
            billingData.payment_method,
            billingData.payment_status,
            billingData.transaction_id,
            billingData.payment_gateway,
            billingData.paid_at
          ]);

          logger.info(`Billing record created for appointment ${appointment.id}: ${invoiceNumber}`);
        } catch (billingError) {
          logger.error('Error creating billing record:', billingError);
          // Continue with appointment booking even if billing fails
        }
      }

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: {
          appointment,
          queueNumber: appointment.queue_number,
          paymentStatus: paymentStatus,
          paymentMethod: paymentMethod,
          consultationFee: doctorInfo.consultation_fee || 0,
          message: `Appointment booked. Your queue number is ${appointment.queue_number}`
        }
      });

      logger.info(`Queue appointment booked: ${appointment.id} for patient ${patient.id}`);
    } catch (error) {
      logger.error('Error booking queue appointment:', error);
      next(error);
    }
  }

  // Get patient's queue position (enhanced with paid-only filtering when queue is active)
  static async getQueuePosition(req, res, next) {
    try {
      const { doctorId, date } = req.query;
      
      const patient = await Patient.findByUserId(req.user.id);
      
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }

      // Use current date if not provided
      const queueDate = date || new Date().toISOString().split('T')[0];

      const { mysqlConnection } = require('../config/mysql');
      
      if (doctorId) {
        // Get appointment for specific doctor with enhanced queue logic
        
        // First get the appointment and queue status
        const appointmentQuery = `
          SELECT 
            a.*,
            u.name as doctor_name,
            d.specialty
          FROM appointments a
          JOIN doctors d ON a.doctor_id = d.id
          JOIN users u ON d.user_id = u.id
          WHERE a.patient_id = ? AND a.doctor_id = ? AND a.queue_date = ?
        `;
        
        const [appointment] = await mysqlConnection.query(appointmentQuery, [patient.id, doctorId, queueDate]);

        if (!appointment) {
          return res.status(404).json({
            success: false,
            message: 'No appointment found for this date and doctor'
          });
        }

        // Get queue status to check if active
        const queueStatusQuery = `
          SELECT * FROM queue_status 
          WHERE doctor_id = ? AND queue_date = ?
        `;
        
        const [queueStatus] = await mysqlConnection.query(queueStatusQuery, [doctorId, queueDate]);
        
        const isQueueActive = queueStatus && queueStatus.is_active;
        
        // Calculate position based on queue active status
        let position = 0;
        let currentlyServing = false;
        let isNextPatient = false;
        let estimatedWaitingTime = 0;
        
        if (isQueueActive) {
          // Get current serving numbers
          const currentNumber = parseInt(queueStatus.current_number || '0');
          const currentEmergencyNumber = queueStatus.current_emergency_number || 'E0';
          
          if (appointment.is_emergency) {
            const patientEmergencyNum = parseInt(appointment.queue_number.toString().substring(1));
            const currentEmergencyNum = parseInt(currentEmergencyNumber.substring(1));
            
            // Check status for emergency patients
            if (currentEmergencyNum === patientEmergencyNum) {
              currentlyServing = true;
              position = 0;
              estimatedWaitingTime = "now";
            } else if (currentEmergencyNum + 1 === patientEmergencyNum) {
              isNextPatient = true;
              position = 1;
              estimatedWaitingTime = 15;
            } else {
              position = patientEmergencyNum - currentEmergencyNum;
              estimatedWaitingTime = position * 15;
            }
          } else {
            const patientNum = parseInt(appointment.queue_number);
            
            // Check status for regular patients
            if (currentNumber === patientNum) {
              currentlyServing = true;
              position = 0;
              estimatedWaitingTime = "now";
            } else if (currentNumber + 1 === patientNum) {
              isNextPatient = true;
              position = 1;
              estimatedWaitingTime = 15;
            } else {
              position = patientNum - currentNumber;
              estimatedWaitingTime = position * 15;
            }
          }
          
          // For emergency patients in active queue - return early
          if (appointment.is_emergency) {
            const enhancedQueueStatus = queueStatus ? {
              is_active: Boolean(queueStatus.is_active),
              current_number: queueStatus.current_number,
              current_emergency_number: queueStatus.current_emergency_number,
              available_from: queueStatus.available_from,
              available_to: queueStatus.available_to,
              queue_date: queueStatus.queue_date
            } : {
              is_active: false,
              current_number: '0',
              current_emergency_number: 'E0',
              available_from: '09:00:00',
              available_to: '17:00:00',
              queue_date: queueDate
            };

            return res.json({
              success: true,
              data: {
                queueNumber: appointment.queue_number,
                isEmergency: appointment.is_emergency,
                status: appointment.status,
                paymentStatus: appointment.payment_status,
                position: appointment.payment_status === 'paid' ? position : null,
                doctorId: appointment.doctor_id,
                doctorName: appointment.doctor_name,
                specialty: appointment.specialty,
                queueActive: isQueueActive,
                currentlyServing: currentlyServing,
                nextPatient: isNextPatient,
                estimatedWaitingTime: estimatedWaitingTime,
                queueStatus: enhancedQueueStatus,
                currentNumber: enhancedQueueStatus.current_number,
                currentEmergencyNumber: enhancedQueueStatus.current_emergency_number,
                message: appointment.payment_status !== 'paid' 
                  ? 'Please complete payment to join the active queue'
                  : currentlyServing ? 'Your turn'
                  : isNextPatient ? 'You are next!' 
                  : position > 0 ? `${position} emergency patients ahead of you (Est. wait: ${estimatedWaitingTime} min)`
                  : 'Please wait for your turn'
              }
            });
          }
        } else {
          // Queue not active - show traditional position among all patients
          const positionQuery = `
            SELECT COUNT(*) as position
            FROM appointments 
            WHERE doctor_id = ? 
              AND queue_date = ? 
              AND queue_number < ?
              AND status IN ('pending', 'scheduled', 'confirmed', 'in-progress')
          `;
          const [positionResult] = await mysqlConnection.query(positionQuery, [doctorId, queueDate, appointment.queue_number]);
          position = positionResult.position;
        }

        // For emergency patients in active queue
        if (isQueueActive && appointment.is_emergency) {
          // This case is already handled above - this comment block can be removed
        }

        // Enhanced queue status information
        const enhancedQueueStatus = queueStatus ? {
          is_active: Boolean(queueStatus.is_active),
          current_number: queueStatus.current_number,
          current_emergency_number: queueStatus.current_emergency_number,
          available_from: queueStatus.available_from,
          available_to: queueStatus.available_to,
          queue_date: queueStatus.queue_date
        } : {
          is_active: false,
          current_number: '0',
          current_emergency_number: 'E0',
          available_from: '09:00:00',
          available_to: '17:00:00',
          queue_date: queueDate
        };

        // Standard response for inactive queue or regular patients
        res.json({
          success: true,
          data: {
            queueNumber: appointment.queue_number,
            isEmergency: appointment.is_emergency,
            status: appointment.status,
            paymentStatus: appointment.payment_status,
            position: isQueueActive && appointment.payment_status === 'paid' ? position : position + 1,
            doctorId: appointment.doctor_id,
            doctorName: appointment.doctor_name,
            specialty: appointment.specialty,
            queueActive: isQueueActive,
            currentlyServing: currentlyServing,
            nextPatient: isNextPatient,
            estimatedWaitingTime: estimatedWaitingTime,
            queueStatus: enhancedQueueStatus,
            currentNumber: enhancedQueueStatus.current_number,
            currentEmergencyNumber: enhancedQueueStatus.current_emergency_number,
            message: !isQueueActive 
              ? 'Doctor has not started the queue yet'
              : appointment.payment_status !== 'paid' 
                ? 'Please complete payment to join the active queue'
                : currentlyServing ? 'Your turn'
                : isNextPatient ? 'You are next!' 
                : position > 0 ? `${position} patients ahead of you (Est. wait: ${estimatedWaitingTime} min)`
                : 'Please wait for your turn'
          }
        });

      } else {
        // Get appointments for all doctors (fallback to original logic)
        const query = `
          SELECT 
            a.queue_number,
            a.is_emergency,
            a.status,
            a.payment_status,
            a.doctor_id,
            u.name as doctor_name,
            d.specialty,
            (SELECT COUNT(*) FROM appointments a2 
             WHERE a2.doctor_id = a.doctor_id 
             AND a2.queue_date = a.queue_date 
             AND a2.queue_number < a.queue_number
             AND a2.status IN ('scheduled', 'confirmed', 'in-progress')) as position
          FROM appointments a
          JOIN doctors d ON a.doctor_id = d.id
          JOIN users u ON d.user_id = u.id
          WHERE a.patient_id = ? AND a.queue_date = ?
          ORDER BY a.is_emergency DESC, a.queue_number ASC
        `;
        
        const appointments = await mysqlConnection.query(query, [patient.id, queueDate]);

        if (!appointments || appointments.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'No appointments found for this date'
          });
        }

        // Get queue status for each unique doctor
        const doctorIds = [...new Set(appointments.map(apt => apt.doctor_id))];
        const queueStatusPromises = doctorIds.map(async (doctorId) => {
          const statusQuery = `
            SELECT 
              doctor_id,
              is_active,
              current_number,
              current_emergency_number,
              available_from,
              available_to,
              queue_date
            FROM queue_status 
            WHERE doctor_id = ? AND queue_date = ?
          `;
          const [status] = await mysqlConnection.query(statusQuery, [doctorId, queueDate]);
          return {
            doctorId,
            queueStatus: status ? {
              is_active: Boolean(status.is_active),
              current_number: status.current_number,
              current_emergency_number: status.current_emergency_number,
              available_from: status.available_from,
              available_to: status.available_to,
              queue_date: status.queue_date
            } : {
              is_active: false,
              current_number: '0',
              current_emergency_number: 'E0',
              available_from: '09:00:00',
              available_to: '17:00:00',
              queue_date: queueDate
            }
          };
        });

        const queueStatuses = await Promise.all(queueStatusPromises);
        const queueStatusMap = Object.fromEntries(
          queueStatuses.map(qs => [qs.doctorId, qs.queueStatus])
        );

        // Format response for multiple appointments with queue status and enhanced logic
        const formattedAppointments = await Promise.all(appointments.map(async (apt) => {
          const queueStatus = queueStatusMap[apt.doctor_id];
          const isQueueActive = queueStatus.is_active;
          
          // Calculate enhanced position information for each appointment
          let currentlyServing = false;
          let isNextPatient = false;
          let estimatedWaitingTime = 0;
          let position = apt.position;
          
          if (isQueueActive && apt.payment_status === 'paid') {
            // Get current serving numbers
            const currentNumber = parseInt(queueStatus.current_number || '0');
            const currentEmergencyNumber = queueStatus.current_emergency_number || 'E0';
            
            if (apt.is_emergency) {
              const patientEmergencyNum = parseInt(apt.queue_number.toString().substring(1));
              const currentEmergencyNum = parseInt(currentEmergencyNumber.substring(1));
              
              // Check status for emergency patients
              if (currentEmergencyNum === patientEmergencyNum) {
                currentlyServing = true;
                position = 0;
                estimatedWaitingTime = "now";
              } else if (currentEmergencyNum + 1 === patientEmergencyNum) {
                isNextPatient = true;
                position = 1;
                estimatedWaitingTime = 15;
              } else {
                position = patientEmergencyNum - currentEmergencyNum;
                estimatedWaitingTime = position * 15;
              }
            } else {
              const patientNum = parseInt(apt.queue_number);
              
              // Check status for regular patients
              if (currentNumber === patientNum) {
                currentlyServing = true;
                position = 0;
                estimatedWaitingTime = "now";
              } else if (currentNumber + 1 === patientNum) {
                isNextPatient = true;
                position = 1;
                estimatedWaitingTime = 15;
              } else {
                position = patientNum - currentNumber;
                estimatedWaitingTime = position * 15;
              }
            }
          }
          
          return {
            queueNumber: apt.queue_number,
            isEmergency: apt.is_emergency,
            status: apt.status,
            paymentStatus: apt.payment_status,
            position: isQueueActive && apt.payment_status === 'paid' ? position : apt.position + 1,
            doctorId: apt.doctor_id,
            doctorName: apt.doctor_name,
            specialty: apt.specialty,
            currentlyServing: currentlyServing,
            nextPatient: isNextPatient,
            estimatedWaitingTime: estimatedWaitingTime,
            queueStatus: queueStatus,
            queueActive: queueStatus.is_active,
            currentNumber: queueStatus.current_number,
            currentEmergencyNumber: queueStatus.current_emergency_number,
            message: !isQueueActive 
              ? 'Doctor has not started the queue yet'
              : apt.payment_status !== 'paid' 
                ? 'Please complete payment to join the active queue'
                : currentlyServing ? 'Your turn'
                : isNextPatient ? 'You are next!' 
                : position > 0 ? `${position} patients ahead of you (Est. wait: ${estimatedWaitingTime} min)`
                : 'Please wait for your turn'
          };
        }));

        res.json({
          success: true,
          data: formattedAppointments
        });
      }
    } catch (error) {
      logger.error('Error getting queue position:', error);
      next(error);
    }
  }

  // Get current queue status for a doctor
  static async getDoctorQueueStatus(req, res, next) {
    try {
      const { doctorId, date } = req.query;
      
      const queueSummary = await Queue.getQueueSummary(doctorId, date);
      
      res.json({
        success: true,
        data: queueSummary
      });
    } catch (error) {
      logger.error('Error getting doctor queue status:', error);
      next(error);
    }
  }

  // Get next patient notification - tells patient if they are next or should be ready
  static async getNextPatientNotification(req, res, next) {
    try {
      const { doctorId, date } = req.query;
      
      const patient = await Patient.findByUserId(req.user.id);
      
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }

      const queueDate = date || new Date().toISOString().split('T')[0];
      const { mysqlConnection } = require('../config/mysql');

      // Get patient's appointment
      const appointmentQuery = `
        SELECT 
          a.*,
          u.name as doctor_name,
          d.specialty
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users u ON d.user_id = u.id
        WHERE a.patient_id = ? AND a.doctor_id = ? AND a.queue_date = ?
      `;
      
      const [appointment] = await mysqlConnection.query(appointmentQuery, [patient.id, doctorId, queueDate]);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'No appointment found for this date and doctor'
        });
      }

      // Check if patient has paid
      if (appointment.payment_status !== 'paid') {
        return res.json({
          success: true,
          data: {
            status: 'payment_required',
            message: 'Please complete payment to join the queue',
            appointment: {
              queueNumber: appointment.queue_number,
              isEmergency: appointment.is_emergency,
              doctorName: appointment.doctor_name,
              specialty: appointment.specialty,
              paymentStatus: appointment.payment_status
            }
          }
        });
      }

      // Get queue status
      const queueStatusQuery = `
        SELECT * FROM queue_status 
        WHERE doctor_id = ? AND queue_date = ?
      `;
      
      const [queueStatus] = await mysqlConnection.query(queueStatusQuery, [doctorId, queueDate]);

      if (!queueStatus || !queueStatus.is_active) {
        return res.json({
          success: true,
          data: {
            status: 'queue_not_active',
            message: 'Doctor has not started the queue yet',
            appointment: {
              queueNumber: appointment.queue_number,
              isEmergency: appointment.is_emergency,
              doctorName: appointment.doctor_name,
              specialty: appointment.specialty
            }
          }
        });
      }

      // Get current position among paid patients only
      const currentNumber = queueStatus.current_number || '0';
      const currentEmergencyNumber = queueStatus.current_emergency_number || 'E0';

      let positionQuery, positionParams;
      let nextPatientQuery, nextPatientParams;

      if (appointment.is_emergency) {
        // For emergency patients
        const patientNumber = parseInt(appointment.queue_number.substring(1));
        const currentEmergencyNum = parseInt(currentEmergencyNumber.substring(1));

        if (patientNumber <= currentEmergencyNum) {
          // Patient's turn has passed or is current
          return res.json({
            success: true,
            data: {
              status: appointment.status === 'completed' ? 'completed' : 'current_or_missed',
              message: appointment.status === 'completed' 
                ? 'Your consultation is completed' 
                : 'Your turn is now or has passed. Please check with the doctor.',
              appointment: {
                queueNumber: appointment.queue_number,
                isEmergency: appointment.is_emergency,
                doctorName: appointment.doctor_name,
                status: appointment.status
              }
            }
          });
        }

        // Count emergency patients ahead who are paid
        positionQuery = `
          SELECT COUNT(*) as position
          FROM appointments 
          WHERE doctor_id = ? 
            AND queue_date = ? 
            AND is_emergency = TRUE 
            AND payment_status = 'paid'
            AND CAST(SUBSTRING(queue_number, 2) AS UNSIGNED) > CAST(SUBSTRING(?, 2) AS UNSIGNED)
            AND CAST(SUBSTRING(queue_number, 2) AS UNSIGNED) < ?
        `;
        positionParams = [doctorId, queueDate, currentEmergencyNumber, patientNumber];

        // Check if this patient is next emergency
        nextPatientQuery = `
          SELECT MIN(CAST(SUBSTRING(queue_number, 2) AS UNSIGNED)) as next_number
          FROM appointments 
          WHERE doctor_id = ? 
            AND queue_date = ? 
            AND is_emergency = TRUE 
            AND payment_status = 'paid'
            AND status IN ('pending', 'in-progress')
            AND CAST(SUBSTRING(queue_number, 2) AS UNSIGNED) > CAST(SUBSTRING(?, 2) AS UNSIGNED)
        `;
        nextPatientParams = [doctorId, queueDate, currentEmergencyNumber];

      } else {
        // For regular patients
        const patientNumber = parseInt(appointment.queue_number);
        const currentRegularNum = parseInt(currentNumber);

        if (patientNumber <= currentRegularNum) {
          // Patient's turn has passed or is current
          return res.json({
            success: true,
            data: {
              status: appointment.status === 'completed' ? 'completed' : 'current_or_missed',
              message: appointment.status === 'completed' 
                ? 'Your consultation is completed' 
                : 'Your turn is now or has passed. Please check with the doctor.',
              appointment: {
                queueNumber: appointment.queue_number,
                isEmergency: appointment.is_emergency,
                doctorName: appointment.doctor_name,
                status: appointment.status
              }
            }
          });
        }

        // Count regular patients ahead who are paid
        positionQuery = `
          SELECT COUNT(*) as position
          FROM appointments 
          WHERE doctor_id = ? 
            AND queue_date = ? 
            AND is_emergency = FALSE 
            AND payment_status = 'paid'
            AND CAST(queue_number AS UNSIGNED) > ?
            AND CAST(queue_number AS UNSIGNED) < ?
        `;
        positionParams = [doctorId, queueDate, currentRegularNum, patientNumber];

        // Check if this patient is next regular (after all emergency patients)
        nextPatientQuery = `
          SELECT MIN(CAST(queue_number AS UNSIGNED)) as next_number
          FROM appointments 
          WHERE doctor_id = ? 
            AND queue_date = ? 
            AND is_emergency = FALSE 
            AND payment_status = 'paid'
            AND status IN ('pending', 'in-progress')
            AND CAST(queue_number AS UNSIGNED) > ?
        `;
        nextPatientParams = [doctorId, queueDate, currentRegularNum];
      }

      const [positionResult] = await mysqlConnection.query(positionQuery, positionParams);
      const [nextPatientResult] = await mysqlConnection.query(nextPatientQuery, nextPatientParams);

      const position = positionResult.position + 1; // Add 1 because position 0 means current
      const isNext = appointment.is_emergency 
        ? nextPatientResult.next_number === parseInt(appointment.queue_number.substring(1))
        : nextPatientResult.next_number === parseInt(appointment.queue_number);

      // Generate appropriate notification message
      let status, message;
      
      if (isNext) {
        status = 'be_ready';
        message = 'BE READY! You are next in line. Please prepare for your consultation.';
      } else if (position <= 2) {
        status = 'prepare';
        message = `You are ${position === 1 ? 'next' : `${position} patients away`}. Please prepare.`;
      } else {
        status = 'waiting';
        message = `You are ${position} patients away from your turn.`;
      }

      res.json({
        success: true,
        data: {
          status,
          message,
          position,
          isNext,
          appointment: {
            queueNumber: appointment.queue_number,
            isEmergency: appointment.is_emergency,
            doctorName: appointment.doctor_name,
            specialty: appointment.specialty,
            status: appointment.status
          },
          queueInfo: {
            currentNumber: appointment.is_emergency ? currentEmergencyNumber : currentNumber,
            isActive: queueStatus.is_active
          }
        }
      });

    } catch (error) {
      logger.error('Error getting patient notification:', error);
      next(error);
    }
  }


}

module.exports = PatientController;
