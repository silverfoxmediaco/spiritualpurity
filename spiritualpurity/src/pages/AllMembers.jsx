// src/pages/AllMembers.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import API_CONFIG from '../config/api';
import styles from '../styles/AllMembers.module.css';

const AllMembers = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterRelationship, setFilterRelationship] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [connectionStatuses, setConnectionStatuses] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllMembers();
  }, []);

  useEffect(() => {
    filterAndSortMembers();
  }, [members, searchTerm, filterLocation, filterRelationship, sortBy]);

  const fetchAllMembers = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/all-members`);
      const data = await response.json();

      if (data.success) {
        setMembers(data.data.members);
        // Fetch connection statuses for logged in users
        const token = localStorage.getItem('token');
        if (token) {
          fetchConnectionStatuses(data.data.members);
        }
      } else {
        setError('Failed to load members');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Network error loading members');
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionStatuses = async (membersList) => {
    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Only fetch for members that aren't the current user
      const otherMembers = membersList.filter(member => member._id !== currentUser._id);
      
      const statusPromises = otherMembers.map(async (member) => {
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}/api/connections/status/${member._id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();
          return {
            memberId: member._id,
            status: data.success ? data.data.status : 'none'
          };
        } catch (error) {
          return {
            memberId: member._id,
            status: 'none'
          };
        }
      });

      const statuses = await Promise.all(statusPromises);
      const statusMap = statuses.reduce((acc, { memberId, status }) => {
        acc[memberId] = status;
        return acc;
      }, {});

      setConnectionStatuses(statusMap);
    } catch (error) {
      console.error('Error fetching connection statuses:', error);
    }
  };

  const filterAndSortMembers = () => {
    let filtered = members.filter(member => {
      const matchesSearch = 
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.bio && member.bio.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesLocation = !filterLocation || 
        (member.location && member.privacy?.showLocation && 
         (member.location.city.toLowerCase().includes(filterLocation.toLowerCase()) ||
          member.location.state.toLowerCase().includes(filterLocation.toLowerCase())));

      const matchesRelationship = !filterRelationship ||
        (member.relationshipStatus && member.privacy?.showRelationshipStatus &&
         member.relationshipStatus === filterRelationship);

      return matchesSearch && matchesLocation && matchesRelationship;
    });

    // Sort members
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.joinDate) - new Date(a.joinDate);
        case 'oldest':
          return new Date(a.joinDate) - new Date(b.joinDate);
        case 'alphabetical':
          return a.firstName.localeCompare(b.firstName);
        case 'location':
          const aLocation = a.location?.city || '';
          const bLocation = b.location?.city || '';
          return aLocation.localeCompare(bLocation);
        default:
          return 0;
      }
    });

    setFilteredMembers(filtered);
  };

  const handleMemberClick = (memberId) => {
    navigate(`/member/${memberId}`);
  };

  const handleConnect = async (memberId, memberName) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to connect with members');
      return;
    }

    const currentStatus = connectionStatuses[memberId];
    if (currentStatus === 'connected') {
      alert('You are already connected with this member');
      return;
    }
    if (currentStatus === 'sent') {
      alert('Connection request already sent');
      return;
    }

    setActionLoading(prev => ({ ...prev, [memberId]: 'connect' }));

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/connections/send-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: memberId,
          message: `Hi ${memberName}, I'd like to connect with you on our faith journey!`
        }),
      });

      const data = await response.json();
      if (data.success) {
        setConnectionStatuses(prev => ({
          ...prev,
          [memberId]: 'sent'
        }));
        alert(`Connection request sent to ${memberName}!`);
      } else {
        alert(data.message || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to send connection request. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [memberId]: null }));
    }
  };

  const handleSendMessage = async (memberId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to send messages');
      return;
    }

    setActionLoading(prev => ({ ...prev, [memberId]: 'message' }));

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/messages/conversation/${memberId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        navigate('/profile');
        setTimeout(() => {
          alert('Conversation started! Check your Messages section in your profile.');
        }, 500);
      } else {
        alert(data.message || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [memberId]: null }));
    }
  };

  const formatJoinDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterLocation('');
    setFilterRelationship('');
    setSortBy('newest');
  };

  const getConnectionButtonText = (status) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'sent':
        return 'Sent';
      case 'received':
        return 'Accept';
      default:
        return 'Connect';
    }
  };

  const getConnectionButtonIcon = (status) => {
    switch (status) {
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
    
    // If it's already a full URL (starts with http), use it as is (Cloudinary URLs)
    if (profilePicture.startsWith('http')) {
      return profilePicture;
    }
    
    // If it's a relative path, prepend the API base URL
    return `${API_CONFIG.BASE_URL}${profilePicture}`;
  };

  if (loading) {
    return (
      <div className={styles.allMembersPage}>
        <Header />
        <div className="container">
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <h2>Loading Our Community...</h2>
            <p>Gathering all the wonderful believers in our family</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.allMembersPage}>
        <Header />
        <div className="container">
          <div className={styles.errorContainer}>
            <h2>Unable to Load Members</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className={styles.allMembersPage}>
      <Header />
      
      {/* Page Header */}
      <section className={styles.pageHeader}>
        <div className="container">
          <div className={styles.headerContent}>
            <h1>Our Community Members</h1>
            <p>Connect with believers from around the world who are growing in their faith together</p>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className={styles.filtersSection}>
        <div className="container">
          <div className={styles.filtersContainer}>
            <div className={styles.searchBar}>
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Search by name or bio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className={styles.filterControls}>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Locations</option>
                {[...new Set(members.filter(m => m.location?.city && m.privacy?.showLocation)
                  .map(m => `${m.location.city}, ${m.location.state}`))].map(location => (
                  <option key={location} value={location.split(',')[0]}>{location}</option>
                ))}
              </select>

              <select
                value={filterRelationship}
                onChange={(e) => setFilterRelationship(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Relationship Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.sortSelect}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">A-Z</option>
                <option value="location">By Location</option>
              </select>

              <button onClick={clearFilters} className={styles.clearButton}>
                <span className="material-icons">clear</span>
                Clear Filters
              </button>
            </div>

            <div className={styles.resultsInfo}>
              Showing {filteredMembers.length} of {members.length} members
            </div>
          </div>
        </div>
      </section>

      {/* Members Grid */}
      <section className={styles.membersSection}>
        <div className="container">
          {filteredMembers.length === 0 ? (
            <div className={styles.noResults}>
              <span className="material-icons">search_off</span>
              <h3>No Members Found</h3>
              <p>Try adjusting your filters or search terms</p>
              <button onClick={clearFilters} className={styles.clearButton}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className={styles.membersGrid}>
              {filteredMembers.map((member) => {
                const isCurrentUser = currentUser._id === member._id;
                const connectionStatus = connectionStatuses[member._id] || 'none';
                const isActionLoading = actionLoading[member._id];

                return (
                  <div 
                    key={member._id}
                    className={styles.memberCard}
                  >
                    <div className={styles.memberHeader}>
                      <div className={styles.memberImageWrapper}>
                        {member.profilePicture ? (
                          <img 
                            src={getProfileImageUrl(member.profilePicture)}
                            alt={`${member.firstName} ${member.lastName}`}
                            className={styles.memberImage}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={styles.defaultAvatar} style={member.profilePicture ? {display: 'none'} : {}}>
                          <span className="material-icons">person</span>
                        </div>
                        
                        {/* New member indicator */}
                        {new Date() - new Date(member.joinDate) < 30 * 24 * 60 * 60 * 1000 && (
                          <div className={styles.newMemberBadge}>
                            <span className="material-icons">fiber_new</span>
                          </div>
                        )}

                        {/* Connection status indicator */}
                        {!isCurrentUser && connectionStatus === 'connected' && (
                          <div className={styles.connectedBadge}>
                            <span className="material-icons">people</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.memberBasicInfo}>
                        <h3 className={styles.memberName}>
                          {member.firstName} {member.lastName}
                        </h3>
                        
                        {member.location && member.privacy?.showLocation && (
                          <p className={styles.memberLocation}>
                            <span className="material-icons">location_on</span>
                            {[member.location.city, member.location.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={styles.memberDetails}>
                      {member.bio && (
                        <p className={styles.memberBio}>
                          {member.bio.length > 100 
                            ? `${member.bio.substring(0, 100)}...` 
                            : member.bio
                          }
                        </p>
                      )}

                      <div className={styles.memberMeta}>
                        <div className={styles.joinInfo}>
                          <span className="material-icons">schedule</span>
                          <span>Joined {formatJoinDate(member.joinDate)}</span>
                        </div>

                        {member.relationshipStatus && member.privacy?.showRelationshipStatus && (
                          <div className={styles.relationshipInfo}>
                            <span className="material-icons">favorite</span>
                            <span>{member.relationshipStatus}</span>
                          </div>
                        )}

                        {/* Connection Status Display */}
                        {!isCurrentUser && connectionStatus !== 'none' && (
                          <div className={`${styles.connectionStatusDisplay} ${styles[connectionStatus]}`}>
                            <span className="material-icons">{getConnectionButtonIcon(connectionStatus)}</span>
                            <span>{getConnectionButtonText(connectionStatus)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.memberActions}>
                      <button 
                        className={styles.viewProfileButton}
                        onClick={() => handleMemberClick(member._id)}
                      >
                        <span className="material-icons">visibility</span>
                        View Profile
                      </button>
                      
                      {!isCurrentUser && (
                        <>
                          <button 
                            className={`${styles.connectButton} ${connectionStatus === 'connected' ? styles.connected : ''}`}
                            onClick={() => handleConnect(member._id, member.firstName)}
                            disabled={isActionLoading === 'connect' || connectionStatus === 'connected'}
                          >
                            <span className="material-icons">{getConnectionButtonIcon(connectionStatus)}</span>
                            {isActionLoading === 'connect' ? 'Connecting...' : getConnectionButtonText(connectionStatus)}
                          </button>
                          
                          <button 
                            className={styles.messageButton}
                            onClick={() => handleSendMessage(member._id)}
                            disabled={isActionLoading === 'message'}
                          >
                            <span className="material-icons">message</span>
                            {isActionLoading === 'message' ? 'Starting...' : 'Message'}
                          </button>
                        </>
                      )}
                      
                      {isCurrentUser && (
                        <button 
                          className={styles.editProfileButton}
                          onClick={() => navigate('/profile')}
                        >
                          <span className="material-icons">edit</span>
                          Edit Profile
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Community Stats Section */}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsContent}>
            <h2>Growing Together in Faith</h2>
            <p>See how our spiritual community continues to expand with believers from around the world</p>
            
            <div className={styles.communityStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{members.length}</span>
                <span className={styles.statLabel}>Total Members</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>
                  {members.filter(m => new Date() - new Date(m.joinDate) < 30 * 24 * 60 * 60 * 1000).length}
                </span>
                <span className={styles.statLabel}>New This Month</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>
                  {[...new Set(members.filter(m => m.location?.country).map(m => m.location.country))].length}
                </span>
                <span className={styles.statLabel}>Countries</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaContent}>
            <h2>Join Our Growing Community</h2>
            <p>Be part of something bigger. Connect with believers, grow in faith, and make lasting friendships.</p>
            <button 
              className={styles.joinButton}
              onClick={() => navigate('/')}
            >
              <span className="material-icons">group_add</span>
              Become a Member
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AllMembers;