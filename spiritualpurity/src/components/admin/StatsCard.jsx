// src/components/admin/StatsCard.jsx

import React from 'react';
import styles from '../../styles/admin/Admin.module.css';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'primary', 
  trend = null, 
  trendValue = null,
  loading = false 
}) => {
  const getColorClass = () => {
    switch(color) {
      case 'primary':
        return styles.statsPrimary;
      case 'success':
        return styles.statsSuccess;
      case 'warning':
        return styles.statsWarning;
      case 'danger':
        return styles.statsDanger;
      case 'info':
        return styles.statsInfo;
      default:
        return styles.statsPrimary;
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend === 'up') {
      return <span className="material-icons">trending_up</span>;
    } else if (trend === 'down') {
      return <span className="material-icons">trending_down</span>;
    } else {
      return <span className="material-icons">trending_flat</span>;
    }
  };

  if (loading) {
    return (
      <div className={`${styles.statsCard} ${styles.loading}`}>
        <div className={styles.statsCardBody}>
          <div className={styles.loadingPulse}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.statsCard} ${getColorClass()}`}>
      <div className={styles.statsCardBody}>
        <div className={styles.statsIcon}>
          <span className="material-icons">{icon}</span>
        </div>
        
        <div className={styles.statsContent}>
          <h3 className={styles.statsTitle}>{title}</h3>
          <div className={styles.statsValue}>{value}</div>
          
          {trend && (
            <div className={`${styles.statsTrend} ${styles[trend]}`}>
              {getTrendIcon()}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;