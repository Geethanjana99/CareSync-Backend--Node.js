const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Clinical Appointment Scheduling System API',
      version: '1.0.0',
      description: 'Comprehensive API for managing clinical appointments, patients, doctors, and medical records',
      contact: {
        name: 'API Support',
        email: 'support@clinicalscheduler.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.clinicalscheduler.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password', 'role'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'User password (hashed)'
            },
            role: {
              type: 'string',
              enum: ['patient', 'doctor', 'admin'],
              description: 'User role'
            },
            firstName: {
              type: 'string',
              description: 'First name'
            },
            lastName: {
              type: 'string',
              description: 'Last name'
            },
            phone: {
              type: 'string',
              description: 'Phone number'
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Account status'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Patient: {
          type: 'object',
          required: ['userId'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier'
            },
            userId: {
              type: 'integer',
              description: 'Associated user ID'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Date of birth'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              description: 'Gender'
            },
            bloodType: {
              type: 'string',
              enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
              description: 'Blood type'
            },
            allergies: {
              type: 'string',
              description: 'Known allergies'
            },
            medicalHistory: {
              type: 'string',
              description: 'Medical history'
            },
            emergencyContact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                relationship: { type: 'string' }
              }
            },
            insurance: {
              type: 'object',
              properties: {
                provider: { type: 'string' },
                policyNumber: { type: 'string' },
                groupNumber: { type: 'string' }
              }
            },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
                country: { type: 'string' }
              }
            }
          }
        },
        Doctor: {
          type: 'object',
          required: ['userId', 'specialty'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier'
            },
            userId: {
              type: 'integer',
              description: 'Associated user ID'
            },
            specialty: {
              type: 'string',
              description: 'Medical specialty'
            },
            subSpecialty: {
              type: 'string',
              description: 'Sub-specialty'
            },
            licenseNumber: {
              type: 'string',
              description: 'Medical license number'
            },
            yearsOfExperience: {
              type: 'integer',
              description: 'Years of experience'
            },
            education: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  degree: { type: 'string' },
                  institution: { type: 'string' },
                  year: { type: 'integer' }
                }
              }
            },
            certifications: {
              type: 'array',
              items: { type: 'string' }
            },
            consultationFee: {
              type: 'number',
              format: 'decimal',
              description: 'Consultation fee'
            },
            rating: {
              type: 'number',
              format: 'decimal',
              minimum: 0,
              maximum: 5,
              description: 'Average rating'
            },
            totalReviews: {
              type: 'integer',
              description: 'Total number of reviews'
            },
            isApproved: {
              type: 'boolean',
              default: false,
              description: 'Approval status'
            },
            availability: {
              type: 'object',
              description: 'Weekly availability schedule'
            }
          }
        },
        Appointment: {
          type: 'object',
          required: ['patientId', 'doctorId', 'appointmentDate', 'startTime', 'endTime'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier'
            },
            patientId: {
              type: 'integer',
              description: 'Patient ID'
            },
            doctorId: {
              type: 'integer',
              description: 'Doctor ID'
            },
            appointmentDate: {
              type: 'string',
              format: 'date',
              description: 'Appointment date'
            },
            startTime: {
              type: 'string',
              format: 'time',
              description: 'Start time'
            },
            endTime: {
              type: 'string',
              format: 'time',
              description: 'End time'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
              default: 'scheduled',
              description: 'Appointment status'
            },
            type: {
              type: 'string',
              enum: ['consultation', 'follow-up', 'check-up', 'procedure', 'emergency'],
              description: 'Appointment type'
            },
            reason: {
              type: 'string',
              description: 'Reason for appointment'
            },
            notes: {
              type: 'string',
              description: 'Additional notes'
            },
            symptoms: {
              type: 'array',
              items: { type: 'string' },
              description: 'Patient symptoms'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              default: 'medium',
              description: 'Priority level'
            },
            isFollowUp: {
              type: 'boolean',
              default: false,
              description: 'Is follow-up appointment'
            },
            followUpDate: {
              type: 'string',
              format: 'date',
              description: 'Recommended follow-up date'
            },
            cost: {
              type: 'number',
              format: 'decimal',
              description: 'Appointment cost'
            },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'paid', 'failed', 'refunded'],
              default: 'pending',
              description: 'Payment status'
            }
          }
        },
        MedicalReport: {
          type: 'object',
          required: ['patientId', 'doctorId', 'title'],
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId'
            },
            patientId: {
              type: 'integer',
              description: 'Patient ID'
            },
            doctorId: {
              type: 'integer',
              description: 'Doctor ID'
            },
            appointmentId: {
              type: 'integer',
              description: 'Associated appointment ID'
            },
            title: {
              type: 'string',
              description: 'Report title'
            },
            description: {
              type: 'string',
              description: 'Report description'
            },
            reportType: {
              type: 'string',
              enum: ['lab-result', 'diagnosis', 'prescription', 'imaging', 'consultation-notes'],
              description: 'Type of report'
            },
            findings: {
              type: 'string',
              description: 'Medical findings'
            },
            diagnosis: {
              type: 'string',
              description: 'Diagnosis'
            },
            treatment: {
              type: 'string',
              description: 'Treatment plan'
            },
            medications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  dosage: { type: 'string' },
                  frequency: { type: 'string' },
                  duration: { type: 'string' },
                  instructions: { type: 'string' }
                }
              }
            },
            labResults: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  test: { type: 'string' },
                  result: { type: 'string' },
                  normalRange: { type: 'string' },
                  unit: { type: 'string' }
                }
              }
            },
            files: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  originalName: { type: 'string' },
                  mimeType: { type: 'string' },
                  size: { type: 'number' },
                  uploadDate: { type: 'string', format: 'date-time' }
                }
              }
            },
            aiAnalysis: {
              type: 'object',
              properties: {
                confidence: { type: 'number' },
                predictions: { type: 'array', items: { type: 'string' } },
                recommendations: { type: 'array', items: { type: 'string' } }
              }
            },
            isReviewed: {
              type: 'boolean',
              default: false
            },
            reviewedBy: {
              type: 'integer',
              description: 'Doctor ID who reviewed'
            },
            reviewDate: {
              type: 'string',
              format: 'date-time'
            },
            tags: {
              type: 'array',
              items: { type: 'string' }
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              default: 'medium'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Request success status'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            error: {
              type: 'object',
              description: 'Error details'
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                details: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        ValidationError: {
          description: 'Validation Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation failed',
                error: {
                  code: 'VALIDATION_ERROR',
                  details: {
                    field: 'email',
                    message: 'Invalid email format'
                  }
                }
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Access denied. No token provided.',
                error: {
                  code: 'UNAUTHORIZED'
                }
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Insufficient permissions',
                error: {
                  code: 'FORBIDDEN'
                }
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found',
                error: {
                  code: 'NOT_FOUND'
                }
              }
            }
          }
        },
        InternalError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Internal server error',
                error: {
                  code: 'INTERNAL_ERROR'
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Clinical Appointment Scheduling API',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true
    }
  })
};
