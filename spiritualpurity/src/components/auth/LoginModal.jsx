// src/components/auth/LoginModal.jsx

import React, { useState } from 'react';
import API_CONFIG from '../../config/api'; // Import the API config
import styles from '../../styles/LoginModal.module.css';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Registration form state
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use API_CONFIG instead of hardcoded localhost
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Call success callback
        onLoginSuccess(data.data.user);
        onClose();
        
        // Optionally reload page to update all components
        window.location.reload();
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use API_CONFIG instead of hardcoded localhost
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Switch to login mode and show success
        setIsLogin(true);
        setError('');
        alert('Registration successful! You are now logged in.');
        
        // Call success callback
        onLoginSuccess(data.data.user);
        onClose();
        
        // Optionally reload page to update all components
        window.location.reload();
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    
    if (formType === 'login') {
      setLoginData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setRegisterData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setLoginData({ email: '', password: '' });
    setRegisterData({ firstName: '', lastName: '', email: '', password: '' });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{isLogin ? 'Welcome Back' : 'Join Our Community'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className={styles.modalBody}>
          {error && (
            <div className={styles.errorMessage}>
              <span className="material-icons">error</span>
              {error}
            </div>
          )}

          {isLogin ? (
            // Login Form
            <form onSubmit={handleLoginSubmit}>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={(e) => handleInputChange(e, 'login')}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={(e) => handleInputChange(e, 'login')}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    <span className="material-icons">login</span>
                    Sign In
                  </>
                )}
              </button>
            </form>
          ) : (
            // Registration Form
            <form onSubmit={handleRegisterSubmit}>
              <div className={styles.nameFields}>
                <div className={styles.formGroup}>
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={registerData.firstName}
                    onChange={(e) => handleInputChange(e, 'register')}
                    placeholder="First name"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={registerData.lastName}
                    onChange={(e) => handleInputChange(e, 'register')}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={(e) => handleInputChange(e, 'register')}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={(e) => handleInputChange(e, 'register')}
                  placeholder="Create a password"
                  required
                  minLength="6"
                />
              </div>

              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <span className="material-icons">person_add</span>
                    Join Us
                  </>
                )}
              </button>
            </form>
          )}

          <div className={styles.switchMode}>
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button onClick={switchMode} className={styles.switchButton}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          <div className={styles.forgotPassword}>
            <button className={styles.forgotButton}>
              Forgot your password?
            </button>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <p className={styles.communityMessage}>
            <span className="material-icons">favorite</span>
            Join our faith community and grow together in Christ
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;