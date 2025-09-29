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
      // Create direct connection for admin operations
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: 'caresyncdb-caresync.e.aivencloud.com',
        port: 16006,
        user: 'avnadmin',
        password: 'AVNS_6xeaVpCVApextDTAKfU',
        database: 'caresync',
        ssl: { rejectUnauthorized: false }
      });
      
      const query = `
        SELECT u.id, u.name, u.email, p.patient_id as patient_code, p.status as patient_status
        FROM users u
        INNER JOIN patients p ON u.id = p.user_id
        WHERE u.role = 'patient' AND u.is_active = true
        ORDER BY u.name
      `;
      
      const [patients] = await connection.execute(query);
      await connection.end();
      
      const patientList = patients.map(patient => ({
        id: patient.id,
        name: patient.name || patient.email,
        email: patient.email,
        patientCode: patient.patient_code,
        status: patient.patient_status
      }));

      logger.info(`Admin: Loaded ${patientList.length} patients`);

      res.json({
        success: true,
        data: patientList,
        message: `Found ${patientList.length} patients`
      });
    } catch (error) {
      logger.error('Error fetching patient names:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load patients',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get all patients with comprehensive details
  static async getAllPatients(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search = '',
        status = 'active'
      } = req.query;

      // Create direct connection for admin operations
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: 'caresyncdb-caresync.e.aivencloud.com',
        port: 16006,
        user: 'avnadmin',
        password: 'AVNS_6xeaVpCVApextDTAKfU',
        database: 'caresync',
        ssl: { rejectUnauthorized: false }
      });
      
      let whereClause = "WHERE u.role = 'patient' AND u.is_active = 1";
      let countParams = [];
      let dataParams = [];
      
      if (search && search.trim() !== '') {
        whereClause += " AND (u.name LIKE ? OR u.email LIKE ? OR p.patient_id LIKE ?)";
        const searchPattern = `%${search.trim()}%`;
        countParams.push(searchPattern, searchPattern, searchPattern);
        dataParams.push(searchPattern, searchPattern, searchPattern);
      }
      
      if (status && status !== 'all' && status !== '') {
        whereClause += " AND p.status = ?";
        countParams.push(status);
        dataParams.push(status);
      }
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        INNER JOIN patients p ON u.id = p.user_id
        ${whereClause}
      `;
      
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
      const offset = (pageNum - 1) * limitNum;
      
      const dataQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.created_at,
          u.is_active,
          p.patient_id,
          p.date_of_birth,
          p.gender,
          p.address,
          p.emergency_contact_name,
          p.emergency_contact_phone,
          p.status
        FROM users u
        INNER JOIN patients p ON u.id = p.user_id
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      
      console.log('Executing count query:', countQuery);
      console.log('Count params:', countParams);
      
      const [countResult] = await connection.execute(countQuery, countParams);
      
      console.log('Executing data query:', dataQuery);
      console.log('Data params:', dataParams);
      
      const [patients] = await connection.execute(dataQuery, dataParams);
      
      await connection.end();
      
      const formattedPatients = patients.map(patient => ({
        id: patient.id,
        patient_id: patient.patient_id,
        name: patient.name || 'N/A',
        email: patient.email,
        phone: patient.phone || 'N/A',
        date_of_birth: patient.date_of_birth,
        gender: patient.gender || 'N/A',
        address: patient.address || 'N/A',
        emergency_contact_name: patient.emergency_contact_name || 'N/A',
        emergency_contact_phone: patient.emergency_contact_phone || 'N/A',
        status: patient.status || 'active',
        created_at: patient.created_at
      }));

      const totalCount = countResult[0].total;
      const totalPages = Math.ceil(totalCount / limitNum);

      logger.info(`Admin: Loaded ${formattedPatients.length} patients (page ${pageNum}/${totalPages})`);

      res.json({
        success: true,
        data: {
          patients: formattedPatients,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalCount,
            limit: limitNum
          }
        },
        message: `Found ${totalCount} patients`
      });
    } catch (error) {
      logger.error('Error fetching all patients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load patients',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get all doctors with comprehensive details
  static async getAllDoctors(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search = '',
        status = 'active',
        specialty = ''
      } = req.query;

      // Create direct connection for admin operations
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: 'caresyncdb-caresync.e.aivencloud.com',
        port: 16006,
        user: 'avnadmin',
        password: 'AVNS_6xeaVpCVApextDTAKfU',
        database: 'caresync',
        ssl: { rejectUnauthorized: false }
      });
      
      let whereClause = "WHERE u.role = 'doctor' AND u.is_active = 1";
      let countParams = [];
      let dataParams = [];
      
      if (search && search.trim() !== '') {
        whereClause += " AND (u.name LIKE ? OR u.email LIKE ? OR d.license_number LIKE ? OR d.specialty LIKE ?)";
        const searchPattern = `%${search.trim()}%`;
        countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
        dataParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }
      
      if (specialty && specialty.trim() !== '') {
        whereClause += " AND d.specialty = ?";
        countParams.push(specialty);
        dataParams.push(specialty);
      }
      
      if (status && status !== 'all' && status !== '') {
        whereClause += " AND d.status = ?";
        countParams.push(status);
        dataParams.push(status);
      }
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        INNER JOIN doctors d ON u.id = d.user_id
        ${whereClause}
      `;
      
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
      const offset = (pageNum - 1) * limitNum;
      
      const dataQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.created_at,
          u.is_active,
          d.doctor_id,
          d.specialty,
          d.license_number,
          d.years_of_experience,
          d.education,
          d.certifications,
          d.consultation_fee,
          d.working_hours,
          d.availability_status,
          d.status,
          d.rating,
          d.total_reviews,
          d.office_address,
          d.bio
        FROM users u
        INNER JOIN doctors d ON u.id = d.user_id
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      
      console.log('Executing doctors count query:', countQuery);
      console.log('Count params:', countParams);
      
      const [countResult] = await connection.execute(countQuery, countParams);
      
      console.log('Executing doctors data query:', dataQuery);
      console.log('Data params:', dataParams);
      
      const [doctors] = await connection.execute(dataQuery, dataParams);
      
      await connection.end();
      
      const formattedDoctors = doctors.map(doctor => ({
        id: doctor.id,
        doctor_id: doctor.doctor_id,
        name: doctor.name || 'N/A',
        email: doctor.email,
        phone: doctor.phone || 'N/A',
        specialty: doctor.specialty || 'N/A',
        license_number: doctor.license_number || 'N/A',
        years_of_experience: doctor.years_of_experience || 0,
        education: doctor.education || 'N/A',
        certifications: doctor.certifications || 'N/A',
        consultation_fee: doctor.consultation_fee || 0,
        available_days: doctor.available_days || 'N/A',
        available_hours: doctor.available_hours || 'N/A',
        status: doctor.status || 'active',
        approval_status: doctor.approval_status || 'pending',
        average_rating: doctor.average_rating || 0,
        total_reviews: doctor.total_reviews || 0,
        created_at: doctor.created_at
      }));

      const totalCount = countResult[0].total;
      const totalPages = Math.ceil(totalCount / limitNum);

      logger.info(`Admin: Loaded ${formattedDoctors.length} doctors (page ${pageNum}/${totalPages})`);

      res.json({
        success: true,
        data: {
          doctors: formattedDoctors,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalCount,
            limit: limitNum
          }
        },
        message: `Found ${totalCount} doctors`
      });
    } catch (error) {
      logger.error('Error fetching all doctors:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load doctors',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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
        priority = 'medium'
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

      // Validate appointment date (allow current date)
      const selectedDate = new Date(appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Set selected date to start of day for proper comparison
      selectedDate.setHours(0, 0, 0, 0);
      
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

      const appointment = await Appointment.create(appointmentData);

      res.status(201).json({
        success: true,
        message: `Appointment scheduled successfully. Queue number: ${queueNumber}`,
        data: {
          appointment,
          queueNumber
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
