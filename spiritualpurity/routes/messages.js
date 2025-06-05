// spiritualpurity-backend/routes/messages.js

const express = require('express');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const User = require('./models/User');
const { authenticateToken } = require('./middleware/auth');

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .populate('participants', 'firstName lastName profilePicture')
    .populate('lastMessage.sender', 'firstName lastName')
    .sort({ lastActivity: -1 });

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
      // Get the other participant (not current user)
      const otherParticipant = conv.participants.find(p => 
        p._id.toString() !== req.user._id.toString()
      );

      return {
        _id: conv._id,
        participant: {
          _id: otherParticipant._id,
          name: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
          profilePicture: otherParticipant.profilePicture
        },
        lastMessage: conv.lastMessage,
        lastActivity: conv.lastActivity,
        unreadCount: conv.unreadCount.get(req.user._id.toString()) || 0
      };
    });

    res.json({
      success: true,
      data: {
        conversations: formattedConversations
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load conversations'
    });
  }
});

// @route   POST /api/messages/conversation/:userId
// @desc    Start or get existing conversation with a user
// @access  Private
router.post('/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user._id;

    // Validate userId parameter
    if (!otherUserId || !otherUserId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Don't allow messaging yourself
    if (otherUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start conversation with yourself'
      });
    }

    // Check if other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId] }
    }).populate('participants', 'firstName lastName profilePicture');

    // If no conversation exists, create one
    if (!conversation) {
      conversation = new Conversation({
        participants: [currentUserId, otherUserId],
        unreadCount: new Map([
          [currentUserId.toString(), 0],
          [otherUserId, 0]
        ])
      });
      await conversation.save();
      await conversation.populate('participants', 'firstName lastName profilePicture');
    }

    // Get the other participant info
    const participant = conversation.participants.find(p => 
      p._id.toString() !== currentUserId.toString()
    );

    res.json({
      success: true,
      data: {
        conversationId: conversation._id,
        participant: {
          _id: participant._id,
          name: `${participant.firstName} ${participant.lastName}`,
          profilePicture: participant.profilePicture
        }
      }
    });

  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start conversation'
    });
  }
});

// @route   GET /api/messages/:conversationId
// @desc    Get messages in a conversation
// @access  Private
router.get('/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Validate conversationId parameter
    if (!conversationId || !conversationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID'
      });
    }

    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Get messages with pagination (newest first)
    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: { $ne: true }
    })
    .populate('sender', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Reset unread count for current user
    conversation.unreadCount.set(req.user._id.toString(), 0);
    await conversation.save();

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        hasMore: messages.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load messages'
    });
  }
});

// @route   POST /api/messages/:conversationId
// @desc    Send a message
// @access  Private
router.post('/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'text', verseReference } = req.body;

    // Validate conversationId parameter
    if (!conversationId || !conversationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Create new message
    const message = new Message({
      conversation: conversationId,
      sender: req.user._id,
      content: content.trim(),
      messageType,
      verseReference: verseReference || undefined
    });

    await message.save();
    await message.populate('sender', 'firstName lastName profilePicture');

    // Update conversation with last message
    conversation.lastMessage = {
      content: content.trim(),
      sender: req.user._id,
      timestamp: new Date()
    };
    conversation.lastActivity = new Date();

    // Increment unread count for other participant
    const otherParticipant = conversation.participants.find(p => 
      p.toString() !== req.user._id.toString()
    );
    const currentUnread = conversation.unreadCount.get(otherParticipant.toString()) || 0;
    conversation.unreadCount.set(otherParticipant.toString(), currentUnread + 1);

    await conversation.save();

    res.status(201).json({
      success: true,
      data: {
        message
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// @route   DELETE /api/messages/message/:messageId
// @desc    Delete a message (soft delete)
// @access  Private
router.delete('/message/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    // Validate messageId parameter
    if (!messageId || !messageId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
    }

    const message = await Message.findOne({
      _id: messageId,
      sender: req.user._id // Only sender can delete their message
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or unauthorized'
      });
    }

    message.isDeleted = true;
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

module.exports = router;