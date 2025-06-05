// src/components/Footer.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      {/* Main Footer Content */}
      <div className={styles.footerMain}>
        <div className="container">
          <div className="row">
            {/* Brand Section */}
            <div className="col-lg-4 col-md-6 mb-4">
              <div className={styles.footerBrand}>
                <div className={styles.logo}>
                  <img 
                    src="/spiriualpuritylogov1trans.png" 
                    alt="Spiritual Purity Logo" 
                    className={styles.logoImage}
                  />
                </div>
                <p className={styles.brandDescription}>
                  A sacred community for believers to connect, grow, and strengthen their faith in God and Jesus Christ.
                </p>
                <div className={styles.socialLinks}>
                  {/* Removed dead social links - can be added back when real accounts are created */}
                </div>
              </div>
            </div>

            {/* Quick Links - Only Working Pages */}
            <div className="col-lg-2 col-md-6 mb-4">
              <h5 className={styles.footerHeading}>Community</h5>
              <ul className={styles.footerLinks}>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/members">All Members</Link></li>
                <li><Link to="/community">Community</Link></li>
                <li><Link to="/prayer">Prayer</Link></li>
              </ul>
            </div>

            {/* Resources - With Advertising Link Added */}
            <div className="col-lg-2 col-md-6 mb-4">
              <h5 className={styles.footerHeading}>Resources</h5>
              <ul className={styles.footerLinks}>
                <li><Link to="/resources">Resources</Link></li>
                <li><Link to="/advertiser/register">Advertise With Us</Link></li>
                <li><Link to="/advertiser/dashboard">Advertiser Dashboard</Link></li>
              </ul>
            </div>

            {/* Support - Only Essential Links */}
            <div className="col-lg-2 col-md-6 mb-4">
              <h5 className={styles.footerHeading}>Support</h5>
              <ul className={styles.footerLinks}>
                <li><a href="mailto:support@spiritualpurity.com">Contact Us</a></li>
                {/* Removed dead links - these pages don't exist yet */}
              </ul>
            </div>

            {/* Bible Verse Section */}
            <div className="col-lg-2 col-md-12 mb-4">
              <div className={styles.bibleVerse}>
                <p className={styles.verseText}>
                  " For where two or three gather in my name, there am I with them. "
                </p>
                <span className={styles.verseReference}>- Matthew 18:20</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className={styles.footerBottom}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className={styles.copyright}>
                © {currentYear} Spiritual Purity. All rights reserved. Built with love and faith.
              </p>
            </div>
            <div className="col-md-6">
              <div className={styles.legalLinks}>
                {/* Removed dead legal links - these pages don't exist yet */}
                {/* Can be added back when privacy policy, terms, etc. are created */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;