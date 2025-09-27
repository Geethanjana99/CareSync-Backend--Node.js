const DiabetesPrediction = require('../models/DiabetesPrediction');
const { mysqlConnection } = require('../config/mysql');
const { validationResult } = require('express-validator');

/**
 * Patient Health Data Submission Controller
 * Handles health data submissions for admin AI prediction processing
 */
class PatientHealthDataController {
  
  // ===================================================================
  // PATIENT HEALTH DATA SUBMISSION METHODS
  // ===================================================================
  
  /**
   * Submit health data for AI prediction (admin will process)
   */
  static async submitHealthData(req, res) {
    try {
      console.log('🔍 [DEBUG] Starting patient health data submission');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Request user:', req.user ? { id: req.user.id, role: req.user.role, patientId: req.user.patientId } : 'NO USER');
      
      // Validate that user is a patient
      if (!req.user || req.user.role !== 'patient') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only patients can submit health data.'
        });
      }

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
        pregnancies,
        glucose,
        bmi,
        age,
        insulin,
        notes
      } = req.body;

      // Get patient using the same pattern as other controllers
      const Patient = require('../models/Patient');
      const patient = await Patient.findByUserId(req.user.id);
      
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found. Please complete your profile first.'
        });
      }

      const patientId = patient.id;
      console.log('🔍 [DEBUG] Using patient ID:', patientId);

      console.log('🔍 [DEBUG] Creating health data submission record...');

      // Get the first available admin for patient submissions
      // This will be updated when the admin actually processes the submission
      const adminQuery = 'SELECT id FROM users WHERE role = ? LIMIT 1';
      const adminUsers = await mysqlConnection.query(adminQuery, ['admin']);
      
      if (adminUsers.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'No admin users available to process submissions. Please contact support.'
        });
      }
      
      const adminId = adminUsers[0].id;
      console.log('✅ [DEBUG] Using admin ID for submission:', adminId);

      // Create health data submission record (NO AI prediction yet)
      const prediction = await DiabetesPrediction.create({
        patientId,
        adminId, // Use first available admin (placeholder until admin processes)
        pregnancies: pregnancies || 0,
        glucose,
        bmi,
        age,
        insulin: insulin || 0,
        notes,
        status: 'pending' // Waiting for admin to process
      });

      console.log('✅ [DEBUG] Health data submission created:', prediction.id);

      res.status(201).json({
        success: true,
        message: 'Health data submitted successfully. Your data is pending review by our medical team.',
        data: {
          submission: {
            id: prediction.id,
            patientId: prediction.patientId,
            pregnancies: prediction.pregnancies,
            glucose: prediction.glucose,
            bmi: prediction.bmi,
            age: prediction.age,
            insulin: prediction.insulin,
            notes: prediction.notes,
            status: prediction.status,
            createdAt: prediction.createdAt
          },
          message: 'Your health data has been submitted and is awaiting review by our medical team. You will be notified once the analysis is complete and reviewed by a doctor.'
        }
      });

    } catch (error) {
      console.error('❌ [DEBUG] Error submitting health data:', error);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Failed to submit health data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get health data submissions and certified results for logged-in patient
   */
  static async getHealthSubmissions(req, res) {
    try {
      // Validate that user is a patient
      if (!req.user || req.user.role !== 'patient') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only patients can view their health submissions.'
        });
      }

      // Get patient using the same pattern as other controllers
      const Patient = require('../models/Patient');
      const patient = await Patient.findByUserId(req.user.id);
      
      console.log('Patient lookup result:', { userId: req.user.id, patient });
      
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found.'
        });
      }

      const patientId = patient.id;
      console.log('Patient ID extracted:', patientId);

      const { 
        page = 1, 
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;
      
      // Debug logging
      console.log('Query parameters:', { page, limit, pageNum, limitNum, offset, patientId });
      
      // Validate sortBy to prevent SQL injection
      const allowedSortColumns = ['created_at', 'updated_at', 'status'];
      const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
      
      // Validate sortOrder to prevent SQL injection
      const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
      
      // Validate parameters before query
      if (!patientId || isNaN(limitNum) || isNaN(offset)) {
        console.error('Invalid query parameters:', { patientId, limitNum, offset });
        return res.status(500).json({
          success: false,
          message: 'Invalid query parameters'
        });
      }
      
      // Build query with LIMIT/OFFSET as literals to avoid MySQL2 prepared statement issues
      const query = `
        SELECT 
          dp.id,
          dp.patient_id,
          dp.pregnancies,
          dp.glucose,
          dp.bmi,
          dp.age,
          dp.insulin,
          dp.status,
          dp.notes as patient_notes,
          dp.created_at,
          dp.updated_at,
          dp.processed_at,
          u.name as patient_name,
          u.email as patient_email,
          apc.id as certification_id,
          apc.certification_status,
          apc.doctor_notes,
          apc.clinical_assessment,
          apc.recommendations,
          apc.follow_up_required,
          apc.follow_up_date,
          apc.severity_assessment,
          apc.certified_at,
          du.name as doctor_name,
          d.specialty as doctor_specialty
        FROM diabetes_predictions dp
        LEFT JOIN patients p ON dp.patient_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN ai_prediction_certifications apc ON dp.id = apc.prediction_id
        LEFT JOIN doctors d ON apc.doctor_id = d.id
        LEFT JOIN users du ON d.user_id = du.id
        WHERE dp.patient_id = ?
        ORDER BY dp.created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      
      console.log('SQL Query parameters:', [patientId]);
      console.log('LIMIT/OFFSET values:', { limitNum, offset });
      const submissions = await mysqlConnection.query(query, [patientId]);
      console.log('Query executed successfully, found rows:', submissions.length);
      
      // Count total for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM diabetes_predictions dp
        WHERE dp.patient_id = ?
      `;
      
      const countResult = await mysqlConnection.query(countQuery, [patientId]);
      const total = countResult[0].total;
      
      console.log('Count query result:', { total, countResult });
      console.log('Raw submissions data:', submissions);

      // Transform results to patient-friendly format
      const transformedSubmissions = submissions.map(submission => ({
        id: submission.id,
        healthData: {
          pregnancies: submission.pregnancies,
          glucose: submission.glucose,
          bmi: submission.bmi,
          age: submission.age,
          insulin: submission.insulin
        },
        status: submission.status,
        patientNotes: submission.patient_notes,
        submittedAt: submission.created_at,
        updatedAt: submission.updated_at,
        processedAt: submission.processed_at,
        
        // Doctor certification info (if available)
        doctorReview: submission.certification_id ? {
          certificationId: submission.certification_id,
          certificationStatus: submission.certification_status,
          doctorNotes: submission.doctor_notes,
          clinicalAssessment: submission.clinical_assessment,
          recommendations: submission.recommendations,
          followUpRequired: submission.follow_up_required,
          followUpDate: submission.follow_up_date,
          severityAssessment: submission.severity_assessment,
          certifiedAt: submission.certified_at,
          doctorName: submission.doctor_name,
          doctorSpecialty: submission.doctor_specialty
        } : null
      }));
      
      console.log('Transformed submissions:', transformedSubmissions);
      console.log('Final response being sent:', {
        submissionsCount: transformedSubmissions.length,
        total,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      });

      res.json({
        success: true,
        data: {
          submissions: transformedSubmissions,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
          },
          meta: {
            page: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching patient health submissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch health submissions',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get single health submission with doctor recommendations for logged-in patient
   */
  static async getHealthSubmissionById(req, res) {
    try {
      // Validate that user is a patient
      if (!req.user || req.user.role !== 'patient') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only patients can view their health submissions.'
        });
      }

      const { id } = req.params;
      
      // Get patient using the same pattern as other controllers
      const Patient = require('../models/Patient');
      const patient = await Patient.findByUserId(req.user.id);
      
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found.'
        });
      }

      const patientId = patient.id;

      // Find submission that belongs to the logged-in patient with doctor certification
      const query = `
        SELECT 
          dp.*,
          u.name as patient_name,
          u.email as patient_email,
          apc.id as certification_id,
          apc.certification_status,
          apc.doctor_notes,
          apc.clinical_assessment,
          apc.recommendations,
          apc.follow_up_required,
          apc.follow_up_date,
          apc.severity_assessment,
          apc.certified_at,
          du.name as doctor_name,
          d.specialty as doctor_specialty,
          d.license_number as doctor_license
        FROM diabetes_predictions dp
        LEFT JOIN patients p ON dp.patient_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN ai_prediction_certifications apc ON dp.id = apc.prediction_id
        LEFT JOIN doctors d ON apc.doctor_id = d.id
        LEFT JOIN users du ON d.user_id = du.id
        WHERE dp.id = ? AND dp.patient_id = ?
      `;

      const results = await mysqlConnection.query(query, [id, patientId]);

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Health submission not found or access denied'
        });
      }

      const submission = results[0];
      
      // Patient-friendly response (NO AI prediction results, only doctor recommendations)
      const responseData = {
        id: submission.id,
        healthData: {
          pregnancies: submission.pregnancies,
          glucose: submission.glucose,
          bmi: submission.bmi,
          age: submission.age,
          insulin: submission.insulin
        },
        status: submission.status,
        patientNotes: submission.notes,
        submittedAt: submission.created_at,
        updatedAt: submission.updated_at,
        processedAt: submission.processed_at,
        
        // Only show doctor review information (not raw AI results)
        doctorReview: submission.certification_id ? {
          status: submission.certification_status,
          doctorNotes: submission.doctor_notes,
          clinicalAssessment: submission.clinical_assessment,
          recommendations: submission.recommendations,
          followUpRequired: submission.follow_up_required,
          followUpDate: submission.follow_up_date,
          severityAssessment: submission.severity_assessment,
          reviewedAt: submission.certified_at,
          reviewedBy: {
            name: submission.doctor_name,
            specialty: submission.doctor_specialty,
            licenseNumber: submission.doctor_license
          }
        } : null,
        
        // Status messages for patient
        statusMessage: PatientHealthDataController.getStatusMessage(submission.status, submission.certification_status)
      };

      res.json({
        success: true,
        data: { submission: responseData }
      });

    } catch (error) {
      console.error('Error fetching patient health submission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch health submission',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get patient health dashboard data
   */
  static async getHealthDashboard(req, res) {
    try {
      // Validate that user is a patient
      if (!req.user || req.user.role !== 'patient') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only patients can view their health dashboard.'
        });
      }

      // Get patient using the same pattern as other controllers
      const Patient = require('../models/Patient');
      const patient = await Patient.findByUserId(req.user.id);
      
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found.'
        });
      }

      const patientId = patient.id;

      // Get patient statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_submissions,
          SUM(CASE WHEN dp.status = 'processed' THEN 1 ELSE 0 END) as processed_submissions,
          SUM(CASE WHEN dp.status = 'pending' THEN 1 ELSE 0 END) as pending_submissions,
          SUM(CASE WHEN apc.certification_status = 'certified' THEN 1 ELSE 0 END) as certified_submissions,
          SUM(CASE WHEN apc.severity_assessment = 'high' THEN 1 ELSE 0 END) as high_severity,
          SUM(CASE WHEN apc.severity_assessment = 'medium' THEN 1 ELSE 0 END) as medium_severity,
          SUM(CASE WHEN apc.severity_assessment = 'low' THEN 1 ELSE 0 END) as low_severity,
          SUM(CASE WHEN apc.follow_up_required = 1 THEN 1 ELSE 0 END) as followup_required
        FROM diabetes_predictions dp
        LEFT JOIN ai_prediction_certifications apc ON dp.id = apc.prediction_id
        WHERE dp.patient_id = ?
      `;

      const statsResult = await mysqlConnection.query(statsQuery, [patientId]);
      const stats = statsResult[0];

      // Get recent submissions with doctor reviews
      const recentQuery = `
        SELECT 
          dp.id,
          dp.status,
          dp.created_at,
          dp.processed_at,
          apc.certification_status,
          apc.severity_assessment,
          apc.certified_at,
          du.name as doctor_name
        FROM diabetes_predictions dp
        LEFT JOIN patients p ON dp.patient_id = p.patient_id
        LEFT JOIN ai_prediction_certifications apc ON dp.id = apc.prediction_id
        LEFT JOIN doctors d ON apc.doctor_id = d.id
        LEFT JOIN users du ON d.user_id = du.id
        WHERE dp.patient_id = ? AND p.user_id = ?
        ORDER BY dp.created_at DESC
        LIMIT 5
      `;

      const recentSubmissions = await mysqlConnection.query(recentQuery, [patientId, req.user.id]);

      res.json({
        success: true,
        data: {
          statistics: {
            totalSubmissions: parseInt(stats.total_submissions) || 0,
            processedSubmissions: parseInt(stats.processed_submissions) || 0,
            pendingSubmissions: parseInt(stats.pending_submissions) || 0,
            certifiedSubmissions: parseInt(stats.certified_submissions) || 0,
            severityDistribution: {
              high: parseInt(stats.high_severity) || 0,
              medium: parseInt(stats.medium_severity) || 0,
              low: parseInt(stats.low_severity) || 0
            },
            followUpRequired: parseInt(stats.followup_required) || 0
          },
          recentSubmissions: recentSubmissions.map(sub => ({
            id: sub.id,
            status: sub.status,
            certificationStatus: sub.certification_status,
            severityAssessment: sub.severity_assessment,
            submittedAt: sub.created_at,
            processedAt: sub.processed_at,
            certifiedAt: sub.certified_at,
            doctorName: sub.doctor_name
          }))
        }
      });

    } catch (error) {
      console.error('Error fetching patient health dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch health dashboard',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get status message for patient based on submission and certification status
   */
  static getStatusMessage(submissionStatus, certificationStatus) {
    if (submissionStatus === 'pending') {
      return 'Your health data is being reviewed by our medical team.';
    } else if (submissionStatus === 'processed' && !certificationStatus) {
      return 'Analysis complete. Awaiting doctor review and recommendations.';
    } else if (certificationStatus === 'certified') {
      return 'Your health assessment has been reviewed and certified by a doctor.';
    } else if (certificationStatus === 'rejected') {
      return 'Your submission requires additional review. Please contact our medical team.';
    }
    return 'Status unknown. Please contact support.';
  }
}

module.exports = PatientHealthDataController;
