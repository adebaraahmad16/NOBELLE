import { api, signIn, signOut, token, setToken, ApiError } from '../api/client';
export { ApiError };
let admin = null;
export const getAccessToken = () => token('admin');
export const getAdminUser = () => admin;
export const getAdminIdentity = () => ({ name: admin?.name || 'Administrator', email: admin?.email || '', role: admin?.role || '' });
export function clearSession() { setToken('admin', null); admin = null; }
export function setSession(data) { setToken('admin', data.accessToken); admin = data.admin || admin; }
export const adminAuthApi = {
  async login(email, password, remember = false) { const data = await signIn('admin', email, password, remember); admin = data.admin; return data; },
  async getMe() { admin = await api('/admin/auth/me', { role: 'admin' }); return admin; },
  async refreshToken() { const data = await api('/admin/auth/refresh', { method: 'POST', body: {} }); setSession(data); return data; },
  logout: () => signOut('admin'), hasSession: () => Boolean(token('admin')),
  forgotPassword: email => api('/admin/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (value, newPassword) => api('/admin/auth/reset-password', { method: 'POST', body: { token: value, newPassword } }),
};
