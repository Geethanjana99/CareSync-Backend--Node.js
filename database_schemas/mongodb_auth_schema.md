# MongoDB Database Schema for Authentication System
# Compatible with authController.js and supporting features
# Version: 1.0

## Database Configuration
```javascript
// Use the clinical_appointment_system database
use('clinical_appointment_system');
```

## Collections Schema

### 1. users Collection
Primary authentication collection for all users

```javascript
// Collection: users
{
  _id: ObjectId,
  userId: String, // UUID v4 for compatibility with MySQL references
  name: String,
  email: String, // Unique index
  passwordHash: String,
  role: String, // 'patient', 'doctor', 'admin', 'billing'
  avatarUrl: String,
  phone: String,
  isActive: Boolean,
  emailVerified: Boolean,
  lastLogin: Date,
  
  // Password reset fields
  passwordReset: {
    token: String,
    expires: Date,
    requestedAt: Date,
    ipAddress: String,
    userAgent: String
  },
  
  // Email verification fields
  emailVerification: {
    token: String,
    expires: Date,
    attempts: Number,
    lastAttemptAt: Date
  },
  
  // Security tracking
  security: {
    loginAttempts: Number,
    lastFailedLogin: Date,
    lockedUntil: Date,
    twoFactorEnabled: Boolean,
    twoFactorSecret: String
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}

// Indexes for users collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "userId": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })
db.users.createIndex({ "isActive": 1 })
db.users.createIndex({ "passwordReset.token": 1 })
db.users.createIndex({ "emailVerification.token": 1 })
db.users.createIndex({ "createdAt": 1 })
```

### 2. patients Collection
Extended patient profile information

```javascript
// Collection: patients
{
  _id: ObjectId,
  userId: String, // Reference to users.userId
  patientId: String, // Auto-generated: P001, P002, etc.
  
  // Personal Information
  personalInfo: {
    dateOfBirth: Date,
    gender: String, // 'male', 'female', 'other'
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    occupation: String,
    maritalStatus: String,
    preferredLanguage: String
  },
  
  // Medical Information
  medicalInfo: {
    medicalHistory: [String],
    allergies: [String],
    currentMedications: [{
      name: String,
      dosage: String,
      frequency: String,
      prescribedBy: String,
      startDate: Date,
      endDate: Date
    }],
    chronicConditions: [String],
    familyMedicalHistory: [String],
    bloodType: String,
    height: Number, // in cm
    weight: Number, // in kg
    bmi: Number, // calculated field
    smokingStatus: String,
    alcoholConsumption: String,
    exerciseFrequency: String
  },
  
  // Insurance Information
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    membershipId: String,
    effectiveDate: Date,
    expirationDate: Date,
    copayAmount: Number,
    deductibleAmount: Number
  },
  
  // Health Metrics (time-series data)
  healthMetrics: [{
    date: Date,
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: Number,
    glucoseLevel: Number,
    weight: Number,
    notes: String,
    recordedBy: String
  }],
  
  // Preferences
  preferences: {
    preferredDoctorGender: String,
    preferredAppointmentTime: String,
    notificationPreferences: {
      email: Boolean,
      sms: Boolean,
      appointmentReminders: Boolean,
      healthTips: Boolean
    },
    languagePreference: String
  },
  
  // Status and metadata
  status: String, // 'active', 'inactive', 'suspended'
  createdAt: Date,
  updatedAt: Date
}

// Indexes for patients collection
db.patients.createIndex({ "userId": 1 }, { unique: true })
db.patients.createIndex({ "patientId": 1 }, { unique: true })
db.patients.createIndex({ "status": 1 })
db.patients.createIndex({ "personalInfo.dateOfBirth": 1 })
db.patients.createIndex({ "createdAt": 1 })
db.patients.createIndex({ "healthMetrics.date": -1 })
```

### 3. doctors Collection
Extended doctor profile information

