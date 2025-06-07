// src/components/ShareButton.jsx

import React, { useState } from 'react';
import ShareModal from './ShareModal';
import styles from '../styles/ShareButton.module.css';

const ShareButton = ({ 
  shareType, // 'profile' or 'post'
  shareData, // { id, title, description, imageUrl }
  currentUser,
  buttonStyle = 'icon', // 'icon', 'button', or 'text'
  className = '',
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareModal(true);
  };

  const renderButton = () => {
    const baseClasses = `${styles.shareButton} ${styles[buttonStyle]} ${styles[size]} ${className}`;
    
    switch (buttonStyle) {
      case 'icon':
        return (
          <button 
            onClick={handleShare} 
            className={baseClasses}
            title={`Share ${shareType}`}
          >
            <span className="material-icons">share</span>
          </button>
        );
      
      case 'button':
        return (
          <button onClick={handleShare} className={baseClasses}>
            <span className="material-icons">share</span>
            Share
          </button>
        );
      
      case 'text':
        return (
          <button onClick={handleShare} className={baseClasses}>
            <span className="material-icons">share</span>
            Share {shareType === 'profile' ? 'Profile' : 'Post'}
          </button>
        );
      
      default:
        return (
          <button onClick={handleShare} className={baseClasses}>
            <span className="material-icons">share</span>
          </button>
        );
    }
  };

  return (
    <>
      {renderButton()}
      
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareType={shareType}
        shareData={shareData}
        currentUser={currentUser}
      />
    </>
  );
};

export default ShareButton;