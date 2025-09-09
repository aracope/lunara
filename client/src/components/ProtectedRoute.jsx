import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * ProtectedRoute component
 *
 * Purpose:
 *  - Wraps around routes that should only be accessible to authenticated users.
 *  - Checks the authentication state from AuthContext.
 *  - If authentication is still loading, shows a simple "Loading..." state.
 *  - If the user is not logged in, redirects them to the login page.
 *  - If logged in, renders the nested route via <Outlet />.
 *
 * Behavior:
 *  - Uses `authLoaded` to avoid redirecting before the auth state has finished loading.
 *  - Stores the attempted route (`location`) in state so that after login,
 *    the app can navigate back to the original requested page.
 *
 * Usage:
 *  In your `App.jsx` or route config, wrap protected routes like so:
 *
 *  <Route element={<ProtectedRoute />}>
 *    <Route path="/dashboard" element={<Dashboard />} />
 *    <Route path="/journal" element={<Journal />} />
 *  </Route>
 *
 *  This ensures `/dashboard` and `/journal` are only accessible to logged-in users.
 */
export default function ProtectedRoute() {
  const { user, authLoaded } = useAuth();
  const location = useLocation();

  if (!authLoaded) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
