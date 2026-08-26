import axios from 'axios';
import { useAuthStore } from '../store/auth';

// Create custom axios instance
const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch 401 / 403 Unauthorized errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Check if error is due to authentication failure (401 or 403)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Avoid infinite loop if login request fails
      if (!originalRequest.url.includes('/auth/login')) {
        console.warn('Lỗi xác thực (401/403). Đang đăng xuất...', error.response.data);
        
        // Log out user
        useAuthStore.getState().logout();
        
        // Optionally redirect to login page (handled reactively via Zustand state in App)
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
