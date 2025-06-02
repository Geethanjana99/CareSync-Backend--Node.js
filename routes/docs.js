const express = require('express');
const router = express.Router();
const healthMonitor = require('../services/healthMonitorService');

// API Documentation Data
const apiDocumentation = {
  info: {
    title: 'CareSync Clinical Appointment API',
    version: '1.0.0',
    description: 'RESTful API for Clinical Appointment Scheduling System',
    contact: {
      name: 'CareSync Support',
      email: 'support@caresync.com',
      url: 'https://caresync.com/support'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.API_BASE_URL || 'http://localhost:5000/api',
      description: 'Development Server'
    }
  ],
  authentication: {
    type: 'Bearer Token (JWT)',
    description: 'Include JWT token in Authorization header: Bearer <token>',
    endpoints: {
      login: 'POST /auth/login',
      register: 'POST /auth/register',
      refresh: 'POST /auth/refresh-token'
    }
  },
  endpoints: {
    authentication: {
      'POST /auth/register': {
        description: 'Register a new user',
        body: {
          name: 'string (required)',
          email: 'string (required)',
          password: 'string (required, min 6 chars)',
          role: 'enum (patient, doctor, admin)',
          phone: 'string (optional)'
        },
        responses: {
          201: 'User created successfully',
          400: 'Validation error',
          409: 'Email already exists'
        }
      },
      'POST /auth/login': {
        description: 'Authenticate user and get token',
        body: {
          email: 'string (required)',
          password: 'string (required)'
        },
        responses: {
          200: 'Login successful',
          401: 'Invalid credentials',
          400: 'Validation error'
        }
      },
      'POST /auth/refresh-token': {
        description: 'Refresh expired JWT token',
        body: {
          refreshToken: 'string (required)'
        },
        responses: {
          200: 'Token refreshed',
          401: 'Invalid refresh token'
        }
      },
      'GET /auth/profile': {
        description: 'Get current user profile',
        auth: 'Required',
        responses: {
          200: 'Profile retrieved',
          401: 'Unauthorized'
        }
      },
      'PUT /auth/profile': {
        description: 'Update user profile',
        auth: 'Required',
        body: {
          name: 'string (optional)',
          phone: 'string (optional)',
          avatar_url: 'string (optional)'
        },
        responses: {
          200: 'Profile updated',
          401: 'Unauthorized'
        }
      }
    },
    appointments: {
      'GET /appointments': {
        description: 'Get user appointments (filtered by role)',
        auth: 'Required',
        query: {
          status: 'enum (pending, confirmed, completed, cancelled)',
          date: 'date (YYYY-MM-DD)',
          page: 'number (default: 1)',
          limit: 'number (default: 10, max: 100)'
        },
        responses: {
          200: 'Appointments retrieved',
          401: 'Unauthorized'
        }
      },
      'POST /appointments': {
        description: 'Create new appointment (patients only)',
        auth: 'Required (patient)',
        body: {
          doctor_id: 'string (required)',
          appointment_date: 'date (required)',
          appointment_time: 'time (required)',
          reason: 'string (required)',
          type: 'enum (consultation, follow-up, emergency)'
        },
        responses: {
          201: 'Appointment created',
          400: 'Validation error',
          409: 'Time slot not available'
        }
      },
      'GET /appointments/:id': {
        description: 'Get specific appointment details',
        auth: 'Required',
        responses: {
          200: 'Appointment details',
          404: 'Appointment not found',
          403: 'Access denied'
        }
      },
      'PUT /appointments/:id': {
        description: 'Update appointment (status, notes, etc.)',
        auth: 'Required',
        body: {
          status: 'enum (confirmed, cancelled, completed)',
          notes: 'string (optional)',
          appointment_date: 'date (optional)',
          appointment_time: 'time (optional)'
        },
        responses: {
          200: 'Appointment updated',
          404: 'Appointment not found',
          403: 'Access denied'
        }
      },
      'DELETE /appointments/:id': {
        description: 'Cancel appointment',
        auth: 'Required',
        responses: {
          200: 'Appointment cancelled',
          404: 'Appointment not found',
          403: 'Access denied'
        }
      }
    },
    patients: {
      'GET /patients/profile': {
        description: 'Get patient profile',
        auth: 'Required (patient)',
        responses: {
          200: 'Patient profile',
          401: 'Unauthorized'
        }
      },
      'PUT /patients/profile': {
        description: 'Update patient profile',
        auth: 'Required (patient)',
        body: {
          date_of_birth: 'date (optional)',
          gender: 'enum (Male, Female, Other)',
          address: 'string (optional)',
          emergency_contact_name: 'string (optional)',
          emergency_contact_phone: 'string (optional)',
          allergies: 'string (optional)',
          current_medications: 'string (optional)',
          blood_type: 'string (optional)',
          height: 'number (optional)',
          weight: 'number (optional)'
        },
        responses: {
          200: 'Profile updated',
          401: 'Unauthorized'
        }
      },
      'GET /patients/dashboard': {
        description: 'Get patient dashboard data',
        auth: 'Required (patient)',
        responses: {
          200: 'Dashboard data',
          401: 'Unauthorized'
        }
      },
      'GET /patients/appointments': {
        description: 'Get patient appointments',
        auth: 'Required (patient)',
        query: {
          status: 'enum (pending, confirmed, completed, cancelled)',
          limit: 'number (default: 10)'
        },
        responses: {
          200: 'Appointments list',
          401: 'Unauthorized'
        }
      },
      'GET /patients/doctors': {
        description: 'Search available doctors',
        auth: 'Required (patient)',
        query: {
          specialization: 'string (optional)',
          date: 'date (optional)',
          rating: 'number (optional)',
          search: 'string (optional)'
        },
        responses: {
          200: 'Doctors list',
          401: 'Unauthorized'
        }
      }
    },
    doctors: {
      'GET /doctors/profile': {
        description: 'Get doctor profile',
        auth: 'Required (doctor)',
        responses: {
          200: 'Doctor profile',
          401: 'Unauthorized'
        }
      },
      'PUT /doctors/profile': {
        description: 'Update doctor profile',
        auth: 'Required (doctor)',
        body: {
          specialization: 'string (optional)',
          education: 'string (optional)',
          bio: 'string (optional)',
          consultation_fee: 'number (optional)',
          clinic_address: 'string (optional)'
        },
        responses: {
          200: 'Profile updated',
          401: 'Unauthorized'
        }
      },
      'GET /doctors/dashboard': {
        description: 'Get doctor dashboard data',
        auth: 'Required (doctor)',
        responses: {
          200: 'Dashboard data',
          401: 'Unauthorized'
        }
      },
      'GET /doctors/appointments': {
        description: 'Get doctor appointments',
        auth: 'Required (doctor)',
        query: {
          status: 'enum (pending, confirmed, completed, cancelled)',
          date: 'date (optional)',
          limit: 'number (default: 10)'
        },
        responses: {
          200: 'Appointments list',
          401: 'Unauthorized'
        }
      },
      'GET /doctors/availability/:date': {
        description: 'Get doctor availability for specific date',
        auth: 'Required (doctor)',
        responses: {
          200: 'Available time slots',
          401: 'Unauthorized'
        }
      },
      'PUT /doctors/availability': {
        description: 'Update doctor availability',
        auth: 'Required (doctor)',
        body: {
          availability_hours: 'object (required)',
          unavailable_dates: 'array (optional)'
        },
        responses: {
          200: 'Availability updated',
          401: 'Unauthorized'
        }
      }
    },
    medicalReports: {
      'GET /medical-reports': {
        description: 'Get medical reports (filtered by role)',
        auth: 'Required',
        query: {
          patient_id: 'string (optional, admin/doctor only)',
          type: 'string (optional)',
          page: 'number (default: 1)',
          limit: 'number (default: 10)'
        },
        responses: {
          200: 'Reports list',
          401: 'Unauthorized'
        }
      },
      'POST /medical-reports/upload': {
        description: 'Upload medical report file',
        auth: 'Required',
        contentType: 'multipart/form-data',
        body: {
          file: 'file (required)',
          patient_id: 'string (required)',
          title: 'string (required)',
          description: 'string (optional)',
          type: 'string (optional)'
        },
        responses: {
          201: 'File uploaded',
          400: 'Invalid file',
          401: 'Unauthorized'
        }
      },
      'GET /medical-reports/:id': {
        description: 'Get specific medical report',
        auth: 'Required',
        responses: {
          200: 'Report details',
          404: 'Report not found',
          403: 'Access denied'
        }
      },
      'GET /medical-reports/:id/download': {
        description: 'Download medical report file',
        auth: 'Required',
        responses: {
          200: 'File content',
          404: 'File not found',
          403: 'Access denied'
        }
      }
    },
    admin: {
      'GET /admin/dashboard': {
        description: 'Get admin dashboard statistics',
        auth: 'Required (admin)',
        responses: {
          200: 'Dashboard statistics',
          403: 'Access denied'
        }
      },
      'GET /admin/users': {
        description: 'Get all users with filtering',
        auth: 'Required (admin)',
        query: {
          role: 'enum (patient, doctor, admin)',
          status: 'enum (active, inactive)',
          search: 'string (optional)',
          page: 'number (default: 1)',
          limit: 'number (default: 20)'
        },
        responses: {
          200: 'Users list',
          403: 'Access denied'
        }
      },
      'PUT /admin/users/:id/status': {
        description: 'Update user status (activate/deactivate)',
        auth: 'Required (admin)',
        body: {
          is_active: 'boolean (required)'
        },
        responses: {
          200: 'Status updated',
          404: 'User not found',
          403: 'Access denied'
        }
      },
      'GET /admin/doctors/pending': {
        description: 'Get doctors pending approval',
        auth: 'Required (admin)',
        responses: {
          200: 'Pending doctors list',
          403: 'Access denied'
        }
      },
      'PUT /admin/doctors/:id/approve': {
        description: 'Approve doctor account',
        auth: 'Required (admin)',
        body: {
          is_approved: 'boolean (required)'
        },
        responses: {
          200: 'Doctor approval status updated',
          404: 'Doctor not found',
          403: 'Access denied'
        }
      }
    }
  },
  errorCodes: {
    400: 'Bad Request - Invalid input data',
    401: 'Unauthorized - Authentication required',
    403: 'Forbidden - Insufficient permissions',
    404: 'Not Found - Resource not found',
    409: 'Conflict - Resource already exists',
    422: 'Unprocessable Entity - Validation error',
    429: 'Too Many Requests - Rate limit exceeded',
    500: 'Internal Server Error - Server error'
  },
  rateLimiting: {
    general: '100 requests per 15 minutes per IP',
    authentication: '5 requests per 15 minutes per IP',
    passwordReset: '3 requests per hour per IP',
    fileUpload: '10 requests per minute per IP',
    admin: '30 requests per 5 minutes per IP'
  },
  dataFormats: {
    date: 'YYYY-MM-DD (e.g., 2024-01-15)',
    time: 'HH:MM:SS (e.g., 14:30:00)',
    datetime: 'ISO 8601 format (e.g., 2024-01-15T14:30:00.000Z)',
    phone: 'International format (e.g., +1234567890)',
    email: 'Valid email address (e.g., user@example.com)'
  }
};

