// src/config/api.js

const API_CONFIG = {
    BASE_URL: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5001' 
      : '' // Empty string uses same domain in production
  };
  
  export default API_CONFIG;