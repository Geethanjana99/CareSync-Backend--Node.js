const express = require('express');
const router = express.Router();

// Temporary mock data for testing
let mockPatients = [
  {
    id: '1',
    patient_id: 'P-001',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 234-567-8900',
    date_of_birth: '1990-05-15',
    gender: 'male',
    address: '123 Main St, City, State',
    emergency_contact_name: 'Jane Smith',
    emergency_contact_phone: '+1 234-567-8901',
    status: 'active',
    created_at: '2023-10-15T10:00:00Z'
  },
  {
    id: '2',
    patient_id: 'P-002',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1 234-567-8901',
    date_of_birth: '1985-08-22',
    gender: 'female',
    address: '456 Oak Ave, City, State',
    emergency_contact_name: 'Mike Johnson',
    emergency_contact_phone: '+1 234-567-8902',
    status: 'active',
    created_at: '2023-10-16T11:00:00Z'
  }
];

// Get all patients (no auth required for testing)
router.get('/', (req, res) => {
  console.log('📋 Mock API: Fetching patients...');
  res.json({
    success: true,
    data: {
      patients: mockPatients,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: mockPatients.length,
        itemsPerPage: 20
      }
    }
  });
});

// Create new patient (no auth required for testing)
router.post('/', (req, res) => {
  console.log('📝 Mock API: Creating patient...', req.body);
  
  const { firstName, lastName, email, phone, dateOfBirth, gender, address, emergencyContact, emergencyPhone } = req.body;
  
  // Basic validation
  if (!firstName || !lastName || !email || !phone || !dateOfBirth || !gender) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: firstName, lastName, email, phone, dateOfBirth, gender'
    });
  }

  // Check if email already exists
  const existingPatient = mockPatients.find(p => p.email === email);
  if (existingPatient) {
    return res.status(400).json({
      success: false,
      message: 'Patient with this email already exists'
    });
  }
  
  // Generate new patient ID
  const newId = String(Math.max(...mockPatients.map(p => parseInt(p.id)), 0) + 1);
  const newPatientId = `P-${newId.padStart(3, '0')}`;
  
  // Generate new patient
  const newPatient = {
    id: newId,
    patient_id: newPatientId,
    name: `${firstName} ${lastName}`,
    email,
    phone,
    date_of_birth: dateOfBirth,
    gender,
    address,
    emergency_contact_name: emergencyContact,
    emergency_contact_phone: emergencyPhone,
    status: 'active',
    created_at: new Date().toISOString()
  };
  
  // Add to mock data
  mockPatients.push(newPatient);
  
  console.log('✅ Mock API: Patient created successfully');
  
  res.status(201).json({
    success: true,
    message: 'Patient created successfully',
    data: {
      patient: newPatient,
      user: {
        id: `user-${newPatient.id}`,
        name: newPatient.name,
        email: newPatient.email,
        phone: newPatient.phone
      }
    }
  });
});

// Update patient by ID (no auth required for testing)
router.put('/:id', (req, res) => {
  console.log('📝 Mock API: Updating patient...', req.params.id, req.body);
  
  const { id } = req.params;
  const { firstName, lastName, email, phone, dateOfBirth, gender, address, emergencyContact, emergencyPhone } = req.body;
  
  const patientIndex = mockPatients.findIndex(p => p.id === id);
  
  if (patientIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }
  
  // Update patient data
  mockPatients[patientIndex] = {
    ...mockPatients[patientIndex],
    name: `${firstName} ${lastName}`,
    email,
    phone,
    date_of_birth: dateOfBirth,
    gender,
    address,
    emergency_contact_name: emergencyContact,
    emergency_contact_phone: emergencyPhone
  };
  
  console.log('✅ Mock API: Patient updated successfully');
  
  res.json({
    success: true,
    message: 'Patient updated successfully',
    data: {
      patient: mockPatients[patientIndex]
    }
  });
});

module.exports = router;
