// API Configuration for different environments
// Updated for production deployment
const config = {
  // Development environment (local)
  development: {
    API_BASE_URL: 'http://127.0.0.1:5000/api/v1',
    BACKEND_URL: 'http://127.0.0.1:5000'
  },
  
  // Production environment (deployed)
  production: {
    API_BASE_URL: 'https://financial-advisor-4yle.onrender.com/api/v1',
    BACKEND_URL: 'https://financial-advisor-4yle.onrender.com'
  }
};

// Get current environment
const environment = process.env.NODE_ENV || 'development';

// Export the appropriate configuration
export const API_BASE_URL = config[environment].API_BASE_URL;
export const BACKEND_URL = config[environment].BACKEND_URL;

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to get full backend URL
export const getBackendUrl = (endpoint) => {
  return `${BACKEND_URL}${endpoint}`;
};

export default config[environment]; 