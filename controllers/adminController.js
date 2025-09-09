const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const MedicalReport = require('../models/MedicalReport');
const logger = require('../config/logger');

class AdminController {
  // Dashboard overview
  static async getDashboard(req, res, next) {
    try {
      const [
        totalUsers,
        totalPatients,
        totalDoctors,
        totalAppointments,
        todayAppointments,
        pendingReports,
        monthlyStats
      ] = await Promise.all([
        User.count(),
        Patient.count(),
        Doctor.count(),
        Appointment.count(),
        Appointment.getTodayCount(),
        MedicalReport.countDocuments({ status: 'pending_review' }),
        Admin.getMonthlyStatistics()
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            totalUsers,
            totalPatients,
            totalDoctors,
            totalAppointments,
            todayAppointments,
            pendingReports
          },
          monthlyStats
        }
      });
    } catch (error) {
      logger.error('Error fetching admin dashboard:', error);
      next(error);
    }
  }

  // Get all users with pagination and filters
  static async getUsers(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        role, 
        status, 
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const filters = {};
      if (role) filters.role = role;
      if (status) filters.status = status;
      if (search) {
        filters.$or = [
          { first_name: { $regex: search, $options: 'i' } },
          { last_name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.findWithPagination({
        filters,
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      logger.error('Error fetching users:', error);
      next(error);
    }
  }

  // Get user details
  static async getUserDetails(req, res, next) {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      let profile = null;
      let additionalData = {};

      if (user.role === 'patient') {
        profile = await Patient.findByUserId(userId);
        if (profile) {
          additionalData.appointmentCount = await Appointment.countByPatientId(profile.id);
          additionalData.reportCount = await MedicalReport.countDocuments({ patient_id: profile.id });
        }
      } else if (user.role === 'doctor') {
        profile = await Doctor.findByUserId(userId);
        if (profile) {
          additionalData.appointmentCount = await Appointment.countByDoctorId(profile.id);
          additionalData.earnings = await Doctor.getTotalEarnings(profile.id);
          additionalData.rating = profile.average_rating;
        }
      }

      res.json({
        success: true,
        data: {
          user,
          profile,
          ...additionalData
        }
      });
    } catch (error) {
      logger.error('Error fetching user details:', error);
      next(error);
    }
  }

  // Update user status
  static async updateUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { status, reason } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updatedUser = await User.updateStatus(userId, status, reason);

      res.json({
        success: true,
        message: `User ${status} successfully`,
        data: updatedUser
      });

      logger.info(`User status updated: ${userId} to ${status} by admin ${req.user.id}`);
    } catch (error) {
      logger.error('Error updating user status:', error);
      next(error);
    }
  }

  // Get all appointments with filters
  static async getAppointments(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        doctorId,
        patientId,
        startDate,
        endDate,
        sortBy = 'appointment_datetime',
        sortOrder = 'desc'
      } = req.query;

      const appointments = await Appointment.findAllWithFilters({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        doctorId,
        patientId,
        startDate,
        endDate,
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: appointments
      });
    } catch (error) {
      logger.error('Error fetching appointments:', error);
      next(error);
    }
  }

  // Get appointment statistics
  static async getAppointmentStatistics(req, res, next) {
    try {
      const { period = 'month', year, month } = req.query;
      
      const stats = await Appointment.getStatistics({
        period,
        year: year ? parseInt(year) : new Date().getFullYear(),
        month: month ? parseInt(month) : new Date().getMonth() + 1
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching appointment statistics:', error);
      next(error);
    }
  }

  // Get all doctors for admin use (e.g., appointment creation)
  static async getDoctors(req, res, next) {
    try {
      const { page = 1, limit = 50, search, specialty } = req.query;
      
      const filters = {
        search,
        specialty
      };

      // Only add limit and offset if they are valid numbers
      const parsedLimit = parseInt(limit);
      const parsedPage = parseInt(page);
      
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        filters.limit = parsedLimit;
      }
      
      if (!isNaN(parsedPage) && parsedPage > 0 && !isNaN(parsedLimit)) {
        filters.offset = (parsedPage - 1) * parsedLimit;
      }

      const doctors = await Doctor.findAll(filters);

      res.json({
        success: true,
        data: {
          doctors
        }
      });
    } catch (error) {
      logger.error('Error fetching doctors:', error);
      next(error);
    }
  }

  // Get doctor performance metrics
  static async getDoctorMetrics(req, res, next) {
    try {
      const { page = 1, limit = 20, sortBy = 'rating', sortOrder = 'desc' } = req.query;
      
      const metrics = await Doctor.getPerformanceMetrics({
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error fetching doctor metrics:', error);
      next(error);
    }
  }

  // Approve doctor registration
  static async approveDoctorRegistration(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { approved, notes } = req.body;

      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      const updatedDoctor = await Doctor.updateApprovalStatus(doctorId, approved, notes);
      
      // Update user status accordingly
      const user = await User.findById(doctor.user_id);
      if (user) {
        await User.updateStatus(user.id, approved ? 'active' : 'suspended', notes);
      }

      res.json({
        success: true,
        message: `Doctor registration ${approved ? 'approved' : 'rejected'} successfully`,
        data: updatedDoctor
      });

      logger.info(`Doctor registration ${approved ? 'approved' : 'rejected'}: ${doctorId} by admin ${req.user.id}`);
    } catch (error) {
      logger.error('Error updating doctor approval status:', error);
      next(error);
    }
  }

  // Get system statistics
  static async getSystemStatistics(req, res, next) {
    try {
      const { period = 'year' } = req.query;
      
      const stats = await Promise.all([
        User.getRegistrationStats(period),
        Appointment.getBookingStats(period),
        Doctor.getSpecializationStats(),
        Appointment.getRevenueStats(period)
      ]);

      res.json({
        success: true,
        data: {
          userRegistrations: stats[0],
          appointmentBookings: stats[1],
          specializations: stats[2],
          revenue: stats[3]
        }
      });
    } catch (error) {
      logger.error('Error fetching system statistics:', error);
      next(error);
    }
  }

  // Manage medical reports
  static async getMedicalReports(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        reportType,
        patientId,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const query = {};
      if (status) query.status = status;
      if (reportType) query.report_type = reportType;
      if (patientId) query.patient_id = patientId;

      const reports = await MedicalReport.find(query)
        .populate('patient_id', 'first_name last_name email')
        .populate('uploaded_by')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await MedicalReport.countDocuments(query);

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching medical reports:', error);
      next(error);
    }
  }

  // Create admin user
  static async createAdminUser(req, res, next) {
    try {
      const { email, password, first_name, last_name, permissions } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      const userData = {
        email,
        password,
        first_name,
        last_name,
        role: 'admin',
        status: 'active',
        permissions: permissions || ['read', 'write', 'delete']
      };

      const admin = await User.create(userData);

      // Remove password from response
      const { password: _, ...adminData } = admin;

      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: adminData
      });

      logger.info(`Admin user created: ${admin.id} by ${req.user.id}`);
    } catch (error) {
      logger.error('Error creating admin user:', error);
      next(error);
    }
  }

  // System health check
  static async getSystemHealth(req, res, next) {
    try {
      const mysql = require('../config/mysql');
      const mongodb = require('../config/mongodb');
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {}
      };

      // Check MySQL connection
      try {
        await mysql.query('SELECT 1');
        health.services.mysql = { status: 'healthy', message: 'Connected' };
      } catch (error) {
        health.services.mysql = { status: 'unhealthy', message: error.message };
        health.status = 'degraded';
      }

      // Check MongoDB connection
      try {
        if (mongodb.connection.readyState === 1) {
          health.services.mongodb = { status: 'healthy', message: 'Connected' };
        } else {
          health.services.mongodb = { status: 'unhealthy', message: 'Not connected' };
          health.status = 'degraded';
        }
      } catch (error) {
        health.services.mongodb = { status: 'unhealthy', message: error.message };
        health.status = 'degraded';
      }

      // Check disk space (simplified)
      const fs = require('fs');
      try {
        const stats = fs.statSync('.');
        health.services.storage = { status: 'healthy', message: 'Accessible' };
      } catch (error) {
        health.services.storage = { status: 'unhealthy', message: error.message };
        health.status = 'degraded';
      }

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Error checking system health:', error);
      next(error);
    }
  }
  // Get patient names for billing/invoice purposes
  static async getPatientNames(req, res, next) {
    try {
      const mysql = require('../config/mysql');
      
      const query = `
        SELECT id, name, email
        FROM users 
        WHERE role = 'patient' AND status = 'active'
        ORDER BY name
      `;
      
      const [patients] = await mysql.execute(query);
      
      const patientList = patients.map(patient => ({
        id: patient.id,
        name: patient.name || patient.email,
        email: patient.email
      }));

      res.json({
        success: true,
        data: patientList
      });
    } catch (error) {
      logger.error('Error fetching patient names:', error);
      next(error);
    }
  }

  // Admin book queue appointment for any patient
  static async bookQueueAppointmentForPatient(req, res, next) {
    try {
      const {
        patientId,
        doctorId,
        appointmentDate,
        appointmentType = 'consultation',
        reasonForVisit,
        symptoms,
        priority = 'medium',
        isEmergency = false
      } = req.body;

      // Validate required fields
      if (!patientId || !doctorId || !appointmentDate || !reasonForVisit) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID, Doctor ID, appointment date, and reason for visit are required'
        });
      }

      // Get patient by ID (not by user ID like the regular method)
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
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

      // Validate appointment date
      const selectedDate = new Date(appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Cannot book appointment for past dates'
        });
      }

      // Create appointment using queue system
      const appointmentData = {
        patient_id: patient.id,
        doctor_id: internalDoctorId,
        appointment_date: appointmentDate,
        appointment_type: appointmentType,
        reason_for_visit: reasonForVisit,
        symptoms: symptoms || null,
        priority: priority,
        status: 'scheduled',
        created_by_admin: req.user.id
      };

      // Get next queue number for the date
      const { mysqlConnection } = require('../config/mysql');
      const queueResult = await mysqlConnection.query(
        'SELECT COALESCE(MAX(queue_number), 0) + 1 as next_queue FROM appointments WHERE appointment_date = ? AND doctor_id = ?',
        [appointmentDate, internalDoctorId]
      );
      
      const queueNumber = queueResult[0].next_queue;
      appointmentData.queue_number = queueNumber;

      // If it's an emergency, move to front of queue
      if (isEmergency) {
        appointmentData.priority = 'urgent';
        appointmentData.queue_number = 1;
        
        // Shift all other appointments for that day
        await mysqlConnection.query(
          'UPDATE appointments SET queue_number = queue_number + 1 WHERE appointment_date = ? AND doctor_id = ? AND queue_number >= 1',
          [appointmentDate, internalDoctorId]
        );
      }

      const appointment = await Appointment.create(appointmentData);

      res.status(201).json({
        success: true,
        message: `Appointment scheduled successfully. Queue number: ${queueNumber}`,
        data: {
          appointment,
          queueNumber,
          isEmergency
        }
      });

    } catch (error) {
      logger.error('Error booking queue appointment for patient:', error);
      next(error);
    }
  }
}

// Helper class for admin statistics
class Admin {
  static async getMonthlyStatistics() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);

    const [
      newUsers,
      newAppointments,
      completedAppointments,
      revenue
    ] = await Promise.all([
      User.countByDateRange(startDate, endDate),
      Appointment.countByDateRange(startDate, endDate),
      Appointment.countByDateRangeAndStatus(startDate, endDate, 'completed'),
      Appointment.getRevenueByDateRange(startDate, endDate)
    ]);

    return {
      month: currentMonth,
      year: currentYear,
      newUsers,
      newAppointments,
      completedAppointments,
      revenue
    };
  }
}

module.exports = AdminController;
