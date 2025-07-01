const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const userValidation = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),    body('role')
      .isIn(['patient', 'doctor', 'admin', 'billing'])
      .withMessage('Invalid role specified'),
    body('phone')
      .optional()
      .matches(/^0\d{9}$/)
      .withMessage('Please provide a valid Sri Lankan phone number (10 digits starting with 0)'),
    handleValidationErrors
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    handleValidationErrors
  ]
};

const appointmentValidation = {
  create: [
    body('doctorId')
      .notEmpty()
      .withMessage('Doctor ID is required'),
    body('appointmentDate')
      .isISO8601()
      .withMessage('Valid appointment date is required'),
    body('appointmentTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid appointment time is required (HH:MM format)'),    body('appointmentType')
      .isIn(['consultation', 'follow-up', 'emergency', 'procedure'])
      .withMessage('Invalid appointment type'),
    body('reasonForVisit')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason for visit must not exceed 500 characters'),
    body('symptoms')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Symptoms must not exceed 1000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority level'),
    handleValidationErrors
  ],

  update: [
    body('status')
      .optional()
      .isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
      .withMessage('Invalid appointment status'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters'),
    handleValidationErrors
  ]
};

const patientValidation = {
  create: [
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Valid date of birth is required'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other'])
      .withMessage('Invalid gender'),
    body('height')
      .optional()
      .isFloat({ min: 50, max: 300 })
      .withMessage('Height must be between 50 and 300 cm'),
    body('weight')
      .optional()
      .isFloat({ min: 10, max: 500 })
      .withMessage('Weight must be between 10 and 500 kg'),
    body('bloodType')
      .optional()
      .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .withMessage('Invalid blood type'),
    handleValidationErrors
  ],

  update: [
    body('emergencyContactPhone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid emergency contact phone'),
    body('height')
      .optional()
      .isFloat({ min: 50, max: 300 })
      .withMessage('Height must be between 50 and 300 cm'),
    body('weight')
      .optional()
      .isFloat({ min: 10, max: 500 })
      .withMessage('Weight must be between 10 and 500 kg'),
    handleValidationErrors
  ]
};

const doctorValidation = {
  create: [
    body('specialty')
      .notEmpty()
      .withMessage('Specialty is required'),
    body('licenseNumber')
      .notEmpty()
      .withMessage('License number is required'),
    body('yearsOfExperience')
      .optional()
      .isInt({ min: 0, max: 60 })
      .withMessage('Years of experience must be between 0 and 60'),
    body('consultationFee')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Consultation fee must be a positive number'),
    handleValidationErrors
  ]
};

const billingValidation = {
  createInvoice: [
    body('patientId')
      .notEmpty()
      .withMessage('Patient ID is required'),
    body('doctorId')
      .notEmpty()
      .withMessage('Doctor ID is required'),
    body('totalAmount')
      .isFloat({ min: 0 })
      .withMessage('Total amount must be a positive number'),
    body('dueDate')
      .isISO8601()
      .withMessage('Valid due date is required'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one invoice item is required'),
    body('items.*.serviceType')
      .notEmpty()
      .withMessage('Service type is required for each item'),
    body('items.*.unitPrice')
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a positive number'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    handleValidationErrors
  ]
};

module.exports = {
  userValidation,
  appointmentValidation,
  patientValidation,
  doctorValidation,
  billingValidation,
  handleValidationErrors
};
