// spiritualpurity/models/Connection.js

const mongoose = require('mongoose');

const ConnectionSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: [200, 'Connection message cannot exceed 200 characters'],
    trim: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  // For mutual connections tracking
  isViewed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate requests
ConnectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Index for efficient queries
ConnectionSchema.index({ recipient: 1, status: 1 });
ConnectionSchema.index({ requester: 1, status: 1 });

// Static method to get connection status between two users
ConnectionSchema.statics.getConnectionStatus = async function(userId1, userId2) {
  const connection = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 }
    ]
  });

  if (!connection) return 'none';
  
  if (connection.status === 'accepted') return 'connected';
  if (connection.status === 'blocked') return 'blocked';
  
  // Check if current user sent the request
  if (connection.requester.toString() === userId1.toString()) {
    return connection.status === 'pending' ? 'sent' : connection.status;
  } else {
    return connection.status === 'pending' ? 'received' : connection.status;
  }
};

// Static method to get mutual connections
ConnectionSchema.statics.getMutualConnections = async function(userId1, userId2) {
  // Get all accepted connections for both users
  const user1Connections = await this.find({
    $or: [
      { requester: userId1, status: 'accepted' },
      { recipient: userId1, status: 'accepted' }
    ]
  }).populate('requester recipient', 'firstName lastName profilePicture');

  const user2Connections = await this.find({
    $or: [
      { requester: userId2, status: 'accepted' },
      { recipient: userId2, status: 'accepted' }
    ]
  }).populate('requester recipient', 'firstName lastName profilePicture');

  // Extract user IDs from connections
  const getConnectedUserIds = (connections, currentUserId) => {
    return connections.map(conn => {
      return conn.requester._id.toString() === currentUserId.toString() 
        ? conn.recipient._id.toString() 
        : conn.requester._id.toString();
    });
  };

  const user1ConnectedIds = getConnectedUserIds(user1Connections, userId1);
  const user2ConnectedIds = getConnectedUserIds(user2Connections, userId2);

  // Find mutual connections
  const mutualIds = user1ConnectedIds.filter(id => user2ConnectedIds.includes(id));
  
  return mutualIds.length;
};

// Instance method to accept connection
ConnectionSchema.methods.accept = function() {
  this.status = 'accepted';
  this.respondedAt = new Date();
  this.isViewed = true;
  return this.save();
};

// Instance method to decline connection
ConnectionSchema.methods.decline = function() {
  this.status = 'declined';
  this.respondedAt = new Date();
  this.isViewed = true;
  return this.save();
};

// Instance method to block connection
ConnectionSchema.methods.block = function() {
  this.status = 'blocked';
  this.respondedAt = new Date();
  this.isViewed = true;
  return this.save();
};

module.exports = mongoose.model('Connection', ConnectionSchema);