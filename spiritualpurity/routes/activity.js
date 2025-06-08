// routes/activity.js

const express = require('express');
const router = express.Router();
const { adminAuth, moderatorAuth } = require('../middleware/adminAuth');
const User = require('../models/User');
const Post = require('../models/Post');
const Connection = require('../models/Connection');
const Message = require('../models/Message');

// @route   GET /api/admin/dashboard/recent-activity
// @desc    Get recent activity for admin dashboard
// @access  Admin/Moderator
router.get('/dashboard/recent-activity', moderatorAuth, async (req, res) => {
  try {
    const activities = [];
    const limit = 20; // Get last 20 activities
    
    // Get recent user registrations
    const recentUsers = await User.find({ isActive: true })
      .sort({ joinDate: -1 })
      .limit(5)
      .select('firstName lastName joinDate');
    
    recentUsers.forEach(user => {
      activities.push({
        type: 'user_joined',
        message: `${user.firstName} ${user.lastName} joined the community`,
        time: user.joinDate,
        icon: 'person_add'
      });
    });

    // Get recent posts
    const recentPosts = await Post.find({ 
      isActive: true,
      'reported.moderationStatus': { $ne: 'removed' }
    })
    .populate('author', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(5);
    
    recentPosts.forEach(post => {
      activities.push({
        type: 'post_created',
        message: `${post.author.firstName} ${post.author.lastName} created a new post`,
        time: post.createdAt,
        icon: 'article'
      });
    });

    // Get recent connections
    const recentConnections = await Connection.find({ status: 'accepted' })
      .populate('requester recipient', 'firstName lastName')
      .sort({ respondedAt: -1 })
      .limit(5);
    
    recentConnections.forEach(connection => {
      activities.push({
        type: 'connection_made',
        message: `${connection.requester.firstName} and ${connection.recipient.firstName} connected`,
        time: connection.respondedAt,
        icon: 'people'
      });
    });

    // Get recent prayer requests
    const usersWithRecentPrayers = await User.find({
      'prayerRequests.createdAt': { 
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    }).select('firstName lastName prayerRequests');

    usersWithRecentPrayers.forEach(user => {
      user.prayerRequests
        .filter(prayer => !prayer.isPrivate)
        .slice(-2) // Get last 2 prayers from each user
        .forEach(prayer => {
          activities.push({
            type: 'prayer_request',
            message: `${user.firstName} ${user.lastName} shared a prayer request`,
            time: prayer.createdAt,
            icon: 'volunteer_activism'
          });
        });
    });

    // Sort all activities by time (newest first)
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    // Limit to requested number and format time
    const formattedActivities = activities.slice(0, limit).map(activity => ({
      ...activity,
      time: formatTimeAgo(activity.time)
    }));

    res.json({
      success: true,
      data: {
        activities: formattedActivities
      }
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity'
    });
  }
});

// Helper function to format time
function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  return new Date(date).toLocaleDateString();
}

module.exports = router;