// models/PrayerGroup.js

const mongoose = require('mongoose');

const prayerGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Men\'s Group',
      'Women\'s Group',
      'Youth Group',
      'Marriage & Family',
      'Bible Study',
      'Healing & Recovery',
      'Intercessory Prayer',
      'Singles',
      'Parents',
      'General Prayer'
    ]
  },
  meetingSchedule: {
    type: String,
    default: 'Schedule TBD'
  },
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  maxMembers: {
    type: Number,
    default: 12,
    min: 2,
    max: 50
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['leader', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  prayerRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    request: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isAnswered: {
      type: Boolean,
      default: false
    },
    prayerCount: {
      type: Number,
      default: 0
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
prayerGroupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure leader is also in members array
prayerGroupSchema.pre('save', function(next) {
  const leaderInMembers = this.members.some(
    member => member.user.toString() === this.leader.toString()
  );
  
  if (!leaderInMembers) {
    this.members.push({
      user: this.leader,
      role: 'leader',
      joinedAt: this.createdAt
    });
  }
  
  next();
});

module.exports = mongoose.model('PrayerGroup', prayerGroupSchema);