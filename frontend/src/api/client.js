// API client — todas las llamadas al backend pasan por aquí
const BASE = '/api';

function getToken() {
  return localStorage.getItem('parkos_token');
}

async function request(method, endpoint, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const posSedeId = localStorage.getItem('parkos_pos_sedeId');
  if (posSedeId) headers['x-sede-id'] = posSedeId;

  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export const api = {
  get:    (url)       => request('GET',    url),
  post:   (url, body) => request('POST',   url, body),
  put:    (url, body) => request('PUT',    url, body),
  patch:  (url, body) => request('PATCH',  url, body),
  delete: (url)       => request('DELETE', url),
};
