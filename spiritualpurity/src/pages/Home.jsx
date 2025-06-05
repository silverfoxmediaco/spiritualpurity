// src/pages/Home.jsx

import React, { useState } from 'react';
import Header from '../components/Header';
import NewestMembers from '../components/NewestMembers';
import Footer from '../components/Footer';
import RegistrationModal from '../components/auth/RegistrationModal';
import styles from '../styles/Home.module.css';

const Home = () => {
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  const openRegistrationModal = () => {
    setIsRegistrationModalOpen(true);
  };

  const closeRegistrationModal = () => {
    setIsRegistrationModalOpen(false);
  };

  return (
    <div className={styles.homePage}>
      <Header />
      
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h1 className={styles.heroTitle}>Welcome to Spiritual Purity</h1>
              <p className={styles.heroSubtitle}>
              We are not a place of Purity but a place to walk in faith with others—to share your story and how you have healed in the transforming grace of God.
              </p>
              <div className={styles.heroButtons}>
                <button 
                  className="btn btn-primary btn-lg me-3"
                  onClick={openRegistrationModal}
                >
                  Join Today
                </button>
                <p style={{ marginTop: '10px' }}>It's Free and always will be.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newest Members Section */}
      <NewestMembers />

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className={styles.sectionTitle}>Connect • Grow • Worship</h2>
              <p className={styles.sectionSubtitle}>
                Discover meaningful ways to deepen your faith and connect with fellow believers
              </p>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <span className="material-icons">groups</span>
                </div>
                <h3>Prayer Community</h3>
                <p>Join other members worldwide in prayer. Share your requests and pray for others in our supportive community.</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <span className="material-icons">menu_book</span>
                </div>
                <h3>Biblical Study</h3>
                <p>Dive deeper into God's Word with guided studies, devotionals, and discussions with fellow believers.</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <span className="material-icons">favorite</span>
                </div>
                <h3>Fellowship</h3>
                <p>Build lasting friendships and find accountability partners in your spiritual journey with Christ.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h2 className={styles.ctaTitle}>Ready to Begin Your Journey?</h2>
              <p className={styles.ctaSubtitle}>
                Join thousands of people who are growing stronger in their faith together
              </p>
              <div className={styles.ctaButtons}>
                <button 
                  className="btn btn-light btn-lg me-3"
                  onClick={openRegistrationModal}
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beautiful Footer Component */}
      <Footer />

      {/* Registration Modal */}
      <RegistrationModal 
        isOpen={isRegistrationModalOpen} 
        onClose={closeRegistrationModal} 
      />
    </div>
  );
};

export default Home;