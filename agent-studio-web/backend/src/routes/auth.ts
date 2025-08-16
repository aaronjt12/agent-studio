import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { createError } from '../middleware/errorHandler';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// POST /api/auth/register - Register a new user
router.post('/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').optional().trim().isLength({ max: 100 }).withMessage('Name must be less than 100 characters'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, username, password, name } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          name: name || username,
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          createdAt: true,
        }
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      // Create session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await prisma.session.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        }
      });

      res.status(201).json({
        message: 'User registered successfully',
        user,
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
);

// POST /api/auth/login - Login user
router.post('/login',
  [
    body('login').trim().isLength({ min: 1 }).withMessage('Username or email is required'),
    body('password').isLength({ min: 1 }).withMessage('Password is required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { login, password } = req.body;

      // Find user by email or username
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: login },
            { username: login }
          ]
        }
      });

      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'User not found'
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Incorrect password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      // Create session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await prisma.session.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        }
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }
);

// POST /api/auth/logout - Logout user
router.post('/logout',
  [
    body('token').optional().isString(),
  ],
  async (req, res) => {
    try {
      const token = req.body.token || req.header('Authorization')?.replace('Bearer ', '');

      if (token) {
        // Delete the session
        await prisma.session.deleteMany({
          where: { token }
        });
      }

      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Failed to logout' });
    }
  }
);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh',
  [
    body('token').isString().withMessage('Token is required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { token } = req.body;

      // Find valid session
      const session = await prisma.session.findFirst({
        where: {
          token,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              role: true,
            }
          }
        }
      });

      if (!session) {
        return res.status(401).json({
          error: 'Invalid or expired token'
        });
      }

      // Generate new token
      const newToken = jwt.sign(
        { userId: session.user.id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      // Update session with new token
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      await prisma.session.update({
        where: { id: session.id },
        data: {
          token: newToken,
          expiresAt: newExpiresAt,
        }
      });

      res.json({
        message: 'Token refreshed successfully',
        user: session.user,
        token: newToken,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ error: 'Failed to refresh token' });
    }
  }
);

// GET /api/auth/me - Get current user info
router.get('/me',
  async (req, res) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const session = await prisma.session.findFirst({
        where: {
          token,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              role: true,
              avatar: true,
              createdAt: true,
            }
          }
        }
      });

      if (!session) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      res.json({ user: session.user });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user information' });
    }
  }
);

// POST /api/auth/change-password - Change user password
router.post('/change-password',
  [
    body('currentPassword').isLength({ min: 1 }).withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const token = req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const session = await prisma.session.findFirst({
        where: {
          token,
          expiresAt: { gt: new Date() }
        },
        include: { user: true }
      });

      if (!session) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, session.user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedNewPassword }
      });

      // Invalidate all other sessions (force re-login on other devices)
      await prisma.session.deleteMany({
        where: {
          userId: session.user.id,
          id: { not: session.id }
        }
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

export default router;