const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const logger = require('../config/logger');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
  }

  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info('Created backup directory');
    }
  }

  generateBackupFilename(prefix = 'backup') {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .split('.')[0];
    return `${prefix}_${timestamp}.sql`;
  }

  async createMySQLBackup(options = {}) {
    const {
      host = process.env.DB_HOST || 'localhost',
      port = process.env.DB_PORT || 3306,
      user = process.env.DB_USER || 'root',
      password = process.env.DB_PASSWORD || '',
      database = process.env.DB_NAME || 'clinical_appointment_system',
      tables = null, // null means all tables
      compress = true
    } = options;

    await this.ensureBackupDirectory();

    const filename = this.generateBackupFilename('mysql');
    const backupPath = path.join(this.backupDir, filename);
    
    try {
      // Build mysqldump command
      let command = `mysqldump -h${host} -P${port} -u${user}`;
      
      if (password) {
        command += ` -p"${password}"`;
      }
      
      // Add options for better backup
      command += ` --single-transaction --routines --triggers --events`;
      command += ` --add-drop-table --add-locks --create-options`;
      command += ` --disable-keys --extended-insert --lock-tables=false`;
      
      // Add database name
      command += ` ${database}`;
      
      // Add specific tables if specified
      if (tables && Array.isArray(tables)) {
        command += ` ${tables.join(' ')}`;
      }
      
      // Output to file
      if (compress) {
        command += ` | gzip > "${backupPath}.gz"`;
      } else {
        command += ` > "${backupPath}"`;
      }
      
      logger.info(`Starting MySQL backup: ${filename}`);
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('Warning: Using a password')) {
        throw new Error(`Backup error: ${stderr}`);
      }
      
      const finalPath = compress ? `${backupPath}.gz` : backupPath;
      const stats = await fs.stat(finalPath);
      
      logger.info(`MySQL backup completed: ${filename}${compress ? '.gz' : ''} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      
      return {
        success: true,
        filename: path.basename(finalPath),
        path: finalPath,
        size: stats.size,
        compressed: compress
      };
      
    } catch (error) {
      logger.error('MySQL backup failed:', error);
      throw error;
    }
  }

  async createMongoDBBackup(options = {}) {
    const {
      host = process.env.MONGODB_HOST || 'localhost',
      port = process.env.MONGODB_PORT || 27017,
      database = process.env.MONGODB_DATABASE || 'clinical_reports',
      username = process.env.MONGODB_USERNAME,
      password = process.env.MONGODB_PASSWORD,
      compress = true
    } = options;

    await this.ensureBackupDirectory();

    const filename = this.generateBackupFilename('mongodb');
    const backupPath = path.join(this.backupDir, filename);
    
    try {
      // Build mongodump command
      let command = `mongodump --host ${host}:${port} --db ${database}`;
      
      if (username && password) {
        command += ` --username "${username}" --password "${password}"`;
      }
      
      command += ` --out "${backupPath}_temp"`;
      
      logger.info(`Starting MongoDB backup: ${filename}`);
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        throw new Error(`MongoDB backup error: ${stderr}`);
      }
      
      // Create archive from the dump directory
      const archiveCommand = compress 
        ? `tar -czf "${backupPath}.tar.gz" -C "${backupPath}_temp" .`
        : `tar -cf "${backupPath}.tar" -C "${backupPath}_temp" .`;
      
      await execAsync(archiveCommand);
      
      // Clean up temporary directory
      await execAsync(`rm -rf "${backupPath}_temp"`);
      
      const finalPath = compress ? `${backupPath}.tar.gz` : `${backupPath}.tar`;
      const stats = await fs.stat(finalPath);
      
      logger.info(`MongoDB backup completed: ${path.basename(finalPath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      
      return {
        success: true,
        filename: path.basename(finalPath),
        path: finalPath,
        size: stats.size,
        compressed: compress
      };
      
    } catch (error) {
      logger.error('MongoDB backup failed:', error);
      throw error;
    }
  }

  async createFullBackup(options = {}) {
    const timestamp = new Date().toISOString().split('.')[0].replace(/[:.]/g, '-');
    const results = {
      timestamp,
      mysql: null,
      mongodb: null,
      files: null
    };

    try {
      // Backup MySQL database
      logger.info('Starting full backup process...');
      
      try {
        results.mysql = await this.createMySQLBackup(options.mysql);
      } catch (error) {
        logger.warn('MySQL backup failed, continuing with other backups:', error.message);
        results.mysql = { success: false, error: error.message };
      }
      
      // Backup MongoDB database
      try {
        results.mongodb = await this.createMongoDBBackup(options.mongodb);
      } catch (error) {
        logger.warn('MongoDB backup failed, continuing with other backups:', error.message);
        results.mongodb = { success: false, error: error.message };
      }
      
      // Backup important files
      try {
        results.files = await this.createFilesBackup(options.files);
      } catch (error) {
        logger.warn('Files backup failed:', error.message);
        results.files = { success: false, error: error.message };
      }
      
      logger.info('Full backup process completed');
      return results;
      
    } catch (error) {
      logger.error('Full backup process failed:', error);
      throw error;
    }
  }

  async createFilesBackup(options = {}) {
    const {
      directories = ['uploads', 'templates', 'config'],
      compress = true
    } = options;

    await this.ensureBackupDirectory();

    const filename = this.generateBackupFilename('files');
    const backupPath = path.join(this.backupDir, filename);
    
    try {
      const baseDir = path.join(__dirname, '..');
      const validDirs = [];
      
      // Check which directories exist
      for (const dir of directories) {
        const dirPath = path.join(baseDir, dir);
        try {
          await fs.access(dirPath);
          validDirs.push(dir);
        } catch {
          logger.warn(`Directory not found, skipping: ${dir}`);
        }
      }
      
      if (validDirs.length === 0) {
        throw new Error('No valid directories found to backup');
      }
      
      logger.info(`Starting files backup: ${validDirs.join(', ')}`);
      
      // Create archive
      const archiveCommand = compress
        ? `tar -czf "${backupPath}.tar.gz" -C "${baseDir}" ${validDirs.join(' ')}`
        : `tar -cf "${backupPath}.tar" -C "${baseDir}" ${validDirs.join(' ')}`;
      
      await execAsync(archiveCommand);
      
      const finalPath = compress ? `${backupPath}.tar.gz` : `${backupPath}.tar`;
      const stats = await fs.stat(finalPath);
      
      logger.info(`Files backup completed: ${path.basename(finalPath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      
      return {
        success: true,
        filename: path.basename(finalPath),
        path: finalPath,
        size: stats.size,
        compressed: compress,
        directories: validDirs
      };
      
    } catch (error) {
      logger.error('Files backup failed:', error);
      throw error;
    }
  }

  async restoreMySQLBackup(backupFile, options = {}) {
    const {
      host = process.env.DB_HOST || 'localhost',
      port = process.env.DB_PORT || 3306,
      user = process.env.DB_USER || 'root',
      password = process.env.DB_PASSWORD || '',
      database = process.env.DB_NAME || 'clinical_appointment_system',
      dropDatabase = false
    } = options;

    const backupPath = path.isAbsolute(backupFile) 
      ? backupFile 
      : path.join(this.backupDir, backupFile);

    try {
      await fs.access(backupPath);
    } catch {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    try {
      logger.info(`Starting MySQL restore from: ${backupFile}`);
      
      // Drop and recreate database if requested
      if (dropDatabase) {
        let command = `mysql -h${host} -P${port} -u${user}`;
        if (password) {
          command += ` -p"${password}"`;
        }
        command += ` -e "DROP DATABASE IF EXISTS ${database}; CREATE DATABASE ${database};"`;
        
        await execAsync(command);
        logger.info('Database dropped and recreated');
      }
      
      // Restore from backup
      let restoreCommand = `mysql -h${host} -P${port} -u${user}`;
      if (password) {
        restoreCommand += ` -p"${password}"`;
      }
      restoreCommand += ` ${database}`;
      
      // Handle compressed files
      if (backupPath.endsWith('.gz')) {
        restoreCommand = `gunzip -c "${backupPath}" | ${restoreCommand}`;
      } else {
        restoreCommand += ` < "${backupPath}"`;
      }
      
      await execAsync(restoreCommand);
      
      logger.info('MySQL restore completed successfully');
      return { success: true };
      
    } catch (error) {
      logger.error('MySQL restore failed:', error);
      throw error;
    }
  }

  async listBackups() {
    try {
      await this.ensureBackupDirectory();
      const files = await fs.readdir(this.backupDir);
      
      const backups = [];
      
      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          name: file,
          path: filePath,
          size: stats.size,
          sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          created: stats.mtime,
          type: this.getBackupType(file)
        });
      }
      
      return backups.sort((a, b) => b.created - a.created);
      
    } catch (error) {
      logger.error('Failed to list backups:', error);
      throw error;
    }
  }

  getBackupType(filename) {
    if (filename.includes('mysql')) return 'MySQL';
    if (filename.includes('mongodb')) return 'MongoDB';
    if (filename.includes('files')) return 'Files';
    return 'Unknown';
  }

  async cleanupOldBackups() {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      const toDelete = backups.filter(backup => backup.created < cutoffDate);
      
      if (toDelete.length === 0) {
        logger.info('No old backups to clean up');
        return { deleted: 0, files: [] };
      }
      
      const deletedFiles = [];
      
      for (const backup of toDelete) {
        try {
          await fs.unlink(backup.path);
          deletedFiles.push(backup.name);
          logger.info(`Deleted old backup: ${backup.name}`);
        } catch (error) {
          logger.warn(`Failed to delete backup ${backup.name}:`, error.message);
        }
      }
      
      logger.info(`Cleanup completed: ${deletedFiles.length} files deleted`);
      
      return {
        deleted: deletedFiles.length,
        files: deletedFiles
      };
      
    } catch (error) {
      logger.error('Backup cleanup failed:', error);
      throw error;
    }
  }

  async getBackupStats() {
    try {
      const backups = await this.listBackups();
      
      const stats = {
        total: backups.length,
        totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
        types: {},
        oldest: null,
        newest: null
      };
      
      stats.totalSizeFormatted = `${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`;
      
      // Group by type
      backups.forEach(backup => {
        const type = backup.type;
        if (!stats.types[type]) {
          stats.types[type] = { count: 0, size: 0 };
        }
        stats.types[type].count++;
        stats.types[type].size += backup.size;
      });
      
      // Format type sizes
      Object.keys(stats.types).forEach(type => {
        stats.types[type].sizeFormatted = `${(stats.types[type].size / 1024 / 1024).toFixed(2)} MB`;
      });
      
      if (backups.length > 0) {
        stats.oldest = backups[backups.length - 1].created;
        stats.newest = backups[0].created;
      }
      
      return stats;
      
    } catch (error) {
      logger.error('Failed to get backup stats:', error);
      throw error;
    }
  }
}

module.exports = BackupService;
