// src/pages/PrayerGroupDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import API_CONFIG from '../config/api';
import styles from '../styles/PrayerGroupDetail.module.css';

const PrayerGroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [newPrayerRequest, setNewPrayerRequest] = useState('');
  const [submittingPrayer, setSubmittingPrayer] = useState(false);

  useEffect(() => {
    checkUserAuthentication();
    fetchGroupDetails();
  }, [id]);

  const checkUserAuthentication = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setCurrentUser(JSON.parse(userData));
    }
  };

  const fetchGroupDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/prayers/groups/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setGroup(data.data.group);
        setIsMember(data.data.isMember);
      } else {
        setError(data.message || 'Prayer group not found');
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
      setError('Failed to load prayer group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!currentUser) {
      alert('Please log in to join this prayer group');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/prayers/groups/${id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('Successfully joined the prayer group!');
        fetchGroupDetails();
      } else {
        alert(data.message || 'Failed to join group');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to join group');
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this prayer group?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/prayers/groups/${id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('You have left the prayer group');
        navigate('/prayer-groups');
      } else {
        alert(data.message || 'Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group');
    }
  };

  const handleSubmitPrayerRequest = async (e) => {
    e.preventDefault();
    
    if (!newPrayerRequest.trim()) return;
    if (!isMember) {
      alert('You must be a member to submit prayer requests');
      return;
    }

    setSubmittingPrayer(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/prayers/groups/${id}/prayer-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request: newPrayerRequest
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewPrayerRequest('');
        fetchGroupDetails();
        alert('Prayer request submitted to the group');
      } else {
        alert(data.message || 'Failed to submit prayer request');
      }
    } catch (error) {
      console.error('Error submitting prayer request:', error);
      alert('Failed to submit prayer request');
    } finally {
      setSubmittingPrayer(false);
    }
  };

  const isGroupLeader = () => {
    return currentUser && group && group.leader._id === currentUser._id;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={styles.groupDetailPage}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <h2>Loading Prayer Group...</h2>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className={styles.groupDetailPage}>
        <Header />
        <div className={styles.errorContainer}>
          <h2>Prayer Group Not Found</h2>
          <p>{error || 'This prayer group does not exist'}</p>
          <button onClick={() => navigate('/prayer-groups')} className={styles.backButton}>
            Back to Prayer Groups
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.groupDetailPage}>
      <Header />
      
      {/* Group Header */}
      <section className={styles.groupHeader}>
        <div className="container">
          <div className={styles.headerContent}>
            <div className={styles.groupIcon}>
              <span className="material-icons">
                {group.privacy === 'private' ? 'lock' : 'groups'}
              </span>
            </div>
            
            <div className={styles.groupInfo}>
              <h1>{group.name}</h1>
              <p className={styles.groupDescription}>{group.description}</p>
              
              <div className={styles.groupMeta}>
                <span className={styles.metaItem}>
                  <span className="material-icons">category</span>
                  {group.category}
                </span>
                <span className={styles.metaItem}>
                  <span className="material-icons">people</span>
                  {group.members.length}/{group.maxMembers} members
                </span>
                <span className={styles.metaItem}>
                  <span className="material-icons">schedule</span>
                  {group.meetingSchedule || 'Schedule TBD'}
                </span>
                {group.privacy === 'private' && (
                  <span className={styles.privateBadge}>
                    <span className="material-icons">lock</span>
                    Private Group
                  </span>
                )}
              </div>
            </div>
            
            <div className={styles.groupActions}>
              {!isMember ? (
                <button 
                  onClick={handleJoinGroup}
                  className={styles.joinButton}
                  disabled={group.members.length >= group.maxMembers}
                >
                  <span className="material-icons">add</span>
                  {group.members.length >= group.maxMembers ? 'Group Full' : 'Join Group'}
                </button>
              ) : (
                <>
                  {!isGroupLeader() && (
                    <button 
                      onClick={handleLeaveGroup}
                      className={styles.leaveButton}
                    >
                      <span className="material-icons">exit_to_app</span>
                      Leave Group
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className={styles.tabSection}>
        <div className="container">
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'about' ? styles.active : ''}`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'members' ? styles.active : ''}`}
              onClick={() => setActiveTab('members')}
            >
              Members ({group.members.length})
            </button>
            {isMember && (
              <button
                className={`${styles.tab} ${activeTab === 'prayers' ? styles.active : ''}`}
                onClick={() => setActiveTab('prayers')}
              >
                Prayer Requests
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className={styles.content}>
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              {/* About Tab */}
              {activeTab === 'about' && (
                <div className={styles.aboutContent}>
                  <div className={styles.section}>
                    <h2>About This Group</h2>
                    <p>{group.description}</p>
                  </div>
                  
                  <div className={styles.section}>
                    <h3>Meeting Schedule</h3>
                    <p>{group.meetingSchedule || 'Meeting times to be determined'}</p>
                  </div>
                  
                  <div className={styles.section}>
                    <h3>Group Guidelines</h3>
                    <ul>
                      <li>Respect all members and their prayer requests</li>
                      <li>Keep all shared information confidential</li>
                      <li>Actively participate in group prayers</li>
                      <li>Support and encourage one another</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className={styles.membersContent}>
                  <h2>Group Members</h2>
                  <div className={styles.membersList}>
                    {group.members.map((member) => (
                      <div key={member.user._id} className={styles.memberCard}>
                        <div className={styles.memberAvatar}>
                          {member.user.profilePicture ? (
                            <img 
                              src={member.user.profilePicture} 
                              alt={`${member.user.firstName} ${member.user.lastName}`}
                            />
                          ) : (
                            <span className="material-icons">person</span>
                          )}
                        </div>
                        <div className={styles.memberInfo}>
                          <h4>
                            {member.user.firstName} {member.user.lastName}
                            {member.role === 'leader' && (
                              <span className={styles.leaderBadge}>Leader</span>
                            )}
                          </h4>
                          <p>Joined {formatDate(member.joinedAt)}</p>
                        </div>
                        <button 
                          onClick={() => navigate(`/member/${member.user._id}`)}
                          className={styles.viewProfileButton}
                        >
                          View Profile
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prayers Tab */}
              {activeTab === 'prayers' && isMember && (
                <div className={styles.prayersContent}>
                  <h2>Group Prayer Requests</h2>
                  
                  {/* Submit Prayer Form */}
                  <form onSubmit={handleSubmitPrayerRequest} className={styles.prayerForm}>
                    <textarea
                      value={newPrayerRequest}
                      onChange={(e) => setNewPrayerRequest(e.target.value)}
                      placeholder="Share a prayer request with the group..."
                      rows="3"
                    />
                    <button 
                      type="submit" 
                      disabled={submittingPrayer}
                      className={styles.submitButton}
                    >
                      {submittingPrayer ? 'Submitting...' : 'Submit Prayer Request'}
                    </button>
                  </form>

                  {/* Prayer Requests List */}
                  <div className={styles.prayersList}>
                    {group.prayerRequests && group.prayerRequests.length > 0 ? (
                      group.prayerRequests.map((prayer) => (
                        <div key={prayer._id} className={styles.prayerCard}>
                          <div className={styles.prayerHeader}>
                            <strong>{prayer.user.firstName} {prayer.user.lastName}</strong>
                            <span>{formatDate(prayer.createdAt)}</span>
                          </div>
                          <p className={styles.prayerText}>{prayer.request}</p>
                          <div className={styles.prayerActions}>
                            <button className={styles.prayButton}>
                              <span className="material-icons">volunteer_activism</span>
                              Pray
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className={styles.noPrayers}>No prayer requests yet</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <div className={styles.sidebar}>
                {/* Leader Card */}
                <div className={styles.sidebarCard}>
                  <h3>Group Leader</h3>
                  <div className={styles.leaderInfo}>
                    <div className={styles.leaderAvatar}>
                      {group.leader.profilePicture ? (
                        <img 
                          src={group.leader.profilePicture} 
                          alt={`${group.leader.firstName} ${group.leader.lastName}`}
                        />
                      ) : (
                        <span className="material-icons">person</span>
                      )}
                    </div>
                    <div>
                      <h4>{group.leader.firstName} {group.leader.lastName}</h4>
                      {group.leader.bio && <p>{group.leader.bio}</p>}
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/member/${group.leader._id}`)}
                    className={styles.viewLeaderButton}
                  >
                    View Profile
                  </button>
                </div>

                {/* Quick Actions */}
                {isMember && (
                  <div className={styles.sidebarCard}>
                    <h3>Quick Actions</h3>
                    <div className={styles.quickActions}>
                      <button 
                        onClick={() => navigate('/prayer')}
                        className={styles.actionButton}
                      >
                        <span className="material-icons">volunteer_activism</span>
                        Prayer Wall
                      </button>
                      <button 
                        onClick={() => navigate('/prayer-groups')}
                        className={styles.actionButton}
                      >
                        <span className="material-icons">groups</span>
                        All Groups
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrayerGroupDetail;