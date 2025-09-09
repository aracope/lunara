import React, { useState } from 'react';
import { api } from '../lib/apiClient.js';

/**
 * Signup page
 *
 * Purpose:
 *  - Provides a barebones form for user registration.
 *  - Calls `api.signup(email, password, displayName)` directly.
 *
 * State:
 *  - email, displayName, password: controlled form inputs
 *  - msg: status message after submission (success or error)
 *
 * Behavior:
 *  - On submit:
 *      • Prevents default form behavior.
 *      • Calls `api.signup(...)`.
 *      • On success → shows "Registered as {email}".
 *      • On error → shows the error message.
 *
 * Rendering:
 *  - Simple <form> with email, display name, password, and submit button.
 *  - Status message always rendered in a <p>.
 *
 * Usage:
 *  - Public route at "/signup".
 *  - Serves as a fallback alongside the styled <SignupForm /> version.
 */

export default function Signup() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const res = await api.signup(email, password, displayName);
      setMsg(`Registered as ${res?.user?.email || email}`);

    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <section>
      <h1>Sign Up</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email" />
        <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="display name" />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="password" type="password" />
        <button>Create account</button>
      </form>
      <p>{msg}</p>
    </section>
  );
}
