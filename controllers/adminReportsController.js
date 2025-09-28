const DiabetesPrediction = require('../models/DiabetesPrediction');
const AdminMedicalReport = require('../models/AdminMedicalReport');
const { mysqlConnection } = require('../config/mysql');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { validationResult } = require('express-validator');

/**
 * Admin Reports Controller
 * Handles diabetes predictions and PDF report uploads
 */
class AdminReportsController {
  
  // ===================================================================
  // DIABETES PREDICTION METHODS
  // ===================================================================
  
  /**
   * Create diabetes prediction
   */
  static async createDiabetesPrediction(req, res) {
    try {
      console.log('🔍 [DEBUG] Starting createDiabetesPrediction');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Request user:', req.user ? { id: req.user.id, role: req.user.role } : 'NO USER');
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ [DEBUG] Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        patientId,
        pregnancies,
        glucose,
        bmi,
        age,
        insulin,
        notes
      } = req.body;

      console.log('🔍 [DEBUG] Checking patient exists:', patientId);

      // Verify patient exists - search by patient_id field
      const patientQuery = 'SELECT * FROM patients WHERE patient_id = ?';
      const patients = await mysqlConnection.query(patientQuery, [patientId]);
      if (patients.length === 0) {
        console.log('❌ [DEBUG] Patient not found:', patientId);
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }
      const patient = patients[0];
      console.log('✅ [DEBUG] Patient found:', patient.id);

      console.log('🔍 [DEBUG] Creating prediction record...');

      // Create prediction record
      const prediction = await DiabetesPrediction.create({
        patientId,
        adminId: req.user.id,
        pregnancies: pregnancies || 0,
        glucose,
        bmi,
        age,
        insulin: insulin || 0,
        notes,
        status: 'pending'
      });

      console.log('✅ [DEBUG] Prediction record created:', prediction.id);

      // Call the prediction model
      try {
        console.log('🔍 [DEBUG] Calling prediction model...');
        const predictionResult = await prediction.callPredictionModel();
        console.log('✅ [DEBUG] Prediction model result:', predictionResult);
        
        // Update prediction with results
        await prediction.update({
          predictionResult: predictionResult.prediction,
          predictionProbability: predictionResult.probability,
          riskLevel: predictionResult.riskLevel,
          status: 'processed',
          processedAt: new Date()
        });

        console.log('✅ [DEBUG] Prediction updated with results');

        // Reload with updated data
        await prediction.reload();

        // Generate Streamlit URL with pre-filled parameters
        const streamlitUrl = AdminReportsController.generateStreamlitUrl({
          pregnancies: prediction.pregnancies,
          glucose: prediction.glucose,
          bmi: prediction.bmi,
          age: prediction.age,
          insulin: prediction.insulin
        });

        console.log('✅ [DEBUG] Generated Streamlit URL:', streamlitUrl);

        res.status(201).json({
          success: true,
          message: 'Diabetes prediction created successfully',
          data: {
            prediction: prediction.toJSON(),
            summary: prediction.getResultSummary(),
            streamlitUrl: streamlitUrl,
            actions: {
              viewDetails: {
                url: streamlitUrl,
                label: 'View Detailed Analysis',
                description: 'Open interactive analysis in Streamlit with your input parameters'
              },
              retryPrediction: {
                endpoint: `/api/admin/reports/diabetes-predictions/${prediction.id}/retry`,
                method: 'POST',
                label: 'Retry Prediction',
                description: 'Retry prediction processing if needed'
              }
            }
          }
        });

      } catch (predictionError) {
        console.error('Prediction model error:', predictionError);
        
        // Update status to indicate processing failed
        await prediction.update({
          status: 'pending',
          notes: (notes || '') + `\n\nPrediction Error: ${predictionError.message}`
        });

        // Generate Streamlit URL even for failed predictions
        const streamlitUrl = AdminReportsController.generateStreamlitUrl({
          pregnancies: prediction.pregnancies,
          glucose: prediction.glucose,
          bmi: prediction.bmi,
          age: prediction.age,
          insulin: prediction.insulin
        });

        res.status(201).json({
          success: true,
          message: 'Diabetes prediction record created, but model prediction failed. Please retry processing.',
          data: {
            prediction: prediction.toJSON(),
            error: 'Prediction model temporarily unavailable',
            streamlitUrl: streamlitUrl,
            actions: {
              viewDetails: {
                url: streamlitUrl,
                label: 'View Manual Analysis',
                description: 'Open Streamlit for manual analysis with your input parameters'
              },
              retryPrediction: {
                endpoint: `/api/admin/reports/diabetes-predictions/${prediction.id}/retry`,
                method: 'POST',
                label: 'Retry Prediction',
                description: 'Retry automatic prediction processing'
              }
            }
          }
        });
      }

    } catch (error) {
      console.error('❌ [DEBUG] Error creating diabetes prediction:', error);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      console.error('❌ [DEBUG] Error name:', error.name);
      console.error('❌ [DEBUG] Error message:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Failed to create diabetes prediction',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get diabetes predictions
   */
  static async getDiabetesPredictions(req, res) {
    try {
      const { 
        patientId, 
        status, 
        page = 1, 
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Validate sortBy to prevent SQL injection
      const allowedSortColumns = ['created_at', 'updated_at', 'patient_id', 'status', 'glucose', 'bmi', 'age'];
      const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
      
      // Validate sortOrder to prevent SQL injection
      const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
      
      // Build WHERE clause
      let whereClause = '1=1';
      const params = [];
      
      if (patientId) {
        whereClause += ' AND dp.patient_id = ?';
        params.push(patientId);
      }
      
      if (status) {
        whereClause += ' AND dp.status = ?';
        params.push(status);
      }

      // Query with JOIN to get patient names from users table
      const query = `
        SELECT 
          dp.id,
          dp.patient_id,
          dp.pregnancies,
          dp.glucose,
          dp.bmi,
          dp.age,
          dp.insulin,
          dp.prediction_result,
          dp.prediction_probability,
          dp.risk_level,
          dp.status,
          dp.notes,
          dp.created_at,
          dp.updated_at,
          dp.processed_at,
          u.name as patient_name,
          u.email as patient_email
        FROM diabetes_predictions dp
        LEFT JOIN patients p ON dp.patient_id = p.patient_id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE ${whereClause}
        ORDER BY dp.${validSortBy} ${validSortOrder}
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;
      
      // Remove LIMIT and OFFSET from params since we're using direct values
      const queryParams = params.slice(0, -2);
      
      const predictions = await mysqlConnection.query(query, queryParams);
      
      // Get total count - rebuild the query with proper parameters
      let countWhereClause = '1=1';
      const countParams = [];
      
      if (patientId) {
        countWhereClause += ' AND dp.patient_id = ?';
        countParams.push(patientId);
      }
      
      if (status) {
        countWhereClause += ' AND dp.status = ?';
        countParams.push(status);
      }
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM diabetes_predictions dp
        LEFT JOIN patients p ON dp.patient_id = p.patient_id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE ${countWhereClause}
      `;
      
      const countResult = await mysqlConnection.query(countQuery, countParams);
      const total = countResult[0].total;

      // Transform results to include patient names
      const transformedPredictions = predictions.map(prediction => ({
        id: prediction.id,
        patientId: prediction.patient_id,
        patientName: prediction.patient_name || `Patient ${prediction.patient_id}`,
        patientEmail: prediction.patient_email,
        pregnancies: prediction.pregnancies,
        glucose: prediction.glucose,
        bmi: prediction.bmi,
        age: prediction.age,
        insulin: prediction.insulin,
        predictionResult: prediction.prediction_result,
        predictionProbability: prediction.prediction_probability,
        riskLevel: prediction.risk_level,
        status: prediction.status,
        notes: prediction.notes,
        createdAt: prediction.created_at,
        updatedAt: prediction.updated_at,
        processedAt: prediction.processed_at
      }));

      res.json({
        success: true,
        data: {
          predictions: transformedPredictions,
          pagination: {
            total: total,
            pages: Math.ceil(total / limit),
            page: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching diabetes predictions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch diabetes predictions',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get single diabetes prediction
   */
  static async getDiabetesPredictionById(req, res) {
    try {
      const { id } = req.params;

  const prediction = await DiabetesPrediction.findByPk(id);

      if (!prediction) {
        return res.status(404).json({
          success: false,
          message: 'Diabetes prediction not found'
        });
      }

      res.json({
        success: true,
        data: { prediction }
      });

    } catch (error) {
      console.error('Error fetching diabetes prediction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch diabetes prediction',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Update diabetes prediction
   */
  static async updateDiabetesPrediction(req, res) {
    try {
      const { id } = req.params;
      const { notes, status } = req.body;

      const prediction = await DiabetesPrediction.findByPk(id);
      if (!prediction) {
        return res.status(404).json({
          success: false,
          message: 'Diabetes prediction not found'
        });
      }

      await prediction.update({
        notes,
        status,
        ...(status === 'reviewed' && { reviewedAt: new Date() })
      });

      res.json({
        success: true,
        message: 'Diabetes prediction updated successfully',
        data: { prediction }
      });

    } catch (error) {
      console.error('Error updating diabetes prediction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update diabetes prediction',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Retry diabetes prediction processing
   */
  static async retryDiabetesPrediction(req, res) {
    try {
      const { id } = req.params;

      const prediction = await DiabetesPrediction.findByPk(id);
      if (!prediction) {
        return res.status(404).json({
          success: false,
          message: 'Diabetes prediction not found'
        });
      }

      // Only allow retry for pending predictions
      if (prediction.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Can only retry predictions with pending status'
        });
      }

      try {
        // Attempt to call the prediction model again
        const predictionResult = await prediction.callPredictionModel();
        
        // Update prediction with results
        await prediction.update({
          predictionResult: predictionResult.prediction,
          predictionProbability: predictionResult.probability,
          riskLevel: predictionResult.riskLevel,
          status: 'processed',
          processedAt: new Date(),
          notes: (prediction.notes || '') + '\n\nRetry successful: ' + new Date().toISOString()
        });

        // Reload with updated data
        await prediction.reload();

        // Generate Streamlit URL for successful retry
        const streamlitUrl = AdminReportsController.generateStreamlitUrl({
          pregnancies: prediction.pregnancies,
          glucose: prediction.glucose,
          bmi: prediction.bmi,
          age: prediction.age,
          insulin: prediction.insulin
        });

        res.json({
          success: true,
          message: 'Diabetes prediction processed successfully',
          data: {
            prediction: prediction.toJSON(),
            summary: prediction.getResultSummary(),
            streamlitUrl: streamlitUrl,
            actions: {
              viewDetails: {
                url: streamlitUrl,
                label: 'View Detailed Analysis',
                description: 'Open interactive analysis in Streamlit with your input parameters'
              }
            }
          }
        });

      } catch (predictionError) {
        console.error('Retry prediction model error:', predictionError);
        
        // Update notes with retry attempt info
        await prediction.update({
          notes: (prediction.notes || '') + `\n\nRetry failed at ${new Date().toISOString()}: ${predictionError.message}`
        });

        res.status(422).json({
          success: false,
          message: 'Diabetes prediction retry failed. Please check model availability.',
          error: predictionError.message,
          data: { prediction: prediction.toJSON() }
        });
      }

    } catch (error) {
      console.error('Error retrying diabetes prediction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retry diabetes prediction',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ===================================================================
  // PDF REPORT UPLOAD METHODS
  // ===================================================================

  /**
   * Configure multer for file uploads
   */
  static getUploadMiddleware() {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'medical-reports');
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `report-${uniqueSuffix}${ext}`);
      }
    });

    const fileFilter = (req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
      }
    });
  }

  /**
   * Upload medical reports
   */
  static async uploadMedicalReports(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        patientId,
        reportType,
        title,
        description,
        tags,
        isConfidential,
        expiryDate,
        notes
      } = req.body;

      // Verify patient exists
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const uploadedReports = [];

      for (const file of req.files) {
        // Calculate file hash for integrity
        const fileBuffer = await fs.readFile(file.path);
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        const report = await AdminMedicalReport.create({
          patientId,
          adminId: req.user.id,
          reportType,
          title: title || file.originalname,
          description,
          fileName: file.filename,
          originalFileName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          fileHash,
          tags: tags ? JSON.parse(tags) : [],
          metadata: {
            uploadedBy: req.user.name,
            uploadedAt: new Date(),
            originalSize: file.size,
            encoding: file.encoding
          },
          isConfidential: isConfidential === 'true',
          expiryDate: expiryDate || null,
          notes,
          status: 'uploaded'
        });

        uploadedReports.push(report);
      }

      res.status(201).json({
        success: true,
        message: `${uploadedReports.length} report(s) uploaded successfully`,
        data: { reports: uploadedReports }
      });

    } catch (error) {
      console.error('Error uploading medical reports:', error);
      
      // Clean up uploaded files if database save failed
      if (req.files) {
        for (const file of req.files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Error deleting uploaded file:', unlinkError);
          }
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to upload medical reports',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get medical reports
   */
  static async getMedicalReports(req, res) {
    try {
      const {
        patientId,
        reportType,
        status,
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const searchParams = {};

      if (patientId) searchParams.patientId = patientId;
      if (reportType) searchParams.reportType = reportType;
      if (status) searchParams.status = status;
      if (search) searchParams.title = search;

      const reports = await AdminMedicalReport.searchReports(searchParams, {
        include: [
          {
            model: Patient,
            as: 'patient',
            include: [{
              model: User,
              as: 'user',
              attributes: ['name', 'email']
            }]
          },
          {
            model: User,
            as: 'admin',
            attributes: ['name', 'email']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder]]
      });

      const total = await AdminMedicalReport.count({
        where: searchParams
      });

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            total,
            pages: Math.ceil(total / limit),
            page: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching medical reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch medical reports',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Download medical report
   */
  static async downloadMedicalReport(req, res) {
    try {
      const { id } = req.params;

      const report = await AdminMedicalReport.findByPk(id);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Medical report not found'
        });
      }

      // Check file exists
      if (!(await report.fileExists())) {
        return res.status(404).json({
          success: false,
          message: 'Report file not found on server'
        });
      }

      // Set appropriate headers
      res.setHeader('Content-Disposition', `attachment; filename="${report.originalFileName}"`);
      res.setHeader('Content-Type', report.mimeType);

      // Stream the file
      const fs = require('fs');
      const fileStream = fs.createReadStream(report.filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Error downloading medical report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download medical report',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Delete medical report
   */
  static async deleteMedicalReport(req, res) {
    try {
      const { id } = req.params;

      const report = await AdminMedicalReport.findByPk(id);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Medical report not found'
        });
      }

      await report.destroy(); // This will trigger the beforeDestroy hook to delete the file

      res.json({
        success: true,
        message: 'Medical report deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting medical report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete medical report',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ===================================================================
  // STATISTICS AND DASHBOARD METHODS
  // ===================================================================

  /**
   * Get reports dashboard statistics
   */
  static async getReportsDashboard(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const dateRange = {};
      
      if (startDate) dateRange.startDate = new Date(startDate);
      if (endDate) dateRange.endDate = new Date(endDate);

      const [diabetesStats, reportsStats] = await Promise.all([
        DiabetesPrediction.getStatistics(dateRange),
        AdminMedicalReport.getStatistics(dateRange)
      ]);

      // Recent activities
      const recentPredictions = await DiabetesPrediction.findAll({
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: Patient,
            as: 'patient',
            include: [{
              model: User,
              as: 'user',
              attributes: ['name']
            }]
          }
        ]
      });

      const recentReports = await AdminMedicalReport.findAll({
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: Patient,
            as: 'patient',
            include: [{
              model: User,
              as: 'user',
              attributes: ['name']
            }]
          }
        ]
      });

      res.json({
        success: true,
        data: {
          statistics: {
            diabetesPredictions: diabetesStats,
            medicalReports: reportsStats
          },
          recentActivity: {
            predictions: recentPredictions,
            reports: recentReports
          }
        }
      });

    } catch (error) {
      console.error('Error fetching reports dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reports dashboard',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get patients list for dropdown
   */
  static async getPatientsList(req, res) {
    try {
      // Get all active patients with their user information
      const query = `
        SELECT 
          p.id,
          p.patient_id AS patientId,
          u.name,
          u.email
        FROM patients p
        INNER JOIN users u ON p.user_id = u.id
        WHERE u.is_active = 1 AND u.role = 'patient'
        ORDER BY u.name ASC
      `;
      
      const patients = await mysqlConnection.query(query);

      const patientsList = patients.map(patient => ({
        id: patient.id.toString(),
        patientId: patient.patientId,
        name: patient.name,
        email: patient.email
      }));

      res.json({
        success: true,
        data: { patients: patientsList }
      });

    } catch (error) {
      console.error('Error fetching patients list:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch patients list',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Generate Streamlit URL with pre-filled parameters
   */
  static generateStreamlitUrl(inputData) {
    const baseUrl = process.env.STREAMLIT_BASE_URL || 'http://localhost:8502';
    
    // Create URL parameters for Streamlit
    const params = new URLSearchParams({
      pregnancies: inputData.pregnancies || 0,
      glucose: inputData.glucose || 0,
      bmi: inputData.bmi || 0,
      age: inputData.age || 0,
      insulin: inputData.insulin || 0,
      auto_predict: 'true' // Flag to auto-run prediction
    });
    
    return `${baseUrl}/?${params.toString()}`;
  }
}

module.exports = AdminReportsController;
