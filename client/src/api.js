/**
 * MTP PLATFORM — Cliente fetch + token management.
 *
 * BASE se resuelve así:
 *  - En local con Vite: '/api' (proxy hacia http://localhost:4000)
 *  - En producción: VITE_API_URL del .env, ej. https://mtp-api.onrender.com
 */
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

function getToken() { return localStorage.getItem('mtp.token'); }

async function request(method, path, { body, formData } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(BASE + path, { method, headers, body: payload });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    const err = new Error(data?.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, { body }),
  patch:  (path, body)  => request('PATCH',  path, { body }),
  delete: (path)        => request('DELETE', path),
  upload: (path, formData) => request('POST', path, { formData }),
};
