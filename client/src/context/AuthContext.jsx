import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/apiClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  // hydrate session on first load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.me();
        if (mounted) setUser(data?.user || null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setAuthLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    await api.login(email, password);
    const data = await api.me();
    setUser(data?.user || null);
  }, []);

  const signup = useCallback(async (email, password, displayName) => {
    const res = await api.signup(email, password, displayName);
    setUser(res?.user || null);
    return res?.user || null;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, authLoaded, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
