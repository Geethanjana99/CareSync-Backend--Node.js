const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/patientController');
const { patientValidation } = require('../middleware/validation');
const auth = require('../middleware/auth');

// All routes require patient authentication
router.use(auth.authMiddleware);
router.use(auth.authorize(['patient']));

// Profile management
router.get('/profile', PatientController.getProfile);
router.put('/profile', patientValidation.update, PatientController.updateProfile);

// Dashboard
router.get('/dashboard', PatientController.getDashboard);

// Appointments
router.get('/appointments', PatientController.getAppointmentHistory);
router.get('/appointments/upcoming', PatientController.getUpcomingAppointments);

// Medical reports
router.get('/medical-reports', PatientController.getMedicalReports);

// Health metrics
router.get('/health-metrics', PatientController.getHealthMetrics);
router.post('/health-metrics', PatientController.updateHealthMetrics);

// Doctor search
router.get('/doctors/search', PatientController.searchDoctors);

module.exports = router;
