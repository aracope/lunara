/**
 * Dashboard
 *
 * Purpose:
 *  - Landing page for signed-in users with a quick snapshot:
 *    • Personalized welcome (display_name → email → fallback text)
 *    • Account info card
 *    • Quick actions (Moon, Tarot, Journal)
 *    • Recent journal entries (top 3)
 *
 * Data flow:
 *  - On mount, fetches in parallel:
 *      - `api.me()` → current user (gracefully falls back to null on error)
 *      - `api.listJournal()` → journal entries ([] on error)
 *  - Shows "Loading…" until both requests complete.
 *  - Uses an `alive` flag to avoid setting state after unmount.
 * 
 * Flash UX:
 *  - Reads `location.state.flash` (e.g. from Signup/Login redirect)
 *  - Shows a dismissible/auto-clearing notice for 5s
 *  - Clears history state to avoid re-showing on refresh/back
 *
 * Rendering:
 *  - Recent entries list is limited to the 3 most recent: `entries.slice(0, 3)`.
 *  - Each entry displays title, created date, and a 140-char snippet.
 *
 * Accessibility & UX:
 *  - Semantic sectioning and headings.
 *  - Buttons/links route to Moon, Tarot, Journal, and manage account (placeholder).
 *
 * Usage:
 *  - Route-protected page; typically nested under a <ProtectedRoute>.
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/apiClient.js';
import './Dashboard.css';

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  // Read any flash message passed via navigate('/dashboard', { state: { flash: '...' } })
  const [flash, setFlash] = useState(location.state?.flash);

  // Load user + journal once on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [meResp, journal] = await Promise.all([
          api.me().catch(() => ({ user: null })),
          api.listJournal().catch(() => ({ entries: [] })),
        ]);
        if (!alive) return;
        setMe(meResp?.user || null);
        setEntries(journal?.entries || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Auto-clear the flash after 5s
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 5000);
    return () => clearTimeout(t);
  }, [flash]);

  // Remove flash from history state so it won't reappear on refresh/back
  useEffect(() => {
    if (location.state?.flash) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const recent = entries.slice(0, 3);

  return (
    <section className="dash">
      <header className="dash-header">
        <h1 className="dash-title metal-text">
          {me?.display_name
            ? `Welcome, ${me.display_name}`
            : me?.email
              ? `Welcome, ${me.email}`
              : 'Welcome back'}
        </h1>
        <p className="dash-subtitle">Here's your snapshot for today.</p>
      </header>

      {/* Flash notice (auto-clears) */}
      {flash && (
        <div className="notice success" role="status" aria-live="polite">
          {flash}
        </div>
      )}

      {loading && <div className="dash-loading">Loading…</div>}

      {!loading && (
        <div className="dash-grid">
          {/* Account / profile */}
          <article className="dash-card">
            <h2 className="dash-card__title">Account</h2>
            <dl className="dash-kv dash-kv--stack">
              <div>
                <dt>Name</dt>
                <dd>{me?.display_name || '—'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{me?.email || '—'}</dd>
              </div>
              <div>
                <dt>Joined</dt>
                <dd>{me?.created_at ? new Date(me.created_at).toLocaleDateString() : '—'}
                </dd>
              </div>
            </dl>
            <div className="dash-actions">
              <Link to="/journal" className="btn btn--metal">Open Journal</Link>
              <Link to="/signup" className="btn btn--metal-dark">Manage Account
              </Link>
            </div>
          </article>

          {/* Quick actions */}
          <article className="dash-card">
            <h2 className="dash-card__title">Quick actions</h2>
            <div className="dash-actions">
              <Link to="/moon" className="btn btn--metal">Moon today</Link>
              <Link to="/tarot" className="btn btn--metal-dark">Card of the day</Link>
              <Link to="/journal" className="btn btn-outline">New journal entry</Link>
            </div>
          </article>

          {/* Recent entries */}
          <article className="dash-card">
            <h2 className="dash-card__title">Recent entries</h2>
            {recent.length === 0 ? (
              <p className="dash-empty">No entries yet. Your thoughts will appear here.</p>
            ) : (
              <ul className="dash-list">
                {recent.map(e => (
                  <li key={e.id} className="dash-list__item">
                    <Link to="/journal" className="dash-link">
                      <strong>{e.title}</strong>
                    </Link>
                    <span className="dash-muted">
                      {new Date(e.created_at).toLocaleDateString()}
                    </span>
                    <p className="dash-snippet">
                      {e.body.slice(0, 140)}
                      {e.body.length > 140 ? "…" : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="dash-actions">
              <Link to="/journal"
                className="btn btn-outline">
                View all
              </Link>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
