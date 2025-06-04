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
                  <a href="#" className={styles.socialLink} aria-label="Facebook">
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a href="#" className={styles.socialLink} aria-label="Twitter">
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="#" className={styles.socialLink} aria-label="Instagram">
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a href="#" className={styles.socialLink} aria-label="YouTube">
                    <i className="fab fa-youtube"></i>
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="col-lg-2 col-md-6 mb-4">
              <h5 className={styles.footerHeading}>Community</h5>
              <ul className={styles.footerLinks}>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/members">All Members</Link></li>
                <li><Link to="/prayer">Prayer Wall</Link></li>
                <li><Link to="/bible-study">Bible Study</Link></li>
                <li><Link to="/testimonies">Testimonies</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="col-lg-2 col-md-6 mb-4">
              <h5 className={styles.footerHeading}>Resources</h5>
              <ul className={styles.footerLinks}>
                <li><Link to="/devotionals">Daily Devotionals</Link></li>
                <li><Link to="/sermons">Sermons</Link></li>
                <li><Link to="/scripture">Scripture Study</Link></li>
                <li><Link to="/worship">Worship Music</Link></li>
                <li><Link to="/events">Events</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className="col-lg-2 col-md-6 mb-4">
              <h5 className={styles.footerHeading}>Support</h5>
              <ul className={styles.footerLinks}>
                <li><Link to="/help">Help Center</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
                <li><Link to="/guidelines">Community Guidelines</Link></li>
                <li><Link to="/safety">Safety & Privacy</Link></li>
                <li><Link to="/feedback">Feedback</Link></li>
              </ul>
            </div>

            {/* Newsletter Signup */}
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
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/terms">Terms of Service</Link>
                <Link to="/cookies">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;