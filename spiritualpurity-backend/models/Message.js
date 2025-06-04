// spiritualpurity-backend/models/Message.js

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
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'prayer', 'verse', 'encouragement'],
    default: 'text'
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
  }
}, {
  timestamps: true
});

// Index for efficient querying
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });

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

// Auto-detect verse references in message content
MessageSchema.pre('save', function(next) {
  if (this.isModified('content')) {
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