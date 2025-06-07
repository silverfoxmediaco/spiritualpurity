// src/pages/admin/AdminLogin.jsx

import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import API_CONFIG from '../../config/api';
import styles from '../../styles/admin/AdminLogin.module.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if already logged in as admin
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role === 'admin' || user.role === 'moderator') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.adminLoginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          {/* Logo/Header */}
          <div className={styles.loginHeader}>
            <div className={styles.logo}>
              <span className="material-icons">admin_panel_settings</span>
            </div>
            <h1>Admin Portal</h1>
            <p>Spiritual Purity Administration</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={styles.loginForm}>
            {error && (
              <div className={styles.errorAlert}>
                <span className="material-icons">error</span>
                {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <div className={styles.inputWrapper}>
                <span className="material-icons">email</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@spiritualpurity.org"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.inputWrapper}>
                <span className="material-icons">lock</span>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.loginButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className={styles.buttonSpinner}></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <span className="material-icons">login</span>
                  Sign In to Admin
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className={styles.loginFooter}>
            <a href="/" className={styles.footerLink}>
              <span className="material-icons">arrow_back</span>
              Back to Main Site
            </a>
            <span className={styles.divider}>•</span>
            <a href="/profile" className={styles.footerLink}>
              Regular Login
            </a>
          </div>
        </div>

        {/* Security Notice */}
        <div className={styles.securityNotice}>
          <span className="material-icons">security</span>
          <p>
            This is a secure area. Unauthorized access attempts are logged and monitored.
            Admin and Moderator access only.
          </p>
        </div>
      </div>

      {/* Background Pattern */}
      <div className={styles.backgroundPattern}></div>
    </div>
  );
};

export default AdminLogin;