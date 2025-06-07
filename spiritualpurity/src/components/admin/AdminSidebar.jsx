// src/components/admin/AdminSidebar.jsx

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from '../../styles/admin/Admin.module.css';

const AdminSidebar = ({ isOpen, userRole }) => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/admin/dashboard',
      icon: 'dashboard',
      label: 'Dashboard',
      roles: ['admin', 'moderator']
    },
    {
      path: '/admin/users',
      icon: 'people',
      label: 'Users',
      roles: ['admin']
    },
    {
      path: '/admin/content',
      icon: 'article',
      label: 'Content',
      roles: ['admin', 'moderator']
    },
    {
      path: '/admin/prayers',
      icon: 'volunteer_activism',
      label: 'Prayer Requests',
      roles: ['admin', 'moderator']
    },
    {
      path: '/admin/reports',
      icon: 'flag',
      label: 'Reports',
      roles: ['admin', 'moderator']
    },
    {
      path: '/admin/messages',
      icon: 'message',
      label: 'Messages',
      roles: ['admin']
    },
    {
      path: '/admin/analytics',
      icon: 'analytics',
      label: 'Analytics',
      roles: ['admin']
    },
    {
      path: '/admin/settings',
      icon: 'settings',
      label: 'Settings',
      roles: ['admin']
    }
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <aside className={`${styles.adminSidebar} ${!isOpen ? styles.closed : ''}`}>
      <nav className={styles.sidebarNav}>
        <div className={styles.navSection}>
          <h3 className={styles.navSectionTitle}>Main Menu</h3>
          
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <span className="material-icons">{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className={styles.navSection}>
          <h3 className={styles.navSectionTitle}>Quick Links</h3>
          
          <NavLink
            to="/"
            className={styles.navItem}
            target="_blank"
          >
            <span className="material-icons">launch</span>
            <span className={styles.navLabel}>View Site</span>
          </NavLink>
          
          <NavLink
            to="/profile"
            className={styles.navItem}
          >
            <span className="material-icons">account_circle</span>
            <span className={styles.navLabel}>My Profile</span>
          </NavLink>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className={styles.sidebarFooter}>
        <div className={styles.sidebarInfo}>
          <span className="material-icons">info</span>
          <span className={styles.navLabel}>
            Admin Panel v1.0
          </span>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;