// src/pages/admin/AdminUsers.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserTable from '../../components/admin/UserTable';
import API_CONFIG from '../../config/api';
import styles from '../../styles/admin/Admin.module.css';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const itemsPerPage = 20;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, filterRole, filterStatus]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        role: filterRole,
        status: filterStatus
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.pages);
        setTotalUsers(data.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setUsers(users.map(user => 
          user._id === userId ? { ...user, isActive: newStatus } : user
        ));
        alert(data.message);
      } else {
        alert(data.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setUsers(users.map(user => 
          user._id === userId ? { ...user, role: newRole } : user
        ));
        alert(data.message);
      } else {
        alert(data.message || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  const exportUsers = () => {
    // TODO: Implement CSV export
    alert('Export functionality coming soon!');
  };

  return (
    <div className={styles.adminPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>User Management</h1>
          <p>Manage all registered users and their permissions</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.exportButton}
            onClick={exportUsers}
          >
            <span className="material-icons">download</span>
            Export CSV
          </button>
          <button 
            className={styles.primaryButton}
            onClick={() => navigate('/admin/users/invite')}
          >
            <span className="material-icons">person_add</span>
            Invite User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBar}>
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className={styles.filters}>
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.filterSelect}
          >
            <option value="">All Roles</option>
            <option value="member">Members</option>
            <option value="moderator">Moderators</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.filterSelect}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button 
            className={styles.clearButton}
            onClick={() => {
              setSearchTerm('');
              setFilterRole('');
              setFilterStatus('');
              setCurrentPage(1);
            }}
          >
            <span className="material-icons">clear</span>
            Clear Filters
          </button>
        </div>

        <div className={styles.resultsInfo}>
          Showing {users.length} of {totalUsers} users
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.tableSection}>
        <UserTable
          users={users}
          loading={loading}
          onStatusChange={handleStatusChange}
          onRoleChange={handleRoleChange}
          currentUserId={currentUser._id}
        />
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <span className="material-icons">chevron_left</span>
            Previous
          </button>

          <div className={styles.paginationInfo}>
            Page {currentPage} of {totalPages}
          </div>

          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;