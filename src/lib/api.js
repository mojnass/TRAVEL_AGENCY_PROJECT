const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'patronus_auth_token';

const buildUrl = (path, params = {}) => {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return API_BASE_URL ? `${url.pathname}${url.search}` : `${url.pathname}${url.search}`;
};

export const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(body?.error || body?.message || body || 'Request failed');
  }

  return body;
};

export const apiGet = (path, params) => apiRequest(buildUrl(path, params));

export const apiPost = (path, payload) => apiRequest(path, {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const apiPatch = (path, payload = {}) => apiRequest(path, {
  method: 'PATCH',
  body: JSON.stringify(payload),
});

export const apiPut = (path, payload) => apiRequest(path, {
  method: 'PUT',
  body: JSON.stringify(payload),
});

export const apiDelete = (path) => apiRequest(path, { method: 'DELETE' });