```javascript
// Collection: doctors
{
  _id: ObjectId,
  userId: String, // Reference to users.userId
  doctorId: String, // Auto-generated: D001, D002, etc.
  
  // Professional Information
  professionalInfo: {
    specialty: String,
    subspecialty: [String],
    licenseNumber: String,
    yearsOfExperience: Number,
    education: [{
      degree: String,
      institution: String,
      year: Number,
      location: String
    }],
    certifications: [{
      name: String,
      issuingBody: String,
      issueDate: Date,
      expirationDate: Date,
      certificateNumber: String
    }],
    languagesSpoken: [String],
    bio: String
  },
  
  // Practice Information
  practiceInfo: {
    hospitalAffiliations: [String],
    officeAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    consultationFee: Number,
    commissionRate: Number, // percentage
    paymentMethods: [String],
    insuranceAccepted: [String]
  },
  
  // Availability and Schedule
  availability: {
    workingHours: {
      monday: { start: String, end: String, isAvailable: Boolean },
      tuesday: { start: String, end: String, isAvailable: Boolean },
      wednesday: { start: String, end: String, isAvailable: Boolean },
      thursday: { start: String, end: String, isAvailable: Boolean },
      friday: { start: String, end: String, isAvailable: Boolean },
      saturday: { start: String, end: String, isAvailable: Boolean },
      sunday: { start: String, end: String, isAvailable: Boolean }
    },
    appointmentDuration: Number, // in minutes
    maxDailyAppointments: Number,
    advanceBookingDays: Number,
    breakTimes: [{
      start: String,
      end: String,
      days: [String]
    }],
    currentStatus: String, // 'available', 'busy', 'offline'
    autoAcceptAppointments: Boolean
  },
  
  // Performance Metrics
  performance: {
    rating: Number,
    totalReviews: Number,
    totalPatients: Number,
    totalAppointments: Number,
    averageConsultationTime: Number,
    patientSatisfactionScore: Number,
    onTimePercentage: Number,
    cancellationRate: Number
  },
  
  // Reviews and Ratings
  reviews: [{
    patientId: String,
    appointmentId: String,
    rating: Number,
    comment: String,
    reviewDate: Date,
    isVerified: Boolean
  }],
  
  // Leave and Unavailability
  leaves: [{
    startDate: Date,
    endDate: Date,
    reason: String,
    type: String, // 'vacation', 'sick', 'conference', 'personal'
    isApproved: Boolean,
    approvedBy: String,
    approvedAt: Date
  }],
  
  // Status and approval
  status: String, // 'active', 'inactive', 'suspended', 'pending_approval'
  approvalInfo: {
    isApproved: Boolean,
    approvedAt: Date,
    approvedBy: String,
    rejectionReason: String
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}

// Indexes for doctors collection
db.doctors.createIndex({ "userId": 1 }, { unique: true })
db.doctors.createIndex({ "doctorId": 1 }, { unique: true })
db.doctors.createIndex({ "professionalInfo.licenseNumber": 1 }, { unique: true })
db.doctors.createIndex({ "professionalInfo.specialty": 1 })
db.doctors.createIndex({ "status": 1 })
db.doctors.createIndex({ "performance.rating": -1 })
db.doctors.createIndex({ "availability.currentStatus": 1 })
db.doctors.createIndex({ "createdAt": 1 })
```

### 4. refreshTokens Collection
JWT refresh token management

```javascript
// Collection: refreshTokens
{
  _id: ObjectId,
  userId: String,
  tokenHash: String, // Hashed version of the refresh token
  expiresAt: Date,
  isRevoked: Boolean,
  
  // Device and security information
  deviceInfo: {
    deviceId: String,
    deviceType: String, // 'mobile', 'desktop', 'tablet'
    deviceName: String,
    operatingSystem: String,
    browser: String
  },
  
  // Request information
  requestInfo: {
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      region: String,
      city: String
    }
  },
  
  // Metadata
  createdAt: Date,
  lastUsedAt: Date,
  revokedAt: Date,
  revokedBy: String,
  revokedReason: String
}

// Indexes for refreshTokens collection
db.refreshTokens.createIndex({ "userId": 1 })
db.refreshTokens.createIndex({ "tokenHash": 1 }, { unique: true })
db.refreshTokens.createIndex({ "expiresAt": 1 })
db.refreshTokens.createIndex({ "isRevoked": 1 })
db.refreshTokens.createIndex({ "createdAt": 1 })

// TTL index to automatically remove expired tokens
db.refreshTokens.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
```

### 5. userSessions Collection
Active user session tracking

