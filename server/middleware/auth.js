import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { dbHelpers } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// Authentication middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.debug('[DEBUG] No token provided');
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user from database to ensure they still exist and get latest data
    const user = await dbHelpers.getUserByEmail(decoded.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    console.debug('[DEBUG] Token verified for user:', user.id);
    req.user = user;
    next();
  } catch (error) {
    console.error('[ERROR] Authentication middleware error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Admin authorization middleware
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.is_admin) {
      console.debug('[DEBUG] User is not admin:', req.user.id);
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.debug('[DEBUG] Admin access granted for user:', req.user.id);
    next();
  } catch (error) {
    console.error('[ERROR] Admin middleware error:', error);
    res.status(500).json({ error: 'Authorization error', details: error.message });
  }
};

// Optional authentication middleware (for routes that work with or without auth)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await dbHelpers.getUserByEmail(decoded.email);
      req.user = user;
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// JWT utility functions
export const authUtils = {
  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        is_admin: user.is_admin 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  },

  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  },

  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  },

  verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }
};

// Legacy function for backward compatibility
export const generateToken = (user) => {
  return authUtils.generateToken(user);
};
