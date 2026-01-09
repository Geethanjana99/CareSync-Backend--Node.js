const express = require('express');
const router = express.Router();
const multer = require('multer');
const AdminReportsController = require('../controllers/adminReportsController');
const auth = require('../middleware/auth');
const { body, query, param } = require('express-validator');

// All routes require admin authentication
router.use(auth.authMiddleware);
router.use(auth.authorize(['admin']));

// ===================================================================
// DIABETES PREDICTION ROUTES
// ===================================================================

/**
 * @route   POST /api/admin/reports/diabetes-predictions
 * @desc    Create diabetes prediction
 * @access  Admin
 */
router.post('/diabetes-predictions', [
  body('patientId')
    .notEmpty()
    .isLength({ min: 1, max: 50 })
    .withMessage('Valid patient ID is required'),
  body('glucose')
    .isFloat({ min: 0, max: 300 })
    .withMessage('Glucose must be between 0 and 300 mg/dL'),
  body('bmi')
    .isFloat({ min: 10.0, max: 70.0 })
    .withMessage('BMI must be between 10.0 and 70.0'),
  body('age')
    .isInt({ min: 1, max: 120 })
    .withMessage('Age must be between 1 and 120 years'),
  body('pregnancies')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Pregnancies must be between 0 and 20'),
  body('insulin')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Insulin must be between 0 and 1000 μU/mL'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
], AdminReportsController.createDiabetesPrediction);

/**
 * @route   GET /api/admin/reports/diabetes-predictions
 * @desc    Get diabetes predictions with filtering and pagination
 * @access  Admin
 */
router.get('/diabetes-predictions', [
  query('patientId')
    .optional()
    .isUUID()
    .withMessage('Valid patient ID required'),
  query('status')
    .optional()
    .isIn(['pending', 'processed', 'reviewed'])
    .withMessage('Status must be pending, processed, or reviewed'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['created_at', 'updated_at', 'prediction_result', 'prediction_probability'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC')
], AdminReportsController.getDiabetesPredictions);

/**
 * @route   GET /api/admin/reports/diabetes-predictions/:id
 * @desc    Get single diabetes prediction
 * @access  Admin
 */
router.get('/diabetes-predictions/:id', [
  param('id')
    .isUUID()
    .withMessage('Valid prediction ID required')
], AdminReportsController.getDiabetesPredictionById);

/**
 * @route   PATCH /api/admin/reports/diabetes-predictions/:id
 * @desc    Update diabetes prediction
 * @access  Admin
 */
router.patch('/diabetes-predictions/:id', [
  param('id')
    .isUUID()
    .withMessage('Valid prediction ID required'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['pending', 'processed', 'reviewed'])
    .withMessage('Status must be pending, processed, or reviewed')
], AdminReportsController.updateDiabetesPrediction);

/**
 * @route   POST /api/admin/reports/diabetes-predictions/:id/retry
 * @desc    Retry diabetes prediction processing
 * @access  Admin
 */
router.post('/diabetes-predictions/:id/retry', [
  param('id')
    .isUUID()
    .withMessage('Valid prediction ID required')
], AdminReportsController.retryDiabetesPrediction);

// ===================================================================
// MEDICAL REPORTS UPLOAD ROUTES
// ===================================================================

/**
 * @route   POST /api/admin/reports/medical-reports
 * @desc    Upload medical reports (PDFs and images)
 * @access  Admin
 */
router.post('/medical-reports', 
  AdminReportsController.getUploadMiddleware().array('reports', 10), // Allow up to 10 files
  [
    body('patientId')
      .isUUID()
      .withMessage('Valid patient ID is required'),
    body('reportType')
      .isIn(['blood_test', 'urine_test', 'x_ray', 'mri', 'ct_scan', 'ultrasound', 'ecg', 'prescription', 'discharge_summary', 'lab_report', 'other'])
      .withMessage('Valid report type is required'),
    body('title')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('Title must be between 1 and 255 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('tags')
      .optional()
      .custom((value) => {
        try {
          const tags = JSON.parse(value);
          if (!Array.isArray(tags)) throw new Error();
          return true;
        } catch {
          throw new Error('Tags must be a valid JSON array');
        }
      }),
    body('isConfidential')
      .optional()
      .isBoolean()
      .withMessage('isConfidential must be a boolean'),
    body('expiryDate')
      .optional()
      .isISO8601()
      .withMessage('Expiry date must be a valid date'),
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters')
  ], 
  AdminReportsController.uploadMedicalReports
);

/**
 * @route   GET /api/admin/reports/medical-reports
 * @desc    Get medical reports with filtering and pagination
 * @access  Admin
 */
router.get('/medical-reports', [
  query('patientId')
    .optional()
    .isUUID()
    .withMessage('Valid patient ID required'),
  query('reportType')
    .optional()
    .isIn(['blood_test', 'urine_test', 'x_ray', 'mri', 'ct_scan', 'ultrasound', 'ecg', 'prescription', 'discharge_summary', 'lab_report', 'other'])
    .withMessage('Valid report type required'),
  query('status')
    .optional()
    .isIn(['uploaded', 'processing', 'processed', 'reviewed', 'archived'])
    .withMessage('Valid status required'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('sortBy')
    .optional()
    .isIn(['created_at', 'updated_at', 'title', 'file_size', 'report_type'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC')
], AdminReportsController.getMedicalReports);

/**
 * @route   GET /api/admin/reports/medical-reports/:id/download
 * @desc    Download medical report file
 * @access  Admin
 */
router.get('/medical-reports/:id/download', [
  param('id')
    .isUUID()
    .withMessage('Valid report ID required')
], AdminReportsController.downloadMedicalReport);

/**
 * @route   DELETE /api/admin/reports/medical-reports/:id
 * @desc    Delete medical report
 * @access  Admin
 */
router.delete('/medical-reports/:id', [
  param('id')
    .isUUID()
    .withMessage('Valid report ID required')
], AdminReportsController.deleteMedicalReport);

// ===================================================================
// DASHBOARD AND UTILITY ROUTES
// ===================================================================

/**
 * @route   GET /api/admin/reports/dashboard
 * @desc    Get reports dashboard statistics
 * @access  Admin
 */
router.get('/dashboard', [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
], AdminReportsController.getReportsDashboard);

/**
 * @route   GET /api/admin/reports/patients
 * @desc    Get patients list for dropdowns
 * @access  Admin
 */
router.get('/patients', AdminReportsController.getPatientsList);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed per upload.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;
