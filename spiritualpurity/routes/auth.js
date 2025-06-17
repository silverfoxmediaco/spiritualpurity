// spiritualpurity-backend/routes/auth.js

const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendWelcomeEmail } = require('../services/emailService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password,
      bio,
      location
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password, // Will be hashed by the pre-save middleware
      bio,
      location,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

    await user.save();

    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    // Generate JWT token with 7-day expiration
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        token,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profilePicture: user.profilePicture,
          bio: user.bio,
          location: user.location,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          joinDate: user.joinDate
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Generate JWT token with 7-day expiration
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profilePicture: user.profilePicture,
          bio: user.bio,
          location: user.location,
          role: user.role,
          interests: user.interests,
          relationshipStatus: user.relationshipStatus,
          privacy: user.privacy,
          joinDate: user.joinDate,
          isEmailVerified: user.isEmailVerified
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Generate new token with 7-day expiration
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profilePicture: user.profilePicture,
          role: user.role,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token'
    });
  }
});

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with this verification token that hasn't expired
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user);

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // TODO: Send password reset email
    // await sendPasswordResetEmail(user, resetToken);

    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing request'
    });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password; // Will be hashed by pre-save middleware
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a JWT-based system, logout is typically handled client-side
    // by removing the token from storage. This endpoint can be used
    // for any server-side cleanup if needed.

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// @route   POST /api/auth/admin/login
// @desc    Admin login
// @access  Public
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user has admin or moderator role
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or Moderator privileges required.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Generate JWT token with 7-day expiration for admin
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login'
    });
  }
});

module.exports = router;