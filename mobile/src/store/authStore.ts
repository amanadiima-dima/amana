import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi, userApi } from '../api';

interface User {
  id: string;
  phone: string;
  name: string;
  photoUrl?: string;
  isVerified: boolean;
  rating: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string, name?: string) => Promise<void>;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  sendOtp: async (phone) => {
    await authApi.sendOtp(phone);
  },

  verifyOtp: async (phone, code, name) => {
    set({ isLoading: true });
    const { data } = await authApi.verifyOtp(phone, code, name);
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  loadUser: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return;
    try {
      const { data } = await userApi.getMe();
      set({ user: data.user, isAuthenticated: true });
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, isAuthenticated: false });
  },
}));
