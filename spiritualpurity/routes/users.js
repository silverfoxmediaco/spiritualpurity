// spiritualpurity-backend/routes/users.js

const express = require('express');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Middleware to verify JWT token
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-pictures/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
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
  
  // Same relationship status (2 points)
  if (currentUser.relationshipStatus && otherUser.relationshipStatus && 
      currentUser.relationshipStatus === otherUser.relationshipStatus) {
    score += 2;
  }
  
  // Recent joiner bonus (1 point if joined within last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (otherUser.joinDate > thirtyDaysAgo) {
    score += 1;
  }
  
  return score;
}

// @route   GET /api/users/newest-members
// @desc    Get newest members for homepage display
// @access  Public
router.get('/newest-members', async (req, res) => {
  try {
    // Get the 6 most recent active members
    const members = await User.find({ 
      isActive: true 
    })
    .select('firstName lastName profilePicture bio location relationshipStatus privacy joinDate')
    .sort({ joinDate: -1 })
    .limit(6);

    // Filter out users who have privacy settings that would hide them
    const publicMembers = members.map(member => {
      const memberObj = member.toObject();
      
      // Apply privacy settings
      if (!memberObj.privacy?.showLocation) {
        delete memberObj.location;
      }
      
      if (!memberObj.privacy?.showRelationshipStatus) {
        delete memberObj.relationshipStatus;
      }
      
      // Always show basic info (name, profile picture, join date) for newest members section
      return {
        _id: memberObj._id,
        firstName: memberObj.firstName,
        lastName: memberObj.lastName,
        profilePicture: memberObj.profilePicture,
        bio: memberObj.bio,
        location: memberObj.location,
        relationshipStatus: memberObj.relationshipStatus,
        privacy: memberObj.privacy,
        joinDate: memberObj.joinDate
      };
    });

    res.json({
      success: true,
      message: 'Newest members retrieved successfully',
      data: {
        members: publicMembers,
        count: publicMembers.length
      }
    });

  } catch (error) {
    console.error('Get newest members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving newest members'
    });
  }
});

// @route   GET /api/users/personalized-featured
// @desc    Get personalized featured members based on user interests and location
// @access  Private (requires authentication)
router.get('/personalized-featured', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .select('interests location relationshipStatus joinDate');
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find all active users except current user
    const allUsers = await User.find({
      _id: { $ne: currentUser._id },
      isActive: true
    })
    .select('firstName lastName profilePicture bio location interests relationshipStatus privacy joinDate')
    .lean(); // Use lean() for better performance

    // Calculate compatibility scores for each user
    const usersWithScores = allUsers.map(user => {
      const score = calculateCompatibilityScore(currentUser, user);
      return {
        ...user,
        compatibilityScore: score
      };
    });

    // Sort by compatibility score (highest first) and take top matches
    const recommendedUsers = usersWithScores
      .filter(user => user.compatibilityScore > 0) // Only show users with some compatibility
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 6);

    // If not enough personalized matches, supplement with newest members
    if (recommendedUsers.length < 4) {
      const newestMembers = await User.find({
        _id: { 
          $ne: currentUser._id,
          $nin: recommendedUsers.map(u => u._id)
        },
        isActive: true
      })
      .select('firstName lastName profilePicture bio location relationshipStatus privacy joinDate')
      .sort({ joinDate: -1 })
      .limit(6 - recommendedUsers.length)
      .lean();

      // Add newest members with score of 0 to distinguish them
      const newestWithScores = newestMembers.map(user => ({
        ...user,
        compatibilityScore: 0
      }));

      recommendedUsers.push(...newestWithScores);
    }

    // Apply privacy settings and clean up the response
    const publicMembers = recommendedUsers.map(member => {
      const memberObj = { ...member };
      
      // Apply privacy settings
      if (!memberObj.privacy?.showLocation) {
        delete memberObj.location;
      }
      
      if (!memberObj.privacy?.showRelationshipStatus) {
        delete memberObj.relationshipStatus;
      }

      if (!memberObj.privacy?.showInterests) {
        delete memberObj.interests;
      }
      
      // Remove privacy object from response
      delete memberObj.privacy;
      
      return {
        _id: memberObj._id,
        firstName: memberObj.firstName,
        lastName: memberObj.lastName,
        profilePicture: memberObj.profilePicture,
        bio: memberObj.bio,
        location: memberObj.location,
        relationshipStatus: memberObj.relationshipStatus,
        interests: memberObj.interests,
        joinDate: memberObj.joinDate,
        compatibilityScore: memberObj.compatibilityScore,
        isPersonalized: memberObj.compatibilityScore > 0
      };
    });

    res.json({
      success: true,
      message: 'Personalized featured members retrieved successfully',
      data: {
        members: publicMembers,
        count: publicMembers.length,
        personalizedCount: publicMembers.filter(m => m.isPersonalized).length
      }
    });

  } catch (error) {
    console.error('Get personalized featured members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving personalized members'
    });
  }
});

// @route   GET /api/users/all-members
// @desc    Get all members for the members directory page
// @access  Public
router.get('/all-members', async (req, res) => {
  try {
    // Get all active members
    const members = await User.find({ 
      isActive: true 
    })
    .select('firstName lastName profilePicture bio location relationshipStatus privacy joinDate')
    .sort({ joinDate: -1 });

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
        joinDate: memberObj.joinDate
      };
    });

    res.json({
      success: true,
      message: 'All members retrieved successfully',
      data: {
        members: publicMembers,
        count: publicMembers.length
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
      favoriteVerse,
      privacy
    } = req.body;

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (location !== undefined) user.location = { ...user.location, ...location };
    if (relationshipStatus !== undefined) user.relationshipStatus = relationshipStatus;
    if (testimony !== undefined) user.testimony = testimony.trim();
    if (favoriteVerse !== undefined) user.favoriteVerse = { ...user.favoriteVerse, ...favoriteVerse };
    if (privacy !== undefined) user.privacy = { ...user.privacy, ...privacy };

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   PUT /api/users/interests
// @desc    Update user's spiritual interests
// @access  Private
router.put('/interests', authenticateToken, async (req, res) => {
  try {
    const { interests } = req.body;

    // Validate interests array
    if (!Array.isArray(interests)) {
      return res.status(400).json({
        success: false,
        message: 'Interests must be an array'
      });
    }

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
// @desc    Upload profile picture
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

    // Update user's profile picture path
    const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;
    user.profilePicture = profilePicturePath;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: profilePicturePath,
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading profile picture'
    });
  }
});

// @route   POST /api/users/prayer-request
// @desc    Add a prayer request
// @access  Private
router.post('/prayer-request', authenticateToken, async (req, res) => {
  try {
    const { request, isPrivate } = req.body;

    if (!request || request.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Prayer request text is required'
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add prayer request to user's array
    user.prayerRequests.push({
      request: request.trim(),
      isPrivate: isPrivate || false,
      createdAt: new Date(),
      isAnswered: false
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Prayer request added successfully',
      data: {
        prayerRequest: user.prayerRequests[user.prayerRequests.length - 1]
      }
    });

  } catch (error) {
    console.error('Add prayer request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding prayer request'
    });
  }
});

// @route   PUT /api/users/prayer-request/:id
// @desc    Update a prayer request (mark as answered, etc.)
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
    const user = await User.findById(req.params.userId);
    
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
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
      message: 'Server error while retrieving profile'
    });
  }
});

module.exports = router;