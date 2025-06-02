const Redis = require('redis');
const logger = require('../config/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = Redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        retryDelayOnConnectTimeout: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Connected to Redis server');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.info('Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
      
      // Test connection
      await this.client.ping();
      logger.info('Redis cache service initialized successfully');
      
    } catch (error) {
      logger.warn('Redis connection failed, running without cache:', error.message);
      this.isConnected = false;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis cache service disconnected');
    }
  }

  // Basic cache operations
  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  async expire(key, seconds) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  }

  async ttl(key) {
    if (!this.isConnected) return -1;
    
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Cache TTL error:', error);
      return -1;
    }
  }

  // Pattern-based operations
  async keys(pattern) {
    if (!this.isConnected) return [];
    
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Cache keys error:', error);
      return [];
    }
  }

  async deletePattern(pattern) {
    if (!this.isConnected) return false;
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // Application-specific cache methods
  async cacheUserSession(userId, sessionData, ttlSeconds = 3600) {
    const key = `session:${userId}`;
    return await this.set(key, sessionData, ttlSeconds);
  }

  async getUserSession(userId) {
    const key = `session:${userId}`;
    return await this.get(key);
  }

  async clearUserSession(userId) {
    const key = `session:${userId}`;
    return await this.del(key);
  }

  async cacheDoctorAvailability(doctorId, date, availability, ttlSeconds = 1800) {
    const key = `availability:${doctorId}:${date}`;
    return await this.set(key, availability, ttlSeconds);
  }

  async getDoctorAvailability(doctorId, date) {
    const key = `availability:${doctorId}:${date}`;
    return await this.get(key);
  }

  async clearDoctorAvailability(doctorId, date = null) {
    if (date) {
      const key = `availability:${doctorId}:${date}`;
      return await this.del(key);
    } else {
      const pattern = `availability:${doctorId}:*`;
      return await this.deletePattern(pattern);
    }
  }

  async cacheAppointmentSlots(doctorId, date, slots, ttlSeconds = 900) {
    const key = `slots:${doctorId}:${date}`;
    return await this.set(key, slots, ttlSeconds);
  }

  async getAppointmentSlots(doctorId, date) {
    const key = `slots:${doctorId}:${date}`;
    return await this.get(key);
  }

  async clearAppointmentSlots(doctorId, date = null) {
    if (date) {
      const key = `slots:${doctorId}:${date}`;
      return await this.del(key);
    } else {
      const pattern = `slots:${doctorId}:*`;
      return await this.deletePattern(pattern);
    }
  }

  async cachePatientHistory(patientId, history, ttlSeconds = 1800) {
    const key = `history:patient:${patientId}`;
    return await this.set(key, history, ttlSeconds);
  }

  async getPatientHistory(patientId) {
    const key = `history:patient:${patientId}`;
    return await this.get(key);
  }

  async clearPatientHistory(patientId) {
    const key = `history:patient:${patientId}`;
    return await this.del(key);
  }

  async cacheDoctorProfile(doctorId, profile, ttlSeconds = 3600) {
    const key = `profile:doctor:${doctorId}`;
    return await this.set(key, profile, ttlSeconds);
  }

  async getDoctorProfile(doctorId) {
    const key = `profile:doctor:${doctorId}`;
    return await this.get(key);
  }

  async clearDoctorProfile(doctorId) {
    const key = `profile:doctor:${doctorId}`;
    return await this.del(key);
  }

  // Rate limiting
  async incrementRateLimit(key, windowSeconds = 60, maxRequests = 100) {
    if (!this.isConnected) return { count: 0, remaining: maxRequests, reset: Date.now() + windowSeconds * 1000 };
    
    try {
      const current = await this.client.incr(key);
      
      if (current === 1) {
        await this.client.expire(key, windowSeconds);
      }
      
      const ttl = await this.client.ttl(key);
      const reset = Date.now() + ttl * 1000;
      const remaining = Math.max(0, maxRequests - current);
      
      return {
        count: current,
        remaining,
        reset,
        exceeded: current > maxRequests
      };
    } catch (error) {
      logger.error('Rate limit error:', error);
      return { count: 0, remaining: maxRequests, reset: Date.now() + windowSeconds * 1000 };
    }
  }

  // Statistics and monitoring
  async getStats() {
    if (!this.isConnected) return null;
    
    try {
      const info = await this.client.info();
      const keyCount = await this.client.dbSize();
      
      return {
        connected: this.isConnected,
        keyCount,
        info
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }

  async flushAll() {
    if (!this.isConnected) return false;
    
    try {
      await this.client.flushAll();
      logger.info('Cache flushed successfully');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  // Health check
  async healthCheck() {
    if (!this.isConnected) return false;
    
    try {
      const response = await this.client.ping();
      return response === 'PONG';
    } catch (error) {
      logger.error('Cache health check error:', error);
      return false;
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;