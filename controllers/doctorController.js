const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Queue = require('../models/Queue');
const logger = require('../config/logger');
const { mysqlConnection } = require('../config/mysql');

class DoctorController {
  // Get doctor profile
  static async getProfile(req, res, next) {
    try {
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      res.json({
        success: true,
        data: doctor
      });
    } catch (error) {
      logger.error('Error fetching doctor profile:', error);
      next(error);
    }
  }

  // Update doctor profile
  static async updateProfile(req, res, next) {
    try {
      const {
        specialization,
        license_number,
        years_of_experience,
        education,
        certifications,
        bio,
        consultation_fee,
        languages,
        clinic_address,
        clinic_phone
      } = req.body;

      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const updatedDoctor = await Doctor.update(doctor.id, {
        specialization,
        license_number,
        years_of_experience,
        education,
        certifications,
        bio,
        consultation_fee,
        languages,
        clinic_address,
        clinic_phone
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedDoctor
      });

      logger.info(`Doctor profile updated: ${doctor.id}`);
    } catch (error) {
      logger.error('Error updating doctor profile:', error);
      next(error);
    }
  }

  // Get doctor's schedule
  static async getSchedule(req, res, next) {
    try {
      const { date, week, month } = req.query;
      
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      let schedule;
      if (date) {
        schedule = await Doctor.getDaySchedule(doctor.id, date);
      } else if (week) {
        schedule = await Doctor.getWeekSchedule(doctor.id, week);
      } else if (month) {
        schedule = await Doctor.getMonthSchedule(doctor.id, month);
      } else {
        schedule = await Doctor.getDaySchedule(doctor.id, new Date().toISOString().split('T')[0]);
      }

      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      logger.error('Error fetching doctor schedule:', error);
      next(error);
    }
  }

  // Get today's appointments
  static async getTodayAppointments(req, res, next) {
    try {
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const appointments = await Appointment.findTodayByDoctorId(doctor.id);

      res.json({
        success: true,
        data: appointments
      });
    } catch (error) {
      logger.error('Error fetching today\'s appointments:', error);
      next(error);
    }
  }

  // Get appointment history
  static async getAppointmentHistory(req, res, next) {
    try {
      const { page = 1, limit = 10, status, startDate, endDate, patientName } = req.query;
      
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const filters = {
        doctor_id: doctor.id,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      };

      if (status) filters.status = status;
      if (startDate) filters.date_from = startDate;
      if (endDate) filters.date_to = endDate;

      const appointments = await Appointment.findAll(filters);

      res.json({
        success: true,
        data: appointments
      });
    } catch (error) {
      logger.error('Error fetching appointment history:', error);
      next(error);
    }
  }

  // Update appointment status
  static async updateAppointmentStatus(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const { status, notes } = req.body;
      
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment || appointment.doctor_id !== doctor.id) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      const updatedAppointment = await Appointment.updateStatus(appointmentId, status, notes);

      res.json({
        success: true,
        message: 'Appointment status updated successfully',
        data: updatedAppointment
      });

