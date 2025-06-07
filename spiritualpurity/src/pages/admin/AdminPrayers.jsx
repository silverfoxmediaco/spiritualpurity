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
    fetchPrayerStats();
  }, [activeTab, filterCategory, sortBy]);

  const fetchPrayers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // For now, using mock data - replace with actual API call
      const mockPrayers = [
        {
          _id: '1',
          userId: {
            _id: 'user1',
            firstName: 'Sarah',
            lastName: 'Johnson',
            profilePicture: null,
            email: 'sarah@example.com'
          },
          request: 'Please pray for my mother who is undergoing surgery tomorrow. We need God\'s healing touch.',
          category: 'Health',
          isPrivate: false,
          isAnswered: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          prayerCount: 15,
          reportCount: 0
        },
        {
          _id: '2',
          userId: {
            _id: 'user2',
            firstName: 'Michael',
            lastName: 'Chen',
            profilePicture: null,
            email: 'michael@example.com'
          },
          request: 'Seeking guidance for a major career decision. Should I accept the job offer in another city?',
          category: 'Guidance',
          isPrivate: false,
          isAnswered: false,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          prayerCount: 8,
          reportCount: 0
        },
        {
          _id: '3',
          userId: {
            _id: 'user3',
            firstName: 'David',
            lastName: 'Wilson',
            profilePicture: null,
            email: 'david@example.com'
          },
          request: 'Thank you Lord! My job interview went well and I got the position!',
          category: 'Career',
          isPrivate: false,
          isAnswered: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          answeredAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          prayerCount: 25,
          reportCount: 0
        },
        {
          _id: '4',
          userId: {
            _id: 'user4',
            firstName: 'Mary',
            lastName: 'Grace',
            profilePicture: null,
            email: 'mary@example.com'
          },
          request: 'Private prayer request',
          category: 'Other',
          isPrivate: true,
          isAnswered: false,
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
          prayerCount: 0,
          reportCount: 0
        }
      ];

      // Filter based on active tab
      let filteredPrayers = mockPrayers;
      
      if (activeTab === 'active') {
        filteredPrayers = mockPrayers.filter(p => !p.isAnswered);
      } else if (activeTab === 'answered') {
        filteredPrayers = mockPrayers.filter(p => p.isAnswered);
      } else if (activeTab === 'private') {
        filteredPrayers = mockPrayers.filter(p => p.isPrivate);
      } else if (activeTab === 'reported') {
        filteredPrayers = mockPrayers.filter(p => p.reportCount > 0);
      }

      // Apply search filter
      if (searchTerm) {
        filteredPrayers = filteredPrayers.filter(prayer => 
          prayer.request.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prayer.userId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prayer.userId.lastName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply category filter
      if (filterCategory) {
        filteredPrayers = filteredPrayers.filter(prayer => 
          prayer.category === filterCategory
        );
      }

      // Apply sorting
      filteredPrayers.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.createdAt) - new Date(a.createdAt);
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt);
          case 'mostPrayed':
            return b.prayerCount - a.prayerCount;
          default:
            return 0;
        }
      });

      setPrayers(filteredPrayers);
    } catch (error) {
      console.error('Error fetching prayers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrayerStats = async () => {
    try {
      // Mock stats - replace with actual API call
      setStats({
        totalPrayers: 156,
        activePrayers: 89,
        answeredPrayers: 67,
        privatePrayers: 23,
        todaysPrayers: 12,
        prayersOffered: 1243
      });
    } catch (error) {
      console.error('Error fetching prayer stats:', error);
    }
  };

  const handleMarkAnswered = async (prayerId) => {
    try {
      const token = localStorage.getItem('token');
      // API call to mark prayer as answered
      alert('Prayer marked as answered!');
      fetchPrayers();
    } catch (error) {
      console.error('Error marking prayer as answered:', error);
    }
  };

  const handleDeletePrayer = async (prayerId) => {
    if (!window.confirm('Are you sure you want to delete this prayer request?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // API call to delete prayer
      alert('Prayer request deleted!');
      setPrayers(prayers.filter(p => p._id !== prayerId));
    } catch (error) {
      console.error('Error deleting prayer:', error);
    }
  };

  const handleTogglePrivacy = async (prayerId, currentPrivacy) => {
    try {
      const token = localStorage.getItem('token');
      // API call to toggle privacy
      alert(`Prayer ${currentPrivacy ? 'made public' : 'made private'}!`);
      fetchPrayers();
    } catch (error) {
      console.error('Error toggling privacy:', error);
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
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className={styles.prayersList}>
            {prayers.map((prayer) => (
              <div key={prayer._id} className={styles.prayerCard}>
                <div className={styles.prayerHeader}>
                  <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                      {prayer.userId.profilePicture ? (
                        <img src={prayer.userId.profilePicture} alt="" />
                      ) : (
                        <span className="material-icons">person</span>
                      )}
                    </div>
                    <div>
                      <h4>{prayer.userId.firstName} {prayer.userId.lastName}</h4>
                      <span className={styles.userEmail}>{prayer.userId.email}</span>
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
                    <span>
                      <span className="material-icons">access_time</span>
                      {formatDate(prayer.createdAt)}
                    </span>
                    <span>
                      <span className="material-icons">favorite</span>
                      {prayer.prayerCount} prayers offered
                    </span>
                    {prayer.isAnswered && prayer.answeredAt && (
                      <span>
                        <span className="material-icons">celebration</span>
                        Answered {formatDate(prayer.answeredAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.prayerActions}>
                  {!prayer.isAnswered && (
                    <button
                      className={styles.actionButton}
                      onClick={() => handleMarkAnswered(prayer._id)}
                      title="Mark as Answered"
                    >
                      <span className="material-icons">check_circle</span>
                      Mark Answered
                    </button>
                  )}
                  
                  <button
                    className={styles.actionButton}
                    onClick={() => handleTogglePrivacy(prayer._id, prayer.isPrivate)}
                    title={prayer.isPrivate ? "Make Public" : "Make Private"}
                  >
                    <span className="material-icons">
                      {prayer.isPrivate ? 'lock_open' : 'lock'}
                    </span>
                    {prayer.isPrivate ? 'Make Public' : 'Make Private'}
                  </button>
                  
                  <button
                    className={styles.actionButton}
                    onClick={() => navigate(`/member/${prayer.userId._id}`)}
                    title="View User Profile"
                  >
                    <span className="material-icons">person</span>
                    View User
                  </button>
                  
                  <button
                    className={`${styles.actionButton} ${styles.danger}`}
                    onClick={() => handleDeletePrayer(prayer._id)}
                    title="Delete Prayer"
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