const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const appointmentRoutes = require('./appointments');
const patientRoutes = require('./patients');
const doctorRoutes = require('./doctors');
const medicalReportRoutes = require('./medical-reports');
const adminRoutes = require('./admin');

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

// Public endpoints (no authentication required) - MUST come before protected routes
router.get('/doctors/search', PatientController.searchDoctors);

// Mount protected routes
router.use('/auth', authRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/medical-reports', medicalReportRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
