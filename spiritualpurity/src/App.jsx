// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MemberProfile from './pages/MemberProfile';
import PublicMemberProfile from './pages/PublicMemberProfile';
import AllMembers from './pages/AllMembers';
import Community from './pages/Community';
import Prayer from './pages/Prayer';
import Resources from './pages/Resources';
import PostView from './pages/PostView';
import AdvertiserDashboard from './pages/AdvertiserDashboard';
import AdvertiserRegistration from './pages/AdvertiserRegistration';

// Admin imports
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminContent from './pages/admin/AdminContent';
import AdminPrayers from './pages/admin/AdminPrayers';
import AdminRoute from './components/admin/AdminRoute';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<MemberProfile />} />
          <Route path="/members" element={<AllMembers />} />
          <Route path="/community" element={<Community />} />
          <Route path="/prayer" element={<Prayer />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/member/:id" element={<PublicMemberProfile />} />
          <Route path="/post/:id" element={<PostView />} />
          
          {/* Advertiser Routes */}
          <Route path="/advertiser/register" element={<AdvertiserRegistration />} />
          <Route path="/advertiser/dashboard" element={<AdvertiserDashboard />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={
            <AdminRoute>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="prayers" element={<AdminPrayers />} />
              </Routes>
            </AdminRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;