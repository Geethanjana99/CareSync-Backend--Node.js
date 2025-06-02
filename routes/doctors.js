const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/doctorController');
const { validateDoctorProfile, validateAvailability, validateMedicalNotes } = require('../middleware/validation');
const auth = require('../middleware/auth');

// All routes require doctor authentication
router.use(auth.required);
router.use(auth.authorize(['doctor']));

// Profile management
router.get('/profile', DoctorController.getProfile);
router.put('/profile', validateDoctorProfile, DoctorController.updateProfile);

// Dashboard
router.get('/dashboard', DoctorController.getDashboard);

// Schedule and availability
router.get('/schedule', DoctorController.getSchedule);
router.put('/availability', validateAvailability, DoctorController.updateAvailability);

// Appointments
router.get('/appointments/today', DoctorController.getTodayAppointments);
router.get('/appointments', DoctorController.getAppointmentHistory);
router.patch('/appointments/:appointmentId/status', DoctorController.updateAppointmentStatus);
router.post('/appointments/:appointmentId/notes', validateMedicalNotes, DoctorController.addMedicalNotes);

// Patient information
router.get('/patients/:patientId', DoctorController.getPatientDetails);

// Earnings and statistics
router.get('/earnings', DoctorController.getEarnings);
router.get('/statistics', DoctorController.getStatistics);

module.exports = router;
