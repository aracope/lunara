import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './PublicHome.css';

/**
 * PublicHome
 *
 * Purpose:
 *  - Public landing page for Lunara.
 *  - Welcomes unauthenticated users with a hero section, feature highlights,
 *    and clear links to sign up or log in.
 *  - Redirects signed-in users to their dashboard.
 *
 * Behavior:
 *  - If `user` exists in AuthContext → immediately <Navigate> to "/dashboard".
 *  - Otherwise renders:
 *      • Hero title, tagline, and CTA buttons.
 *      • Feature cards: Moon, Tarot, Journal.
 *      • Journal card is disabled (sign-in required).
 *
 * Usage:
 *  - Public route at "/".
 *  - Typically the first page new visitors see.
 */

export default function PublicHome() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <section className="home" role="main">
      <div className="home-hero">
        <h1 className="home-title metal-text sheen">
          <span aria-hidden="true" className="home-title__moon" />
          Lunara
        </h1>

        <p className="home-subtitle">
          Moon phases, tarot draws, and a cozy journal — all in one place.
        </p>

        <div className="home-actions">
          <Link to="/signup" className="btn btn--metal">Create account</Link>
          <Link to="/login" className="btn btn--metal-dark">Log in</Link>
        </div>
      </div>

      <div className="home-grid">
        {/* Clickable cards */}
        <Link
          to="/moon"
          className="home-card surface surface--metal-dark card-link-wrapper"
          aria-label="Open Moon page">
          <h2>Moon</h2>
          <p>Check today's phase by location.</p>
          <span className="card-cta">Try Moon →</span>
        </Link>

        <Link
          to="/tarot"
          className="home-card surface surface--metal-dark card-link-wrapper"
          aria-label="Open Tarot page">
          <h2>Tarot</h2>
          <p>Card of the day and quick yes/no.</p>
          <span className="card-cta">Try Tarot →</span>
        </Link>

        <Link
          to="/login"
          className="home-card surface surface--metal-dark card-link-wrapper"
          aria-label="Sign in to access Journal"
        >
          <h2>Journal</h2>
          <p>Reflect and connect trends over time.</p>
          <span className="card-cta">Sign in to use →</span>
        </Link>

      </div>
    </section>
  );
}
