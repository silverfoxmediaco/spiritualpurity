// spiritualpurity-backend/routes/users.js

const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'spiritualpurity/profile-pictures',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      {
        width: 400,
        height: 400,
        crop: 'fill',
        gravity: 'face'
      }
    ],
    public_id: (req, file) => {
      return `profile-${req.user._id}-${Date.now()}`;
    }
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper function to calculate compatibility score between two users
function calculateCompatibilityScore(currentUser, otherUser) {
  let score = 0;
  
  // Shared interests (10 points each - highest priority)
  if (currentUser.interests && otherUser.interests) {
    const sharedInterests = currentUser.interests.filter(interest => 
      otherUser.interests.includes(interest)
    );
    score += sharedInterests.length * 10;
  }
  
  // Same location (5 points for state, 3 additional for city)
  if (currentUser.location && otherUser.location) {
    if (currentUser.location.state === otherUser.location.state) {
      score += 5;
      if (currentUser.location.city === otherUser.location.city) {
        score += 3;
      }
    }
  }
  
  // Compatible relationship goals (5 points)
  if (currentUser.relationshipStatus && otherUser.relationshipStatus) {
    const compatibleStatuses = {
      'Single': ['Single'],
      'Dating': ['Single', 'Dating'],
      'Engaged': ['Engaged'],
      'Married': ['Married'],
      'Widowed': ['Widowed', 'Single'],
      'Divorced': ['Divorced', 'Single']
    };
    
    if (compatibleStatuses[currentUser.relationshipStatus]?.includes(otherUser.relationshipStatus)) {
      score += 5;
    }
  }
  
  // Age proximity (max 5 points, decreases with age difference)
  if (currentUser.dateOfBirth && otherUser.dateOfBirth) {
    const ageDiff = Math.abs(
      new Date(currentUser.dateOfBirth).getFullYear() - 
      new Date(otherUser.dateOfBirth).getFullYear()
    );
    if (ageDiff <= 2) score += 5;
    else if (ageDiff <= 5) score += 3;
    else if (ageDiff <= 10) score += 1;
  }
  
  return score;
}

// @route   GET /api/users/all
// @desc    Get all members with optional filters
// @access  Public (but limited data for non-authenticated users)
router.get('/all', async (req, res) => {
  try {
    const { 
      location,
      relationshipStatus,
      interests,
      sortBy = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Location filter
    if (location) {
      const [city, state] = location.split(',').map(s => s.trim());
      if (state) {
        query['location.state'] = state;
        if (city) {
          query['location.city'] = city;
        }
      }
    }

    // Relationship status filter
    if (relationshipStatus) {
      query.relationshipStatus = relationshipStatus;
    }

    // Interests filter (match any of the provided interests)
    if (interests) {
      const interestArray = interests.split(',').map(s => s.trim());
      query.interests = { $in: interestArray };
    }

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'newest':
        sortOptions = { joinDate: -1 };
        break;
      case 'oldest':
        sortOptions = { joinDate: 1 };
        break;
      case 'mostActive':
        sortOptions = { lastLogin: -1 };
        break;
      case 'alphabetical':
        sortOptions = { firstName: 1, lastName: 1 };
        break;
      default:
        sortOptions = { joinDate: -1 };
    }

    // Fetch members with pagination
    const members = await User.find(query)
      .select('firstName lastName profilePicture bio location relationshipStatus interests privacy joinDate prayerStats')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Apply privacy settings
    const publicMembers = members.map(member => {
      const memberObj = member.toObject();
      
      // Apply privacy settings
      if (!memberObj.privacy?.showLocation) {
        delete memberObj.location;
      }
      
      if (!memberObj.privacy?.showRelationshipStatus) {
        delete memberObj.relationshipStatus;
      }
      
      // Return member info respecting privacy
      return {
        _id: memberObj._id,
        firstName: memberObj.firstName,
        lastName: memberObj.lastName,
        profilePicture: memberObj.profilePicture,
        bio: memberObj.bio,
        location: memberObj.location,
        relationshipStatus: memberObj.relationshipStatus,
        privacy: memberObj.privacy,
        joinDate: memberObj.joinDate,
        prayerStats: memberObj.prayerStats
      };
    });

    res.json({
      success: true,
      message: 'All members retrieved successfully',
      data: {
        members: publicMembers,
        count: publicMembers.length,
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });

  } catch (error) {
    console.error('Get all members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving members'
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -emailVerificationToken -emailVerificationExpires');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: user.toObject()
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      bio,
      location,
      relationshipStatus,
      testimony,
      dateOfBirth,
      phone
    } = req.body;

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (relationshipStatus !== undefined) user.relationshipStatus = relationshipStatus;
    if (testimony !== undefined) user.testimony = testimony;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    // Remove sensitive fields before sending response
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.emailVerificationToken;
    delete userObj.emailVerificationExpires;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userObj
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   PUT /api/users/privacy
// @desc    Update privacy settings
// @access  Private
router.put('/privacy', authenticateToken, async (req, res) => {
  try {
    const {
      showEmail,
      showPhone,
      showLocation,
      showPrayerRequests,
      showTestimony,
      showRelationshipStatus,
      showInterests
    } = req.body;

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update privacy settings
    if (showEmail !== undefined) user.privacy.showEmail = showEmail;
    if (showPhone !== undefined) user.privacy.showPhone = showPhone;
    if (showLocation !== undefined) user.privacy.showLocation = showLocation;
    if (showPrayerRequests !== undefined) user.privacy.showPrayerRequests = showPrayerRequests;
    if (showTestimony !== undefined) user.privacy.showTestimony = showTestimony;
    if (showRelationshipStatus !== undefined) user.privacy.showRelationshipStatus = showRelationshipStatus;
    if (showInterests !== undefined) user.privacy.showInterests = showInterests;

    await user.save();

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: {
        privacy: user.privacy
      }
    });

  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating privacy settings'
    });
  }
});

