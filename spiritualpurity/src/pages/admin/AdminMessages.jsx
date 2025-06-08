// src/pages/admin/AdminMessages.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from '../../config/api';
import styles from '../../styles/admin/Admin.module.css';

const AdminMessages = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState({
    totalConversations: 0,
    activeConversations: 0,
    reportedMessages: 0,
    flaggedUsers: 0,
    messagesThisWeek: 0,
    averageResponseTime: '0 hours'
  });

  useEffect(() => {
    fetchConversations();
    fetchMessageStats();
  }, [activeTab, filterStatus]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call when endpoint is ready
      // const token = localStorage.getItem('token');
      // const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/conversations`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      // const data = await response.json();
      // if (data.success) {
      //   setConversations(data.data.conversations);
      // }

      // For now, set empty array
      setConversations([]);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      // TODO: Replace with actual API call when endpoint is ready
      // const token = localStorage.getItem('token');
      // const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/messages/${conversationId}`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      // const data = await response.json();
      // if (data.success) {
      //   setMessages(data.data.messages);
      // }

      // For now, set empty array
      setMessages([]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchMessageStats = async () => {
    try {
      // TODO: Replace with actual API call when endpoint is ready
      setStats({
        totalConversations: 0,
        activeConversations: 0,
        reportedMessages: 0,
        flaggedUsers: 0,
        messagesThisWeek: 0,
        averageResponseTime: '0 hours'
      });
    } catch (error) {
      console.error('Error fetching message stats:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      // API call to delete message
      alert('Message deleted!');
      setMessages(messages.filter(m => m._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleBlockConversation = async (conversationId) => {
    if (!window.confirm('Are you sure you want to block this conversation? Both users will be unable to message each other.')) {
      return;
    }

    try {
      // API call to block conversation
      alert('Conversation blocked!');
      fetchConversations();
    } catch (error) {
      console.error('Error blocking conversation:', error);
    }
  };

  const handleArchiveConversation = async (conversationId) => {
    try {
      // API call to archive conversation
      alert('Conversation archived!');
      fetchConversations();
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    }
  };

  return (
    <div className={styles.adminPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Message Monitoring</h1>
          <p>Monitor and moderate private messages between members</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.exportButton}
            onClick={() => alert('Export functionality coming soon!')}
          >
            <span className="material-icons">download</span>
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#3b82f6' }}>
            <span className="material-icons">forum</span>
          </div>
          <div className={styles.statContent}>
            <h3>Total Conversations</h3>
            <p className={styles.statValue}>{stats.totalConversations}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#10b981' }}>
            <span className="material-icons">chat</span>
          </div>
          <div className={styles.statContent}>
            <h3>Active Chats</h3>
            <p className={styles.statValue}>{stats.activeConversations}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#ef4444' }}>
            <span className="material-icons">flag</span>
          </div>
          <div className={styles.statContent}>
            <h3>Reported Messages</h3>
            <p className={styles.statValue}>{stats.reportedMessages}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#f59e0b' }}>
            <span className="material-icons">schedule</span>
          </div>
          <div className={styles.statContent}>
            <h3>Avg Response Time</h3>
            <p className={styles.statValue}>{stats.averageResponseTime}</p>
          </div>
        </div>
      </div>

      {/* Messages Section */}
      <div className={styles.messagesSection}>
        {/* Conversations List */}
        <div className={styles.conversationsList}>
          <div className={styles.conversationsHeader}>
            <div className={styles.searchBar}>
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'active' ? styles.active : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Active
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'reported' ? styles.active : ''}`}
                onClick={() => setActiveTab('reported')}
              >
                Reported
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'archived' ? styles.active : ''}`}
                onClick={() => setActiveTab('archived')}
              >
                Archived
              </button>
            </div>
          </div>

          <div className={styles.conversationsListContent}>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className={styles.emptyState}>
                <span className="material-icons">chat_bubble_outline</span>
                <p>No conversations found</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`${styles.conversationItem} ${
                    selectedConversation?._id === conversation._id ? styles.active : ''
                  } ${conversation.hasReportedMessages ? styles.reported : ''}`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className={styles.conversationParticipants}>
                    {conversation.participants.map((participant, idx) => (
                      <span key={participant._id}>
                        {participant.firstName} {participant.lastName}
                        {idx < conversation.participants.length - 1 && ' & '}
                      </span>
                    ))}
                  </div>
                  
                  <div className={styles.conversationPreview}>
                    <p>{conversation.lastMessage.content}</p>
                    <div className={styles.conversationMeta}>
                      <span>{formatDate(conversation.lastMessage.createdAt)}</span>
                      <span>{conversation.messageCount} messages</span>
                      {conversation.hasReportedMessages && (
                        <span className={styles.reportBadge}>
                          <span className="material-icons">flag</span>
                          {conversation.reportCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages View */}
        <div className={styles.messagesView}>
          {selectedConversation ? (
            <>
              <div className={styles.messagesHeader}>
                <div className={styles.conversationInfo}>
                  <h3>
                    {selectedConversation.participants.map((p, idx) => (
                      <span key={p._id}>
                        {p.firstName} {p.lastName}
                        {idx < selectedConversation.participants.length - 1 && ' & '}
                      </span>
                    ))}
                  </h3>
                  <p>Started {formatDate(selectedConversation.createdAt)}</p>
                </div>
                
                <div className={styles.conversationActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleArchiveConversation(selectedConversation._id)}
                    title="Archive Conversation"
                  >
                    <span className="material-icons">archive</span>
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.danger}`}
                    onClick={() => handleBlockConversation(selectedConversation._id)}
                    title="Block Conversation"
                  >
                    <span className="material-icons">block</span>
                  </button>
                </div>
              </div>

              <div className={styles.messagesContent}>
                {messages.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No messages to display</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message._id}
                      className={`${styles.messageItem} ${message.isReported ? styles.reported : ''}`}
                    >
                      <div className={styles.messageHeader}>
                        <strong>{message.sender.firstName} {message.sender.lastName}</strong>
                        <span>{formatDate(message.createdAt)}</span>
                      </div>
                      <div className={styles.messageBody}>
                        <p>{message.content}</p>
                      </div>
                      <div className={styles.messageActions}>
                        <button
                          className={styles.messageActionButton}
                          onClick={() => navigate(`/member/${message.sender._id}`)}
                          title="View User"
                        >
                          <span className="material-icons">person</span>
                        </button>
                        <button
                          className={`${styles.messageActionButton} ${styles.danger}`}
                          onClick={() => handleDeleteMessage(message._id)}
                          title="Delete Message"
                        >
                          <span className="material-icons">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.conversationFooter}>
                <div className={styles.participantsList}>
                  <h4>Participants:</h4>
                  {selectedConversation.participants.map((participant) => (
                    <div key={participant._id} className={styles.participant}>
                      <div className={styles.participantInfo}>
                        <div className={styles.participantAvatar}>
                          {participant.profilePicture ? (
                            <img src={participant.profilePicture} alt="" />
                          ) : (
                            <span className="material-icons">person</span>
                          )}
                        </div>
                        <div>
                          <p>{participant.firstName} {participant.lastName}</p>
                          <span>{participant.email}</span>
                        </div>
                      </div>
                      <button
                        className={styles.viewProfileButton}
                        onClick={() => navigate(`/member/${participant._id}`)}
                      >
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className={styles.noConversationSelected}>
              <span className="material-icons">chat</span>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the list to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;