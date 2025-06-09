// src/components/Connection.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from '../config/api';
import styles from '../styles/Connection.module.css';

const Connection = () => {
  const [activeTab, setActiveTab] = useState('received');
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchConnectionData();
  }, []);

  const fetchConnectionData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchReceivedRequests(),
        fetchSentRequests(),
        fetchConnections()
      ]);
    } catch (error) {
      console.error('Error fetching connection data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceivedRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/connections/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setReceivedRequests(data.data.requests);
      }
    } catch (error) {
      console.error('Error fetching received requests:', error);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/connections/sent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setSentRequests(data.data.requests);
      }
    } catch (error) {
      console.error('Error fetching sent requests:', error);
    }
  };

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/connections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setConnections(data.data.connections);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const handleAcceptRequest = async (connectionId, requesterName) => {
    setActionLoading(prev => ({ ...prev, [connectionId]: 'accept' }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/connections/${connectionId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        alert(`You are now connected with ${requesterName}!`);
        fetchConnectionData(); // Refresh all data
      } else {
        alert(data.message || 'Failed to accept connection request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept connection request');
    } finally {
      setActionLoading(prev => ({ ...prev, [connectionId]: null }));
    }
  };

  const handleDeclineRequest = async (connectionId) => {
    setActionLoading(prev => ({ ...prev, [connectionId]: 'decline' }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/connections/${connectionId}/decline`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('Connection request declined');
        fetchConnectionData(); // Refresh all data
      } else {
        alert(data.message || 'Failed to decline connection request');
      }
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline connection request');
    } finally {
      setActionLoading(prev => ({ ...prev, [connectionId]: null }));
    }
  };

  const handleRemoveConnection = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from your connections?`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [userId]: 'remove' }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/connections/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('Connection removed');
        fetchConnectionData(); // Refresh all data
      } else {
        alert(data.message || 'Failed to remove connection');
      }
    } catch (error) {
      console.error('Error removing connection:', error);
      alert('Failed to remove connection');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  const getProfileImageUrl = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('http')) {
      return profilePicture;
    }
    return `${API_CONFIG.BASE_URL}${profilePicture}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={styles.connectionContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.connectionContainer}>
      <h2>Manage Connections</h2>
      
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === 'received' ? styles.active : ''}`}
          onClick={() => setActiveTab('received')}
        >
          Received ({receivedRequests.length})
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'sent' ? styles.active : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Sent ({sentRequests.length})
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'connections' ? styles.active : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          Connections ({connections.length})
        </button>
      </div>

      <div className={styles.tabContent}>
        {/* Received Requests Tab */}
        {activeTab === 'received' && (
          <div className={styles.requestsList}>
            {receivedRequests.length === 0 ? (
              <div className={styles.emptyState}>
                <span className="material-icons">person_add_disabled</span>
                <p>No pending connection requests</p>
              </div>
            ) : (
              receivedRequests.map(request => (
                <div key={request._id} className={styles.requestCard}>
                  <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                      {request.requester.profilePicture ? (
                        <img
                          src={getProfileImageUrl(request.requester.profilePicture)}
                          alt={`${request.requester.firstName} ${request.requester.lastName}`}
                        />
                      ) : (
                        <span className="material-icons">person</span>
                      )}
                    </div>
                    <div className={styles.userDetails}>
                      <h4
                        onClick={() => navigate(`/member/${request.requester._id}`)}
                        className={styles.userName}
                      >
                        {request.requester.firstName} {request.requester.lastName}
                      </h4>
                      {request.message && (
                        <p className={styles.requestMessage}>{request.message}</p>
                      )}
                      <span className={styles.requestDate}>
                        Received {formatDate(request.requestedAt)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.requestActions}>
                    <button
                      className={styles.acceptButton}
                      onClick={() => handleAcceptRequest(request._id, request.requester.firstName)}
                      disabled={actionLoading[request._id]}
                    >
                      <span className="material-icons">check</span>
                      {actionLoading[request._id] === 'accept' ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      className={styles.declineButton}
                      onClick={() => handleDeclineRequest(request._id)}
                      disabled={actionLoading[request._id]}
                    >
                      <span className="material-icons">close</span>
                      {actionLoading[request._id] === 'decline' ? 'Declining...' : 'Decline'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Sent Requests Tab */}
        {activeTab === 'sent' && (
          <div className={styles.requestsList}>
            {sentRequests.length === 0 ? (
              <div className={styles.emptyState}>
                <span className="material-icons">send</span>
                <p>No pending sent requests</p>
              </div>
            ) : (
              sentRequests.map(request => (
                <div key={request._id} className={styles.requestCard}>
                  <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                      {request.recipient.profilePicture ? (
                        <img
                          src={getProfileImageUrl(request.recipient.profilePicture)}
                          alt={`${request.recipient.firstName} ${request.recipient.lastName}`}
                        />
                      ) : (
                        <span className="material-icons">person</span>
                      )}
                    </div>
                    <div className={styles.userDetails}>
                      <h4
                        onClick={() => navigate(`/member/${request.recipient._id}`)}
                        className={styles.userName}
                      >
                        {request.recipient.firstName} {request.recipient.lastName}
                      </h4>
                      {request.message && (
                        <p className={styles.requestMessage}>{request.message}</p>
                      )}
                      <span className={styles.requestDate}>
                        Sent {formatDate(request.requestedAt)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.pendingBadge}>
                    <span className="material-icons">hourglass_empty</span>
                    Pending
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div className={styles.connectionsList}>
            {connections.length === 0 ? (
              <div className={styles.emptyState}>
                <span className="material-icons">people_outline</span>
                <p>No connections yet</p>
                <button
                  className={styles.findMembersButton}
                  onClick={() => navigate('/members')}
                >
                  Find Members
                </button>
              </div>
            ) : (
              connections.map(connection => (
                <div key={connection._id} className={styles.connectionCard}>
                  <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                      {connection.user.profilePicture ? (
                        <img
                          src={getProfileImageUrl(connection.user.profilePicture)}
                          alt={`${connection.user.firstName} ${connection.user.lastName}`}
                        />
                      ) : (
                        <span className="material-icons">person</span>
                      )}
                    </div>
                    <div className={styles.userDetails}>
                      <h4
                        onClick={() => navigate(`/member/${connection.user._id}`)}
                        className={styles.userName}
                      >
                        {connection.user.firstName} {connection.user.lastName}
                      </h4>
                      {connection.user.location && (
                        <p className={styles.userLocation}>
                          <span className="material-icons">location_on</span>
                          {connection.user.location.city}, {connection.user.location.state}
                        </p>
                      )}
                      <span className={styles.connectedDate}>
                        Connected {formatDate(connection.connectedAt)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.connectionActions}>
                    <button
                      className={styles.viewProfileButton}
                      onClick={() => navigate(`/member/${connection.user._id}`)}
                    >
                      <span className="material-icons">visibility</span>
                      View Profile
                    </button>
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemoveConnection(connection.user._id, connection.user.firstName)}
                      disabled={actionLoading[connection.user._id]}
                    >
                      <span className="material-icons">person_remove</span>
                      {actionLoading[connection.user._id] === 'remove' ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connection;