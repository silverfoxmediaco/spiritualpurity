// src/pages/Prayer.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import API_CONFIG from '../config/api';
import styles from '../styles/Prayer.module.css';


const Prayer = () => {
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [answeredPrayers, setAnsweredPrayers] = useState([]);
  const [newPrayerRequest, setNewPrayerRequest] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [user, setUser] = useState(null);

  const prayerCategories = [
    'Health', 'Family', 'Financial', 'Spiritual Growth', 
    'Career', 'Relationships', 'Guidance', 'Other'
  ];

  useEffect(() => {
    checkUserAuthentication();
    fetchPrayerRequests();
  }, []);

  const checkUserAuthentication = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  };

  const fetchPrayerRequests = async () => {
    try {
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/prayers/community-requests`);
      const data = await response.json();
      if (data.success) {
      setPrayerRequests(data.data.activePrayers);
      setAnsweredPrayers(data.data.answeredPrayers);
      }
      
    } catch (error) {
      console.error('Error fetching prayer requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPrayer = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please log in to share a prayer request');
      return;
    }

    if (!newPrayerRequest.trim()) {
      alert('Please enter your prayer request');
      return;
    }

    setSubmitting(true);
    try {

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/prayers/submit`, {
      method: 'POST',
      headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      request: newPrayerRequest,
      category: selectedCategory || 'Other',
      isPrivate
      }),
      });
      
      alert('Prayer request functionality will be available soon!');
      
      // Reset form
      setNewPrayerRequest('');
      setSelectedCategory('');
      setIsPrivate(false);
      
    } catch (error) {
      console.error('Error submitting prayer request:', error);
      alert('Failed to submit prayer request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrayForRequest = async (prayerId) => {
    if (!user) {
      alert('Please log in to pray for others');
      return;
    }

    try {
      // TODO: Replace with actual API call
      alert('Prayer functionality will be available soon!');
    } catch (error) {
      console.error('Error recording prayer:', error);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getFilteredPrayers = () => {
    switch (activeTab) {
      case 'my-prayers':
        return user ? prayerRequests.filter(prayer => 
          prayer.author.firstName === user.firstName && 
          prayer.author.lastName === user.lastName
        ) : [];
      case 'answered':
        return answeredPrayers;
      default:
        return prayerRequests;
    }
  };

  if (loading) {
    return (
      <div className={styles.prayerPage}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <h2>Loading Prayer Wall...</h2>
          <p>Gathering the prayers of our community</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.prayerPage}>
      <Header />
      
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h1 className={styles.heroTitle}>Prayer Wall</h1>
              <p className={styles.heroSubtitle}>
                "Again, truly I tell you that if two of you on earth agree about anything they ask for, it will be done for them by my Father in heaven."
              </p>
              <span className={styles.verseReference}>- Matthew 18:19</span>
            </div>
          </div>
        </div>
      </section>

      {/* Prayer Stats */}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <span className="material-icons">volunteer_activism</span>
              </div>
              <div className={styles.statInfo}>
                <h3>{prayerRequests.length + answeredPrayers.length}</h3>
                <p>Total Prayers</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <span className="material-icons">favorite</span>
              </div>
              <div className={styles.statInfo}>
                <h3>{prayerRequests.reduce((sum, prayer) => sum + (prayer.prayerCount || 0), 0)}</h3>
                <p>Prayers Offered</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <span className="material-icons">celebration</span>
              </div>
              <div className={styles.statInfo}>
                <h3>{answeredPrayers.length}</h3>
                <p>Answered Prayers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.mainContent}>
        <div className="container">
          <div className="row">
            
            {/* Prayer Request Form */}
            <div className="col-lg-4 mb-4">
              <div className={styles.prayerForm}>
                <h3>Share Your Prayer Request</h3>
                
                {user ? (
                  <form onSubmit={handleSubmitPrayer}>
                    <div className={styles.formGroup}>
                      <label>Prayer Request</label>
                      <textarea
                        value={newPrayerRequest}
                        onChange={(e) => setNewPrayerRequest(e.target.value)}
                        placeholder="Share what's on your heart..."
                        rows="4"
                        required
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="">Select a category</option>
                        {prayerCategories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className={styles.privacyOption}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={isPrivate}
                          onChange={(e) => setIsPrivate(e.target.checked)}
                        />
                        <span className={styles.checkmark}></span>
                        Keep this prayer private (only visible to you)
                      </label>
                    </div>
                    
                    <button 
                      type="submit" 
                      className={styles.submitButton}
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Share Prayer Request'}
                    </button>
                  </form>
                ) : (
                  <div className={styles.loginPrompt}>
                    <span className="material-icons">login</span>
                    <h4>Join Our Prayer Community</h4>
                    <p>Log in to share prayer requests and pray for others</p>
                    <Link to="/profile" className={styles.loginButton}>
                      Sign In
                    </Link>
                  </div>
                )}
              </div>
            </div>
            
            {/* Prayer Wall */}
            <div className="col-lg-8">
              <div className={styles.prayerWall}>
                
                {/* Tab Navigation */}
                <div className={styles.tabNavigation}>
                  <button 
                    className={`${styles.tabButton} ${activeTab === 'all' ? styles.active : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All Prayers ({prayerRequests.length})
                  </button>
                  {user && (
                    <button 
                      className={`${styles.tabButton} ${activeTab === 'my-prayers' ? styles.active : ''}`}
                      onClick={() => setActiveTab('my-prayers')}
                    >
                      My Prayers
                    </button>
                  )}
                  <button 
                    className={`${styles.tabButton} ${activeTab === 'answered' ? styles.active : ''}`}
                    onClick={() => setActiveTab('answered')}
                  >
                    Answered ({answeredPrayers.length})
                  </button>
                </div>
                
                {/* Prayer List */}
                <div className={styles.prayerList}>
                  {getFilteredPrayers().length === 0 ? (
                    <div className={styles.emptyState}>
                      <span className="material-icons">volunteer_activism</span>
                      <h4>No prayers in this category yet</h4>
                      <p>Be the first to share a prayer request with our community</p>
                    </div>
                  ) : (
                    getFilteredPrayers().map((prayer) => (
                      <div key={prayer._id} className={styles.prayerCard}>
                        {/* Prayer card content remains the same */}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Prayer;