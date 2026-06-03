import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('bakery_token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync token to LocalStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('bakery_token', token);
    } else {
      localStorage.removeItem('bakery_token');
    }
  }, [token]);

  // Fetch the logged-in user profile on load or token change
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token expired or invalid
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Error validating session:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const loginWithGoogleMock = async (mockProfile) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: mockProfile.name,
        email: mockProfile.email,
        picture: mockProfile.picture || '',
        googleId: mockProfile.id || 'mock-id-12345'
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Google login failed');
    }

    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // Helper to attach authorization header and automatically prepend base URL for relative paths
  const authFetch = async (url, options = {}) => {
    const headers = options.headers || {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const finalUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    return fetch(finalUrl, {
      ...options,
      headers,
    });
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await authFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Error refreshing user session:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, loginWithGoogleMock, logout, authFetch, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
