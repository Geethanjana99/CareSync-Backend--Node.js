// MongoDB Database Configuration for Authentication System
// Compatible with authController.js

const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

class MongoDBConnection {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      const dbName = process.env.MONGODB_DATABASE || 'clinical_appointment_system';

      // MongoDB connection options
      const options = {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4 // Use IPv4, skip trying IPv6
      };

      // Create MongoClient
      this.client = new MongoClient(mongoUri, options);

      // Connect to MongoDB
      await this.client.connect();

      // Select database
      this.db = this.client.db(dbName);

      // Test the connection
      await this.db.admin().ping();
      
      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');

      // Set up indexes and validation rules
      await this.setupDatabase();

      return this.db;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async setupDatabase() {
    try {
      // Create collections with validation if they don't exist
      await this.createCollectionWithValidation('users', {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["userId", "name", "email", "passwordHash", "role"],
            properties: {
              userId: { bsonType: "string" },
              name: { bsonType: "string" },
              email: { 
                bsonType: "string", 
                pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" 
              },
              passwordHash: { bsonType: "string" },
              role: { enum: ["patient", "doctor", "admin", "billing"] },
              isActive: { bsonType: "bool" },
              emailVerified: { bsonType: "bool" }
            }
          }
        }
      });

      // Create indexes
      await this.createIndexes();

      console.log('✅ MongoDB database setup completed');
    } catch (error) {
      console.error('❌ MongoDB setup failed:', error.message);
      throw error;
    }
  }

  async createCollectionWithValidation(collectionName, options) {
    try {
      const collections = await this.db.listCollections({ name: collectionName }).toArray();
      if (collections.length === 0) {
        await this.db.createCollection(collectionName, options);
        console.log(`✅ Created collection: ${collectionName}`);
      }
    } catch (error) {
      if (error.codeName !== 'NamespaceExists') {
        throw error;
      }
    }
  }

  async createIndexes() {
    try {
      // Users collection indexes
      await this.db.collection('users').createIndexes([
        { key: { email: 1 }, unique: true },
        { key: { userId: 1 }, unique: true },
        { key: { role: 1 } },
        { key: { isActive: 1 } },
        { key: { 'passwordReset.token': 1 } },
        { key: { 'emailVerification.token': 1 } },
        { key: { createdAt: 1 } }
      ]);

      // Patients collection indexes
      await this.db.collection('patients').createIndexes([
        { key: { userId: 1 }, unique: true },
        { key: { patientId: 1 }, unique: true },
        { key: { status: 1 } },
        { key: { 'personalInfo.dateOfBirth': 1 } },
        { key: { createdAt: 1 } },
        { key: { 'healthMetrics.date': -1 } }
      ]);

      // Doctors collection indexes
      await this.db.collection('doctors').createIndexes([
        { key: { userId: 1 }, unique: true },
        { key: { doctorId: 1 }, unique: true },
        { key: { 'professionalInfo.licenseNumber': 1 }, unique: true },
        { key: { 'professionalInfo.specialty': 1 } },
        { key: { status: 1 } },
        { key: { 'performance.rating': -1 } },
        { key: { 'availability.currentStatus': 1 } },
        { key: { createdAt: 1 } }
      ]);

      // Refresh tokens collection indexes with TTL
      await this.db.collection('refreshTokens').createIndexes([
        { key: { userId: 1 } },
        { key: { tokenHash: 1 }, unique: true },
        { key: { expiresAt: 1 }, expireAfterSeconds: 0 }, // TTL index
        { key: { isRevoked: 1 } },
        { key: { createdAt: 1 } }
      ]);

      // User sessions collection indexes with TTL
      await this.db.collection('userSessions').createIndexes([
        { key: { userId: 1 } },
        { key: { sessionToken: 1 }, unique: true },
        { key: { isActive: 1 } },
        { key: { expiresAt: 1 }, expireAfterSeconds: 0 }, // TTL index
        { key: { lastActivity: 1 } }
      ]);

      // Login attempts collection indexes with TTL
      await this.db.collection('loginAttempts').createIndexes([
        { key: { email: 1 } },
        { key: { ipAddress: 1 } },
        { key: { success: 1 } },
        { key: { attemptedAt: 1 }, expireAfterSeconds: 7776000 }, // 90 days TTL
        { key: { email: 1, attemptedAt: -1 } }
      ]);

      // Audit logs collection indexes with TTL
      await this.db.collection('auditLogs').createIndexes([
        { key: { userId: 1 } },
        { key: { action: 1 } },
        { key: { resource: 1 } },
        { key: { timestamp: -1 } },
        { key: { severity: 1 } },
        { key: { category: 1 } },
        { key: { userId: 1, timestamp: -1 } },
        { key: { timestamp: 1 }, expireAfterSeconds: 63072000 } // 2 years TTL
      ]);

      console.log('✅ All MongoDB indexes created successfully');
    } catch (error) {
      console.error('❌ Failed to create indexes:', error.message);
      throw error;
    }
  }

  // Generic collection operations
  getCollection(collectionName) {
    if (!this.isConnected) {
      throw new Error('MongoDB is not connected');
    }
    return this.db.collection(collectionName);
  }

  async findOne(collectionName, query, options = {}) {
    const collection = this.getCollection(collectionName);
    return await collection.findOne(query, options);
  }

  async findMany(collectionName, query, options = {}) {
    const collection = this.getCollection(collectionName);
    return await collection.find(query, options).toArray();
  }

  async insertOne(collectionName, document) {
    const collection = this.getCollection(collectionName);
    const result = await collection.insertOne({
      ...document,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return result;
  }

  async updateOne(collectionName, filter, update, options = {}) {
    const collection = this.getCollection(collectionName);
    const result = await collection.updateOne(
      filter, 
      { 
        ...update, 
        $set: { 
          ...update.$set, 
          updatedAt: new Date() 
        } 
      }, 
      options
    );
    return result;
  }

  async deleteOne(collectionName, filter) {
    const collection = this.getCollection(collectionName);
    return await collection.deleteOne(filter);
  }

  // Transaction support
  async withTransaction(callback) {
    const session = this.client.startSession();
    try {
      const result = await session.withTransaction(callback);
      return result;
    } finally {
      await session.endSession();
    }
  }

  // Health check
  async healthCheck() {
    try {
      await this.db.admin().ping();
      return true;
    } catch (error) {
      console.error('MongoDB health check failed:', error.message);
      return false;
    }
  }

  // Get database statistics
  async getStats() {
    try {
      const stats = await this.db.stats();
      return {
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        isConnected: this.isConnected
      };
    } catch (error) {
      console.error('Failed to get MongoDB stats:', error.message);
      return null;
    }
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('MongoDB connection closed');
    }
  }
}

// Create singleton instance
const mongoConnection = new MongoDBConnection();

module.exports = {
  mongoConnection,
  MongoDBConnection
};

// Example usage in your application:
/*
const { mongoConnection } = require('./config/mongodb');

// Initialize connection
await mongoConnection.connect();

// Use in your models
const user = await mongoConnection.findOne('users', { email: 'user@example.com' });

// Use transactions
const result = await mongoConnection.withTransaction(async (session) => {
  await mongoConnection.insertOne('users', userData);
  await mongoConnection.insertOne('patients', patientData);
  return { success: true };
});
*/
