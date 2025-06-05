// spiritualpurity-backend/routes/advertisers.js

const express = require('express');
const Advertiser = require('../models/Advertiser'); // Fixed: Added .. to go up one directory
// Note: Advertisement and AdInteraction models are defined in the same file as Advertiser
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Import User model for authentication
const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/advertisements/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ad-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware to check if user is advertiser
const authenticateAdvertiser = async (req, res, next) => {
  try {
    const advertiser = await Advertiser.findOne({ contactEmail: req.user.email });
    if (!advertiser) {
      return res.status(403).json({
        success: false,
        message: 'Advertiser account required'
      });
    }
    req.advertiser = advertiser;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying advertiser status'
    });
  }
};

// @route   POST /api/advertisers/register
// @desc    Register new advertiser account
// @access  Private (requires authenticated user)
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const {
      businessName,
      contactPhone,
      businessDescription,
      website,
      businessType,
      address
    } = req.body;

    // Check if advertiser already exists
    const existingAdvertiser = await Advertiser.findOne({ contactEmail: req.user.email });
    if (existingAdvertiser) {
      return res.status(400).json({
        success: false,
        message: 'Advertiser account already exists for this email'
      });
    }

    // Create new advertiser
    const advertiser = new Advertiser({
      businessName,
      contactEmail: req.user.email,
      contactPhone,
      businessDescription,
      website,
      businessType,
      address,
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14-day trial
    });

    await advertiser.save();

    res.status(201).json({
      success: true,
      message: 'Advertiser account created successfully',
      data: { advertiser }
    });

  } catch (error) {
    console.error('Advertiser registration error:', error);
    
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
      message: 'Server error during registration'
    });
  }
});

// @route   GET /api/advertisers/dashboard
// @desc    Get advertiser dashboard data
// @access  Private (advertiser only)
router.get('/dashboard', authenticateToken, authenticateAdvertiser, async (req, res) => {
  try {
    // For now, we'll return mock data since Advertisement model is not fully implemented
    const mockAdvertisements = [];
    
    // Calculate overall metrics
    const totalAds = mockAdvertisements.length;
    const activeAds = mockAdvertisements.filter(ad => ad.status === 'approved' && ad.isActive).length;
    const totalImpressions = mockAdvertisements.reduce((sum, ad) => sum + (ad.metrics?.impressions || 0), 0);
    const totalClicks = mockAdvertisements.reduce((sum, ad) => sum + (ad.metrics?.clicks || 0), 0);
    const totalSpent = mockAdvertisements.reduce((sum, ad) => sum + (ad.metrics?.totalSpent || 0), 0);
    const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Mock recent interactions
    const recentInteractions = [];

    // Mock daily metrics for the last 30 days
    const dailyMetrics = [];

    res.json({
      success: true,
      data: {
        advertiser: req.advertiser,
        summary: {
          totalAds,
          activeAds,
          totalImpressions,
          totalClicks,
          totalSpent,
          averageCTR: parseFloat(averageCTR.toFixed(2))
        },
        advertisements: mockAdvertisements,
        recentInteractions,
        dailyMetrics
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading dashboard data'
    });
  }
});

// @route   POST /api/advertisers/advertisements
// @desc    Create new advertisement
// @access  Private (advertiser only)
router.post('/advertisements', authenticateToken, authenticateAdvertiser, upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      websiteUrl,
      category,
      tags,
      tier,
      specialOfferText,
      specialOfferExpiry,
      targetingOptions
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Advertisement image is required'
      });
    }

    // For now, return success since Advertisement model is not fully implemented
    res.status(201).json({
      success: true,
      message: 'Advertisement creation functionality will be implemented soon',
      data: {
        message: 'Advertisement model needs to be properly implemented'
      }
    });

  } catch (error) {
    console.error('Create advertisement error:', error);
    
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
      message: 'Error creating advertisement'
    });
  }
});

// @route   GET /api/advertisers/advertisements
// @desc    Get advertiser's advertisements
// @access  Private (advertiser only)
router.get('/advertisements', authenticateToken, authenticateAdvertiser, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Return empty array for now since Advertisement model is not fully implemented
    res.json({
      success: true,
      data: {
        advertisements: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      }
    });

  } catch (error) {
    console.error('Get advertisements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving advertisements'
    });
  }
});

// @route   PUT /api/advertisers/advertisements/:id
// @desc    Update advertisement
// @access  Private (advertiser only)
router.put('/advertisements/:id', authenticateToken, authenticateAdvertiser, upload.single('image'), async (req, res) => {
  try {
    res.json({
      success: false,
      message: 'Advertisement update functionality will be implemented soon'
    });

  } catch (error) {
    console.error('Update advertisement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating advertisement'
    });
  }
});

// @route   DELETE /api/advertisers/advertisements/:id
// @desc    Delete advertisement
// @access  Private (advertiser only)
router.delete('/advertisements/:id', authenticateToken, authenticateAdvertiser, async (req, res) => {
  try {
    res.json({
      success: false,
      message: 'Advertisement deletion functionality will be implemented soon'
    });

  } catch (error) {
    console.error('Delete advertisement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting advertisement'
    });
  }
});

// @route   POST /api/advertisers/advertisements/:id/pause
// @desc    Pause/unpause advertisement
// @access  Private (advertiser only)
router.post('/advertisements/:id/pause', authenticateToken, authenticateAdvertiser, async (req, res) => {
  try {
    res.json({
      success: false,
      message: 'Advertisement pause/unpause functionality will be implemented soon'
    });

  } catch (error) {
    console.error('Pause/unpause advertisement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating advertisement status'
    });
  }
});

// @route   GET /api/advertisers/analytics/:id
// @desc    Get detailed analytics for an advertisement
// @access  Private (advertiser only)
router.get('/analytics/:id', authenticateToken, authenticateAdvertiser, async (req, res) => {
  try {
    res.json({
      success: false,
      message: 'Advertisement analytics functionality will be implemented soon'
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics data'
    });
  }
});

// @route   PUT /api/advertisers/profile
// @desc    Update advertiser profile
// @access  Private (advertiser only)
router.put('/profile', authenticateToken, authenticateAdvertiser, async (req, res) => {
  try {
    const updateFields = [
      'businessName', 'contactPhone', 'businessDescription', 
      'website', 'businessType', 'address', 'billingAddress',
      'emailNotifications'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        req.advertiser[field] = req.body[field];
      }
    });

    await req.advertiser.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { advertiser: req.advertiser }
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
      message: 'Error updating profile'
    });
  }
});

module.exports = router;