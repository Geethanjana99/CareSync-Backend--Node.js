const mongoose = require('mongoose');
const logger = require('./logger');

class MongoDBConnection {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/clinical_medical_records';
      
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0
      };

      this.connection = await mongoose.connect(uri, options);
      
      // Set up connection event listeners
      mongoose.connection.on('connected', () => {
        logger.info('✅ MongoDB connected successfully');
      });

      mongoose.connection.on('error', (error) => {
        logger.error('❌ MongoDB connection error:', error.message);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️ MongoDB disconnected');
      });

      // Handle application termination
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      });

      return this.connection;
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  getConnection() {
    return mongoose.connection;
  }

  async close() {
    if (this.connection) {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    }
  }

  // Helper method to check if connected
  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  // Get connection status
  getStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[mongoose.connection.readyState];
  }
}

const mongoConnection = new MongoDBConnection();

module.exports = async () => {
  return await mongoConnection.connect();
};

module.exports.mongoConnection = mongoConnection;
