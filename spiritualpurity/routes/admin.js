const express = require('express');
const router = express.Router();
const User = require('../models/User');
const moderatorAuth = require('../middleware/moderatorAuth');
const adminAuth = require('../middleware/adminAuth');
const Post = require('../models/Post');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// @route   GET /api/admin/prayers
// @desc    Get all prayers for admin management
// @access  Admin/Moderator
router.get('/prayers', moderatorAuth, async (req, res) => {
  try {
    const { category, status, sort = 'newest', search = '' } = req.query;
    
    // Build query for users
    const userQuery = { isActive: true };
    
    if (search) {
      userQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(userQuery)
      .select('firstName lastName email profilePicture prayerRequests joinDate')
      .sort({ joinDate: -1 });

    // Extract all prayers with user info
    const prayers = [];
    users.forEach(user => {
      user.prayerRequests.forEach(prayer => {
        prayers.push({
          _id: prayer._id,
          userId: user._id,
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profilePicture: user.profilePicture
          },
          request: prayer.request,
          category: prayer.category || 'Other',
          isPrivate: prayer.isPrivate,
          isAnswered: prayer.isAnswered,
          prayerCount: prayer.prayerCount || 0,
          createdAt: prayer.createdAt
        });
      });
    });

    // Apply filters
    let filteredPrayers = prayers;
    
    if (category && category !== '') {
      filteredPrayers = filteredPrayers.filter(p => p.category === category);
    }
    
    if (status === 'answered') {
      filteredPrayers = filteredPrayers.filter(p => p.isAnswered);
    } else if (status === 'active') {
      filteredPrayers = filteredPrayers.filter(p => !p.isAnswered);
    } else if (status === 'private') {
      filteredPrayers = filteredPrayers.filter(p => p.isPrivate);
    }

    // Sort prayers
    switch (sort) {
      case 'oldest':
        filteredPrayers.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'mostPrayed':
        filteredPrayers.sort((a, b) => b.prayerCount - a.prayerCount);
        break;
      default: // newest
        filteredPrayers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Calculate stats
    const stats = {
      totalPrayers: prayers.length,
      activePrayers: prayers.filter(p => !p.isAnswered).length,
      answeredPrayers: prayers.filter(p => p.isAnswered).length,
      privatePrayers: prayers.filter(p => p.isPrivate).length,
      todaysPrayers: prayers.filter(p => {
        const today = new Date();
        const prayerDate = new Date(p.createdAt);
        return prayerDate.toDateString() === today.toDateString();
      }).length,
      prayersOffered: prayers.reduce((sum, p) => sum + (p.prayerCount || 0), 0)
    };

    res.json({
      success: true,
      data: {
        prayers: filteredPrayers,
        stats
      }
    });

  } catch (error) {
    console.error('Get admin prayers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prayers'
    });
  }
});

// @route   PUT /api/admin/prayers/:userId/:prayerId
// @desc    Admin update prayer request (mark answered, delete, etc)
// @access  Admin/Moderator
router.put('/prayers/:userId/:prayerId', moderatorAuth, async (req, res) => {
  try {
    const { userId, prayerId } = req.params;
    const { action, reason } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const prayer = user.prayerRequests.id(prayerId);
    
    if (!prayer) {
      return res.status(404).json({
        success: false,
        message: 'Prayer request not found'
      });
    }

    switch (action) {
      case 'markAnswered':
        prayer.isAnswered = true;
        break;
      case 'markUnanswered':
        prayer.isAnswered = false;
        break;
      case 'togglePrivacy':
        prayer.isPrivate = !prayer.isPrivate;
        break;
      case 'delete':
        const prayerIndex = user.prayerRequests.findIndex(
          p => p._id.toString() === prayerId
        );
        if (prayerIndex > -1) {
          user.prayerRequests.splice(prayerIndex, 1);
        }
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    await user.save();

    res.json({
      success: true,
      message: `Prayer ${action} completed successfully`,
      data: { prayer }
    });

  } catch (error) {
    console.error('Update prayer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prayer request'
    });
  }
});

// @route   GET /api/admin/conversations
// @desc    Get all conversations for monitoring
// @access  Admin only
router.get('/conversations', adminAuth, async (req, res) => {
  try {
    const { status = 'all', search = '', page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (search) {
      // First find users matching search
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(u => u._id);
      query.participants = { $in: userIds };
    }

    const conversations = await Conversation.find(query)
      .populate('participants', 'firstName lastName email profilePicture isActive')
      .populate('lastMessage.sender', 'firstName lastName')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get additional stats for each conversation
    const conversationsWithStats = await Promise.all(
      conversations.map(async (conv) => {
        const messageCount = await Message.countDocuments({ 
          conversation: conv._id 
        });
        
        const reportedMessages = await Message.find({
          conversation: conv._id,
          'reported.isReported': true
        }).select('reported');

        const reportCount = reportedMessages.length;
        const hasReportedMessages = reportCount > 0;

        return {
          _id: conv._id,
          participants: conv.participants,
          lastMessage: conv.lastMessage,
          lastActivity: conv.lastActivity,
          createdAt: conv.createdAt,
          messageCount,
          reportCount,
          hasReportedMessages,
          status: hasReportedMessages ? 'reported' : 
                  conv.lastActivity > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 'active' : 
                  'inactive'
        };
      })
    );

    // Filter by status if specified
    let filteredConversations = conversationsWithStats;
    if (status === 'active') {
      filteredConversations = conversationsWithStats.filter(c => c.status === 'active');
    } else if (status === 'reported') {
      filteredConversations = conversationsWithStats.filter(c => c.hasReportedMessages);
    } else if (status === 'archived') {
      filteredConversations = conversationsWithStats.filter(c => c.status === 'inactive');
    }

    const totalConversations = await Conversation.countDocuments(query);

    res.json({
      success: true,
      data: {
        conversations: filteredConversations,
        pagination: {
          total: totalConversations,
          page: parseInt(page),
          pages: Math.ceil(totalConversations / limit),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get admin conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

// @route   GET /api/admin/messages/:conversationId
// @desc    Get messages in a conversation for monitoring
// @access  Admin only
router.get('/messages/:conversationId', adminAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 100 } = req.query;
    const skip = (page - 1) * limit;

    // Verify conversation exists
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'firstName lastName email profilePicture');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Get messages
    const messages = await Message.find({
      conversation: conversationId
    })
    .populate('sender', 'firstName lastName email profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const totalMessages = await Message.countDocuments({
      conversation: conversationId
    });

    res.json({
      success: true,
      data: {
        conversation,
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          total: totalMessages,
          page: parseInt(page),
          pages: Math.ceil(totalMessages / limit),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// @route   DELETE /api/admin/messages/:messageId
// @desc    Delete a message (hard delete for moderation)
// @access  Admin/Moderator
router.delete('/messages/:messageId', moderatorAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reason } = req.body;

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Update message status to removed
    message.reported.moderationStatus = 'removed';
    message.reported.moderatedBy = req.user._id;
    message.reported.moderatedAt = new Date();
    await message.save();

    // Optionally hard delete
    // await Message.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: 'Message removed successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

// @route   PUT /api/admin/conversations/:conversationId/block
// @desc    Block a conversation (prevent users from messaging each other)
// @access  Admin only
router.put('/conversations/:conversationId/block', adminAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { reason } = req.body;

    // For now, we'll delete the conversation
    // In a production app, you might want to add a blocked status
    await Conversation.findByIdAndDelete(conversationId);
    await Message.deleteMany({ conversation: conversationId });

    res.json({
      success: true,
      message: 'Conversation blocked and deleted'
    });

  } catch (error) {
    console.error('Block conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block conversation'
    });
  }
});

// @route   GET /api/admin/content/:type
// @desc    Get content by type for moderation
// @access  Admin/Moderator
router.get('/content/:type', moderatorAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let content = [];
    let total = 0;

    switch (type) {
      case 'posts':
        const postQuery = status === 'reported' 
          ? { 'reported.isReported': true }
          : {};

        content = await Post.find(postQuery)
          .populate('author', 'firstName lastName email profilePicture')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit));

        total = await Post.countDocuments(postQuery);
        break;

      case 'testimonies':
        // Get users with testimonies
        const userQuery = { testimony: { $exists: true, $ne: '' } };
        const users = await User.find(userQuery)
          .select('firstName lastName email testimony joinDate')
          .sort({ joinDate: -1 })
          .skip(skip)
          .limit(parseInt(limit));

        content = users.map(user => ({
          _id: user._id,
          type: 'testimony',
          author: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          },
          content: user.testimony,
          createdAt: user.joinDate
        }));

        total = await User.countDocuments(userQuery);
        break;

      case 'comments':
        // Get all posts with comments
        const postsWithComments = await Post.find({
          'comments.0': { $exists: true }
        }).populate('author', 'firstName lastName')
          .populate('comments.user', 'firstName lastName email');

        // Extract comments
        const allComments = [];
        postsWithComments.forEach(post => {
          post.comments.forEach(comment => {
            allComments.push({
              _id: comment._id,
              type: 'comment',
              postId: post._id,
              postTitle: post.content ? post.content.substring(0, 50) + '...' : 'Post',
              author: comment.user,
              content: comment.content,
              createdAt: comment.createdAt
            });
          });
        });

        // Sort and paginate
        allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        content = allComments.slice(skip, skip + limit);
        total = allComments.length;
        break;

      case 'reported':
        // Get all reported content
        const reportedPosts = await Post.find({
          'reported.isReported': true
        }).populate('author', 'firstName lastName email profilePicture');

        const reportedMessages = await Message.find({
          'reported.isReported': true
        }).populate('sender', 'firstName lastName email profilePicture');

        content = [
          ...reportedPosts.map(post => ({
            _id: post._id,
            type: 'post',
            author: post.author,
            content: post.content,
            media: post.media,
            reported: post.reported,
            createdAt: post.createdAt
          })),
          ...reportedMessages.map(msg => ({
            _id: msg._id,
            type: 'message',
            author: msg.sender,
            content: msg.content,
            reported: msg.reported,
            createdAt: msg.createdAt
          }))
        ];

        content.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        total = content.length;
        content = content.slice(skip, skip + limit);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid content type'
        });
    }

    res.json({
      success: true,
      data: {
        content,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content'
    });
  }
});

// Export the router at the end of the file
module.exports = router;