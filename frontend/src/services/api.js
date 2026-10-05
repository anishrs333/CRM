import axios from "axios";
import { storage } from "../utils/storage";

export const isMockEnabled = false;
export const mockDelay = async (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    headers: {
        "Content-Type": "application/json"
    },
});

api.interceptors.request.use(
    (config) => {
        const token = storage.getAccessToken() || localStorage.getItem("access_token") || localStorage.getItem("apexcrm_access_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },

    (error) =>{
        return Promise.reject(error);
    }
);


// Helper to extract DRF error messages
const extractErrorMessage = (data, fallback) => {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return typeof data.detail === 'string' ? data.detail : String(data.detail);
  if (data.message) return typeof data.message === 'string' ? data.message : String(data.message);
  if (data.non_field_errors) {
    return Array.isArray(data.non_field_errors) ? data.non_field_errors.join(', ') : String(data.non_field_errors);
  }
  if (data.errors) {
    return typeof data.errors === 'string' ? data.errors : Object.values(data.errors).flat().join(', ');
  }
  if (typeof data === 'object') {
    const formatted = Object.entries(data)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
      .join('; ');
    if (formatted) return formatted;
  }
  return fallback;
};

// Response Interceptor: Standardized Error Handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    let errorMessage = 'An unexpected error occurred. Please try again.';
    let status = null;

    if (error.response) {
      status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          errorMessage = extractErrorMessage(data, 'Invalid request data.');
          break;

        case 401:
          const requestUrl = error.config?.url || '';
          const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/token');
          
          if (isAuthEndpoint) {
            errorMessage = extractErrorMessage(data, 'Invalid username or password.');
          } else {
            errorMessage = extractErrorMessage(data, 'Session expired. Please log in again.');
            storage.clearSession();
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          }
          break;

        case 403:
          errorMessage = extractErrorMessage(data, 'You do not have permission to perform this action.');
          break;

        case 404:
          errorMessage = extractErrorMessage(data, 'Requested resource was not found.');
          break;

        case 500:
        case 502:
        case 503:
          errorMessage = extractErrorMessage(data, 'Internal server error. Please contact system admin.');
          break;

        default:
          errorMessage = extractErrorMessage(data, `Server responded with status ${status}`);
      }
    } else if (error.request) {
      errorMessage = 'Unable to connect to the CRM server. Please check your internet connection.';
    } else {
      errorMessage = error.message;
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.status = status;
    enhancedError.originalError = error;

    return Promise.reject(enhancedError);
  }
);

export default api;
