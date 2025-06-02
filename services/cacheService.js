const redis = require('redis');
const logger = require('../config/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      if (process.env.NODE_ENV === 'test') {
        // Skip Redis in test environment
        logger.info('Skipping Redis connection in test environment');
        return;
      }

      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        db: parseInt(process.env.REDIS_DB) || 0,
        retryDelayOnFailover: 100,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      };

      if (process.env.REDIS_PASSWORD) {
        redisConfig.password = process.env.REDIS_PASSWORD;
      }

      this.client = redis.createClient(redisConfig);

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.warn('Redis client disconnected');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        this.reconnectAttempts++;
        logger.info(`Redis client reconnecting... Attempt ${this.reconnectAttempts}`);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          logger.error('Max Redis reconnection attempts reached');
          this.client.disconnect();
        }
      });

      await this.client.connect();
      logger.info('Redis cache service initialized');
    } catch (error) {
      logger.error('Failed to initialize Redis cache service:', error);
      // Don't throw error - app should work without Redis
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      try {
        await this.client.disconnect();
        logger.info('Redis client disconnected');
      } catch (error) {
        logger.error('Error disconnecting Redis client:', error);
      }
    }
  }

  isReady() {
    return this.client && this.isConnected;
  }

  // Generic cache methods
  async get(key) {
    if (!this.isReady()) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async expire(key, ttlSeconds) {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.client.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  async flushAll() {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      logger.error('Cache flush all error:', error);
      return false;
    }
  }

  // Specialized methods for the application
  async cacheUserSession(userId, sessionData, ttlSeconds = 86400) {
    const key = `session:${userId}`;
    return await this.set(key, sessionData, ttlSeconds);
  }

  async getUserSession(userId) {
    const key = `session:${userId}`;
    return await this.get(key);
  }

  async invalidateUserSession(userId) {
    const key = `session:${userId}`;
    return await this.del(key);
  }

  async cacheDoctorAvailability(doctorId, date, slots, ttlSeconds = 1800) {
    const key = `availability:${doctorId}:${date}`;
    return await this.set(key, slots, ttlSeconds);
  }

  async getDoctorAvailability(doctorId, date) {
    const key = `availability:${doctorId}:${date}`;
    return await this.get(key);
  }

  async invalidateDoctorAvailability(doctorId, date = null) {
    if (date) {
      const key = `availability:${doctorId}:${date}`;
      return await this.del(key);
    } else {
      // Clear all availability for doctor
      const pattern = `availability:${doctorId}:*`;
      return await this.clearPattern(pattern);
    }
  }

  async cacheAppointmentStats(userId, role, stats, ttlSeconds = 300) {
    const key = `stats:${role}:${userId}`;
    return await this.set(key, stats, ttlSeconds);
  }

  async getAppointmentStats(userId, role) {
    const key = `stats:${role}:${userId}`;
    return await this.get(key);
  }

  async cacheDoctorList(filters, doctors, ttlSeconds = 600) {
    const filterKey = Object.keys(filters).sort().map(k => `${k}:${filters[k]}`).join('|');
    const key = `doctors:${Buffer.from(filterKey).toString('base64')}`;
    return await this.set(key, doctors, ttlSeconds);
  }

  async getDoctorList(filters) {
    const filterKey = Object.keys(filters).sort().map(k => `${k}:${filters[k]}`).join('|');
    const key = `doctors:${Buffer.from(filterKey).toString('base64')}`;
    return await this.get(key);
  }

  async cachePatientReports(patientId, reports, ttlSeconds = 1800) {
    const key = `reports:${patientId}`;
    return await this.set(key, reports, ttlSeconds);
  }

  async getPatientReports(patientId) {
    const key = `reports:${patientId}`;
    return await this.get(key);
  }

  async invalidatePatientReports(patientId) {
    const key = `reports:${patientId}`;
    return await this.del(key);
  }

  // Rate limiting support
  async incrementRateLimit(key, windowSeconds = 900) {
    if (!this.isReady()) {
      return { count: 0, ttl: windowSeconds };
    }

    try {
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, windowSeconds);
      const results = await multi.exec();
      
      const count = results[0];
      const ttl = await this.client.ttl(key);
      
      return { count, ttl: ttl > 0 ? ttl : windowSeconds };
    } catch (error) {
      logger.error(`Rate limit increment error for key ${key}:`, error);
      return { count: 0, ttl: windowSeconds };
    }
  }

  async getRateLimit(key) {
    if (!this.isReady()) {
      return { count: 0, ttl: 0 };
    }

    try {
      const count = await this.client.get(key) || 0;
      const ttl = await this.client.ttl(key);
      return { count: parseInt(count), ttl: ttl > 0 ? ttl : 0 };
    } catch (error) {
      logger.error(`Rate limit get error for key ${key}:`, error);
      return { count: 0, ttl: 0 };
    }
  }

  // Helper method to clear keys by pattern
  async clearPattern(pattern) {
    if (!this.isReady()) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error(`Clear pattern error for ${pattern}:`, error);
      return false;
    }
  }

  // Health check
  async healthCheck() {
    if (!this.isReady()) {
      return { status: 'disconnected', latency: null };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;
      return { status: 'connected', latency };
    } catch (error) {
      return { status: 'error', latency: null, error: error.message };
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
