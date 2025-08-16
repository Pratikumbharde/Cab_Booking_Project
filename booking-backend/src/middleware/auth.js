import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.'
      });
    }
    
    console.error('Authentication error:', err);
    res.status(500).json({
      success: false,
      message: 'Error authenticating user.'
    });
  }
};

// Middleware to check user role
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) is not allowed to access this resource.`
      });
    }
    next();
  };
};

// Middleware to check if user is the owner of the resource
export const isResourceOwner = (model, param = 'id') => {
  return async (req, res, next) => {
    try {
      const resource = await model.findOne({
        _id: req.params[param],
        user: req.user.id
      });

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found or you do not have permission to access it.'
        });
      }

      req.resource = resource;
      next();
    } catch (err) {
      console.error('Resource ownership check failed:', err);
      res.status(500).json({
        success: false,
        message: 'Error checking resource ownership.'
      });
    }
  };
};

// Middleware to check if user is authenticated and verified
export const isVerified = (req, res, next) => {
  // Assuming we have an email verification flag in the user model
  if (req.user && !req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to access this resource.'
    });
  }
  next();
};

// Middleware to check if user has completed their profile
export const hasCompleteProfile = (req, res, next) => {
  const requiredFields = ['name', 'phone'];
  const missingFields = [];

  requiredFields.forEach(field => {
    if (!req.user[field]) {
      missingFields.push(field);
    }
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Please complete your profile to continue.',
      missingFields
    });
  }

  next();
};
