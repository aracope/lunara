import React, { useEffect, useState } from 'react';
import { api } from '../lib/apiClient.js';
import JournalMoon from '../components/JournalMoon.jsx';
import './Journal.css';

/**
 * Journal
 *
 * Purpose:
 *  - Allows users to view, add, and optionally attach moon data to journal entries.
 *
 * State:
 *  - entries: list of journal entries fetched from server
 *  - title: input for new entry title
 *  - body: input for new entry body
 *  - attachMoon: boolean, whether to attach today's moon data to new entry
 *
 * Data flow:
 *  - On mount, calls `api.listJournal()` to populate entries.
 *  - On submit:
 *      • Builds payload { title, body }.
 *      • If `attachMoon` is true:
 *          – Computes today’s date in YYYY-MM-DD (tz aware).
 *          – Adds `moonRef` object with date and tz.
 *      • Calls `api.createJournal(payload)`.
 *      • Clears form inputs, then refreshes entries.
 *
 * Rendering:
 *  - Form: title input, body textarea, attachMoon checkbox, add button.
 *  - Entries list:
 *      • Shows title + body for each.
 *      • If entry has `moon_data_id`, renders <JournalMoon refData={...}>.
 *
 * Usage:
 *  - Protected page, usually nested under <ProtectedRoute>.
 */

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState('First entry');
  const [body, setBody] = useState('hello moon + cards');
  const [attachMoon, setAttachMoon] = useState(true);

  async function refresh() {
    try {
      const data = await api.listJournal();
      setEntries(data.entries || []);
    } catch { }
  }
  useEffect(() => { refresh(); }, []);

  async function addEntry(e) {
    e.preventDefault();
    try {
      const payload = { title, body };
      if (attachMoon) {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const date_ymd = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz }).format(new Date());
        payload.moonSnapshot = { date_ymd, tz };
      }
      await api.createJournal(payload);
      setTitle('');
      setBody('');
      refresh();
    } catch { }
  }

  return (
    <section>
      <h1>Journal</h1>

      <form onSubmit={addEntry} className="journal-form">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="title" />
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="body" rows={4} />

        {/* <label className="chip">
          <input type="checkbox" checked={attachMoon} onChange={(e) => setAttachMoon(e.target.checked)} />
          <span>Attach today's moon</span>
        </label> */}

        <button>Add</button>
      </form>

      <h2>Entries</h2>
      <ul className="journal-list">
        {entries.map(e => (
          <li key={e.id} className="journal-item">
            <div><strong>{e.title}</strong> — {e.body}</div>
            {e.moon_snapshot && <JournalMoon snapshot={e.moon_snapshot} />}
          </li>
        ))}
      </ul>
    </section>
  );
}