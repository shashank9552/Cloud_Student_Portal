import axios from 'axios';
import awsConfig from './awsConfig';
import storageService from './storageService';

/**
 * Modular Axios HTTP Client
 * Configured with request interceptors to inject Cognito JWT tokens when live AWS is enabled,
 * and seamlessly handles simulated latency for mock development.
 */

export const apiClient = axios.create({
  baseURL: awsConfig.apiGateway.baseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token if user is logged in
apiClient.interceptors.request.use(
  (config) => {
    const user = storageService.getCurrentUser();
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors uniformly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

// Simulated network delay helper for realistic UI loading states in Mock Mode
export const simulateDelay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export default apiClient;
