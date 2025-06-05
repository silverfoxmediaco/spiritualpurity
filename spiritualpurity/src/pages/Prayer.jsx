// src/pages/Prayer.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/Prayer.module.css';

const Prayer = () => {
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [answeredPrayers, setAnsweredPrayers] = useState([]);
  const [newPrayerRequest, setNewPrayerRequest] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'my-prayers', 'answered'
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
      // For now, we'll use mock data since the prayer endpoints don't exist yet
      // In the future, this will call: /api/prayers/community-requests
      
      const mockPrayerRequests = [
        {
          _id: '1',
          request: 'Please pray for my mother\'s health recovery. She is going through a difficult time.',
          category: 'Health',
          author: {
            firstName: 'Sarah',
            lastName: 'Johnson',
            profilePicture: null
          },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          prayerCount: 12,
          isAnswered: false,
          isPrivate: false
        },
        {
          _id: '2',
          request: 'Seeking God\'s guidance for a major life decision about moving to a new city.',
          category: 'Guidance',
          author: {
            firstName: 'Michael',
            lastName: 'Chen',
            profilePicture: null
          },
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          prayerCount: 8,
          isAnswered: false,
          isPrivate: false
        }
      ];

      const mockAnsweredPrayers = [
        {
          _id: '3',
          request: 'Prayed for my job interview last month.',
          category: 'Career',
          author: {
            firstName: 'David',
            lastName: 'Wilson',
            profilePicture: null
          },
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          prayerCount: 15,
          isAnswered: true,
          answeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          testimony: 'God answered my prayers! I got the job and start next week. Thank you everyone for praying!',
          isPrivate: false
        }
      ];

      setPrayerRequests(mockPrayerRequests);
      setAnsweredPrayers(mockAnsweredPrayers);
      
    } catch (error) {
      console.error('Error fetching prayer requests:', error);
      // Handle error appropriately - could show a user-friendly message
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
      // In the future, this will call: POST /api/prayers/submit
      // For now, we'll add it to the local state
      
      const newPrayer = {
        _id: Date.now().toString(),
        request: newPrayerRequest.trim(),
        category: selectedCategory || 'Other',
        author: {
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture
        },
        createdAt: new Date(),
        prayerCount: 0,
        isAnswered: false,
        isPrivate: isPrivate
      };

      if (!isPrivate) {
        setPrayerRequests(prev => [newPrayer, ...prev]);
      }

      // Reset form
      setNewPrayerRequest('');
      setSelectedCategory('');
      setIsPrivate(false);
      
      alert('Prayer request submitted successfully!');
      
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
      // In the future, this will call: POST /api/prayers/pray/:id
      // For now, we'll update the local state
      
      setPrayerRequests(prev => 
        prev.map(prayer => 
          prayer._id === prayerId 
            ? { ...prayer, prayerCount: prayer.prayerCount + 1 }
            : prayer
        )
      );
      
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
                <h3>{prayerRequests.reduce((sum, prayer) => sum + prayer.prayerCount, 0)}</h3>
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
                        
                        {/* Prayer Header */}
                        <div className={styles.prayerHeader}>
                          <div className={styles.authorInfo}>
                            <div className={styles.authorAvatar}>
                              {prayer.author.profilePicture ? (
                                <img 
                                  src={`http://localhost:5001${prayer.author.profilePicture}`}
                                  alt={`${prayer.author.firstName} ${prayer.author.lastName}`}
                                />
                              ) : (
                                <span className="material-icons">person</span>
                              )}
                            </div>
                            <div className={styles.authorDetails}>
                              <h5>{prayer.author.firstName} {prayer.author.lastName}</h5>
                              <span className={styles.prayerTime}>{formatTimeAgo(prayer.createdAt)}</span>
                            </div>
                          </div>
                          
                          <div className={styles.prayerCategory}>
                            <span className={styles.categoryTag}>{prayer.category}</span>
                            {prayer.isAnswered && (
                              <span className={styles.answeredTag}>
                                <span className="material-icons">check_circle</span>
                                Answered
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Prayer Content */}
                        <div className={styles.prayerContent}>
                          <p>{prayer.request}</p>
                          
                          {prayer.isAnswered && prayer.testimony && (
                            <div className={styles.testimony}>
                              <h6>Praise Report:</h6>
                              <p>{prayer.testimony}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Prayer Actions */}
                        <div className={styles.prayerActions}>
                          <div className={styles.prayerCount}>
                            <span className="material-icons">favorite</span>
                            <span>{prayer.prayerCount} people prayed</span>
                          </div>
                          
                          {user && !prayer.isAnswered && (
                            <button 
                              className={styles.prayButton}
                              onClick={() => handlePrayForRequest(prayer._id)}
                            >
                              <span className="material-icons">volunteer_activism</span>
                              Pray for this
                            </button>
                          )}
                        </div>
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