import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/apiClient.js';
import './Dashboard.css';

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

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

      {loading && <div className="dash-loading">Loading…</div>}

      {!loading && (
        <div className="dash-grid">
          {/* Account / profile */}
          <article className="dash-card">
            <h2 className="dash-card__title">Account</h2>
            <dl className="dash-kv dash-kv--stack">
              <div><dt>Name</dt><dd>{me?.display_name || '—'}</dd></div>
              <div><dt>Email</dt><dd>{me?.email || '—'}</dd></div>
              <div><dt>Joined</dt><dd>{me?.created_at ? new Date(me.created_at).toLocaleDateString() : '—'}</dd></div>
            </dl>
            <div className="dash-actions">
              <Link to="/journal" className="btn btn--metal">Open Journal</Link>
              <Link to="/signup" className="btn btn--metal-dark">Manage Account</Link>
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
                    <p className="dash-snippet">{e.body.slice(0, 140)}{e.body.length > 140 ? '…' : ''}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="dash-actions">
              <Link to="/journal" className="btn btn-outline">View all</Link>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
