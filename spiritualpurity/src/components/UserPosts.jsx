// src/components/UserPosts.jsx

import React, { useState, useEffect, useRef } from 'react';
import ShareButton from './ShareButton';
import API_CONFIG from '../config/api';
import styles from '../styles/UserPosts.module.css';

const UserPosts = ({ userId, isOwnProfile = false, currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    content: '',
    visibility: 'public',
    tags: [],
    media: []
  });
  const [uploading, setUploading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState([]);
  const fileInputRef = useRef(null);

  const availableTags = [
    'Faith', 'Prayer', 'Testimony', 'Bible Study', 'Worship', 
    'Fellowship', 'Ministry', 'Missions', 'Family', 'Marriage',
    'Parenting', 'Youth', 'Seniors', 'Music', 'Art', 'Nature',
    'Gratitude', 'Encouragement', 'Life Update', 'Question'
  ];

  useEffect(() => {
    fetchPosts();
  }, [userId]);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setPosts(data.data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const previews = [];

    files.forEach(file => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previews.push({
            file: file,
            preview: e.target.result,
            type: file.type.startsWith('image/') ? 'image' : 'video'
          });
          
          if (previews.length === files.length) {
            setPreviewFiles([...previewFiles, ...previews]);
            setNewPost(prev => ({
              ...prev,
              media: [...prev.media, ...files]
            }));
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePreviewFile = (index) => {
    const updatedPreviews = previewFiles.filter((_, i) => i !== index);
    const updatedMedia = newPost.media.filter((_, i) => i !== index);
    
    setPreviewFiles(updatedPreviews);
    setNewPost(prev => ({
      ...prev,
      media: updatedMedia
    }));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!newPost.content.trim() && newPost.media.length === 0) {
      alert('Please add some content or media to your post');
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('content', newPost.content);
      formData.append('visibility', newPost.visibility);
      formData.append('tags', JSON.stringify(newPost.tags));
      
      newPost.media.forEach((file) => {
        formData.append('media', file);
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setPosts([data.data.post, ...posts]);
        setNewPost({
          content: '',
          visibility: 'public',
          tags: [],
          media: []
        });
        setPreviewFiles([]);
        setShowCreatePost(false);
        alert('Post created successfully!');
      } else {
        alert(data.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/${postId}/like`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setPosts(posts.map(post => {
          if (post._id === postId) {
            const updatedPost = { ...post };
            const existingLike = updatedPost.likes.find(like => 
              like.user._id === currentUser._id
            );

            if (existingLike) {
              updatedPost.likes = updatedPost.likes.filter(like => 
                like.user._id !== currentUser._id
              );
            } else {
              updatedPost.likes.push({
                user: { _id: currentUser._id, firstName: currentUser.firstName },
                likedAt: new Date()
              });
            }
            return updatedPost;
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async (postId, content) => {
    if (!content.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      if (data.success) {
        setPosts(posts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              comments: [...post.comments, data.data.comment]
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getProfileImageUrl = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('http')) {
      return profilePicture;
    }
    return `${API_CONFIG.BASE_URL}${profilePicture}`;
  };

  const isLikedByUser = (post) => {
    return post.likes.some(like => like.user._id === currentUser?._id);
  };

  // NEW: Create share data for posts
  const createPostShareData = (post) => {
    return {
      id: post._id,
      title: `Post by ${post.author.firstName} ${post.author.lastName}`,
      description: post.content || 'Check out this post from our spiritual community',
      imageUrl: post.media && post.media.length > 0 ? post.media[0].url : getProfileImageUrl(post.author.profilePicture)
    };
  };

  if (loading) {
    return (
      <div className={styles.postsSection}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.postsSection}>
      <div className={styles.sectionHeader}>
        <h3>
          <span className="material-icons">photo_library</span>
          Posts
        </h3>
        {isOwnProfile && (
          <button 
            onClick={() => setShowCreatePost(!showCreatePost)}
            className={styles.createPostButton}
          >
            <span className="material-icons">add</span>
            Create Post
          </button>
        )}
      </div>

      {/* Create Post Form */}
      {showCreatePost && isOwnProfile && (
        <div className={styles.createPostForm}>
          <form onSubmit={handleCreatePost}>
            <div className={styles.postContent}>
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your thoughts, testimony, or inspiration..."
                className={styles.contentTextarea}
                rows="4"
              />

              {/* File Previews */}
              {previewFiles.length > 0 && (
                <div className={styles.mediaPreview}>
                  {previewFiles.map((preview, index) => (
                    <div key={index} className={styles.previewItem}>
                      {preview.type === 'image' ? (
                        <img src={preview.preview} alt="Preview" />
                      ) : (
                        <video src={preview.preview} controls />
                      )}
                      <button 
                        type="button"
                        onClick={() => removePreviewFile(index)}
                        className={styles.removePreview}
                      >
                        <span className="material-icons">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags Selection */}
              <div className={styles.tagsSection}>
                <label>Tags (optional):</label>
                <div className={styles.tagsGrid}>
                  {availableTags.map(tag => (
                    <label key={tag} className={styles.tagCheckbox}>
                      <input
                        type="checkbox"
                        checked={newPost.tags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewPost(prev => ({
                              ...prev,
                              tags: [...prev.tags, tag]
                            }));
                          } else {
                            setNewPost(prev => ({
                              ...prev,
                              tags: prev.tags.filter(t => t !== tag)
                            }));
                          }
                        }}
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.postActions}>
              <div className={styles.leftActions}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*"
                  multiple
                  style={{ display: 'none' }}
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={styles.mediaButton}
                >
                  <span className="material-icons">photo_camera</span>
                  Add Media
                </button>

                <select
                  value={newPost.visibility}
                  onChange={(e) => setNewPost(prev => ({ ...prev, visibility: e.target.value }))}
                  className={styles.visibilitySelect}
                >
                  <option value="public">Public - Everyone can see</option>
                  <option value="connections">Connections - Only connected members</option>
                  <option value="private">Private - Only me</option>
                </select>
              </div>

              <div className={styles.rightActions}>
                <button 
                  type="button"
                  onClick={() => {
                    setShowCreatePost(false);
                    setNewPost({
                      content: '',
                      visibility: 'public',
                      tags: [],
                      media: []
                    });
                    setPreviewFiles([]);
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={uploading || (!newPost.content.trim() && newPost.media.length === 0)}
                  className={styles.submitButton}
                >
                  {uploading ? 'Posting...' : 'Share Post'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div className={styles.postsList}>
        {posts.length === 0 ? (
          <div className={styles.noPosts}>
            <span className="material-icons">photo_library</span>
            <h4>No posts yet</h4>
            <p>
              {isOwnProfile 
                ? "Share your first post to connect with the community!" 
                : "This member hasn't shared any posts yet."
              }
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className={styles.postCard}>
              {/* Post Header */}
              <div className={styles.postHeader}>
                <div className={styles.authorInfo}>
                  <div className={styles.authorAvatar}>
                    {post.author.profilePicture ? (
                      <img 
                        src={getProfileImageUrl(post.author.profilePicture)}
                        alt={`${post.author.firstName} ${post.author.lastName}`}
                      />
                    ) : (
                      <span className="material-icons">person</span>
                    )}
                  </div>
                  <div className={styles.authorDetails}>
                    <h4>{post.author.firstName} {post.author.lastName}</h4>
                    <div className={styles.postMeta}>
                      <span className={styles.postDate}>{formatDate(post.createdAt)}</span>
                      <span className={styles.visibilityBadge}>
                        <span className="material-icons">
                          {post.visibility === 'public' ? 'public' : 
                           post.visibility === 'connections' ? 'people' : 'lock'}
                        </span>
                        {post.visibility}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.postHeaderActions}>
                  {/* NEW: Share Button for Posts */}
                  <ShareButton
                    shareType="post"
                    shareData={createPostShareData(post)}
                    currentUser={currentUser}
                    buttonStyle="icon"
                    size="small"
                    className={styles.shareButtonHeader}
                  />
                  
                  {isOwnProfile && (
                    <div className={styles.postOptions}>
                      <span className="material-icons">more_vert</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Post Content */}
              {post.content && (
                <div className={styles.postContent}>
                  <p>{post.content}</p>
                </div>
              )}

              {/* Post Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className={styles.postTags}>
                  {post.tags.map(tag => (
                    <span key={tag} className={styles.tag}>#{tag}</span>
                  ))}
                </div>
              )}

              {/* Post Media */}
              {post.media && post.media.length > 0 && (
                <div className={styles.postMedia}>
                  <div className={`${styles.mediaGrid} ${styles[`media${post.media.length}`]}`}>
                    {post.media.map((media, index) => (
                      <div key={index} className={styles.mediaItem}>
                        {media.type === 'image' ? (
                          <img src={media.url} alt="Post media" />
                        ) : (
                          <video controls poster={media.thumbnail}>
                            <source src={media.url} type="video/mp4" />
                          </video>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bible Verse */}
              {post.verseReference?.reference && (
                <div className={styles.verseReference}>
                  <span className="material-icons">menu_book</span>
                  <span>{post.verseReference.reference}</span>
                </div>
              )}

              {/* Post Engagement */}
              <div className={styles.postEngagement}>
                <div className={styles.engagementStats}>
                  <span>{post.likes?.length || 0} likes</span>
                  <span>{post.comments?.length || 0} comments</span>
                </div>

                <div className={styles.engagementActions}>
                  <button 
                    onClick={() => handleLikePost(post._id)}
                    className={`${styles.actionButton} ${isLikedByUser(post) ? styles.liked : ''}`}
                  >
                    <span className="material-icons">
                      {isLikedByUser(post) ? 'favorite' : 'favorite_border'}
                    </span>
                    Like
                  </button>
                  <button className={styles.actionButton}>
                    <span className="material-icons">comment</span>
                    Comment
                  </button>
                  
                  {/* NEW: Share Button in Engagement Actions */}
                  <ShareButton
                    shareType="post"
                    shareData={createPostShareData(post)}
                    currentUser={currentUser}
                    buttonStyle="button"
                    size="small"
                    className={styles.shareButtonAction}
                  />
                  
                  <button className={styles.actionButton}>
                    <span className="material-icons">volunteer_activism</span>
                    Pray
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {post.comments && post.comments.length > 0 && (
                <div className={styles.commentsSection}>
                  {post.comments.slice(-2).map((comment) => (
                    <div key={comment._id} className={styles.comment}>
                      <div className={styles.commentAvatar}>
                        {comment.user.profilePicture ? (
                          <img 
                            src={getProfileImageUrl(comment.user.profilePicture)}
                            alt={`${comment.user.firstName} ${comment.user.lastName}`}
                          />
                        ) : (
                          <span className="material-icons">person</span>
                        )}
                      </div>
                      <div className={styles.commentContent}>
                        <div className={styles.commentBubble}>
                          <strong>{comment.user.firstName} {comment.user.lastName}</strong>
                          <p>{comment.content}</p>
                        </div>
                        <div className={styles.commentMeta}>
                          <span>{formatDate(comment.createdAt)}</span>
                          <button>Like</button>
                          <button>Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {post.comments.length > 2 && (
                    <button className={styles.viewAllComments}>
                      View all {post.comments.length} comments
                    </button>
                  )}
                </div>
              )}

              {/* Add Comment */}
              <div className={styles.addComment}>
                <div className={styles.commentAvatar}>
                  {currentUser?.profilePicture ? (
                    <img 
                      src={getProfileImageUrl(currentUser.profilePicture)}
                      alt="Your avatar"
                    />
                  ) : (
                    <span className="material-icons">person</span>
                  )}
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const content = e.target.comment.value;
                    if (content.trim()) {
                      handleAddComment(post._id, content);
                      e.target.comment.value = '';
                    }
                  }}
                  className={styles.commentForm}
                >
                  <input
                    name="comment"
                    type="text"
                    placeholder="Write a comment..."
                    className={styles.commentInput}
                  />
                  <button type="submit" className={styles.commentSubmit}>
                    <span className="material-icons">send</span>
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserPosts;