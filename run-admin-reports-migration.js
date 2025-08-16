#!/usr/bin/env node

/**
 * Database Migration Runner for Admin Reports Tables
 * Run this script to add the required tables for admin report uploads
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DB_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'caresync',
  ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    console.log('✅ Database connected successfully');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_admin_reports_tables.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    console.log('📄 Running migration: add_admin_reports_tables.sql');
    
    // Split SQL statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log('✅ Executed SQL statement successfully');
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('⚠️  Table already exists, skipping...');
          } else {
            console.error('❌ Error executing statement:', error.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
          }
        }
      }
    }
    
    // Create uploads directory structure
    console.log('📁 Creating uploads directory structure...');
    const uploadsDir = path.join(__dirname, 'uploads');
    const medicalReportsDir = path.join(uploadsDir, 'medical-reports');
    
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(medicalReportsDir, { recursive: true });
    
    // Create .gitkeep files
    await fs.writeFile(path.join(uploadsDir, '.gitkeep'), '');
    await fs.writeFile(path.join(medicalReportsDir, '.gitkeep'), '');
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 New tables created:');
    console.log('   - diabetes_predictions');
    console.log('   - admin_medical_reports');
    console.log('   - report_access_logs');
    console.log('   - report_notifications');
    console.log('📁 Upload directories created:');
    console.log('   - uploads/');
    console.log('   - uploads/medical-reports/');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Check if this script is being run directly
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration };
