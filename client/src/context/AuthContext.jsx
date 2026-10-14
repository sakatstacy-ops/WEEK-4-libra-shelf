import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

export const AuthContext = createContext(null);

async function readResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = Array.isArray(body.fields) ? body.fields.map((field) => `${field.field}: ${field.message}`).join(' ') : '';
    throw new Error(details || body.error || `Request failed (${response.status})`);
  }
  return body;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  const refreshProfile = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/users/profile', { credentials: 'include' });
      const body = await readResponse(response);
      setUser(body.data);
      setStatus('authenticated');
      return body.data;
    } catch {
      setUser(null);
      setStatus('anonymous');
      return null;
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async ({ email, password }) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await readResponse(response);
    setUser(body.data);
    setStatus('authenticated');
    return body.data;
  }, []);

  const register = useCallback(async ({ email, password }) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await readResponse(response);
    setUser(body.data);
    setStatus('authenticated');
    return body.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo(() => ({ user, status, isAuthenticated: Boolean(user), login, register, logout, refreshProfile }), [user, status, login, register, logout, refreshProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
