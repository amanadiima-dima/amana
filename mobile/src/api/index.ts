import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({ baseURL: BASE_URL });

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) return Promise.reject(error);
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await SecureStore.setItemAsync('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, code: string, name?: string) =>
    api.post('/auth/verify-otp', { phone, code, name }),
  logout: () => api.post('/auth/logout'),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: { name?: string; bio?: string }) => api.patch('/users/me', data),
  updateFcmToken: (token: string) => api.post('/users/me/fcm-token', { token }),
  uploadIdVerification: (formData: FormData) =>
    api.post('/users/me/id-verification', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ── Trips ─────────────────────────────────────────────────────────────────────
export const tripApi = {
  create: (data: object) => api.post('/trips', data),
  search: (destination: string, date: string, minWeight?: number) =>
    api.get('/trips/search', { params: { destination, date, minWeight } }),
  getMyTrips: () => api.get('/trips/my'),
  getById: (id: string) => api.get(`/trips/${id}`),
  getBookings: (id: string) => api.get(`/trips/${id}/bookings`),
  update: (id: string, data: object) => api.patch(`/trips/${id}`, data),
  cancel: (id: string) => api.delete(`/trips/${id}`),
};

// ── Parcels ───────────────────────────────────────────────────────────────────
export const parcelApi = {
  create: (formData: FormData) =>
    api.post('/parcels', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyParcels: () => api.get('/parcels/my'),
  getById: (id: string) => api.get(`/parcels/${id}`),
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingApi = {
  create: (tripId: string, parcelRequestId: string) =>
    api.post('/bookings', { tripId, parcelRequestId }),
  respond: (id: string, action: 'accept' | 'reject') =>
    api.patch(`/bookings/${id}/respond`, { action }),
  cancel: (id: string) => api.delete(`/bookings/${id}`),
  getById: (id: string) => api.get(`/bookings/${id}`),
  getAll: (role?: 'sender' | 'traveler') =>
    api.get('/bookings', { params: { role } }),
};

// ── Tracking ──────────────────────────────────────────────────────────────────
export const trackingApi = {
  addEvent: (bookingId: string, formData: FormData) =>
    api.post(`/tracking/${bookingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getHistory: (bookingId: string) => api.get(`/tracking/${bookingId}`),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentApi = {
  createIntent: (bookingId: string) => api.post('/payments/intent', { bookingId }),
  getByBooking: (bookingId: string) => api.get(`/payments/${bookingId}`),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewApi = {
  create: (data: { bookingId: string; rating: number; comment?: string }) =>
    api.post('/reviews', data),
  getByUser: (userId: string) => api.get(`/reviews/user/${userId}`),
  getPublicProfile: (userId: string) => api.get(`/users/${userId}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
};
