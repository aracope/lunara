import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/apiClient.js';
import { useNavigate } from 'react-router-dom';
import '../styles/forms.css';
import '../styles/buttons.css';
import '../pages/Account.css';

export default function AccountManagement() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState();

  // Email change
  const [email, setEmail] = useState(user?.email || '');
  useEffect(() => { setEmail(user?.email || ''); }, [user?.email]);
  const [savingEmail, setSavingEmail] = useState(false);

  // Password change
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  async function onSaveEmail(e) {
    e.preventDefault();
    setStatus(undefined);
    setSavingEmail(true);
    try {
      await api.updateEmail(email.trim());
      await refresh();
      setStatus('Email updated.');
    } catch (err) {
      setStatus(err.message || 'Failed to update email');
    } finally {
      setSavingEmail(false);
    }
  }

  async function onSavePassword(e) {
    e.preventDefault();
    setStatus(undefined);
    if (!currentPw || !newPw) return setStatus('Please fill out both password fields.');
    if (newPw.length < 8) return setStatus('New password must be at least 8 characters.');
    if (newPw === currentPw) return setStatus('New password must be different from current password.');
    setSavingPw(true);
    try {
      await api.updatePassword(currentPw, newPw);
      setCurrentPw(''); setNewPw('');
      setStatus('Password updated.');
    } catch (err) {
      setStatus(err.message || 'Failed to update password');
    } finally {
      setSavingPw(false);
    }
  }

  async function onDeactivate() {
    if (!confirm('Deactivate your account? You will be signed out immediately.')) return;
    try {
      await api.deactivate();
      await logout();
      navigate('/', { replace: true, state: { flash: 'Your account has been deactivated.' } });
    } catch (err) {
      setStatus(err.message || 'Unable to deactivate account.');
    }
  }

  return (
    <section className="settings" role="main">
      <header>
        <h1 className="metal-text">Account</h1>
        <p>Manage your email, password, and account status.</p>
        {status && (
          <div className="notice" role="status" aria-live="polite">
            {status}
          </div>
        )}
      </header>

      <article className="surface surface--metal-dark surface--padded">
        <h2>Profile</h2>
        <dl className="dash-kv dash-kv--stack">
          <div><dt>Name</dt><dd>{user?.display_name || '—'}</dd></div>
          <div><dt>Email</dt><dd>{user?.email || '—'}</dd></div>
          <div><dt>Joined</dt><dd>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</dd></div>
        </dl>
      </article>

      <article className="surface surface--metal-dark surface--padded">
        <h2>Change email</h2>
        <form onSubmit={onSaveEmail} className="auth__form" noValidate>
          <div className="auth__fields">
            <div className="field">
              <label htmlFor="new-email">New email</label>
              <input id="new-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
          </div>
          <div className="auth__actions">
            <button
              className="btn btn--metal"
              disabled={savingEmail || !email.trim() || email.trim() === (user?.email || '')}
            >
              {savingEmail ? 'Saving…' : 'Save email'}
            </button>
          </div>
        </form>
      </article>

      <article className="surface surface--metal-dark surface--padded">
        <h2>Change password</h2>
        <form onSubmit={onSavePassword} className="auth__form" noValidate>
          <div className="auth__fields">
            <div className="field">
              <label htmlFor="current-password">Current password</label>
              <input id="current-password" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required autoComplete="current-password" />
            </div>
            <div className="field">
              <label htmlFor="new-password">New password</label>
              <input id="new-password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required autoComplete="new-password" />
            </div>
          </div>
          <div className="auth__actions">
            <button className="btn btn--metal-dark" disabled={savingPw}>
              {savingPw ? 'Saving…' : 'Save password'}
            </button>
          </div>
        </form>
      </article>

      <article className="surface surface--metal-dark surface--padded">
        <h2>Danger zone</h2>
        <p>Deactivate your account. You'll need to sign up again to use Lunara.</p>
        <button className="btn btn-outline" onClick={onDeactivate}>Deactivate my account</button>
      </article>
    </section>
  );
}
