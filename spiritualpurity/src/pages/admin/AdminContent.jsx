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
      
      // For now, using mock data - replace with actual API calls
      if (activeTab === 'posts') {
        // Mock posts data
        setContent([
          {
            _id: '1',
            type: 'post',
            author: { firstName: 'John', lastName: 'Doe', profilePicture: null },
            content: 'Just finished reading Psalms 23. Such a powerful reminder of God\'s presence in our lives! 🙏',
            mediaUrl: null,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            likes: 12,
            comments: 3,
            status: 'published',
            reported: false
          },
          {
            _id: '2',
            type: 'post',
            author: { firstName: 'Sarah', lastName: 'Johnson', profilePicture: null },
            content: 'Prayer request: My mother is going through surgery tomorrow. Please keep her in your prayers.',
            mediaUrl: null,
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
            likes: 25,
            comments: 8,
            status: 'published',
            reported: true,
            reportReason: 'Spam'
          }
        ]);
      } else if (activeTab === 'testimonies') {
        // Mock testimonies
        setContent([
          {
            _id: '3',
            type: 'testimony',
            author: { firstName: 'Mary', lastName: 'Grace', profilePicture: null },
            content: 'God has been so faithful! After months of unemployment, I finally got a job offer today!',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            status: 'pending',
            reported: false
          }
        ]);
      }

      // Update stats
      setStats({
        totalPosts: 156,
        pendingReview: 8,
        reportedContent: 3,
        flaggedMessages: 2
      });

    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (contentId) => {
    try {
      // API call to approve content
      alert('Content approved!');
      setContent(content.filter(item => item._id !== contentId));
    } catch (error) {
      console.error('Error approving content:', error);
    }
  };

  const handleReject = async (contentId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      // API call to reject content
      alert('Content rejected!');
      setContent(content.filter(item => item._id !== contentId));
    } catch (error) {
      console.error('Error rejecting content:', error);
    }
  };

  const handleDelete = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      // API call to delete content
      alert('Content deleted!');
      setContent(content.filter(item => item._id !== contentId));
    } catch (error) {
      console.error('Error deleting content:', error);
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
            <p>All content has been moderated</p>
          </div>
        ) : (
          <div className={styles.contentList}>
            {content.map((item) => (
              <div 
                key={item._id} 
                className={`${styles.contentCard} ${item.reported ? styles.reported : ''}`}
              >
                {/* Content Header */}
                <div className={styles.contentHeader}>
                  <div className={styles.authorInfo}>
                    <div className={styles.authorAvatar}>
                      {item.author.profilePicture ? (
                        <img src={item.author.profilePicture} alt="" />
                      ) : (
                        <span className="material-icons">person</span>
                      )}
                    </div>
                    <div>
                      <h4>{item.author.firstName} {item.author.lastName}</h4>
                      <span className={styles.contentTime}>{formatTime(item.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className={styles.contentStatus}>
                    {item.reported && (
                      <span className={styles.reportBadge}>
                        <span className="material-icons">flag</span>
                        Reported: {item.reportReason}
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className={styles.pendingBadge}>
                        <span className="material-icons">pending</span>
                        Pending Review
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Body */}
                <div className={styles.contentBody}>
                  <p>{item.content}</p>
                  {item.mediaUrl && (
                    <div className={styles.contentMedia}>
                      <img src={item.mediaUrl} alt="Content media" />
                    </div>
                  )}
                </div>

                {/* Content Stats */}
                {item.type === 'post' && (
                  <div className={styles.contentStats}>
                    <span>
                      <span className="material-icons">favorite</span>
                      {item.likes} likes
                    </span>
                    <span>
                      <span className="material-icons">comment</span>
                      {item.comments} comments
                    </span>
                  </div>
                )}

                {/* Content Actions */}
                <div className={styles.contentActions}>
                  <button
                    className={`${styles.actionButton} ${styles.approve}`}
                    onClick={() => handleApprove(item._id)}
                  >
                    <span className="material-icons">check</span>
                    Approve
                  </button>
                  
                  <button
                    className={`${styles.actionButton} ${styles.reject}`}
                    onClick={() => handleReject(item._id)}
                  >
                    <span className="material-icons">close</span>
                    Reject
                  </button>
                  
                  <button
                    className={`${styles.actionButton} ${styles.view}`}
                    onClick={() => navigate(`/post/${item._id}`)}
                  >
                    <span className="material-icons">visibility</span>
                    View
                  </button>
                  
                  <button
                    className={`${styles.actionButton} ${styles.danger}`}
                    onClick={() => handleDelete(item._id)}
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