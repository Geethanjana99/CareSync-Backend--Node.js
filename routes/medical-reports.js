const express = require('express');
const router = express.Router();
const MedicalReportController = require('../controllers/medicalReportController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth.authMiddleware);

// Upload medical report
router.post('/upload', 
  MedicalReportController.uploadFile,
  MedicalReportController.uploadReport
);

// Get medical reports
router.get('/', MedicalReportController.getReports);
router.get('/:reportId', MedicalReportController.getReport);

// Download report file
router.get('/:reportId/download', MedicalReportController.downloadReport);

// Update report status (doctors and admins only)
router.patch('/:reportId/status', 
  auth.authorize(['doctor', 'admin']),
  MedicalReportController.updateReportStatus
);

// AI analysis (placeholder for future implementation)
router.get('/:reportId/ai-analysis', MedicalReportController.getAIAnalysis);

// Delete report
router.delete('/:reportId', MedicalReportController.deleteReport);

module.exports = router;
