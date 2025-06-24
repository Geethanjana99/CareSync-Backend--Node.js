const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { appointmentValidation } = require('../middleware/validation');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth.authMiddleware);

// Get appointments
router.get('/', appointmentController.getAppointments);
router.get('/available-slots', appointmentController.getAvailableSlots);
router.get('/slots/:doctorId', appointmentController.getAvailableSlots);
router.get('/upcoming', appointmentController.getAppointments); // Will filter by status
router.get('/history', appointmentController.getAppointments); // Will filter by status
router.get('/:appointmentId', appointmentController.getAppointment);

// Create appointment
router.post('/', appointmentValidation.create, appointmentController.create);

// Update appointment
router.put('/:appointmentId', appointmentValidation.update, appointmentController.update);
router.patch('/:appointmentId/status', appointmentController.update); // Generic update method
router.patch('/:appointmentId/confirm', appointmentController.confirm);
router.patch('/:appointmentId/complete', appointmentController.complete);

// Cancel appointment
router.delete('/:appointmentId', appointmentController.cancel);

// Statistics (for doctors and admins)
router.get('/stats/overview', auth.authorize(['doctor', 'admin']), appointmentController.getStatistics);

module.exports = router;
