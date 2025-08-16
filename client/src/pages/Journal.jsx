import React, { useEffect, useState } from 'react';
import { api } from '../lib/apiClient.js';

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState('First entry');
  const [body, setBody] = useState('hello moon + cards');

  async function refresh() {
    try { const data = await api.listJournal(); setEntries(data.entries || []); } catch {}
  }
  useEffect(() => { refresh(); }, []);

  async function addEntry(e) {
    e.preventDefault();
    try { await api.createJournal({ title, body }); setTitle(''); setBody(''); refresh(); } catch {}
  }

  return (
    <section>
      <h1>Journal</h1>
      <form onSubmit={addEntry} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="title" />
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="body" rows={4} />
        <button>Add</button>
      </form>
      <h2>Entries</h2>
      <ul>
        {entries.map(e => <li key={e.id}><strong>{e.title}</strong> — {e.body}</li>)}
      </ul>
    </section>
  );
}
