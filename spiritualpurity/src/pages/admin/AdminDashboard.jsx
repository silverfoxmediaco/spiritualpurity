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

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
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

      // Mock recent activity for now
      setRecentActivity([
        { type: 'user', message: 'New user Sarah Johnson joined', time: '2 hours ago', icon: 'person_add' },
        { type: 'prayer', message: 'John Doe posted a prayer request', time: '3 hours ago', icon: 'volunteer_activism' },
        { type: 'post', message: 'Mary Smith shared a testimony', time: '5 hours ago', icon: 'article' },
        { type: 'report', message: 'Content reported by user', time: '6 hours ago', icon: 'flag' },
        { type: 'connection', message: '2 new connections made', time: '8 hours ago', icon: 'people' }
      ]);

    } catch (error) {
      console.error('Dashboard data error:', error);
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
          value={stats.totalUsers}
          icon="people"
          color="primary"
          trend="up"
          trendValue="+12% this month"
          loading={loading}
        />
        <StatsCard
          title="New This Month"
          value={stats.newUsersThisMonth}
          icon="person_add"
          color="success"
          loading={loading}
        />
        <StatsCard
          title="Total Posts"
          value={stats.totalPosts}
          icon="article"
          color="info"
          loading={loading}
        />
        <StatsCard
          title="Prayer Requests"
          value={stats.totalPrayers}
          icon="volunteer_activism"
          color="warning"
          trend="up"
          trendValue={`${stats.activePrayers} active`}
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
              {recentActivity.map((activity, index) => (
                <div key={index} className={styles.activityItem}>
                  <div className={`${styles.activityIcon} ${styles[activity.type]}`}>
                    <span className="material-icons">{activity.icon}</span>
                  </div>
                  <div className={styles.activityContent}>
                    <p>{activity.message}</p>
                    <span className={styles.activityTime}>{activity.time}</span>
                  </div>
                </div>
              ))}
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
                onClick={() => navigate('/admin/announcements')}
              >
                <span className="material-icons">campaign</span>
                <span>Announcement</span>
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
              {recentUsers.map((user) => (
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
              ))}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;