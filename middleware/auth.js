const jwt = require('jsonwebtoken');
const { mysqlConnection } = require('../config/mysql');
const logger = require('../config/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const query = `
      SELECT u.*, 
             p.patient_id, p.status as patient_status,
             d.doctor_id, d.specialty, d.status as doctor_status
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.id = ? AND u.is_active = true
    `;
    
    const users = await mysqlConnection.query(query, [decoded.userId]);
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    const user = users[0];
    
    // Check if user account is suspended
    if (user.patient_status === 'suspended' || user.doctor_status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended'
      });
    }    // Add user info to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      patientId: user.patient_id,
      doctorId: user.doctor_id,
      specialty: user.specialty,
      avatarUrl: user.avatar_url
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient permissions'
      });
    }

    next();
  };
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);    const query = `
      SELECT u.*, 
             p.patient_id, d.doctor_id, d.specialty
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.id = ? AND u.is_active = true
    `;
    
    const users = await mysqlConnection.query(query, [decoded.userId]);
    
    if (users.length > 0) {
      const user = users[0];
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        patientId: user.patient_id,
        doctorId: user.doctor_id,
        specialty: user.specialty
      };
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  authMiddleware,
  authorize,
  optionalAuth
};
