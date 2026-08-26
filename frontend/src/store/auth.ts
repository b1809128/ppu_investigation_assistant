import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: number;
  badge_id: string;
  full_name: string;
  role: 'ADMIN' | 'LEADERSHIP' | 'INVESTIGATOR';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (token: string) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true, error: null });
    // Configure default axios header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    await get().fetchCurrentUser();
  },

  logout: () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    set({ token: null, user: null, isAuthenticated: false, error: null });
  },

  fetchCurrentUser: async () => {
    const token = get().token;
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    
    set({ isLoading: true });
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('/api/auth/me');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      console.error('Lỗi khi lấy thông tin người dùng:', err);
      // If token is invalid or expired
      if (err.response?.status === 401 || err.response?.status === 403) {
        get().logout();
      }
      set({ 
        error: err.response?.data?.detail || 'Không thể xác thực tài khoản.', 
        isLoading: false 
      });
    }
  },

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null })
}));
