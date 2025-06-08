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
      // TODO: Replace with actual API calls when endpoints are ready
      // const token = localStorage.getItem('token');
      // const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/content/${activeTab}`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      // const data = await response.json();
      // if (data.success) {
      //   setContent(data.data.content);
      //   setStats(data.data.stats);
      // }

      // For now, set empty array
      setContent([]);
      
      // Update stats to zeros
      setStats({
        totalPosts: 0,
        pendingReview: 0,
        reportedContent: 0,
        flaggedMessages: 0
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
            <p>Content requiring moderation will appear here</p>
          </div>
        ) : (
          <div className={styles.contentList}>
            {content.map((item) => (
              <div 
                key={item._id} 
                className={`${styles.contentCard} ${item.reported ? styles.reported : ''}`}
              >
                {/* Content card structure remains the same */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContent;