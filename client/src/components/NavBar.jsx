import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './NavBar.css';

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
            <button onClick={logout} className="logout-btn">Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={linkClass}>Login</NavLink>
            <NavLink to="/signup" className={linkClass}>Sign Up</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}