import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/apiClient.js';

const AuthContext = createContext(null);

/**
 * AuthContext / AuthProvider
 *
 * Purpose:
 *  - Centralizes authentication state and actions (login, signup, logout).
 *  - Provides `user` object and `authLoaded` flag to the app via React Context.
 *  - Hydrates session on first load by calling `api.me()` and updates state accordingly.
 *
 * State:
 *  - user: current authenticated user object, or null if logged out
 *  - authLoaded: boolean, true once the initial session check has completed
 *
 * Methods:
 *  - login(email, password): calls `api.login`, then `api.me`, and updates `user`
 *  - signup(email, password, displayName?): calls `api.signup` and updates `user`
 *  - logout(): calls `api.logout` and clears `user`
 *
 * Behavior:
 *  - On mount, runs an effect to hydrate auth state from the server.
 *  - Uses cleanup flag (`mounted`) to avoid state updates on unmounted components.
 *  - All mutations update `user` in state, so any subscribed component re-renders.
 *
 * Usage:
 *  Wrap your app with <AuthProvider>:
 *
 *    <AuthProvider>
 *      <App />
 *    </AuthProvider>
 *
 *  Then, consume auth state or actions via the `useAuth()` hook:
 *
 *    const { user, login, logout } = useAuth();
 *
 *  Note:
 *  - `useAuth` will throw if called outside of <AuthProvider>.
 *  - Components should wait until `authLoaded` is true before making assumptions
 *    about whether the user is logged in.
 */

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
    const login = useCallback
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (email, password, displayName) => {
    const res = await api.signup(email, password, displayName);
    const u = res?.user || null;
    setUser(u);
    return u;
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
