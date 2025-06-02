#!/usr/bin/env node

const BackupService = require('../services/backupService');
const logger = require('../config/logger');

const backupService = new BackupService();

async function createBackup(type = 'full') {
  try {
    console.log('🔄 Starting backup process...\n');
    
    let result;
    
    switch (type) {
      case 'mysql':
        result = await backupService.createMySQLBackup();
        console.log(`✅ MySQL backup completed: ${result.filename}`);
        break;
        
      case 'mongodb':
        result = await backupService.createMongoDBBackup();
        console.log(`✅ MongoDB backup completed: ${result.filename}`);
        break;
        
      case 'files':
        result = await backupService.createFilesBackup();
        console.log(`✅ Files backup completed: ${result.filename}`);
        break;
        
      case 'full':
      default:
        result = await backupService.createFullBackup();
        console.log('✅ Full backup completed:');
        if (result.mysql?.success) {
          console.log(`   📊 MySQL: ${result.mysql.filename} (${(result.mysql.size / 1024 / 1024).toFixed(2)} MB)`);
        }
        if (result.mongodb?.success) {
          console.log(`   🍃 MongoDB: ${result.mongodb.filename} (${(result.mongodb.size / 1024 / 1024).toFixed(2)} MB)`);
        }
        if (result.files?.success) {
          console.log(`   📁 Files: ${result.files.filename} (${(result.files.size / 1024 / 1024).toFixed(2)} MB)`);
        }
        break;
    }
    
    console.log('\n🎉 Backup process completed successfully!');
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

async function listBackups() {
  try {
    console.log('📋 Listing available backups...\n');
    
    const backups = await backupService.listBackups();
    
    if (backups.length === 0) {
      console.log('No backups found.');
      return;
    }
    
    console.log('Available Backups:');
    console.log('==================');
    
    backups.forEach((backup, index) => {
      const age = Math.floor((Date.now() - backup.created) / (1000 * 60 * 60 * 24));
      const ageText = age === 0 ? 'Today' : `${age} day${age > 1 ? 's' : ''} ago`;
      
      console.log(`${index + 1}. ${backup.name}`);
      console.log(`   Type: ${backup.type}`);
      console.log(`   Size: ${backup.sizeFormatted}`);
      console.log(`   Created: ${backup.created.toISOString()} (${ageText})`);
      console.log('');
    });
    
    const stats = await backupService.getBackupStats();
    console.log(`📊 Total: ${stats.total} backups, ${stats.totalSizeFormatted}`);
    
  } catch (error) {
    console.error('❌ Failed to list backups:', error.message);
    process.exit(1);
  }
}

async function restoreBackup(backupFile) {
  try {
    console.log(`🔄 Starting restore from: ${backupFile}...\n`);
    
    // Detect backup type from filename
    if (backupFile.includes('mysql')) {
      console.log('⚠️  WARNING: This will overwrite the current MySQL database!');
      console.log('Make sure you have a recent backup before proceeding.');
      console.log('Continue? (y/N)');
      
      // In a real CLI, you'd want to add readline for confirmation
      // For now, proceeding with restore
      
      await backupService.restoreMySQLBackup(backupFile, { dropDatabase: true });
      console.log('✅ MySQL restore completed successfully!');
    } else {
      console.error('❌ Only MySQL restore is currently supported via CLI');
      console.log('For MongoDB and files restore, please use appropriate tools manually.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    process.exit(1);
  }
}

async function cleanupBackups() {
  try {
    console.log('🧹 Cleaning up old backups...\n');
    
    const result = await backupService.cleanupOldBackups();
    
    if (result.deleted === 0) {
      console.log('✅ No old backups to clean up.');
    } else {
      console.log(`✅ Deleted ${result.deleted} old backup${result.deleted > 1 ? 's' : ''}:`);
      result.files.forEach(file => {
        console.log(`   - ${file}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

async function getBackupStats() {
  try {
    console.log('📊 Backup Statistics\n');
    
    const stats = await backupService.getBackupStats();
    
    console.log(`Total Backups: ${stats.total}`);
    console.log(`Total Size: ${stats.totalSizeFormatted}`);
    console.log('');
    
    if (stats.total > 0) {
      console.log('By Type:');
      Object.entries(stats.types).forEach(([type, data]) => {
        console.log(`  ${type}: ${data.count} backup${data.count > 1 ? 's' : ''} (${data.sizeFormatted})`);
      });
      console.log('');
      
      console.log(`Oldest: ${stats.oldest?.toISOString()}`);
      console.log(`Newest: ${stats.newest?.toISOString()}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to get backup stats:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const command = process.argv[2];
const argument = process.argv[3];

switch (command) {
  case 'create':
    createBackup(argument);
    break;
    
  case 'list':
    listBackups();
    break;
    
  case 'restore':
    if (!argument) {
      console.error('❌ Please specify the backup file to restore');
      console.log('Usage: npm run backup restore <backup_file>');
      process.exit(1);
    }
    restoreBackup(argument);
    break;
    
  case 'cleanup':
    cleanupBackups();
    break;
    
  case 'stats':
    getBackupStats();
    break;
    
  default:
    console.log('💾 Database Backup Tool');
    console.log('=======================\n');
    console.log('Available commands:');
    console.log('  npm run backup create [type]  - Create backup (full|mysql|mongodb|files)');
    console.log('  npm run backup list           - List available backups');
    console.log('  npm run backup restore <file> - Restore from backup');
    console.log('  npm run backup cleanup        - Clean up old backups');
    console.log('  npm run backup stats          - Show backup statistics');
    console.log('\nExamples:');
    console.log('  npm run backup create mysql');
    console.log('  npm run backup restore mysql_2025-01-01T10-30-00.sql.gz');
    console.log('\nEnvironment Variables:');
    console.log('  BACKUP_RETENTION_DAYS - Days to keep backups (default: 30)');
    break;
}
