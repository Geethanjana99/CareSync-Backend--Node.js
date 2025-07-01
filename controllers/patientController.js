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
        isEmergency = false
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
        is_emergency: isEmergency,
        status: 'scheduled' // Use valid enum value instead of 'pending'
      };

      const appointment = await Appointment.createQueueAppointment(appointmentData);

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: {
          appointment,
          queueNumber: appointment.queue_number,
          isEmergency: appointment.is_emergency,
          message: isEmergency 
            ? `Emergency appointment booked. Your emergency number is ${appointment.queue_number}`
            : `Appointment booked. Your queue number is ${appointment.queue_number}`
        }
      });

      logger.info(`Queue appointment booked: ${appointment.id} for patient ${patient.id}`);
    } catch (error) {
      logger.error('Error booking queue appointment:', error);
      next(error);
    }
  }

  // Get patient's queue position
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

      const position = await Appointment.getPatientQueuePosition(
        patient.id, 
        doctorId, 
        date
      );

      if (!position) {
        return res.status(404).json({
          success: false,
          message: 'No appointment found for this date'
        });
      }

      res.json({
        success: true,
        data: position
      });
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

  // Get doctor availability for a specific date
  static async getDoctorAvailability(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date parameter is required'
        });
      }

      const { mysqlConnection } = require('../config/mysql');

      // Get doctor info with working hours
      const doctorRows = await mysqlConnection.query(`
        SELECT d.id as internal_id, d.doctor_id, d.working_hours, u.name as doctor_name
        FROM doctors d
        JOIN users u ON d.user_id = u.id 
        WHERE d.doctor_id = ?
      `, [doctorId]);

      if (doctorRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      const doctor = doctorRows[0];
      const appointmentDate = new Date(date);
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      let availability = {
        doctorId: doctor.doctor_id,
        doctorName: doctor.doctor_name,
        date: date,
        isAvailable: false,
        timeRange: null,
        message: 'Doctor is not available on this day'
      };

      // Check working hours from JSON field
      if (doctor.working_hours) {
        try {
          const workingHours = typeof doctor.working_hours === 'string' 
            ? JSON.parse(doctor.working_hours) 
            : doctor.working_hours;

          if (workingHours[dayOfWeek]) {
            const timeRange = workingHours[dayOfWeek];
            availability.isAvailable = true;
            availability.timeRange = timeRange;
            availability.message = `Available from ${timeRange}`;
          }
        } catch (parseError) {
          console.error('Error parsing working hours:', parseError);
        }
      }

      // Also check doctor_availability table for more detailed availability
      const detailedAvailability = await mysqlConnection.query(`
        SELECT start_time, end_time, break_times
        FROM doctor_availability da
        WHERE da.doctor_id = ? 
          AND da.day_of_week = ?
          AND da.is_active = true
          AND (da.effective_date IS NULL OR da.effective_date <= ?)
          AND (da.expiry_date IS NULL OR da.expiry_date >= ?)
        ORDER BY start_time
      `, [doctor.internal_id, dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1), date, date]);

      if (detailedAvailability.length > 0) {
        const firstSlot = detailedAvailability[0];
        const lastSlot = detailedAvailability[detailedAvailability.length - 1];
        
        availability.isAvailable = true;
        availability.timeRange = `${firstSlot.start_time.substring(0, 5)}-${lastSlot.end_time.substring(0, 5)}`;
        availability.message = `Available from ${availability.timeRange}`;
        availability.detailedSlots = detailedAvailability.map(slot => ({
          startTime: slot.start_time.substring(0, 5),
          endTime: slot.end_time.substring(0, 5),
          breakTimes: slot.break_times
        }));
      }

      res.json({
        success: true,
        data: availability
      });

    } catch (error) {
      logger.error('Error getting doctor availability:', error);
      next(error);
    }
  }
}

module.exports = PatientController;
