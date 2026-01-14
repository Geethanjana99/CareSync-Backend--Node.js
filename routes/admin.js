const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { userValidation } = require('../middleware/validation');
const auth = require('../middleware/auth');

// All routes require admin authentication
router.use(auth.authMiddleware);
router.use(auth.authorize(['admin']));

// Dashboard
router.get('/dashboard', AdminController.getDashboard);

// User management
router.get('/users', AdminController.getUsers);
router.get('/users/patients/names', AdminController.getPatientNames);
router.get('/patients', AdminController.getAllPatients);
router.get('/users/:userId', AdminController.getUserDetails);
router.patch('/users/:userId/status', AdminController.updateUserStatus);
router.post('/users/admin', userValidation.register, AdminController.createAdminUser);

// Appointment management
router.get('/appointments', AdminController.getAppointments);
router.get('/appointments/statistics', AdminController.getAppointmentStatistics);
router.post('/appointments/queue', AdminController.bookQueueAppointmentForPatient);

// Doctor management
router.get('/doctors', AdminController.getDoctors);
router.get('/doctors/all', AdminController.getAllDoctors);
router.get('/doctors/metrics', AdminController.getDoctorMetrics);
router.patch('/doctors/:doctorId/approval', AdminController.approveDoctorRegistration);

// Medical reports management
router.get('/medical-reports', AdminController.getMedicalReports);

// System statistics and monitoring
router.get('/statistics', AdminController.getSystemStatistics);
router.get('/health', AdminController.getSystemHealth);

// Patient names for billing
router.get('/patient-names', AdminController.getPatientNames);

module.exports = router;
