// spiritualpurity-backend/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (verifyError) {
      console.error('JWT verification error:', verifyError);
      
      if (verifyError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
      
      if (verifyError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }
      
      throw verifyError;
    }
    
    // Check if decoded token has userId
    if (!decoded.userId) {
      console.error('Token does not contain userId');
      return res.status(401).json({
        success: false,
        message: 'Invalid token structure'
      });
    }
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Optional: Add a middleware to check if token exists without blocking
const checkToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid but continue without user
        console.log('Invalid token in checkToken:', error.message);
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = { authenticateToken, checkToken };