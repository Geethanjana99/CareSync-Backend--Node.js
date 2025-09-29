const express = require('express');
const { body } = require('express-validator');
const PatientHealthDataController = require('../controllers/patientHealthPredictionController');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply patient-only authorization to all routes
router.use(authorize(['patient']));

// ===================================================================
// VALIDATION RULES
// ===================================================================

const healthDataValidation = [
  body('pregnancies')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Pregnancies must be a valid number between 0 and 20'),
  
  body('glucose')
    .isFloat({ min: 40, max: 300 })
    .withMessage('Glucose level must be between 40 and 300 mg/dL'),
  
  body('bmi')
    .isFloat({ min: 10, max: 60 })
    .withMessage('BMI must be between 10 and 60'),
  
  body('age')
    .isInt({ min: 16, max: 120 })
    .withMessage('Age must be between 16 and 120 years'),
  
  body('insulin')
    .optional()
    .isFloat({ min: 0, max: 300 })
    .withMessage('Insulin level must be between 0 and 300'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

// ===================================================================
// PATIENT HEALTH DATA ROUTES
// ===================================================================

/**
 * @route   POST /api/patient/health-predictions
 * @desc    Submit health data for admin processing (no direct AI prediction)
 * @access  Private (Patient only)
 */
router.post('/', healthDataValidation, PatientHealthDataController.submitHealthData);

/**
 * @route   GET /api/patient/health-predictions
 * @desc    Get health submissions and doctor recommendations for logged-in patient
 * @access  Private (Patient only)
 */
router.get('/', PatientHealthDataController.getHealthSubmissions);

/**
 * @route   GET /api/patient/health-predictions/dashboard
 * @desc    Get health dashboard data for logged-in patient
 * @access  Private (Patient only)
 */
router.get('/dashboard', PatientHealthDataController.getHealthDashboard);

/**
 * @route   GET /api/patient/health-predictions/:id
 * @desc    Get single health submission with doctor recommendations for logged-in patient
 * @access  Private (Patient only)
 */
router.get('/:id', PatientHealthDataController.getHealthSubmissionById);

module.exports = router;
