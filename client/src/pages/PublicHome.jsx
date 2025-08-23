import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './PublicHome.css';

export default function PublicHome() {
  const { user } = useAuth();

  // If already logged in, send them to the real dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <section className="home">
      <div className="home-hero">
        <h1 className="home-title">Lunara</h1>
        <p className="home-subtitle">
          Moon phases, tarot draws, and a cozy journal — all in one place.
        </p>

        <div className="home-actions">
          <Link to="/signup" className="btn">Create account</Link>
          <Link to="/login" className="btn btn-outline">Log in</Link>
        </div>
      </div>

      <div className="home-grid">
        <div className="home-card">
          <h2>Moon</h2>
          <p>Check today’s phase by location.</p>
          <Link to="/moon" className="card-link">Try Moon →</Link>
        </div>

        <div className="home-card">
          <h2>Tarot</h2>
          <p>Card of the day and quick yes/no.</p>
          <Link to="/tarot" className="card-link">Try Tarot →</Link>
        </div>

        <div className="home-card">
          <h2>Journal</h2>
          <p>Reflect and connect trends over time.</p>
          <span className="card-muted">Sign in to use</span>
        </div>
      </div>
    </section>
  );
}
