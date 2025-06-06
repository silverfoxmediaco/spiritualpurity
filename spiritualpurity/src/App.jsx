// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MemberProfile from './pages/MemberProfile';
import PublicMemberProfile from './pages/PublicMemberProfile';
import AllMembers from './pages/AllMembers';
import Community from './pages/Community';
import Prayer from './pages/Prayer';
import Resources from './pages/Resources';
import AdvertiserDashboard from './pages/AdvertiserDashboard';
import AdvertiserRegistration from './pages/AdvertiserRegistration';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<MemberProfile />} />
          <Route path="/members" element={<AllMembers />} />
          <Route path="/community" element={<Community />} />
          <Route path="/prayer" element={<Prayer />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/member/:id" element={<PublicMemberProfile />} />
          <Route path="/advertiser/register" element={<AdvertiserRegistration />} />
          <Route path="/advertiser/dashboard" element={<AdvertiserDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;