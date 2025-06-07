// src/components/admin/AdminLayout.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import styles from '../../styles/admin/Admin.module.css';

const AdminLayout = ({ children, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={styles.adminLayout}>
      {/* Admin Header */}
      <header className={styles.adminHeader}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.sidebarToggle}
            onClick={toggleSidebar}
          >
            <span className="material-icons">
              {sidebarOpen ? 'menu_open' : 'menu'}
            </span>
          </button>
          <h1 className={styles.adminTitle}>
            Spiritual Purity Admin
          </h1>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {user?.firstName} {user?.lastName}
            </span>
            <span className={styles.userRole}>
              {user?.role === 'admin' ? 'Administrator' : 'Moderator'}
            </span>
          </div>
          
          <button 
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            <span className="material-icons">logout</span>
            Logout
          </button>
        </div>
      </header>

      <div className={styles.adminBody}>
        {/* Sidebar */}
        <AdminSidebar 
          isOpen={sidebarOpen} 
          userRole={user?.role}
        />

        {/* Main Content */}
        <main className={`${styles.adminContent} ${!sidebarOpen ? styles.expanded : ''}`}>
          <div className={styles.contentWrapper}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;