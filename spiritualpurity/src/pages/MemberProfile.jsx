// src/pages/MemberProfile.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileMessages from '../components/ProfileMessages';
import UserPosts from '../components/UserPosts';
import API_CONFIG from '../config/api';
import styles from '../styles/MemberProfile.module.css';

const MemberProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // Add tab state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: {
      city: '',
      state: '',
      country: 'United States'
    },
    relationshipStatus: '',
    testimony: '',
    favoriteVerse: {
      verse: '',
      reference: ''
    },
    privacy: {
      showEmail: false,
      showLocation: true,
      showPrayerRequests: true,
      showTestimony: true,
      showRelationshipStatus: true
    }
  });
  const [newPrayerRequest, setNewPrayerRequest] = useState('');
  const [isPrivatePrayer, setIsPrivatePrayer] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Load user profile on component mount
  useEffect(() => {
    fetchUserProfile();
    fetchUserConnections();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your profile');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        setFormData({
          firstName: data.data.user.firstName || '',
          lastName: data.data.user.lastName || '',
          bio: data.data.user.bio || '',
          location: {
            city: data.data.user.location?.city || '',
            state: data.data.user.location?.state || '',
            country: data.data.user.location?.country || 'United States'
          },
          relationshipStatus: data.data.user.relationshipStatus || '',
          testimony: data.data.user.testimony || '',
          favoriteVerse: {
            verse: data.data.user.favoriteVerse?.verse || '',
            reference: data.data.user.favoriteVerse?.reference || ''
          },
          privacy: {
            showEmail: data.data.user.privacy?.showEmail || false,
            showLocation: data.data.user.privacy?.showLocation || true,
            showPrayerRequests: data.data.user.privacy?.showPrayerRequests || true,
            showTestimony: data.data.user.privacy?.showTestimony || true,
            showRelationshipStatus: data.data.user.privacy?.showRelationshipStatus || true
          }
        });
      } else {
        setError(data.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user connections
  const fetchUserConnections = async () => {
    try {
      setLoadingConnections(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/connections/my-connections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setConnections(data.data.connections || []);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!profilePictureFile) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', profilePictureFile);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUser(prev => ({
          ...prev,
          profilePicture: data.data.profilePicture
        }));
        setProfilePictureFile(null);
        alert('Profile picture updated successfully!');
      } else {
        setError(data.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddPrayerRequest = async (e) => {
    e.preventDefault();
    
    if (!newPrayerRequest.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/prayer-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request: newPrayerRequest,
          isPrivate: isPrivatePrayer
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchUserProfile();
        setNewPrayerRequest('');
        setIsPrivatePrayer(false);
        alert('Prayer request added successfully!');
      } else {
        setError(data.message || 'Failed to add prayer request');
      }
    } catch (error) {
      console.error('Prayer request error:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleMarkPrayerAnswered = async (prayerRequestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/prayer-request/${prayerRequestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAnswered: true }),
      });

      const data = await response.json();

      if (data.success) {
        fetchUserProfile();
        alert('Prayer marked as answered! Praise God!');
      } else {
        setError(data.message || 'Failed to update prayer request');
      }
    } catch (error) {
      console.error('Prayer update error:', error);
      setError('Network error. Please try again.');
    }
  };

  // Handle removing a connection
  const handleRemoveConnection = async (connectionId) => {
    if (!window.confirm('Are you sure you want to remove this connection?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/connections/${connectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Refresh connections list
        fetchUserConnections();
        alert('Connection removed successfully');
      } else {
        alert(data.message || 'Failed to remove connection');
      }
    } catch (error) {
      console.error('Error removing connection:', error);
      alert('Failed to remove connection. Please try again.');
    }
  };

  // Navigate to a connection's profile
  const handleViewProfile = (userId) => {
    navigate(`/member/${userId}`);
  };

  // Helper function to get the correct image URL
  const getProfileImageUrl = (profilePicture) => {
    if (!profilePicture) return null;
    
    // If it's already a full URL (starts with http), use it as is (Cloudinary URLs)
    if (profilePicture.startsWith('http')) {
      return profilePicture;
    }
    
    // If it's a relative path, prepend the API base URL
    return `${API_CONFIG.BASE_URL}${profilePicture}`;
  };

  if (loading) {
    return (
      <div className={styles.memberProfilePage}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading your profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className={styles.memberProfilePage}>
        <Header />
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={() => window.location.href = '/'} className={styles.backButton}>
            Go Back Home
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.memberProfilePage}>
      <Header />
      
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className={styles.profileContainer}>
              
              {/* Profile Header */}
              <div className={styles.profileHeader}>
                <div className={styles.profilePictureSection}>
                  <div className={styles.profilePictureWrapper}>
                    {user?.profilePicture ? (
                      <img 
                        src={getProfileImageUrl(user.profilePicture)} 
                        alt="Profile" 
                        className={styles.profilePicture}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={styles.defaultAvatar}
                      style={user?.profilePicture ? {display: 'none'} : {display: 'flex'}}
                    >
                      <span className="material-icons">person</span>
                    </div>
                  </div>
                  
                  <div className={styles.uploadSection}>
                    <input
                      type="file"
                      id="profilePicture"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="profilePicture" className={styles.uploadButton}>
                      Choose Photo
                    </label>
                    {profilePictureFile && (
                      <button 
                        onClick={handleUploadProfilePicture} 
                        disabled={uploading}
                        className={styles.saveButton}
                      >
                        {uploading ? 'Uploading...' : 'Save Photo'}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className={styles.profileInfo}>
                  <h1>{user?.firstName} {user?.lastName}</h1>
                  <p className={styles.memberSince}>Member since {new Date(user?.joinDate).toLocaleDateString()}</p>
                  {user?.relationshipStatus && user?.privacy?.showRelationshipStatus && (
                    <p className={styles.relationshipStatus}>
                      <span className="material-icons">favorite</span>
                      {user.relationshipStatus}
                    </p>
                  )}
                  {user?.location && user?.privacy?.showLocation && (
                    <p className={styles.location}>
                      <span className="material-icons">location_on</span>
                      {[user.location.city, user.location.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                
                <div className={styles.headerActions}>
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={styles.editButton}
                  >
                    <span className="material-icons">
                      {isEditing ? 'close' : 'edit'}
                    </span>
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              {/* Profile Content */}
              <div className={styles.profileContent}>
                {isEditing ? (
                  /* Edit Form - keeping the existing edit form code */
                  <form onSubmit={handleUpdateProfile} className={styles.editForm}>
                    <div className={styles.formGrid}>
                      
                      {/* Basic Information */}
                      <div className={styles.formSection}>
                        <h3>Basic Information</h3>
                        
                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label>First Name</label>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Last Name</label>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label>Bio</label>
                          <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            placeholder="Tell us about yourself..."
                            rows="3"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>Relationship Status</label>
                          <select
                            name="relationshipStatus"
                            value={formData.relationshipStatus}
                            onChange={handleInputChange}
                          >
                            <option value="">Prefer not to say</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        </div>

                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label>City</label>
                            <input
                              type="text"
                              name="location.city"
                              value={formData.location.city}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>State</label>
                            <input
                              type="text"
                              name="location.state"
                              value={formData.location.state}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Spiritual Information */}
                      <div className={styles.formSection}>
                        <h3>Spiritual Information</h3>
                        
                        <div className={styles.formGroup}>
                          <label>Your Testimony</label>
                          <textarea
                            name="testimony"
                            value={formData.testimony}
                            onChange={handleInputChange}
                            placeholder="Share your faith journey..."
                            rows="4"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>Favorite Bible Verse</label>
                          <input
                            type="text"
                            name="favoriteVerse.verse"
                            value={formData.favoriteVerse.verse}
                            onChange={handleInputChange}
                            placeholder="Enter the verse text..."
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>Scripture Reference</label>
                          <input
                            type="text"
                            name="favoriteVerse.reference"
                            value={formData.favoriteVerse.reference}
                            onChange={handleInputChange}
                            placeholder="e.g., John 3:16"
                          />
                        </div>
                      </div>

                      {/* Privacy Settings */}
                      <div className={styles.formSection}>
                        <h3>Privacy Settings</h3>
                        
                        <div className={styles.privacyOptions}>
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              name="privacy.showEmail"
                              checked={formData.privacy.showEmail}
                              onChange={handleInputChange}
                            />
                            Show my email address
                          </label>
                          
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              name="privacy.showLocation"
                              checked={formData.privacy.showLocation}
                              onChange={handleInputChange}
                            />
                            Show my location
                          </label>
                          
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              name="privacy.showRelationshipStatus"
                              checked={formData.privacy.showRelationshipStatus}
                              onChange={handleInputChange}
                            />
                            Show my relationship status
                          </label>
                          
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              name="privacy.showTestimony"
                              checked={formData.privacy.showTestimony}
                              onChange={handleInputChange}
                            />
                            Show my testimony
                          </label>
                          
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              name="privacy.showPrayerRequests"
                              checked={formData.privacy.showPrayerRequests}
                              onChange={handleInputChange}
                            />
                            Show my prayer requests
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className={styles.formActions}>
                      <button type="submit" className={styles.saveProfileButton}>
                        Save Changes
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIsEditing(false)}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  /* View Mode */
                  <div className={styles.profileView}>
                    
                    {/* Tab Navigation */}
                    <div className={styles.profileTabs}>
                      <button 
                        className={`${styles.tabButton} ${activeTab === 'posts' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('posts')}
                      >
                        <span className="material-icons">photo_library</span>
                        Posts
                      </button>
                      <button 
                        className={`${styles.tabButton} ${activeTab === 'connections' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('connections')}
                      >
                        <span className="material-icons">people</span>
                        Connections ({connections.length})
                      </button>
                      <button 
                        className={`${styles.tabButton} ${activeTab === 'messages' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('messages')}
                      >
                        <span className="material-icons">message</span>
                        Messages
                      </button>
                      <button 
                        className={`${styles.tabButton} ${activeTab === 'about' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('about')}
                      >
                        <span className="material-icons">info</span>
                        About
                      </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'posts' && (
                      <div>
                        <UserPosts 
                          userId={user._id} 
                          isOwnProfile={true} 
                          currentUser={user} 
                        />
                      </div>
                    )}

                    {activeTab === 'connections' && (
                      <div className={styles.connectionsSection}>
                        <h3>
                          <span className="material-icons">people</span>
                          My Connections
                        </h3>
                        
                        {loadingConnections ? (
                          <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <p>Loading connections...</p>
                          </div>
                        ) : connections.length === 0 ? (
                          <div className={styles.noConnections}>
                            <span className="material-icons">person_add</span>
                            <p>You haven't made any connections yet.</p>
                            <button 
                              onClick={() => navigate('/members')}
                              className={styles.findConnectionsButton}
                            >
                              Find Members to Connect With
                            </button>
                          </div>
                        ) : (
                          <div className={styles.connectionsGrid}>
                            {connections.map((connection) => (
                              <div key={connection._id} className={styles.connectionCard}>
                                <div className={styles.connectionAvatar}>
                                  {connection.profilePicture ? (
                                    <img 
                                      src={getProfileImageUrl(connection.profilePicture)}
                                      alt={`${connection.firstName} ${connection.lastName}`}
                                      onClick={() => handleViewProfile(connection._id)}
                                    />
                                  ) : (
                                    <div 
                                      className={styles.defaultConnectionAvatar}
                                      onClick={() => handleViewProfile(connection._id)}
                                    >
                                      <span className="material-icons">person</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className={styles.connectionInfo}>
                                  <h4 onClick={() => handleViewProfile(connection._id)}>
                                    {connection.firstName} {connection.lastName}
                                  </h4>
                                  {connection.location && (
                                    <p className={styles.connectionLocation}>
                                      <span className="material-icons">location_on</span>
                                      {[connection.location.city, connection.location.state].filter(Boolean).join(', ')}
                                    </p>
                                  )}
                                  <p className={styles.connectionDate}>
                                    Connected since {new Date(connection.connectedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                
                                <div className={styles.connectionActions}>
                                  <button 
                                    className={styles.viewProfileButton}
                                    onClick={() => handleViewProfile(connection._id)}
                                  >
                                    <span className="material-icons">person</span>
                                    View Profile
                                  </button>
                                  <button 
                                    className={styles.removeConnectionButton}
                                    onClick={() => handleRemoveConnection(connection.connectionId)}
                                  >
                                    <span className="material-icons">person_remove</span>
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'messages' && (
                      <div className={styles.messagesSection}>
                        <ProfileMessages currentUser={user} />
                      </div>
                    )}

                    {activeTab === 'about' && (
                      <div>
                        {/* Bio Section */}
                        {user?.bio && (
                          <div className={styles.profileSection}>
                            <h3>About Me</h3>
                            <p>{user.bio}</p>
                          </div>
                        )}

                        {/* Testimony Section */}
                        {user?.testimony && user?.privacy?.showTestimony && (
                          <div className={styles.profileSection}>
                            <h3>My Testimony</h3>
                            <p>{user.testimony}</p>
                          </div>
                        )}

                        {/* Favorite Verse Section */}
                        {user?.favoriteVerse?.verse && (
                          <div className={styles.profileSection}>
                            <h3>Favorite Bible Verse</h3>
                            <blockquote className={styles.verseQuote}>
                              "{user.favoriteVerse.verse}"
                              {user.favoriteVerse.reference && (
                                <cite>— {user.favoriteVerse.reference}</cite>
                              )}
                            </blockquote>
                          </div>
                        )}

                        {/* Prayer Requests Section */}
                        <div className={styles.profileSection}>
                          <h3>Prayer Requests</h3>
                          
                          {/* Add New Prayer Request */}
                          <form onSubmit={handleAddPrayerRequest} className={styles.prayerForm}>
                            <div className={styles.formGroup}>
                              <textarea
                                value={newPrayerRequest}
                                onChange={(e) => setNewPrayerRequest(e.target.value)}
                                placeholder="Share a prayer request..."
                                rows="3"
                                required
                              />
                            </div>
                            <div className={styles.prayerOptions}>
                              <label className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={isPrivatePrayer}
                                  onChange={(e) => setIsPrivatePrayer(e.target.checked)}
                                />
                                Private prayer request (only visible to you)
                              </label>
                              <button type="submit" className={styles.addPrayerButton}>
                                Add Prayer Request
                              </button>
                            </div>
                          </form>

                          {/* Prayer Requests List */}
                          <div className={styles.prayerRequests}>
                            {user?.prayerRequests?.length > 0 ? (
                              user.prayerRequests.map((prayer) => (
                                <div key={prayer._id} className={`${styles.prayerRequest} ${prayer.isAnswered ? styles.answered : ''}`}>
                                  <div className={styles.prayerContent}>
                                    <p>{prayer.request}</p>
                                    <div className={styles.prayerMeta}>
                                      <span className={styles.prayerDate}>
                                        {new Date(prayer.createdAt).toLocaleDateString()}
                                      </span>
                                      {prayer.isPrivate && (
                                        <span className={styles.privateTag}>Private</span>
                                      )}
                                      {prayer.isAnswered && (
                                        <span className={styles.answeredTag}>Answered</span>
                                      )}
                                    </div>
                                  </div>
                                  {!prayer.isAnswered && (
                                    <button
                                      onClick={() => handleMarkPrayerAnswered(prayer._id)}
                                      className={styles.markAnsweredButton}
                                    >
                                      Mark as Answered
                                    </button>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className={styles.noPrayers}>No prayer requests yet. Share your first prayer request above!</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MemberProfile;