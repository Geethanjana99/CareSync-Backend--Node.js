const { mysqlConnection: mysql } = require('../config/mysql');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

/**
 * Admin Medical Reports Model (MySQL)
 * Enhanced medical reports uploaded by admin with PDF support
 */
class AdminMedicalReport {
  constructor(data = {}) {
    this.id = data.id || null;
    this.patientId = data.patient_id || data.patientId || null;
    this.adminId = data.admin_id || data.adminId || null;
    this.reportType = data.report_type || data.reportType || null;
    this.title = data.title || null;
    this.description = data.description || null;
    this.fileName = data.file_name || data.fileName || null;
    this.originalFileName = data.original_file_name || data.originalFileName || null;
    this.filePath = data.file_path || data.filePath || null;
    this.fileSize = data.file_size || data.fileSize || null;
    this.mimeType = data.mime_type || data.mimeType || null;
    this.fileHash = data.file_hash || data.fileHash || null;
    this.tags = data.tags || [];
    this.metadata = data.metadata || {};
    this.isConfidential = data.is_confidential || data.isConfidential || false;
    this.expiryDate = data.expiry_date || data.expiryDate || null;
    this.status = data.status || 'uploaded';
    this.notes = data.notes || null;
    this.uploadSource = data.upload_source || data.uploadSource || 'admin_portal';
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.reviewedAt = data.reviewed_at || data.reviewedAt || null;
    this.reviewedBy = data.reviewed_by || data.reviewedBy || null;
  }

  // Instance methods
  getFileUrl() {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/api/admin/reports/${this.id}/download`;
  }

  getFileInfo() {
    return {
      id: this.id,
      fileName: this.originalFileName,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      uploadDate: this.createdAt,
      downloadUrl: this.getFileUrl()
    };
  }

  isExpired() {
    if (!this.expiryDate) return false;
    return new Date() > new Date(this.expiryDate);
  }

  canAccess(user) {
    // Admin can access all reports
    if (user.role === 'admin') return true;
    
    // Patient can access their own reports (non-confidential)
    if (user.role === 'patient' && this.patientId === user.id) {
      return !this.isConfidential;
    }
    
    // Doctor can access reports of their patients
    if (user.role === 'doctor') {
      // This would need additional logic to check doctor-patient relationship
      return !this.isConfidential;
    }
    
    return false;
  }

  async deleteFile() {
    try {
      if (this.filePath && await this.fileExists()) {
        await fs.unlink(this.filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete report file');
    }
  }

  async fileExists() {
    try {
      await fs.access(this.filePath);
      return true;
    } catch {
      return false;
    }
  }

  toJSON() {
    return {
      id: this.id,
      patientId: this.patientId,
      adminId: this.adminId,
      reportType: this.reportType,
      title: this.title,
      description: this.description,
      fileName: this.fileName,
      originalFileName: this.originalFileName,
      filePath: this.filePath,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      fileHash: this.fileHash,
      tags: this.tags,
      metadata: this.metadata,
      isConfidential: this.isConfidential,
      expiryDate: this.expiryDate,
      status: this.status,
      notes: this.notes,
      uploadSource: this.uploadSource,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      reviewedAt: this.reviewedAt,
      reviewedBy: this.reviewedBy
    };
  }

  // Static methods
  static async create(data) {
    const id = uuidv4();
    const now = new Date();
    
    const query = `
      INSERT INTO admin_medical_reports (
        id, patient_id, admin_id, report_type, title, description,
        file_name, original_file_name, file_path, file_size, mime_type,
        file_hash, tags, metadata, is_confidential, expiry_date,
        status, notes, upload_source, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      id,
      data.patientId,
      data.adminId,
      data.reportType,
      data.title,
      data.description,
      data.fileName,
      data.originalFileName,
      data.filePath,
      data.fileSize,
      data.mimeType,
      data.fileHash,
      JSON.stringify(data.tags || []),
      JSON.stringify(data.metadata || {}),
      data.isConfidential || false,
      data.expiryDate || null,
      data.status || 'uploaded',
      data.notes,
      data.uploadSource || 'admin_portal',
      now,
      now
    ];

    await mysql.query(query, params);
    
    // Return the created record
    return await this.findByPk(id);
  }

  static async findByPk(id) {
    const query = `
      SELECT amr.*, 
             u.name as admin_name, u.email as admin_email,
             p.patient_id as patient_code,
             pu.name as patient_name, pu.email as patient_email
      FROM admin_medical_reports amr
      LEFT JOIN users u ON amr.admin_id = u.id
      LEFT JOIN patients p ON amr.patient_id = p.id  
      LEFT JOIN users pu ON p.user_id = pu.id
      WHERE amr.id = ?
    `;
    
    const results = await mysql.query(query, [id]);
    if (results.length === 0) return null;
    
    const row = results[0];
    const report = new AdminMedicalReport(row);
    
    // Parse JSON fields
    if (row.tags) report.tags = JSON.parse(row.tags);
    if (row.metadata) report.metadata = JSON.parse(row.metadata);
    
    // Add related data
    report.admin = {
      name: row.admin_name,
      email: row.admin_email
    };
    report.patient = {
      patientId: row.patient_code,
      user: {
        name: row.patient_name,
        email: row.patient_email
      }
    };
    
    return report;
  }

