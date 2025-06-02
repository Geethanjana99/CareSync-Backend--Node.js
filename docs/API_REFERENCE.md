# Clinical Appointment Scheduling System - API Documentation

## Overview

The Clinical Appointment Scheduling System provides a comprehensive RESTful API for managing clinical appointments, patient records, doctor schedules, and medical reports. This API is built with Node.js, Express.js, and follows RESTful principles with JWT-based authentication.

## Base URL

- **Development**: `http://localhost:3000`
- **Staging**: `https://staging-api.clinicalscheduler.com`
- **Production**: `https://api.clinicalscheduler.com`

## Interactive Documentation

- **Swagger UI**: Available at `/api/docs` endpoint
- **Postman Collection**: [Download](./postman_collection.json)

## Authentication

The API uses JSON Web Tokens (JWT) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Endpoints

- `POST /api/auth/login` - Authenticate user and receive tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate tokens

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

- **General**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **File Upload**: 10 requests per 15 minutes per user

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": {
      // Additional error details
    }
  }
}
```

## API Endpoints

### Authentication & User Management

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `PUT /api/auth/change-password` - Change password (authenticated)

#### User Profile
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `DELETE /api/auth/account` - Delete user account

### Patient Management

#### Patient Profile
- `GET /api/patients/dashboard` - Get patient dashboard
- `GET /api/patients/profile` - Get patient profile
- `PUT /api/patients/profile` - Update patient profile
- `GET /api/patients/health-metrics` - Get health metrics
- `POST /api/patients/health-metrics` - Add health metric

#### Doctor Search & Selection
- `GET /api/patients/doctors` - Search and filter doctors
- `GET /api/patients/doctors/:id` - Get doctor details
- `GET /api/patients/doctors/:id/availability` - Get doctor availability
- `GET /api/patients/doctors/:id/reviews` - Get doctor reviews
- `POST /api/patients/doctors/:id/reviews` - Add doctor review

#### Appointment History
- `GET /api/patients/appointments` - Get appointment history
- `GET /api/patients/appointments/:id` - Get appointment details

### Doctor Management

#### Doctor Profile
- `GET /api/doctors/dashboard` - Get doctor dashboard
- `GET /api/doctors/profile` - Get doctor profile
- `PUT /api/doctors/profile` - Update doctor profile
- `GET /api/doctors/schedule` - Get doctor schedule
- `PUT /api/doctors/schedule` - Update doctor schedule

#### Availability Management
- `GET /api/doctors/availability` - Get availability settings
- `PUT /api/doctors/availability` - Update availability
- `POST /api/doctors/availability/slots` - Add custom time slots
- `DELETE /api/doctors/availability/slots/:id` - Remove time slot

#### Patient Management
- `GET /api/doctors/patients` - Get patient list
- `GET /api/doctors/patients/:id` - Get patient details
- `GET /api/doctors/patients/:id/history` - Get patient medical history

#### Appointments
- `GET /api/doctors/appointments` - Get doctor appointments
- `GET /api/doctors/appointments/today` - Get today's appointments
- `PUT /api/doctors/appointments/:id/status` - Update appointment status
- `POST /api/doctors/appointments/:id/notes` - Add appointment notes

#### Earnings & Statistics
- `GET /api/doctors/earnings` - Get earnings data
- `GET /api/doctors/statistics` - Get performance statistics

### Appointment Management

#### Appointment CRUD
- `GET /api/appointments` - Get appointments (filtered)
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

#### Appointment Status
- `PUT /api/appointments/:id/confirm` - Confirm appointment
- `PUT /api/appointments/:id/complete` - Mark as completed
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `PUT /api/appointments/:id/reschedule` - Reschedule appointment

#### Availability & Slots
- `GET /api/appointments/slots` - Get available slots
- `POST /api/appointments/check-availability` - Check specific slot availability

### Medical Reports

#### Report Management
- `GET /api/medical-reports` - Get medical reports
- `POST /api/medical-reports` - Create new report
- `GET /api/medical-reports/:id` - Get report details
- `PUT /api/medical-reports/:id` - Update report
- `DELETE /api/medical-reports/:id` - Delete report

#### File Management
- `POST /api/medical-reports/:id/files` - Upload files to report
- `GET /api/medical-reports/:id/files/:fileId` - Download file
- `DELETE /api/medical-reports/:id/files/:fileId` - Delete file

#### AI Analysis
- `POST /api/medical-reports/:id/analyze` - Request AI analysis
- `GET /api/medical-reports/:id/analysis` - Get AI analysis results

### Admin Management

#### User Management
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/users/:id` - Delete user

#### Doctor Approval
- `GET /api/admin/doctors/pending` - Get pending doctor approvals
- `PUT /api/admin/doctors/:id/approve` - Approve doctor
- `PUT /api/admin/doctors/:id/reject` - Reject doctor application

#### System Statistics
- `GET /api/admin/dashboard` - Get admin dashboard
- `GET /api/admin/statistics` - Get system statistics
- `GET /api/admin/health` - Get system health status

#### System Configuration
- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings` - Update system settings

### File Upload & Management

#### General File Operations
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id` - Download file
- `DELETE /api/files/:id` - Delete file

#### Image Processing
- `POST /api/files/upload/image` - Upload and process image
- `GET /api/files/images/:id/thumbnail` - Get image thumbnail

### Notifications

#### Notification Management
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

#### Email Templates
- `GET /api/notifications/templates` - Get email templates
- `POST /api/notifications/send` - Send custom notification

### Health & Monitoring

