// src/pages/Community.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FeaturedMembers from '../components/FeaturedMembers';
import API_CONFIG from '../config/api';
import styles from '../styles/Community.module.css';

const Community = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeDiscussions: 0,
    prayerRequests: 0,
    upcomingEvents: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [featuredMembers, setFeaturedMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    try {
      // Fetch community statistics
      const membersResponse = await fetch(`${API_CONFIG.BASE_URL}/api/users/newest-members`);
      
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        if (membersData.success) {
          setFeaturedMembers(membersData.data.members.slice(0, 4));
          setStats(prev => ({
            ...prev,
            totalMembers: membersData.data.count || membersData.data.members.length
          }));
        }
      }

      // Mock data for other stats (you can implement these later)
      setStats(prev => ({
        ...prev,
        activeDiscussions: 23,
        prayerRequests: 15,
        upcomingEvents: 3
      }));

      setRecentActivity([
        { type: 'member', name: 'Sarah Johnson', action: 'joined the community', time: '2 hours ago' },
        { type: 'prayer', name: 'Mike Wilson', action: 'requested prayer for healing', time: '4 hours ago' },
        { type: 'discussion', name: 'David Chen', action: 'started a discussion about faith', time: '6 hours ago' },
        { type: 'testimony', name: 'Mary Grace', action: 'shared a testimony', time: '8 hours ago' }
      ]);

    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={styles.communityPage}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading community...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.communityPage}>
      <Header />
      
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h1 className={styles.heroTitle}>Our Faith Community</h1>
              <p className={styles.heroSubtitle}>
                Connect with fellow believers, share your journey, and grow together in Christ
              </p>
              <div className={styles.heroStats}>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{stats.totalMembers}</span>
                  <span className={styles.statLabel}>Members</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{stats.activeDiscussions}</span>
                  <span className={styles.statLabel}>Discussions</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{stats.prayerRequests}</span>
                  <span className={styles.statLabel}>Prayer Requests</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{stats.upcomingEvents}</span>
                  <span className={styles.statLabel}>Events</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className={styles.quickAccessSection}>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <h2 className={styles.sectionTitle}>Community Features</h2>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 col-lg-3 mb-4">
              <Link to="/members" className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <i className="fas fa-users"></i>
                </div>
                <h3>Member Directory</h3>
                <p>Connect with believers from around the world</p>
                <span className={styles.memberCount}>{stats.totalMembers} members</span>
              </Link>
            </div>
            <div className="col-md-6 col-lg-3 mb-4">
              <Link to="/discussions" className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <i className="fas fa-comments"></i>
                </div>
                <h3>Discussions</h3>
                <p>Join conversations about faith and life</p>
                <span className={styles.activityBadge}>{stats.activeDiscussions} active</span>
              </Link>
            </div>
            <div className="col-md-6 col-lg-3 mb-4">
              <Link to="/groups" className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <i className="fas fa-heart"></i>
                </div>
                <h3>Prayer Groups</h3>
                <p>Join small groups for prayer and support</p>
                <span className={styles.prayerBadge}>15 groups</span>
              </Link>
            </div>
            <div className="col-md-6 col-lg-3 mb-4">
              <Link to="/events" className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <h3>Events</h3>
                <p>Upcoming gatherings and activities</p>
                <span className={styles.eventBadge}>{stats.upcomingEvents} upcoming</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Members Section */}
      <FeaturedMembers />

      {/* Recent Activity Section */}
      <section className={styles.activitySection}>
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <h2 className={styles.sectionTitle}>Recent Community Activity</h2>
              <div className={styles.activityFeed}>
                {recentActivity.map((activity, index) => (
                  <div key={index} className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      <i className={`fas ${
                        activity.type === 'member' ? 'fa-user-plus' :
                        activity.type === 'prayer' ? 'fa-praying-hands' :
                        activity.type === 'discussion' ? 'fa-comment' :
                        'fa-star'
                      }`}></i>
                    </div>
                    <div className={styles.activityContent}>
                      <p>
                        <strong>{activity.name}</strong> {activity.action}
                      </p>
                      <span className={styles.activityTime}>{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/activity" className={styles.viewMoreActivity}>
                View All Activity
              </Link>
            </div>
            <div className="col-lg-4">
              <div className={styles.communityGuidelines}>
                <h3>Community Guidelines</h3>
                <ul>
                  <li>Show love and respect to all members</li>
                  <li>Keep discussions faith-centered and uplifting</li>
                  <li>Pray for one another regularly</li>
                  <li>Share testimonies to encourage others</li>
                  <li>Report any inappropriate content</li>
                </ul>
                <Link to="/guidelines" className={styles.guidelinesLink}>
                  Read Full Guidelines
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h2 className={styles.ctaTitle}>Ready to Get More Involved?</h2>
              <p className={styles.ctaSubtitle}>
                There are many ways to connect and grow with our community
              </p>
              <div className={styles.ctaButtons}>
                <Link to="/discussions" className={styles.primaryBtn}>
                  Start a Discussion
                </Link>
                <Link to="/prayer" className={styles.secondaryBtn}>
                  Share Prayer Request
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Community;