// spiritualpurity/models/Message.js

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters'], // Increased for shared content
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'prayer', 'verse', 'encouragement', 'shared'], // Added 'shared' type
    default: 'text'
  },
  // NEW: Shared content support
  sharedContent: {
    type: {
      type: String,
      enum: ['profile', 'post'],
      required: function() { return this.sharedContent && Object.keys(this.sharedContent).length > 1; }
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: function() { return this.sharedContent && this.sharedContent.type; }
    },
    title: {
      type: String,
      required: function() { return this.sharedContent && this.sharedContent.type; }
    },
    description: String,
    imageUrl: String,
    url: {
      type: String,
      required: function() { return this.sharedContent && this.sharedContent.type; }
    },
    // Additional metadata for posts
    author: {
      id: mongoose.Schema.Types.ObjectId,
      name: String,
      profilePicture: String
    }
  },
  // For Bible verse messages
  verseReference: {
    type: String,
    trim: true
  },
  // Message status
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // For prayer request messages
  prayerTags: [{
    type: String,
    enum: ['healing', 'guidance', 'thanksgiving', 'family', 'work', 'general']
  }],
  // Deleted status (soft delete)
  deletedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deletedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Report status for moderation
  reported: {
    isReported: { type: Boolean, default: false },
    reportedBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: { type: String },
      reportedAt: { type: Date, default: Date.now }
    }],
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'removed'],
      default: 'approved'
    }
  },
  // NEW: Message reactions (optional future feature)
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      enum: ['❤️', '🙏', '👍', '😊', '🎉', '😢']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient querying
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });
MessageSchema.index({ 'sharedContent.type': 1, 'sharedContent.id': 1 }); // NEW: Index for shared content

// NEW: Virtual to check if message has shared content
MessageSchema.virtual('hasSharedContent').get(function() {
  return this.sharedContent && this.sharedContent.type && this.sharedContent.id;
});

// Mark message as read by a user
MessageSchema.methods.markAsRead = async function(userId) {
  const existingRead = this.readBy.find(read => 
    read.user.toString() === userId.toString()
  );

  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    await this.save();
  }
};

// Check if message is read by a user
MessageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => 
    read.user.toString() === userId.toString()
  );
};

// Soft delete message for a user
MessageSchema.methods.deleteForUser = async function(userId) {
  const existingDelete = this.deletedBy.find(del => 
    del.user.toString() === userId.toString()
  );

  if (!existingDelete) {
    this.deletedBy.push({
      user: userId,
      deletedAt: new Date()
    });
    await this.save();
  }
};

// Check if message is deleted for a user
MessageSchema.methods.isDeletedFor = function(userId) {
  return this.deletedBy.some(del => 
    del.user.toString() === userId.toString()
  );
};

// NEW: Method to add reaction
MessageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(reaction => 
    reaction.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji: emoji,
    createdAt: new Date()
  });
};

// NEW: Method to remove reaction
MessageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(reaction => 
    reaction.user.toString() !== userId.toString()
  );
};

// Get messages for a conversation (excluding deleted ones for the user)
MessageSchema.statics.getConversationMessages = async function(conversationId, userId, page = 1, limit = 50) {
  try {
    const skip = (page - 1) * limit;
    
    const messages = await this.find({
      conversation: conversationId,
      'deletedBy.user': { $ne: userId },
      'reported.moderationStatus': { $ne: 'removed' }
    })
    .populate('sender', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    return messages.reverse(); // Return in chronological order
  } catch (error) {
    throw error;
  }
};

// NEW: Static method to get shared content analytics
MessageSchema.statics.getSharedContentStats = async function(timeframe = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);

  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        'sharedContent.type': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$sharedContent.type',
        count: { $sum: 1 },
        uniqueItems: { $addToSet: '$sharedContent.id' }
      }
    },
    {
      $project: {
        type: '$_id',
        shareCount: '$count',
        uniqueItemsShared: { $size: '$uniqueItems' }
      }
    }
  ]);

  return stats;
};

// Pre-save middleware to validate shared content and auto-detect content types
MessageSchema.pre('save', async function(next) {
  // NEW: Validate shared content if present
  if (this.sharedContent && this.sharedContent.type && this.sharedContent.id) {
    // Validate that the shared content still exists and is accessible
    if (this.sharedContent.type === 'profile') {
      const User = mongoose.model('User');
      const user = await User.findById(this.sharedContent.id);
      if (!user || !user.isActive) {
        return next(new Error('Shared profile is no longer available'));
      }
    } else if (this.sharedContent.type === 'post') {
      const Post = mongoose.model('Post');
      const post = await Post.findById(this.sharedContent.id);
      if (!post || !post.isActive || post.reported?.moderationStatus === 'removed') {
        return next(new Error('Shared post is no longer available'));
      }
    }
    
    // Set message type to 'shared' if it has shared content
    this.messageType = 'shared';
  }

  // Existing functionality: Auto-detect verse references and prayer content
  if (this.isModified('content') && this.messageType !== 'shared') {
    // Simple verse detection regex (can be enhanced)
    const versePattern = /\b\d*\s*[A-Za-z]+\s+\d+:\d+(?:-\d+)?\b/g;
    const matches = this.content.match(versePattern);
    
    if (matches && matches.length > 0 && !this.verseReference) {
      this.verseReference = matches[0];
      this.messageType = 'verse';
    }
    
    // Auto-detect prayer requests
    const prayerKeywords = ['pray', 'prayer', 'praying', 'intercede', 'petition', 'request'];
    const contentLower = this.content.toLowerCase();
    
    if (prayerKeywords.some(keyword => contentLower.includes(keyword)) && this.messageType === 'text') {
      this.messageType = 'prayer';
    }
  }
  
  next();
});

module.exports = mongoose.model('Message', MessageSchema);