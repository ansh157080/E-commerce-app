/* ============================================================
   api.js — Centralised API helper
   ============================================================ */

const API_BASE = (window.location.protocol === 'http:' || window.location.protocol === 'https:') && window.location.port === '5000'
  ? '/api'
  : 'http://localhost:5000/api';

/** Get stored auth token */
const getToken = () => localStorage.getItem('token');

/** Get stored user object */
const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
};

/** Save login data */
const saveAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

/** Clear login data */
const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/** Universal fetch wrapper */
const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = data.error || `Request failed with status ${response.status}`;
    throw new Error(msg);
  }
  return data;
};

/* Convenience methods */
const api = {
  get:    (url)          => apiFetch(url, { method: 'GET' }),
  post:   (url, body)    => apiFetch(url, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (url, body)    => apiFetch(url, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (url, body)    => apiFetch(url, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (url)          => apiFetch(url, { method: 'DELETE' }),
};
