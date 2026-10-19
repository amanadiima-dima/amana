import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = Cookies.get('refreshToken');
      if (!refreshToken) { window.location.href = '/auth'; return Promise.reject(error); }
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        Cookies.set('accessToken', data.accessToken, { expires: 7 });
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, code: string) => api.post('/auth/verify-otp', { phone, code }),
  completeRegistration: (registrationToken: string, name: string) => api.post('/auth/complete-registration', { registrationToken, name }),
  logout: () => api.post('/auth/logout'),
};
export const userApi = {
  getIdChallenge: () => api.get('/users/me/id-verification/challenge'),
  getMe: () => api.get('/users/me'),
  updateMe: (data: object) => api.patch('/users/me', data),
  uploadIdVerification: (formData: FormData) => api.post('/users/me/id-verification', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
export const tripApi = {
  create: (data: object) => api.post('/trips', data),
  search: (p: { origin?: string; destination?: string; date?: string }) =>
    api.get('/trips/search', { params: Object.fromEntries(Object.entries(p).filter(([, v]) => v)) }),
  getMyTrips: () => api.get('/trips/my'),
  getById: (id: string) => api.get(`/trips/${id}`),
  getBookings: (id: string) => api.get(`/trips/${id}/bookings`),
  update: (id: string, data: object) => api.patch(`/trips/${id}`, data),
  cancel: (id: string) => api.delete(`/trips/${id}`),
};
export const parcelApi = {
  create: (formData: FormData) => api.post('/parcels', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyParcels: () => api.get('/parcels/my'),
  getById: (id: string) => api.get(`/parcels/${id}`),
};
export const bookingApi = {
  create: (tripId: string, parcelRequestId: string, priorityTip?: number, payerPhone?: string, locale?: string) =>
    api.post('/bookings', { tripId, parcelRequestId, locale, ...(priorityTip ? { priorityTip } : {}), ...(payerPhone ? { payerPhone } : {}) }),
  respond: (id: string, action: 'accept' | 'reject') => api.patch(`/bookings/${id}/respond`, { action }),
  cancel: (id: string) => api.delete(`/bookings/${id}`),
  dispute: (id: string, reason: string) => api.post(`/bookings/${id}/dispute`, { reason }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  getAll: (role?: string) => api.get('/bookings', { params: { role } }),
};
export const inviteApi = {
  preview: (token: string) => api.get(`/invites/${token}`),
  claim: (token: string) => api.post(`/invites/${token}/claim`),
  decline: (token: string) => api.post(`/invites/${token}/decline`),
};
export const trackingApi = {
  addEvent: (bookingId: string, formData: FormData) => api.post(`/tracking/${bookingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getHistory: (bookingId: string) => api.get(`/tracking/${bookingId}`),
};
export const paymentApi = {
  createIntent: (bookingId: string) => api.post('/payments/intent', { bookingId }),
  get: (bookingId: string) => api.get(`/payments/${bookingId}`),
  confirmStub: (bookingId: string) => api.post(`/payments/${bookingId}/confirm-stub`),
};
export const messageApi = {
  list: (bookingId: string) => api.get(`/bookings/${bookingId}/messages`),
  send: (bookingId: string, body: string) => api.post(`/bookings/${bookingId}/messages`, { body }),
};
export const reviewApi = {
  create: (data: { bookingId: string; rating: number; comment?: string }) => api.post('/reviews', data),
  getByUser: (userId: string) => api.get(`/reviews/user/${userId}`),
  getPublicProfile: (userId: string) => api.get(`/users/${userId}`),
};
export const notificationApi = {
  getAll: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
};
export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  getPendingVerifications: () => api.get('/admin/verifications'),
  getDisputes: () => api.get('/admin/disputes'),
  getStaff: () => api.get('/admin/staff'),
  addStaff: (phone: string) => api.post('/admin/staff', { phone }),
  removeStaff: (userId: string) => api.delete(`/admin/staff/${userId}`),
  getActivity: () => api.get('/admin/activity'),
  resolveDispute: (id: string, resolution: 'REFUND' | 'RELEASE') => api.patch(`/admin/disputes/${id}`, { resolution }),
  reviewVerification: (id: string, status: 'APPROVED' | 'REJECTED', reviewNote?: string) =>
    api.patch(`/admin/verifications/${id}`, { status, reviewNote }),
};
