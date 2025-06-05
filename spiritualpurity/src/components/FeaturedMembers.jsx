// src/components/FeaturedMembers.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_CONFIG from '../config/api';
import styles from '../styles/FeaturedMembers.module.css';

const FeaturedMembers = ({ limit = 4, showTitle = true, showViewAllButton = true }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPersonalized, setIsPersonalized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedMembers();
  }, []);

  const fetchFeaturedMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      let endpoint = `${API_CONFIG.BASE_URL}/api/users/newest-members`;
      let headers = { 'Content-Type': 'application/json' };

      // Try personalized endpoint if user is logged in
      if (token) {
        endpoint = `${API_CONFIG.BASE_URL}/api/users/personalized-featured`;
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, { headers });
      const data = await response.json();

      if (data.success) {
        // Limit the results to the specified number
        const limitedMembers = data.data.members.slice(0, limit);
        setMembers(limitedMembers);
        
        // Check if any members are personalized
        if (data.data.personalizedCount > 0) {
          setIsPersonalized(true);
        }
      } else {
        // If personalized endpoint fails, fallback to newest members
        if (token) {
          await fetchNewestMembersFallback();
        } else {
          setError('Failed to load featured members');
        }
      }
    } catch (error) {
      console.error('Error fetching featured members:', error);
      // Fallback to newest members on any error
      await fetchNewestMembersFallback();
    } finally {
      setLoading(false);
    }
  };

  const fetchNewestMembersFallback = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/newest-members`);
      const data = await response.json();

      if (data.success) {
        const limitedMembers = data.data.members.slice(0, limit);
        setMembers(limitedMembers);
      } else {
        setError('Failed to load members');
      }
    } catch (error) {
      console.error('Error fetching newest members:', error);
      setError('Network error loading members');
    }
  };

  const handleMemberClick = (memberId) => {
    navigate(`/member/${memberId}`);
  };

  const formatJoinDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <section className={styles.featuredSection}>
        <div className="container">
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <h3>Finding members for you...</h3>
            <p>Discovering believers who share your interests</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.featuredSection}>
        <div className="container">
          <div className={styles.loadingState}>
            <h3>Unable to Load Members</h3>
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.featuredSection}>
      <div className="container">
        {showTitle && (
          <div className={styles.sectionHeader}>
            <h2>
              {isPersonalized ? 'Members You Should Meet' : 'Featured Members'}
            </h2>
            <p>
              {isPersonalized 
                ? 'Believers who share your interests and faith journey'
                : 'Meet some of our amazing community members'
              }
            </p>
          </div>
        )}

        <div className={styles.membersGrid}>
          {members.map((member) => (
            <div key={member._id} className={styles.memberCard} onClick={() => handleMemberClick(member._id)}>
              <div className={styles.memberImageWrapper}>
                <img 
                  src={member.profilePicture ? `${API_CONFIG.BASE_URL}${member.profilePicture}` : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23f59e0b"/><path d="M40 20c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 30c-8.3 0-15 3.3-15 7.5V65h30v-7.5c0-4.2-6.7-7.5-15-7.5z" fill="white"/></svg>'} 
                  alt={`${member.firstName} ${member.lastName}`}
                  className={styles.memberImage}
                />
                
                {/* Show personalization indicator */}
                {member.isPersonalized && (
                  <div className={styles.memberBadge}>
                    <span className="material-icons">star</span>
                  </div>
                )}
                
                {/* Show "new member" badge for recent joiners */}
                {new Date() - new Date(member.joinDate) < 30 * 24 * 60 * 60 * 1000 && (
                  <div className={styles.newMemberBadge}>
                    <span className="material-icons">fiber_new</span>
                  </div>
                )}
              </div>

              <div className={styles.memberInfo}>
                <h3 className={styles.memberName}>
                  {member.firstName} {member.lastName}
                </h3>
                
                {member.location && (
                  <p className={styles.memberLocation}>
                    <span className="material-icons">location_on</span>
                    {[member.location.city, member.location.state].filter(Boolean).join(', ')}
                  </p>
                )}

                {member.bio && (
                  <p className={styles.memberBio}>
                    {member.bio.length > 80 
                      ? `${member.bio.substring(0, 80)}...` 
                      : member.bio
                    }
                  </p>
                )}

                <div className={styles.memberMeta}>
                  <div className={styles.joinDate}>
                    Joined {formatJoinDate(member.joinDate)}
                  </div>

                  {member.relationshipStatus && (
                    <div className={styles.relationshipStatus}>
                      <span className="material-icons">favorite</span>
                      <span>{member.relationshipStatus}</span>
                    </div>
                  )}

                  {/* Show shared interests if personalized */}
                  {member.isPersonalized && member.interests && (
                    <div className={styles.sharedInterests}>
                      <span className="material-icons">interests</span>
                      <span>{member.interests.slice(0, 2).join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Permanent View Profile Button */}
                <button 
                  className={styles.viewProfileButton}
                  onClick={() => handleMemberClick(member._id)}
                >
                  <span>View Profile</span>
                  <span className="material-icons">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {showViewAllButton && (
          <div className={styles.sectionFooter}>
            <Link to="/members" className={styles.viewAllButton}>
              <span>View All Members</span>
              <span className="material-icons">group</span>
            </Link>
          </div>
        )}

        {/* Show personalization status */}
        {isPersonalized && (
          <div className={styles.personalizationNote}>
            <span className="material-icons">auto_awesome</span>
            <span>Personalized recommendations based on your interests</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedMembers;