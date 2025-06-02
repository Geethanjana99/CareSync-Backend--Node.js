const prometheus = require('prom-client');

// Create a Registry to register the metrics
const register = new prometheus.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'clinical-appointment-system'
});

// Enable the collection of default metrics
prometheus.collectDefaultMetrics({ register });

// Custom metrics for the application
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const databaseConnectionsActive = new prometheus.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  labelNames: ['database']
});

const databaseQueryDuration = new prometheus.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5]
});

const appointmentsTotal = new prometheus.Counter({
  name: 'appointments_total',
  help: 'Total number of appointments',
  labelNames: ['status', 'type']
});

const appointmentsScheduled = new prometheus.Gauge({
  name: 'appointments_scheduled',
  help: 'Number of scheduled appointments',
  labelNames: ['doctor_id', 'date']
});

const usersTotal = new prometheus.Gauge({
  name: 'users_total',
  help: 'Total number of users',
  labelNames: ['role', 'status']
});

const activeUsers = new prometheus.Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
  labelNames: ['role']
});

const authenticationAttempts = new prometheus.Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['status', 'method']
});

const fileUploadsTotal = new prometheus.Counter({
  name: 'file_uploads_total',
  help: 'Total number of file uploads',
  labelNames: ['file_type', 'status']
});

const fileUploadSize = new prometheus.Histogram({
  name: 'file_upload_size_bytes',
  help: 'Size of uploaded files in bytes',
  labelNames: ['file_type'],
  buckets: [1024, 10240, 102400, 1048576, 10485760, 104857600] // 1KB to 100MB
});

const cacheOperations = new prometheus.Counter({
  name: 'cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'status']
});

const cacheHitRatio = new prometheus.Gauge({
  name: 'cache_hit_ratio',
  help: 'Cache hit ratio',
  labelNames: ['cache_type']
});

const emailsSent = new prometheus.Counter({
  name: 'emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['type', 'status']
});

const smsMessagesSent = new prometheus.Counter({
  name: 'sms_messages_sent_total',
  help: 'Total number of SMS messages sent',
  labelNames: ['type', 'status']
});

const websocketConnections = new prometheus.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  labelNames: ['user_role']
});

const errorRate = new prometheus.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'endpoint', 'status_code']
});

const systemHealth = new prometheus.Gauge({
  name: 'system_health_score',
  help: 'Overall system health score (0-1)',
  labelNames: ['component']
});

const backupOperations = new prometheus.Counter({
  name: 'backup_operations_total',
  help: 'Total number of backup operations',
  labelNames: ['type', 'status']
});

const migrationOperations = new prometheus.Counter({
  name: 'migration_operations_total',
  help: 'Total number of migration operations',
  labelNames: ['operation', 'status']
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(databaseConnectionsActive);
register.registerMetric(databaseQueryDuration);
register.registerMetric(appointmentsTotal);
register.registerMetric(appointmentsScheduled);
register.registerMetric(usersTotal);
register.registerMetric(activeUsers);
register.registerMetric(authenticationAttempts);
register.registerMetric(fileUploadsTotal);
register.registerMetric(fileUploadSize);
register.registerMetric(cacheOperations);
register.registerMetric(cacheHitRatio);
register.registerMetric(emailsSent);
register.registerMetric(smsMessagesSent);
register.registerMetric(websocketConnections);
register.registerMetric(errorRate);
register.registerMetric(systemHealth);
register.registerMetric(backupOperations);
register.registerMetric(migrationOperations);

// Middleware to track HTTP metrics
const trackHttpMetrics = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
    
    // Track errors
    if (res.statusCode >= 400) {
      errorRate
        .labels('http_error', route, res.statusCode)
        .inc();
    }
  });
  
  next();
};

// Function to update database connection metrics
const updateDatabaseMetrics = (mysqlConnections, mongoConnections) => {
  databaseConnectionsActive.labels('mysql').set(mysqlConnections);
  databaseConnectionsActive.labels('mongodb').set(mongoConnections);
};

