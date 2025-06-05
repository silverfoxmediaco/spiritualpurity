// spiritualpurity-backend/models/Conversation.js

const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  // Track unread messages per participant
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, {
  timestamps: true
});

// Ensure only 2 participants for DMs
ConversationSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Direct messages must have exactly 2 participants'));
  }
  next();
});

// Index for efficient queries
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);