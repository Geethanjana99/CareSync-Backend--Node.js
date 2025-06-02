const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const logger = require('../config/logger');

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

  // Update availability
  static async updateAvailability(req, res, next) {
    try {
      const { date, time_slots, is_available } = req.body;
      
      const doctor = await Doctor.findByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const availability = await Doctor.updateAvailability(doctor.id, {
        date,
        time_slots,
        is_available
      });

      res.json({
        success: true,
        message: 'Availability updated successfully',
        data: availability
      });

      logger.info(`Doctor availability updated: ${doctor.id} for ${date}`);
    } catch (error) {
      logger.error('Error updating availability:', error);
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

      const appointments = await Appointment.findByDoctorId(doctor.id, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        startDate,
        endDate,
        patientName
      });

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

      const [todayAppointments, upcomingAppointments, recentStats, earnings] = await Promise.all([
        Appointment.findTodayByDoctorId(doctor.id),
        Appointment.findUpcomingByDoctorId(doctor.id, 5),
        Doctor.getRecentStatistics(doctor.id),
        Doctor.getMonthlyEarnings(doctor.id)
      ]);

      res.json({
        success: true,
        data: {
          doctor: {
            id: doctor.id,
            name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
            specialization: doctor.specialization,
            rating: doctor.average_rating
          },
          todayAppointments: {
            total: todayAppointments.length,
            completed: todayAppointments.filter(apt => apt.status === 'completed').length,
            pending: todayAppointments.filter(apt => apt.status === 'confirmed').length,
            appointments: todayAppointments
          },
          upcomingAppointments,
          stats: recentStats,
          earnings,
          notifications: {
            unread: 0 // Will be implemented with notification service
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching doctor dashboard:', error);
      next(error);
    }
  }
}

module.exports = DoctorController;
