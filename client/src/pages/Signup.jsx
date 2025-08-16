import React, { useState } from 'react';
import { api } from '../lib/apiClient.js';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await api.signup(email, password, displayName);
      const me = await api.me();
      setMsg(`Registered as ${me?.user?.email}`);
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
