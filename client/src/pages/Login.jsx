import React, { useState } from 'react';
import { api } from '../lib/apiClient.js';

export default function Login() {
  const [email, setEmail] = useState('ara@example.com');
  const [password, setPassword] = useState('hunter2hunter2');
  const [msg, setMsg] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await api.login(email, password);
      const me = await api.me();
      setMsg(`Logged in as ${me?.user?.email}`);
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <section>
      <h1>Login</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="password" type="password" />
        <button>Login</button>
      </form>
      <p>{msg}</p>
    </section>
  );
}
