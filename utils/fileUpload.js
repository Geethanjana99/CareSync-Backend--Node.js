const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const sharp = require('sharp');
const logger = require('../config/logger');

class FileUploadUtil {
  constructor() {
    this.ensureUploadDirectories();
  }

  // Ensure upload directories exist
  async ensureUploadDirectories() {
    const directories = [
      'uploads/avatars',
      'uploads/medical-reports',
      'uploads/documents',
      'uploads/temp'
    ];

    try {
      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
      }
      logger.info('Upload directories created/verified');
    } catch (error) {
      logger.error('Error creating upload directories:', error);
    }
  }

  // Generate unique filename
  generateUniqueFilename(originalname) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalname);
    const baseName = path.basename(originalname, extension);
    
    // Sanitize the base name
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    return `${sanitizedBaseName}_${timestamp}_${randomString}${extension}`;
  }

  // Create multer storage configuration
  createStorage(destination) {
    return multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          await fs.mkdir(destination, { recursive: true });
          cb(null, destination);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const uniqueName = this.generateUniqueFilename(file.originalname);
        cb(null, uniqueName);
      }
    });
  }

  // File filter for images
  imageFileFilter(req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
    }
  }

  // File filter for documents
  documentFileFilter(req, file, cb) {
    const allowedTypes = /pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|text\/plain/.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only document files (PDF, DOC, DOCX, TXT) are allowed'));
    }
  }

  // File filter for medical reports
  medicalReportFileFilter(req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|dicom/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image\/(jpeg|png)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|application\/dicom/.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only medical file types (JPEG, PNG, PDF, DOC, DOCX, DICOM) are allowed'));
    }
  }

  // Create avatar upload middleware
  createAvatarUpload() {
    return multer({
      storage: this.createStorage('uploads/avatars'),
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
      },
      fileFilter: this.imageFileFilter
    });
  }

  // Create medical report upload middleware
  createMedicalReportUpload() {
    return multer({
      storage: this.createStorage('uploads/medical-reports'),
      limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
      },
      fileFilter: this.medicalReportFileFilter
    });
  }

  // Create document upload middleware
  createDocumentUpload() {
    return multer({
      storage: this.createStorage('uploads/documents'),
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
      },
      fileFilter: this.documentFileFilter
    });
  }

  // Process and resize avatar image
  async processAvatar(filePath, sizes = [150, 300]) {
    try {
      const ext = path.extname(filePath);
      const baseName = path.basename(filePath, ext);
      const dir = path.dirname(filePath);

      const processedFiles = {};

      for (const size of sizes) {
        const outputPath = path.join(dir, `${baseName}_${size}x${size}${ext}`);
        
        await sharp(filePath)
          .resize(size, size, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 90 })
          .toFile(outputPath);

        processedFiles[`${size}x${size}`] = outputPath;
      }

      return processedFiles;
    } catch (error) {
      logger.error('Error processing avatar:', error);
      throw error;
    }
  }

  // Compress image
  async compressImage(filePath, quality = 80) {
    try {
      const ext = path.extname(filePath);
      const baseName = path.basename(filePath, ext);
      const dir = path.dirname(filePath);
      const outputPath = path.join(dir, `${baseName}_compressed${ext}`);

      await sharp(filePath)
        .jpeg({ quality })
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      logger.error('Error compressing image:', error);
      throw error;
    }
  }

  // Get file metadata
  async getFileMetadata(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      const metadata = {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        extension: ext,
        type: this.getFileType(ext)
      };

      // If it's an image, get additional metadata
      if (metadata.type === 'image') {
        try {
          const imageMetadata = await sharp(filePath).metadata();
          metadata.width = imageMetadata.width;
          metadata.height = imageMetadata.height;
          metadata.format = imageMetadata.format;
        } catch (imageError) {
          logger.warn('Could not extract image metadata:', imageError);
        }
      }

      return metadata;
    } catch (error) {
      logger.error('Error getting file metadata:', error);
      throw error;
    }
  }

  // Determine file type based on extension
  getFileType(extension) {
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const documentExts = ['.pdf', '.doc', '.docx', '.txt'];
    const medicalExts = ['.dicom', '.dcm'];

    if (imageExts.includes(extension)) return 'image';
    if (documentExts.includes(extension)) return 'document';
    if (medicalExts.includes(extension)) return 'medical';
    
    return 'other';
  }

  // Delete file safely
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(`File deleted: ${filePath}`);
      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error(`Error deleting file ${filePath}:`, error);
      }
      return false;
    }
  }

  // Delete multiple files
  async deleteFiles(filePaths) {
    const results = await Promise.allSettled(
      filePaths.map(filePath => this.deleteFile(filePath))
    );

    return results.map((result, index) => ({
      filePath: filePaths[index],
      success: result.status === 'fulfilled' && result.value,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  // Clean up old temporary files
  async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    try {
      const tempDir = 'uploads/temp';
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await this.deleteFile(filePath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} temporary files`);
      }

      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up temporary files:', error);
      return 0;
    }
  }

  // Validate file size
  validateFileSize(file, maxSize) {
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${Math.round(maxSize / (1024 * 1024))}MB`);
    }
    return true;
  }

  // Create secure download URL
  createSecureDownloadUrl(filePath, expiresIn = '1h') {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + this.parseExpiration(expiresIn);
    
    // In a real implementation, you'd store this token mapping in a cache/database
    // For now, we'll use a simple in-memory store (not recommended for production)
    if (!global.downloadTokens) {
      global.downloadTokens = new Map();
    }
    
    global.downloadTokens.set(token, {
      filePath,
      expires
    });

    return `/api/files/download/${token}`;
  }

  // Parse expiration string to milliseconds
  parseExpiration(expiresIn) {
    const units = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid expiration format. Use format like "1h", "30m", "24h"');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    return value * units[unit];
  }

  // Validate download token
  validateDownloadToken(token) {
    if (!global.downloadTokens) {
      return null;
    }

    const tokenData = global.downloadTokens.get(token);
    if (!tokenData) {
      return null;
    }

    if (Date.now() > tokenData.expires) {
      global.downloadTokens.delete(token);
      return null;
    }

    return tokenData.filePath;
  }

  // Get storage usage statistics
  async getStorageStats() {
    try {
      const directories = [
        'uploads/avatars',
        'uploads/medical-reports',
        'uploads/documents',
        'uploads/temp'
      ];

      const stats = {};

      for (const dir of directories) {
        const dirStats = await this.getDirectoryStats(dir);
        stats[dir] = dirStats;
      }

      return stats;
    } catch (error) {
      logger.error('Error getting storage stats:', error);
      throw error;
    }
  }

  // Get directory statistics
  async getDirectoryStats(directory) {
    try {
      const files = await fs.readdir(directory, { withFileTypes: true });
      let totalSize = 0;
      let fileCount = 0;

      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(directory, file.name);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          fileCount++;
        }
      }

      return {
        fileCount,
        totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
      };
    } catch (error) {
      logger.error(`Error getting directory stats for ${directory}:`, error);
      return {
        fileCount: 0,
        totalSize: 0,
        totalSizeMB: 0
      };
    }
  }
}

module.exports = new FileUploadUtil();
