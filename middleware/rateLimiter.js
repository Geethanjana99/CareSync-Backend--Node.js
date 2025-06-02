const rateLimit = require('express-rate-limit');
const cacheService = require('../services/cacheService');
const logger = require('../config/logger');

// Custom rate limit store using Redis cache
class CustomRateLimitStore {
  constructor() {
    this.name = 'CustomRateLimitStore';
  }

  async increment(key) {
    try {
      const result = await cacheService.incrementRateLimit(key, 60, 100);
      return {
        totalHits: result.count,
        resetTime: new Date(result.reset)
      };
    } catch (error) {
      logger.error('Rate limit store error:', error);
      // Fallback to allowing the request
      return {
        totalHits: 1,
        resetTime: new Date(Date.now() + 60000)
      };
    }
  }

  async decrement(key) {
    // Redis automatically handles expiration, so we don't need to implement decrement
    return;
  }

  async resetKey(key) {
    try {
      await cacheService.del(key);
    } catch (error) {
      logger.error('Rate limit reset error:', error);
    }
  }
}

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: cacheService.isConnected ? new CustomRateLimitStore() : undefined,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: cacheService.isConnected ? new CustomRateLimitStore() : undefined,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Too many failed login attempts. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

// API rate limiter for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  message: {
    error: 'API rate limit exceeded, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: cacheService.isConnected ? new CustomRateLimitStore() : undefined,
  handler: (req, res) => {
    logger.warn(`API rate limit exceeded for IP: ${req.ip}, Endpoint: ${req.path}`);
    res.status(429).json({
      error: 'API rate limit exceeded',
      message: 'Too many API requests. Please slow down.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 20 file uploads per 10 minutes
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: cacheService.isConnected ? new CustomRateLimitStore() : undefined,
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}, User: ${req.user?.id || 'anonymous'}`);
    res.status(429).json({
      error: 'Upload rate limit exceeded',
      message: 'Too many file uploads. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: cacheService.isConnected ? new CustomRateLimitStore() : undefined,
  handler: (req, res) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}, Email: ${req.body?.email || 'unknown'}`);
    res.status(429).json({
      error: 'Password reset rate limit exceeded',
      message: 'Too many password reset attempts. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

// Email verification rate limiter
const emailVerificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 email verification requests per 5 minutes
  message: {
    error: 'Too many email verification requests, please try again later.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: cacheService.isConnected ? new CustomRateLimitStore() : undefined,
  handler: (req, res) => {
    logger.warn(`Email verification rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Email verification rate limit exceeded',
      message: 'Too many verification requests. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

// Registration rate limiter
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 registration attempts per hour
  message: {
    error: 'Too many registration attempts, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: cacheService.isConnected ? new CustomRateLimitStore() : undefined,
  handler: (req, res) => {
    logger.warn(`Registration rate limit exceeded for IP: ${req.ip}, Email: ${req.body?.email || 'unknown'}`);
    res.status(429).json({
      error: 'Registration rate limit exceeded',
      message: 'Too many registration attempts. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

// Appointment booking rate limiter
const appointmentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 appointment bookings per 10 minutes
  message: {
    error: 'Too many appointment booking attempts, please try again later.',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: cacheService.isConnected ? new CustomRateLimitStore() : undefined,
  handler: (req, res) => {
    logger.warn(`Appointment booking rate limit exceeded for IP: ${req.ip}, User: ${req.user?.id || 'anonymous'}`);
    res.status(429).json({
      error: 'Appointment booking rate limit exceeded',
      message: 'Too many appointment booking attempts. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

// Create a custom rate limiter with user-based limits (for authenticated users)
const createUserBasedLimiter = (windowMs, maxRequests, message = 'Rate limit exceeded') => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const ip = req.ip;
      
      // Use user ID if authenticated, otherwise use IP
      const key = userId ? `user:${userId}` : `ip:${ip}`;
      const fullKey = `rate_limit:${req.route?.path || req.path}:${key}`;
      
      const result = await cacheService.incrementRateLimit(
        fullKey,
        Math.floor(windowMs / 1000),
        maxRequests
      );
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.reset).toISOString()
      });
      
      if (result.exceeded) {
        logger.warn(`User-based rate limit exceeded for ${userId ? `user ${userId}` : `IP ${ip}`}, endpoint: ${req.path}`);
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message,
          retryAfter: Math.ceil(result.reset / 1000)
        });
      }
      
      next();
    } catch (error) {
      logger.error('User-based rate limiter error:', error);
      // Allow the request to continue if there's an error
      next();
    }
  };
};

// Middleware to skip rate limiting for certain conditions
const skipRateLimit = (conditions) => {
  return (req, res, next) => {
    let shouldSkip = false;
    
    // Skip if user has admin role
    if (conditions.skipAdmin && req.user?.role === 'admin') {
      shouldSkip = true;
    }
    
    // Skip if IP is whitelisted
    if (conditions.whitelistedIPs && conditions.whitelistedIPs.includes(req.ip)) {
      shouldSkip = true;
    }
    
    // Skip for health check endpoints
    if (conditions.skipHealthCheck && req.path.includes('/health')) {
      shouldSkip = true;
    }
    
    if (shouldSkip) {
      req.skipRateLimit = true;
    }
    
    next();
  };
};

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
  uploadLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  registrationLimiter,
  appointmentLimiter,
  createUserBasedLimiter,
  skipRateLimit,
  CustomRateLimitStore
};