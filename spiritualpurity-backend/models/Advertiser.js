// spiritualpurity-backend/models/Advertiser.js

const mongoose = require('mongoose');

const AdvertiserSchema = new mongoose.Schema({
  // Basic Business Information
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  contactPhone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
  },
  
  // Business Details
  businessDescription: {
    type: String,
    required: [true, 'Business description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  website: {
    type: String,
    required: [true, 'Website URL is required'],
    trim: true,
    match: [/^https?:\/\/.+/, 'Please provide a valid website URL']
  },
  businessType: {
    type: String,
    required: true,
    enum: [
      'church', 'ministry', 'nonprofit', 'christian_business', 
      'publishing', 'music', 'education', 'counseling', 
      'bookstore', 'events', 'technology', 'other'
    ]
  },
  
  // Location Information
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'United States' }
  },
  
  // Account Status
  accountStatus: {
    type: String,
    enum: ['pending', 'approved', 'suspended', 'cancelled'],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    documentType: {
      type: String,
      enum: ['business_license', 'tax_id', 'ministry_credentials', 'other']
    },
    documentUrl: String,
    uploadedAt: { type: Date, default: Date.now },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Billing Information
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'United States' }
  },
  paymentMethods: [{
    type: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer']
    },
    isDefault: { type: Boolean, default: false },
    lastFour: String,
    expiryMonth: Number,
    expiryYear: Number,
    cardType: String,
    paypalEmail: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Subscription Information
  currentPlan: {
    type: String,
    enum: ['free', 'basic', 'sponsored', 'premium'],
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'past_due', 'cancelled', 'trial'],
    default: 'trial'
  },
  subscriptionStartDate: Date,
  subscriptionEndDate: Date,
  trialEndDate: Date,
  
  // Usage Statistics
  totalSpent: { type: Number, default: 0 },
  totalClicks: { type: Number, default: 0 },
  totalImpressions: { type: Number, default: 0 },
  
  // Preferences
  emailNotifications: {
    billingAlerts: { type: Boolean, default: true },
    performanceReports: { type: Boolean, default: true },
    newsUpdates: { type: Boolean, default: false }
  },
  
  // Admin Notes
  adminNotes: [{
    note: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
AdvertiserSchema.index({ contactEmail: 1 }, { unique: true });
AdvertiserSchema.index({ businessName: 1 });
AdvertiserSchema.index({ accountStatus: 1 });
AdvertiserSchema.index({ currentPlan: 1 });

module.exports = mongoose.model('Advertiser', AdvertiserSchema);

// spiritualpurity-backend/models/Advertisement.js

const AdvertisementSchema = new mongoose.Schema({
  // Advertiser Reference
  advertiser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertiser',
    required: true
  },
  
  // Ad Content
  title: {
    type: String,
    required: [true, 'Advertisement title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  imageUrl: {
    type: String,
    required: [true, 'Image is required'],
    trim: true
  },
  websiteUrl: {
    type: String,
    required: [true, 'Website URL is required'],
    trim: true,
    match: [/^https?:\/\/.+/, 'Please provide a valid website URL']
  },
  
  // Ad Classification
  category: {
    type: String,
    required: true,
    enum: [
      'devotionals', 'bible-study', 'prayer', 'worship', 
      'ministry', 'family', 'christian-living', 'technology', 
      'books', 'music', 'events', 'counseling'
    ]
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Pricing and Tier
  tier: {
    type: String,
    required: true,
    enum: ['free', 'basic', 'sponsored', 'premium'],
    default: 'basic'
  },
  monthlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Special Offers
  specialOffer: {
    hasOffer: { type: Boolean, default: false },
    offerText: String,
    offerExpiryDate: Date
  },
  
  // Targeting Options
  targeting: {
    demographics: {
      ageGroups: [String],
      locations: [String],
      interests: [String]
    },
    schedule: {
      startDate: Date,
      endDate: Date,
      daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
      hoursOfDay: [Number] // 0-23
    }
  },
  
  // Ad Status
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'approved', 'rejected', 'paused', 'expired'],
    default: 'draft'
  },
  rejectionReason: String,
  
  // Performance Metrics
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 }, // Click-through rate
    conversions: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // Approval Information
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  reviewNotes: String,
  
  // Scheduling
  isActive: { type: Boolean, default: false },
  activatedAt: Date,
  pausedAt: Date,
  
  // A/B Testing
  variants: [{
    title: String,
    description: String,
    imageUrl: String,
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

// Indexes for performance
AdvertisementSchema.index({ advertiser: 1 });
AdvertisementSchema.index({ status: 1 });
AdvertisementSchema.index({ tier: 1 });
AdvertisementSchema.index({ category: 1 });
AdvertisementSchema.index({ 'targeting.schedule.startDate': 1, 'targeting.schedule.endDate': 1 });

// Calculate CTR before saving
AdvertisementSchema.pre('save', function(next) {
  if (this.metrics.impressions > 0) {
    this.metrics.ctr = (this.metrics.clicks / this.metrics.impressions) * 100;
  }
  this.metrics.lastUpdated = new Date();
  next();
});

// Method to check if ad should be active
AdvertisementSchema.methods.shouldBeActive = function() {
  const now = new Date();
  const startDate = this.targeting.schedule.startDate;
  const endDate = this.targeting.schedule.endDate;
  
  if (this.status !== 'approved') return false;
  if (startDate && now < startDate) return false;
  if (endDate && now > endDate) return false;
  
  return this.isActive;
};

module.exports = mongoose.model('Advertisement', AdvertisementSchema);

// spiritualpurity-backend/models/AdInteraction.js

const AdInteractionSchema = new mongoose.Schema({
  advertisement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    required: true
  },
  advertiser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertiser',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Interaction Details
  interactionType: {
    type: String,
    required: true,
    enum: ['impression', 'click', 'conversion', 'share']
  },
  
  // User Context
  userAgent: String,
  ipAddress: String,
  referrer: String,
  pageUrl: String,
  
  // Location Data
  location: {
    country: String,
    state: String,
    city: String,
    latitude: Number,
    longitude: Number
  },
  
  // Device Information
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet'],
    required: true
  },
  browser: String,
  os: String,
  
  // Conversion Details (if applicable)
  conversionValue: Number,
  conversionType: String,
  
  // Attribution
  clickId: String,
  sessionId: String,
  
  // Fraud Detection
  isSuspicious: { type: Boolean, default: false },
  suspiciousReasons: [String]
}, {
  timestamps: true
});

// Indexes for analytics queries
AdInteractionSchema.index({ advertisement: 1, createdAt: -1 });
AdInteractionSchema.index({ advertiser: 1, createdAt: -1 });
AdInteractionSchema.index({ interactionType: 1, createdAt: -1 });
AdInteractionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('AdInteraction', AdInteractionSchema);