const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
const logger = require('../config/logger');

class MigrationRunner {
  constructor(config) {
    this.config = config;
    this.connection = null;
    this.migrationsPath = path.join(__dirname, '../migrations');
  }

  async connect() {
    try {
      this.connection = await mysql.createConnection({
        host: this.config.host,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        multipleStatements: true
      });
      logger.info('Connected to database for migrations');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      logger.info('Disconnected from database');
    }
  }

  async createMigrationsTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_migration_name (migration_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await this.connection.execute(createTableSQL);
    logger.info('Migrations table ensured');
  }

  async getExecutedMigrations() {
    try {
      const [rows] = await this.connection.execute(
        'SELECT migration_name FROM migrations ORDER BY executed_at'
      );
      return rows.map(row => row.migration_name);
    } catch (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'ER_NO_SUCH_TABLE') {
        return [];
      }
      throw error;
    }
  }

  async getPendingMigrations() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort();

      const executedMigrations = await this.getExecutedMigrations();
      
      return migrationFiles.filter(file => !executedMigrations.includes(file));
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn('Migrations directory not found');
        return [];
      }
      throw error;
    }
  }

  async executeMigration(migrationFile) {
    const migrationPath = path.join(this.migrationsPath, migrationFile);
    
    try {
      const migrationSQL = await fs.readFile(migrationPath, 'utf8');
      
      logger.info(`Executing migration: ${migrationFile}`);
      
      // Start transaction
      await this.connection.beginTransaction();
      
      try {
        // Execute the migration SQL
        await this.connection.query(migrationSQL);
        
        // Record the migration as executed
        await this.connection.execute(
          'INSERT INTO migrations (migration_name) VALUES (?)',
          [migrationFile]
        );
        
        // Commit transaction
        await this.connection.commit();
        
        logger.info(`Successfully executed migration: ${migrationFile}`);
        return true;
      } catch (error) {
        // Rollback transaction on error
        await this.connection.rollback();
        throw error;
      }
    } catch (error) {
      logger.error(`Failed to execute migration ${migrationFile}:`, error);
      throw error;
    }
  }

  async runMigrations() {
    try {
      await this.connect();
      await this.createMigrationsTable();
      
      const pendingMigrations = await this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return { executed: 0, migrations: [] };
      }
      
      logger.info(`Found ${pendingMigrations.length} pending migrations`);
      
      const executedMigrations = [];
      
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
        executedMigrations.push(migration);
      }
      
      logger.info(`Successfully executed ${executedMigrations.length} migrations`);
      
      return {
        executed: executedMigrations.length,
        migrations: executedMigrations
      };
    } catch (error) {
      logger.error('Migration execution failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async rollbackMigration(migrationFile) {
    try {
      await this.connect();
      
      // Check if migration was executed
      const [rows] = await this.connection.execute(
        'SELECT id FROM migrations WHERE migration_name = ?',
        [migrationFile]
      );
      
      if (rows.length === 0) {
        throw new Error(`Migration ${migrationFile} was not executed`);
      }
      
      // Look for rollback file
      const rollbackFile = migrationFile.replace('.sql', '_rollback.sql');
      const rollbackPath = path.join(this.migrationsPath, rollbackFile);
      
      try {
        const rollbackSQL = await fs.readFile(rollbackPath, 'utf8');
        
        logger.info(`Rolling back migration: ${migrationFile}`);
        
        await this.connection.beginTransaction();
        
        try {
          // Execute rollback SQL
          await this.connection.query(rollbackSQL);
          
          // Remove migration record
          await this.connection.execute(
            'DELETE FROM migrations WHERE migration_name = ?',
            [migrationFile]
          );
          
          await this.connection.commit();
          
          logger.info(`Successfully rolled back migration: ${migrationFile}`);
          return true;
        } catch (error) {
          await this.connection.rollback();
          throw error;
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error(`Rollback file not found: ${rollbackFile}`);
        }
        throw error;
      }
    } catch (error) {
      logger.error(`Failed to rollback migration ${migrationFile}:`, error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async getMigrationStatus() {
    try {
      await this.connect();
      await this.createMigrationsTable();
      
      const allFiles = await fs.readdir(this.migrationsPath);
      const migrationFiles = allFiles
        .filter(file => file.endsWith('.sql') && !file.endsWith('_rollback.sql'))
        .sort();
      
      const executedMigrations = await this.getExecutedMigrations();
      
      const status = migrationFiles.map(file => ({
        name: file,
        executed: executedMigrations.includes(file),
        executedAt: null
      }));
      
      // Get execution timestamps
      if (executedMigrations.length > 0) {
        const [rows] = await this.connection.execute(
          'SELECT migration_name, executed_at FROM migrations WHERE migration_name IN (?)',
          [executedMigrations]
        );
        
        const executionMap = new Map(rows.map(row => [row.migration_name, row.executed_at]));
        
        status.forEach(migration => {
          if (migration.executed) {
            migration.executedAt = executionMap.get(migration.name);
          }
        });
      }
      
      return status;
    } catch (error) {
      logger.error('Failed to get migration status:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async createMigration(name, content = '') {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const migrationName = `${timestamp}_${name.replace(/[^a-zA-Z0-9]/g, '_')}.sql`;
    const migrationPath = path.join(this.migrationsPath, migrationName);
    
    const migrationTemplate = content || `-- Migration: ${migrationName}
-- Description: ${name}
-- Created: ${new Date().toISOString()}

-- Add your migration SQL here

-- Example:
-- ALTER TABLE users ADD COLUMN new_field VARCHAR(255);
-- CREATE INDEX idx_new_field ON users(new_field);
`;
    
    try {
      await fs.writeFile(migrationPath, migrationTemplate);
      logger.info(`Created migration file: ${migrationName}`);
      return migrationName;
    } catch (error) {
      logger.error(`Failed to create migration file: ${error.message}`);
      throw error;
    }
  }
}

module.exports = MigrationRunner;
