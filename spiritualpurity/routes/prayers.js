// routes/prayers.js

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/prayers/community-requests
// @desc    Get all community prayer requests (public prayers from all users)
// @access  Public
router.get('/community-requests', async (req, res) => {
  try {
    // Get all users with prayer requests
    const users = await User.find({
      'prayerRequests.0': { $exists: true },
      isActive: true
    }).select('firstName lastName profilePicture prayerRequests privacy');

    // Extract and format prayer requests
    const activePrayers = [];
    const answeredPrayers = [];

    users.forEach(user => {
      // Only include if user allows showing prayer requests
      if (user.privacy?.showPrayerRequests !== false) {
        user.prayerRequests.forEach(prayer => {
          // Only include public prayers
          if (!prayer.isPrivate) {
            const prayerData = {
              _id: prayer._id,
              author: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePicture: user.profilePicture
              },
              request: prayer.request,
              category: prayer.category || 'Other',
              isAnswered: prayer.isAnswered,
              createdAt: prayer.createdAt,
              prayerCount: prayer.prayerCount || 0
            };

            if (prayer.isAnswered) {
              answeredPrayers.push(prayerData);
            } else {
              activePrayers.push(prayerData);
            }
          }
        });
      }
    });

    // Sort by date (newest first)
    activePrayers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    answeredPrayers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: {
        activePrayers,
        answeredPrayers,
        totalActive: activePrayers.length,
        totalAnswered: answeredPrayers.length
      }
    });

  } catch (error) {
    console.error('Get community prayers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prayer requests'
    });
  }
});

// @route   POST /api/prayers/submit
// @desc    Submit a new prayer request
// @access  Private
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { request, category, isPrivate } = req.body;

    // Validation
    if (!request || !request.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Prayer request text is required'
      });
    }

    const validCategories = [
      'Health', 'Family', 'Financial', 'Spiritual Growth', 
      'Career', 'Relationships', 'Guidance', 'Other'
    ];

    const selectedCategory = validCategories.includes(category) ? category : 'Other';

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add prayer request to user's array
    const newPrayer = {
      request: request.trim(),
      category: selectedCategory,
      isPrivate: isPrivate || false,
      createdAt: new Date(),
      isAnswered: false,
      prayerCount: 0
    };

    user.prayerRequests.push(newPrayer);
    await user.save();

    // Get the newly created prayer
    const createdPrayer = user.prayerRequests[user.prayerRequests.length - 1];

    res.status(201).json({
      success: true,
      message: 'Prayer request submitted successfully',
      data: {
        prayerRequest: {
          _id: createdPrayer._id,
          request: createdPrayer.request,
          category: createdPrayer.category,
          isPrivate: createdPrayer.isPrivate,
          isAnswered: createdPrayer.isAnswered,
          createdAt: createdPrayer.createdAt,
          prayerCount: createdPrayer.prayerCount
        }
      }
    });

  } catch (error) {
    console.error('Submit prayer error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit prayer request'
    });
  }
});

// @route   POST /api/prayers/:prayerId/pray
// @desc    Record that someone prayed for a prayer request
// @access  Private
router.post('/:prayerId/pray', authenticateToken, async (req, res) => {
  try {
    const { prayerId } = req.params;

    // Find the user who owns this prayer
    const user = await User.findOne({
      'prayerRequests._id': prayerId
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Prayer request not found'
      });
    }

    // Find the specific prayer request
    const prayer = user.prayerRequests.id(prayerId);
    
    if (!prayer) {
      return res.status(404).json({
        success: false,
        message: 'Prayer request not found'
      });
    }

    // Check if it's a private prayer and user is not the owner
    if (prayer.isPrivate && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot access private prayer request'
      });
    }

    // Increment prayer count
    prayer.prayerCount = (prayer.prayerCount || 0) + 1;
    await user.save();

    // Update the praying user's stats
    const prayingUser = await User.findById(req.user._id);
    if (prayingUser) {
      prayingUser.prayerStats.totalPrayersOffered = 
        (prayingUser.prayerStats.totalPrayersOffered || 0) + 1;
      prayingUser.prayerStats.lastPrayedAt = new Date();
      await prayingUser.save();
    }

    res.json({
      success: true,
      message: 'Prayer recorded successfully',
      data: {
        prayerCount: prayer.prayerCount,
        yourTotalPrayers: prayingUser.prayerStats.totalPrayersOffered
      }
    });

  } catch (error) {
    console.error('Prayer count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record prayer'
    });
  }
});

// @route   PUT /api/prayers/:prayerId/answer
// @desc    Mark a prayer request as answered
// @access  Private (owner only)
router.put('/:prayerId/answer', authenticateToken, async (req, res) => {
  try {
    const { prayerId } = req.params;

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const prayer = user.prayerRequests.id(prayerId);
    
    if (!prayer) {
      return res.status(404).json({
        success: false,
        message: 'Prayer request not found'
      });
    }

    prayer.isAnswered = true;
    await user.save();

    res.json({
      success: true,
      message: 'Prayer marked as answered! Praise God!',
      data: {
        prayer: {
          _id: prayer._id,
          isAnswered: prayer.isAnswered
        }
      }
    });

  } catch (error) {
    console.error('Mark prayer answered error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prayer request'
    });
  }
});

// @route   DELETE /api/prayers/:prayerId
// @desc    Delete a prayer request
// @access  Private (owner only)
router.delete('/:prayerId', authenticateToken, async (req, res) => {
  try {
    const { prayerId } = req.params;

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const prayerIndex = user.prayerRequests.findIndex(
      p => p._id.toString() === prayerId
    );
    
    if (prayerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Prayer request not found'
      });
    }

    user.prayerRequests.splice(prayerIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: 'Prayer request deleted successfully'
    });

  } catch (error) {
    console.error('Delete prayer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete prayer request'
    });
  }
});

// @route   GET /api/prayers/user/:userId
// @desc    Get public prayer requests for a specific user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('firstName lastName profilePicture prayerRequests privacy');

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check privacy settings
    if (user.privacy?.showPrayerRequests === false) {
      return res.json({
        success: true,
        data: {
          prayers: [],
          message: 'This user has chosen to keep prayer requests private'
        }
      });
    }

    // Filter out private prayers
    const publicPrayers = user.prayerRequests
      .filter(prayer => !prayer.isPrivate)
      .map(prayer => ({
        _id: prayer._id,
        request: prayer.request,
        category: prayer.category,
        isAnswered: prayer.isAnswered,
        createdAt: prayer.createdAt,
        prayerCount: prayer.prayerCount || 0
      }));

    res.json({
      success: true,
      data: {
        prayers: publicPrayers,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture
        }
      }
    });

  } catch (error) {
    console.error('Get user prayers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prayer requests'
    });
  }
});

module.exports = router;