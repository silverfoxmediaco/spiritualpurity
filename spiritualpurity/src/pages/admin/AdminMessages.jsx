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
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
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
  }, [activeTab, searchTerm, page]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        status: activeTab,
        search: searchTerm,
        page: page,
        limit: 50
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/conversations?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.data.conversations);
        
        // Calculate stats from conversations
        const totalConversations = data.data.pagination.total;
        const activeConversations = data.data.conversations.filter(c => c.status === 'active').length;
        const reportedMessages = data.data.conversations.reduce((sum, c) => sum + c.reportCount, 0);
        
        setStats(prev => ({
          ...prev,
          totalConversations,
          activeConversations,
          reportedMessages
        }));
      }

    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    setMessagesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/messages/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data.messages);
      }

    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Admin deletion' }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Message deleted!');
        setMessages(messages.filter(m => m._id !== messageId));
      } else {
        alert(data.message || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const handleBlockConversation = async (conversationId) => {
    if (!window.confirm('Are you sure you want to block this conversation? Both users will be unable to message each other.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/conversations/${conversationId}/block`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Admin blocked' }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Conversation blocked!');
        setSelectedConversation(null);
        fetchConversations();
      } else {
        alert(data.message || 'Failed to block conversation');
      }
    } catch (error) {
      console.error('Error blocking conversation:', error);
      alert('Failed to block conversation');
    }
  };

  const handleArchiveConversation = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      // Since archive isn't implemented in backend, we'll use the block endpoint
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/conversations/${conversationId}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        alert('Conversation archived!');
        fetchConversations();
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
      alert('Archive functionality not yet implemented');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
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

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return conv.participants.some(p => 
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchLower) ||
      p.email.toLowerCase().includes(searchLower)
    );
  });

  // Filter by tab status
  const tabFilteredConversations = filteredConversations.filter(conv => {
    switch(activeTab) {
      case 'active':
        return conv.status === 'active';
      case 'reported':
        return conv.hasReportedMessages;
      case 'archived':
        return conv.status === 'inactive';
      default:
        return true;
    }
  });

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
            ) : tabFilteredConversations.length === 0 ? (
              <div className={styles.emptyState}>
                <span className="material-icons">chat_bubble_outline</span>
                <p>No conversations found</p>
              </div>
            ) : (
              tabFilteredConversations.map((conversation) => (
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
                    <p>{conversation.lastMessage?.content || 'No messages'}</p>
                    <div className={styles.conversationMeta}>
                      <span>{formatDate(conversation.lastActivity)}</span>
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
                {messagesLoading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No messages to display</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message._id}
                      className={`${styles.messageItem} ${message.reported?.isReported ? styles.reported : ''}`}
                    >
                      <div className={styles.messageHeader}>
                        <strong>{message.sender.firstName} {message.sender.lastName}</strong>
                        <span>{formatDate(message.createdAt)}</span>
                      </div>
                      <div className={styles.messageBody}>
                        <p>{message.content}</p>
                        {message.messageType && message.messageType !== 'text' && (
                          <span className={styles.messageType}>
                            <span className="material-icons">
                              {message.messageType === 'prayer' ? 'volunteer_activism' : 
                               message.messageType === 'verse' ? 'menu_book' : 
                               message.messageType === 'encouragement' ? 'favorite' : 
                               'chat'}
                            </span>
                            {message.messageType}
                          </span>
                        )}
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