// src/components/auth/LoginModal.jsx

import React, { useState } from 'react';
import styles from '../../styles/LoginModal.module.css';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Call success callback
        onLoginSuccess(data.data.user);
        
        // Close modal and reset form
        onClose();
        resetForm();
        
        // Optional: Show success message
        alert(`Welcome back, ${data.data.user.firstName}!`);
        
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Call success callback
        onLoginSuccess(data.data.user);
        
        // Close modal and reset form
        onClose();
        resetForm();
        
        // Show welcome message
        alert(`Welcome to Spiritual Purity, ${data.data.user.firstName}!`);
        
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

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      confirmPassword: ''
    });
    setError('');
    setIsLogin(true);
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: ''
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{isLogin ? 'Welcome Back' : 'Join Our Community'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
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

          <form onSubmit={isLogin ? handleLogin : handleRegister}>
            {!isLogin && (
              <div className={styles.nameFields}>
                <div className={styles.formGroup}>
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required={!isLogin}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required={!isLogin}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email address"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your password"
              />
            </div>

            {!isLogin && (
              <div className={styles.formGroup}>
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!isLogin}
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  <span className="material-icons">
                    {isLogin ? 'login' : 'person_add'}
                  </span>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          <div className={styles.switchMode}>
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button" 
                className={styles.switchButton}
                onClick={switchMode}
              >
                {isLogin ? 'Join Us' : 'Sign In'}
              </button>
            </p>
          </div>

          {isLogin && (
            <div className={styles.forgotPassword}>
              <button type="button" className={styles.forgotButton}>
                Forgot your password?
              </button>
            </div>
          )}
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