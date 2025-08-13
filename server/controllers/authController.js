import bcrypt from 'bcryptjs';
import { dbHelpers } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

export const authController = {
  // Register new user
  async register(req, res) {
    try {
      const { email, password, name } = req.body;
      
      console.debug('[DEBUG] Registration attempt for:', email);

      // Validation
      if (!email || !password || !name) {
        return res.status(400).json({ 
          error: 'Email, password, and name are required' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'Password must be at least 6 characters long' 
        });
      }

      // Check if user already exists
      const existingUser = await dbHelpers.getUserByEmail(email);
      if (existingUser) {
        console.debug('[DEBUG] User already exists:', email);
        return res.status(409).json({ 
          error: 'User with this email already exists' 
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userData = {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password_hash: hashedPassword,
        is_admin: false
      };

      const newUser = await dbHelpers.createUser(userData);
      
      // Generate token
      const token = generateToken(newUser);

      console.debug('[DEBUG] User registered successfully:', newUser.id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          isAdmin: newUser.is_admin
        },
        token
      });

    } catch (error) {
      console.error('[ERROR] Registration error:', error);
      res.status(500).json({ 
        error: 'Registration failed', 
        details: error.message 
      });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      console.debug('[DEBUG] Login attempt for:', email);

      // Validation
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      // Get user
      const user = await dbHelpers.getUserByEmail(email.toLowerCase().trim());
      if (!user) {
        console.debug('[DEBUG] User not found:', email);
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        console.debug('[DEBUG] Invalid password for user:', email);
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }

      // Generate token
      const token = generateToken(user);

      console.debug('[DEBUG] User logged in successfully:', user.id);

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.is_admin
        },
        token
      });

    } catch (error) {
      console.error('[ERROR] Login error:', error);
      res.status(500).json({ 
        error: 'Login failed', 
        details: error.message 
      });
    }
  },

  // Get current user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      console.debug('[DEBUG] Getting profile for user:', userId);

      const user = await dbHelpers.getUserByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.is_admin,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at
        }
      });

    } catch (error) {
      console.error('[ERROR] Get profile error:', error);
      res.status(500).json({ 
        error: 'Failed to get profile', 
        details: error.message 
      });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name, avatarUrl } = req.body;
      
      console.debug('[DEBUG] Updating profile for user:', userId);

      const updates = {};
      if (name) updates.name = name.trim();
      if (avatarUrl) updates.avatar_url = avatarUrl;
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updates.updated_at = new Date().toISOString();

      const updatedUser = await dbHelpers.updateUser(userId, updates);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          isAdmin: updatedUser.is_admin,
          avatarUrl: updatedUser.avatar_url
        }
      });

    } catch (error) {
      console.error('[ERROR] Update profile error:', error);
      res.status(500).json({ 
        error: 'Failed to update profile', 
        details: error.message 
      });
    }
  }
};
