// src/pages/admin/AdminPrayers.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from '../../config/api';
import styles from '../../styles/admin/Admin.module.css';

const AdminPrayers = () => {
  const navigate = useNavigate();
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [stats, setStats] = useState({
    totalPrayers: 0,
    activePrayers: 0,
    answeredPrayers: 0,
    privatePrayers: 0,
    todaysPrayers: 0,
    prayersOffered: 0
  });

  useEffect(() => {
    fetchPrayers();
  }, [activeTab, filterCategory, sortBy]);

  const fetchPrayers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        category: filterCategory,
        status: activeTab === 'all' ? '' : activeTab,
        sort: sortBy,
        search: searchTerm
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/prayers?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPrayers(data.data.prayers);
        setStats(data.data.stats);
      }

    } catch (error) {
      console.error('Error fetching prayers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAnswered = async (prayerId, userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/prayers/${userId}/${prayerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'markAnswered' }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Prayer marked as answered!');
        fetchPrayers();
      } else {
        alert(data.message || 'Failed to update prayer');
      }
    } catch (error) {
      console.error('Error marking prayer as answered:', error);
      alert('Failed to update prayer request');
    }
  };

  const handleDeletePrayer = async (prayerId, userId) => {
    if (!window.confirm('Are you sure you want to delete this prayer request?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/prayers/${userId}/${prayerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete' }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Prayer request deleted!');
        setPrayers(prayers.filter(p => p._id !== prayerId));
      } else {
        alert(data.message || 'Failed to delete prayer');
      }
    } catch (error) {
      console.error('Error deleting prayer:', error);
      alert('Failed to delete prayer request');
    }
  };

  const handleTogglePrivacy = async (prayerId, userId, currentPrivacy) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/prayers/${userId}/${prayerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'togglePrivacy' }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Prayer ${currentPrivacy ? 'made public' : 'made private'}!`);
        fetchPrayers();
      } else {
        alert(data.message || 'Failed to update privacy');
      }
    } catch (error) {
      console.error('Error toggling privacy:', error);
      alert('Failed to update prayer privacy');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Health': '#10b981',
      'Family': '#3b82f6',
      'Financial': '#f59e0b',
      'Spiritual Growth': '#8b5cf6',
      'Career': '#ef4444',
      'Relationships': '#ec4899',
      'Guidance': '#06b6d4',
      'Other': '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  return (
    <div className={styles.adminPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Prayer Request Management</h1>
          <p>Monitor and moderate prayer requests from the community</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.exportButton}
            onClick={() => alert('Export functionality coming soon!')}
          >
            <span className="material-icons">download</span>
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#3b82f6' }}>
            <span className="material-icons">volunteer_activism</span>
          </div>
          <div className={styles.statContent}>
            <h3>Total Prayers</h3>
            <p className={styles.statValue}>{stats.totalPrayers}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#10b981' }}>
            <span className="material-icons">pending</span>
          </div>
          <div className={styles.statContent}>
            <h3>Active Prayers</h3>
            <p className={styles.statValue}>{stats.activePrayers}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#f59e0b' }}>
            <span className="material-icons">check_circle</span>
          </div>
          <div className={styles.statContent}>
            <h3>Answered</h3>
            <p className={styles.statValue}>{stats.answeredPrayers}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#8b5cf6' }}>
            <span className="material-icons">favorite</span>
          </div>
          <div className={styles.statContent}>
            <h3>Prayers Offered</h3>
            <p className={styles.statValue}>{stats.prayersOffered}</p>
          </div>
        </div>
      </div>

      {/* Filters and Tabs */}
      <div className={styles.filtersSection}>
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Prayers ({stats.totalPrayers})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'active' ? styles.active : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active ({stats.activePrayers})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'answered' ? styles.active : ''}`}
              onClick={() => setActiveTab('answered')}
            >
              Answered ({stats.answeredPrayers})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'private' ? styles.active : ''}`}
              onClick={() => setActiveTab('private')}
            >
              Private ({stats.privatePrayers})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'reported' ? styles.active : ''}`}
              onClick={() => setActiveTab('reported')}
            >
              Reported (0)
            </button>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.searchBar}>
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Search prayers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Categories</option>
            <option value="Health">Health</option>
            <option value="Family">Family</option>
            <option value="Financial">Financial</option>
            <option value="Spiritual Growth">Spiritual Growth</option>
            <option value="Career">Career</option>
            <option value="Relationships">Relationships</option>
            <option value="Guidance">Guidance</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="mostPrayed">Most Prayed</option>
          </select>
        </div>
      </div>

      {/* Prayers List */}
      <div className={styles.contentSection}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading prayers...</p>
          </div>
        ) : prayers.length === 0 ? (
          <div className={styles.emptyState}>
            <span className="material-icons">volunteer_activism</span>
            <h3>No prayers found</h3>
            <p>Prayer requests will appear here once members start sharing them</p>
          </div>
        ) : (
          <div className={styles.prayersList}>
            {prayers.map((prayer) => (
              <div key={prayer._id} className={styles.prayerCard}>
                <div className={styles.prayerHeader}>
                  <div className={styles.prayerUser}>
                    <div className={styles.userAvatar}>
                      {prayer.user.profilePicture ? (
                        <img src={prayer.user.profilePicture} alt="" />
                      ) : (
                        <span className="material-icons">person</span>
                      )}
                    </div>
                    <div className={styles.userInfo}>
                      <h4>{prayer.user.firstName} {prayer.user.lastName}</h4>
                      <p>{prayer.user.email}</p>
                    </div>
                  </div>
                  <div className={styles.prayerMeta}>
                    <span 
                      className={styles.categoryBadge} 
                      style={{ backgroundColor: getCategoryColor(prayer.category) }}
                    >
                      {prayer.category}
                    </span>
                    {prayer.isPrivate && (
                      <span className={styles.privateBadge}>
                        <span className="material-icons">lock</span>
                        Private
                      </span>
                    )}
                    {prayer.isAnswered && (
                      <span className={styles.answeredBadge}>
                        <span className="material-icons">check_circle</span>
                        Answered
                      </span>
                    )}
                  </div>
                </div>
                
                <div className={styles.prayerContent}>
                  <p>{prayer.request}</p>
                  <div className={styles.prayerStats}>
                    <span>{formatDate(prayer.createdAt)}</span>
                    <span>
                      <span className="material-icons">favorite</span>
                      {prayer.prayerCount} prayers
                    </span>
                  </div>
                </div>
                
                <div className={styles.prayerActions}>
                  <button
                    onClick={() => navigate(`/member/${prayer.user._id}`)}
                    className={styles.actionButton}
                  >
                    <span className="material-icons">person</span>
                    View Profile
                  </button>
                  
                  {!prayer.isAnswered && (
                    <button
                      onClick={() => handleMarkAnswered(prayer._id, prayer.userId)}
                      className={styles.actionButton}
                    >
                      <span className="material-icons">check_circle</span>
                      Mark Answered
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleTogglePrivacy(prayer._id, prayer.userId, prayer.isPrivate)}
                    className={styles.actionButton}
                  >
                    <span className="material-icons">{prayer.isPrivate ? 'lock_open' : 'lock'}</span>
                    {prayer.isPrivate ? 'Make Public' : 'Make Private'}
                  </button>
                  
                  <button
                    onClick={() => handleDeletePrayer(prayer._id, prayer.userId)}
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

export default AdminPrayers;