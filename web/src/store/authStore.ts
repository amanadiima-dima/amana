import { create } from 'zustand';
import Cookies from 'js-cookie';
import { authApi, userApi } from '@/lib/api';

interface User { id: string; phone: string; name: string; photoUrl?: string; isVerified: boolean; rating: number; role?: string; idVerification?: { status: 'PENDING' | 'APPROVED' | 'REJECTED' } | null; }
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  sendOtp: (phone: string) => Promise<void>;
  // Resolves to a registration token when the phone is new and still needs a name; otherwise signs in.
  verifyOtp: (phone: string, code: string) => Promise<{ registrationToken?: string }>;
  completeRegistration: (registrationToken: string, name: string) => Promise<void>;
  startSession: (data: any) => Promise<void>;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  sendOtp: async (phone) => { await authApi.sendOtp(phone); },

  verifyOtp: async (phone, code) => {
    const { data } = await authApi.verifyOtp(phone, code);
    if (data.needsProfile) return { registrationToken: data.registrationToken };
    await get().startSession(data);
    return {};
  },

  completeRegistration: async (registrationToken, name) => {
    const { data } = await authApi.completeRegistration(registrationToken, name);
    await get().startSession(data);
  },

  startSession: async (data: any) => {
    Cookies.set('accessToken', data.accessToken, { expires: 7 });
    Cookies.set('refreshToken', data.refreshToken, { expires: 30 });
    set({ user: data.user, isAuthenticated: true });
    // The login response is a lightweight snapshot; fetch the full profile
    // (role, idVerification, etc.) so nav/UI that depend on it are correct
    // right after signing in, not just after a later page reload.
    await get().loadUser();
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
