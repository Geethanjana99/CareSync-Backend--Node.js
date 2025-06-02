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
