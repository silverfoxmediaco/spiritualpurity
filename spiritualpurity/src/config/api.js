// Create a new file: src/config/api.js

const API_CONFIG = {
    // Use environment variable if available, otherwise detect based on hostname
    BASE_URL: process.env.REACT_APP_API_URL || 
      (window.location.hostname === 'localhost' 
        ? 'http://localhost:5001' 
        : 'https://spiritualpurity-backend.onrender.com' // Replace with your actual backend URL
      )
  };
  
  export default API_CONFIG;
  
  // Alternative approach - you can also use:
  // export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  //   ? 'https://your-backend-domain.com' 
  //   : 'http://localhost:5001';