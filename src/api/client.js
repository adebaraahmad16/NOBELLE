const base = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');
const tokens = { admin: null, customer: null };
const refreshing = { admin: null, customer: null };
export const token = (role) => tokens[role];
export function setToken(role, value) { tokens[role] = value; }
export class ApiError extends Error { constructor(message, status, errors = []) { super(message); this.status = status; this.errors = errors; } }
export async function api(path, { method = 'GET', body, role, retry = true, full = false } = {}) {
  const headers = {};
  const multipart = body instanceof FormData;
  if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json';
  if (role && tokens[role]) headers.Authorization = `Bearer ${tokens[role]}`;
  let response;
  try { response = await fetch(`${base}${path}`, { method, credentials: 'include', headers, body: body === undefined ? undefined : multipart ? body : JSON.stringify(body) }); }
  catch { throw new ApiError('Unable to reach NOBELLE. Check your connection and retry.', 0); }
  if (response.status === 401 && role && retry) {
    if (!refreshing[role]) refreshing[role] = api(`${role === 'admin' ? '/admin' : ''}/auth/refresh`, { method: 'POST', body: {}, retry: false })
      .then(data => { setToken(role, data.accessToken); return data; }).finally(() => { refreshing[role] = null; });
    try { await refreshing[role]; } catch { setToken(role, null); window.dispatchEvent(new CustomEvent('nobelle-session-expired', { detail: role })); throw new ApiError('Please sign in to continue.', 401); }
    return api(path, { method, body, role, retry: false, full });
  }
  let data;
  try { data = await response.json(); } catch { throw new ApiError('Unexpected server response. Please retry.', response.status); }
  if (!response.ok) { const details = (data.errors || []).map(error => `${(error.field || '').replace(/^body\./, '')}: ${error.message || ''}`).join(' '); throw new ApiError(details || data.message || 'Unable to complete request.', response.status, data.errors); }
  if(role === 'admin' && !['GET','HEAD'].includes(method)) window.dispatchEvent(new CustomEvent('nobelle-data-changed'));
  return full ? data : data.data;
}
export async function signIn(role, email, password, remember = false) {
  const data = await api(`${role === 'admin' ? '/admin' : ''}/auth/login`, { method: 'POST', body: { email, password, remember } });
  setToken(role, data.accessToken); window.dispatchEvent(new CustomEvent('nobelle-session-changed', { detail: role })); return data;
}
export async function signOut(role) {
  await api(`${role === 'admin' ? '/admin' : ''}/auth/logout`, { method: 'POST', body: {}, role });
  setToken(role, null); window.dispatchEvent(new CustomEvent('nobelle-session-expired', { detail: role }));
}
export function normalizeProduct(product) {
  const images = (product.images || []).map(image => image.url);
  return { ...product, price: Number(product.price), images, image: images[0] || '', category: product.category?.slug || '',
    categoryId: product.categoryId, collection: product.collection?.slug || '', sizes: [...new Set(product.variants?.map(v => v.size))],
    colors: [...new Set(product.variants?.map(v => v.color))], stock: (product.variants || []).reduce((n, v) => n + Math.max(0, (v.inventory?.quantity || 0) - (v.inventory?.reserved || 0)), 0),
    status: product.isActive ? 'Active' : 'Draft', featured: product.isFeatured, dateAdded: product.createdAt,
    rating: product.reviews?.length ? product.reviews.reduce((n, r) => n + r.rating, 0) / product.reviews.length : 0,
    reviews: product.reviews?.length || 0 };
}
