// src/components/ShareModal.jsx

import React, { useState, useEffect } from 'react';
import API_CONFIG from '../config/api';
import styles from '../styles/ShareModal.module.css';

const ShareModal = ({ 
  isOpen, 
  onClose, 
  shareType, // 'profile' or 'post'
  shareData, // { id, title, description, imageUrl }
  currentUser 
}) => {
  const [activeTab, setActiveTab] = useState('internal');
  const [conversations, setConversations] = useState([]);
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [shareMessage, setShareMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const shareUrl = shareType === 'profile' 
    ? `${window.location.origin}/member/${shareData.id}`
    : `${window.location.origin}/post/${shareData.id}`;

  useEffect(() => {
    if (isOpen && activeTab === 'internal') {
      fetchConversations();
    }
  }, [isOpen, activeTab]);

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
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleConversationToggle = (conversationId) => {
    setSelectedConversations(prev => 
      prev.includes(conversationId)
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleInternalShare = async () => {
    if (selectedConversations.length === 0) {
      alert('Please select at least one conversation to share with');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      for (const conversationId of selectedConversations) {
        const shareContent = shareType === 'profile'
          ? `${shareMessage}\n\nCheck out ${shareData.title}'s profile: ${shareUrl}`
          : `${shareMessage}\n\nCheck out this post: ${shareUrl}`;

        await fetch(`${API_CONFIG.BASE_URL}/api/messages/${conversationId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: shareContent,
            sharedContent: {
              type: shareType,
              id: shareData.id,
              title: shareData.title,
              description: shareData.description,
              imageUrl: shareData.imageUrl,
              url: shareUrl
            }
          }),
        });
      }

      alert(`${shareType === 'profile' ? 'Profile' : 'Post'} shared successfully!`);
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.description,
          url: shareUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProfileImageUrl = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('http')) {
      return profilePicture;
    }
    return `${API_CONFIG.BASE_URL}${profilePicture}`;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>
            <span className="material-icons">share</span>
            Share {shareType === 'profile' ? 'Profile' : 'Post'}
          </h3>
          <button onClick={onClose} className={styles.closeButton}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Share Preview */}
        <div className={styles.sharePreview}>
          <div className={styles.previewCard}>
            {shareData.imageUrl && (
              <img 
                src={shareData.imageUrl} 
                alt={shareData.title}
                className={styles.previewImage}
              />
            )}
            <div className={styles.previewContent}>
              <h4>{shareData.title}</h4>
              {shareData.description && (
                <p>{shareData.description}</p>
              )}
              <span className={styles.previewUrl}>{shareUrl}</span>
            </div>
          </div>
        </div>

        {/* Share Tabs */}
        <div className={styles.shareTabs}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'internal' ? styles.active : ''}`}
            onClick={() => setActiveTab('internal')}
          >
            <span className="material-icons">forum</span>
            Message Friends
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'external' ? styles.active : ''}`}
            onClick={() => setActiveTab('external')}
          >
            <span className="material-icons">link</span>
            Copy Link
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'internal' ? (
            <div className={styles.internalShare}>
              <div className={styles.messageInput}>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Add a message (optional)..."
                  className={styles.messageTextarea}
                  rows="3"
                />
              </div>

              <div className={styles.conversationSearch}>
                <div className={styles.searchInput}>
                  <span className="material-icons">search</span>
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.conversationsList}>
                {filteredConversations.length === 0 ? (
                  <div className={styles.noConversations}>
                    <span className="material-icons">forum</span>
                    <p>No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation._id}
                      className={`${styles.conversationItem} ${
                        selectedConversations.includes(conversation._id) ? styles.selected : ''
                      }`}
                      onClick={() => handleConversationToggle(conversation._id)}
                    >
                      <div className={styles.conversationAvatar}>
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
                        <span className={styles.participantName}>
                          {conversation.participant?.name || 'Unknown User'}
                        </span>
                        {conversation.lastMessage && (
                          <span className={styles.lastMessage}>
                            {conversation.lastMessage.content?.substring(0, 30)}...
                          </span>
                        )}
                      </div>
                      <div className={styles.selectionIndicator}>
                        {selectedConversations.includes(conversation._id) && (
                          <span className="material-icons">check_circle</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.shareActions}>
                <button 
                  onClick={handleInternalShare}
                  disabled={loading || selectedConversations.length === 0}
                  className={styles.shareButton}
                >
                  {loading ? (
                    <>
                      <div className={styles.loadingSpinner}></div>
                      Sharing...
                    </>
                  ) : (
                    <>
                      <span className="material-icons">send</span>
                      Share with {selectedConversations.length} friend{selectedConversations.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.externalShare}>
              <div className={styles.linkSection}>
                <div className={styles.linkDisplay}>
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className={styles.linkInput}
                  />
                  <button 
                    onClick={handleCopyLink}
                    className={`${styles.copyButton} ${linkCopied ? styles.copied : ''}`}
                  >
                    <span className="material-icons">
                      {linkCopied ? 'check' : 'content_copy'}
                    </span>
                    {linkCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className={styles.shareOptions}>
                <h4>Share via:</h4>
                <div className={styles.shareButtons}>
                  <button 
                    onClick={handleNativeShare}
                    className={styles.nativeShareButton}
                  >
                    <span className="material-icons">share</span>
                    {navigator.share ? 'Share' : 'Copy Link'}
                  </button>
                  
                  <a
                    href={`sms:?body=Check this out: ${shareUrl}`}
                    className={styles.smsShareButton}
                  >
                    <span className="material-icons">textsms</span>
                    Text Message
                  </a>
                  
                  <a
                    href={`mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(`Check this out: ${shareUrl}`)}`}
                    className={styles.emailShareButton}
                  >
                    <span className="material-icons">email</span>
                    Email
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;