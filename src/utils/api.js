// NOBELLE Admin API client — real backend authentication, no mock data.
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '') + '/api/v1';

const ACCESS_TOKEN_KEY = 'nobelle_admin_access_token';
const REFRESH_TOKEN_KEY = 'nobelle_admin_refresh_token';
const ADMIN_KEY = 'nobelle_admin_user';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getStored(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key) || null;
}

export function getAccessToken() {
  return getStored(ACCESS_TOKEN_KEY);
}

export function getAdminUser() {
  const raw = getStored(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Convenience: display name / email for the current admin (or nulls). */
export function getAdminIdentity() {
  const admin = getAdminUser();
  return {
    name: admin?.name || 'Administrator',
    email: admin?.email || '',
    role: admin?.role || '',
  };
}

function storeValue(key, value, remember) {
  // remember=true → localStorage (persists), otherwise sessionStorage
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
  if (remember) {
    localStorage.setItem(key, value);
  } else {
    sessionStorage.setItem(key, value);
  }
}

export function setSession({ accessToken, refreshToken, admin }, remember = false) {
  storeValue(ACCESS_TOKEN_KEY, accessToken, remember);
  storeValue(REFRESH_TOKEN_KEY, refreshToken, remember);
  storeValue(ADMIN_KEY, JSON.stringify(admin), remember);
}

export function clearSession() {
  [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, ADMIN_KEY].forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Network / server unreachable — never expose internals
    throw new ApiError('Unable to sign in right now. Please try again.', 0);
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    const message =
      json?.message && typeof json.message === 'string'
        ? json.message
        : 'Unable to sign in right now. Please try again.';
    throw new ApiError(message, res.status);
  }

  return json?.data !== undefined ? json.data : json;
}

export const adminAuthApi = {
  async login(email, password, remember = false) {
    const data = await request('/admin/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setSession(data, remember);
    return data;
  },

  async forgotPassword(email) {
    return request('/admin/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  },

  async resetPassword(token, newPassword) {
    return request('/admin/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword },
    });
  },

  async refreshToken() {
    const refreshToken = getStored(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new ApiError('No session', 401);
    const data = await request('/admin/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
    setSession({ ...data, admin: getAdminUser() }, Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)));
    return data;
  },

  async logout() {
    const refreshToken = getStored(REFRESH_TOKEN_KEY);
    try {
      await request('/admin/auth/logout', {
        method: 'POST',
        body: refreshToken ? { refreshToken } : undefined,
      });
    } catch {
      // Best-effort: local session is cleared by the caller regardless
    }
  },

  async getMe() {
    return request('/admin/auth/me', { auth: true });
  },

  hasSession() {
    return Boolean(getStored(ACCESS_TOKEN_KEY));
  },
};
