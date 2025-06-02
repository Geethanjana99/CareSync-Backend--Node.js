const os = require('os');
const { mysqlConnection } = require('../config/mysql');
const { mongoConnection } = require('../config/mongodb');
const cacheService = require('./cacheService');
const logger = require('../config/logger');

class HealthMonitorService {
  constructor() {
    this.startTime = Date.now();
    this.healthMetrics = {
      uptime: 0,
      memory: {},
      cpu: {},
      database: {
        mysql: { status: 'unknown', latency: null },
        mongodb: { status: 'unknown', latency: null }
      },
      cache: { status: 'unknown', latency: null },
      requests: {
        total: 0,
        errors: 0,
        avgResponseTime: 0
      }
    };
    
    this.requestMetrics = [];
    this.maxRequestMetricsSize = 1000;
  }

  // Record request metrics
  recordRequest(duration, isError = false) {
    this.healthMetrics.requests.total++;
    if (isError) {
      this.healthMetrics.requests.errors++;
    }

    this.requestMetrics.push(duration);
    if (this.requestMetrics.length > this.maxRequestMetricsSize) {
      this.requestMetrics.shift();
    }

    // Calculate average response time
    const sum = this.requestMetrics.reduce((a, b) => a + b, 0);
    this.healthMetrics.requests.avgResponseTime = Math.round(sum / this.requestMetrics.length);
  }

  // Get system metrics
  getSystemMetrics() {
    const uptime = Date.now() - this.startTime;
    const memUsage = process.memoryUsage();
    const systemMem = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    };

