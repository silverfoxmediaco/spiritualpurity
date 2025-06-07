// src/components/admin/UserTable.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/admin/Admin.module.css';

const UserTable = ({ 
  users, 
  loading, 
  onStatusChange, 
  onRoleChange,
  currentUserId 
}) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'admin':
        return styles.badgeAdmin;
      case 'moderator':
        return styles.badgeModerator;
      default:
        return styles.badgeMember;
    }
  };

  const getStatusBadgeClass = (isActive) => {
    return isActive ? styles.badgeActive : styles.badgeInactive;
  };

  if (loading) {
    return (
      <div className={styles.tableLoading}>
        <div className={styles.spinner}></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.userTable}>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Prayers</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar}>
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.firstName} />
                    ) : (
                      <span className="material-icons">person</span>
                    )}
                  </div>
                  <div>
                    <div className={styles.userName}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div className={styles.userLocation}>
                      {user.location?.city && user.location?.state && 
                        `${user.location.city}, ${user.location.state}`
                      }
                    </div>
                  </div>
                </div>
              </td>
              
              <td>{user.email}</td>
              
              <td>
                <select 
                  className={`${styles.roleSelect} ${getRoleBadgeClass(user.role)}`}
                  value={user.role}
                  onChange={(e) => onRoleChange(user._id, e.target.value)}
                  disabled={user._id === currentUserId}
                >
                  <option value="member">Member</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              
              <td>
                <button
                  className={`${styles.statusBadge} ${getStatusBadgeClass(user.isActive)}`}
                  onClick={() => onStatusChange(user._id, !user.isActive)}
                  disabled={user._id === currentUserId}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </button>
              </td>
              
              <td>{formatDate(user.joinDate)}</td>
              
              <td>
                <div className={styles.prayerStats}>
                  <span className="material-icons">volunteer_activism</span>
                  {user.prayerStats?.totalPrayersOffered || 0}
                </div>
              </td>
              
              <td>
                <div className={styles.tableActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => navigate(`/member/${user._id}`)}
                    title="View Profile"
                  >
                    <span className="material-icons">visibility</span>
                  </button>
                  
                  <button
                    className={styles.actionButton}
                    onClick={() => navigate(`/admin/users/${user._id}/edit`)}
                    title="Edit User"
                  >
                    <span className="material-icons">edit</span>
                  </button>
                  
                  <button
                    className={`${styles.actionButton} ${styles.danger}`}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this user?')) {
                        // Handle delete
                      }
                    }}
                    title="Delete User"
                    disabled={user._id === currentUserId}
                  >
                    <span className="material-icons">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {users.length === 0 && (
        <div className={styles.noData}>
          <span className="material-icons">people_outline</span>
          <p>No users found</p>
        </div>
      )}
    </div>
  );
};

export default UserTable;