  static async findAll(options = {}) {
    let query = `
      SELECT amr.*, 
             u.name as admin_name, u.email as admin_email,
             p.patient_id as patient_code,
             pu.name as patient_name, pu.email as patient_email
      FROM admin_medical_reports amr
      LEFT JOIN users u ON amr.admin_id = u.id
      LEFT JOIN patients p ON amr.patient_id = p.id  
      LEFT JOIN users pu ON p.user_id = pu.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (options.where) {
      Object.keys(options.where).forEach(key => {
        conditions.push(`amr.${key} = ?`);
        params.push(options.where[key]);
      });
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    if (options.order) {
      const [field, direction] = options.order[0];
      query += ` ORDER BY amr.${field} ${direction}`;
    } else {
      query += ` ORDER BY amr.created_at DESC`;
    }
    
    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
      if (options.offset) {
        query += ` OFFSET ${options.offset}`;
      }
    }
    
    const results = await mysql.query(query, params);
    
    return results.map(row => {
      const report = new AdminMedicalReport(row);
      
      // Parse JSON fields
      if (row.tags) report.tags = JSON.parse(row.tags);
      if (row.metadata) report.metadata = JSON.parse(row.metadata);
      
      report.admin = {
        name: row.admin_name,
        email: row.admin_email
      };
      report.patient = {
        patientId: row.patient_code,
        user: {
          name: row.patient_name,
          email: row.patient_email
        }
      };
      return report;
    });
  }

  static async count(options = {}) {
    let query = `SELECT COUNT(*) as total FROM admin_medical_reports amr`;
    const params = [];
    const conditions = [];
    
    if (options.where) {
      Object.keys(options.where).forEach(key => {
        conditions.push(`amr.${key} = ?`);
        params.push(options.where[key]);
      });
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const results = await mysql.query(query, params);
    return results[0].total;
  }

  static async getByPatientId(patientId, options = {}) {
    return await this.findAll({
      where: { patient_id: patientId },
      ...options
    });
  }

  static async getByReportType(reportType, options = {}) {
    return await this.findAll({
      where: { report_type: reportType },
      ...options
    });
  }

  static async searchReports(searchParams, options = {}) {
    let query = `
      SELECT amr.*, 
             u.name as admin_name, u.email as admin_email,
             p.patient_id as patient_code,
             pu.name as patient_name, pu.email as patient_email
      FROM admin_medical_reports amr
      LEFT JOIN users u ON amr.admin_id = u.id
      LEFT JOIN patients p ON amr.patient_id = p.id  
      LEFT JOIN users pu ON p.user_id = pu.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (searchParams.patientId) {
      conditions.push('amr.patient_id = ?');
      params.push(searchParams.patientId);
    }
    
    if (searchParams.reportType) {
      conditions.push('amr.report_type = ?');
      params.push(searchParams.reportType);
    }
    
    if (searchParams.status) {
      conditions.push('amr.status = ?');
      params.push(searchParams.status);
    }
    
    if (searchParams.title) {
      conditions.push('amr.title LIKE ?');
      params.push(`%${searchParams.title}%`);
    }
    
    if (searchParams.dateRange) {
      conditions.push('amr.created_at BETWEEN ? AND ?');
      params.push(searchParams.dateRange.start, searchParams.dateRange.end);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    if (options.order) {
      const [field, direction] = options.order[0];
      query += ` ORDER BY amr.${field} ${direction}`;
    } else {
      query += ` ORDER BY amr.created_at DESC`;
    }
    
    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
      if (options.offset) {
        query += ` OFFSET ${options.offset}`;
      }
    }
    
    const results = await mysql.query(query, params);
    
    return results.map(row => {
      const report = new AdminMedicalReport(row);
      
      // Parse JSON fields
      if (row.tags) report.tags = JSON.parse(row.tags);
      if (row.metadata) report.metadata = JSON.parse(row.metadata);
      
      report.admin = {
        name: row.admin_name,
        email: row.admin_email
      };
      report.patient = {
        patientId: row.patient_code,
        user: {
          name: row.patient_name,
          email: row.patient_email
        }
      };
      return report;
    });
  }

  static async getStatistics(dateRange = {}) {
    let query = `
      SELECT 
        report_type,
        status,
        COUNT(*) as count,
        SUM(file_size) as total_size
      FROM admin_medical_reports
    `;
    
    const params = [];
    
    if (dateRange.startDate && dateRange.endDate) {
      query += ` WHERE created_at BETWEEN ? AND ?`;
      params.push(dateRange.startDate, dateRange.endDate);
    }
    
    query += ` GROUP BY report_type, status`;
    
    const results = await mysql.query(query, params);
    
    const byType = {};
    const byStatus = {};
    let totalSize = 0;
    let totalReports = 0;
    
    results.forEach(row => {
      const count = parseInt(row.count);
      const size = parseInt(row.total_size || 0);
      
      totalReports += count;
      totalSize += size;
      
      byType[row.report_type] = (byType[row.report_type] || 0) + count;
      byStatus[row.status] = (byStatus[row.status] || 0) + count;
    });
    
    return {
      byType,
      byStatus,
      totalSize,
      totalReports
    };
  }

  async destroy() {
    await this.deleteFile();
    
    const query = 'DELETE FROM admin_medical_reports WHERE id = ?';
    await mysql.query(query, [this.id]);
  }
}

module.exports = AdminMedicalReport;
