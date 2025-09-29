const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('express-async-errors');

// Load environment variables with explicit path
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Server startup environment check:');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Import configurations
const connectMySQL = require('./config/mysql');
const connectMongoDB = require('./config/mongodb');
const logger = require('./config/logger');

// Import monitoring
// const { trackHttpMetrics, getMetrics } = require('./monitoring/metrics');

// Import services
const cacheService = require('./services/cacheService');
const healthMonitor = require('./services/healthMonitorService');
const socketService = require('./services/socketService');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const medicalReportsRoutes = require('./routes/medical-reports');
const adminRoutes = require('./routes/admin');
const adminReportsRoutes = require('./routes/admin-reports');
const adminHealthPredictionRoutes = require('./routes/adminHealthPredictions');
const patientHealthPredictionRoutes = require('./routes/patientHealthPredictions');
const billingRoutes = require('./routes/billing');
const docsRoutes = require('./routes/docs');
const indexRoutes = require('./routes/index');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.CORS_ORIGIN || "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  }
});

// Initialize Socket Service
socketService.initialize(io);

// Health monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    healthMonitor.recordRequest(duration, isError);
  });
  next();
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }
}));

// Rate limiting
app.use(apiLimiter);

// CORS configuration
app.use(cors({
  origin: [process.env.CORS_ORIGIN || "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression and parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// Public doctor search endpoint (no authentication required) - MUST come before protected doctor routes
const PatientController = require('./controllers/patientController');
app.get('/api/doctors/search', PatientController.searchDoctors);

// Protected routes
// app.use('/api/users', authMiddleware, userRoutes); // TODO: Create user routes
app.use('/api/patients', patientRoutes);
app.use('/api/patient', patientRoutes); // Singular route for frontend compatibility (includes queue endpoints)
app.use('/api/patient/health-predictions', patientHealthPredictionRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/doctor', doctorRoutes); // Singular route for frontend compatibility
app.use('/api/appointments', appointmentRoutes);
// app.use('/api/queue', authMiddleware, queueRoutes); // TODO: Create queue routes
app.use('/api/billing', billingRoutes);
app.use('/api/medical-reports', medicalReportsRoutes);
// app.use('/api/notifications', authMiddleware, notificationRoutes); // TODO: Create notification routes
// app.use('/api/analytics', authMiddleware, analyticsRoutes); // TODO: Create analytics routes
app.use('/api/admin', adminRoutes);
app.use('/api/insurance-claims', require('./routes/insurance-claims'));
app.use('/api/admin/reports', adminReportsRoutes);
app.use('/api/admin/health-predictions', adminHealthPredictionRoutes);


// Temporary mock routes for testing (no authentication required)
app.use('/api/mock/auth', require('./routes/mock-auth'));
app.use('/api/mock/patients', require('./routes/mock-patients'));
app.use('/api/mock/doctors', require('./routes/mock-doctors'));
app.use('/api/mock/appointments', require('./routes/mock-appointments'));

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Database connections
async function startServer() {
  try {
    // Connect to databases (optional for now)
    try {
      await connectMySQL();
      logger.info('✅ MySQL connected successfully');
    } catch (error) {
      logger.warn('⚠️ MySQL connection failed - continuing without MySQL:', error.message);
    }
    
    try {
      await connectMongoDB();
      logger.info('✅ MongoDB connected successfully');
    } catch (error) {
      logger.warn('⚠️ MongoDB connection failed - continuing without MongoDB:', error.message);
    }
    
    // Initialize notification service (optional)
    try {
      // await NotificationService.initialize();
      logger.info('📧 Notification service skipped for now');
    } catch (error) {
      logger.warn('⚠️ Notification service initialization failed:', error.message);
    }
    
    const basePort = parseInt(process.env.PORT, 10) || 5000;

    // Listen with retry in case the port is already in use
    const listenWithRetry = (startPort, maxAttempts = 10) => new Promise((resolve, reject) => {
      let attempt = 0;
      const tryListen = (portToTry) => {
        const onError = (err) => {
          if (err.code === 'EADDRINUSE' && attempt < maxAttempts) {
            attempt += 1;
            const nextPort = startPort + attempt;
            logger.error(`Port ${portToTry} in use, trying ${nextPort}`);
            // Try the next port
            server.once('error', onError);
            server.listen(nextPort, () => resolve(nextPort));
          } else {
            reject(err);
          }
        };

        server.once('error', onError);
        server.listen(portToTry, () => resolve(portToTry));
      };

      tryListen(startPort);
    });

    const PORT = await listenWithRetry(basePort);

    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    logger.info(`📋 API Documentation: http://localhost:${PORT}/api/docs`);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

module.exports = app;
