// src/pages/admin/AdminContent.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from '../../config/api';
import styles from '../../styles/admin/Admin.module.css';

const AdminContent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    pendingReview: 0,
    reportedContent: 0,
    flaggedMessages: 0
  });

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/content/${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setContent(data.data.content);
        
        // Calculate stats based on content
        const reportedCount = data.data.content.filter(item => 
          item.reported?.isReported || item.type === 'reported'
        ).length;
        
        setStats({
          totalPosts: data.data.pagination?.total || data.data.content.length,
          pendingReview: data.data.content.filter(item => 
            item.reported?.moderationStatus === 'pending'
          ).length,
          reportedContent: reportedCount,
          flaggedMessages: 0 // This would come from messages endpoint
        });
      }

    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (contentId, contentType) => {
    try {
      const token = localStorage.getItem('token');
      
      // Different endpoints for different content types
      let endpoint = '';
      if (contentType === 'post') {
        endpoint = `${API_CONFIG.BASE_URL}/api/posts/${contentId}/approve`;
      } else if (contentType === 'comment') {
        endpoint = `${API_CONFIG.BASE_URL}/api/posts/comment/${contentId}/approve`;
      }
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          moderationStatus: 'approved',
          moderatedBy: JSON.parse(localStorage.getItem('user'))._id 
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Content approved!');
        setContent(content.filter(item => item._id !== contentId));
      }
    } catch (error) {
      console.error('Error approving content:', error);
      alert('Failed to approve content');
    }
  };

  const handleReject = async (contentId, contentType) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      
      let endpoint = '';
      if (contentType === 'post') {
        endpoint = `${API_CONFIG.BASE_URL}/api/posts/${contentId}/reject`;
      } else if (contentType === 'comment') {
        endpoint = `${API_CONFIG.BASE_URL}/api/posts/comment/${contentId}/reject`;
      }
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          moderationStatus: 'removed',
          reason: reason,
          moderatedBy: JSON.parse(localStorage.getItem('user'))._id 
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Content rejected!');
        setContent(content.filter(item => item._id !== contentId));
      }
    } catch (error) {
      console.error('Error rejecting content:', error);
      alert('Failed to reject content');
    }
  };

  const handleDelete = async (contentId, contentType) => {
    if (!window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      let endpoint = '';
      if (contentType === 'post') {
        endpoint = `${API_CONFIG.BASE_URL}/api/posts/${contentId}`;
      } else if (contentType === 'comment') {
        endpoint = `${API_CONFIG.BASE_URL}/api/posts/comment/${contentId}`;
      } else if (contentType === 'message') {
        endpoint = `${API_CONFIG.BASE_URL}/api/admin/messages/${contentId}`;
      }
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Content deleted!');
        setContent(content.filter(item => item._id !== contentId));
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content');
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    return new Date(date).toLocaleDateString();
  };

  const getContentTypeIcon = (type) => {
    switch(type) {
      case 'post': return 'article';
      case 'comment': return 'comment';
      case 'testimony': return 'auto_stories';
      case 'message': return 'message';
      default: return 'description';
    }
  };

  return (
    <div className={styles.adminPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Content Moderation</h1>
          <p>Review and manage user-generated content</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statBadge}>
            <span className="material-icons">pending</span>
            {stats.pendingReview} Pending
          </div>
          <div className={`${styles.statBadge} ${styles.warning}`}>
            <span className="material-icons">flag</span>
            {stats.reportedContent} Reported
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'posts' ? styles.active : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <span className="material-icons">article</span>
            Posts
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'testimonies' ? styles.active : ''}`}
            onClick={() => setActiveTab('testimonies')}
          >
            <span className="material-icons">auto_stories</span>
            Testimonies
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            <span className="material-icons">comment</span>
            Comments
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'reported' ? styles.active : ''}`}
            onClick={() => setActiveTab('reported')}
          >
            <span className="material-icons">flag</span>
            Reported
          </button>
        </div>
      </div>

      {/* Content List */}
      <div className={styles.contentSection}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading content...</p>
          </div>
        ) : content.length === 0 ? (
          <div className={styles.emptyState}>
            <span className="material-icons">inbox</span>
            <h3>No content to review</h3>
            <p>Content requiring moderation will appear here</p>
          </div>
        ) : (
          <div className={styles.contentList}>
            {content.map((item) => (
              <div 
                key={item._id} 
                className={`${styles.contentCard} ${item.reported?.isReported ? styles.reported : ''}`}
              >
                <div className={styles.contentHeader}>
                  <div className={styles.contentType}>
                    <span className="material-icons">{getContentTypeIcon(item.type)}</span>
                    <span>{item.type}</span>
                  </div>
                  <div className={styles.contentMeta}>
                    <span>{formatTime(item.createdAt)}</span>
                    {item.reported?.isReported && (
                      <span className={styles.reportBadge}>
                        <span className="material-icons">flag</span>
                        {item.reported.reportedBy?.length || 1} report(s)
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.contentBody}>
                  <div className={styles.authorInfo}>
                    <div className={styles.authorAvatar}>
                      {item.author?.profilePicture ? (
                        <img src={item.author.profilePicture} alt="" />
                      ) : (
                        <span className="material-icons">person</span>
                      )}
                    </div>
                    <div className={styles.authorDetails}>
                      <h4>{item.author?.firstName} {item.author?.lastName}</h4>
                      <p>{item.author?.email}</p>
                    </div>
                  </div>

                  <div className={styles.contentText}>
                    <p>{item.content}</p>
                    
                    {/* Show media if it's a post */}
                    {item.media && item.media.length > 0 && (
                      <div className={styles.contentMedia}>
                        {item.media.map((media, index) => (
                          <div key={index} className={styles.mediaItem}>
                            {media.type === 'image' ? (
                              <img src={media.url} alt="" />
                            ) : (
                              <video controls>
                                <source src={media.url} type="video/mp4" />
                              </video>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show post title for comments */}
                    {item.type === 'comment' && item.postTitle && (
                      <div className={styles.parentPost}>
                        <span className="material-icons">reply</span>
                        Comment on: {item.postTitle}
                      </div>
                    )}
                  </div>

                  {/* Show report reasons if reported */}
                  {item.reported?.isReported && item.reported.reportedBy && (
                    <div className={styles.reportReasons}>
                      <h5>Report Reasons:</h5>
                      {item.reported.reportedBy.map((report, index) => (
                        <div key={index} className={styles.reportItem}>
                          <span className="material-icons">report</span>
                          <span>{report.reason}</span>
                          {report.description && <p>{report.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.contentActions}>
                  <button
                    onClick={() => navigate(`/member/${item.author?._id}`)}
                    className={styles.actionButton}
                  >
                    <span className="material-icons">person</span>
                    View Author
                  </button>

                  {item.type === 'post' && (
                    <button
                      onClick={() => navigate(`/post/${item._id}`)}
                      className={styles.actionButton}
                    >
                      <span className="material-icons">visibility</span>
                      View Post
                    </button>
                  )}

                  {item.reported?.moderationStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(item._id, item.type)}
                        className={`${styles.actionButton} ${styles.success}`}
                      >
                        <span className="material-icons">check_circle</span>
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(item._id, item.type)}
                        className={`${styles.actionButton} ${styles.warning}`}
                      >
                        <span className="material-icons">cancel</span>
                        Reject
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDelete(item._id, item.type)}
                    className={`${styles.actionButton} ${styles.danger}`}
                  >
                    <span className="material-icons">delete</span>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContent;