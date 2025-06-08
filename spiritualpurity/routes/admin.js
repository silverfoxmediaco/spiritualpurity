// routes/admin.js

const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Connection = require('../models/Connection');
const Message = require('../models/Message');
const { adminAuth, moderatorAuth } = require('../middleware/adminAuth');

const router = express.Router();

// @route   POST /api/admin/login
// @desc    Admin login (same as regular login but checks role)
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is admin or moderator
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Shorter expiry for admin tokens
    );

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
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Admin/Moderator
router.get('/dashboard/stats', moderatorAuth, async (req, res) => {
  try {
    // Get total active users
    const totalUsers = await User.countDocuments({ isActive: true });
    
    // Get new users this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await User.countDocuments({
      isActive: true,
      joinDate: { $gte: firstDayOfMonth }
    });
    
    // Get total posts (active, non-removed posts)
    const totalPosts = await Post.countDocuments({ 
      isActive: true,
      'reported.moderationStatus': { $ne: 'removed' }
    });
    
    // Get total prayers and active prayers using aggregation
    const prayerStats = await User.aggregate([
      { $unwind: '$prayerRequests' },
      { 
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { 
            $sum: { 
              $cond: [{ $eq: ['$prayerRequests.isAnswered', false] }, 1, 0] 
            }
          }
        }
      }
    ]);
    
    const totalPrayers = prayerStats[0]?.total || 0;
    const activePrayers = prayerStats[0]?.active || 0;
    
    // Get total accepted connections
    const totalConnections = await Connection.countDocuments({ 
      status: 'accepted' 
    });
    
    // Get total messages (excluding deleted and removed)
    const totalMessages = await Message.countDocuments({
      'reported.moderationStatus': { $ne: 'removed' }
    });
    
    // Get reported content count
    const reportedPosts = await Post.countDocuments({
      'reported.isReported': true,
      'reported.moderationStatus': 'pending'
    });
    
    const reportedMessages = await Message.countDocuments({
      'reported.isReported': true,
      'reported.moderationStatus': 'pending'
    });
    
    const reportedContent = reportedPosts + reportedMessages;

    res.json({
      success: true,
      data: {
        totalUsers,
        newUsersThisMonth,
        totalPosts,
        totalPrayers,
        activePrayers,
        totalConnections,
        totalMessages,
        reportedContent
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Admin only
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -emailVerificationToken')
      .sort({ joinDate: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: totalUsers,
          page,
          pages: Math.ceil(totalUsers / limit),
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// @route   PUT /api/admin/users/:userId/status
// @desc    Update user status (activate/deactivate)
// @access  Admin only
router.put('/users/:userId/status', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow admin to deactivate themselves
    if (userId === req.user._id.toString() && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own admin account'
      });
    }

    user.isActive = isActive;
    await user.save();

    // TODO: Log this action for audit trail
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// @route   PUT /api/admin/users/:userId/role
// @desc    Update user role
// @access  Admin only
router.put('/users/:userId/role', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['member', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow admin to change their own role
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: { user }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
});

module.exports = router;