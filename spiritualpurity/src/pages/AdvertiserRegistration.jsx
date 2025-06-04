// src/pages/AdvertiserRegistration.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/AdvertiserRegistration.module.css';

const AdvertiserRegistration = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    contactPhone: '',
    businessDescription: '',
    website: '',
    businessType: 'christian_business',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const businessTypes = [
    { value: 'church', label: 'Church' },
    { value: 'ministry', label: 'Ministry/Non-profit' },
    { value: 'christian_business', label: 'Christian Business' },
    { value: 'publishing', label: 'Publishing/Media' },
    { value: 'music', label: 'Music/Worship' },
    { value: 'education', label: 'Education/Training' },
    { value: 'counseling', label: 'Counseling/Therapy' },
    { value: 'bookstore', label: 'Bookstore/Retail' },
    { value: 'events', label: 'Events/Conferences' },
    { value: 'technology', label: 'Technology/Software' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to register as an advertiser');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/advertisers/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/advertiser/dashboard');
        }, 2000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.registrationPage}>
        <Header />
        <div className={styles.successContainer}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <span className="material-icons">check_circle</span>
            </div>
            <h2>Registration Successful!</h2>
            <p>Your advertiser account has been created successfully. You will be redirected to your dashboard shortly.</p>
            <div className={styles.successActions}>
              <button 
                onClick={() => navigate('/advertiser/dashboard')}
                className={styles.dashboardButton}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.registrationPage}>
      <Header />
      
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h1 className={styles.heroTitle}>Join Our Christian Business Network</h1>
              <p className={styles.heroSubtitle}>
                Reach thousands of engaged believers and grow your ministry or business
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.benefitsSection}>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <h2 className={styles.sectionTitle}>Why Advertise With Spiritual Purity?</h2>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>
                  <span className="material-icons">groups</span>
                </div>
                <h3>Engaged Community</h3>
                <p>Connect with thousands of active Christian community members who are actively seeking faith-based resources and services.</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>
                  <span className="material-icons">trending_up</span>
                </div>
                <h3>Targeted Reach</h3>
                <p>Your advertisements are shown to people specifically interested in Christian products, services, and ministry resources.</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>
                  <span className="material-icons">analytics</span>
                </div>
                <h3>Detailed Analytics</h3>
                <p>Track your campaign performance with comprehensive analytics including impressions, clicks, and conversion tracking.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className={styles.pricingSection}>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <h2 className={styles.sectionTitle}>Choose Your Advertising Plan</h2>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-4 col-md-6 mb-4">
              <div className={styles.pricingCard}>
                <div className={styles.pricingHeader}>
                  <h3>Basic Listing</h3>
                  <div className={styles.price}>
                    <span className={styles.priceAmount}>$29</span>
                    <span className={styles.pricePeriod}>/month</span>
                  </div>
                </div>
                <ul className={styles.featuresList}>
                  <li>Basic resource listing</li>
                  <li>Company description</li>
                  <li>Contact information</li>
                  <li>Basic analytics</li>
                  <li>Category placement</li>
                </ul>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 mb-4">
              <div className={`${styles.pricingCard} ${styles.popular}`}>
                <div className={styles.popularBadge}>Most Popular</div>
                <div className={styles.pricingHeader}>
                  <h3>Sponsored Listing</h3>
                  <div className={styles.price}>
                    <span className={styles.priceAmount}>$99</span>
                    <span className={styles.pricePeriod}>/month</span>
                  </div>
                </div>
                <ul className={styles.featuresList}>
                  <li>Enhanced listing visibility</li>
                  <li>Sponsored badge</li>
                  <li>Special offers display</li>
                  <li>Detailed analytics</li>
                  <li>Priority customer support</li>
                  <li>Social media promotion</li>
                </ul>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 mb-4">
              <div className={`${styles.pricingCard} ${styles.premium}`}>
                <div className={styles.premiumBadge}>Premium</div>
                <div className={styles.pricingHeader}>
                  <h3>Premium Featured</h3>
                  <div className={styles.price}>
                    <span className={styles.priceAmount}>$299</span>
                    <span className={styles.pricePeriod}>/month</span>
                  </div>
                </div>
                <ul className={styles.featuresList}>
                  <li>Top homepage placement</li>
                  <li>Premium badge & highlights</li>
                  <li>Custom promotional content</li>
                  <li>Advanced analytics dashboard</li>
                  <li>Dedicated account manager</li>
                  <li>Newsletter inclusion</li>
                  <li>Social media features</li>
                  <li>Custom landing pages</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section className={styles.formSection}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className={styles.formCard}>
                <div className={styles.formHeader}>
                  <h2>Start Your 14-Day Free Trial</h2>
                  <p>Create your advertiser account and begin reaching our Christian community today</p>
                </div>

                {error && (
                  <div className={styles.errorMessage}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className={styles.registrationForm}>
                  {/* Business Information */}
                  <div className={styles.formSection}>
                    <h3>Business Information</h3>
                    
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Business Name *</label>
                        <input
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter your business or ministry name"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Contact Phone</label>
                        <input
                          type="tel"
                          name="contactPhone"
                          value={formData.contactPhone}
                          onChange={handleInputChange}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Business Description *</label>
                      <textarea
                        name="businessDescription"
                        value={formData.businessDescription}
                        onChange={handleInputChange}
                        required
                        rows="4"
                        placeholder="Describe your business, ministry, or organization..."
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Website URL *</label>
                        <input
                          type="url"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          required
                          placeholder="https://www.yourwebsite.com"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Business Type *</label>
                        <select
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleInputChange}
                          required
                        >
                          {businessTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className={styles.formSection}>
                    <h3>Business Address</h3>
                    
                    <div className={styles.formGroup}>
                      <label>Street Address</label>
                      <input
                        type="text"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleInputChange}
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>City</label>
                        <input
                          type="text"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          placeholder="Your City"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>State</label>
                        <input
                          type="text"
                          name="address.state"
                          value={formData.address.state}
                          onChange={handleInputChange}
                          placeholder="Your State"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>ZIP Code</label>
                        <input
                          type="text"
                          name="address.zipCode"
                          value={formData.address.zipCode}
                          onChange={handleInputChange}
                          placeholder="12345"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terms and Submit */}
                  <div className={styles.formSection}>
                    <div className={styles.termsSection}>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" required />
                        I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" />
                        I would like to receive marketing updates and promotional offers
                      </label>
                    </div>

                    <div className={styles.submitSection}>
                      <button 
                        type="submit" 
                        disabled={loading}
                        className={styles.submitButton}
                      >
                        {loading ? (
                          <>
                            <div className={styles.spinner}></div>
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <span className="material-icons">business</span>
                            Start Free Trial
                          </>
                        )}
                      </button>
                      
                      <p className={styles.trialInfo}>
                        Start your 14-day free trial today. No credit card required. Cancel anytime.
                      </p>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6">
              <div className={styles.faqItem}>
                <h4>How does the free trial work?</h4>
                <p>Your 14-day free trial includes full access to our Basic Listing features. No credit card is required to start, and you can cancel anytime before the trial ends.</p>
              </div>
              <div className={styles.faqItem}>
                <h4>What payment methods do you accept?</h4>
                <p>We accept all major credit cards, PayPal, and bank transfers for annual subscriptions. Billing is processed securely through our payment partners.</p>
              </div>
              <div className={styles.faqItem}>
                <h4>Can I upgrade or downgrade my plan?</h4>
                <p>Yes, you can change your plan anytime from your dashboard. Upgrades take effect immediately, and downgrades take effect at your next billing cycle.</p>
              </div>
            </div>
            <div className="col-lg-6">
              <div className={styles.faqItem}>
                <h4>How do I track my advertising performance?</h4>
                <p>Your dashboard provides detailed analytics including impressions, clicks, click-through rates, and conversion tracking to help you optimize your campaigns.</p>
              </div>
              <div className={styles.faqItem}>
                <h4>What are the content guidelines?</h4>
                <p>All advertisements must align with Christian values and our community guidelines. We review all content to ensure it meets our standards before approval.</p>
              </div>
              <div className={styles.faqItem}>
                <h4>Do you offer customer support?</h4>
                <p>Yes! All plans include email support. Premium Featured subscribers also get access to a dedicated account manager for personalized assistance.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className={styles.supportSection}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h2 className={styles.sectionTitle}>Need Help Getting Started?</h2>
              <p className={styles.supportText}>
                Our team is here to help you succeed. Contact us for personalized assistance with your advertising strategy.
              </p>
              <div className={styles.supportActions}>
                <a href="mailto:advertiser-support@spiritualpurity.com" className={styles.supportButton}>
                  <span className="material-icons">email</span>
                  Email Support
                </a>
                <a href="tel:+1-555-PRAY-NOW" className={styles.supportButton}>
                  <span className="material-icons">phone</span>
                  Call Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AdvertiserRegistration;