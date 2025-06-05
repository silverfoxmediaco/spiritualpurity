// src/components/NewestMembers.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from '../config/api';
import styles from '../styles/NewestMembers.module.css';

const NewestMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNewestMembers();
  }, []);

  const fetchNewestMembers = async () => {
    try {
      console.log('Fetching from:', `${API_CONFIG.BASE_URL}/api/users/newest-members`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/newest-members`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMembers(data.data.members);
      } else {
        console.error('API returned error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching newest members:', error);
      // Set some fallback members or show error state
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = (memberId) => {
    navigate(`/member/${memberId}`);
  };

  const handleViewAllMembers = () => {
    navigate('/members');
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
            <h2>Loading Our Newest Members...</h2>
            <p>Gathering our growing community of believers</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.newestMembersSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2>Welcome Our Newest Members</h2>
          <p>Meet the latest believers who have joined our growing community of faith</p>
        </div>

        {members.length > 0 ? (
          <>
            <div className={styles.membersGrid}>
              {members.map((member) => (
                <div
                  key={member._id}
                  className={styles.memberCard}
                >
                  <div className={styles.memberImageWrapper}>
                    {member.profilePicture ? (
                      <img 
                        src={`${API_CONFIG.BASE_URL}${member.profilePicture}`}
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
                    
                    {/* New member badge */}
                    <div className={styles.memberBadge}>
                      <span className="material-icons">fiber_new</span>
                    </div>
                  </div>

                  <div className={styles.memberInfo}>
                    <h3 className={styles.memberName}>
                      {member.firstName} {member.lastName}
                    </h3>
                    
                    {member.location && member.privacy?.showLocation && (
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

                      {member.relationshipStatus && member.privacy?.showRelationshipStatus && (
                        <div className={styles.relationshipStatus}>
                          <span className="material-icons">favorite</span>
                          <span>{member.relationshipStatus}</span>
                        </div>
                      )}
                    </div>

                    {/* Always visible View Profile Button */}
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

            <div className={styles.sectionFooter}>
              <button 
                onClick={handleViewAllMembers}
                className={styles.viewAllButton}
              >
                <span className="material-icons">groups</span>
                View All Members
              </button>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <span className="material-icons">groups</span>
            <h3>No Members Found</h3>
            <p>Unable to load community members at this time. Please try again later.</p>
            <button onClick={fetchNewestMembers} className={styles.retryButton}>
              <span className="material-icons">refresh</span>
              Try Again
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default NewestMembers;