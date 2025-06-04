// src/pages/Resources.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/Resources.module.css';

const Resources = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Mix of free and paid listings - paid listings get premium placement and features
  const [resources] = useState([
    // PREMIUM FEATURED LISTINGS (Paid Tier 1 - $299/month)
    {
      id: 1,
      title: "RightNow Media - Unlimited Bible Studies",
      description: "Access 20,000+ Bible study videos, kids shows, and training content. Perfect for churches, small groups, and families. Free trial available.",
      category: "bible-study",
      type: "Premium Service",
      duration: "Unlimited Access",
      featured: true,
      sponsored: true,
      tier: "premium",
      author: "RightNow Media",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop",
      url: "https://www.rightnowmedia.org/",
      price: "$99/year",
      offer: "30-Day Free Trial",
      tags: ["video", "unlimited", "church", "family"]
    },
    {
      id: 2,
      title: "PlanningCenter - Church Management Software",
      description: "Complete church management solution with worship planning, volunteer scheduling, giving management, and member directory tools.",
      category: "ministry",
      type: "Premium Software",
      duration: "Monthly Subscription",
      featured: true,
      sponsored: true,
      tier: "premium",
      author: "Planning Center",
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop",
      url: "https://www.planningcenter.com/",
      price: "Starting at $19/month",
      offer: "Free for churches under 75 people",
      tags: ["church", "management", "worship", "volunteers"]
    },
    {
      id: 3,
      title: "Subsplash - Church App & Giving Platform",
      description: "Custom church apps, online giving, live streaming, and engagement tools. Trusted by 16,000+ churches worldwide.",
      category: "ministry",
      type: "Premium Platform",
      duration: "Monthly Service",
      featured: true,
      sponsored: true,
      tier: "premium",
      author: "Subsplash",
      image: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=300&h=200&fit=crop",
      url: "https://subsplash.com/",
      price: "Custom pricing",
      offer: "Free demo available",
      tags: ["app", "giving", "streaming", "engagement"]
    },

    // SPONSORED LISTINGS (Paid Tier 2 - $99/month)
    {
      id: 4,
      title: "Logos Bible Software",
      description: "Professional Bible study software with thousands of books, commentaries, and original language tools for serious students.",
      category: "bible-study",
      type: "Study Software",
      duration: "One-time Purchase",
      featured: false,
      sponsored: true,
      tier: "standard",
      author: "Logos Bible Software",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop",
      url: "https://www.logos.com/",
      price: "Starting at $99",
      offer: "Free mobile app",
      tags: ["software", "commentary", "greek", "hebrew"]
    },
    {
      id: 5,
      title: "Worship Artistry - Song Tutorials",
      description: "Learn hundreds of worship songs with detailed tutorials for guitar, piano, drums, bass, and vocals. Join 15,000+ worship leaders.",
      category: "worship",
      type: "Training Platform",
      duration: "Monthly Subscription",
      featured: false,
      sponsored: true,
      tier: "standard",
      author: "Worship Artistry",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop",
      url: "https://worshipartistry.com/",
      price: "$19.95/month",
      offer: "7-day free trial",
      tags: ["worship", "tutorials", "instruments", "training"]
    },
    {
      id: 6,
      title: "Bible Study Magazine Subscription",
      description: "Bimonthly magazine with in-depth Bible studies, archaeological insights, and scholarly articles to deepen your faith.",
      category: "bible-study",
      type: "Magazine",
      duration: "6 issues/year",
      featured: false,
      sponsored: true,
      tier: "standard",
      author: "Logos Bible Study Magazine",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=200&fit=crop",
      url: "https://biblestudymagazine.com/",
      price: "$29.95/year",
      offer: "First issue free",
      tags: ["magazine", "archaeology", "scholarly", "study"]
    },

    // FREE COMMUNITY LISTINGS
    {
      id: 7,
      title: "Blue Letter Bible - Free Study Tools",
      description: "Comprehensive Bible study platform with commentaries, concordances, original language tools, and over 30 Bible translations.",
      category: "bible-study",
      type: "Free Platform",
      duration: "Always Free",
      featured: false,
      sponsored: false,
      tier: "free",
      author: "Blue Letter Bible Ministry",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop",
      url: "https://www.blueletterbible.org/",
      tags: ["free", "hebrew", "greek", "concordance"]
    },
    {
      id: 8,
      title: "Our Daily Bread Devotionals",
      description: "Free daily devotionals and resources to help grow closer in your relationship with God and become more like Jesus.",
      category: "devotionals",
      type: "Free Content",
      duration: "Daily",
      featured: false,
      sponsored: false,
      tier: "free",
      author: "Our Daily Bread Ministries",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=200&fit=crop",
      url: "https://www.odbm.org",
      tags: ["free", "daily", "devotional", "growth"]
    },
    {
      id: 9,
      title: "YouVersion Bible App",
      description: "Free Bible app with hundreds of translations, reading plans, audio Bibles, and a global community of believers.",
      category: "bible-study",
      type: "Mobile App",
      duration: "Always Free",
      featured: false,
      sponsored: false,
      tier: "free",
      author: "Life.Church",
      image: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=300&h=200&fit=crop",
      url: "https://www.youversion.com/",
      tags: ["free", "mobile", "plans", "community"]
    },
    {
      id: 10,
      title: "Hillsong Worship Resources",
      description: "Free chord charts, lyrics, and worship resources from Hillsong Church to help lead worship in your community.",
      category: "worship",
      type: "Free Resources",
      duration: "Always Free",
      featured: false,
      sponsored: false,
      tier: "free",
      author: "Hillsong Church",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop",
      url: "https://hillsong.com/worship/",
      tags: ["free", "worship", "chords", "lyrics"]
    }
  ]);

  const categories = [
    { id: 'all', name: 'All Resources', icon: 'dashboard' },
    { id: 'devotionals', name: 'Daily Devotionals', icon: 'auto_stories' },
    { id: 'bible-study', name: 'Bible Study', icon: 'menu_book' },
    { id: 'prayer', name: 'Prayer Resources', icon: 'volunteer_activism' },
    { id: 'worship', name: 'Worship & Music', icon: 'music_note' },
    { id: 'ministry', name: 'Church & Ministry', icon: 'groups' },
    { id: 'family', name: 'Family & Marriage', icon: 'family_restroom' },
    { id: 'christian-living', name: 'Christian Living', icon: 'lifestyle' }
  ];

  // Sort resources: Premium first, then Sponsored, then Free
  const sortedResources = resources.sort((a, b) => {
    const tierOrder = { premium: 0, standard: 1, free: 2 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  const filteredResources = sortedResources.filter(resource => {
    const matchesCategory = activeCategory === 'all' || resource.category === activeCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredResources = resources.filter(resource => resource.featured);

  const handleResourceClick = (resource) => {
    // Track clicks for analytics/billing
    console.log(`Resource clicked: ${resource.title} (Tier: ${resource.tier})`);
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const handleAdvertiseWithUs = () => {
    navigate('/advertiser/register');
  };

  const handleSubmitResource = () => {
    navigate('/submit-resource');
  };

  return (
    <div className={styles.resourcesPage}>
      <Header />
      
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h1 className={styles.heroTitle}>Christian Resources Marketplace</h1>
              <p className={styles.heroSubtitle}>
                Discover trusted tools, services, and content from Christian businesses and ministries
              </p>
              
              {/* Search Bar */}
              <div className={styles.searchContainer}>
                <div className={styles.searchWrapper}>
                  <span className="material-icons">search</span>
                  <input
                    type="text"
                    placeholder="Search Christian resources, tools, and services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              </div>

              {/* CTA for Advertisers */}
              <div className={styles.advertiserCta}>
                <p>Christian business owner? <button onClick={handleAdvertiseWithUs} className={styles.ctaLink}>Advertise your services here</button></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Premium Resources */}
      <section className={styles.featuredSection}>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <h2 className={styles.sectionTitle}>
                Premium Resources
                <span className={styles.sponsoredBadge}>Sponsored</span>
              </h2>
              <p className={styles.sectionSubtitle}>Top-tier Christian services and platforms trusted by thousands</p>
            </div>
          </div>
          <div className="row">
            {featuredResources.map((resource) => (
              <div key={resource.id} className="col-lg-4 col-md-6 mb-4">
                <div className={`${styles.featuredCard} ${styles.premiumCard}`} onClick={() => handleResourceClick(resource)}>
                  <div className={styles.cardImage}>
                    <img src={resource.image} alt={resource.title} />
                    <div className={styles.premiumBadge}>
                      <span className="material-icons">star</span>
                      Premium
                    </div>
                    {resource.offer && (
                      <div className={styles.offerBadge}>
                        {resource.offer}
                      </div>
                    )}
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardType}>{resource.type}</span>
                      <span className={styles.cardPrice}>{resource.price}</span>
                    </div>
                    <h3 className={styles.cardTitle}>{resource.title}</h3>
                    <p className={styles.cardDescription}>{resource.description}</p>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardAuthor}>by {resource.author}</span>
                      <button className={styles.cardButton}>
                        <span className="material-icons">launch</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories and All Resources */}
      <section className={styles.resourcesSection}>
        <div className="container">
          <div className="row">
            
            {/* Categories Sidebar */}
            <div className="col-lg-3 mb-4">
              <div className={styles.categoriesSidebar}>
                <h3>Browse Categories</h3>
                <div className={styles.categoriesList}>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className={`${styles.categoryButton} ${activeCategory === category.id ? styles.active : ''}`}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      <span className="material-icons">{category.icon}</span>
                      <span>{category.name}</span>
                      <span className={styles.categoryCount}>
                        {category.id === 'all' 
                          ? resources.length 
                          : resources.filter(r => r.category === category.id).length
                        }
                      </span>
                    </button>
                  ))}
                </div>

                {/* Advertise With Us Card */}
                <div className={styles.advertiseCard}>
                  <h4>
                    <span className="material-icons">business</span>
                    Advertise With Us
                  </h4>
                  <p>Reach thousands of Christian community members</p>
                  <ul className={styles.pricingList}>
                    <li><strong>Premium Featured:</strong> $299/month</li>
                    <li><strong>Sponsored Listing:</strong> $99/month</li>
                    <li><strong>Basic Listing:</strong> $29/month</li>
                  </ul>
                  <button onClick={handleAdvertiseWithUs} className={styles.advertiseButton}>
                    <span className="material-icons">campaign</span>
                    Get Started
                  </button>
                </div>

                {/* Newsletter Card */}
                <div className={styles.newsletterCard}>
                  <h4>Stay Updated</h4>
                  <p>Get the latest Christian resources delivered to your inbox</p>
                  <input type="email" placeholder="Enter your email" className={styles.newsletterInput} />
                  <button className={styles.newsletterButton}>
                    <span className="material-icons">mail</span>
                    Subscribe
                  </button>
                </div>
              </div>
            </div>

            {/* Resources Grid */}
            <div className="col-lg-9">
              <div className={styles.resourcesHeader}>
                <h3>
                  {activeCategory === 'all' 
                    ? 'All Resources' 
                    : categories.find(c => c.id === activeCategory)?.name
                  }
                </h3>
                <span className={styles.resultsCount}>
                  {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} found
                </span>
              </div>

              {filteredResources.length === 0 ? (
                <div className={styles.noResults}>
                  <span className="material-icons">search_off</span>
                  <h4>No Resources Found</h4>
                  <p>Try adjusting your search terms or selecting a different category</p>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setActiveCategory('all');
                    }}
                    className={styles.clearButton}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className={styles.resourcesGrid}>
                  {filteredResources.map((resource) => (
                    <div 
                      key={resource.id} 
                      className={`${styles.resourceCard} ${styles[resource.tier]}`} 
                      onClick={() => handleResourceClick(resource)}
                    >
                      <div className={styles.resourceImage}>
                        <img src={resource.image} alt={resource.title} />
                        {resource.sponsored && (
                          <div className={styles.sponsorBadge}>
                            <span className="material-icons">local_offer</span>
                            {resource.tier === 'premium' ? 'Premium' : 'Sponsored'}
                          </div>
                        )}
                        {resource.offer && (
                          <div className={styles.resourceOffer}>
                            {resource.offer}
                          </div>
                        )}
                        <div className={styles.resourceOverlay}>
                          <button className={styles.playButton}>
                            <span className="material-icons">launch</span>
                          </button>
                        </div>
                      </div>
                      <div className={styles.resourceContent}>
                        <div className={styles.resourceMeta}>
                          <span className={styles.resourceType}>{resource.type}</span>
                          {resource.price && <span className={styles.resourcePrice}>{resource.price}</span>}
                        </div>
                        <h4 className={styles.resourceTitle}>{resource.title}</h4>
                        <p className={styles.resourceDescription}>{resource.description}</p>
                        <div className={styles.resourceTags}>
                          {resource.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className={styles.tag}>#{tag}</span>
                          ))}
                        </div>
                        <div className={styles.resourceFooter}>
                          <span className={styles.resourceAuthor}>by {resource.author}</span>
                          <div className={styles.resourceActions}>
                            <button className={styles.favoriteButton} onClick={(e) => e.stopPropagation()}>
                              <span className="material-icons">bookmark_border</span>
                            </button>
                            <button className={styles.shareButton} onClick={(e) => e.stopPropagation()}>
                              <span className="material-icons">share</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action for Business Owners */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h2 className={styles.ctaTitle}>Grow Your Christian Business</h2>
              <p className={styles.ctaSubtitle}>
                Join hundreds of Christian businesses reaching our engaged community of believers
              </p>
              <div className={styles.ctaButtons}>
                <button className={styles.requestButton} onClick={handleAdvertiseWithUs}>
                  <span className="material-icons">business</span>
                  Start Advertising
                </button>
                <button className={styles.contributeButton} onClick={handleSubmitResource}>
                  <span className="material-icons">add_business</span>
                  Submit Free Listing
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Resources;