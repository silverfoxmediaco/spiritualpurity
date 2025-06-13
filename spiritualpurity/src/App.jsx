// App Component
// Path: src/App.jsx
// Purpose: Main application component with routing

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Header from './frontend/components/Header';
import Footer from './frontend/components/Footer';
import HowItWorks from './frontend/components/HowItWorks';
import CurrentMembers from './frontend/components/MeetSomeWallflowers';
import SignupModal from './frontend/components/SignupModal';
import LoginModal from './frontend/components/LoginModal';
import Profile from './frontend/components/profile/profile'; // Fixed: uppercase 'P'
import ProfileView from './frontend/components/profile/ProfileView';
import GardeningInterface from './frontend/components/browse/GardeningInterface';
import Garden from './frontend/components/garden/Garden';
import MockProfilesManager from './frontend/components/admin/MockProfilesManager';

// Import new pages
import TermsOfService from './frontend/pages/TermsOfService';
import PrivacyPolicy from './frontend/pages/PrivacyPolicy';
import CommunityGuidelines from './frontend/pages/CommunityGuidelines';
import SafetyTips from './frontend/pages/SafetyTips';
import PrayerGroups from './pages/PrayerGroups';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

// Landing Page component
const LandingPage = ({ onSignupClick }) => (
  <>
    <section className="hero" id="hero">
      <div className="container">
        <h2 className="hero-title">
          Dating at your own pace,<br />
          blooming in your own time
        </h2>
        <p className="hero-subtitle text-muted">
          A gentle space for introverts to make meaningful connections
        </p>
        <button 
          className="btn btn-primary" 
          onClick={onSignupClick}
        >
          Start Your Garden
        </button>
      </div>
    </section>
    
    <div id="how-it-works">
      <HowItWorks onStartPlanting={onSignupClick} />
    </div>
    
    <div id="current-members">
      <CurrentMembers onSignupClick={onSignupClick} />
    </div>
  </>
);

// Main App content that needs access to useLocation
function AppContent() {
  const location = useLocation();
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if we're on the browse page
  const isBrowsePage = location.pathname === '/browse';

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
        onSignupClick={() => setShowSignupModal(true)}
        onLoginClick={() => setShowLoginModal(true)}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <LandingPage onSignupClick={() => setShowSignupModal(true)} />
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/profile/:userId" element={
            <ProtectedRoute>
              <ProfileView />
            </ProtectedRoute>
          } />
          
          <Route path="/browse" element={
            <ProtectedRoute>
              <GardeningInterface />
            </ProtectedRoute>
          } />
          
          <Route path="/garden" element={
            <ProtectedRoute>
              <Garden />
            </ProtectedRoute>
          } />
          
          <Route path="/prayer-groups" element={
            <ProtectedRoute>
              <PrayerGroups />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/mock-profiles" element={
            <ProtectedRoute>
              <MockProfilesManager />
            </ProtectedRoute>
          } />
          
          {/* Footer Pages Routes */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/community-guidelines" element={<CommunityGuidelines />} />
          <Route path="/safety" element={<SafetyTips />} />
        </Routes>
      </main>
      
      {/* Conditionally render Footer - hide on browse page */}
      {!isBrowsePage && <Footer />}
      
      <SignupModal 
        isOpen={showSignupModal} 
        onClose={() => setShowSignupModal(false)} 
      />
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
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