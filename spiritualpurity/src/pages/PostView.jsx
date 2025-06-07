// spiritualpurity/src/pages/PostView.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ShareButton from '../components/ShareButton';
import API_CONFIG from '../config/api';
import styles from '../styles/PostView.module.css';

const PostView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setCurrentUser(JSON.parse(userData));
      fetchPost();
    } else {
      setError('Please log in to view posts');
      setLoading(false);
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/${id}/view`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setPost(data.data.post);
      } else {
        setError(data.message || 'Post not found');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async () => {
    if (!currentUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/${post._id}/like`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        const existingLike = post.likes.find(like => 
          like.user._id === currentUser._id
        );

        if (existingLike) {
          setPost(prev => ({
            ...prev,
            likes: prev.likes.filter(like => like.user._id !== currentUser._id)
          }));
        } else {
          setPost(prev => ({
            ...prev,
            likes: [...prev.likes, {
              user: { _id: currentUser._id, firstName: currentUser.firstName },
              likedAt: new Date()
            }]
          }));
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    const content = e.target.comment.value;
    if (!content.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/${post._id}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      if (data.success) {
        setPost(prev => ({
          ...prev,
          comments: [...prev.comments, data.data.comment]
        }));
        e.target.comment.value = '';
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

  const isLikedByUser = () => {
    return post?.likes?.some(like => like.user._id === currentUser?._id);
  };

  const createPostShareData = () => {
    if (!post) return null;
    
    return {
      id: post._id,
      title: `Post by ${post.author.firstName} ${post.author.lastName}`,
      description: post.content || 'Check out this post from our spiritual community',
      imageUrl: post.media && post.media.length > 0 ? post.media[0].url : getProfileImageUrl(post.author.profilePicture)
    };
  };

  if (loading) {
    return (
      <div className={styles.postViewPage}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <h2>Loading Post...</h2>
          <p>Fetching shared content</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.postViewPage}>
        <Header />
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>
            <span className="material-icons">error_outline</span>
          </div>
          <h2>Post Not Available</h2>
          <p>{error}</p>
          <div className={styles.errorActions}>
            <button onClick={() => navigate('/community')} className={styles.backButton}>
              <span className="material-icons">arrow_back</span>
              Back to Community
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.postViewPage}>
      <Header />
      
      <div className="container">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
              <button onClick={() => navigate('/community')} className={styles.breadcrumbLink}>
                <span className="material-icons">home</span>
                Community
              </button>
              <span className={styles.breadcrumbSeparator}>
                <span className="material-icons">chevron_right</span>
              </span>
              <span className={styles.breadcrumbCurrent}>Shared Post</span>
            </div>

            {/* Post Card */}
            <div className={styles.postCard}>
              
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
                    <h4 
                      onClick={() => navigate(`/member/${post.author._id}`)}
                      className={styles.authorName}
                    >
                      {post.author.firstName} {post.author.lastName}
                    </h4>
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
                  <ShareButton
                    shareType="post"
                    shareData={createPostShareData()}
                    currentUser={currentUser}
                    buttonStyle="icon"
                    size="medium"
                  />
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
                    onClick={handleLikePost}
                    className={`${styles.actionButton} ${isLikedByUser() ? styles.liked : ''}`}
                  >
                    <span className="material-icons">
                      {isLikedByUser() ? 'favorite' : 'favorite_border'}
                    </span>
                    Like
                  </button>
                  
                  <button className={styles.actionButton}>
                    <span className="material-icons">comment</span>
                    Comment
                  </button>
                  
                  <ShareButton
                    shareType="post"
                    shareData={createPostShareData()}
                    currentUser={currentUser}
                    buttonStyle="button"
                    size="medium"
                  />
                  
                  <button 
                    onClick={() => navigate('/prayer')}
                    className={styles.actionButton}
                  >
                    <span className="material-icons">volunteer_activism</span>
                    Pray
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {post.comments && post.comments.length > 0 && (
                <div className={styles.commentsSection}>
                  <h4>Comments</h4>
                  {post.comments.map((comment) => (
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
                          <strong 
                            onClick={() => navigate(`/member/${comment.user._id}`)}
                            className={styles.commentAuthor}
                          >
                            {comment.user.firstName} {comment.user.lastName}
                          </strong>
                          <p>{comment.content}</p>
                        </div>
                        <div className={styles.commentMeta}>
                          <span>{formatDate(comment.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
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
                <form onSubmit={handleAddComment} className={styles.commentForm}>
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

            {/* Related Actions */}
            <div className={styles.relatedActions}>
              <button 
                onClick={() => navigate(`/member/${post.author._id}`)}
                className={styles.viewProfileButton}
              >
                <span className="material-icons">person</span>
                View {post.author.firstName}'s Profile
              </button>
              
              <button 
                onClick={() => navigate('/community')}
                className={styles.exploreCommunityButton}
              >
                <span className="material-icons">explore</span>
                Explore Community
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PostView;