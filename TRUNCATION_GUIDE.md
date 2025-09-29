# Database Truncation Guide

This folder contains several tools to safely truncate all tables in your CareSync database while handling foreign key constraints properly.

## Prerequisites

1. **MySQL Server must be running**
   - Windows: `net start mysql` (run as administrator)
   - Or start via XAMPP, WAMP, MySQL Workbench
   - Default port: 3306

2. **Database must exist**
   - Database name: `caresync`
   - If not exists, create with: `CREATE DATABASE caresync;`

## Truncation Scripts

### 1. `comprehensive-truncate.js` (Recommended)
**Most robust solution with error handling and multiple connection attempts**

```bash
node comprehensive-truncate.js
```

**Features:**
- Tries multiple MySQL connection configurations
- Handles foreign key constraints automatically
- Shows before/after data counts
- Provides detailed success/failure reporting
- Fallback from TRUNCATE to DELETE if needed
- Resets auto-increment counters

### 2. `smart-truncate-tables.js`
**Dependency-aware truncation respecting foreign key order**

```bash
node smart-truncate-tables.js
```

**Features:**
- Truncates tables in proper dependency order
- Two methods: foreign key disable + dependency order fallback
- Pre-defined table order based on schema analysis

### 3. `truncate-all-tables.js`
**Simple truncation with foreign key disable**

```bash
node truncate-all-tables.js
```

**Features:**
- Basic truncation with 3-second warning
- Disables foreign keys, truncates all, re-enables

## Manual SQL Method

If scripts fail, you can run this SQL manually:

```sql
-- Connect to caresync database
USE caresync;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Get list of all tables (run this first to see your tables)
SHOW TABLES;

-- Truncate each table (replace with your actual table names)
TRUNCATE TABLE login_attempts;
TRUNCATE TABLE email_verification_tokens;
TRUNCATE TABLE password_reset_requests;
TRUNCATE TABLE user_sessions;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE invoice_items;
TRUNCATE TABLE reviews;
TRUNCATE TABLE billing;
TRUNCATE TABLE invoices;
TRUNCATE TABLE medical_reports;
TRUNCATE TABLE diabetes_predictions;
TRUNCATE TABLE report_access_logs;
TRUNCATE TABLE queue_status;
TRUNCATE TABLE appointments;
TRUNCATE TABLE patients;
TRUNCATE TABLE doctors;
TRUNCATE TABLE users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify all tables are empty
SELECT 
  TABLE_NAME,
  TABLE_ROWS
FROM 
  INFORMATION_SCHEMA.TABLES 
WHERE 
  TABLE_SCHEMA = 'caresync' 
  AND TABLE_TYPE = 'BASE TABLE';
```

## Troubleshooting

### MySQL Connection Issues
1. **"Cannot connect to MySQL server"**
   - Start MySQL service: `net start mysql`
   - Check if MySQL is running on port 3306
   - Verify MySQL is installed

2. **"Access denied"**
   - Check username/password (default: root with no password)
   - Update connection settings in scripts if needed

3. **"Database 'caresync' doesn't exist"**
   - Create database: `CREATE DATABASE caresync;`
   - Or run setup script: `node scripts/setupDatabase.js`

### Foreign Key Constraint Issues
1. **"Cannot delete or update a parent row"**
   - Use `comprehensive-truncate.js` (handles this automatically)
   - Or manually disable foreign key checks before truncation

2. **"Table doesn't exist"**
   - Some tables in the predefined order might not exist in your schema
   - Scripts handle this gracefully by checking existing tables first

## After Truncation

Once tables are truncated, you can:

1. **Repopulate with fresh data**
   ```bash
   node scripts/setupDatabase.js    # Create basic schema + admin user
   node scripts/seedDatabase.js     # Add sample data
   ```

2. **Verify clean state**
   ```bash
   node check-mysql-setup.js       # Check database status
   ```

3. **Start fresh development**
   - All auto-increment counters reset to 1
   - All foreign key relationships preserved
   - Database structure intact, only data removed

## Safety Notes

⚠️ **WARNING**: These scripts will permanently delete ALL data from ALL tables

- **Backup important data** before running
- **Test on development database** first
- **Cannot be undone** once executed
- **Preserves table structure** and relationships

✅ **Safe to run on**: Development, testing, staging environments
❌ **Never run on**: Production databases without proper backups