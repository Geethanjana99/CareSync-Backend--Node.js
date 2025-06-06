// MySQL Database Configuration for Authentication System
// Compatible with authController.js

const mysql = require('mysql2/promise');
require('dotenv').config();

class MySQLConnection {
  constructor() {
    this.connection = null;
    this.pool = null;
  }

  async connect() {
    try {
      // Create connection pool for better performance
      this.pool = mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'clinical_appointment_system',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        // Enable multiple statements for migrations
        multipleStatements: true,
        // Timezone configuration
        timezone: '+00:00',
        // Character set
        charset: 'utf8mb4',
        // SSL configuration (if needed)
        ssl: process.env.MYSQL_SSL === 'true' ? {
          rejectUnauthorized: false
        } : false
      });

      // Test the connection
      const connection = await this.pool.getConnection();
      console.log('✅ MySQL connected successfully');
      connection.release();

      return this.pool;
    } catch (error) {
      console.error('❌ MySQL connection failed:', error.message);
      throw error;
    }
  }

  async query(sql, params = []) {
    try {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      console.error('MySQL Query Error:', error.message);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  async transaction(callback) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('MySQL connection pool closed');
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const [result] = await this.pool.execute('SELECT 1 as healthy');
      return result[0].healthy === 1;
    } catch (error) {
      console.error('MySQL health check failed:', error.message);
      return false;
    }
  }

  // Get connection statistics
  async getStats() {
    try {
      const [connections] = await this.pool.execute('SHOW STATUS LIKE "Threads_connected"');
      const [maxConnections] = await this.pool.execute('SHOW VARIABLES LIKE "max_connections"');
      
      return {
        activeConnections: connections[0].Value,
        maxConnections: maxConnections[0].Value,
        poolSize: this.pool.config.connectionLimit
      };
    } catch (error) {
      console.error('Failed to get MySQL stats:', error.message);
      return null;
    }
  }
}

// Create singleton instance
const mysqlConnection = new MySQLConnection();

module.exports = {
  mysqlConnection,
  MySQLConnection
};

// Example usage in your application:
/*
const { mysqlConnection } = require('./config/mysql');

// Initialize connection
await mysqlConnection.connect();

// Use in your models
const users = await mysqlConnection.query('SELECT * FROM users WHERE email = ?', [email]);

// Use transactions
const result = await mysqlConnection.transaction(async (connection) => {
  await connection.execute('INSERT INTO users (...) VALUES (...)', [...]);
  await connection.execute('INSERT INTO patients (...) VALUES (...)', [...]);
  return { success: true };
});
*/
