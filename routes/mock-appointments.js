const express = require('express');
const router = express.Router();

// In-memory storage for mock appointments (will persist during server session)
let appointments = [
  {
    id: '1',
    patientName: 'John Smith',
    patientEmail: 'john.smith@email.com',
    doctorId: '1',
    doctorName: 'Dr. Sarah Johnson',
    doctorSpecialty: 'Cardiology',
    appointmentDate: '2025-06-28',
    appointmentTime: '10:00',
    reason: 'Regular checkup',
    notes: 'Annual heart health examination',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    patientName: 'Emma Wilson',
    patientEmail: 'emma.wilson@email.com',
    doctorId: '2',
    doctorName: 'Dr. Michael Chen',
    doctorSpecialty: 'Neurology',
    appointmentDate: '2025-06-29',
    appointmentTime: '14:30',
    reason: 'Follow-up consultation',
    notes: 'Migraine treatment follow-up',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    patientName: 'Robert Davis',
    patientEmail: 'robert.davis@email.com',
    doctorId: '3',
    doctorName: 'Dr. Emily Rodriguez',
    doctorSpecialty: 'Pediatrics',
    appointmentDate: '2025-06-30',
    appointmentTime: '09:30',
    reason: 'Child wellness visit',
    notes: 'Routine pediatric examination',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let nextId = 4; // Counter for generating new IDs

// GET /api/mock/appointments - Get all appointments
router.get('/', (req, res) => {
  console.log('Mock Appointments API: GET /api/mock/appointments called');
  
  try {
    const { status, doctorId, date } = req.query;
    let filteredAppointments = [...appointments];
    
    // Filter by status if provided
    if (status) {
      filteredAppointments = filteredAppointments.filter(apt => apt.status === status);
    }
    
    // Filter by doctor if provided
    if (doctorId) {
      filteredAppointments = filteredAppointments.filter(apt => apt.doctorId === doctorId);
    }
    
    // Filter by date if provided
    if (date) {
      filteredAppointments = filteredAppointments.filter(apt => apt.appointmentDate === date);
    }
    
    res.json({
      success: true,
      data: filteredAppointments,
      message: `Found ${filteredAppointments.length} appointments`,
      source: 'mock_api'
    });
  } catch (error) {
    console.error('Error in GET /api/mock/appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/mock/appointments - Create new appointment
router.post('/', (req, res) => {
  console.log('Mock Appointments API: POST /api/mock/appointments called');
  console.log('Request body:', req.body);
  
  try {
    const { 
      patientName, 
      patientEmail, 
      doctorId, 
      doctorName,
      doctorSpecialty,
      appointmentDate, 
      appointmentTime, 
      reason, 
      notes 
    } = req.body;
    
    // Basic validation
    if (!patientName || !doctorId || !appointmentDate || !appointmentTime || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patientName, doctorId, appointmentDate, appointmentTime, reason',
        source: 'mock_api'
      });
    }
    
    // Check for conflicting appointments (same doctor, date, and time)
    const conflictingAppointment = appointments.find(apt => 
      apt.doctorId === doctorId && 
      apt.appointmentDate === appointmentDate && 
      apt.appointmentTime === appointmentTime &&
      apt.status !== 'cancelled'
    );
    
    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not available at this time. Please choose a different time slot.',
        source: 'mock_api'
      });
    }
    
    const newAppointment = {
      id: nextId.toString(),
      patientName,
      patientEmail: patientEmail || '',
      doctorId,
      doctorName: doctorName || `Doctor ${doctorId}`,
      doctorSpecialty: doctorSpecialty || '',
      appointmentDate,
      appointmentTime,
      reason,
      notes: notes || '',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    appointments.push(newAppointment);
    nextId++;
    
    console.log(`New appointment created:`, newAppointment);
    
    res.status(201).json({
      success: true,
      data: newAppointment,
      message: 'Appointment created successfully',
      source: 'mock_api'
    });
  } catch (error) {
    console.error('Error in POST /api/mock/appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// PUT /api/mock/appointments/:id - Update appointment
router.put('/:id', (req, res) => {
  const { id } = req.params;
  console.log(`Mock Appointments API: PUT /api/mock/appointments/${id} called`);
  
  try {
    const appointmentIndex = appointments.findIndex(apt => apt.id === id);
    
    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        source: 'mock_api'
      });
    }
    
    const updatedAppointment = {
      ...appointments[appointmentIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    appointments[appointmentIndex] = updatedAppointment;
    
    res.json({
      success: true,
      data: updatedAppointment,
      message: 'Appointment updated successfully',
      source: 'mock_api'
    });
  } catch (error) {
    console.error(`Error in PUT /api/mock/appointments/${id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// DELETE /api/mock/appointments/:id - Delete appointment
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  console.log(`Mock Appointments API: DELETE /api/mock/appointments/${id} called`);
  
  try {
    const appointmentIndex = appointments.findIndex(apt => apt.id === id);
    
    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        source: 'mock_api'
      });
    }
    
    const deletedAppointment = appointments[appointmentIndex];
    appointments.splice(appointmentIndex, 1);
    
    res.json({
      success: true,
      data: deletedAppointment,
      message: 'Appointment deleted successfully',
      source: 'mock_api'
    });
  } catch (error) {
    console.error(`Error in DELETE /api/mock/appointments/${id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// PATCH /api/mock/appointments/:id/status - Update appointment status
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  console.log(`Mock Appointments API: PATCH /api/mock/appointments/${id}/status called`);
  
  try {
    const appointmentIndex = appointments.findIndex(apt => apt.id === id);
    
    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        source: 'mock_api'
      });
    }
    
    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses are: ' + validStatuses.join(', '),
        source: 'mock_api'
      });
    }
    
    appointments[appointmentIndex].status = status;
    appointments[appointmentIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: appointments[appointmentIndex],
      message: 'Appointment status updated successfully',
      source: 'mock_api'
    });
  } catch (error) {
    console.error(`Error in PATCH /api/mock/appointments/${id}/status:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
