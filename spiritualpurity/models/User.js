// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  
  // Email Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  
  // Profile Information
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    trim: true
  },
  location: {
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true, default: 'United States' }
  },
  profilePicture: {
    type: String, // URL to profile image
    default: ''
  },
  relationshipStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', ''],
    default: ''
  },
  
  // NEW: Spiritual Interests for Personalization
  interests: [{
    type: String,
    enum: [
      'Prayer',
      'Bible Study', 
      'Worship',
      'Youth Ministry',
      'Children Ministry',
      'Missions',
      'Evangelism',
      'Marriage',
      'Parenting',
      'Singles',
      'Seniors',
      'Music',
      'Teaching',
      'Counseling',
      'Fellowship',
      'Discipleship',
      'Small Groups',
      'Community Service',
      'Prophecy',
      'Healing',
      'Fasting',
      'Meditation'
    ]
  }],
  
  // Spiritual Information
  testimony: {
    type: String,
    maxlength: [1000, 'Testimony cannot exceed 1000 characters'],
    trim: true
  },
  favoriteVerse: {
    verse: { type: String, trim: true },
    reference: { type: String, trim: true } // e.g., "John 3:16"
  },
  prayerRequests: [{
    request: {
      type: String,
      required: true,
      maxlength: [1000, 'Prayer request cannot exceed 1000 characters']
    },
    category: {
      type: String,
      enum: ['Health', 'Family', 'Financial', 'Spiritual Growth', 'Career', 'Relationships', 'Guidance', 'Other'],
      default: 'Other'
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isAnswered: {
      type: Boolean,
      default: false
    },
    // NEW: Track how many people are praying
    prayerCount: {
      type: Number,
      default: 0
    }
  }],
  
  // NEW: Prayer participation stats
  prayerStats: {
    totalPrayersOffered: { type: Number, default: 0 },
    lastPrayedAt: { type: Date }
  },
  
  // Account Settings
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['member', 'moderator', 'admin'],
    default: 'member'
  },
  
  // Privacy Settings
  privacy: {
    showEmail: { type: Boolean, default: false },
    showLocation: { type: Boolean, default: true },
    showPrayerRequests: { type: Boolean, default: true },
    showTestimony: { type: Boolean, default: true },
    showRelationshipStatus: { type: Boolean, default: true },
    showInterests: { type: Boolean, default: true } // NEW: Privacy for interests
  },
  
  // Timestamps
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Get public profile (without sensitive data)
UserSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  
  // Remove sensitive fields
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  delete userObject.__v;
  
  // Apply privacy settings
  if (!this.privacy.showEmail) delete userObject.email;
  if (!this.privacy.showLocation) delete userObject.location;
  if (!this.privacy.showPrayerRequests) userObject.prayerRequests = [];
  if (!this.privacy.showTestimony) delete userObject.testimony;
  if (!this.privacy.showRelationshipStatus) delete userObject.relationshipStatus;
  if (!this.privacy.showInterests) delete userObject.interests; // NEW: Apply interests privacy
  
  return userObject;
};

// Method to generate verification token
UserSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return token;
};

// Method to verify email
UserSchema.methods.verifyEmail = function() {
  this.isEmailVerified = true;
  this.emailVerificationToken = null;
  this.emailVerificationExpires = null;
};

// NEW: Method to calculate compatibility score with another user
UserSchema.methods.calculateCompatibilityScore = function(otherUser) {
  let score = 0;
  
  // Shared interests (10 points each - highest priority)
  if (this.interests && otherUser.interests) {
    const sharedInterests = this.interests.filter(interest => 
      otherUser.interests.includes(interest)
    );
    score += sharedInterests.length * 10;
  }
  
  // Same location (5 points for state, 3 additional for city)
  if (this.location && otherUser.location) {
    if (this.location.state === otherUser.location.state) {
      score += 5;
      if (this.location.city === otherUser.location.city) {
        score += 3;
      }
    }
  }
  
  // Same relationship status (2 points)
  if (this.relationshipStatus && otherUser.relationshipStatus && 
      this.relationshipStatus === otherUser.relationshipStatus) {
    score += 2;
  }
  
  // Recent joiner bonus (1 point if joined within last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (otherUser.joinDate > thirtyDaysAgo) {
    score += 1;
  }
  
  return score;
};

module.exports = mongoose.model('User', UserSchema);