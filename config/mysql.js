const mysql = require('mysql2/promise');
const logger = require('./logger');

class MySQLConnection {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {      this.pool = mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'clinical_appointment_system',
        connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT) || 10,
        queueLimit: 0,
        idleTimeout: 300000,
        charset: 'utf8mb4',
        timezone: '+00:00',
        supportBigNumbers: true,
        bigNumberStrings: true
      });

      // Test the connection
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
      logger.info('✅ MySQL database connected successfully');
      return this.pool;
    } catch (error) {
      logger.error('❌ MySQL connection failed:', error.message);
      throw error;
    }
  }

  async query(sql, params = []) {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      logger.error('MySQL query error:', error.message);
      throw error;
    }
  }

  async transaction(queries) {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const results = [];
      for (const { sql, params } of queries) {
        const [result] = await connection.execute(sql, params || []);
        results.push(result);
      }
      
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      logger.error('MySQL transaction error:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  getPool() {
    return this.pool;
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('MySQL connection pool closed');
    }
  }
}

const mysqlConnection = new MySQLConnection();

module.exports = async () => {
  return await mysqlConnection.connect();
};

module.exports.mysqlConnection = mysqlConnection;
