require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');

// Create a simple test app
const app = express();
app.use(express.json());

// Add debugging to the authorization middleware
const debugAuthorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔍 Authorization middleware called');
    console.log('Required roles:', roles);
    console.log('req.user exists:', !!req.user);
    
    if (req.user) {
      console.log('req.user.role:', req.user.role);
      console.log('Role check:', roles.includes(req.user.role));
    }
    
    if (!req.user) {
      console.log('❌ Not authenticated');
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log('❌ Role check failed');
      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient permissions'
      });
    }

    console.log('✅ Authorization passed');
    next();
  };
};

// Test route with debugging
app.get('/test-auth', 
  auth.authMiddleware,
  debugAuthorize('doctor'),
  (req, res) => {
    res.json({ 
      success: true, 
      message: 'Authorization successful',
      user: req.user 
    });
  }
);

// Test the middleware directly
const testMiddleware = async () => {
  console.log('🧪 Testing middleware directly...\n');
  
  // Create a test JWT token
  const testUserId = 'ee7393d1-8be2-4573-b9fb-58066f6dbd0c';
  const token = jwt.sign({ userId: testUserId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  console.log('Generated token:', token.substring(0, 50) + '...');
  
  // Mock request and response objects
  const req = {
    header: (name) => name === 'Authorization' ? `Bearer ${token}` : undefined,
    user: null
  };
  
  const res = {
    status: (code) => {
      console.log('Response status:', code);
      return {
        json: (data) => {
          console.log('Response data:', JSON.stringify(data, null, 2));
        }
      };
    },
    json: (data) => {
      console.log('Response data:', JSON.stringify(data, null, 2));
    }
  };
  
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
    console.log('✅ next() called');
  };
  
  try {
    console.log('\n1. Testing auth middleware...');
    await auth.authMiddleware(req, res, next);
    
    if (!nextCalled) {
      console.log('❌ Auth middleware did not call next()');
      return;
    }
    
    console.log('\n2. req.user after auth:', JSON.stringify(req.user, null, 2));
    
    console.log('\n3. Testing authorize middleware...');
    const authorizeMiddleware = debugAuthorize('doctor');
    authorizeMiddleware(req, res, () => {
      console.log('✅ Full authorization flow completed successfully!');
    });
    
  } catch (error) {
    console.error('❌ Middleware test error:', error);
  }
};

if (require.main === module) {
  testMiddleware();
}