```javascript
// Collection: userSessions
{
  _id: ObjectId,
  userId: String,
  sessionToken: String,
  
  // Session information
  sessionInfo: {
    ipAddress: String,
    userAgent: String,
    deviceFingerprint: String,
    location: {
      country: String,
      region: String,
      city: String
    }
  },
  
  // Status and activity
  isActive: Boolean,
  lastActivity: Date,
  expiresAt: Date,
  
  // Security flags
  security: {
    isSuspicious: Boolean,
    riskScore: Number,
    flags: [String]
  },
  
  createdAt: Date
}

// Indexes for userSessions collection
db.userSessions.createIndex({ "userId": 1 })
db.userSessions.createIndex({ "sessionToken": 1 }, { unique: true })
db.userSessions.createIndex({ "isActive": 1 })
db.userSessions.createIndex({ "expiresAt": 1 })
db.userSessions.createIndex({ "lastActivity": 1 })

// TTL index to automatically remove expired sessions
db.userSessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
```

### 6. loginAttempts Collection
Security monitoring and rate limiting

```javascript
// Collection: loginAttempts
{
  _id: ObjectId,
  email: String,
  ipAddress: String,
  userAgent: String,
  success: Boolean,
  failureReason: String,
  
  // Geographic information
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String
  },
  
  // Device information
  deviceInfo: {
    deviceType: String,
    operatingSystem: String,
    browser: String,
    isMobile: Boolean
  },
  
  // Security assessment
  riskAssessment: {
    riskScore: Number,
    factors: [String],
    isBlocked: Boolean
  },
  
  attemptedAt: Date
}

// Indexes for loginAttempts collection
db.loginAttempts.createIndex({ "email": 1 })
db.loginAttempts.createIndex({ "ipAddress": 1 })
db.loginAttempts.createIndex({ "success": 1 })
db.loginAttempts.createIndex({ "attemptedAt": 1 })
db.loginAttempts.createIndex({ "email": 1, "attemptedAt": -1 })

// TTL index to automatically remove old login attempts (keep for 90 days)
db.loginAttempts.createIndex({ "attemptedAt": 1 }, { expireAfterSeconds: 7776000 })
```

### 7. auditLogs Collection
Comprehensive audit trail for security and compliance

```javascript
// Collection: auditLogs
{
  _id: ObjectId,
  userId: String,
  userEmail: String,
  action: String, // 'login', 'logout', 'password_change', 'profile_update', etc.
  resource: String, // 'user', 'patient', 'doctor', 'appointment', etc.
  resourceId: String,
  
  // Event details
  eventDetails: {
    oldValues: Object,
    newValues: Object,
    changes: [String],
    metadata: Object
  },
  
  // Request information
  requestInfo: {
    ipAddress: String,
    userAgent: String,
    method: String,
    endpoint: String,
    requestId: String
  },
  
  // Result information
  result: {
    success: Boolean,
    errorMessage: String,
    statusCode: Number
  },
  
  timestamp: Date,
  severity: String, // 'low', 'medium', 'high', 'critical'
  category: String // 'authentication', 'authorization', 'data_access', 'data_modification'
}

// Indexes for auditLogs collection
db.auditLogs.createIndex({ "userId": 1 })
db.auditLogs.createIndex({ "action": 1 })
db.auditLogs.createIndex({ "resource": 1 })
db.auditLogs.createIndex({ "timestamp": -1 })
db.auditLogs.createIndex({ "severity": 1 })
db.auditLogs.createIndex({ "category": 1 })
db.auditLogs.createIndex({ "userId": 1, "timestamp": -1 })

// TTL index to automatically remove old audit logs (keep for 2 years)
db.auditLogs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 63072000 })
```

## Database Initialization Script

```javascript
// Initialize the database with required collections and indexes
// Run this script after setting up MongoDB

use('clinical_appointment_system');

// Create collections with validation rules
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "name", "email", "passwordHash", "role"],
      properties: {
        userId: { bsonType: "string" },
        name: { bsonType: "string" },
        email: { bsonType: "string", pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" },
        passwordHash: { bsonType: "string" },
        role: { enum: ["patient", "doctor", "admin", "billing"] },
        isActive: { bsonType: "bool" },
        emailVerified: { bsonType: "bool" }
      }
    }
  }
});

// Create default admin user
db.users.insertOne({
  userId: "550e8400-e29b-41d4-a716-446655440000",
  name: "System Administrator",
  email: "admin@clinicalapp.com",
  passwordHash: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LetvU7g.w.x8xgK8G", // password: admin123
  role: "admin",
  isActive: true,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create all indexes (run the index creation commands from above)
// ...

console.log("MongoDB database initialization complete!");
```