    return {
      uptime: Math.floor(uptime / 1000), // in seconds
      memory: {
        process: {
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024) // MB
        },
        system: {
          total: Math.round(systemMem.total / 1024 / 1024), // MB
          free: Math.round(systemMem.free / 1024 / 1024), // MB
          used: Math.round(systemMem.used / 1024 / 1024), // MB
          usage: Math.round((systemMem.used / systemMem.total) * 100) // percentage
        }
      },
      cpu: {
        cores: os.cpus().length,
        platform: os.platform(),
        architecture: os.arch(),
        loadAverage: os.loadavg()
      }
    };
  }

  // Check MySQL database health
  async checkMySQLHealth() {
    try {
      const start = Date.now();
      await mysqlConnection.query('SELECT 1');
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency,
        connection: 'active'
      };
    } catch (error) {
      logger.error('MySQL health check failed:', error);
      return {
        status: 'unhealthy',
        latency: null,
        connection: 'failed',
        error: error.message
      };
    }
  }

  // Check MongoDB health
  async checkMongoDBHealth() {
    try {
      if (!mongoConnection || mongoConnection.readyState !== 1) {
        return {
          status: 'unhealthy',
          latency: null,
          connection: 'disconnected'
        };
      }

      const start = Date.now();
      await mongoConnection.db.admin().ping();
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency,
        connection: 'active',
        readyState: mongoConnection.readyState
      };
    } catch (error) {
      logger.error('MongoDB health check failed:', error);
      return {
        status: 'unhealthy',
        latency: null,
        connection: 'failed',
        error: error.message
      };
    }
  }

  // Check cache service health
  async checkCacheHealth() {
    try {
      const result = await cacheService.healthCheck();
      return result;
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return {
        status: 'unhealthy',
        latency: null,
        error: error.message
      };
    }
  }

  // Get database statistics
  async getDatabaseStats() {
    try {
      const stats = {};

      // MySQL stats
      try {
        const [userCount] = await mysqlConnection.query('SELECT COUNT(*) as count FROM users');
        const [patientCount] = await mysqlConnection.query('SELECT COUNT(*) as count FROM patients');
        const [doctorCount] = await mysqlConnection.query('SELECT COUNT(*) as count FROM doctors');
        const [appointmentCount] = await mysqlConnection.query('SELECT COUNT(*) as count FROM appointments');
        
        stats.mysql = {
          users: userCount[0].count,
          patients: patientCount[0].count,
          doctors: doctorCount[0].count,
          appointments: appointmentCount[0].count
        };
      } catch (error) {
        stats.mysql = { error: 'Unable to fetch MySQL stats' };
      }

      // MongoDB stats
      try {
        if (mongoConnection && mongoConnection.readyState === 1) {
          const db = mongoConnection.db;
          const collections = await db.listCollections().toArray();
          stats.mongodb = {
            collections: collections.length,
            collectionNames: collections.map(c => c.name)
          };
        } else {
          stats.mongodb = { error: 'MongoDB not connected' };
        }
      } catch (error) {
        stats.mongodb = { error: 'Unable to fetch MongoDB stats' };
      }

      return stats;
    } catch (error) {
      logger.error('Error getting database stats:', error);
      return { error: 'Unable to fetch database statistics' };
    }
  }

  // Get application metrics
  getApplicationMetrics() {
    return {
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid,
      requests: this.healthMetrics.requests,
      errorRate: this.healthMetrics.requests.total > 0 
        ? Math.round((this.healthMetrics.requests.errors / this.healthMetrics.requests.total) * 100)
        : 0
    };
  }

  // Comprehensive health check
  async getHealthStatus() {
    try {
      const systemMetrics = this.getSystemMetrics();
      const [mysqlHealth, mongoHealth, cacheHealth] = await Promise.all([
        this.checkMySQLHealth(),
        this.checkMongoDBHealth(),
        this.checkCacheHealth()
      ]);

      const dbStats = await this.getDatabaseStats();
      const appMetrics = this.getApplicationMetrics();

      const overallStatus = this.determineOverallStatus(mysqlHealth, mongoHealth, cacheHealth);

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: systemMetrics.uptime,
        system: systemMetrics,
        database: {
          mysql: mysqlHealth,
          mongodb: mongoHealth,
          statistics: dbStats
        },
        cache: cacheHealth,
        application: appMetrics,
        services: {
          mysql: mysqlHealth.status === 'healthy',
          mongodb: mongoHealth.status === 'healthy',
          cache: cacheHealth.status === 'connected'
        }
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Determine overall system status
  determineOverallStatus(mysqlHealth, mongoHealth, cacheHealth) {
    const criticalServices = [mysqlHealth.status];
    const optionalServices = [mongoHealth.status, cacheHealth.status];

    // If any critical service is down, system is unhealthy
    if (criticalServices.includes('unhealthy')) {
      return 'unhealthy';
    }

    // If critical services are healthy but some optional services are down, system is degraded
    if (optionalServices.includes('unhealthy') || optionalServices.includes('disconnected')) {
      return 'degraded';
    }

    return 'healthy';
  }

  // Get simple health status for load balancers
  async getSimpleHealthStatus() {
    try {
      const mysqlHealth = await this.checkMySQLHealth();
      
      return {
        status: mysqlHealth.status === 'healthy' ? 'ok' : 'error',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Monitor resource usage and alert if thresholds are exceeded
  checkResourceThresholds() {
    const systemMetrics = this.getSystemMetrics();
    const alerts = [];

    // Memory usage alert (> 85%)
    if (systemMetrics.memory.system.usage > 85) {
      alerts.push({
        type: 'memory',
        level: 'warning',
        message: `High memory usage: ${systemMetrics.memory.system.usage}%`,
        value: systemMetrics.memory.system.usage
      });
    }

    // Process memory alert (> 500MB)
    if (systemMetrics.memory.process.rss > 500) {
      alerts.push({
        type: 'process_memory',
        level: 'warning',
        message: `High process memory usage: ${systemMetrics.memory.process.rss}MB`,
        value: systemMetrics.memory.process.rss
      });
    }

    // Error rate alert (> 5%)
    const errorRate = this.healthMetrics.requests.total > 0 
      ? (this.healthMetrics.requests.errors / this.healthMetrics.requests.total) * 100
      : 0;
    
    if (errorRate > 5) {
      alerts.push({
        type: 'error_rate',
        level: 'critical',
        message: `High error rate: ${errorRate.toFixed(2)}%`,
        value: errorRate
      });
    }

    // Response time alert (> 1000ms)
    if (this.healthMetrics.requests.avgResponseTime > 1000) {
      alerts.push({
        type: 'response_time',
        level: 'warning',
        message: `High average response time: ${this.healthMetrics.requests.avgResponseTime}ms`,
        value: this.healthMetrics.requests.avgResponseTime
      });
    }

    return alerts;
  }

  // Start periodic health monitoring
  startMonitoring(intervalMs = 60000) {
    setInterval(async () => {
      try {
        const alerts = this.checkResourceThresholds();
        if (alerts.length > 0) {
          logger.warn('Resource threshold alerts:', alerts);
        }

        // Log basic health metrics
        const health = await this.getSimpleHealthStatus();
        if (health.status === 'error') {
          logger.error('Health check failed:', health);
        }
      } catch (error) {
        logger.error('Health monitoring error:', error);
      }
    }, intervalMs);

    logger.info('Health monitoring started');
  }
}

// Create singleton instance
const healthMonitor = new HealthMonitorService();

module.exports = healthMonitor;