// @route   PUT /api/users/interests
// @desc    Update user interests
// @access  Private
router.put('/interests', authenticateToken, async (req, res) => {
  try {
    const { interests } = req.body;

    if (!Array.isArray(interests)) {
      return res.status(400).json({
        success: false,
        message: 'Interests must be an array'
      });
    }

    // Validate interests against allowed list
    const validInterests = [
      'Prayer', 'Bible Study', 'Worship', 'Youth Ministry', 'Children Ministry',
      'Missions', 'Evangelism', 'Marriage', 'Parenting', 'Singles', 'Seniors',
      'Music', 'Teaching', 'Counseling', 'Fellowship', 'Discipleship',
      'Small Groups', 'Community Service', 'Prophecy', 'Healing', 'Fasting', 'Meditation'
    ];

    // Validate each interest
    const invalidInterests = interests.filter(interest => !validInterests.includes(interest));
    if (invalidInterests.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid interests: ${invalidInterests.join(', ')}`
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.interests = interests;
    await user.save();

    res.json({
      success: true,
      message: 'Interests updated successfully',
      data: {
        interests: user.interests
      }
    });

  } catch (error) {
    console.error('Update interests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating interests'
    });
  }
});

// @route   POST /api/users/upload-avatar
// @desc    Upload profile picture to Cloudinary
// @access  Private
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile picture from Cloudinary if it exists
    if (user.profilePicture) {
      try {
        // Extract public_id from the old URL
        const urlParts = user.profilePicture.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = `spiritualpurity/profile-pictures/${publicIdWithExtension.split('.')[0]}`;
        
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error('Error deleting old profile picture:', deleteError);
        // Continue even if deletion fails
      }
    }

    // Update user's profile picture URL
    user.profilePicture = req.file.path;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading profile picture'
    });
  }
});

// @route   DELETE /api/users/avatar
// @desc    Remove profile picture
// @access  Private
router.delete('/avatar', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.profilePicture) {
      try {
        // Extract public_id from the URL
        const urlParts = user.profilePicture.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = `spiritualpurity/profile-pictures/${publicIdWithExtension.split('.')[0]}`;
        
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error('Error deleting profile picture from Cloudinary:', deleteError);
      }
    }

    // Remove profile picture URL
    user.profilePicture = '';
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture removed successfully'
    });

  } catch (error) {
    console.error('Remove profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing profile picture'
    });
  }
});

// @route   GET /api/users/recommended
// @desc    Get recommended members based on compatibility
// @access  Private
router.get('/recommended', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get all active users except current user
    const allUsers = await User.find({
      _id: { $ne: req.user._id },
      isActive: true
    }).select('firstName lastName profilePicture bio location relationshipStatus interests privacy');

    // Calculate compatibility scores and sort
    const usersWithScores = allUsers.map(user => ({
      user: user.toObject(),
      score: calculateCompatibilityScore(currentUser, user)
    }));

    // Sort by compatibility score (highest first)
    usersWithScores.sort((a, b) => b.score - a.score);

    // Take top 10 recommendations
    const recommendations = usersWithScores.slice(0, 10).map(item => {
      const userObj = item.user;
      
      // Apply privacy settings
      if (!userObj.privacy?.showLocation) {
        delete userObj.location;
      }
      
      if (!userObj.privacy?.showRelationshipStatus) {
        delete userObj.relationshipStatus;
      }
      
      if (!userObj.privacy?.showInterests) {
        delete userObj.interests;
      }
      
      return {
        ...userObj,
        compatibilityScore: item.score
      };
    });

    res.json({
      success: true,
      message: 'Recommended members retrieved successfully',
      data: {
        recommendations
      }
    });

  } catch (error) {
    console.error('Get recommended members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving recommendations'
    });
  }
});

// @route   POST /api/users/prayer-request
// @desc    Add a new prayer request
// @access  Private
router.post('/prayer-request', authenticateToken, async (req, res) => {
  try {
    const { title, description, isPrivate = false } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newPrayerRequest = {
      title,
      description,
      isPrivate,
      prayerCount: 0,
      isAnswered: false
    };

    user.prayerRequests.push(newPrayerRequest);
    await user.save();

    // Get the newly created prayer request
    const createdRequest = user.prayerRequests[user.prayerRequests.length - 1];

    res.status(201).json({
      success: true,
      message: 'Prayer request created successfully',
      data: {
        prayerRequest: createdRequest
      }
    });

  } catch (error) {
    console.error('Create prayer request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating prayer request'
    });
  }
});

// @route   GET /api/users/prayer-requests
// @desc    Get current user's prayer requests
// @access  Private
router.get('/prayer-requests', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Prayer requests retrieved successfully',
      data: {
        prayerRequests: user.prayerRequests
      }
    });

  } catch (error) {
    console.error('Get prayer requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving prayer requests'
    });
  }
});

// @route   GET /api/users/prayer-requests/all
// @desc    Get all public prayer requests from all users
// @access  Private
router.get('/prayer-requests/all', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Get all users with public prayer requests
    const users = await User.find({
      isActive: true,
      'prayerRequests.isPrivate': false,
      'privacy.showPrayerRequests': true
    }).select('firstName lastName profilePicture prayerRequests');

    // Flatten all public prayer requests
    let allPrayerRequests = [];
    
    users.forEach(user => {
      const publicRequests = user.prayerRequests
        .filter(request => !request.isPrivate && !request.isAnswered)
        .map(request => ({
          ...request.toObject(),
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicture: user.profilePicture
          }
        }));
      
      allPrayerRequests = allPrayerRequests.concat(publicRequests);
    });

    // Sort by date (newest first)
    allPrayerRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedRequests = allPrayerRequests.slice(startIndex, endIndex);

    res.json({
      success: true,
      message: 'Public prayer requests retrieved successfully',
      data: {
        prayerRequests: paginatedRequests,
        total: allPrayerRequests.length,
        pages: Math.ceil(allPrayerRequests.length / limit),
        currentPage: parseInt(page)
      }
    });

  } catch (error) {
    console.error('Get all prayer requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving prayer requests'
    });
  }
});

// @route   PUT /api/users/prayer-request/:id/pray
// @desc    Increment prayer count for a prayer request
// @access  Private
router.put('/prayer-request/:id/pray', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body; // ID of the user who owns the prayer request
    const prayerRequestId = req.params.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const prayerRequest = user.prayerRequests.id(prayerRequestId);
    
    if (!prayerRequest) {
      return res.status(404).json({
        success: false,
        message: 'Prayer request not found'
      });
    }

    // Increment prayer count
    prayerRequest.prayerCount += 1;
    
    // Update prayer stats for the requesting user
    user.prayerStats.totalPrayersReceived += 1;
    
    // Update prayer stats for the praying user
    const prayingUser = await User.findById(req.user._id);
    if (prayingUser) {
      prayingUser.prayerStats.totalPrayersOffered += 1;
      await prayingUser.save();
    }
    
    await user.save();

    res.json({
      success: true,
      message: 'Prayer recorded successfully',
      data: {
        prayerCount: prayerRequest.prayerCount,
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

// @route   PUT /api/users/prayer-request/:id
// @desc    Update prayer request (mark as answered)
// @access  Private
router.put('/prayer-request/:id', authenticateToken, async (req, res) => {
  try {
    const { isAnswered } = req.body;
    const prayerRequestId = req.params.id;

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const prayerRequest = user.prayerRequests.id(prayerRequestId);
    
    if (!prayerRequest) {
      return res.status(404).json({
        success: false,
        message: 'Prayer request not found'
      });
    }

    if (isAnswered !== undefined) {
      prayerRequest.isAnswered = isAnswered;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Prayer request updated successfully',
      data: {
        prayerRequest: prayerRequest
      }
    });

  } catch (error) {
    console.error('Update prayer request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating prayer request'
    });
  }
});

// @route   GET /api/users/public-profile/:userId
// @desc    Get another user's public profile
// @access  Private (must be logged in to view others)
router.get('/public-profile/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User profile is not available'
      });
    }

    // Check if getPublicProfile method exists
    if (typeof user.getPublicProfile !== 'function') {
      console.error('getPublicProfile method not found on user model');
      
      // Fallback: manually create public profile
      const publicProfile = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.privacy?.showLocation ? user.location : undefined,
        relationshipStatus: user.privacy?.showRelationshipStatus ? user.relationshipStatus : undefined,
        interests: user.privacy?.showInterests ? user.interests : undefined,
        joinDate: user.joinDate,
        prayerStats: user.prayerStats
      };
      
      return res.json({
        success: true,
        message: 'Public profile retrieved successfully',
        data: {
          user: publicProfile
        }
      });
    }

    res.json({
      success: true,
      message: 'Public profile retrieved successfully',
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;