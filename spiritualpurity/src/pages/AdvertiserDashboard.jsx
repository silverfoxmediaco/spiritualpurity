// src/pages/AdvertiserDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/AdvertiserDashboard.module.css';

const AdvertiserDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [advertiser, setAdvertiser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkAdvertiserAccess();
  }, []);

  const checkAdvertiserAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await fetch('http://localhost:5001/api/advertisers/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setAdvertiser(data.data.advertiser);
        setDashboardData(data.data);
      } else {
        // User doesn't have advertiser account, redirect to registration
        navigate('/advertiser/register');
      }
    } catch (error) {
      console.error('Error checking advertiser access:', error);
      setError('Failed to load advertiser dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Sidebar Component
  const AdvertiserSidebar = () => {
    const menuItems = [
      { id: 'overview', label: 'Dashboard Overview', icon: 'dashboard' },
      { id: 'ads', label: 'Ad Management', icon: 'campaign' },
      { id: 'analytics', label: 'Analytics & Reports', icon: 'analytics' },
      { id: 'billing', label: 'Billing & Payments', icon: 'payment' },
      { id: 'profile', label: 'Profile Settings', icon: 'settings' }
    ];

    const getStatusColor = (status) => {
      switch (status) {
        case 'approved': return '#10b981';
        case 'pending': return '#f59e0b';
        case 'suspended': return '#ef4444';
        default: return '#6b7280';
      }
    };

    return (
      <div className={styles.sidebar}>
        {/* Account Status */}
        <div className={styles.accountStatus}>
          <div className={styles.businessInfo}>
            <h3>{advertiser?.businessName}</h3>
            <div className={styles.statusBadge} style={{ color: getStatusColor(advertiser?.accountStatus) }}>
              <span className="material-icons">
                {advertiser?.accountStatus === 'approved' ? 'verified' : 'pending'}
              </span>
              {advertiser?.accountStatus}
            </div>
          </div>
          
          <div className={styles.planInfo}>
            <span className={styles.currentPlan}>
              {advertiser?.currentPlan?.toUpperCase()} Plan
            </span>
            {advertiser?.subscriptionStatus === 'trial' && (
              <span className={styles.trialBadge}>
                Trial Active
              </span>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className={styles.navigation}>
          <ul className={styles.menuList}>
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`${styles.menuItem} ${activeTab === item.id ? styles.active : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span className="material-icons">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Quick Stats */}
        <div className={styles.quickStats}>
          <h4>Quick Stats</h4>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Active Ads</span>
            <span className={styles.statValue}>{dashboardData?.summary?.activeAds || 0}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>This Month Clicks</span>
            <span className={styles.statValue}>{dashboardData?.summary?.totalClicks || 0}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Spent</span>
            <span className={styles.statValue}>${dashboardData?.summary?.totalSpent?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        {/* Support */}
        <div className={styles.supportSection}>
          <h4>Need Help?</h4>
          <p>Contact our advertiser support team</p>
          <button className={styles.supportButton}>
            <span className="material-icons">support_agent</span>
            Get Support
          </button>
        </div>
      </div>
    );
  };

  // Dashboard Overview Component
  const DashboardOverview = () => {
    const { summary, advertisements } = dashboardData || {};

    return (
      <div className={styles.overview}>
        {/* Key Metrics */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <span className="material-icons">campaign</span>
            </div>
            <div className={styles.metricContent}>
              <h3>{summary?.totalAds || 0}</h3>
              <p>Total Advertisements</p>
              <span className={styles.metricSubtext}>
                {summary?.activeAds || 0} active
              </span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <span className="material-icons">visibility</span>
            </div>
            <div className={styles.metricContent}>
              <h3>{summary?.totalImpressions?.toLocaleString() || 0}</h3>
              <p>Total Impressions</p>
              <span className={styles.metricSubtext}>
                This month: {summary?.totalImpressions || 0}
              </span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <span className="material-icons">mouse</span>
            </div>
            <div className={styles.metricContent}>
              <h3>{summary?.totalClicks?.toLocaleString() || 0}</h3>
              <p>Total Clicks</p>
              <span className={styles.metricSubtext}>
                CTR: {summary?.averageCTR || 0}%
              </span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <span className="material-icons">attach_money</span>
            </div>
            <div className={styles.metricContent}>
              <h3>${summary?.totalSpent?.toFixed(2) || '0.00'}</h3>
              <p>Total Spent</p>
              <span className={styles.metricSubtext}>
                This month: $0.00
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.activitySection}>
          <div className="row">
            <div className="col-lg-8">
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>Recent Advertisements</h3>
                  <button 
                    className={styles.viewAllButton}
                    onClick={() => setActiveTab('ads')}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.cardContent}>
                  {advertisements && advertisements.length > 0 ? (
                    <div className={styles.adsList}>
                      {advertisements.slice(0, 5).map((ad) => (
                        <div key={ad._id} className={styles.adItem}>
                          <div className={styles.adImage}>
                            <img src={`http://localhost:5001${ad.imageUrl}`} alt={ad.title} />
                          </div>
                          <div className={styles.adDetails}>
                            <h4>{ad.title}</h4>
                            <p>{ad.description.substring(0, 100)}...</p>
                            <div className={styles.adMeta}>
                              <span className={`${styles.statusBadge} ${styles[ad.status?.replace('_', '')]}`}>
                                {ad.status?.replace('_', ' ')}
                              </span>
                              <span className={styles.tierBadge}>
                                {ad.tier?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className={styles.adStats}>
                            <div className={styles.statRow}>
                              <span>Impressions:</span>
                              <span>{ad.metrics?.impressions || 0}</span>
                            </div>
                            <div className={styles.statRow}>
                              <span>Clicks:</span>
                              <span>{ad.metrics?.clicks || 0}</span>
                            </div>
                            <div className={styles.statRow}>
                              <span>CTR:</span>
                              <span>{ad.metrics?.ctr?.toFixed(2) || 0}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <span className="material-icons">campaign</span>
                      <h4>No advertisements yet</h4>
                      <p>Create your first advertisement to start reaching Christian community members</p>
                      <button 
                        className={styles.createAdButton}
                        onClick={() => setActiveTab('ads')}
                      >
                        <span className="material-icons">add</span>
                        Create Advertisement
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>Account Status</h3>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.statusInfo}>
                    <div className={styles.statusItem}>
                      <span className={styles.statusLabel}>Account Status:</span>
                      <span className={`${styles.statusValue} ${styles[advertiser?.accountStatus]}`}>
                        {advertiser?.accountStatus}
                      </span>
                    </div>
                    <div className={styles.statusItem}>
                      <span className={styles.statusLabel}>Current Plan:</span>
                      <span className={styles.statusValue}>
                        {advertiser?.currentPlan?.toUpperCase()}
                      </span>
                    </div>
                    <div className={styles.statusItem}>
                      <span className={styles.statusLabel}>Subscription:</span>
                      <span className={styles.statusValue}>
                        {advertiser?.subscriptionStatus}
                      </span>
                    </div>
                    {advertiser?.trialEndDate && (
                      <div className={styles.statusItem}>
                        <span className={styles.statusLabel}>Trial Ends:</span>
                        <span className={styles.statusValue}>
                          {new Date(advertiser.trialEndDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {advertiser?.subscriptionStatus === 'trial' && (
                    <div className={styles.upgradePrompt}>
                      <h4>Upgrade Your Plan</h4>
                      <p>Get more features and better ad placement</p>
                      <button className={styles.upgradeButton}>
                        <span className="material-icons">upgrade</span>
                        Upgrade Now
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>Quick Actions</h3>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.quickActions}>
                    <button 
                      className={styles.actionButton}
                      onClick={() => setActiveTab('ads')}
                    >
                      <span className="material-icons">add_circle</span>
                      Create New Ad
                    </button>
                    <button 
                      className={styles.actionButton}
                      onClick={() => setActiveTab('analytics')}
                    >
                      <span className="material-icons">analytics</span>
                      View Analytics
                    </button>
                    <button 
                      className={styles.actionButton}
                      onClick={() => setActiveTab('billing')}
                    >
                      <span className="material-icons">payment</span>
                      Billing & Payments
                    </button>
                    <button className={styles.actionButton}>
                      <span className="material-icons">help</span>
                      Get Support
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Ad Management Component
  const AdManagement = () => {
    const [ads, setAds] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loadingAds, setLoadingAds] = useState(true);

    useEffect(() => {
      fetchAds();
    }, []);

    const fetchAds = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/advertisers/advertisements', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (data.success) {
          setAds(data.data.advertisements);
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
      } finally {
        setLoadingAds(false);
      }
    };

    return (
      <div className={styles.adManagement}>
        <div className={styles.adManagementHeader}>
          <h2>Advertisement Management</h2>
          <button 
            className={styles.createAdButton}
            onClick={() => setShowCreateForm(true)}
          >
            <span className="material-icons">add</span>
            Create New Ad
          </button>
        </div>

        {loadingAds ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading advertisements...</p>
          </div>
        ) : (
          <div className={styles.adsGrid}>
            {ads.map((ad) => (
              <div key={ad._id} className={styles.adCard}>
                <div className={styles.adCardImage}>
                  <img src={`http://localhost:5001${ad.imageUrl}`} alt={ad.title} />
                  <div className={styles.adCardOverlay}>
                    <button className={styles.editButton}>
                      <span className="material-icons">edit</span>
                    </button>
                    <button className={styles.analyticsButton}>
                      <span className="material-icons">analytics</span>
                    </button>
                  </div>
                </div>
                <div className={styles.adCardContent}>
                  <h4>{ad.title}</h4>
                  <p>{ad.description.substring(0, 80)}...</p>
                  <div className={styles.adCardMeta}>
                    <span className={`${styles.statusBadge} ${styles[ad.status?.replace('_', '')]}`}>
                      {ad.status?.replace('_', ' ')}
                    </span>
                    <span className={styles.tierBadge}>
                      {ad.tier?.toUpperCase()}
                    </span>
                  </div>
                  <div className={styles.adCardStats}>
                    <div className={styles.statGroup}>
                      <span>Impressions: {ad.metrics?.impressions || 0}</span>
                      <span>Clicks: {ad.metrics?.clicks || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {ads.length === 0 && !loadingAds && (
          <div className={styles.emptyState}>
            <span className="material-icons">campaign</span>
            <h3>No advertisements created yet</h3>
            <p>Create your first advertisement to start reaching potential customers</p>
            <button 
              className={styles.createAdButton}
              onClick={() => setShowCreateForm(true)}
            >
              <span className="material-icons">add</span>
              Create Your First Ad
            </button>
          </div>
        )}
      </div>
    );
  };

  // Simple placeholder components for other tabs
  const AnalyticsView = () => (
    <div className={styles.placeholder}>
      <h2>Analytics & Reports</h2>
      <p>Detailed analytics dashboard coming soon...</p>
    </div>
  );

  const BillingSection = () => (
    <div className={styles.placeholder}>
      <h2>Billing & Payments</h2>
      <p>Billing management coming soon...</p>
    </div>
  );

  const ProfileSettings = () => (
    <div className={styles.placeholder}>
      <h2>Profile Settings</h2>
      <p>Profile settings coming soon...</p>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />;
      case 'ads':
        return <AdManagement />;
      case 'analytics':
        return <AnalyticsView />;
      case 'billing':
        return <BillingSection />;
      case 'profile':
        return <ProfileSettings />;
      default:
        return <DashboardOverview />;
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboardPage}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading your advertiser dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardPage}>
        <Header />
        <div className={styles.errorContainer}>
          <h2>Dashboard Unavailable</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className={styles.backButton}>
            Return Home
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.dashboardPage}>
      <Header />
      
      <div className={styles.dashboardContainer}>
        <div className="container-fluid">
          <div className="row">
            {/* Sidebar */}
            <div className="col-lg-3 col-md-4">
              <AdvertiserSidebar />
            </div>

            {/* Main Content */}
            <div className="col-lg-9 col-md-8">
              <div className={styles.mainContent}>
                {/* Dashboard Header */}
                <div className={styles.dashboardHeader}>
                  <div className={styles.welcomeSection}>
                    <h1>Welcome back, {advertiser?.businessName}</h1>
                    <p>Manage your Christian business advertising campaigns</p>
                  </div>
                  
                  <div className={styles.quickActions}>
                    <button 
                      className={styles.primaryButton}
                      onClick={() => setActiveTab('ads')}
                    >
                      <span className="material-icons">add</span>
                      Create Ad
                    </button>
                    <button 
                      className={styles.secondaryButton}
                      onClick={() => setActiveTab('analytics')}
                    >
                      <span className="material-icons">analytics</span>
                      View Analytics
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className={styles.tabContent}>
                  {renderActiveTab()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdvertiserDashboard;