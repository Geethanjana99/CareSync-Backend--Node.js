const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('express-async-errors');
require('dotenv').config();

// Import configurations
const connectMySQL = require('./config/mysql');
const connectMongoDB = require('./config/mongodb');
const logger = require('./config/logger');

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
const docsRoutes = require('./routes/docs');
const indexRoutes = require('./routes/index');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
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
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
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
  },
  skip: (req, res) => {
    // Skip logging for health checks in production
    return process.env.NODE_ENV === 'production' && req.path.includes('/health');
  }
}));

// Serve static files
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api', indexRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/patients', authMiddleware.authenticate, patientRoutes);
app.use('/api/doctors', authMiddleware.authenticate, doctorRoutes);
app.use('/api/appointments', authMiddleware.authenticate, appointmentRoutes);
app.use('/api/medical-reports', authMiddleware.authenticate, medicalReportsRoutes);
app.use('/api/admin', authMiddleware.authenticate, authMiddleware.authorize(['admin']), adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CareSync Clinical Appointment API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/docs/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    suggestion: 'Check the API documentation at /api/docs'
  });
});

// Global error handler
app.use(errorHandler);

// Database connections
async function startServer() {
  try {
    // Connect to databases
    await connectMySQL();
    await connectMongoDB();
    
    // Initialize notification service
    await NotificationService.initialize();
    
    const PORT = process.env.PORT || 5000;
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    });
    
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
