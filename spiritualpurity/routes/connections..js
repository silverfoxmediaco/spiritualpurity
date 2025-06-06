// spiritualpurity/routes/connections.js

const express = require('express');
const Connection = require('../models/Connection');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

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

// @route   POST /api/connections/send-request
// @desc    Send a connection request
// @access  Private
router.post('/send-request', authenticateToken, async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    const requesterId = req.user._id;

    // Validate recipient ID
    if (!recipientId || !recipientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient ID'
      });
    }

    // Can't send request to yourself
    if (recipientId === requesterId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send connection request to yourself'
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingConnection) {
      let statusMessage;
      switch (existingConnection.status) {
        case 'pending':
          statusMessage = existingConnection.requester.toString() === requesterId.toString() 
            ? 'Connection request already sent' 
            : 'This user has already sent you a connection request';
          break;
        case 'accepted':
          statusMessage = 'You are already connected with this user';
          break;
        case 'declined':
          statusMessage = 'Connection request was previously declined';
          break;
        case 'blocked':
          statusMessage = 'Cannot send connection request to this user';
          break;
      }
      
      return res.status(409).json({
        success: false,
        message: statusMessage
      });
    }

    // Create new connection request
    const connection = new Connection({
      requester: requesterId,
      recipient: recipientId,
      message: message ? message.trim() : undefined
    });

    await connection.save();
    await connection.populate('requester recipient', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Connection request sent successfully',
      data: {
        connection
      }
    });

  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send connection request'
    });
  }
});

// @route   GET /api/connections/status/:userId
// @desc    Get connection status with another user
// @access  Private
router.get('/status/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Validate user ID
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const status = await Connection.getConnectionStatus(currentUserId, userId);
    const mutualConnections = await Connection.getMutualConnections(currentUserId, userId);

    res.json({
      success: true,
      data: {
        status,
        mutualConnections
      }
    });

  } catch (error) {
    console.error('Get connection status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get connection status'
    });
  }
});

// @route   GET /api/connections/requests
// @desc    Get pending connection requests (received)
// @access  Private
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const requests = await Connection.find({
      recipient: req.user._id,
      status: 'pending'
    })
    .populate('requester', 'firstName lastName profilePicture bio location joinDate')
    .sort({ requestedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const totalRequests = await Connection.countDocuments({
      recipient: req.user._id,
      status: 'pending'
    });

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRequests / limit),
          totalRequests,
          hasMore: skip + requests.length < totalRequests
        }
      }
    });

  } catch (error) {
    console.error('Get connection requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get connection requests'
    });
  }
});

// @route   GET /api/connections/sent
// @desc    Get sent connection requests
// @access  Private
router.get('/sent', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const sentRequests = await Connection.find({
      requester: req.user._id,
      status: 'pending'
    })
    .populate('recipient', 'firstName lastName profilePicture bio location joinDate')
    .sort({ requestedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const totalSent = await Connection.countDocuments({
      requester: req.user._id,
      status: 'pending'
    });

    res.json({
      success: true,
      data: {
        requests: sentRequests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalSent / limit),
          totalSent,
          hasMore: skip + sentRequests.length < totalSent
        }
      }
    });

  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sent requests'
    });
  }
});

// @route   PUT /api/connections/:connectionId/accept
// @desc    Accept a connection request
// @access  Private
router.put('/:connectionId/accept', authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;

    // Validate connection ID
    if (!connectionId || !connectionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid connection ID'
      });
    }

    const connection = await Connection.findOne({
      _id: connectionId,
      recipient: req.user._id,
      status: 'pending'
    }).populate('requester', 'firstName lastName');

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }

    await connection.accept();

    res.json({
      success: true,
      message: `You are now connected with ${connection.requester.firstName} ${connection.requester.lastName}`,
      data: {
        connection
      }
    });

  } catch (error) {
    console.error('Accept connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept connection request'
    });
  }
});

// @route   PUT /api/connections/:connectionId/decline
// @desc    Decline a connection request
// @access  Private
router.put('/:connectionId/decline', authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;

    // Validate connection ID
    if (!connectionId || !connectionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid connection ID'
      });
    }

    const connection = await Connection.findOne({
      _id: connectionId,
      recipient: req.user._id,
      status: 'pending'
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }

    await connection.decline();

    res.json({
      success: true,
      message: 'Connection request declined'
    });

  } catch (error) {
    console.error('Decline connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline connection request'
    });
  }
});

// @route   GET /api/connections
// @desc    Get all connections (accepted)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const connections = await Connection.find({
      $or: [
        { requester: req.user._id },
        { recipient: req.user._id }
      ],
      status: 'accepted'
    })
    .populate('requester recipient', 'firstName lastName profilePicture bio location')
    .sort({ respondedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Format connections to show the other user
    const formattedConnections = connections.map(conn => {
      const otherUser = conn.requester._id.toString() === req.user._id.toString() 
        ? conn.recipient 
        : conn.requester;
      
      return {
        _id: conn._id,
        user: otherUser,
        connectedAt: conn.respondedAt,
        createdAt: conn.createdAt
      };
    });

    const totalConnections = await Connection.countDocuments({
      $or: [
        { requester: req.user._id },
        { recipient: req.user._id }
      ],
      status: 'accepted'
    });

    res.json({
      success: true,
      data: {
        connections: formattedConnections,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalConnections / limit),
          totalConnections,
          hasMore: skip + connections.length < totalConnections
        }
      }
    });

  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get connections'
    });
  }
});

// @route   DELETE /api/connections/:userId
// @desc    Remove a connection
// @access  Private
router.delete('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Validate user ID
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const connection = await Connection.findOneAndDelete({
      $or: [
        { requester: currentUserId, recipient: userId },
        { requester: userId, recipient: currentUserId }
      ],
      status: 'accepted'
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    res.json({
      success: true,
      message: 'Connection removed successfully'
    });

  } catch (error) {
    console.error('Remove connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove connection'
    });
  }
});

module.exports = router;