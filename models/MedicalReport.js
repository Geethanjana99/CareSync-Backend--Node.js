const mongoose = require('mongoose');

// Medical Report Schema for MongoDB
const medicalReportSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    index: true
  },
  doctorId: {
    type: String,
    required: true,
    index: true
  },
  appointmentId: {
    type: String,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['blood', 'urine', 'xray', 'mri', 'ct', 'ultrasound', 'ecg', 'other'],
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'reviewed', 'archived'],
    default: 'pending'
  },
  
  // AI Prediction Data
  aiPrediction: {
    diabetesRisk: {
      type: String,
      enum: ['low', 'medium', 'high', 'very-high']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100
    },
    factors: [String],
    analysisDate: Date,
    modelVersion: String,
    processingTime: Number, // milliseconds
    additionalMetrics: {
      glucoseLevel: Number,
      hba1c: Number,
      bmi: Number,
      bloodPressure: {
        systolic: Number,
        diastolic: Number
      },
      cholesterol: {
        total: Number,
        ldl: Number,
        hdl: Number,
        triglycerides: Number
      }
    }
  },
  
  // Doctor Review
  doctorReview: {
    reviewDate: Date,
    reviewedBy: String,
    findings: String,
    recommendations: String,
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date,
    severity: {
      type: String,
      enum: ['normal', 'mild', 'moderate', 'severe', 'critical']
    },
    notes: String
  },
  
  // Metadata
  metadata: {
    uploadedBy: String,
    ipAddress: String,
    userAgent: String,
    processingLogs: [{
      timestamp: Date,
      action: String,
      details: String,
      performedBy: String
    }]
  },
  
  // Tags for categorization
  tags: [String],
  
  // Access permissions
  permissions: {
    viewableBy: [String], // user IDs
    editableBy: [String], // user IDs
    isPublic: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  collection: 'medical_reports'
});

// Indexes for performance
medicalReportSchema.index({ patientId: 1, uploadDate: -1 });
medicalReportSchema.index({ doctorId: 1, uploadDate: -1 });
medicalReportSchema.index({ status: 1, uploadDate: -1 });
medicalReportSchema.index({ fileType: 1, uploadDate: -1 });
medicalReportSchema.index({ 'aiPrediction.diabetesRisk': 1 });

// Methods
medicalReportSchema.methods.updateAIPrediction = function(predictionData) {
  this.aiPrediction = {
    ...this.aiPrediction,
    ...predictionData,
    analysisDate: new Date()
  };
  this.status = 'processed';
  return this.save();
};

medicalReportSchema.methods.addDoctorReview = function(reviewData, doctorId) {
  this.doctorReview = {
    ...reviewData,
    reviewDate: new Date(),
    reviewedBy: doctorId
  };
  this.status = 'reviewed';
  return this.save();
};

medicalReportSchema.methods.addProcessingLog = function(action, details, performedBy) {
  if (!this.metadata.processingLogs) {
    this.metadata.processingLogs = [];
  }
  
  this.metadata.processingLogs.push({
    timestamp: new Date(),
    action,
    details,
    performedBy
  });
  
  return this.save();
};

// Static methods
medicalReportSchema.statics.findByPatient = function(patientId, options = {}) {
  const query = { patientId };
  
  if (options.fileType) {
    query.fileType = options.fileType;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.dateFrom || options.dateTo) {
    query.uploadDate = {};
    if (options.dateFrom) query.uploadDate.$gte = new Date(options.dateFrom);
    if (options.dateTo) query.uploadDate.$lte = new Date(options.dateTo);
  }
  
  return this.find(query)
    .sort({ uploadDate: -1 })
    .limit(options.limit || 50);
};

medicalReportSchema.statics.findByDoctor = function(doctorId, options = {}) {
  const query = { doctorId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ uploadDate: -1 })
    .limit(options.limit || 50);
};

medicalReportSchema.statics.getAggregatedStats = function(patientId) {
  return this.aggregate([
    { $match: { patientId } },
    {
      $group: {
        _id: '$fileType',
        count: { $sum: 1 },
        latestReport: { $max: '$uploadDate' },
        avgConfidence: { $avg: '$aiPrediction.confidence' }
      }
    }
  ]);
};

const MedicalReport = mongoose.model('MedicalReport', medicalReportSchema);

module.exports = MedicalReport;
