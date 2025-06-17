// src/pages/PublicMemberProfile.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserPosts from '../components/UserPosts';
import ShareButton from '../components/ShareButton';
import API_CONFIG from '../config/api';
import styles from '../styles/PublicMemberProfile.module.css';

const PublicMemberProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('none');
  const [mutualConnections, setMutualConnections] = useState(0);
  const [actionLoading, setActionLoading] = useState({
    connect: false,
    message: false
  });

  const checkCurrentUser = useCallback(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
        return true;
      } catch (e) {
        console.error('Error parsing user data:', e);
        return false;
      }
    }
    return false;
  }, []);

  const fetchMemberProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to view member profiles');
        setLoading(false);
        navigate('/login');
        return;
      }

      // Log for debugging
      console.log('Fetching profile for ID:', id);
      console.log('Token exists:', !!token);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/public-profile/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Profile response:', data);

      if (data.success) {
        setMember(data.data.user);
        // Only fetch connection status if member data is loaded
        if (data.data.user) {
          await fetchConnectionStatus();
        }
      } else {
        setError(data.message || 'Member not found');
        
        // If token is invalid, redirect to login
        if (data.message === 'Invalid token' || data.message === 'Token expired') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      }
    } catch (error) {
      console.error('Error fetching member profile:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/connections/status/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setConnectionStatus(data.data.status);
        setMutualConnections(data.data.mutualConnections || 0);
      }
    } catch (error) {
      console.error('Error fetching connection status:', error);
    }
  };

  const handleConnect = async () => {
    if (!currentUser) {
      alert('Please log in to connect with members');
      return;
    }

    if (connectionStatus === 'sent') {
      alert('Connection request already sent');
      return;
    }

    if (connectionStatus === 'connected') {
      alert('You are already connected with this member');
      return;
    }

    setActionLoading(prev => ({ ...prev, connect: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/connections/send-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: member._id,
          message: `Hi ${member.firstName}, I'd like to connect with you on our faith journey!`
        }),
      });

      const data = await response.json();
      if (data.success) {
        setConnectionStatus('sent');
        alert(`Connection request sent to ${member.firstName}!`);
      } else {
        alert(data.message || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to send connection request. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, connect: false }));
    }
  };

  const handleSendMessage = async () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!currentUser) {
      alert('Please log in to send messages');
      navigate('/');
      return;
    }

    setActionLoading(prev => ({ ...prev, message: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/messages/conversation/${member._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        // Redirect to profile with a message to check their messages
        navigate('/profile');
        setTimeout(() => {
          alert(`Conversation started with ${member.firstName}! Check your Messages section below to continue chatting.`);
        }, 500);
      } else {
        alert(data.message || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, message: false }));
    }
  };

  const handleSendPrayer = async (prayerRequestId) => {
    if (!currentUser) {
      alert('Please log in to pray for members');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/users/pray/${member._id}/${prayerRequestId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        alert('🙏 Your prayer has been recorded. Thank you for praying!');
        // Refresh the member profile to show updated count
        fetchMemberProfile();
      } else {
        alert(data.message || 'Failed to record prayer');
      }
    } catch (error) {
      console.error('Prayer error:', error);
      alert('Failed to record prayer. Please try again.');
    }
  };

  const formatJoinDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getConnectionButtonText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'sent':
        return 'Request Sent';
      case 'received':
        return 'Accept Request';
      default:
        return 'Connect';
    }
  };

  const getConnectionButtonIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'people';
      case 'sent':
        return 'hourglass_empty';
      case 'received':
        return 'person_add';
      default:
        return 'person_add';
    }
  };

  // Helper function to get the correct image URL
  const getProfileImageUrl = (profilePicture) => {
    if (!profilePicture) return null;
    
    if (profilePicture.startsWith('http')) {
      return profilePicture;
    }
    
    return `${API_CONFIG.BASE_URL}${profilePicture}`;
  };

  // Create share data for profile
  const createProfileShareData = () => {
    if (!member) return null;
    
    return {
      id: member._id,
      title: `${member.firstName} ${member.lastName}`,
      description: member.bio || `${member.firstName} is a member of our spiritual community`,
      imageUrl: getProfileImageUrl(member.profilePicture)
    };
  };

  useEffect(() => {
    const hasUser = checkCurrentUser();
    if (hasUser && id) {
      fetchMemberProfile();
    } else if (!hasUser) {
      navigate('/login');
    }
  }, [id, checkCurrentUser, fetchMemberProfile, navigate]);

  if (loading) {
    return (
      <div className={styles.publicProfilePage}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <h2>Loading Member Profile...</h2>
          <p>Getting to know this believer</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.publicProfilePage}>
        <Header />
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>
            <span className="material-icons">person_off</span>
          </div>
          <h2>Profile Not Available</h2>
          <p>{error}</p>
          <div className={styles.errorActions}>
            <button onClick={() => navigate('/members')} className={styles.backButton}>
              <span className="material-icons">arrow_back</span>
              Back to Members
            </button>
            <button onClick={() => navigate('/community')} className={styles.communityButton}>
              <span className="material-icons">groups</span>
              Community
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Check if this is the current user's own profile
  if (currentUser && member && currentUser._id === member._id) {
    navigate('/profile');
    return null;
  }

  return (
    <div className={styles.publicProfilePage}>
      <Header />
      
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className={styles.profileContainer}>
              
              {/* Profile Header */}
              <div className={styles.profileHeader}>
                <div className={styles.profileImageSection}>
                  <div className={styles.profileImageWrapper}>
                    {member?.profilePicture ? (
                      <img 
                        src={getProfileImageUrl(member.profilePicture)} 
                        alt={`${member.firstName} ${member.lastName}`}
                        className={styles.profileImage}
                      />
                    ) : (
                      <div className={styles.defaultAvatar}>
                        <span className="material-icons">person</span>
                      </div>
                    )}
                    
                    {/* New Member Badge */}
                    {new Date() - new Date(member?.joinDate) < 30 * 24 * 60 * 60 * 1000 && (
                      <div className={styles.newMemberBadge}>
                        <span className="material-icons">fiber_new</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={styles.profileInfo}>
                  <div className={styles.profileNameSection}>
                    <h1 className={styles.memberName}>
                      {member?.firstName} {member?.lastName}
                    </h1>
                    
                    {/* Share Button for Profile */}
                    <ShareButton
                      shareType="profile"
                      shareData={createProfileShareData()}
                      currentUser={currentUser}
                      buttonStyle="icon"
                      size="medium"
                      className={styles.profileShareButton}
                    />
                  </div>
                  
                  <div className={styles.memberMeta}>
                    <div className={styles.joinInfo}>
                      <span className="material-icons">schedule</span>
                      <span>Joined {formatJoinDate(member?.joinDate)}</span>
                    </div>
                    
                    {member?.location && member?.privacy?.showLocation && (
                      <div className={styles.locationInfo}>
                        <span className="material-icons">location_on</span>
                        <span>
                          {[member.location.city, member.location.state].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    
                    {member?.relationshipStatus && member?.privacy?.showRelationshipStatus && (
                      <div className={styles.relationshipInfo}>
                        <span className="material-icons">favorite</span>
                        <span>{member.relationshipStatus}</span>
                      </div>
                    )}

                    {/* Prayer Participation Stats */}
                    {member?.prayerStats?.totalPrayersOffered > 0 && (
                      <div className={styles.prayerParticipation}>
                        <span className="material-icons">volunteer_activism</span>
                        <span>Prayed {member.prayerStats.totalPrayersOffered} times</span>
                      </div>
                    )}

                    {/* Mutual Connections */}
                    {mutualConnections > 0 && (
                      <div className={styles.mutualConnections}>
                        <span className="material-icons">people</span>
                        <span>{mutualConnections} mutual connection{mutualConnections > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Prayer Badges */}
                  {member?.prayerStats?.totalPrayersOffered >= 10 && (
                    <div className={styles.spiritualBadges}>
                      {member.prayerStats.totalPrayersOffered >= 100 && (
                        <span className={styles.badge}>🕊️ Prayer Intercessor</span>
                      )}
                      {member.prayerStats.totalPrayersOffered >= 50 && 
                       member.prayerStats.totalPrayersOffered < 100 && (
                        <span className={styles.badge}>⚔️ Prayer Warrior</span>
                      )}
                      {member.prayerStats.totalPrayersOffered >= 10 && 
                       member.prayerStats.totalPrayersOffered < 50 && (
                        <span className={styles.badge}>🙏 Faithful Prayer</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className={styles.profileActions}>
                  <button 
                    onClick={handleConnect} 
                    className={`${styles.connectButton} ${connectionStatus === 'connected' ? styles.connected : ''}`}
                    disabled={actionLoading.connect || connectionStatus === 'connected'}
                  >
                    <span className="material-icons">{getConnectionButtonIcon()}</span>
                    {actionLoading.connect ? 'Connecting...' : getConnectionButtonText()}
                  </button>
                  
                  <button 
                    onClick={handleSendMessage}
                    className={styles.messageButton}
                    disabled={actionLoading.message}
                  >
                    <span className="material-icons">message</span>
                    {actionLoading.message ? 'Starting...' : 'Message'}
                  </button>
                  
                  <button 
                    onClick={() => navigate('/prayer')} 
                    className={styles.prayButton}
                  >
                    <span className="material-icons">volunteer_activism</span>
                    Pray
                  </button>
                </div>
              </div>

              {/* Profile Content */}
              <div className={styles.profileContent}>
                <div className="row">
                  
                  {/* Main Content */}
                  <div className="col-lg-8">
                    
                    {/* Posts Section */}
                    <UserPosts 
                      userId={member._id} 
                      isOwnProfile={false} 
                      currentUser={currentUser} 
                    />
                    
                    {/* Bio Section */}
                    {member?.bio && (
                      <div className={styles.profileSection}>
                        <h3>
                          <span className="material-icons">info</span>
                          About {member.firstName}
                        </h3>
                        <p className={styles.bioText}>{member.bio}</p>
                      </div>
                    )}

                    {/* Testimony Section */}
                    {member?.testimony && member?.privacy?.showTestimony && (
                      <div className={styles.profileSection}>
                        <h3>
                          <span className="material-icons">auto_stories</span>
                          Testimony
                        </h3>
                        <div className={styles.testimony}>
                          <p>{member.testimony}</p>
                        </div>
                      </div>
                    )}

                    {/* Favorite Verse Section */}
                    {member?.favoriteVerse?.verse && (
                      <div className={styles.profileSection}>
                        <h3>
                          <span className="material-icons">menu_book</span>
                          Favorite Bible Verse
                        </h3>
                        <blockquote className={styles.verseQuote}>
                          <p>"{member.favoriteVerse.verse}"</p>
                          {member.favoriteVerse.reference && (
                            <cite>— {member.favoriteVerse.reference}</cite>
                          )}
                        </blockquote>
                      </div>
                    )}

                    {/* Public Prayer Requests */}
                    {member?.prayerRequests && member?.privacy?.showPrayerRequests && (
                      <div className={styles.profileSection}>
                        <h3>
                          <span className="material-icons">volunteer_activism</span>
                          Prayer Requests
                        </h3>
                        
                        <div className={styles.prayerRequests}>
                          {member.prayerRequests
                            .filter(prayer => !prayer.isPrivate) // Only show public prayers
                            .length > 0 ? (
                            member.prayerRequests
                              .filter(prayer => !prayer.isPrivate)
                              .map((prayer) => (
                                <div key={prayer._id} className={`${styles.prayerCard} ${prayer.isAnswered ? styles.answered : ''}`}>
                                  <div className={styles.prayerContent}>
                                    <h4>{prayer.title}</h4>
                                    <p>{prayer.description}</p>
                                    
                                    <div className={styles.prayerMeta}>
                                      <span className={styles.prayerCount}>
                                        <span className="material-icons">volunteer_activism</span>
                                        {prayer.prayerCount || 0} prayers
                                      </span>
                                      {prayer.isAnswered && (
                                        <span className={styles.answeredTag}>
                                          <span className="material-icons">check_circle</span>
                                          Answered
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {currentUser && !prayer.isAnswered && (
                                    <button 
                                      className={styles.prayForButton}
                                      onClick={() => handleSendPrayer(prayer._id)}
                                    >
                                      <span className="material-icons">volunteer_activism</span>
                                      Pray for this
                                    </button>
                                  )}
                                </div>
                              ))
                          ) : (
                            <div className={styles.noPrayers}>
                              <span className="material-icons">volunteer_activism</span>
                              <p>{member?.firstName || 'This member'} hasn't shared any public prayer requests yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Sidebar */}
                  <div className="col-lg-4">
                    
                    {/* Quick Actions Card */}
                    <div className={styles.sidebarCard}>
                      <h4>Connect with {member?.firstName}</h4>
                      <div className={styles.quickActions}>
                        <button 
                          onClick={handleSendMessage}
                          className={styles.actionButton}
                          disabled={actionLoading.message}
                        >
                          <span className="material-icons">message</span>
                          {actionLoading.message ? 'Starting...' : 'Send Message'}
                        </button>
                        
                        <button 
                          onClick={handleConnect} 
                          className={styles.actionButton}
                          disabled={actionLoading.connect || connectionStatus === 'connected'}
                        >
                          <span className="material-icons">{getConnectionButtonIcon()}</span>
                          {actionLoading.connect ? 'Connecting...' : getConnectionButtonText()}
                        </button>
                        
                        <button 
                          onClick={() => navigate('/prayer')} 
                          className={styles.actionButton}
                        >
                          <span className="material-icons">volunteer_activism</span>
                          Prayer Wall
                        </button>
                        
                        {/* Share Profile Action */}
                        <ShareButton
                          shareType="profile"
                          shareData={createProfileShareData()}
                          currentUser={currentUser}
                          buttonStyle="text"
                          size="medium"
                          className={styles.sidebarShareButton}
                        />
                      </div>
                    </div>

                    {/* Connection Status Card */}
                    {connectionStatus !== 'none' && (
                      <div className={styles.sidebarCard}>
                        <h4>
                          <span className="material-icons">people</span>
                          Connection Status
                        </h4>
                        <div className={styles.connectionStatus}>
                          {connectionStatus === 'connected' && (
                            <div className={styles.statusConnected}>
                              <span className="material-icons">check_circle</span>
                              <span>You are connected with {member?.firstName}</span>
                            </div>
                          )}
                          {connectionStatus === 'sent' && (
                            <div className={styles.statusPending}>
                              <span className="material-icons">hourglass_empty</span>
                              <span>Connection request sent</span>
                            </div>
                          )}
                          {connectionStatus === 'received' && (
                            <div className={styles.statusReceived}>
                              <span className="material-icons">notification_important</span>
                              <span>{member?.firstName} wants to connect with you</span>
                            </div>
                          )}
                          {mutualConnections > 0 && (
                            <div className={styles.mutualInfo}>
                              <span className="material-icons">group</span>
                              <span>{mutualConnections} mutual connection{mutualConnections > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interests Card */}
                    {member?.interests && member?.interests.length > 0 && member?.privacy?.showInterests && (
                      <div className={styles.sidebarCard}>
                        <h4>
                          <span className="material-icons">interests</span>
                          Spiritual Interests
                        </h4>
                        <div className={styles.interestsTags}>
                          {member.interests.map((interest, index) => (
                            <span key={index} className={styles.interestTag}>
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Community Guidelines */}
                    <div className={styles.sidebarCard}>
                      <h4>
                        <span className="material-icons">gavel</span>
                        Community Guidelines
                      </h4>
                      <div className={styles.guidelines}>
                        <p>When connecting with members:</p>
                        <ul>
                          <li>Show love and respect</li>
                          <li>Keep interactions faith-centered</li>
                          <li>Offer prayers and encouragement</li>
                          <li>Report inappropriate behavior</li>
                        </ul>
                      </div>
                    </div>
                  </div>
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

export default PublicMemberProfile;