import React, { useState } from 'react';
import { api } from '../lib/apiClient.js';
import './Tarot.css';

export default function Tarot() {
  const [daily, setDaily] = useState(null);
  const [yn, setYN] = useState(null);
  const [qid, setQid] = useState('1');
  const [card, setCard] = useState(null);

  return (
    <section>
      <h1>Tarot</h1>
      <div className="tarot-actions">
        <button onClick={async () => setDaily(await api.tarotDaily())}>
          Card of Day
        </button>

        <button onClick={async () => setYN(await api.tarotYesNo('Is this the way?'))}>
          Yes/No
        </button>

        <div>
          <input
            value={qid}
            onChange={e => setQid(e.target.value)}
            className="tarot-qid-input"
          />
          <button onClick={async () => setCard(await api.tarotCard(Number(qid)))}>
            Get Card by ID
          </button>
        </div>
      </div>

      <h2>Daily</h2>
      <pre>{JSON.stringify(daily, null, 2)}</pre>

      <h2>Yes/No</h2>
      <pre>{JSON.stringify(yn, null, 2)}</pre>

      <h2>Card by ID</h2>
      <pre>{JSON.stringify(card, null, 2)}</pre>
    </section>
  );
}