const express = require('express');
const router = express.Router();

// In-memory storage for mock doctors (will persist during server session)
let doctors = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@example.com',
    specialty: 'Cardiology',
    phone: '+1 234 567 8901',
    availability: ['Monday', 'Tuesday', 'Wednesday'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    email: 'michael.chen@example.com',
    specialty: 'Neurology',
    phone: '+1 234 567 8902',
    availability: ['Tuesday', 'Thursday', 'Friday'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@example.com',
    specialty: 'Pediatrics',
    phone: '+1 234 567 8903',
    availability: ['Monday', 'Wednesday', 'Friday'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let nextId = 4; // Counter for generating new IDs

// GET /api/mock/doctors - Get all doctors
router.get('/', (req, res) => {
  console.log('Mock Doctors API: GET /api/mock/doctors called');
  
  try {
    res.json({
      success: true,
      data: doctors,
      message: `Found ${doctors.length} doctors`,
      source: 'mock_api'
    });
  } catch (error) {
    console.error('Error in GET /api/mock/doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/mock/doctors/:id - Get specific doctor
router.get('/:id', (req, res) => {
  const { id } = req.params;
  console.log(`Mock Doctors API: GET /api/mock/doctors/${id} called`);
  
  try {
    const doctor = doctors.find(d => d.id === id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        source: 'mock_api'
      });
    }
    
    res.json({
      success: true,
      data: doctor,
      message: 'Doctor found',
      source: 'mock_api'
    });
  } catch (error) {
    console.error(`Error in GET /api/mock/doctors/${id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/mock/doctors - Create new doctor
router.post('/', (req, res) => {
  console.log('Mock Doctors API: POST /api/mock/doctors called');
  console.log('Request body:', req.body);
  
  try {
    const { name, email, specialty, phone, availability, status } = req.body;
    
    // Basic validation
    if (!name || !email || !specialty || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, specialty, phone',
        source: 'mock_api'
      });
    }
    
    // Check if email already exists
    const existingDoctor = doctors.find(d => d.email === email);
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'Doctor with this email already exists',
        source: 'mock_api'
      });
    }
    
    const newDoctor = {
      id: nextId.toString(),
      name,
      email,
      specialty,
      phone,
      availability: availability || [],
      status: status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    doctors.push(newDoctor);
    nextId++;
    
    console.log(`New doctor created:`, newDoctor);
    
    res.status(201).json({
      success: true,
      data: newDoctor,
      message: 'Doctor created successfully',
      source: 'mock_api'
    });
  } catch (error) {
    console.error('Error in POST /api/mock/doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// PUT /api/mock/doctors/:id - Update doctor
router.put('/:id', (req, res) => {
  const { id } = req.params;
  console.log(`Mock Doctors API: PUT /api/mock/doctors/${id} called`);
  console.log('Request body:', req.body);
  
  try {
    const doctorIndex = doctors.findIndex(d => d.id === id);
    
    if (doctorIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        source: 'mock_api'
      });
    }
    
    const { name, email, specialty, phone, availability, status } = req.body;
    
    // Basic validation
    if (!name || !email || !specialty || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, specialty, phone',
        source: 'mock_api'
      });
    }
    
    // Check if email already exists (exclude current doctor)
    const existingDoctor = doctors.find(d => d.email === email && d.id !== id);
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'Doctor with this email already exists',
        source: 'mock_api'
      });
    }
    
    const updatedDoctor = {
      ...doctors[doctorIndex],
      name,
      email,
      specialty,
      phone,
      availability: availability || [],
      status: status || 'active',
      updatedAt: new Date().toISOString()
    };
    
    doctors[doctorIndex] = updatedDoctor;
    
    console.log(`Doctor updated:`, updatedDoctor);
    
    res.json({
      success: true,
      data: updatedDoctor,
      message: 'Doctor updated successfully',
      source: 'mock_api'
    });
  } catch (error) {
    console.error(`Error in PUT /api/mock/doctors/${id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/mock/doctors/count - Get doctor count
router.get('/meta/count', (req, res) => {
  console.log('Mock Doctors API: GET /api/mock/doctors/meta/count called');
  
  try {
    const activeCount = doctors.filter(d => d.status === 'active').length;
    const inactiveCount = doctors.filter(d => d.status === 'inactive').length;
    
    res.json({
      success: true,
      data: {
        total: doctors.length,
        active: activeCount,
        inactive: inactiveCount
      },
      message: 'Doctor count retrieved successfully',
      source: 'mock_api'
    });
  } catch (error) {
    console.error('Error in GET /api/mock/doctors/meta/count:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