// Function to track database query duration
const trackDatabaseQuery = (queryType, table) => {
  const start = Date.now();
  
  return () => {
    const duration = (Date.now() - start) / 1000;
    databaseQueryDuration
      .labels(queryType, table)
      .observe(duration);
  };
};

// Function to track appointment metrics
const trackAppointment = (status, type) => {
  appointmentsTotal.labels(status, type).inc();
};

// Function to update scheduled appointments
const updateScheduledAppointments = (doctorId, date, count) => {
  appointmentsScheduled.labels(doctorId, date).set(count);
};

// Function to update user metrics
const updateUserMetrics = (userCounts) => {
  Object.entries(userCounts).forEach(([role, counts]) => {
    usersTotal.labels(role, 'active').set(counts.active || 0);
    usersTotal.labels(role, 'inactive').set(counts.inactive || 0);
  });
};

// Function to track authentication attempts
const trackAuthentication = (status, method = 'password') => {
  authenticationAttempts.labels(status, method).inc();
};

// Function to track file uploads
const trackFileUpload = (fileType, size, status) => {
  fileUploadsTotal.labels(fileType, status).inc();
  if (status === 'success') {
    fileUploadSize.labels(fileType).observe(size);
  }
};

// Function to track cache operations
const trackCacheOperation = (operation, status) => {
  cacheOperations.labels(operation, status).inc();
};

// Function to update cache hit ratio
const updateCacheHitRatio = (cacheType, ratio) => {
  cacheHitRatio.labels(cacheType).set(ratio);
};

// Function to track email sending
const trackEmail = (type, status) => {
  emailsSent.labels(type, status).inc();
};

// Function to track SMS sending
const trackSMS = (type, status) => {
  smsMessagesSent.labels(type, status).inc();
};

// Function to update WebSocket connections
const updateWebSocketConnections = (connections) => {
  Object.entries(connections).forEach(([role, count]) => {
    websocketConnections.labels(role).set(count);
  });
};

// Function to update system health
const updateSystemHealth = (component, score) => {
  systemHealth.labels(component).set(score);
};

// Function to track backup operations
const trackBackupOperation = (type, status) => {
  backupOperations.labels(type, status).inc();
};

// Function to track migration operations
const trackMigrationOperation = (operation, status) => {
  migrationOperations.labels(operation, status).inc();
};

// Function to get all metrics for Prometheus scraping
const getMetrics = async () => {
  return register.metrics();
};

// Function to get metrics in JSON format
const getMetricsJSON = async () => {
  const metrics = await register.getMetricsAsJSON();
  return metrics;
};

// Function to clear all metrics (useful for testing)
const clearMetrics = () => {
  register.clear();
};

module.exports = {
  register,
  trackHttpMetrics,
  updateDatabaseMetrics,
  trackDatabaseQuery,
  trackAppointment,
  updateScheduledAppointments,
  updateUserMetrics,
  trackAuthentication,
  trackFileUpload,
  trackCacheOperation,
  updateCacheHitRatio,
  trackEmail,
  trackSMS,
  updateWebSocketConnections,
  updateSystemHealth,
  trackBackupOperation,
  trackMigrationOperation,
  getMetrics,
  getMetricsJSON,
  clearMetrics,
  
  // Export individual metrics for direct access if needed
  metrics: {
    httpRequestDuration,
    httpRequestsTotal,
    databaseConnectionsActive,
    databaseQueryDuration,
    appointmentsTotal,
    appointmentsScheduled,
    usersTotal,
    activeUsers,
    authenticationAttempts,
    fileUploadsTotal,
    fileUploadSize,
    cacheOperations,
    cacheHitRatio,
    emailsSent,
    smsMessagesSent,
    websocketConnections,
    errorRate,
    systemHealth,
    backupOperations,
    migrationOperations
  }
};
