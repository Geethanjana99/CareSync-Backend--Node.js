#!/usr/bin/env node
/**
 * Verify and create required MySQL tables for Admin Reports module
 * - diabetes_predictions
 * - admin_medical_reports
 *
 * Uses backend/config/mysql.js connection (Aiven credentials from env)
 */

const path = require('path');
const fs = require('fs');

// Load .env if present
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {}

const connectMySQL = require('../config/mysql');
const { mysqlConnection } = require('../config/mysql');

async function getCurrentDatabase() {
  const rows = await mysqlConnection.query('SELECT DATABASE() AS db');
  return rows[0].db;
}

async function tableExists(dbName, tableName) {
  const sql = `SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`;
  const rows = await mysqlConnection.query(sql, [dbName, tableName]);
  return rows[0].cnt > 0;
}

async function ensureDiabetesPredictions() {
  const db = await getCurrentDatabase();
  const name = 'diabetes_predictions';
  const exists = await tableExists(db, name);
  if (exists) {
    console.log(`✔ Table ${name} exists in ${db}`);
    return;
  }

  console.log(`⏳ Creating table ${name} in ${db} ...`);
  const createSql = `
    CREATE TABLE ${name} (
      id VARCHAR(36) PRIMARY KEY,
      patient_id VARCHAR(36) NOT NULL,
      admin_id VARCHAR(36) NOT NULL,
      pregnancies INT DEFAULT 0,
      glucose DECIMAL(10,2) NOT NULL,
      bmi DECIMAL(10,2) NOT NULL,
      age INT NOT NULL,
      insulin DECIMAL(10,2) DEFAULT 0,
      prediction_result TINYINT NULL,
      prediction_probability DECIMAL(5,4) NULL,
      risk_level ENUM('low','medium','high') NULL,
      status ENUM('pending','processed','reviewed') NOT NULL DEFAULT 'pending',
      notes TEXT NULL,
      processed_at DATETIME NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      INDEX idx_dp_patient (patient_id),
      INDEX idx_dp_admin (admin_id),
      INDEX idx_dp_status (status),
      INDEX idx_dp_risk (risk_level),
      INDEX idx_dp_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await mysqlConnection.query(createSql);
  console.log(`✅ Created table ${name}`);
}

async function ensureAdminMedicalReports() {
  const db = await getCurrentDatabase();
  const name = 'admin_medical_reports';
  const exists = await tableExists(db, name);
  if (exists) {
    console.log(`✔ Table ${name} exists in ${db}`);
    return;
  }

  console.log(`⏳ Creating table ${name} in ${db} ...`);
  const createSql = `
    CREATE TABLE ${name} (
      id VARCHAR(36) PRIMARY KEY,
      patient_id VARCHAR(36) NOT NULL,
      admin_id VARCHAR(36) NOT NULL,
      report_type ENUM('blood_test','urine_test','x_ray','mri','ct_scan','ultrasound','ecg','prescription','discharge_summary','lab_report','other') NOT NULL,
      title VARCHAR(255) NULL,
      description TEXT NULL,
      file_name VARCHAR(255) NOT NULL,
      original_file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_hash VARCHAR(64) NULL,
      tags JSON NULL,
      metadata JSON NULL,
      is_confidential TINYINT(1) NOT NULL DEFAULT 0,
      expiry_date DATETIME NULL,
      status ENUM('uploaded','processing','processed','reviewed','archived') NOT NULL DEFAULT 'uploaded',
      notes TEXT NULL,
      upload_source VARCHAR(50) NOT NULL DEFAULT 'admin_portal',
      reviewed_at DATETIME NULL,
      reviewed_by VARCHAR(36) NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      INDEX idx_amr_patient (patient_id),
      INDEX idx_amr_admin (admin_id),
      INDEX idx_amr_type (report_type),
      INDEX idx_amr_status (status),
      INDEX idx_amr_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await mysqlConnection.query(createSql);
  console.log(`✅ Created table ${name}`);
}

async function main() {
  try {
    // Connect pool
    await connectMySQL();
    const db = await getCurrentDatabase();
    console.log(`Connected to MySQL database: ${db}`);

    await ensureDiabetesPredictions();
    await ensureAdminMedicalReports();

    // Show brief schema
    const [dpDesc, amrDesc] = await Promise.all([
      mysqlConnection.query('DESCRIBE diabetes_predictions'),
      mysqlConnection.query('DESCRIBE admin_medical_reports')
    ]);
    console.log('\n— diabetes_predictions —');
    console.table(dpDesc);
    console.log('\n— admin_medical_reports —');
    console.table(amrDesc);

    process.exit(0);
  } catch (err) {
    console.error('Error ensuring tables:', err && err.message ? err.message : err);
    process.exit(1);
  } finally {
    try { await mysqlConnection.close?.(); } catch {}
  }
}

main();
