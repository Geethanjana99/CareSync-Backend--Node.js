const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const redis = require('redis');

module.exports = async () => {
  console.log('Setting up test environment...');
  
  try {
    // Setup test MySQL database
    const mysqlConnection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || ''
    });

    // Create test database if it doesn't exist
    await mysqlConnection.execute(
      `CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE}`
    );
    await mysqlConnection.end();

    // Setup test MongoDB connection
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/clinical_appointment_system_test';
    await mongoose.connect(mongoUri);
    
    // Clear test database
    await mongoose.connection.db.dropDatabase();
    console.log('Test MongoDB database cleared');

    // Setup Redis connection for testing
    const redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      db: process.env.REDIS_DB || 1
    });

    await redisClient.connect();
    await redisClient.flushDb();
    await redisClient.quit();
    console.log('Test Redis database cleared');

    console.log('Test environment setup complete');
  } catch (error) {
    console.error('Error setting up test environment:', error);
    throw error;
  }
};