#### System Health
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health status
- `GET /api/metrics` - Prometheus metrics

#### Database Status
- `GET /api/health/database` - Database connectivity check
- `GET /api/health/cache` - Cache system status

## HTTP Status Codes

The API uses standard HTTP status codes:

- `200` - OK: Request successful
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid request data
- `401` - Unauthorized: Authentication required
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `409` - Conflict: Resource conflict
- `422` - Unprocessable Entity: Validation failed
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

## Error Codes

Custom error codes for specific scenarios:

### Authentication Errors
- `AUTH_001` - Invalid credentials
- `AUTH_002` - Token expired
- `AUTH_003` - Token invalid
- `AUTH_004` - Account locked
- `AUTH_005` - Email not verified

### Validation Errors
- `VAL_001` - Required field missing
- `VAL_002` - Invalid format
- `VAL_003` - Value out of range
- `VAL_004` - Duplicate value

### Business Logic Errors
- `BUS_001` - Appointment slot unavailable
- `BUS_002` - Doctor not available
- `BUS_003` - Patient not eligible
- `BUS_004` - Appointment cannot be modified
- `BUS_005` - Payment required

### Resource Errors
- `RES_001` - Resource not found
- `RES_002` - Resource access denied
- `RES_003` - Resource limit exceeded
- `RES_004` - Resource conflict

## Data Models

### User Model
```json
{
  "id": "integer",
  "email": "string",
  "role": "enum['patient', 'doctor', 'admin']",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "isActive": "boolean",
  "lastLogin": "datetime",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Patient Model
```json
{
  "id": "integer",
  "userId": "integer",
  "dateOfBirth": "date",
  "gender": "enum['male', 'female', 'other']",
  "bloodType": "enum['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']",
  "allergies": "string",
  "medicalHistory": "string",
  "emergencyContact": "object",
  "insurance": "object",
  "address": "object"
}
```

### Doctor Model
```json
{
  "id": "integer",
  "userId": "integer",
  "specialty": "string",
  "subSpecialty": "string",
  "licenseNumber": "string",
  "yearsOfExperience": "integer",
  "education": "array",
  "certifications": "array",
  "consultationFee": "decimal",
  "rating": "decimal",
  "totalReviews": "integer",
  "isApproved": "boolean",
  "availability": "object"
}
```

### Appointment Model
```json
{
  "id": "integer",
  "patientId": "integer",
  "doctorId": "integer",
  "appointmentDate": "date",
  "startTime": "time",
  "endTime": "time",
  "status": "enum['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']",
  "type": "enum['consultation', 'follow-up', 'check-up', 'procedure', 'emergency']",
  "reason": "string",
  "symptoms": "array",
  "priority": "enum['low', 'medium', 'high', 'urgent']",
  "cost": "decimal",
  "paymentStatus": "enum['pending', 'paid', 'failed', 'refunded']"
}
```

## SDKs and Libraries

### JavaScript/TypeScript SDK
```javascript
import { ClinicalSchedulerAPI } from '@clinical-scheduler/sdk';

const api = new ClinicalSchedulerAPI({
  baseURL: 'https://api.clinicalscheduler.com',
  apiKey: 'your-api-key'
});

// Authenticate
const { token } = await api.auth.login({
  email: 'user@example.com',
  password: 'password'
});

// Get appointments
const appointments = await api.appointments.list({
  status: 'scheduled',
  page: 1,
  limit: 10
});
```

### Python SDK
```python
from clinical_scheduler import ClinicalSchedulerAPI

api = ClinicalSchedulerAPI(
    base_url='https://api.clinicalscheduler.com',
    api_key='your-api-key'
)

# Authenticate
token = api.auth.login(
    email='user@example.com',
    password='password'
)

# Get appointments
appointments = api.appointments.list(
    status='scheduled',
    page=1,
    limit=10
)
```

## Webhook Events

The API supports webhooks for real-time notifications:

### Available Events
- `appointment.created` - New appointment created
- `appointment.confirmed` - Appointment confirmed
- `appointment.completed` - Appointment completed
- `appointment.cancelled` - Appointment cancelled
- `doctor.approved` - Doctor application approved
- `payment.completed` - Payment processed

### Webhook Configuration
```javascript
// Configure webhook endpoint
POST /api/webhooks/configure
{
  "url": "https://your-app.com/webhooks/clinical-scheduler",
  "events": ["appointment.created", "appointment.confirmed"],
  "secret": "your-webhook-secret"
}
```

## Support and Resources

### Documentation
- [Getting Started Guide](./getting-started.md)
- [Authentication Guide](./authentication.md)
- [API Reference](https://api.clinicalscheduler.com/docs)
- [SDK Documentation](./sdks.md)

### Support Channels
- **Email**: api-support@clinicalscheduler.com
- **Documentation**: https://docs.clinicalscheduler.com
- **Status Page**: https://status.clinicalscheduler.com
- **Community Forum**: https://community.clinicalscheduler.com

### Service Level Agreement (SLA)
- **Uptime**: 99.9% monthly uptime guarantee
- **Response Time**: < 200ms average response time
- **Support**: 24/7 technical support for production issues

## Changelog

### Version 1.0.0 (Latest)
- Initial API release
- Core appointment management functionality
- JWT authentication
- Real-time notifications via WebSocket
- File upload and management
- Comprehensive admin panel

### Upcoming Features
- Multi-language support
- Advanced analytics dashboard
- Integration with external EHR systems
- Mobile-specific endpoints
- GraphQL API support

---

*Last updated: December 2024*
*API Version: 1.0.0*
