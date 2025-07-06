const express = require('express');
const router = express.Router();
const { mysqlConnection } = require('../config/mysql');
const { authMiddleware } = require('../middleware/auth');

// Get doctor's availability settings
router.get('/availability', authMiddleware, async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Get doctor's working hours and availability status
    const doctor = await mysqlConnection.query(
      'SELECT working_hours, availability_status FROM doctors WHERE user_id = ?',
      [doctorId]
    );
    
    if (doctor.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json({
      success: true,
      data: {
        working_hours: doctor[0].working_hours,
        availability_status: doctor[0].availability_status
      }
    });
  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability settings' });
  }
});

// Update doctor's working hours
router.put('/availability/working-hours', authMiddleware, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { working_hours } = req.body;
    
    // Validate working_hours format
    if (!working_hours || typeof working_hours !== 'object') {
      return res.status(400).json({ error: 'Invalid working hours format' });
    }
    
    await mysqlConnection.query(
      'UPDATE doctors SET working_hours = ? WHERE user_id = ?',
      [JSON.stringify(working_hours), doctorId]
    );
    
    res.json({ 
      success: true, 
      message: 'Working hours updated successfully' 
    });
  } catch (error) {
    console.error('Error updating working hours:', error);
    res.status(500).json({ error: 'Failed to update working hours' });
  }
});

// Update doctor's availability status
router.put('/availability/status', authMiddleware, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { status } = req.body;
    
    // Validate status
    if (!['available', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({ error: 'Invalid availability status' });
    }
    
    await mysqlConnection.query(
      'UPDATE doctors SET availability_status = ? WHERE user_id = ?',
      [status, doctorId]
    );
    
    res.json({ 
      success: true, 
      message: 'Availability status updated successfully' 
    });
  } catch (error) {
    console.error('Error updating availability status:', error);
    res.status(500).json({ error: 'Failed to update availability status' });
  }
});

// Get or create queue status for today
router.get('/queue/status', authMiddleware, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Get doctor's ID from doctors table
    const doctor = await mysqlConnection.query(
      'SELECT id FROM doctors WHERE user_id = ?',
      [doctorId]
    );
    
    if (doctor.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    const doctorDbId = doctor[0].id;
    
    // Check if queue status exists for today
    let queueStatus = await mysqlConnection.query(
      'SELECT * FROM queue_status WHERE doctor_id = ? AND queue_date = ?',
      [doctorDbId, today]
    );
    
    // If no queue status exists, create one
    if (queueStatus.length === 0) {
      await mysqlConnection.query(
        'INSERT INTO queue_status (doctor_id, queue_date, current_number, current_emergency_number, is_active) VALUES (?, ?, ?, ?, ?)',
        [doctorDbId, today, '0', 'E0', 0]
      );
      
      queueStatus = await mysqlConnection.query(
        'SELECT * FROM queue_status WHERE doctor_id = ? AND queue_date = ?',
        [doctorDbId, today]
      );
    }
    
    res.json({
      success: true,
      data: queueStatus[0]
    });
  } catch (error) {
    console.error('Error fetching queue status:', error);
    res.status(500).json({ error: 'Failed to fetch queue status' });
  }
});

// Start/Stop queue
router.put('/queue/toggle', authMiddleware, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { is_active } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    // Get doctor's ID from doctors table
    const doctor = await mysqlConnection.query(
      'SELECT id FROM doctors WHERE user_id = ?',
      [doctorId]
    );
    
    if (doctor.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    const doctorDbId = doctor[0].id;
    
    // Update queue status
    await mysqlConnection.query(
      'UPDATE queue_status SET is_active = ? WHERE doctor_id = ? AND queue_date = ?',
      [is_active ? 1 : 0, doctorDbId, today]
    );
    
    res.json({ 
      success: true, 
      message: `Queue ${is_active ? 'started' : 'stopped'} successfully` 
    });
  } catch (error) {
    console.error('Error toggling queue:', error);
    res.status(500).json({ error: 'Failed to toggle queue' });
  }
});

// Get today's appointments for the doctor
router.get('/appointments/today', authMiddleware, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Get doctor's ID from doctors table
    const doctor = await mysqlConnection.query(
      'SELECT id FROM doctors WHERE user_id = ?',
      [doctorId]
    );
    
    if (doctor.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    const doctorDbId = doctor[0].id;
    
    // Get appointments for today
    const appointments = await mysqlConnection.query(`
      SELECT 
        a.id,
        a.appointment_id,
        a.patient_id,
        a.queue_number,
        a.status,
        a.priority,
        a.is_emergency,
        a.reason_for_visit,
        a.symptoms,
        u.name,
        u.email,
        u.phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ? AND a.queue_date = ?
      ORDER BY a.is_emergency DESC, a.queue_number ASC
    `, [doctorDbId, today]);
    
    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Call next patient (update appointment status)
router.put('/appointments/:appointmentId/call-next', authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user.id;
    
    // Get doctor's ID from doctors table
    const doctor = await mysqlConnection.query(
      'SELECT id FROM doctors WHERE user_id = ?',
      [doctorId]
    );
    
    if (doctor.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    const doctorDbId = doctor[0].id;
    
    // Verify appointment belongs to this doctor
    const appointment = await mysqlConnection.query(
      'SELECT * FROM appointments WHERE id = ? AND doctor_id = ?',
      [appointmentId, doctorDbId]
    );
    
    if (appointment.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Update appointment status to in-progress
    await mysqlConnection.query(
      'UPDATE appointments SET status = ? WHERE id = ?',
      ['in-progress', appointmentId]
    );
    
    res.json({ 
      success: true, 
      message: 'Patient called successfully' 
    });
  } catch (error) {
    console.error('Error calling next patient:', error);
    res.status(500).json({ error: 'Failed to call next patient' });
  }
});

// Complete consultation
router.put('/appointments/:appointmentId/complete', authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user.id;
    
    // Get doctor's ID from doctors table
    const doctor = await mysqlConnection.query(
      'SELECT id FROM doctors WHERE user_id = ?',
      [doctorId]
    );
    
    if (doctor.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    const doctorDbId = doctor[0].id;
    
    // Verify appointment belongs to this doctor
    const appointment = await mysqlConnection.query(
      'SELECT * FROM appointments WHERE id = ? AND doctor_id = ?',
      [appointmentId, doctorDbId]
    );
    
    if (appointment.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Update appointment status to completed
    await mysqlConnection.query(
      'UPDATE appointments SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['completed', appointmentId]
    );
    
    res.json({ 
      success: true, 
      message: 'Consultation completed successfully' 
    });
  } catch (error) {
    console.error('Error completing consultation:', error);
    res.status(500).json({ error: 'Failed to complete consultation' });
  }
});

module.exports = router;
