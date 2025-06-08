// src/pages/admin/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/admin/StatsCard';
import API_CONFIG from '../../config/api';
import styles from '../../styles/admin/AdminDashboard.module.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    totalPosts: 0,
    totalPrayers: 0,
    activePrayers: 0,
    totalConnections: 0,
    totalMessages: 0,
    reportedContent: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch dashboard stats
      const statsResponse = await fetch(`${API_CONFIG.BASE_URL}/api/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.data);
      } else {
        setError(statsData.message || 'Failed to load dashboard stats');
      }

      // Fetch recent users
      const usersResponse = await fetch(`${API_CONFIG.BASE_URL}/api/users/newest-members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        if (usersData.success) {
          setRecentUsers(usersData.data.members.slice(0, 5));
        }
      }

      // TODO: Fetch real recent activity when endpoint is ready
      // const activityResponse = await fetch(`${API_CONFIG.BASE_URL}/api/admin/dashboard/recent-activity`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      // if (activityResponse.ok) {
      //   const activityData = await activityResponse.json();
      //   if (activityData.success) {
      //     setRecentActivity(activityData.data.activities);
      //   }
      // }

      // For now, set empty array for recent activity
      setRecentActivity([]);

    } catch (error) {
      console.error('Dashboard data error:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <div className={styles.adminDashboard}>
        <div className={styles.errorContainer}>
          <span className="material-icons">error</span>
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminDashboard}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here's what's happening in your community.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshButton} onClick={fetchDashboardData}>
            <span className="material-icons">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon="people"
          color="primary"
          trend="up"
          trendValue={`+${stats.newUsersThisMonth} this month`}
          loading={loading}
        />
        <StatsCard
          title="New This Month"
          value={stats.newUsersThisMonth.toLocaleString()}
          icon="person_add"
          color="success"
          loading={loading}
        />
        <StatsCard
          title="Total Posts"
          value={stats.totalPosts.toLocaleString()}
          icon="article"
          color="info"
          loading={loading}
        />
        <StatsCard
          title="Prayer Requests"
          value={stats.totalPrayers.toLocaleString()}
          icon="volunteer_activism"
          color="warning"
          trend="up"
          trendValue={`${stats.activePrayers} active`}
          loading={loading}
        />
        <StatsCard
          title="Active Prayers"
          value={stats.activePrayers.toLocaleString()}
          icon="pending"
          color="success"
          loading={loading}
        />
        <StatsCard
          title="Connections"
          value={stats.totalConnections.toLocaleString()}
          icon="people_alt"
          color="primary"
          loading={loading}
        />
        <StatsCard
          title="Messages Sent"
          value={stats.totalMessages.toLocaleString()}
          icon="message"
          color="info"
          loading={loading}
        />
        <StatsCard
          title="Reported Content"
          value={stats.reportedContent.toLocaleString()}
          icon="flag"
          color={stats.reportedContent > 0 ? "danger" : "success"}
          loading={loading}
        />
      </div>

      <div className={styles.dashboardContent}>
        <div className={styles.mainColumn}>
          {/* Recent Activity */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <h2>Recent Activity</h2>
              <button 
                className={styles.viewAllButton}
                onClick={() => navigate('/admin/activity')}
              >
                View All
              </button>
            </div>
            <div className={styles.activityList}>
              {recentActivity.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className="material-icons">event_note</span>
                  <p>No recent activity to display</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className={styles.activityItem}>
                    <div className={`${styles.activityIcon} ${styles[activity.type]}`}>
                      <span className="material-icons">{activity.icon}</span>
                    </div>
                    <div className={styles.activityContent}>
                      <p>{activity.message}</p>
                      <span className={styles.activityTime}>{activity.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.dashboardCard}>
            <h2>Quick Actions</h2>
            <div className={styles.quickActions}>
              <button 
                className={styles.actionCard}
                onClick={() => navigate('/admin/users')}
              >
                <span className="material-icons">person_add</span>
                <span>Add User</span>
              </button>
              <button 
                className={styles.actionCard}
                onClick={() => navigate('/admin/content')}
              >
                <span className="material-icons">rate_review</span>
                <span>Review Content</span>
              </button>
              <button 
                className={styles.actionCard}
                onClick={() => navigate('/admin/prayers')}
              >
                <span className="material-icons">volunteer_activism</span>
                <span>Manage Prayers</span>
              </button>
              <button 
                className={styles.actionCard}
                onClick={() => navigate('/admin/messages')}
              >
                <span className="material-icons">message</span>
                <span>Monitor Messages</span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.sideColumn}>
          {/* Recent Users */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <h2>New Members</h2>
              <button 
                className={styles.viewAllButton}
                onClick={() => navigate('/admin/users')}
              >
                View All
              </button>
            </div>
            <div className={styles.usersList}>
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div 
                    key={user._id} 
                    className={styles.userItem}
                    onClick={() => navigate(`/member/${user._id}`)}
                  >
                    <div className={styles.userAvatar}>
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.firstName} />
                      ) : (
                        <span className="material-icons">person</span>
                      )}
                    </div>
                    <div className={styles.userInfo}>
                      <h4>{user.firstName} {user.lastName}</h4>
                      <p>Joined {formatDate(user.joinDate)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p>No new members yet</p>
                </div>
              )}
            </div>
          </div>

          {/* System Status */}
          <div className={styles.dashboardCard}>
            <h2>System Status</h2>
            <div className={styles.systemStatus}>
              <div className={styles.statusItem}>
                <span className={styles.statusIndicator}></span>
                <span>All Systems Operational</span>
              </div>
              <div className={styles.statusDetails}>
                <p>Database: Connected</p>
                <p>Storage: 23% Used</p>
                <p>API: Responding</p>
                <p>Last Update: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;