      logger.info(`Appointment status updated: ${appointmentId} to ${status}`);
    } catch (error) {
      logger.error('Error updating appointment status:', error);
      next(error);
    }
  }

  // Get patient details for appointment
  static async getPatientDetails(req, res, next) {
    try {
      const { patientId } = req.params;
      
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      // Verify doctor has an appointment with this patient
      const hasAppointment = await Appointment.checkDoctorPatientAccess(doctor.id, patientId);
      if (!hasAppointment) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to patient information'
        });
      }

      const patient = await Patient.findById(patientId);
      const [appointmentHistory, healthMetrics] = await Promise.all([
        Appointment.findByPatientAndDoctor(patientId, doctor.id),
        Patient.getRecentHealthMetrics(patientId, 10)
      ]);

      res.json({
        success: true,
        data: {
          patient,
          appointmentHistory,
          healthMetrics
        }
      });
    } catch (error) {
      logger.error('Error fetching patient details:', error);
      next(error);
    }
  }

  // Add medical notes to appointment
  static async addMedicalNotes(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const { diagnosis, prescription, notes, follow_up_required, follow_up_date } = req.body;
      
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment || appointment.doctor_id !== doctor.id) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      const medicalNotes = await Appointment.addMedicalNotes(appointmentId, {
        diagnosis,
        prescription,
        notes,
        follow_up_required,
        follow_up_date
      });

      res.json({
        success: true,
        message: 'Medical notes added successfully',
        data: medicalNotes
      });

      logger.info(`Medical notes added to appointment: ${appointmentId}`);
    } catch (error) {
      logger.error('Error adding medical notes:', error);
      next(error);
    }
  }

  // Get earnings summary
  static async getEarnings(req, res, next) {
    try {
      const { period = 'month', year, month } = req.query;
      
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const earnings = await Doctor.getEarnings(doctor.id, {
        period,
        year: year ? parseInt(year) : new Date().getFullYear(),
        month: month ? parseInt(month) : new Date().getMonth() + 1
      });

      res.json({
        success: true,
        data: earnings
      });
    } catch (error) {
      logger.error('Error fetching earnings:', error);
      next(error);
    }
  }

  // Get doctor statistics
  static async getStatistics(req, res, next) {
    try {
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const stats = await Doctor.getStatistics(doctor.id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching doctor statistics:', error);
      next(error);
    }
  }
  // Get doctor dashboard data
  static async getDashboard(req, res, next) {
    try {
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      // Get user information for doctor name
      const user = await User.findById(doctor.user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User information not found'
        });
      }

      // Fetch today's appointments with detailed patient information
      const todayAppointments = await DoctorController.getTodayAppointmentsWithDetails(doctor.id);
      
      // Fetch upcoming appointments (next 7 days)
      const upcomingAppointments = await DoctorController.getUpcomingAppointmentsWithDetails(doctor.id, 7);
      
      // Get comprehensive statistics
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      const [monthlyEarnings, totalPatients, totalAppointments, averageRating] = await Promise.all([
        DoctorController.getMonthlyEarnings(doctor.id, currentYear, currentMonth),
        DoctorController.getTotalPatients(doctor.id),
        DoctorController.getTotalAppointments(doctor.id, currentYear, currentMonth),
        DoctorController.getAverageRating(doctor.id)
      ]);

      // Process today's appointments data
      const completedToday = todayAppointments.filter(apt => apt.status === 'completed');
      const pendingToday = todayAppointments.filter(apt => apt.status === 'confirmed' || apt.status === 'scheduled');
      const inProgressToday = todayAppointments.filter(apt => apt.status === 'in-progress');

      res.json({
        success: true,
        data: {
          doctor: {
            id: doctor.id,
            name: user.name,
            specialty: doctor.specialty,
            rating: averageRating || doctor.rating || 0,
            totalReviews: doctor.total_reviews || 0,
            consultationFee: doctor.consultation_fee || 200,
            officeAddress: doctor.office_address || 'Medical Center',
            workingHours: doctor.working_hours ? (typeof doctor.working_hours === 'string' ? JSON.parse(doctor.working_hours) : doctor.working_hours) : {
              monday: { start: '09:00', end: '17:00' },
              tuesday: { start: '09:00', end: '17:00' },
              wednesday: { start: '09:00', end: '17:00' },
              thursday: { start: '09:00', end: '17:00' },
              friday: { start: '09:00', end: '15:00' }
            }
          },
          todayAppointments: {
            total: todayAppointments.length,
            completed: completedToday.length,
            pending: pendingToday.length,
            inProgress: inProgressToday.length,
            appointments: todayAppointments.map(apt => ({
              id: apt.id,
              appointmentId: apt.appointment_id || `APT-${apt.id.slice(-3)}`,
              patientName: apt.patient_name,
              patientAge: apt.patient_age,
              patientPhone: apt.patient_phone,
              appointmentTime: apt.appointment_time,
              appointmentDate: apt.appointment_date,
              reason: apt.reason_for_visit || apt.reason || 'General consultation',
              status: apt.status,
              type: apt.appointment_type || 'consultation',
              duration: apt.duration || 30,
              consultationFee: apt.consultation_fee || doctor.consultation_fee,
              queueNumber: apt.queue_number,
              isEmergency: apt.is_emergency
            }))
          },
          upcomingAppointments: upcomingAppointments.map(apt => ({
            id: apt.id,
            appointmentId: apt.appointment_id || `APT-${apt.id.slice(-3)}`,
            patientName: apt.patient_name,
            appointmentTime: apt.appointment_time,
            appointmentDate: apt.appointment_date,
            reason: apt.reason_for_visit || apt.reason || 'General consultation',
            status: apt.status,
            type: apt.appointment_type || 'consultation'
          })),
          stats: {
            totalPatients: totalPatients,
            totalAppointments: totalAppointments,
            monthlyEarnings: monthlyEarnings,
            averageRating: averageRating || doctor.rating || 0
          },
          recentActivity: []
        }
      });
    } catch (error) {
      logger.error('Error fetching doctor dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Helper method to get today's appointments with patient details
  static async getTodayAppointmentsWithDetails(doctorId) {
    const query = `
      SELECT a.*, p.id as patient_id, u.name as patient_name, u.phone as patient_phone,
             p.date_of_birth, TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) as patient_age
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ? AND a.queue_date = CURDATE()
      ORDER BY 
        a.is_emergency DESC,
        CASE 
          WHEN a.is_emergency THEN CAST(SUBSTRING(a.queue_number, 2) AS UNSIGNED)
          ELSE CAST(a.queue_number AS UNSIGNED)
        END ASC
    `;
    
    try {
      return await mysqlConnection.query(query, [doctorId]);
    } catch (error) {
      logger.error('Error fetching today appointments:', error);
      return [];
    }
  }

  // Helper method to get upcoming appointments with patient details
  static async getUpcomingAppointmentsWithDetails(doctorId, days = 7) {
    const query = `
      SELECT a.*, p.id as patient_id, u.name as patient_name, u.phone as patient_phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ? 
        AND a.status IN ('scheduled', 'confirmed')
        AND DATE(a.appointment_date) > CURDATE()
        AND DATE(a.appointment_date) <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT 10
    `;
    
    try {
      return await mysqlConnection.query(query, [doctorId, days]);
    } catch (error) {
      logger.error('Error fetching upcoming appointments:', error);
      return [];
    }
  }

  // Helper method to get monthly earnings
  static async getMonthlyEarnings(doctorId, year, month) {
    const query = `
      SELECT COALESCE(SUM(a.consultation_fee), 0) as total_earnings
      FROM appointments a
      WHERE a.doctor_id = ? 
        AND YEAR(a.appointment_date) = ?
        AND MONTH(a.appointment_date) = ?
        AND a.status = 'completed'
    `;
    
    try {
      const result = await mysqlConnection.query(query, [doctorId, year, month]);
      return result[0]?.total_earnings || 0;
    } catch (error) {
      logger.error('Error fetching monthly earnings:', error);
      return 0;
    }
  }

  // Helper method to get total unique patients
  static async getTotalPatients(doctorId) {
    const query = `
      SELECT COUNT(DISTINCT a.patient_id) as total_patients
      FROM appointments a
      WHERE a.doctor_id = ?
    `;
    
    try {
      const result = await mysqlConnection.query(query, [doctorId]);
      return result[0]?.total_patients || 0;
    } catch (error) {
      logger.error('Error fetching total patients:', error);
      return 0;
    }
  }

  // Helper method to get total appointments for current month
  static async getTotalAppointments(doctorId, year, month) {
    const query = `
      SELECT COUNT(*) as total_appointments
      FROM appointments a
      WHERE a.doctor_id = ? 
        AND YEAR(a.appointment_date) = ?
        AND MONTH(a.appointment_date) = ?
    `;
    
    try {
      const result = await mysqlConnection.query(query, [doctorId, year, month]);
      return result[0]?.total_appointments || 0;
    } catch (error) {
      logger.error('Error fetching total appointments:', error);
      return 0;
    }
  }

  // Helper method to get average rating
  static async getAverageRating(doctorId) {
    const query = `
      SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews
      FROM doctor_reviews
      WHERE doctor_id = ? AND status = 'approved'
    `;
    
    try {
      const result = await mysqlConnection.query(query, [doctorId]);
      return result[0]?.average_rating || 0;
    } catch (error) {
      logger.error('Error fetching average rating:', error);
      return 0;
    }
  }

  // Handle appointment actions (start, complete, cancel) - for frontend dashboard
  static async handleAppointmentAction(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const { action } = req.body;
      
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment || appointment.doctor_id !== doctor.id) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      let newStatus;
      let message;

      switch (action) {
        case 'start':
          newStatus = 'in-progress';
          message = 'Appointment started successfully';
          break;
        case 'complete':
          newStatus = 'completed';
          message = 'Appointment completed successfully';
          break;
        case 'cancel':
          newStatus = 'cancelled';
          message = 'Appointment cancelled successfully';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action specified'
          });
      }

      const updatedAppointment = await Appointment.updateStatus(appointmentId, newStatus);

      res.json({
        success: true,
        message,
        data: updatedAppointment
      });

      logger.info(`Appointment ${action}: ${appointmentId} by doctor ${doctor.id}`);
    } catch (error) {
      logger.error(`Error handling appointment action:`, error);
      res.status(500).json({
        success: false,
        message: 'Error processing appointment action',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get doctor's queue for today or specific date
  static async getQueue(req, res, next) {
    try {
      const { date } = req.query;
      const doctor = await Doctor.findByUserId(req.user.id);
      
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const queueData = await Queue.getDoctorQueue(doctor.id, date);
      
      res.json({
        success: true,
        data: queueData
      });
    } catch (error) {
      logger.error('Error fetching doctor queue:', error);
      next(error);
    }
  }

  // Get queue summary
  static async getQueueSummary(req, res, next) {
    try {
      const { date } = req.query;
      const doctor = await Doctor.findByUserId(req.user.id);
      
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const summary = await Queue.getQueueSummary(doctor.id, date);
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error fetching queue summary:', error);
      next(error);
    }
  }

  // Update current queue number (manually advance queue)
  static async updateCurrentQueueNumber(req, res, next) {
    try {
      const { queueNumber, isEmergency = false, date } = req.body;
      const doctor = await Doctor.findByUserId(req.user.id);
      
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      await Queue.updateCurrentNumber(doctor.id, queueNumber, isEmergency, date);
      
      res.json({
        success: true,
        message: 'Queue number updated successfully'
      });
    } catch (error) {
      logger.error('Error updating queue number:', error);
      next(error);
    }
  }

  // Start consultation for next patient in queue (paid patients only)
  static async startNextConsultation(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const { date } = req.body;
      const doctor = await Doctor.findByUserId(req.user.id);
      
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      // If appointmentId is provided, start that specific appointment
      if (appointmentId && appointmentId !== 'auto') {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment || appointment.doctor_id !== doctor.id) {
          return res.status(404).json({
            success: false,
            message: 'Appointment not found'
          });
        }

        // Check if patient has paid
        if (appointment.payment_status !== 'paid') {
          return res.status(400).json({
            success: false,
            message: 'Cannot start consultation for unpaid appointment'
          });
        }

        // Update appointment status to in-progress and advance queue
        const updatedAppointment = await Appointment.updateAppointmentStatus(
          appointmentId, 
          'in-progress'
        );

        // Update queue current number
        await Queue.updateCurrentNumber(
          doctor.id, 
          appointment.queue_number, 
          appointment.is_emergency, 
          date
        );

        res.json({
          success: true,
          message: 'Consultation started',
          data: updatedAppointment
        });

        logger.info(`Consultation started for appointment: ${appointmentId}`);
      } else {
        // Auto-advance to next paid patient
        const nextPatient = await Queue.advanceToNextPaidPatient(doctor.id, date);
        
        if (!nextPatient.success) {
          return res.status(404).json({
            success: false,
            message: nextPatient.message
          });
        }

        // Start consultation for the next paid patient
        const updatedAppointment = await Appointment.updateAppointmentStatus(
          nextPatient.patient.id, 
          'in-progress'
        );

        res.json({
          success: true,
          message: 'Started consultation with next paid patient',
          data: {
            appointment: updatedAppointment,
            patient: nextPatient.patient,
            type: nextPatient.type,
            queueNumber: nextPatient.currentNumber
          }
        });

        logger.info(`Auto-started consultation for next paid patient: ${nextPatient.patient.id}`);
      }
    } catch (error) {
      logger.error('Error starting consultation:', error);
      next(error);
    }
  }

  // Complete consultation and move to next
  static async completeConsultation(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const { notes, prescription, diagnosis } = req.body;
      const doctor = await Doctor.findByUserId(req.user.id);
      
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment || appointment.doctor_id !== doctor.id) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Update appointment status to completed
      const updatedAppointment = await Appointment.updateAppointmentStatus(
        appointmentId, 
        'completed',
        JSON.stringify({ notes, prescription, diagnosis })
      );

      res.json({
        success: true,
        message: 'Consultation completed',
        data: updatedAppointment
      });

      logger.info(`Consultation completed for appointment: ${appointmentId}`);
    } catch (error) {
      logger.error('Error completing consultation:', error);
      next(error);
    }
  }

  // Get AI Predictions for doctor review
  static async getAIPredictions(req, res, next) {
    try {
      const query = `
        SELECT 
          dp.id,
          dp.patient_id,
          dp.admin_id,
          dp.pregnancies,
          dp.glucose,
          dp.bmi,
          dp.age,
          dp.insulin,
          dp.prediction_result,
          dp.prediction_probability,
          dp.risk_level,
          dp.status,
          dp.notes,
          dp.created_at,
          dp.updated_at,
          dp.processed_at,
          u.name as patient_name,
          u.email as patient_email,
          apc.id as certification_id,
          apc.certification_status,
          apc.doctor_notes,
          apc.clinical_assessment,
          apc.recommendations,
          apc.follow_up_required,
          apc.follow_up_date,
          apc.severity_assessment,
          apc.certified_at
        FROM diabetes_predictions dp
        LEFT JOIN patients p ON dp.patient_id = p.patient_id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN ai_prediction_certifications apc ON dp.id = apc.prediction_id
        WHERE dp.status IN ('processed', 'reviewed')
        ORDER BY dp.created_at DESC
      `;
      
      const predictions = await mysqlConnection.query(query);

      // Transform results to match frontend interface
      const transformedPredictions = predictions.map(prediction => ({
        id: prediction.id,
        patientId: prediction.patient_id,
        patientName: prediction.patient_name || `Patient ${prediction.patient_id}`,
        patientEmail: prediction.patient_email,
        pregnancies: prediction.pregnancies,
        glucose: parseFloat(prediction.glucose),
        bmi: parseFloat(prediction.bmi),
        age: prediction.age,
        insulin: parseFloat(prediction.insulin),
        predictionResult: prediction.prediction_result,
        predictionProbability: parseFloat(prediction.prediction_probability),
        riskLevel: prediction.risk_level,
        status: prediction.status,
        isReviewed: prediction.status === 'reviewed',
        createdAt: prediction.created_at,
        processedAt: prediction.processed_at,
        // Certification data
        certification_status: prediction.certification_status,
        doctor_notes: prediction.doctor_notes,
        clinical_assessment: prediction.clinical_assessment,
        recommendations: prediction.recommendations,
        follow_up_required: prediction.follow_up_required,
        follow_up_date: prediction.follow_up_date,
        severity_assessment: prediction.severity_assessment,
        certified_at: prediction.certified_at
      }));
      
      res.json({
        success: true,
        data: {
          predictions: transformedPredictions
        },
        meta: {
          total: transformedPredictions.length
        }
      });
    } catch (error) {
      logger.error('Error fetching AI predictions for doctor:', error);
      next(error);
    }
  }

  // Review AI Prediction using certification table
  static async reviewAIPrediction(req, res, next) {
    try {
      const { id } = req.params;
      const { 
        certification_status, 
        doctor_notes, 
        clinical_assessment,
        recommendations,
        follow_up_required,
        follow_up_date,
        severity_assessment 
      } = req.body;
      const doctorUserId = req.user.id;

      // Get doctor information
      const doctor = await Doctor.findByUserId(doctorUserId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      // Check if prediction exists
      const checkQuery = 'SELECT id FROM diabetes_predictions WHERE id = ?';
      const [existingPrediction] = await mysqlConnection.query(checkQuery, [id]);
      
      if (!existingPrediction || existingPrediction.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Prediction not found'
        });
      }

      // Check if certification already exists
      const certificationCheckQuery = 'SELECT id FROM ai_prediction_certifications WHERE prediction_id = ?';
      const [existingCertification] = await mysqlConnection.query(certificationCheckQuery, [id]);

      let certificationQuery;
      let certificationParams;

      if (existingCertification && existingCertification.length > 0) {
        // Update existing certification
        certificationQuery = `
          UPDATE ai_prediction_certifications 
          SET 
            doctor_id = ?,
            certification_status = ?,
            doctor_notes = ?,
            clinical_assessment = ?,
            recommendations = ?,
            follow_up_required = ?,
            follow_up_date = ?,
            severity_assessment = ?,
            certified_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE prediction_id = ?
        `;
        certificationParams = [
          doctor.id,
          certification_status,
          doctor_notes,
          clinical_assessment,
          recommendations,
          follow_up_required || false,
          follow_up_date || null,
          severity_assessment,
          id
        ];
      } else {
        // Create new certification
        certificationQuery = `
          INSERT INTO ai_prediction_certifications 
          (prediction_id, doctor_id, certification_status, doctor_notes, clinical_assessment, 
           recommendations, follow_up_required, follow_up_date, severity_assessment)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        certificationParams = [
          id,
          doctor.id,
          certification_status,
          doctor_notes,
          clinical_assessment,
          recommendations,
          follow_up_required || false,
          follow_up_date || null,
          severity_assessment
        ];
      }

      await mysqlConnection.query(certificationQuery, certificationParams);

      // Update prediction status to 'reviewed'
      const updatePredictionQuery = 'UPDATE diabetes_predictions SET status = ? WHERE id = ?';
      await mysqlConnection.query(updatePredictionQuery, ['reviewed', id]);

      // Get updated prediction with certification
      const selectQuery = `
        SELECT 
          dp.id,
          dp.patient_id as patientId,
          u.name as patientName,
          u.email as patientEmail,
          dp.pregnancies,
          dp.glucose,
          dp.bmi,
          dp.age,
          dp.insulin,
          dp.prediction_result as predictionResult,
          dp.prediction_probability as predictionProbability,
          dp.risk_level as riskLevel,
          dp.status,
          dp.created_at as createdAt,
          dp.notes as summary,
          apc.certification_status,
          apc.doctor_notes,
          apc.clinical_assessment,
          apc.recommendations,
          apc.follow_up_required,
          apc.follow_up_date,
          apc.severity_assessment,
          apc.certified_at
        FROM diabetes_predictions dp
        LEFT JOIN patients p ON dp.patient_id = p.patient_id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN ai_prediction_certifications apc ON dp.id = apc.prediction_id
        WHERE dp.id = ?
      `;
      
      const [updatedPredictions] = await mysqlConnection.query(selectQuery, [id]);
      
      res.json({
        success: true,
        message: 'Prediction reviewed successfully',
        data: {
          prediction: updatedPredictions[0]
        }
      });

      logger.info(`AI prediction ${id} reviewed by doctor ${doctor.id}`);
    } catch (error) {
      logger.error('Error reviewing AI prediction:', error);
      next(error);
    }
  }

  // Get doctor availability data
  static async getDoctorAvailability(req, res, next) {
    try {
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      // Get current date for queue status
      const today = new Date().toISOString().split('T')[0];

      // Get queue status for today
      const queueQuery = `
        SELECT is_active, available_from, available_to, current_number, 
               current_emergency_number, regular_count, emergency_used, max_emergency_slots
        FROM queue_status 
        WHERE doctor_id = ? AND DATE(queue_date) = ?
        LIMIT 1
      `;
      
      const queueResult = await mysqlConnection.query(queueQuery, [doctor.id, today]);
      const queueData = queueResult[0] && queueResult[0].length > 0 ? queueResult[0][0] : null;

      // Prepare response data
      const availabilityData = {
        doctor_id: doctor.id,
        availability_status: doctor.availability_status || 'offline',
        working_hours: doctor.working_hours || {},
        queue: queueData ? {
          is_active: Boolean(queueData.is_active),
          available_from: queueData.available_from,
          available_to: queueData.available_to,
          current_number: queueData.current_number,
          current_emergency_number: queueData.current_emergency_number,
          regular_count: queueData.regular_count,
          emergency_used: queueData.emergency_used,
          max_emergency_slots: queueData.max_emergency_slots,
          date: today
        } : {
          is_active: false,
          available_from: '09:00:00',
          available_to: '17:00:00',
          current_number: '0',
          current_emergency_number: 'E0',
          regular_count: 0,
          emergency_used: 0,
          max_emergency_slots: 5,
          date: today
        }
      };

      res.json({
        success: true,
        data: availabilityData
      });

      logger.info(`Doctor ${doctor.id} availability data fetched`);
    } catch (error) {
      logger.error('Error fetching doctor availability:', error);
      next(error);
    }
  }

  // Get queue status
  static async getQueueStatus(req, res, next) {
    try {
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      // Get current date for queue status
      const today = new Date().toISOString().split('T')[0];

      // Get queue status for today
      const queueQuery = `
        SELECT id, is_active, available_from, available_to, current_number, 
               current_emergency_number, regular_count, emergency_used, max_emergency_slots,
               queue_date, created_at, updated_at
        FROM queue_status 
        WHERE doctor_id = ? AND DATE(queue_date) = ?
        LIMIT 1
      `;
      
      const queueResult = await mysqlConnection.query(queueQuery, [doctor.id, today]);
      const queueData = queueResult[0] && queueResult[0].length > 0 ? queueResult[0][0] : null;

      // Prepare response data
      const queueStatus = queueData ? {
        id: queueData.id,
        doctor_id: doctor.id,
        is_active: Boolean(queueData.is_active),
        available_from: queueData.available_from,
        available_to: queueData.available_to,
        current_number: queueData.current_number,
        current_emergency_number: queueData.current_emergency_number,
        regular_count: queueData.regular_count,
        emergency_used: queueData.emergency_used,
        max_emergency_slots: queueData.max_emergency_slots,
        queue_date: queueData.queue_date,
        created_at: queueData.created_at,
        updated_at: queueData.updated_at
      } : {
        doctor_id: doctor.id,
        is_active: false,
        available_from: '09:00:00',
        available_to: '17:00:00',
        current_number: '0',
        current_emergency_number: 'E0',
        regular_count: 0,
        emergency_used: 0,
        max_emergency_slots: 5,
        queue_date: today,
        created_at: null,
        updated_at: null
      };

      res.json({
        success: true,
        data: queueStatus
      });

      logger.info(`Doctor ${doctor.id} queue status fetched`);
    } catch (error) {
      logger.error('Error fetching queue status:', error);
      next(error);
    }
  }

  // Update availability status
  static async updateAvailabilityStatus(req, res, next) {
    try {
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ['available', 'busy', 'offline'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: available, busy, offline'
        });
      }

      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      // Update availability status in database
      const updateQuery = `
        UPDATE doctors 
        SET availability_status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      await mysqlConnection.query(updateQuery, [status, doctor.id]);

      res.json({
        success: true,
        message: 'Availability status updated successfully',
        data: {
          availability_status: status
        }
      });

      logger.info(`Doctor ${doctor.id} availability status updated to: ${status}`);
    } catch (error) {
      logger.error('Error updating availability status:', error);
      next(error);
    }
  }

  // Update working hours
  static async updateWorkingHours(req, res, next) {
    try {
      const { working_hours } = req.body;
      
      if (!working_hours) {
        return res.status(400).json({
          success: false,
          message: 'Working hours data is required'
        });
      }

      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      // Update working hours in database
      const updateQuery = `
        UPDATE doctors 
        SET working_hours = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      const workingHoursJson = typeof working_hours === 'string' 
        ? working_hours 
        : JSON.stringify(working_hours);
      
      await mysqlConnection.query(updateQuery, [workingHoursJson, doctor.id]);

      res.json({
        success: true,
        message: 'Working hours updated successfully',
        data: {
          working_hours: working_hours
        }
      });

      logger.info(`Doctor ${doctor.id} working hours updated`);
    } catch (error) {
      logger.error('Error updating working hours:', error);
      next(error);
    }
  }

  // Toggle queue status
  static async toggleQueue(req, res, next) {
    try {
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      // Get current date
      const today = new Date().toISOString().split('T')[0];

      // Check if queue exists for today using a simpler approach
      const checkQuery = `
        SELECT id, is_active FROM queue_status 
        WHERE doctor_id = ? AND DATE(queue_date) = ?
        LIMIT 1
      `;
      
      let queryResult;
      try {
        queryResult = await mysqlConnection.query(checkQuery, [doctor.id, today]);
      } catch (queryError) {
        logger.error('Queue query error:', queryError);
        throw new Error('Database query failed');
      }

      // Handle the query result properly
      const rows = queryResult[0]; // First element should be the rows array
      let newStatus;
      
      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        // No queue exists for today - create one
        const createQuery = `
          INSERT INTO queue_status (
            id, doctor_id, queue_date, current_number, current_emergency_number,
            max_emergency_slots, emergency_used, regular_count, available_from,
            available_to, is_active, created_at, updated_at
          ) VALUES (UUID(), ?, ?, '0', 'E0', 5, 0, 0, '09:00:00', '17:00:00', 1, NOW(), NOW())
        `;
        
        await mysqlConnection.query(createQuery, [doctor.id, today]);
        newStatus = true;
      } else {
        // Queue exists - toggle its status
        const existingRecord = rows[0];
        if (!existingRecord) {
          throw new Error('Queue record is null');
        }
        
        const currentStatus = existingRecord.is_active;
        newStatus = currentStatus === 1 ? false : true; // Convert from 1/0 to boolean and toggle
        
        const updateQuery = `
          UPDATE queue_status 
          SET is_active = ?, updated_at = NOW()
          WHERE doctor_id = ? AND DATE(queue_date) = ?
        `;
        
        await mysqlConnection.query(updateQuery, [newStatus ? 1 : 0, doctor.id, today]);
      }

      res.json({
        success: true,
        message: `Queue ${newStatus ? 'activated' : 'deactivated'} successfully`,
        data: {
          is_active: newStatus,
          date: today
        }
      });

      logger.info(`Doctor ${doctor.id} queue status toggled to: ${newStatus ? 'active' : 'inactive'}`);
    } catch (error) {
      logger.error('Error toggling queue status:', error);
      next(error);
    }
  }

  // Update payment status for an appointment
  static async updatePaymentStatus(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const { paymentStatus } = req.body;
      
      // Validate payment status
      const validStatuses = ['unpaid', 'paid', 'partially_paid', 'refunded'];
      if (!validStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment status. Must be one of: unpaid, paid, partially_paid, refunded'
        });
      }

      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      // Check if appointment belongs to this doctor
      const appointmentQuery = `
        SELECT * FROM appointments 
        WHERE id = ? AND doctor_id = ?
      `;
      
      const [appointment] = await mysqlConnection.query(appointmentQuery, [appointmentId, doctor.id]);
      
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found or does not belong to this doctor'
        });
      }

      // Update payment status
      const updateQuery = `
        UPDATE appointments 
        SET payment_status = ?, updated_at = NOW()
        WHERE id = ?
      `;
      
      await mysqlConnection.query(updateQuery, [paymentStatus, appointmentId]);

      // Log the payment status change
      logger.info(`Payment status updated for appointment ${appointmentId} to ${paymentStatus} by doctor ${doctor.id}`);

      res.json({
        success: true,
        message: 'Payment status updated successfully',
        data: {
          appointmentId,
          paymentStatus,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error updating payment status:', error);
      next(error);
    }
  }

  // Start queue for the day - activate queue processing
  static async startQueue(req, res, next) {
    try {
      const { date } = req.body;
      const queueDate = date || new Date().toISOString().split('T')[0];
      
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      // Check if queue already exists and is active
      const checkQuery = `
        SELECT * FROM queue_status 
        WHERE doctor_id = ? AND queue_date = ?
      `;
      
      const [existingQueue] = await mysqlConnection.query(checkQuery, [doctor.id, queueDate]);
      
      if (existingQueue && existingQueue.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Queue is already active for this date'
        });
      }

      // Create or update queue status to active
      if (existingQueue) {
        const updateQuery = `
          UPDATE queue_status 
          SET is_active = TRUE, updated_at = NOW()
          WHERE doctor_id = ? AND queue_date = ?
        `;
        await mysqlConnection.query(updateQuery, [doctor.id, queueDate]);
      } else {
        // Create new queue status
        const createQuery = `
          INSERT INTO queue_status (
            doctor_id, queue_date, is_active, current_number, 
            current_emergency_number, available_from, available_to
          ) VALUES (?, ?, TRUE, '0', 'E0', '09:00:00', '17:00:00')
        `;
        await mysqlConnection.query(createQuery, [doctor.id, queueDate]);
      }

      // Get paid appointments count for today
      const paidCountQuery = `
        SELECT COUNT(*) as paidCount
        FROM appointments 
        WHERE doctor_id = ? AND queue_date = ? AND payment_status = 'paid'
      `;
      
      const [countResult] = await mysqlConnection.query(paidCountQuery, [doctor.id, queueDate]);

      logger.info(`Queue started for doctor ${doctor.id} on ${queueDate}`);

      res.json({
        success: true,
        message: 'Queue started successfully',
        data: {
          doctorId: doctor.id,
          queueDate,
          isActive: true,
          paidPatientsCount: countResult.paidCount,
          startedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error starting queue:', error);
      next(error);
    }
  }

  // Stop queue for the day - deactivate queue processing
  static async stopQueue(req, res, next) {
    try {
      const { date } = req.body;
      const queueDate = date || new Date().toISOString().split('T')[0];
      
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      // Check if queue exists and is active
      const checkQuery = `
        SELECT * FROM queue_status 
        WHERE doctor_id = ? AND queue_date = ?
      `;
      
      const [existingQueue] = await mysqlConnection.query(checkQuery, [doctor.id, queueDate]);
      
      if (!existingQueue) {
        return res.status(404).json({
          success: false,
          message: 'No queue found for this date'
        });
      }

      if (!existingQueue.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Queue is already stopped'
        });
      }

      // Update queue status to inactive
      const updateQuery = `
        UPDATE queue_status 
        SET is_active = FALSE, updated_at = NOW()
        WHERE doctor_id = ? AND queue_date = ?
      `;
      
      await mysqlConnection.query(updateQuery, [doctor.id, queueDate]);

      // Get completion statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as totalAppointments,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedAppointments,
          SUM(CASE WHEN payment_status = 'paid' AND status = 'completed' THEN 1 ELSE 0 END) as completedPaidAppointments
        FROM appointments 
        WHERE doctor_id = ? AND queue_date = ?
      `;
      
      const [stats] = await mysqlConnection.query(statsQuery, [doctor.id, queueDate]);

      logger.info(`Queue stopped for doctor ${doctor.id} on ${queueDate}`);

      res.json({
        success: true,
        message: 'Queue stopped successfully',
        data: {
          doctorId: doctor.id,
          queueDate,
          isActive: false,
          stoppedAt: new Date(),
          statistics: {
            totalAppointments: stats.totalAppointments,
            completedAppointments: stats.completedAppointments,
            completedPaidAppointments: stats.completedPaidAppointments
          }
        }
      });
    } catch (error) {
      logger.error('Error stopping queue:', error);
      next(error);
    }
  }

  // Get queue status - check if queue is active and get basic info
  static async getQueueStatus(req, res, next) {
    try {
      const { date } = req.query;
      const queueDate = date || new Date().toISOString().split('T')[0];
      
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const queueStatus = await Queue.getQueueStatus(doctor.id, queueDate);
      
      res.json({
        success: true,
        data: queueStatus || {
          isActive: false,
          message: 'No queue found for this date'
        }
      });
    } catch (error) {
      logger.error('Error fetching queue status:', error);
      next(error);
    }
  }

  // Get next paid patient in queue without starting consultation
  static async getNextPaidPatient(req, res, next) {
    try {
      const { date } = req.query;
      
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const nextPatient = await Queue.getNextPaidPatient(doctor.id, date);
      
      res.json({
        success: nextPatient.success,
        message: nextPatient.message || 'Next paid patient retrieved',
        data: nextPatient.success ? {
          patient: nextPatient.patient,
          type: nextPatient.type
        } : null
      });
    } catch (error) {
      logger.error('Error getting next paid patient:', error);
      next(error);
    }
  }


}

module.exports = DoctorController;
