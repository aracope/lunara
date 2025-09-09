import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './NavBar.css';

/**
 * NavBar component
 *
 * Purpose:
 *  - Provides global navigation across the Lunara app.
 *  - Displays different links depending on authentication state.
 *    • Always visible: brand link (home), Moon, Tarot
 *    • Authenticated: Dashboard, Journal, user info, Logout button
 *    • Guest: Login, Sign Up
 *
 * Behavior:
 *  - Uses `NavLink` so the active route is highlighted (`active` class).
 *  - Reads `user` and `logout` from `AuthContext`.
 *  - Displays `user.display_name` if present, else falls back to `user.email`.
 *  - Calls `logout` when the Logout button is clicked.
 *
 * Styling:
 *  - See `NavBar.css` for layout and button styles.
 *
 * Usage:
 *  Place at the top of your app layout so it appears on all pages:
 *
 *  <div>
 *    <NavBar />
 *    <main>
 *      <Outlet />
 *    </main>
 *  </div>
 */

const linkClass = ({ isActive }) =>
  `nav-link ${isActive ? 'active' : ''}`;

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar-header">
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          Lunara
        </Link>

        <NavLink to="/moon" className={linkClass}>Moon</NavLink>
        <NavLink to="/tarot" className={linkClass}>Tarot</NavLink>

        {user ? (
          <>
            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
            <NavLink to="/journal" className={linkClass}>Journal</NavLink>
            <span className="navbar-user">
              {user.display_name || user.email}
            </span>
            <button onClick={logout} className="btn btn-outline logout-btn">Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="nav-link login-link">Login</NavLink>
            <NavLink to="/signup" className={linkClass}>Sign Up</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}