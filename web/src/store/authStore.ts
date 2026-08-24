import { create } from 'zustand';
import Cookies from 'js-cookie';
import { authApi, userApi } from '@/lib/api';

interface User { id: string; phone: string; name: string; photoUrl?: string; isVerified: boolean; rating: number; role?: string; idVerification?: { status: 'PENDING' | 'APPROVED' | 'REJECTED' } | null; }
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string, name?: string) => Promise<void>;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  sendOtp: async (phone) => { await authApi.sendOtp(phone); },

  verifyOtp: async (phone, code, name) => {
    const { data } = await authApi.verifyOtp(phone, code, name);
    Cookies.set('accessToken', data.accessToken, { expires: 7 });
    Cookies.set('refreshToken', data.refreshToken, { expires: 30 });
    set({ user: data.user, isAuthenticated: true });
  },

  loadUser: async () => {
    const token = Cookies.get('accessToken');
    if (!token) return;
    try {
      const { data } = await userApi.getMe();
      set({ user: data.user, isAuthenticated: true });
    } catch {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    set({ user: null, isAuthenticated: false });
  },
}));
