import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const linkStyle = ({ isActive }) => ({
  padding: '0.5rem 0.75rem',
  textDecoration: 'none',
  borderRadius: 8,
  background: isActive ? '#e5e7eb' : 'transparent'
});

export default function NavBar() {
  return (
    <header style={{ borderBottom: '1px solid #e5e7eb' }}>
      <nav style={{ display: 'flex', gap: 12, maxWidth: 900, margin: '0 auto', padding: '1rem' }}>
        <Link to="/" style={{ fontWeight: 700, marginRight: 'auto', textDecoration: 'none' }}>
          Lunara
        </Link>
        <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>
        <NavLink to="/journal" style={linkStyle}>Journal</NavLink>
        <NavLink to="/moon" style={linkStyle}>Moon</NavLink>
        <NavLink to="/tarot" style={linkStyle}>Tarot</NavLink>
        <NavLink to="/login" style={linkStyle}>Login</NavLink>
        <NavLink to="/signup" style={linkStyle}>Sign Up</NavLink>
      </nav>
    </header>
  );
}
