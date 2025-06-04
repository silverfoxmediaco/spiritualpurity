// src/components/NewestMembers.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/NewestMembers.module.css';

const NewestMembers = ({ limit = 6, showTitle = true, showViewAllButton = true }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchNewestMembers();
  }, []);

  const fetchNewestMembers = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/users/newest-members');
      const data = await response.json();

      if (data.success) {
        // Limit the results to the specified number
        const limitedMembers = data.data.members.slice(0, limit);
        setMembers(limitedMembers);
      } else {
        setError('Failed to load newest members');
      }
    } catch (error) {
      console.error('Error fetching newest members:', error);
      setError('Network error loading members');
    } finally {
      setLoading(false);
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
      <section className={styles.newestMembersSection}>
        <div className="container">
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <h3>Loading Newest Members...</h3>
            <p>Welcoming our newest believers</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.newestMembersSection}>
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
    <section className={styles.newestMembersSection}>
      <div className="container">
        {showTitle && (
          <div className={styles.sectionHeader}>
            <h2>Newest Members</h2>
            <p>Welcome our newest believers who have joined our faith community</p>
          </div>
        )}

        <div className={styles.membersGrid}>
          {members.map((member) => (
            <div key={member._id} className={styles.memberCard}>
              <div className={styles.memberImageWrapper}>
                <img 
                  src={member.profilePicture ? `http://localhost:5001${member.profilePicture}` : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23f59e0b"/><path d="M40 20c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 30c-8.3 0-15 3.3-15 7.5V65h30v-7.5c0-4.2-6.7-7.5-15-7.5z" fill="white"/></svg>'} 
                  alt={`${member.firstName} ${member.lastName}`}
                  className={styles.memberImage}
                />
                
                {/* New Member Badge - show for members who joined within 30 days */}
                {new Date() - new Date(member.joinDate) < 30 * 24 * 60 * 60 * 1000 && (
                  <div className={styles.memberBadge}>
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
      </div>
    </section>
  );
};

export default NewestMembers;