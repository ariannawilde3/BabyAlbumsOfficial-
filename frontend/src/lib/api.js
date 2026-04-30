const API_URL = 'http://localhost:3001/api';

function getHeaders(isJson = true) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    const guestId = localStorage.getItem('guestId');
    if (guestId) {
      headers['x-guest-id'] = guestId;
    }
  }
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function request(method, path, body) {
  const isFormData = body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: getHeaders(!isFormData),
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
  upload: async (files) => {
    const form = new FormData();
    files.forEach((f) => form.append('images', f));
    return request('POST', '/uploads', form);
  },
};

export default api;
