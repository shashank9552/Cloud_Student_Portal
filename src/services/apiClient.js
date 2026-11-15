import axios from 'axios';
import awsConfig from './awsConfig';
import storageService from './storageService';
import authService from './authService';

/**
 * Helper to determine if real AWS API Gateway backend is live and active
 */
export const isBackendLive = () => {
  const url = import.meta.env.VITE_API_GATEWAY_URL || '';
  const useMock = import.meta.env.VITE_USE_AWS_MOCK === 'true';
  return Boolean(
    !useMock &&
    url &&
    !url.includes('mock-student-portal') &&
    !url.includes('your_api_id') &&
    (url.startsWith('https://') || url.startsWith('http://localhost'))
  );
};

/**
 * Modular Axios HTTP Client
 * Configured with request interceptors to inject Cognito JWT tokens when live AWS is enabled,
 * and seamlessly handles simulated latency for mock development.
 */
export const apiClient = axios.create({
  baseURL: awsConfig.apiGateway.baseUrl,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Dynamically attach verified Cognito ID Token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const tokens = await authService.getAuthTokens();
      if (tokens && tokens.idToken) {
        config.headers.Authorization = `Bearer ${tokens.idToken}`;
      } else {
        const user = storageService.getCurrentUser();
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (err) {
      console.warn('[apiClient] Could not attach Cognito token to request:', err.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors uniformly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    console.error('[API Gateway Client Error]:', message, error.response?.status);
    return Promise.reject(error);
  }
);

// Simulated network delay helper for realistic UI loading states in Mock Mode
export const simulateDelay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export default apiClient;
