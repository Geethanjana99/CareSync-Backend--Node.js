const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const appointmentRoutes = require('./appointments');
const patientRoutes = require('./patients');
const doctorRoutes = require('./doctors');
const medicalReportRoutes = require('./medical-reports');
const adminRoutes = require('./admin');
const billingRoutes = require('./billing');

// Import controllers for public endpoints
const PatientController = require('../controllers/patientController');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Clinical Appointment Scheduling API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Public endpoints (no authentication required)
router.get('/doctors/search', PatientController.searchDoctors);

// Mock routes for development/testing (no authentication required)
router.use('/mock/patients', require('./mock-patients'));
router.use('/mock/doctors', require('./mock-doctors'));

// Mount protected routes
router.use('/auth', authRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/medical-reports', medicalReportRoutes);
router.use('/admin', adminRoutes);
router.use('/billing', billingRoutes);
router.use('/insurance-claims', require('./insurance-claims'));

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Clinical Appointment Scheduling System API',
    version: '1.0.0',
    endpoints: {
      auth: {
        base: '/api/auth',
        endpoints: [
          'POST /register - Register new user',
          'POST /login - User login',
          'POST /refresh-token - Refresh access token',
          'POST /forgot-password - Request password reset',
          'POST /reset-password - Reset password',
          'GET /profile - Get user profile',
          'PUT /profile - Update user profile',
          'POST /change-password - Change password',
          'POST /logout - User logout'
        ]
      },
      appointments: {
        base: '/api/appointments',
        endpoints: [
          'GET / - Get appointments',
          'POST / - Create appointment',
          'GET /slots/:doctorId - Get available slots',
          'GET /upcoming - Get upcoming appointments',
          'GET /history - Get appointment history',
          'GET /:id - Get specific appointment',
          'PUT /:id - Update appointment',
          'PATCH /:id/status - Update appointment status',
          'PATCH /:id/confirm - Confirm appointment',
          'PATCH /:id/complete - Complete appointment',
          'DELETE /:id - Cancel appointment',
          'GET /stats/overview - Get statistics'
        ]
      },
      patients: {
        base: '/api/patients',
        endpoints: [
          'GET /profile - Get patient profile',
          'PUT /profile - Update patient profile',
          'GET /dashboard - Get patient dashboard',
          'GET /appointments - Get appointment history',
          'GET /appointments/upcoming - Get upcoming appointments',
          'GET /medical-reports - Get medical reports',
          'GET /health-metrics - Get health metrics',
          'POST /health-metrics - Add health metrics',
          'GET /doctors/search - Search doctors'
        ]
      },
      doctors: {
        base: '/api/doctors',
        endpoints: [
          'GET /profile - Get doctor profile',
          'PUT /profile - Update doctor profile',
          'GET /dashboard - Get doctor dashboard',
          'GET /schedule - Get doctor schedule',
          'PUT /availability - Update availability',
          'GET /appointments/today - Get today\'s appointments',
          'GET /appointments - Get appointment history',
          'PATCH /appointments/:id/status - Update appointment status',
          'POST /appointments/:id/notes - Add medical notes',
          'GET /patients/:id - Get patient details',
          'GET /earnings - Get earnings summary',
          'GET /statistics - Get doctor statistics'
        ]
      },
      medicalReports: {
        base: '/api/medical-reports',
        endpoints: [
          'POST /upload - Upload medical report',
          'GET / - Get medical reports',
          'GET /:id - Get specific report',
          'GET /:id/download - Download report file',
          'PATCH /:id/status - Update report status',
          'GET /:id/ai-analysis - Get AI analysis',
          'DELETE /:id - Delete report'
        ]
      },
      admin: {
        base: '/api/admin',
        endpoints: [
          'GET /dashboard - Get admin dashboard',
          'GET /users - Get all users',
          'GET /users/:id - Get user details',
          'PATCH /users/:id/status - Update user status',
          'POST /users/admin - Create admin user',
          'GET /appointments - Get all appointments',
          'GET /appointments/statistics - Get appointment statistics',
          'GET /doctors/metrics - Get doctor metrics',
          'PATCH /doctors/:id/approval - Approve doctor registration',
          'GET /medical-reports - Get all medical reports',
          'GET /statistics - Get system statistics',
          'GET /health - Get system health'
        ]
      },
      billing: {
        base: '/api/billing',
        endpoints: [
          'GET /invoices - Get all invoices',
          'GET /invoices/:id - Get specific invoice',
          'POST /invoices - Create new invoice',
          'PUT /invoices/:id - Update invoice',
          'DELETE /invoices/:id - Delete invoice',
          'GET /payments - Get all payments',
          'GET /payments/:id - Get specific payment',
          'POST /payments - Process new payment',
          'PUT /payments/:id - Update payment status',
          'DELETE /payments/:id - Cancel payment'
        ]
      }
    },
    authentication: {
      type: 'JWT Bearer Token',
      header: 'Authorization: Bearer <token>'
    },
    roles: ['patient', 'doctor', 'admin'],
    supportedFormats: ['JSON'],
    rateLimit: '100 requests per 15 minutes per IP'
  });
});

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    availableEndpoints: '/api/docs'
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Clinical Appointment Scheduling System API',
    version: '1.0.0',
    endpoints: {
      auth: {
        base: '/api/auth',
        endpoints: [
          'POST /register - Register new user',
          'POST /login - User login',
          'POST /refresh-token - Refresh access token',
          'POST /forgot-password - Request password reset',
          'POST /reset-password - Reset password',
          'GET /profile - Get user profile',
          'PUT /profile - Update user profile',
          'POST /change-password - Change password',
          'POST /logout - User logout'
        ]
      },
      appointments: {
        base: '/api/appointments',
        endpoints: [
          'GET / - Get appointments',
          'POST / - Create appointment',
          'GET /slots/:doctorId - Get available slots',
          'GET /upcoming - Get upcoming appointments',
          'GET /history - Get appointment history',
          'GET /:id - Get specific appointment',
          'PUT /:id - Update appointment',
          'PATCH /:id/status - Update appointment status',
          'PATCH /:id/confirm - Confirm appointment',
          'PATCH /:id/complete - Complete appointment',
          'DELETE /:id - Cancel appointment',
          'GET /stats/overview - Get statistics'
        ]
      },
      patients: {
        base: '/api/patients',
        endpoints: [
          'GET /profile - Get patient profile',
          'PUT /profile - Update patient profile',
          'GET /dashboard - Get patient dashboard',
          'GET /appointments - Get appointment history',
          'GET /appointments/upcoming - Get upcoming appointments',
          'GET /medical-reports - Get medical reports',
          'GET /health-metrics - Get health metrics',
          'POST /health-metrics - Add health metrics',
          'GET /doctors/search - Search doctors'
        ]
      },
      doctors: {
        base: '/api/doctors',
        endpoints: [
          'GET /profile - Get doctor profile',
          'PUT /profile - Update doctor profile',
          'GET /dashboard - Get doctor dashboard',
          'GET /schedule - Get doctor schedule',
          'PUT /availability - Update availability',
          'GET /appointments/today - Get today\'s appointments',
          'GET /appointments - Get appointment history',
          'PATCH /appointments/:id/status - Update appointment status',
          'POST /appointments/:id/notes - Add medical notes',
          'GET /patients/:id - Get patient details',
          'GET /earnings - Get earnings summary',
          'GET /statistics - Get doctor statistics'
        ]
      },
      medicalReports: {
        base: '/api/medical-reports',
        endpoints: [
          'POST /upload - Upload medical report',
          'GET / - Get medical reports',
          'GET /:id - Get specific report',
          'GET /:id/download - Download report file',
          'PATCH /:id/status - Update report status',
          'GET /:id/ai-analysis - Get AI analysis',
          'DELETE /:id - Delete report'
        ]
      },
      admin: {
        base: '/api/admin',
        endpoints: [
          'GET /dashboard - Get admin dashboard',
          'GET /users - Get all users',
          'GET /users/:id - Get user details',
          'PATCH /users/:id/status - Update user status',
          'POST /users/admin - Create admin user',
          'GET /appointments - Get all appointments',
          'GET /appointments/statistics - Get appointment statistics',
          'GET /doctors/metrics - Get doctor metrics',
          'PATCH /doctors/:id/approval - Approve doctor registration',
          'GET /medical-reports - Get all medical reports',
          'GET /statistics - Get system statistics',
          'GET /health - Get system health'
        ]
      }
    },
    authentication: {
      type: 'JWT Bearer Token',
      header: 'Authorization: Bearer <token>'
    },
    roles: ['patient', 'doctor', 'admin'],
    supportedFormats: ['JSON'],
    rateLimit: '100 requests per 15 minutes per IP'
  });
});

// 404 catch-all handler for undefined API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    availableEndpoints: '/api/docs'
  });
});

module.exports = router;
