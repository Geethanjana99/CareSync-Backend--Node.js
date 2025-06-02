const { mysqlConnection } = require('../config/mysql');
const { mongoConnection } = require('../config/mongodb');
const cacheService = require('./cacheService');
const logger = require('../config/logger');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

class HealthMonitorService {
  constructor() {
    this.startTime = Date.now();
    this.healthChecks = new Map();
    this.alertThresholds = {
      cpu: 80, // CPU usage percentage
      memory: 80, // Memory usage percentage
      disk: 85, // Disk usage percentage
      responseTime: 5000, // Response time in milliseconds
      errorRate: 10 // Error rate percentage
    };
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      lastMinuteRequests: [],
      lastMinuteErrors: []
    };
  }

  // Initialize health monitoring
  async initialize() {
    logger.info('Initializing health monitor service...');
    
    // Start periodic health checks
    this.startPeriodicChecks();
    
    // Initialize metrics cleanup
    this.startMetricsCleanup();
    
    logger.info('Health monitor service initialized');
  }

  // Start periodic health checks
  startPeriodicChecks() {
    // Check every 30 seconds
    setInterval(async () => {
      await this.performHealthChecks();
    }, 30000);

    // Detailed check every 5 minutes
    setInterval(async () => {
      await this.performDetailedHealthCheck();
    }, 300000);
  }

  // Start metrics cleanup (remove old data)
  startMetricsCleanup() {
    setInterval(() => {
      const oneMinuteAgo = Date.now() - 60000;
      this.metrics.lastMinuteRequests = this.metrics.lastMinuteRequests.filter(
        timestamp => timestamp > oneMinuteAgo
      );
      this.metrics.lastMinuteErrors = this.metrics.lastMinuteErrors.filter(
        timestamp => timestamp > oneMinuteAgo
      );
    }, 10000); // Clean every 10 seconds
  }

  // Record request metrics
  recordRequest(responseTime, isError = false) {
    const now = Date.now();
    
    this.metrics.requests++;
    this.metrics.totalResponseTime += responseTime;
    this.metrics.lastMinuteRequests.push(now);
    
    if (isError) {
      this.metrics.errors++;
      this.metrics.lastMinuteErrors.push(now);
    }
  }

  // Get current metrics
  getMetrics() {
    const now = Date.now();
    const uptime = now - this.startTime;
    const requestsPerMinute = this.metrics.lastMinuteRequests.length;
    const errorsPerMinute = this.metrics.lastMinuteErrors.length;
    const errorRate = this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0;
    const avgResponseTime = this.metrics.requests > 0 ? this.metrics.totalResponseTime / this.metrics.requests : 0;

    return {
      uptime,
      totalRequests: this.metrics.requests,
      totalErrors: this.metrics.errors,
      requestsPerMinute,
      errorsPerMinute,
      errorRate,
      avgResponseTime,
      timestamp: now
    };
  }

  // Check MySQL database health
  async checkMySQLHealth() {
    try {
      const startTime = Date.now();
      await mysqlConnection.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        message: 'MySQL connection successful'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: null,
        message: `MySQL connection failed: ${error.message}`
      };
    }
  }

  // Check MongoDB health
  async checkMongoDBHealth() {
    try {
      const startTime = Date.now();
      await mongoConnection.db.admin().ping();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        message: 'MongoDB connection successful'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: null,
        message: `MongoDB connection failed: ${error.message}`
      };
    }
  }

  // Check Redis cache health
  async checkCacheHealth() {
    try {
      const startTime = Date.now();
      const isHealthy = await cacheService.healthCheck();
      const responseTime = Date.now() - startTime;
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        message: isHealthy ? 'Redis cache accessible' : 'Redis cache not accessible'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: null,
        message: `Cache health check failed: ${error.message}`
      };
    }
  }

  // Check system resources
  async checkSystemResources() {
    try {
      // CPU usage
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      
      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });
      
      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const cpuUsage = 100 - ~~(100 * idle / total);

      // Memory usage
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsage = (usedMemory / totalMemory) * 100;

      // Disk usage (for uploads directory)
      let diskUsage = null;
      try {
        const uploadsPath = path.join(__dirname, '../uploads');
        const stats = await fs.stat(uploadsPath);
        // This is a simplified check - in production, you might want to use a library like 'node-disk-info'
        diskUsage = {
          path: uploadsPath,
          exists: true
        };
      } catch (error) {
        diskUsage = {
          path: 'uploads',
          exists: false,
          error: error.message
        };
      }

      return {
        status: 'healthy',
        cpu: {
          usage: cpuUsage,
          cores: cpus.length
        },
        memory: {
          total: totalMemory,
          used: usedMemory,
          free: freeMemory,
          usage: memoryUsage
        },
        disk: diskUsage,
        loadAverage: os.loadavg(),
        uptime: os.uptime()
      };
    } catch (error) {
      return {
        status: 'error',
        message: `System resource check failed: ${error.message}`
      };
    }
  }

  // Check file system health
  async checkFileSystemHealth() {
    try {
      const uploadsDir = path.join(__dirname, '../uploads');
      const testFile = path.join(uploadsDir, 'health-check.tmp');
      
      // Test write
      await fs.writeFile(testFile, 'health check');
      
      // Test read
      const content = await fs.readFile(testFile, 'utf8');
      
      // Clean up
      await fs.unlink(testFile);
      
      return {
        status: 'healthy',
        message: 'File system read/write operations successful'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `File system check failed: ${error.message}`
      };
    }
  }

  // Perform basic health checks
  async performHealthChecks() {
    const checks = {
      mysql: await this.checkMySQLHealth(),
      mongodb: await this.checkMongoDBHealth(),
      cache: await this.checkCacheHealth(),
      system: await this.checkSystemResources(),
      filesystem: await this.checkFileSystemHealth()
    };

    this.healthChecks.set('basic', {
      timestamp: Date.now(),
      checks,
      overall: this.determineOverallHealth(checks)
    });

    // Log any unhealthy services
    Object.entries(checks).forEach(([service, check]) => {
      if (check.status === 'unhealthy' || check.status === 'error') {
        logger.warn(`Health check failed for ${service}:`, check.message);
      }
    });
  }

  // Perform detailed health check
  async performDetailedHealthCheck() {
    try {
      // Database performance checks
      const dbPerformance = await this.checkDatabasePerformance();
      
      // Application metrics
      const appMetrics = this.getMetrics();
      
      // Service dependencies
      const dependencies = await this.checkServiceDependencies();

      const detailedCheck = {
        timestamp: Date.now(),
        database: dbPerformance,
        application: appMetrics,
        dependencies,
        alerts: this.checkAlerts()
      };

      this.healthChecks.set('detailed', detailedCheck);
      
      logger.info('Detailed health check completed', {
        errorRate: appMetrics.errorRate,
        avgResponseTime: appMetrics.avgResponseTime,
        requestsPerMinute: appMetrics.requestsPerMinute
      });

    } catch (error) {
      logger.error('Detailed health check failed:', error);
    }
  }

  // Check database performance
  async checkDatabasePerformance() {
    const performance = {};

    try {
      // MySQL performance
      const mysqlStart = Date.now();
      const [mysqlRows] = await mysqlConnection.query('SHOW STATUS LIKE "Threads_connected"');
      performance.mysql = {
        responseTime: Date.now() - mysqlStart,
        connections: mysqlRows[0]?.Value || 'unknown',
        status: 'healthy'
      };
    } catch (error) {
      performance.mysql = {
        status: 'error',
        message: error.message
      };
    }

    try {
      // MongoDB performance
      const mongoStart = Date.now();
      const mongoStats = await mongoConnection.db.stats();
      performance.mongodb = {
        responseTime: Date.now() - mongoStart,
        collections: mongoStats.collections,
        dataSize: mongoStats.dataSize,
        storageSize: mongoStats.storageSize,
        status: 'healthy'
      };
    } catch (error) {
      performance.mongodb = {
        status: 'error',
        message: error.message
      };
    }

    return performance;
  }

  // Check service dependencies
  async checkServiceDependencies() {
    const dependencies = {};

    // Check if all required environment variables are set
    const requiredEnvVars = [
      'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
      'MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    dependencies.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'warning',
      missingVariables: missingEnvVars
    };

    // Check critical directories
    const criticalDirs = ['uploads', 'logs'];
    const dirChecks = [];

    for (const dir of criticalDirs) {
      try {
        const dirPath = path.join(__dirname, '..', dir);
        await fs.access(dirPath);
        dirChecks.push({ name: dir, status: 'exists' });
      } catch (error) {
        dirChecks.push({ name: dir, status: 'missing', error: error.message });
      }
    }

    dependencies.directories = {
      status: dirChecks.every(check => check.status === 'exists') ? 'healthy' : 'warning',
      checks: dirChecks
    };

    return dependencies;
  }

  // Check for alerts based on thresholds
  checkAlerts() {
    const alerts = [];
    const metrics = this.getMetrics();
    const systemCheck = this.healthChecks.get('basic')?.checks?.system;

    // High error rate
    if (metrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        severity: 'high',
        message: `Error rate is ${metrics.errorRate.toFixed(2)}% (threshold: ${this.alertThresholds.errorRate}%)`,
        value: metrics.errorRate,
        threshold: this.alertThresholds.errorRate
      });
    }

    // High response time
    if (metrics.avgResponseTime > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        severity: 'medium',
        message: `Average response time is ${metrics.avgResponseTime.toFixed(2)}ms (threshold: ${this.alertThresholds.responseTime}ms)`,
        value: metrics.avgResponseTime,
        threshold: this.alertThresholds.responseTime
      });
    }

    // High CPU usage
    if (systemCheck?.cpu?.usage > this.alertThresholds.cpu) {
      alerts.push({
        type: 'cpu_usage',
        severity: 'medium',
        message: `CPU usage is ${systemCheck.cpu.usage}% (threshold: ${this.alertThresholds.cpu}%)`,
        value: systemCheck.cpu.usage,
        threshold: this.alertThresholds.cpu
      });
    }

    // High memory usage
    if (systemCheck?.memory?.usage > this.alertThresholds.memory) {
      alerts.push({
        type: 'memory_usage',
        severity: 'medium',
        message: `Memory usage is ${systemCheck.memory.usage.toFixed(2)}% (threshold: ${this.alertThresholds.memory}%)`,
        value: systemCheck.memory.usage,
        threshold: this.alertThresholds.memory
      });
    }

    return alerts;
  }

  // Determine overall health status
  determineOverallHealth(checks) {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('unhealthy') || statuses.includes('error')) {
      return 'unhealthy';
    }
    
    if (statuses.includes('warning')) {
      return 'warning';
    }
    
    return 'healthy';
  }

  // Get comprehensive health report
  getHealthReport() {
    const basic = this.healthChecks.get('basic');
    const detailed = this.healthChecks.get('detailed');
    const metrics = this.getMetrics();

    return {
      status: basic?.overall || 'unknown',
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      basic: basic?.checks || {},
      metrics,
      detailed: detailed || null,
      alerts: detailed?.alerts || []
    };
  }

  // Get simple health status
  getSimpleHealth() {
    const basic = this.healthChecks.get('basic');
    return {
      status: basic?.overall || 'unknown',
      timestamp: Date.now()
    };
  }
}

// Create singleton instance
const healthMonitorService = new HealthMonitorService();

module.exports = healthMonitorService;