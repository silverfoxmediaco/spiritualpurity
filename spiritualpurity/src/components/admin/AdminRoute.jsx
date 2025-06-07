// src/components/admin/AdminRoute.jsx

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import styles from '../../styles/admin/Admin.module.css';

const AdminRoute = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      
      // Check if user has admin or moderator role
      if (parsedUser.role === 'admin' || parsedUser.role === 'moderator') {
        setUser(parsedUser);
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      setIsAuthorized(false);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Verifying admin access...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <AdminLayout user={user}>
      {children}
    </AdminLayout>
  );
};

export default AdminRoute;