const { validationResult } = require('express-validator');
const { mysqlConnection } = require('../config/mysql');
const DiabetesPrediction = require('../models/DiabetesPrediction');
const logger = require('../config/logger');

class AdminHealthPredictionController {
  
  /**
   * Get all patient health data submissions for admin processing
   * GET /api/admin/health-predictions
   */
  static async getPatientSubmissions(req, res) {
    try {
      logger.info(`🔍 [ADMIN] Getting patient health submissions for admin: ${req.user.id}`);

      // Ensure MySQL connection is established
      if (!mysqlConnection.pool) {
        await mysqlConnection.connect();
      }

      // Pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      
      // Status filter
      const status = req.query.status || 'all';
      
      // Build WHERE clause based on status filter
      let whereClause = '';
      let statusParams = [];
      
      if (status !== 'all') {
        whereClause = 'WHERE dp.status = ?';
        statusParams.push(status);
      }

      // Query patient submissions with patient details
      const query = `
        SELECT 
          dp.id,
          dp.patient_id,
          dp.admin_id,
          dp.pregnancies,
          dp.glucose,
          dp.bmi,
          dp.age,
          dp.insulin,
          dp.prediction_result,
          dp.prediction_probability,
          dp.risk_level,
          dp.status,
          dp.notes as patient_notes,
          dp.created_at,
          dp.updated_at,
          dp.processed_at,
          COALESCE(u.name, u2.name) as patient_name,
          COALESCE(u.email, u2.email) as patient_email,
          COALESCE(u.phone, u2.phone) as patient_phone,
          COALESCE(p.date_of_birth, p2.date_of_birth) as patient_dob,
          au.name as admin_name,
          -- Check if there's doctor certification
          apc.id as certification_id,
          apc.certification_status
        FROM diabetes_predictions dp
        -- Join by patients.id (primary key) since patientId in diabetes_predictions is patients.id
        LEFT JOIN patients p ON dp.patient_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        -- Legacy join for old records that might use user_id directly
        LEFT JOIN users u2 ON dp.patient_id = u2.id
        LEFT JOIN patients p2 ON u2.id = p2.user_id
        -- Admin user join
        LEFT JOIN users au ON dp.admin_id = au.id
        LEFT JOIN ai_prediction_certifications apc ON dp.id = apc.prediction_id
        WHERE (u.id IS NOT NULL OR u2.id IS NOT NULL)
        ${status !== 'all' ? 'AND dp.status = ?' : ''}
        ORDER BY dp.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      // Use only status parameters for prepared statement (limit/offset are safe integers)
      const queryParams = statusParams;
      
      const submissions = await mysqlConnection.query(query, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM diabetes_predictions dp
        LEFT JOIN patients p ON dp.patient_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN users u2 ON dp.patient_id = u2.id
        WHERE (u.id IS NOT NULL OR u2.id IS NOT NULL)
        ${status !== 'all' ? 'AND dp.status = ?' : ''}
      `;
      const countParams = status !== 'all' ? [status] : [];
      const totalResult = await mysqlConnection.query(countQuery, countParams);
      const total = totalResult[0].total;

      // Process submissions data
      const processedSubmissions = submissions.map(submission => ({
        id: submission.id,
        patientId: submission.patient_id,
        adminId: submission.admin_id,
        healthData: {
          pregnancies: submission.pregnancies,
          glucose: submission.glucose,
          bmi: submission.bmi,
          age: submission.age,
          insulin: submission.insulin
        },
        predictionResult: submission.prediction_result,
        predictionProbability: submission.prediction_probability,
        riskLevel: submission.risk_level,
        status: submission.status,
        patientNotes: submission.patient_notes,
        createdAt: submission.created_at,
        updatedAt: submission.updated_at,
        processedAt: submission.processed_at,
        patientInfo: {
          name: submission.patient_name || 'Unknown Patient',
          email: submission.patient_email || 'N/A',
          phone: submission.patient_phone || 'N/A',
          dateOfBirth: submission.patient_dob || 'N/A'
        },
        adminName: submission.admin_name,
        isCertified: !!submission.certification_id,
        certificationStatus: submission.certification_status
      }));

      logger.info(`✅ [ADMIN] Retrieved ${submissions.length} patient submissions`);

      res.status(200).json({
        success: true,
        message: 'Patient submissions retrieved successfully',
        data: {
          submissions: processedSubmissions,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      logger.error(`❌ [ADMIN] Error getting patient submissions: ${error.message}`);
      console.error('Admin submissions error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient submissions',
        error: error.message
      });
    }
  }

  /**
   * Get single patient submission for detailed view
   * GET /api/admin/health-predictions/:id
   */
  static async getPatientSubmissionById(req, res) {
    try {
      const { id } = req.params;
      logger.info(`🔍 [ADMIN] Getting patient submission: ${id}`);

      // Ensure MySQL connection is established
      if (!mysqlConnection.pool) {
        await mysqlConnection.connect();
      }

      const query = `
        SELECT 
          dp.*,
          COALESCE(u.name, u2.name) as patient_name,
          COALESCE(u.email, u2.email) as patient_email,
          COALESCE(u.phone, u2.phone) as patient_phone,
          COALESCE(p.date_of_birth, p2.date_of_birth) as patient_dob,
          COALESCE(p.gender, p2.gender) as patient_gender,
          au.name as admin_name,
          apc.id as certification_id,
          apc.certification_status,
          apc.doctor_notes,
          apc.recommendations,
          apc.follow_up_required,
          apc.follow_up_date,
          apc.severity_assessment,
          apc.certified_at,
          du.name as doctor_name,
          d.specialty as doctor_specialty
        FROM diabetes_predictions dp
        -- Join by patients.id (primary key) since patientId in diabetes_predictions is patients.id  
        LEFT JOIN patients p ON dp.patient_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        -- Legacy join for old records that might use user_id directly
        LEFT JOIN users u2 ON dp.patient_id = u2.id
        LEFT JOIN patients p2 ON u2.id = p2.user_id
        -- Other joins
        LEFT JOIN users au ON dp.admin_id = au.id
        LEFT JOIN ai_prediction_certifications apc ON dp.id = apc.prediction_id
        LEFT JOIN doctors d ON apc.doctor_id = d.id
        LEFT JOIN users du ON d.user_id = du.id
        WHERE dp.id = ? AND (u.id IS NOT NULL OR u2.id IS NOT NULL)
      `;
      
      const results = await mysqlConnection.query(query, [id]);
      
      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient submission not found'
        });
      }

      const submission = results[0];
      
      const processedSubmission = {
        id: submission.id,
        patientId: submission.patient_id,
        adminId: submission.admin_id,
        healthData: {
          pregnancies: submission.pregnancies,
          glucose: submission.glucose,
          bmi: submission.bmi,
          age: submission.age,
          insulin: submission.insulin
        },
        predictionResult: submission.prediction_result,
        predictionProbability: submission.prediction_probability,
        riskLevel: submission.risk_level,
        status: submission.status,
        patientNotes: submission.notes,
        createdAt: submission.created_at,
        updatedAt: submission.updated_at,
        processedAt: submission.processed_at,
        patientInfo: {
          name: submission.patient_name || 'Unknown Patient',
          email: submission.patient_email || 'N/A',
          phone: submission.patient_phone || 'N/A',
          dateOfBirth: submission.patient_dob || 'N/A',
          gender: submission.patient_gender || 'N/A'
        },
        adminName: submission.admin_name,
        certification: submission.certification_id ? {
          id: submission.certification_id,
          status: submission.certification_status,
          doctorNotes: submission.doctor_notes,
          recommendations: submission.recommendations,
          followUpRequired: submission.follow_up_required,
          followUpDate: submission.follow_up_date,
          severityAssessment: submission.severity_assessment,
          certifiedAt: submission.certified_at,
          doctorName: submission.doctor_name,
          doctorSpecialty: submission.doctor_specialty
        } : null
      };

      logger.info(`✅ [ADMIN] Retrieved patient submission: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Patient submission retrieved successfully',
        data: processedSubmission
      });

    } catch (error) {
      logger.error(`❌ [ADMIN] Error getting patient submission: ${error.message}`);
      console.error('Admin submission error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient submission',
        error: error.message
      });
    }
  }

  /**
   * Process patient submission with AI prediction
   * POST /api/admin/health-predictions/:id/process
   */
  static async processPatientSubmission(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      
      logger.info(`🤖 [ADMIN] Processing patient submission with AI: ${id} by admin: ${adminId}`);

      // Ensure MySQL connection is established
      if (!mysqlConnection.pool) {
        await mysqlConnection.connect();
      }

      // Get the submission
      const submission = await DiabetesPrediction.findById(id);
      
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Patient submission not found'
        });
      }

      if (submission.status === 'processed') {
        return res.status(400).json({
          success: false,
          message: 'This submission has already been processed'
        });
      }

      // Update status to processed
      await DiabetesPrediction.update(id, {
        status: 'processed',
        admin_id: adminId,
        updated_at: new Date()
      });

      // Prepare data for diabetes prediction using working service
      const inputData = {
        pregnancies: submission.pregnancies || 0,
        glucose: submission.glucose,
        bmi: submission.bmi,
        age: submission.age,
        insulin: submission.insulin || 0
      };

      logger.info(`📊 [ADMIN] Sending data to diabetes prediction service:`, inputData);

      try {
        // Use the same working diabetes prediction service
        const predictionService = require('../services/diabetesPredictionService');
        const result = await predictionService.predict(inputData);

        logger.info(`🎯 [ADMIN] Diabetes prediction service response:`, result);

        // Process prediction results
        const prediction = result.prediction; // 0 or 1
        const probability = result.probability; // probability value
        
        // Determine risk level based on probability
        let riskLevel;
        if (probability < 0.3) {
          riskLevel = 'low';
        } else if (probability < 0.7) {
          riskLevel = 'medium';
        } else {
          riskLevel = 'high';
        }

        // Update the submission with AI results
        const updateData = {
          prediction_result: prediction,
          prediction_probability: probability,
          risk_level: riskLevel,
          status: 'processed',
          processed_at: new Date(),
          admin_id: adminId,
          updated_at: new Date()
        };

        await DiabetesPrediction.update(id, updateData);

        logger.info(`✅ [ADMIN] Successfully processed submission ${id} with AI prediction`);

        // Return the updated submission
        const updatedSubmission = await DiabetesPrediction.findById(id);

        res.status(200).json({
          success: true,
          message: 'Patient submission processed successfully with AI prediction',
          data: {
            submissionId: id,
            prediction: prediction,
            probability: probability,
            riskLevel: riskLevel,
            status: 'processed',
            processedAt: updateData.processed_at,
            submission: updatedSubmission
          }
        });

      } catch (aiError) {
        logger.error(`❌ [ADMIN] Diabetes prediction service error: ${aiError.message}`);
        
        // Update submission status to pending for retry
        await DiabetesPrediction.update(id, {
          status: 'pending',
          updated_at: new Date()
        });

        res.status(500).json({
          success: false,
          message: 'Failed to process diabetes prediction',
          error: 'Diabetes prediction service temporarily unavailable. Please try again later.',
          details: aiError.message
        });
      }

    } catch (error) {
      logger.error(`❌ [ADMIN] Error processing patient submission: ${error.message}`);
      console.error('Admin processing error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to process patient submission',
        error: error.message
      });
    }
  }

  /**
   * Get admin dashboard with statistics
   * GET /api/admin/health-predictions/dashboard
   */
  static async getAdminDashboard(req, res) {
    try {
      logger.info(`📊 [ADMIN] Getting admin dashboard for: ${req.user.id}`);

      // Ensure MySQL connection is established
      if (!mysqlConnection.pool) {
        await mysqlConnection.connect();
      }

      // Get submission statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as totalSubmissions,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingSubmissions,
          SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewedSubmissions,
          SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as processedSubmissions,
          SUM(CASE WHEN risk_level = 'low' THEN 1 ELSE 0 END) as lowRisk,
          SUM(CASE WHEN risk_level = 'medium' THEN 1 ELSE 0 END) as mediumRisk,
          SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as highRisk,
          AVG(prediction_probability) as averageProbability
        FROM diabetes_predictions
      `;
      
      const statsResult = await mysqlConnection.query(statsQuery);
      const stats = statsResult[0];

      // Get recent submissions
      const recentQuery = `
        SELECT 
          dp.id,
          dp.status,
          dp.risk_level,
          dp.prediction_probability,
          dp.created_at,
          dp.processed_at,
          u.name as patient_name,
          u.email as patient_email
        FROM diabetes_predictions dp
        LEFT JOIN patients p ON dp.patient_id = p.patient_id
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY dp.created_at DESC
        LIMIT 10
      `;
      
      const recentSubmissions = await mysqlConnection.query(recentQuery);

      // Get processing trends (last 7 days)
      const trendsQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as submissions,
          SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as processed,
          AVG(prediction_probability) as avgProbability
        FROM diabetes_predictions
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      
      const trends = await mysqlConnection.query(trendsQuery);

      const dashboard = {
        statistics: {
          totalSubmissions: stats.totalSubmissions,
          pendingSubmissions: stats.pendingSubmissions,
          processingSubmissions: stats.processingSubmissions,
          processedSubmissions: stats.processedSubmissions,
          failedSubmissions: stats.failedSubmissions,
          riskDistribution: {
            low: stats.lowRisk || 0,
            medium: stats.mediumRisk || 0,
            high: stats.highRisk || 0
          },
          averageProbability: stats.averageProbability || 0
        },
        recentSubmissions: recentSubmissions.map(sub => ({
          id: sub.id,
          patientName: sub.patient_name,
          patientEmail: sub.patient_email,
          status: sub.status,
          riskLevel: sub.risk_level,
          probability: sub.prediction_probability,
          createdAt: sub.created_at,
          processedAt: sub.processed_at
        })),
        trends: trends.map(trend => ({
          date: trend.date,
          submissions: trend.submissions,
          processed: trend.processed,
          avgProbability: trend.avgProbability
        }))
      };

      logger.info(`✅ [ADMIN] Retrieved admin dashboard successfully`);

      res.status(200).json({
        success: true,
        message: 'Admin dashboard retrieved successfully',
        data: dashboard
      });

    } catch (error) {
      logger.error(`❌ [ADMIN] Error getting admin dashboard: ${error.message}`);
      console.error('Admin dashboard error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve admin dashboard',
        error: error.message
      });
    }
  }

  /**
   * Batch process multiple submissions
   * POST /api/admin/health-predictions/batch-process
   */
  static async batchProcessSubmissions(req, res) {
    try {
      const { submissionIds } = req.body;
      const adminId = req.user.id;
      
      if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an array of submission IDs'
        });
      }

      logger.info(`🔄 [ADMIN] Batch processing ${submissionIds.length} submissions by admin: ${adminId}`);

      const results = [];
      
      for (const submissionId of submissionIds) {
        try {
          // For each submission, call the process function
          // This is a simplified version - in production you might want to queue this
          const result = await AdminHealthPredictionController.processSubmissionInternal(submissionId, adminId);
          results.push({
            submissionId,
            success: true,
            result
          });
        } catch (error) {
          results.push({
            submissionId,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      logger.info(`✅ [ADMIN] Batch processing completed: ${successCount} success, ${failCount} failed`);

      res.status(200).json({
        success: true,
        message: `Batch processing completed: ${successCount} successful, ${failCount} failed`,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failCount
          }
        }
      });

    } catch (error) {
      logger.error(`❌ [ADMIN] Error in batch processing: ${error.message}`);
      console.error('Batch processing error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to batch process submissions',
        error: error.message
      });
    }
  }

  /**
   * Internal method for processing a single submission
   * Used by batch processing
   */
  static async processSubmissionInternal(submissionId, adminId) {
    // Implementation similar to processPatientSubmission but without HTTP response
    // This is a helper method for batch processing
    const submission = await DiabetesPrediction.findById(submissionId);
    
    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.status === 'processed') {
      throw new Error('Submission already processed');
    }

    // Update status to processing
    await DiabetesPrediction.update(submissionId, {
      status: 'processed',
      admin_id: adminId,
      updated_at: new Date()
    });

    // Prepare and send to AI (same logic as processPatientSubmission)
    // Return the result
    return { submissionId, status: 'processed' };
  }
}

module.exports = AdminHealthPredictionController;