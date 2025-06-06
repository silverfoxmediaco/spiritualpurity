// src/components/ProfileMessages.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from '../config/api';
import styles from '../styles/ProfileMessages.module.css';

const ProfileMessages = ({ currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setConversations(data.data.conversations || []);
        // Auto-select first conversation if available
        if (data.data.conversations?.length > 0 && !selectedConversation) {
          setSelectedConversation(data.data.conversations[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/messages/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setMessages(data.data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/messages/${selectedConversation._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim()
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, data.data.message]);
        setNewMessage('');
        messageInputRef.current?.focus();
        
        // Refresh conversations to update last message
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
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
      <div className={styles.profileSection}>
        <h3>
          <span className="material-icons">forum</span>
          Messages
        </h3>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileSection}>
      <div className={styles.sectionHeader}>
        <h3>
          <span className="material-icons">forum</span>
          Messages
          {getTotalUnreadCount() > 0 && (
            <span className={styles.unreadBadge}>{getTotalUnreadCount()}</span>
          )}
        </h3>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.expandButton}
        >
          <span className="material-icons">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {isExpanded && (
        <div className={styles.messagesContainer}>
          {conversations.length === 0 ? (
            <div className={styles.noConversations}>
              <span className="material-icons">forum</span>
              <p>No conversations yet</p>
              <button 
                onClick={() => navigate('/members')}
                className={styles.startChatButton}
              >
                Find members to message
              </button>
            </div>
          ) : (
            <>
              {/* Conversations List */}
              <div className={styles.conversationsList}>
                {conversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    className={`${styles.conversationItem} ${
                      selectedConversation?._id === conversation._id ? styles.active : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className={styles.participantAvatar}>
                      {conversation.participant?.profilePicture ? (
                        <img 
                          src={getProfileImageUrl(conversation.participant.profilePicture)}
                          alt={conversation.participant?.name || 'User'}
                        />
                      ) : (
                        <span className="material-icons">person</span>
                      )}
                    </div>
                    
                    <div className={styles.conversationInfo}>
                      <div className={styles.participantName}>
                        {conversation.participant?.name || 'Unknown User'}
                      </div>
                      {conversation.lastMessage && (
                        <div className={styles.lastMessage}>
                          {(conversation.lastMessage.content || '').substring(0, 30)}
                          {(conversation.lastMessage.content || '').length > 30 ? '...' : ''}
                        </div>
                      )}
                    </div>
                    
                    {conversation.unreadCount > 0 && (
                      <div className={styles.unreadIndicator}>
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Selected Conversation */}
              {selectedConversation && (
                <div className={styles.chatArea}>
                  <div className={styles.chatHeader}>
                    <div className={styles.participantInfo}>
                      <div className={styles.participantAvatar}>
                        {selectedConversation.participant?.profilePicture ? (
                          <img 
                            src={getProfileImageUrl(selectedConversation.participant.profilePicture)}
                            alt={selectedConversation.participant?.name || 'User'}
                          />
                        ) : (
                          <span className="material-icons">person</span>
                        )}
                      </div>
                      <span>{selectedConversation.participant?.name || 'Unknown User'}</span>
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/member/${selectedConversation.participant?._id}`)}
                      className={styles.viewProfileButton}
                    >
                      <span className="material-icons">person</span>
                    </button>
                  </div>

                  <div className={styles.messagesList}>
                    {messages.map((message) => (
                      <div
                        key={message._id}
                        className={`${styles.messageItem} ${
                          message.sender?._id === currentUser?._id ? styles.sent : styles.received
                        }`}
                      >
                        <div className={styles.messageContent}>
                          <p>{message.content || ''}</p>
                          {message.verseReference && (
                            <div className={styles.verseReference}>
                              <span className="material-icons">menu_book</span>
                              {message.verseReference}
                            </div>
                          )}
                        </div>
                        <div className={styles.messageTime}>
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={sendMessage} className={styles.messageForm}>
                    <div className={styles.messageInputWrapper}>
                      <input
                        ref={messageInputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={sendingMessage}
                        className={styles.messageInput}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        className={styles.sendButton}
                      >
                        {sendingMessage ? (
                          <div className={styles.sendingSpinner}></div>
                        ) : (
                          <span className="material-icons">send</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Compact View */}
      {!isExpanded && conversations.length > 0 && (
        <div className={styles.compactView}>
          <div className={styles.recentConversations}>
            {conversations.slice(0, 3).map((conversation) => (
              <div
                key={conversation._id}
                className={styles.compactConversationItem}
                onClick={() => {
                  setSelectedConversation(conversation);
                  setIsExpanded(true);
                }}
              >
                <div className={styles.participantAvatar}>
                  {conversation.participant?.profilePicture ? (
                    <img 
                      src={getProfileImageUrl(conversation.participant.profilePicture)}
                      alt={conversation.participant?.name || 'User'}
                    />
                  ) : (
                    <span className="material-icons">person</span>
                  )}
                  {conversation.unreadCount > 0 && (
                    <div className={styles.unreadDot}></div>
                  )}
                </div>
                <div className={styles.compactInfo}>
                  <div className={styles.participantName}>
                    {conversation.participant?.name || 'Unknown User'}
                  </div>
                  {conversation.lastMessage && (
                    <div className={styles.lastMessage}>
                      {(conversation.lastMessage.content || '').substring(0, 25)}...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMessages;