// src/components/Header.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RegistrationModal from './auth/RegistrationModal';
import LoginModal from './auth/LoginModal';
import styles from '../styles/Header.module.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const navigate = useNavigate();

  // Check if user is logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const openRegistrationModal = () => {
    setIsRegistrationModalOpen(true);
    closeMenu(); // Close mobile menu if open
  };

  const closeRegistrationModal = () => {
    setIsRegistrationModalOpen(false);
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    closeMenu(); // Close mobile menu if open
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    // Optionally refresh the page or update state in parent components
    window.location.reload(); // Simple way to refresh all components
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
    closeMenu();
    // Optionally refresh to clear all user-specific data
    window.location.reload();
  };

  const handleProfileClick = () => {
    navigate('/profile');
    closeMenu();
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.logo}>
            <Link to="/">
              <img src="/splogoorangv2.png" alt="Spiritual Purity Logo" className={styles.logoImage} />
            </Link>
          </div>
          
          <nav className={styles.navigation}>
            <ul className={styles.navLinks}>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/community">Community</Link></li>
              <li><Link to="/prayer">Prayer</Link></li>
              <li><Link to="/resources">Resources</Link></li>
              <li><Link to="/about">About</Link></li>
            </ul>
          </nav>
          
          <div className={styles.authButtons}>
            {isLoggedIn ? (
              <>
                <button className={styles.btnProfile} onClick={handleProfileClick}>
                  <span className="material-icons">person</span>
                  {user?.firstName || 'Profile'}
                </button>
                <button className={styles.btnLogout} onClick={handleLogout}>
                  <span className="material-icons">logout</span>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className={styles.btnLogin} onClick={openLoginModal}>
                  Sign In
                </button>
                <button className={styles.btnSignup} onClick={openRegistrationModal}>
                  Join Us
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            className={styles.hamburger} 
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className="material-icons">menu</span>
          </button>
        </div>

        {/* Mobile Slide-out Menu */}
        <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}>
          <div className={styles.mobileMenuContent}>
            <button className={styles.closeButton} onClick={closeMenu}>
              <span className="material-icons">close</span>
            </button>
            
            <nav className={styles.mobileNavigation}>
              <ul className={styles.mobileNavLinks}>
                <li><Link to="/" onClick={closeMenu}>Home</Link></li>
                <li><Link to="/community" onClick={closeMenu}>Community</Link></li>
                <li><Link to="/prayer" onClick={closeMenu}>Prayer</Link></li>
                <li><Link to="/resources" onClick={closeMenu}>Resources</Link></li>
                <li><Link to="/about" onClick={closeMenu}>About</Link></li>
              </ul>
            </nav>
            
            <div className={styles.mobileAuthButtons}>
              {isLoggedIn ? (
                <>
                  <button className={styles.btnProfile} onClick={handleProfileClick}>
                    <span className="material-icons">person</span>
                    My Profile
                  </button>
                  <button className={styles.btnLogout} onClick={handleLogout}>
                    <span className="material-icons">logout</span>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button className={styles.btnLogin} onClick={openLoginModal}>
                    Sign In
                  </button>
                  <button className={styles.btnSignup} onClick={openRegistrationModal}>
                    Join Us
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overlay */}
        {isMenuOpen && (
          <div className={styles.overlay} onClick={closeMenu}></div>
        )}
      </header>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={closeLoginModal}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Registration Modal */}
      <RegistrationModal 
        isOpen={isRegistrationModalOpen} 
        onClose={closeRegistrationModal} 
      />
    </>
  );
};

export default Header;