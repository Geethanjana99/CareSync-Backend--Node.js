const express = require('express');
const { body } = require('express-validator');
const AdminHealthPredictionController = require('../controllers/adminHealthPredictionController');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply admin-only authorization to all routes
router.use(authorize(['admin']));

// ===================================================================
// VALIDATION RULES
// ===================================================================

const batchProcessValidation = [
  body('submissionIds')
    .isArray({ min: 1 })
    .withMessage('Please provide an array of submission IDs')
    .custom((value) => {
      if (!value.every(id => typeof id === 'string' && id.length > 0)) {
        throw new Error('All submission IDs must be valid strings');
      }
      return true;
    })
];

// ===================================================================
// ADMIN HEALTH PREDICTION ROUTES
// ===================================================================

/**
 * @route   GET /api/admin/health-predictions
 * @desc    Get all patient health data submissions for admin processing
 * @access  Private (Admin only)
 * @query   page, limit, status (pending|processing|processed|failed|all)
 */
router.get('/', AdminHealthPredictionController.getPatientSubmissions);

/**
 * @route   GET /api/admin/health-predictions/dashboard
 * @desc    Get admin dashboard with submission statistics and trends
 * @access  Private (Admin only)
 */
router.get('/dashboard', AdminHealthPredictionController.getAdminDashboard);

/**
 * @route   GET /api/admin/health-predictions/:id
 * @desc    Get single patient submission with full details
 * @access  Private (Admin only)
 */
router.get('/:id', AdminHealthPredictionController.getPatientSubmissionById);

/**
 * @route   POST /api/admin/health-predictions/:id/process
 * @desc    Process patient submission with AI prediction and save results
 * @access  Private (Admin only)
 */
router.post('/:id/process', AdminHealthPredictionController.processPatientSubmission);

/**
 * @route   POST /api/admin/health-predictions/batch-process
 * @desc    Process multiple patient submissions in batch
 * @access  Private (Admin only)
 */
router.post('/batch-process', batchProcessValidation, AdminHealthPredictionController.batchProcessSubmissions);

module.exports = router;