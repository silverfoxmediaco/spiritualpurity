// spiritualpurity/models/Post.js

const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    maxlength: [2000, 'Post content cannot exceed 2000 characters'],
    trim: true
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String // For video thumbnails
    },
    originalName: {
      type: String
    },
    size: {
      type: Number
    },
    duration: {
      type: Number // For videos in seconds
    }
  }],
  visibility: {
    type: String,
    enum: ['public', 'connections', 'private'],
    default: 'public'
  },
  tags: [{
    type: String,
    enum: [
      'Faith', 'Prayer', 'Testimony', 'Bible Study', 'Worship', 
      'Fellowship', 'Ministry', 'Missions', 'Family', 'Marriage',
      'Parenting', 'Youth', 'Seniors', 'Music', 'Art', 'Nature',
      'Gratitude', 'Encouragement', 'Life Update', 'Question'
    ]
  }],
  // Engagement metrics
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    // Nested replies to comments
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        maxlength: [300, 'Reply cannot exceed 300 characters'],
        trim: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  // Moderation
  reported: {
    isReported: { type: Boolean, default: false },
    reportedBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: { 
        type: String,
        enum: ['inappropriate', 'spam', 'harassment', 'false_teaching', 'other']
      },
      description: { type: String, maxlength: 200 },
      reportedAt: { type: Date, default: Date.now }
    }],
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'removed'],
      default: 'approved'
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: {
      type: Date
    }
  },
  // Bible verse integration
  verseReference: {
    verse: { type: String, trim: true },
    reference: { type: String, trim: true } // e.g., "John 3:16"
  },
  // Post status
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ visibility: 1, createdAt: -1 });
PostSchema.index({ 'reported.moderationStatus': 1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ isActive: 1, createdAt: -1 });

// Virtual for like count
PostSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
PostSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Method to check if user can view this post
PostSchema.methods.canUserView = async function(userId) {
  if (!userId) {
    return this.visibility === 'public';
  }

  // Author can always view their own posts
  if (this.author.toString() === userId.toString()) {
    return true;
  }

  // Public posts are visible to everyone
  if (this.visibility === 'public') {
    return true;
  }

  // Private posts only visible to author
  if (this.visibility === 'private') {
    return false;
  }

  // Connection posts - check if users are connected
  if (this.visibility === 'connections') {
    const Connection = mongoose.model('Connection');
    const connection = await Connection.findOne({
      $or: [
        { requester: this.author, recipient: userId, status: 'accepted' },
        { requester: userId, recipient: this.author, status: 'accepted' }
      ]
    });
    return !!connection;
  }

  return false;
};

// Method to like/unlike post
PostSchema.methods.toggleLike = function(userId) {
  const existingLike = this.likes.find(like => 
    like.user.toString() === userId.toString()
  );

  if (existingLike) {
    // Unlike - remove the like
    this.likes = this.likes.filter(like => 
      like.user.toString() !== userId.toString()
    );
    return { action: 'unliked', likeCount: this.likes.length };
  } else {
    // Like - add the like
    this.likes.push({ user: userId });
    return { action: 'liked', likeCount: this.likes.length };
  }
};

// Method to add comment
PostSchema.methods.addComment = function(userId, content) {
  const comment = {
    user: userId,
    content: content.trim(),
    createdAt: new Date()
  };
  
  this.comments.push(comment);
  return comment;
};

// Method to add reply to comment
PostSchema.methods.addReply = function(commentId, userId, content) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }

  const reply = {
    user: userId,
    content: content.trim(),
    createdAt: new Date()
  };

  comment.replies.push(reply);
  return reply;
};

// Static method to get posts for feed
PostSchema.statics.getFeedPosts = async function(userId, options = {}) {
  const { page = 1, limit = 10, visibility = 'all' } = options;
  const skip = (page - 1) * limit;

  let matchConditions = {
    isActive: true,
    'reported.moderationStatus': { $ne: 'removed' }
  };

  // Apply visibility filter
  if (visibility === 'public') {
    matchConditions.visibility = 'public';
  } else if (visibility === 'connections') {
    // Get user's connections first
    const Connection = mongoose.model('Connection');
    const connections = await Connection.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });

    const connectedUserIds = connections.map(conn => 
      conn.requester.toString() === userId.toString() 
        ? conn.recipient 
        : conn.requester
    );

    matchConditions.$or = [
      { author: userId }, // User's own posts
      { author: { $in: connectedUserIds }, visibility: { $in: ['public', 'connections'] } },
      { visibility: 'public' }
    ];
  } else {
    // All visible posts
    const Connection = mongoose.model('Connection');
    const connections = await Connection.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });

    const connectedUserIds = connections.map(conn => 
      conn.requester.toString() === userId.toString() 
        ? conn.recipient 
        : conn.requester
    );

    matchConditions.$or = [
      { author: userId }, // User's own posts
      { author: { $in: connectedUserIds }, visibility: { $in: ['public', 'connections'] } },
      { visibility: 'public' }
    ];
  }

  const posts = await this.find(matchConditions)
    .populate('author', 'firstName lastName profilePicture')
    .populate('comments.user', 'firstName lastName profilePicture')
    .populate('comments.replies.user', 'firstName lastName profilePicture')
    .populate('likes.user', 'firstName lastName')
    .sort({ isPinned: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return posts;
};

// Auto-detect verse references in content
PostSchema.pre('save', function(next) {
  if (this.isModified('content') && this.content) {
    // Simple verse detection regex
    const versePattern = /\b\d*\s*[A-Za-z]+\s+\d+:\d+(?:-\d+)?\b/g;
    const matches = this.content.match(versePattern);
    
    if (matches && matches.length > 0 && !this.verseReference.reference) {
      this.verseReference.reference = matches[0];
    }
  }
  next();
});

module.exports = mongoose.model('Post', PostSchema);