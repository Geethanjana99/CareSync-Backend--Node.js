const MedicalReport = require('../models/MedicalReport');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const logger = require('../config/logger');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/medical-reports/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common medical file types
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, PDF, DOC, DOCX files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

class MedicalReportController {
  // Upload medical report
  static uploadFile = upload.single('file');

  static async uploadReport(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { patientId, reportType, description, appointmentId } = req.body;
      
      let uploadedBy, uploadedByModel;
      
      // Determine who is uploading (patient or doctor)
      if (req.user.role === 'patient') {
        const patient = await Patient.findByUserId(req.user.id);
        if (!patient) {
          return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
          });
        }
        
        // Patient can only upload their own reports
        if (patientId && patientId !== patient.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
        
        uploadedBy = patient.id;
        uploadedByModel = 'Patient';
      } else if (req.user.role === 'doctor') {
        const doctor = await Doctor.findByUserId(req.user.id);
        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: 'Doctor profile not found'
          });
        }
        
        uploadedBy = doctor.id;
        uploadedByModel = 'Doctor';
      }

      const reportData = {
        patient_id: patientId || (req.user.role === 'patient' ? uploadedBy : null),
        appointment_id: appointmentId || null,
        report_type: reportType,
        description: description || '',
        file_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        uploaded_by: uploadedBy,
        uploaded_by_model: uploadedByModel,
        status: 'pending_review'
      };

      const report = await MedicalReport.create(reportData);

      res.status(201).json({
        success: true,
        message: 'Medical report uploaded successfully',
        data: report
      });

      logger.info(`Medical report uploaded: ${report._id} by ${uploadedByModel} ${uploadedBy}`);
    } catch (error) {
      logger.error('Error uploading medical report:', error);
      next(error);
    }
  }

  // Get medical reports
  static async getReports(req, res, next) {
    try {
      const { page = 1, limit = 10, patientId, reportType, status } = req.query;
      
      let query = {};
      
      if (req.user.role === 'patient') {
        const patient = await Patient.findByUserId(req.user.id);
        if (!patient) {
          return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
          });
        }
        query.patient_id = patient.id;
      } else if (req.user.role === 'doctor') {
        const doctor = await Doctor.findByUserId(req.user.id);
        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: 'Doctor profile not found'
          });
        }
        
        if (patientId) {
          // Verify doctor has access to this patient
          const hasAccess = await Doctor.hasPatientAccess(doctor.id, patientId);
          if (!hasAccess) {
            return res.status(403).json({
              success: false,
              message: 'Access denied to patient reports'
            });
          }
          query.patient_id = patientId;
        } else {
          // Get reports for all patients this doctor has access to
          const accessiblePatients = await Doctor.getAccessiblePatients(doctor.id);
          query.patient_id = { $in: accessiblePatients.map(p => p.id) };
        }
      }

      if (reportType) query.report_type = reportType;
      if (status) query.status = status;

      const reports = await MedicalReport.find(query)
        .populate('patient_id')
        .populate('appointment_id')
        .sort({ created_at: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await MedicalReport.countDocuments(query);

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching medical reports:', error);
      next(error);
    }
  }

  // Get single report
  static async getReport(req, res, next) {
    try {
      const { reportId } = req.params;
      
      const report = await MedicalReport.findById(reportId)
        .populate('patient_id')
        .populate('appointment_id')
        .populate('uploaded_by');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Medical report not found'
        });
      }

      // Check access permissions
      let hasAccess = false;
      
      if (req.user.role === 'patient') {
        const patient = await Patient.findByUserId(req.user.id);
        hasAccess = patient && report.patient_id.toString() === patient.id;
      } else if (req.user.role === 'doctor') {
        const doctor = await Doctor.findByUserId(req.user.id);
        hasAccess = doctor && await Doctor.hasPatientAccess(doctor.id, report.patient_id);
      } else if (req.user.role === 'admin') {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this report'
        });
      }

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error fetching medical report:', error);
      next(error);
    }
  }

  // Update report status (doctor/admin only)
  static async updateReportStatus(req, res, next) {
    try {
      const { reportId } = req.params;
      const { status, review_notes } = req.body;

      if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only doctors and admins can update report status.'
        });
      }

      const report = await MedicalReport.findById(reportId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Medical report not found'
        });
      }

      let reviewedBy;
      if (req.user.role === 'doctor') {
        const doctor = await Doctor.findByUserId(req.user.id);
        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: 'Doctor profile not found'
          });
        }
        
        // Check if doctor has access to this patient
        const hasAccess = await Doctor.hasPatientAccess(doctor.id, report.patient_id);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this patient\'s reports'
          });
        }
        
        reviewedBy = doctor.id;
      }

      const updatedReport = await MedicalReport.findByIdAndUpdate(
        reportId,
        {
          status,
          review_notes,
          reviewed_by: reviewedBy,
          reviewed_at: new Date()
        },
        { new: true }
      ).populate('patient_id');

      res.json({
        success: true,
        message: 'Report status updated successfully',
        data: updatedReport
      });

      logger.info(`Medical report status updated: ${reportId} to ${status}`);
    } catch (error) {
      logger.error('Error updating report status:', error);
      next(error);
    }
  }

  // Delete report
  static async deleteReport(req, res, next) {
    try {
      const { reportId } = req.params;
      
      const report = await MedicalReport.findById(reportId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Medical report not found'
        });
      }

      // Check permissions
      let canDelete = false;
      
      if (req.user.role === 'patient') {
        const patient = await Patient.findByUserId(req.user.id);
        canDelete = patient && report.patient_id.toString() === patient.id && report.status === 'pending_review';
      } else if (req.user.role === 'admin') {
        canDelete = true;
      }

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Cannot delete this report.'
        });
      }

      // Delete file from filesystem
      const fs = require('fs').promises;
      try {
        await fs.unlink(report.file_path);
      } catch (fileError) {
        logger.warn(`Could not delete file: ${report.file_path}`, fileError);
      }

      await MedicalReport.findByIdAndDelete(reportId);

      res.json({
        success: true,
        message: 'Medical report deleted successfully'
      });

      logger.info(`Medical report deleted: ${reportId}`);
    } catch (error) {
      logger.error('Error deleting medical report:', error);
      next(error);
    }
  }

  // Get AI analysis for report (placeholder for future AI integration)
  static async getAIAnalysis(req, res, next) {
    try {
      const { reportId } = req.params;
      
      const report = await MedicalReport.findById(reportId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Medical report not found'
        });
      }

      // Check access permissions
      let hasAccess = false;
      
      if (req.user.role === 'patient') {
        const patient = await Patient.findByUserId(req.user.id);
        hasAccess = patient && report.patient_id.toString() === patient.id;
      } else if (req.user.role === 'doctor') {
        const doctor = await Doctor.findByUserId(req.user.id);
        hasAccess = doctor && await Doctor.hasPatientAccess(doctor.id, report.patient_id);
      } else if (req.user.role === 'admin') {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this report'
        });
      }

      // Placeholder for AI analysis
      // In a real implementation, this would call an AI service
      const aiAnalysis = {
        status: 'pending',
        message: 'AI analysis feature will be implemented in future updates',
        confidence: null,
        findings: [],
        recommendations: []
      };

      res.json({
        success: true,
        data: aiAnalysis
      });
    } catch (error) {
      logger.error('Error getting AI analysis:', error);
      next(error);
    }
  }

  // Download report file
  static async downloadReport(req, res, next) {
    try {
      const { reportId } = req.params;
      
      const report = await MedicalReport.findById(reportId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Medical report not found'
        });
      }

      // Check access permissions
      let hasAccess = false;
      
      if (req.user.role === 'patient') {
        const patient = await Patient.findByUserId(req.user.id);
        hasAccess = patient && report.patient_id.toString() === patient.id;
      } else if (req.user.role === 'doctor') {
        const doctor = await Doctor.findByUserId(req.user.id);
        hasAccess = doctor && await Doctor.hasPatientAccess(doctor.id, report.patient_id);
      } else if (req.user.role === 'admin') {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this report'
        });
      }

      const fs = require('fs');
      if (!fs.existsSync(report.file_path)) {
        return res.status(404).json({
          success: false,
          message: 'Report file not found on server'
        });
      }

      res.download(report.file_path, report.file_name);
      
      logger.info(`Medical report downloaded: ${reportId} by user ${req.user.id}`);
    } catch (error) {
      logger.error('Error downloading medical report:', error);
      next(error);
    }
  }
}

module.exports = MedicalReportController;
