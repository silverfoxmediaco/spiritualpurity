// spiritualpurity-backend/routes/advertisers.js

const express = require('express');
const Advertiser = require('./models/Advertiser');
const Advertisement = require('./models/Advertiser');
const AdInteraction = require('../models/AdInteraction');
const { authenticateToken } = require('./middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

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
    // Get advertiser's advertisements
    const advertisements = await Advertisement.find({ advertiser: req.advertiser._id })
      .sort({ createdAt: -1 });

    // Calculate overall metrics
    const totalAds = advertisements.length;
    const activeAds = advertisements.filter(ad => ad.status === 'approved' && ad.isActive).length;
    const totalImpressions = advertisements.reduce((sum, ad) => sum + ad.metrics.impressions, 0);
    const totalClicks = advertisements.reduce((sum, ad) => sum + ad.metrics.clicks, 0);
    const totalSpent = advertisements.reduce((sum, ad) => sum + ad.metrics.totalSpent, 0);
    const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Get recent interactions
    const recentInteractions = await AdInteraction.find({ advertiser: req.advertiser._id })
      .populate('advertisement', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate daily metrics for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyMetrics = await AdInteraction.aggregate([
      {
        $match: {
          advertiser: req.advertiser._id,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$interactionType"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          impressions: {
            $sum: { $cond: [{ $eq: ["$_id.type", "impression"] }, "$count", 0] }
          },
          clicks: {
            $sum: { $cond: [{ $eq: ["$_id.type", "click"] }, "$count", 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

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
        advertisements,
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

    // Determine pricing based on tier
    const pricing = {
      free: 0,
      basic: 29,
      sponsored: 99,
      premium: 299
    };

    const advertisement = new Advertisement({
      advertiser: req.advertiser._id,
      title,
      description,
      imageUrl: `/uploads/advertisements/${req.file.filename}`,
      websiteUrl,
      category,
      tags: tags ? JSON.parse(tags) : [],
      tier,
      monthlyRate: pricing[tier] || 0,
      specialOffer: {
        hasOffer: !!specialOfferText,
        offerText: specialOfferText,
        offerExpiryDate: specialOfferExpiry ? new Date(specialOfferExpiry) : null
      },
      targeting: targetingOptions ? JSON.parse(targetingOptions) : {}
    });

    await advertisement.save();

    res.status(201).json({
      success: true,
      message: 'Advertisement created successfully',
      data: { advertisement }
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
    
    const query = { advertiser: req.advertiser._id };
    if (status) query.status = status;

    const advertisements = await Advertisement.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Advertisement.countDocuments(query);

    res.json({
      success: true,
      data: {
        advertisements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
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
    const advertisement = await Advertisement.findOne({
      _id: req.params.id,
      advertiser: req.advertiser._id
    });

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    // Update fields
    const updateFields = ['title', 'description', 'websiteUrl', 'category', 'tags'];
    updateFields.forEach(field => {
      if (req.body[field]) {
        if (field === 'tags') {
          advertisement[field] = JSON.parse(req.body[field]);
        } else {
          advertisement[field] = req.body[field];
        }
      }
    });

    // Update image if provided
    if (req.file) {
      advertisement.imageUrl = `/uploads/advertisements/${req.file.filename}`;
    }

    // Reset to pending review if content was modified
    if (advertisement.status === 'approved') {
      advertisement.status = 'pending_review';
    }

    await advertisement.save();

    res.json({
      success: true,
      message: 'Advertisement updated successfully',
      data: { advertisement }
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
    const advertisement = await Advertisement.findOneAndDelete({
      _id: req.params.id,
      advertiser: req.advertiser._id
    });

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    res.json({
      success: true,
      message: 'Advertisement deleted successfully'
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
    const advertisement = await Advertisement.findOne({
      _id: req.params.id,
      advertiser: req.advertiser._id
    });

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    advertisement.isActive = !advertisement.isActive;
    advertisement.pausedAt = advertisement.isActive ? null : new Date();
    
    if (advertisement.isActive && !advertisement.activatedAt) {
      advertisement.activatedAt = new Date();
    }

    await advertisement.save();

    res.json({
      success: true,
      message: `Advertisement ${advertisement.isActive ? 'activated' : 'paused'} successfully`,
      data: { advertisement }
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
    const { startDate, endDate } = req.query;
    
    const advertisement = await Advertisement.findOne({
      _id: req.params.id,
      advertiser: req.advertiser._id
    });

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    // Build date filter
    const dateFilter = { advertisement: advertisement._id };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get interaction analytics
    const analytics = await AdInteraction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            type: "$interactionType",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          impressions: {
            $sum: { $cond: [{ $eq: ["$_id.type", "impression"] }, "$count", 0] }
          },
          clicks: {
            $sum: { $cond: [{ $eq: ["$_id.type", "click"] }, "$count", 0] }
          },
          conversions: {
            $sum: { $cond: [{ $eq: ["$_id.type", "conversion"] }, "$count", 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get device breakdown
    const deviceBreakdown = await AdInteraction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$device",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get geographic data
    const geoData = await AdInteraction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            country: "$location.country",
            state: "$location.state"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        advertisement,
        analytics,
        deviceBreakdown,
        geoData
      }
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