const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/doctorController');
const { doctorValidation } = require('../middleware/validation');
const auth = require('../middleware/auth');

// Public endpoint for getting doctor names (no auth required)
router.get('/names', DoctorController.getDoctorNames);

// All routes below require doctor authentication
router.use(auth.authMiddleware);
router.use(auth.authorize('doctor'));

// Profile management
router.get('/profile', DoctorController.getProfile);
router.put('/profile', DoctorController.updateProfile);

// Dashboard
router.get('/dashboard', DoctorController.getDashboard);

// Schedule and availability
router.get('/schedule', DoctorController.getSchedule);

// Appointments
router.get('/appointments/today', DoctorController.getTodayAppointments);
router.get('/appointments', DoctorController.getAppointmentHistory);
router.patch('/appointments/:appointmentId/status', DoctorController.updateAppointmentStatus);
router.patch('/appointments/:appointmentId/action', DoctorController.handleAppointmentAction);
router.post('/appointments/:appointmentId/notes', DoctorController.addMedicalNotes);

// Patient information
router.get('/patients', DoctorController.getPatients);
router.get('/patients/:patientId', DoctorController.getPatientDetails);

// Earnings and statistics
router.get('/earnings', DoctorController.getEarnings);
router.get('/statistics', DoctorController.getStatistics);

// Queue management
router.get('/queue', DoctorController.getQueue);
router.get('/queue/status', DoctorController.getQueueStatus);
router.get('/queue/summary', DoctorController.getQueueSummary);
router.get('/queue/next-patient', DoctorController.getNextPaidPatient);
router.put('/queue/current', DoctorController.updateCurrentQueueNumber);
router.post('/queue/start', DoctorController.startQueue);
router.post('/queue/stop', DoctorController.stopQueue);
router.post('/queue/start/:appointmentId', DoctorController.startNextConsultation);
router.post('/queue/complete/:appointmentId', DoctorController.completeConsultation);
router.put('/appointments/:appointmentId/payment-status', DoctorController.updatePaymentStatus);

// Availability and queue management  
router.get('/availability', DoctorController.getDoctorAvailability);
router.put('/availability/status', DoctorController.updateAvailabilityStatus);
router.put('/availability/working-hours', DoctorController.updateWorkingHours);

// AI Predictions
router.get('/ai-predictions', DoctorController.getAIPredictions);
router.patch('/ai-predictions/:id/review', DoctorController.reviewAIPrediction);

module.exports = router;
