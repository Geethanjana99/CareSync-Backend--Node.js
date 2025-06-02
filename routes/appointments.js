const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController');
const { validateAppointment, validateAppointmentUpdate } = require('../middleware/validation');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth.required);

// Get appointments
router.get('/', AppointmentController.getAppointments);
router.get('/slots/:doctorId', AppointmentController.getAvailableSlots);
router.get('/upcoming', AppointmentController.getUpcomingAppointments);
router.get('/history', AppointmentController.getAppointmentHistory);
router.get('/:appointmentId', AppointmentController.getAppointment);

// Create appointment
router.post('/', validateAppointment, AppointmentController.createAppointment);

// Update appointment
router.put('/:appointmentId', validateAppointmentUpdate, AppointmentController.updateAppointment);
router.patch('/:appointmentId/status', AppointmentController.updateAppointmentStatus);
router.patch('/:appointmentId/confirm', AppointmentController.confirmAppointment);
router.patch('/:appointmentId/complete', AppointmentController.completeAppointment);

// Cancel appointment
router.delete('/:appointmentId', AppointmentController.cancelAppointment);

// Statistics (for doctors and admins)
router.get('/stats/overview', auth.authorize(['doctor', 'admin']), AppointmentController.getStatistics);

module.exports = router;
