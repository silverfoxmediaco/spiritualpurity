// src/pages/PrayerGroups.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import API_CONFIG from '../config/api';
import styles from '../styles/PrayerGroups.module.css';

const PrayerGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [joinLoading, setJoinLoading] = useState({});
  
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    category: '',
    meetingSchedule: '',
    privacy: 'public',
    maxMembers: 12
  });

  const groupCategories = [
    'Men\'s Group',
    'Women\'s Group',
    'Youth Group',
    'Marriage & Family',
    'Bible Study',
    'Healing & Recovery',
    'Intercessory Prayer',
    'Singles',
    'Parents',
    'General Prayer'
  ];

  useEffect(() => {
    checkUserAuthentication();
    fetchPrayerGroups();
  }, []);

  const checkUserAuthentication = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setCurrentUser(JSON.parse(userData));
    }
  };

  const fetchPrayerGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      } : {
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/prayers/groups`, {
        headers
      });

      const data = await response.json();

      if (data.success) {
        setGroups(data.data.groups || []);
        if (currentUser) {
          const userGroups = data.data.groups.filter(group => 
            group.members.some(member => member.user._id === currentUser._id)
          );
          setMyGroups(userGroups);
        }
      } else {
        setError(data.message || 'Failed to load prayer groups');
      }
    } catch (error) {
      console.error('Error fetching prayer groups:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('Please log in to create a prayer group');
      navigate('/profile');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/prayers/groups/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGroupData),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setNewGroupData({
          name: '',
          description: '',
          category: '',
          meetingSchedule: '',
          privacy: 'public',
          maxMembers: 12
        });
        alert('Prayer group created successfully!');
        fetchPrayerGroups();
      } else {
        alert(data.message || 'Failed to create prayer group');
      }
    } catch (error) {
      console.error('Error creating prayer group:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleJoinGroup = async (groupId) => {
    if (!currentUser) {
      alert('Please log in to join prayer groups');
      navigate('/profile');
      return;
    }

    setJoinLoading(prev => ({ ...prev, [groupId]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/prayers/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('Successfully joined the prayer group!');
        fetchPrayerGroups();
      } else {
        alert(data.message || 'Failed to join prayer group');
      }
    } catch (error) {
      console.error('Error joining prayer group:', error);
      alert('Network error. Please try again.');
    } finally {
      setJoinLoading(prev => ({ ...prev, [groupId]: false }));
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!currentUser) return;

    if (!window.confirm('Are you sure you want to leave this prayer group?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/prayers/groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('You have left the prayer group');
        fetchPrayerGroups();
      } else {
        alert(data.message || 'Failed to leave prayer group');
      }
    } catch (error) {
      console.error('Error leaving prayer group:', error);
      alert('Network error. Please try again.');
    }
  };

  const isUserInGroup = (group) => {
    if (!currentUser) return false;
    return group.members.some(member => member.user._id === currentUser._id);
  };

  const isGroupLeader = (group) => {
    if (!currentUser) return false;
    return group.leader._id === currentUser._id;
  };

  const getFilteredGroups = () => {
    let filteredGroups = activeTab === 'my-groups' ? myGroups : groups;

    if (searchQuery) {
      filteredGroups = filteredGroups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filteredGroups = filteredGroups.filter(group => group.category === selectedCategory);
    }

    return filteredGroups;
  };

  const formatMeetingSchedule = (schedule) => {
    if (!schedule) return 'Schedule TBD';
    return schedule;
  };

  if (loading) {
    return (
      <div className={styles.prayerGroupsPage}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <h2>Loading Prayer Groups...</h2>
          <p>Gathering our prayer communities</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.prayerGroupsPage}>
      <Header />
      
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h1 className={styles.heroTitle}>Prayer Groups</h1>
              <p className={styles.heroSubtitle}>
                "For where two or three gather in my name, there am I with them."
              </p>
              <span className={styles.verseReference}>- Matthew 18:20</span>
            </div>
          </div>
        </div>
      </section>

      {/* Action Bar */}
      <section className={styles.actionBar}>
        <div className="container">
          <div className={styles.actionBarContent}>
            <div className={styles.searchSection}>
              <div className={styles.searchBox}>
                <span className="material-icons">search</span>
                <input
                  type="text"
                  placeholder="Search prayer groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.categoryFilter}
              >
                <option value="all">All Categories</option>
                {groupCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            {currentUser && (
              <button
                onClick={() => setShowCreateModal(true)}
                className={styles.createGroupButton}
              >
                <span className="material-icons">add_circle</span>
                Create Prayer Group
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.mainContent}>
        <div className="container">
          {/* Tab Navigation */}
          <div className={styles.tabNavigation}>
            <button
              className={`${styles.tabButton} ${activeTab === 'all' ? styles.active : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span className="material-icons">groups</span>
              All Groups ({groups.length})
            </button>
            {currentUser && (
              <button
                className={`${styles.tabButton} ${activeTab === 'my-groups' ? styles.active : ''}`}
                onClick={() => setActiveTab('my-groups')}
              >
                <span className="material-icons">people</span>
                My Groups ({myGroups.length})
              </button>
            )}
          </div>

          {/* Groups Grid */}
          <div className={styles.groupsGrid}>
            {getFilteredGroups().length === 0 ? (
              <div className={styles.emptyState}>
                <span className="material-icons">group_off</span>
                <h3>No prayer groups found</h3>
                <p>
                  {activeTab === 'my-groups' 
                    ? "You haven't joined any prayer groups yet. Explore and join groups that resonate with your faith journey!"
                    : "No groups match your search criteria. Try adjusting your filters or create a new group!"
                  }
                </p>
                {currentUser && activeTab === 'my-groups' && (
                  <button 
                    onClick={() => setActiveTab('all')}
                    className={styles.exploreButton}
                  >
                    Explore Groups
                  </button>
                )}
              </div>
            ) : (
              getFilteredGroups().map(group => (
                <div key={group._id} className={styles.groupCard}>
                  <div className={styles.groupHeader}>
                    <div className={styles.groupIcon}>
                      <span className="material-icons">
                        {group.privacy === 'private' ? 'lock' : 'groups'}
                      </span>
                    </div>
                    <div className={styles.groupBadges}>
                      <span className={styles.categoryBadge}>{group.category}</span>
                      {group.privacy === 'private' && (
                        <span className={styles.privateBadge}>Private</span>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.groupInfo}>
                    <h3>{group.name}</h3>
                    <p className={styles.groupDescription}>{group.description}</p>
                    
                    <div className={styles.groupMeta}>
                      <div className={styles.metaItem}>
                        <span className="material-icons">people</span>
                        <span>{group.members.length}/{group.maxMembers} members</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className="material-icons">schedule</span>
                        <span>{formatMeetingSchedule(group.meetingSchedule)}</span>
                      </div>
                    </div>
                    
                    <div className={styles.groupLeader}>
                      <span className="material-icons">person</span>
                      <span>Led by {group.leader.firstName} {group.leader.lastName}</span>
                    </div>
                  </div>
                  
                  <div className={styles.groupActions}>
                    {!currentUser ? (
                      <button 
                        onClick={() => navigate('/profile')}
                        className={styles.loginButton}
                      >
                        <span className="material-icons">login</span>
                        Login to Join
                      </button>
                    ) : isUserInGroup(group) ? (
                      <>
                        <button 
                          onClick={() => navigate(`/prayer-groups/${group._id}`)}
                          className={styles.viewButton}
                        >
                          <span className="material-icons">visibility</span>
                          View Group
                        </button>
                        {!isGroupLeader(group) && (
                          <button 
                            onClick={() => handleLeaveGroup(group._id)}
                            className={styles.leaveButton}
                          >
                            <span className="material-icons">exit_to_app</span>
                            Leave
                          </button>
                        )}
                      </>
                    ) : group.members.length >= group.maxMembers ? (
                      <button className={styles.fullButton} disabled>
                        <span className="material-icons">block</span>
                        Group Full
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleJoinGroup(group._id)}
                        className={styles.joinButton}
                        disabled={joinLoading[group._id]}
                      >
                        <span className="material-icons">add</span>
                        {joinLoading[group._id] ? 'Joining...' : 'Join Group'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create Prayer Group</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className={styles.closeButton}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className={styles.createForm}>
              <div className={styles.formGroup}>
                <label>Group Name</label>
                <input
                  type="text"
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData({...newGroupData, name: e.target.value})}
                  placeholder="Enter group name"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={newGroupData.description}
                  onChange={(e) => setNewGroupData({...newGroupData, description: e.target.value})}
                  placeholder="Describe the purpose and focus of your prayer group..."
                  rows="4"
                  required
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select
                    value={newGroupData.category}
                    onChange={(e) => setNewGroupData({...newGroupData, category: e.target.value})}
                    required
                  >
                    <option value="">Select category</option>
                    {groupCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Privacy</label>
                  <select
                    value={newGroupData.privacy}
                    onChange={(e) => setNewGroupData({...newGroupData, privacy: e.target.value})}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Meeting Schedule</label>
                  <input
                    type="text"
                    value={newGroupData.meetingSchedule}
                    onChange={(e) => setNewGroupData({...newGroupData, meetingSchedule: e.target.value})}
                    placeholder="e.g., Every Tuesday at 7 PM EST"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Max Members</label>
                  <input
                    type="number"
                    value={newGroupData.maxMembers}
                    onChange={(e) => setNewGroupData({...newGroupData, maxMembers: parseInt(e.target.value)})}
                    min="2"
                    max="50"
                  />
                </div>
              </div>
              
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitButton}>
                  Create Group
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PrayerGroups;