const express = require('express');
const router = express.Router();
const path = require('path');

// API Documentation
const apiDocumentation = {
  info: {
    title: 'Clinical Appointment Scheduling System API',
    version: '1.0.0',
    description: 'Comprehensive API for managing clinical appointments, patients, doctors, and medical records',
    contact: {
      name: 'API Support',
      email: 'support@clinicalapp.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development server'
    },
    {
      url: 'https://api.clinicalapp.com/api',
      description: 'Production server'
    }
  ],
  authentication: {
    type: 'Bearer Token (JWT)',
    description: 'Include JWT token in Authorization header: Bearer <token>',
    endpoints: {
      login: 'POST /auth/login',
      refresh: 'POST /auth/refresh'
    }
  },
  endpoints: {
    authentication: {
      'POST /auth/register': {
        description: 'Register a new user',
        body: {
          firstName: 'string (required)',
          lastName: 'string (required)',
          email: 'string (required, email format)',
          password: 'string (required, min 8 chars)',
          phone: 'string (required)',
          dateOfBirth: 'date (required)',
          gender: 'string (required: male/female/other)',
          role: 'string (optional: patient/doctor, default: patient)'
        },
        response: {
          success: 'boolean',
          user: 'object',
          token: 'string'
        }
      },
      'POST /auth/login': {
        description: 'User login',
        body: {
          email: 'string (required)',
          password: 'string (required)'
        },
        response: {
          success: 'boolean',
          user: 'object',
          token: 'string',
          refreshToken: 'string'
        }
      },
      'POST /auth/refresh': {
        description: 'Refresh access token',
        body: {
          refreshToken: 'string (required)'
        },
        response: {
          success: 'boolean',
          token: 'string'
        }
      },
      'GET /auth/profile': {
        description: 'Get user profile',
        authentication: 'required',
        response: {
          success: 'boolean',
          user: 'object'
        }
      },
      'PUT /auth/profile': {
        description: 'Update user profile',
        authentication: 'required',
        body: {
          firstName: 'string (optional)',
          lastName: 'string (optional)',
          phone: 'string (optional)',
          avatar: 'string (optional)'
        },
        response: {
          success: 'boolean',
          user: 'object'
        }
      },
      'POST /auth/change-password': {
        description: 'Change user password',
        authentication: 'required',
        body: {
          currentPassword: 'string (required)',
          newPassword: 'string (required, min 8 chars)'
        },
        response: {
          success: 'boolean',
          message: 'string'
        }
      }
    },
    appointments: {
      'GET /appointments': {
        description: 'List user appointments',
        authentication: 'required',
        query: {
          status: 'string (optional: scheduled/confirmed/completed/cancelled)',
          date: 'date (optional)',
          page: 'number (optional, default: 1)',
          limit: 'number (optional, default: 10)'
        },
        response: {
          success: 'boolean',
          appointments: 'array',
          pagination: 'object'
        }
      },
      'POST /appointments': {
        description: 'Create new appointment',
        authentication: 'required (patient)',
        body: {
          doctorId: 'number (required)',
          appointmentDate: 'date (required)',
          appointmentTime: 'time (required)',
          duration: 'number (optional, default: 30)',
          type: 'string (required: consultation/follow-up/emergency)',
          symptoms: 'string (optional)',
          notes: 'string (optional)'
        },
        response: {
          success: 'boolean',
          appointment: 'object'
        }
      },
      'GET /appointments/:id': {
        description: 'Get appointment details',
        authentication: 'required',
        response: {
          success: 'boolean',
          appointment: 'object'
        }
      },
      'PUT /appointments/:id': {
        description: 'Update appointment',
        authentication: 'required',
        body: {
          status: 'string (optional)',
          appointmentDate: 'date (optional)',
          appointmentTime: 'time (optional)',
          symptoms: 'string (optional)',
          notes: 'string (optional)'
        },
        response: {
          success: 'boolean',
          appointment: 'object'
        }
      },
      'DELETE /appointments/:id': {
        description: 'Cancel appointment',
        authentication: 'required',
        response: {
          success: 'boolean',
          message: 'string'
        }
      },
      'GET /appointments/slots': {
        description: 'Get available appointment slots',
        authentication: 'required',
        query: {
          doctorId: 'number (required)',
          date: 'date (required)',
          duration: 'number (optional, default: 30)'
        },
        response: {
          success: 'boolean',
          slots: 'array'
        }
      }
    },
    patients: {
      'GET /patients/dashboard': {
        description: 'Get patient dashboard data',
        authentication: 'required (patient)',
        response: {
          success: 'boolean',
          dashboard: {
            upcomingAppointments: 'array',
            recentAppointments: 'array',
            totalAppointments: 'number',
            healthMetrics: 'object'
          }
        }
      },
      'GET /patients/doctors': {
        description: 'Search and list doctors',
        authentication: 'required (patient)',
        query: {
          specialty: 'string (optional)',
          search: 'string (optional)',
          page: 'number (optional)',
          limit: 'number (optional)'
        },
        response: {
          success: 'boolean',
          doctors: 'array',
          pagination: 'object'
        }
      },
      'GET /patients/health-metrics': {
        description: 'Get patient health metrics',
        authentication: 'required (patient)',
        response: {
          success: 'boolean',
          metrics: 'object'
        }
      },
      'PUT /patients/health-metrics': {
        description: 'Update patient health metrics',
        authentication: 'required (patient)',
        body: {
          height: 'number (optional)',
          weight: 'number (optional)',
          bloodPressureSystolic: 'number (optional)',
          bloodPressureDiastolic: 'number (optional)',
          heartRate: 'number (optional)',
          bloodSugar: 'number (optional)',
          allergies: 'array (optional)',
          medications: 'array (optional)'
        },
        response: {
          success: 'boolean',
          metrics: 'object'
        }
      }
    },
    doctors: {
      'GET /doctors/dashboard': {
        description: 'Get doctor dashboard data',
        authentication: 'required (doctor)',
        response: {
          success: 'boolean',
          dashboard: {
            todayAppointments: 'array',
            upcomingAppointments: 'array',
            totalPatients: 'number',
            earnings: 'object'
          }
        }
      },
      'GET /doctors/patients': {
        description: 'Get doctor patients',
        authentication: 'required (doctor)',
        query: {
          search: 'string (optional)',
          page: 'number (optional)',
          limit: 'number (optional)'
        },
        response: {
          success: 'boolean',
          patients: 'array',
          pagination: 'object'
        }
      },
      'GET /doctors/schedule': {
        description: 'Get doctor schedule',
        authentication: 'required (doctor)',
        query: {
          date: 'date (optional)',
          week: 'string (optional)'
        },
        response: {
          success: 'boolean',
          schedule: 'object'
        }
      },
      'PUT /doctors/schedule': {
        description: 'Update doctor schedule',
        authentication: 'required (doctor)',
        body: {
          workingHours: 'object (required)',
          breakTimes: 'array (optional)',
          unavailableDates: 'array (optional)'
        },
        response: {
          success: 'boolean',
          schedule: 'object'
        }
      },
      'GET /doctors/availability': {
        description: 'Check doctor availability',
        authentication: 'required',
        query: {
          date: 'date (required)',
          time: 'time (optional)'
        },
        response: {
          success: 'boolean',
          available: 'boolean',
          slots: 'array'
        }
      }
    },
    admin: {
      'GET /admin/dashboard': {
        description: 'Get admin dashboard data',
        authentication: 'required (admin)',
        response: {
          success: 'boolean',
          dashboard: {
            totalUsers: 'number',
            totalDoctors: 'number',
            totalPatients: 'number',
            totalAppointments: 'number',
            recentActivities: 'array'
          }
        }
      },
      'GET /admin/users': {
        description: 'Get all users',
        authentication: 'required (admin)',
        query: {
          role: 'string (optional)',
          status: 'string (optional)',
          search: 'string (optional)',
          page: 'number (optional)',
          limit: 'number (optional)'
        },
        response: {
          success: 'boolean',
          users: 'array',
          pagination: 'object'
        }
      },
      'PUT /admin/users/:id': {
        description: 'Update user',
        authentication: 'required (admin)',
        body: {
          status: 'string (optional)',
          role: 'string (optional)',
          verified: 'boolean (optional)'
        },
        response: {
          success: 'boolean',
          user: 'object'
        }
      },
      'GET /admin/analytics': {
        description: 'Get system analytics',
        authentication: 'required (admin)',
        query: {
          period: 'string (optional: day/week/month/year)',
          startDate: 'date (optional)',
          endDate: 'date (optional)'
        },
        response: {
          success: 'boolean',
          analytics: 'object'
        }
      }
    },
    medicalReports: {
      'POST /medical-reports/upload': {
        description: 'Upload medical report file',
        authentication: 'required',
        contentType: 'multipart/form-data',
        body: {
          file: 'file (required)',
          title: 'string (required)',
          description: 'string (optional)',
          type: 'string (required: lab-report/prescription/scan/other)',
          patientId: 'number (optional, for doctors/admin)'
        },
        response: {
          success: 'boolean',
          report: 'object'
        }
      },
      'GET /medical-reports': {
        description: 'List medical reports',
        authentication: 'required',
        query: {
          type: 'string (optional)',
          patientId: 'number (optional, for doctors/admin)',
          page: 'number (optional)',
          limit: 'number (optional)'
        },
        response: {
          success: 'boolean',
          reports: 'array',
          pagination: 'object'
        }
      },
      'GET /medical-reports/:id': {
        description: 'Get medical report details',
        authentication: 'required',
        response: {
          success: 'boolean',
          report: 'object'
        }
      },
      'GET /medical-reports/:id/download': {
        description: 'Download medical report file',
        authentication: 'required',
        response: 'file download'
      },
      'DELETE /medical-reports/:id': {
        description: 'Delete medical report',
        authentication: 'required',
        response: {
          success: 'boolean',
          message: 'string'
        }
      }
    }
  },
  statusCodes: {
    200: 'OK - Request successful',
    201: 'Created - Resource created successfully',
    400: 'Bad Request - Invalid request data',
    401: 'Unauthorized - Authentication required',
    403: 'Forbidden - Access denied',
    404: 'Not Found - Resource not found',
    409: 'Conflict - Resource already exists',
    422: 'Unprocessable Entity - Validation failed',
    429: 'Too Many Requests - Rate limit exceeded',
    500: 'Internal Server Error - Server error'
  },
  rateLimiting: {
    general: '100 requests per 15 minutes',
    authentication: '5 requests per 15 minutes',
    registration: '3 requests per 15 minutes',
    upload: '10 requests per 15 minutes'
  },
  examples: {
    registration: {
      request: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        role: 'patient'
      },
      response: {
        success: true,
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          role: 'patient',
          verified: false,
          createdAt: '2023-10-01T10:00:00Z'
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    },
    login: {
      request: {
        email: 'john.doe@example.com',
        password: 'SecurePass123!'
      },
      response: {
        success: true,
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          role: 'patient'
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    },
    appointment: {
      request: {
        doctorId: 5,
        appointmentDate: '2023-10-15',
        appointmentTime: '14:30',
        duration: 30,
        type: 'consultation',
        symptoms: 'Experiencing headaches and fatigue',
        notes: 'First time consultation'
      },
      response: {
        success: true,
        appointment: {
          id: 123,
          patientId: 1,
          doctorId: 5,
          appointmentDate: '2023-10-15',
          appointmentTime: '14:30:00',
          duration: 30,
          type: 'consultation',
          status: 'scheduled',
          symptoms: 'Experiencing headaches and fatigue',
          notes: 'First time consultation',
          createdAt: '2023-10-01T10:00:00Z'
        }
      }
    }
  }
};

// Main documentation route
router.get('/', (req, res) => {
  res.json({
    success: true,
    documentation: apiDocumentation
  });
});

// Get specific endpoint documentation
router.get('/endpoints/:category', (req, res) => {
  const { category } = req.params;
  
  if (apiDocumentation.endpoints[category]) {
    res.json({
      success: true,
      category,
      endpoints: apiDocumentation.endpoints[category]
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Documentation category not found',
      availableCategories: Object.keys(apiDocumentation.endpoints)
    });
  }
});

// Get examples
router.get('/examples', (req, res) => {
  res.json({
    success: true,
    examples: apiDocumentation.examples
  });
});

// Get rate limiting info
router.get('/rate-limits', (req, res) => {
  res.json({
    success: true,
    rateLimiting: apiDocumentation.rateLimiting
  });
});

// Get status codes
router.get('/status-codes', (req, res) => {
  res.json({
    success: true,
    statusCodes: apiDocumentation.statusCodes
  });
});

// Interactive API testing interface (simple HTML)
router.get('/test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Clinical API Documentation</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .endpoint { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .method { color: #fff; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
            .post { background: #49cc90; }
            .get { background: #61affe; }
            .put { background: #fca130; }
            .delete { background: #f93e3e; }
            code { background: #f8f8f8; padding: 2px 5px; border-radius: 3px; }
            .example { background: #e8f4fd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        </style>
    </head>
    <body>
        <h1>Clinical Appointment System API Documentation</h1>
        <p>Welcome to the interactive API documentation. Use this page to explore available endpoints.</p>
        
        <h2>Quick Start</h2>
        <div class="example">
            <h3>1. Register a new user</h3>
            <span class="method post">POST</span> <code>/api/auth/register</code>
            <pre>{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}</pre>
        </div>
        
        <div class="example">
            <h3>2. Login</h3>
            <span class="method post">POST</span> <code>/api/auth/login</code>
            <pre>{
  "email": "john@example.com",
  "password": "SecurePass123!"
}</pre>
        </div>
        
        <div class="example">
            <h3>3. Create an appointment</h3>
            <span class="method post">POST</span> <code>/api/appointments</code>
            <p><strong>Requires:</strong> Authorization header with JWT token</p>
            <pre>{
  "doctorId": 5,
  "appointmentDate": "2023-10-15",
  "appointmentTime": "14:30",
  "type": "consultation",
  "symptoms": "Headaches and fatigue"
}</pre>
        </div>
        
        <h2>Available Endpoints</h2>
        <p>Get detailed documentation:</p>
        <ul>
            <li><a href="/api/docs/endpoints/authentication">Authentication endpoints</a></li>
            <li><a href="/api/docs/endpoints/appointments">Appointment endpoints</a></li>
            <li><a href="/api/docs/endpoints/patients">Patient endpoints</a></li>
            <li><a href="/api/docs/endpoints/doctors">Doctor endpoints</a></li>
            <li><a href="/api/docs/endpoints/admin">Admin endpoints</a></li>
            <li><a href="/api/docs/endpoints/medicalReports">Medical reports endpoints</a></li>
        </ul>
        
        <h2>Additional Resources</h2>
        <ul>
            <li><a href="/api/docs/examples">Request/Response examples</a></li>
            <li><a href="/api/docs/rate-limits">Rate limiting information</a></li>
            <li><a href="/api/docs/status-codes">HTTP status codes</a></li>
            <li><a href="/api/health">System health check</a></li>
        </ul>
        
        <h2>Authentication</h2>
        <p>Most endpoints require authentication. Include the JWT token in the Authorization header:</p>
        <code>Authorization: Bearer YOUR_JWT_TOKEN</code>
        
        <h2>Base URL</h2>
        <p>All API endpoints are prefixed with <code>/api</code></p>
        <p>Example: <code>GET http://localhost:5000/api/auth/profile</code></p>
    </body>
    </html>
  `);
});

module.exports = router;