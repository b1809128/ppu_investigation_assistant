import axios from 'axios';
import { useAuthStore } from '../store/auth';

// Simple Custom Toast Helper to display notifications in LAN offline environment
export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  const container = document.getElementById('toast-container') || (() => {
    const div = document.createElement('div');
    div.id = 'toast-container';
    div.className = 'fixed bottom-5 right-5 z-[10000] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(div);
    return div;
  })();

  const toast = document.createElement('div');
  const typeStyles = {
    success: 'bg-emerald-900/90 border-emerald-500 text-emerald-100',
    error: 'bg-red-950/90 border-red-500 text-red-100',
    warning: 'bg-amber-950/90 border-accent-amber text-amber-100',
    info: 'bg-navy-900/90 border-slate-700 text-slate-100'
  }[type];

  toast.className = `p-4 rounded-lg border shadow-2xl font-sans text-xs font-semibold flex items-center gap-2.5 min-w-[280px] max-w-sm pointer-events-auto transition-all duration-300 transform translate-x-20 opacity-0 ${typeStyles}`;
  toast.innerHTML = `
    <span class="w-2 h-2 rounded-full ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-emerald-500' : 'bg-accent-gold'} animate-pulse"></span>
    <span class="flex-1">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.remove('translate-x-20', 'opacity-0');
  }, 10);

  // Remove toast after 4 seconds
  setTimeout(() => {
    toast.classList.add('translate-x-20', 'opacity-0');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
};

const api = axios.create({
  baseURL: import.meta.env.DEV ? 'http://127.0.0.1:8000' : '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject Bearer Token
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

// Response Interceptor: 401 Auto-Logout and Toast error notifications
api.interceptors.response.use(
  (response) => {
    // If the request was modifying database, show success toast
    if (response.config.method !== 'get' && response.data?.message) {
      showToast(response.data.message, 'success');
    }
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    const errorMessage = error.response?.data?.detail || error.message || 'Lỗi kết nối mạng LAN.';

    // Catch 401 Unauthorized / Token Expired
    if (error.response && error.response.status === 401) {
      if (!originalRequest.url.includes('/auth/login')) {
        showToast('Phiên làm việc đã hết hạn. Đang khóa màn hình...', 'warning');
        
        // Clear state & Log out
        useAuthStore.getState().logout();
      }
    } else {
      // General errors toast
      showToast(errorMessage, 'error');
    }

    return Promise.reject(error);
  }
);

export default api;