// API Documentation endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CareSync API Documentation',
    data: apiDocumentation
  });
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await healthMonitor.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status !== 'unhealthy',
      data: health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Simple health check for load balancers
router.get('/health/simple', async (req, res) => {
  try {
    const health = await healthMonitor.getSimpleHealthStatus();
    const statusCode = health.status === 'ok' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

// API status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'CareSync API is running',
    data: {
      service: 'CareSync Clinical Appointment API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      endpoints: {
        documentation: '/api/docs',
        health: '/api/docs/health',
        authentication: '/api/auth',
        appointments: '/api/appointments',
        patients: '/api/patients',
        doctors: '/api/doctors',
        medicalReports: '/api/medical-reports',
        admin: '/api/admin'
      }
    }
  });
});

// OpenAPI/Swagger-like specification
router.get('/openapi', (req, res) => {
  const openApiSpec = {
    openapi: '3.0.0',
    info: apiDocumentation.info,
    servers: apiDocumentation.servers,
    paths: {},
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['patient', 'doctor', 'admin'] },
            phone: { type: 'string' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            patient_id: { type: 'string', format: 'uuid' },
            doctor_id: { type: 'string', format: 'uuid' },
            appointment_date: { type: 'string', format: 'date' },
            appointment_time: { type: 'string', format: 'time' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled'] },
            reason: { type: 'string' },
            fee: { type: 'number', format: 'decimal' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  };

  res.json(openApiSpec);
});

module.exports = router;
