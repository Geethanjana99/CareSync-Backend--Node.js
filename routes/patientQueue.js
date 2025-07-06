const express = require('express');
const router = express.Router();
const { mysqlConnection } = require('../config/mysql');
const { authMiddleware } = require('../middleware/auth');

// Get patient's queue position for today
router.get('/queue/position', authMiddleware, async (req, res) => {
  try {
    const patientId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Get patient's ID from patients table
    const patient = await mysqlConnection.query(
      'SELECT id FROM patients WHERE user_id = ?',
      [patientId]
    );
    
    if (patient.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const patientDbId = patient[0].id;
    
    // Get patient's appointments for today
    const appointments = await mysqlConnection.query(`
      SELECT 
        a.id,
        a.appointment_id,
        a.doctor_id,
        a.queue_number,
        a.status,
        a.priority,
        a.is_emergency,
        u.name as doctor_name,
        d.specialty,
        qs.current_number,
        qs.current_emergency_number,
        qs.is_active as queue_active
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN queue_status qs ON d.id = qs.doctor_id AND qs.queue_date = a.queue_date
      WHERE a.patient_id = ? AND a.queue_date = ?
    `, [patientDbId, today]);
    
    if (appointments.length === 0) {
      return res.json({ 
        success: true,
        data: { appointments: [] }
      });
    }
    
    // Calculate queue position for each appointment
    const appointmentsWithPosition = appointments.map(appointment => {
      let position = 0;
      let currentNumber = appointment.current_number;
      let currentEmergencyNumber = appointment.current_emergency_number;
      
      if (appointment.is_emergency) {
        // For emergency appointments, calculate position based on emergency queue
        const emergencyNum = parseInt(currentEmergencyNumber.substring(1)) || 0;
        const myEmergencyNum = parseInt(appointment.queue_number) || 0;
        position = Math.max(0, myEmergencyNum - emergencyNum);
      } else {
        // For regular appointments, calculate position based on regular queue
        const regularNum = parseInt(currentNumber) || 0;
        const myRegularNum = parseInt(appointment.queue_number) || 0;
        position = Math.max(0, myRegularNum - regularNum);
      }
      
      return {
        ...appointment,
        queue_position: position,
        estimated_wait_time: position * 15 // 15 minutes per patient estimate
      };
    });
    
    res.json({ 
      success: true,
      data: { appointments: appointmentsWithPosition }
    });
  } catch (error) {
    console.error('Error fetching queue position:', error);
    res.status(500).json({ error: 'Failed to fetch queue position' });
  }
});

// Get queue information for a specific doctor
router.get('/queue/doctor/:doctorId', authMiddleware, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    // Get queue status for the doctor
    const queueStatus = await mysqlConnection.query(
      'SELECT * FROM queue_status WHERE doctor_id = ? AND queue_date = ?',
      [doctorId, today]
    );
    
    if (queueStatus.length === 0) {
      return res.json({ 
        current_number: '0',
        current_emergency_number: 'E0',
        is_active: false,
        total_patients: 0,
        emergency_patients: 0,
        regular_patients: 0
      });
    }
    
    // Get total appointments for today
    const totalAppointments = await mysqlConnection.query(
      'SELECT COUNT(*) as total FROM appointments WHERE doctor_id = ? AND queue_date = ?',
      [doctorId, today]
    );
    
    // Get emergency appointments count
    const emergencyAppointments = await mysqlConnection.query(
      'SELECT COUNT(*) as total FROM appointments WHERE doctor_id = ? AND queue_date = ? AND is_emergency = 1',
      [doctorId, today]
    );
    
    // Get regular appointments count
    const regularAppointments = await mysqlConnection.query(
      'SELECT COUNT(*) as total FROM appointments WHERE doctor_id = ? AND queue_date = ? AND is_emergency = 0',
      [doctorId, today]
    );
    
    res.json({
      ...queueStatus[0],
      total_patients: totalAppointments[0].total,
      emergency_patients: emergencyAppointments[0].total,
      regular_patients: regularAppointments[0].total
    });
  } catch (error) {
    console.error('Error fetching doctor queue info:', error);
    res.status(500).json({ error: 'Failed to fetch queue information' });
  }
});

module.exports = router;
