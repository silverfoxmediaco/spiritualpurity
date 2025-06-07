// spiritualpurity/routes/posts.js

const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Post = require('../models/Post');
const User = require('../models/User');
const Connection = require('../models/Connection');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'spiritualpurity/posts/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      {
        width: 1200,
        height: 1200,
        crop: 'limit',
        quality: 'auto:good'
      }
    ],
    public_id: (req, file) => {
      return `post-image-${req.user._id}-${Date.now()}`;
    }
  }
});

// Configure Cloudinary storage for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'spiritualpurity/posts/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'],
    transformation: [
      {
        width: 1280,
        height: 720,
        crop: 'limit',
        quality: 'auto:good'
      }
    ],
    public_id: (req, file) => {
      return `post-video-${req.user._id}-${Date.now()}`;
    }
  }
});

// Multer configuration for mixed uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

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

// Helper function to upload file to Cloudinary
const uploadToCloudinary = (fileBuffer, options) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }).end(fileBuffer);
  });
};

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', authenticateToken, upload.array('media', 10), async (req, res) => {
  try {
    const { content, visibility = 'public', tags } = req.body;
    const files = req.files || [];

    // Validate input
    if (!content && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post must have content or media'
      });
    }

    // Process uploaded files
    const mediaItems = [];
    
    for (const file of files) {
      try {
        let uploadOptions = {
          folder: file.mimetype.startsWith('image/') 
            ? 'spiritualpurity/posts/images' 
            : 'spiritualpurity/posts/videos',
          public_id: `post-${req.user._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        if (file.mimetype.startsWith('image/')) {
          uploadOptions.transformation = [
            { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' }
          ];
        } else if (file.mimetype.startsWith('video/')) {
          uploadOptions.resource_type = 'video';
          uploadOptions.transformation = [
            { width: 1280, height: 720, crop: 'limit', quality: 'auto:good' }
          ];
        }

        const result = await uploadToCloudinary(file.buffer, uploadOptions);
        
        const mediaItem = {
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          url: result.secure_url,
          originalName: file.originalname,
          size: file.size
        };

        // Add video-specific properties
        if (file.mimetype.startsWith('video/')) {
          mediaItem.duration = result.duration;
          // Generate thumbnail for video
          const thumbnailUrl = cloudinary.url(result.public_id, {
            resource_type: 'video',
            format: 'jpg',
            transformation: [
              { width: 400, height: 300, crop: 'fill' }
            ]
          });
          mediaItem.thumbnail = thumbnailUrl;
        }

        mediaItems.push(mediaItem);
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        // Continue with other files, don't fail the entire post
      }
    }

    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = Array.isArray(tags) ? tags : [tags];
      }
    }

    // Create post
    const post = new Post({
      author: req.user._id,
      content: content ? content.trim() : '',
      media: mediaItems,
      visibility,
      tags: parsedTags
    });

    await post.save();
    
    // Populate author information
    await post.populate('author', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }
});

// @route   GET /api/posts/feed
// @desc    Get posts for user's feed
// @access  Private
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, visibility = 'all' } = req.query;
    
    const posts = await Post.getFeedPosts(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      visibility
    });

    res.json({
      success: true,
      data: {
        posts,
        hasMore: posts.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load feed'
    });
  }
});

// @route   GET /api/posts/user/:userId
// @desc    Get posts by specific user
// @access  Private
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Check if requesting user can view this user's posts
    const isOwnProfile = userId === req.user._id.toString();
    let visibilityFilter = { visibility: 'public' };

    if (isOwnProfile) {
      // User can see all their own posts
      visibilityFilter = {};
    } else {
      // Check if users are connected
      const connection = await Connection.findOne({
        $or: [
          { requester: req.user._id, recipient: userId, status: 'accepted' },
          { requester: userId, recipient: req.user._id, status: 'accepted' }
        ]
      });

      if (connection) {
        // Connected users can see public and connections posts
        visibilityFilter = { visibility: { $in: ['public', 'connections'] } };
      }
    }

    const posts = await Post.find({
      author: userId,
      isActive: true,
      'reported.moderationStatus': { $ne: 'removed' },
      ...visibilityFilter
    })
    .populate('author', 'firstName lastName profilePicture')
    .populate('comments.user', 'firstName lastName profilePicture')
    .populate('comments.replies.user', 'firstName lastName profilePicture')
    .populate('likes.user', 'firstName lastName')
    .sort({ isPinned: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        posts,
        hasMore: posts.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load user posts'
    });
  }
});

// @route   GET /api/posts/:postId/view
// @desc    Get individual post for sharing/viewing
// @access  Private
router.get('/:postId/view', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('author', 'firstName lastName profilePicture')
      .populate('comments.user', 'firstName lastName profilePicture')
      .populate('comments.replies.user', 'firstName lastName profilePicture')
      .populate('likes.user', 'firstName lastName');
    
    if (!post || !post.isActive || post.reported.moderationStatus === 'removed') {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user can view this post
    const canView = await post.canUserView(req.user._id);
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You cannot access this post'
      });
    }

    res.json({
      success: true,
      data: {
        post: post
      }
    });

  } catch (error) {
    console.error('Get individual post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load post'
    });
  }
});

// @route   PUT /api/posts/:postId/like
// @desc    Like/unlike a post
// @access  Private
router.put('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user can view this post
    const canView = await post.canUserView(req.user._id);
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You cannot access this post'
      });
    }

    const result = post.toggleLike(req.user._id);
    await post.save();

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like post'
    });
  }
});

// @route   POST /api/posts/:postId/comment
// @desc    Add a comment to a post
// @access  Private
router.post('/:postId/comment', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user can view this post
    const canView = await post.canUserView(req.user._id);
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You cannot access this post'
      });
    }

    const comment = post.addComment(req.user._id, content);
    await post.save();
    
    // Populate the new comment
    await post.populate('comments.user', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: post.comments[post.comments.length - 1]
      }
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
});

// @route   POST /api/posts/:postId/comment/:commentId/reply
// @desc    Reply to a comment
// @access  Private
router.post('/:postId/comment/:commentId/reply', authenticateToken, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user can view this post
    const canView = await post.canUserView(req.user._id);
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You cannot access this post'
      });
    }

    const reply = post.addReply(commentId, req.user._id, content);
    await post.save();
    
    // Populate the reply
    await post.populate('comments.replies.user', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      data: {
        reply
      }
    });

  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reply'
    });
  }
});

// @route   DELETE /api/posts/:postId
// @desc    Delete a post
// @access  Private
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findOne({
      _id: postId,
      author: req.user._id
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or unauthorized'
      });
    }

    // Delete media files from Cloudinary
    for (const media of post.media) {
      try {
        // Extract public_id from URL
        const urlParts = media.url.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = `spiritualpurity/posts/${media.type}s/${publicIdWithExtension.split('.')[0]}`;
        
        if (media.type === 'video') {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        } else {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (deleteError) {
        console.log('Could not delete media file:', deleteError.message);
      }
    }

    await Post.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
});

// @route   PUT /api/posts/:postId
// @desc    Update a post
// @access  Private
router.put('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, visibility, tags } = req.body;

    const post = await Post.findOne({
      _id: postId,
      author: req.user._id
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or unauthorized'
      });
    }

    // Update fields
    if (content !== undefined) post.content = content.trim();
    if (visibility !== undefined) post.visibility = visibility;
    if (tags !== undefined) {
      post.tags = Array.isArray(tags) ? tags : [tags];
    }

    await post.save();
    await post.populate('author', 'firstName lastName profilePicture');

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: {
        post
      }
    });

  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post'
    });
  }
});

module.exports = router;