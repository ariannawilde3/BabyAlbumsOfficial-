import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:3001/api';

function getOrCreateGuestId() {
  let id = localStorage.getItem('guestId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('guestId', id);
  }
  return id;
}

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const guestId = localStorage.getItem('guestId');
  if (guestId) headers['x-guest-id'] = guestId;
  return headers;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestId] = useState(getOrCreateGuestId);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setUser(data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function loginWithGoogle(credential) {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ credential }),
    });

    if (!res.ok) throw new Error('Authentication failed');
    const data = await res.json();
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function loginWithEmail(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  const isGuest = !user;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      guestId,
      isGuest,
      loginWithGoogle,
      loginWithEmail,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
