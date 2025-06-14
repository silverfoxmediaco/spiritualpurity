// App Component
// Path: src/App.jsx
// Purpose: Main application component with routing

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';

// Import pages - ONLY from Spiritual Purity project
import MemberProfile from './pages/MemberProfile';
import PublicMemberProfile from './pages/PublicMemberProfile';
import PostView from './pages/PostView';
import Prayer from './pages/Prayer';
import PrayerGroups from './pages/PrayerGroups';
import Community from './pages/Community';
import Connection from './pages/Connection';
import AdminPrayers from './pages/AdminPrayers';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

// Landing Page component for Spiritual Purity
const LandingPage = () => (
  <section className="hero" id="hero">
    <div className="container">
      <h1 className="hero-title">
        Welcome to Spiritual Purity
      </h1>
      <p className="hero-subtitle text-muted">
        A faith-based community for believers to connect, share testimonies, and grow together in Christ
      </p>
      <div className="hero-actions">
        <a href="/community" className="btn btn-primary">
          Join Our Community
        </a>
        <a href="/prayer" className="btn btn-secondary">
          Prayer Wall
        </a>
      </div>
    </div>
  </section>
);

// Main App content
function AppContent() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <div className="App">
      <Header 
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <MemberProfile />
            </ProtectedRoute>
          } />
          
          <Route path="/member/:id" element={
            <ProtectedRoute>
              <PublicMemberProfile />
            </ProtectedRoute>
          } />
          
          <Route path="/community" element={
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          } />
          
          <Route path="/prayer" element={
            <ProtectedRoute>
              <Prayer />
            </ProtectedRoute>
          } />
          
          <Route path="/prayer-groups" element={
            <ProtectedRoute>
              <PrayerGroups />
            </ProtectedRoute>
          } />
          
          <Route path="/post/:id" element={
            <ProtectedRoute>
              <PostView />
            </ProtectedRoute>
          } />
          
          <Route path="/connections" element={
            <ProtectedRoute>
              <Connection />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/prayers" element={
            <ProtectedRoute>
              <AdminPrayers />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
}

// Main App wrapper
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;