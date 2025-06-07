// src/config/api.js

const API_CONFIG = {
    BASE_URL: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5001' 
      : 'https://spiritualpurity.com' 

  };
  
  export default API_CONFIG;