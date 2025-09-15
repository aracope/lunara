import React, { useEffect, useState } from 'react';
import { api } from '../lib/apiClient.js';
import './Tarot.css';

/**
 * Tarot page
 *
 * Purpose:
 *  - Lets users: draw a daily card, ask a yes/no question, or browse card details.
 *
 * Data sources (apiClient):
 *  - tarotList(): fetches full deck metadata for the <select> (grouped by Major/Minor suits)
 *  - tarotDaily(): returns one random "card of the day"
 *  - tarotYesNo(question?): returns { answer|result|outcome, reason?, card? }
 *  - tarotCard(id): returns details for a specific card by id
 *
 * State:
 *  - daily: last "card of the day" result (null when not drawn)
 *  - yn: last yes/no result (null when not asked)
 *  - card: currently selected card details (null when not fetched)
 *  - allCards: list of all cards (for the select dropdown)
 *  - selectedId: id from the dropdown (string)
 *
 * Rendering:
 *  - Hero header and three actions:
 *      • Button → "Card of the day"
 *      • Form → Yes/No question
 *      • Form → Select card and fetch
 *  - Results grid shows panels for any of {daily, yn, card} that are present.
 *
 * Components:
 *  - TarotCardView: tolerant to { card: {...} } or a flat card object.
 *  - YesNoBadge: displays Yes/No/Maybe label with a style class.
 *
 * Resilience:
 *  - Each call uses try/catch; on failure, section simply stays unchanged.
 */

function groupCards(cards) {
  const majors = cards.filter(c => c.arcana === 'Major');
  const bySuit = {
    Cups: cards.filter(c => c.arcana === 'Minor' && c.suit === 'Cups'),
    Swords: cards.filter(c => c.arcana === 'Minor' && c.suit === 'Swords'),
    Wands: cards.filter(c => c.arcana === 'Minor' && c.suit === 'Wands'),
    Pentacles: cards.filter(c => c.arcana === 'Minor' && c.suit === 'Pentacles'),
  };
  return { majors, bySuit };
}

function TarotCardView({ data }) {
  if (!data) return null;
  const card = data.card || data; // tolerate {card:{...}} or flat
  const name = card?.name || '—';
  const arcana = card?.arcana || '—';
  const suit = card?.suit || (arcana === 'Major' ? null : '—');
  const upright = card?.upright_meaning || '—';
  const reversed = card?.reversed_meaning || '—';
  const img = card?.image_url;

  return (
    <div className="tarot-card">
      <header className="tarot-card__header">
        <h3 className="tarot-card__title metal-text">{name}</h3>
        <div className="tarot-card__meta">
          <span>{arcana}{suit ? ` · ${suit}` : ''}</span>
        </div>
      </header>

      {img && (
        <div className="tarot-card__media">
          <img alt={name} src={img} loading="lazy" />
        </div>
      )}

      <dl className="tarot-kv">
        <div><dt>Upright</dt><dd>{upright}</dd></div>
        <div><dt>Reversed</dt><dd>{reversed}</dd></div>
      </dl>
    </div>
  );
}

function YesNoBadge({ data }) {
  if (!data) return null;
  const raw = (data.answer || data.result || data.outcome || '').toString().toLowerCase();
  const label = raw ? (raw[0].toUpperCase() + raw.slice(1)) : '—';
  const cls =
    raw === 'yes' ? 'tarot-badge tarot-badge--yes'
      : raw === 'no' ? 'tarot-badge tarot-badge--no'
        : 'tarot-badge tarot-badge--maybe';
  return <span className={cls}>{label}</span>;
}

export default function Tarot() {
  const [daily, setDaily] = useState(null);
  const [yn, setYN] = useState(null);
  const [card, setCard] = useState(null);

  // NEW state for list/select
  const [allCards, setAllCards] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const list = await api.tarotList();
        const cards = Array.isArray(list) ? list : (list.cards || []);
        setAllCards(cards);
      } catch {
        setAllCards([]);
      }
    })();
  }, []);

  async function pullDaily() {
    try { setDaily(await api.tarotDaily()); } catch { }
  }
  async function askYesNo(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const q = (form.get('q') || '').toString();
    try { setYN(await api.tarotYesNo(q || undefined)); } catch { }
  }
  async function fetchSelectedCard(e) {
    e.preventDefault();
    const idNum = Number(selectedId);
    if (!Number.isInteger(idNum) || idNum <= 0) return;
    try { setCard(await api.tarotCard(idNum)); } catch { }
  }

  const { majors, bySuit } = groupCards(allCards);


  return (
    <section className="tarot">
      <header className="tarot-hero">
        <h1 className="metal-text">Tarot</h1>
        {/* , ask a yes/no, or browse a specific card */}
        <p className="tarot-subtitle">Draw a daily card.</p>
      </header>

      <div className="tarot-actions">
        <button className="btn btn--metal" onClick={pullDaily}>
          Card of the day
        </button>
        {/*
        <form className="tarot-yesno" onSubmit={askYesNo}>
          <input name="q" placeholder="Ask a yes/no question" />
          <button className="btn btn--metal-dark" type="submit">Yes / No</button>
        </form>
        <form className="tarot-byid" onSubmit={fetchSelectedCard}>
          <label className="sr-only" htmlFor="tarot-card-select">Choose a card</label>

           <select
            id="tarot-card-select"
            className="tarot-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="" disabled>Pick a card…</option> */}

        {/* Major Arcana */}
        {/* {majors.length > 0 && (
              <optgroup label="— Major Arcana —">
                {majors.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            )} */}

        {/* Minor by suit */}
        {/* {['Cups', 'Swords', 'Wands', 'Pentacles'].map(suit => (
              bySuit[suit] && bySuit[suit].length > 0 ? (
                <optgroup key={suit} label={`— Minor — ${suit} —`}>
                  {bySuit[suit].map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              ) : null
            ))}
          </select> 

          <button className="btn btn-outline" type="submit" disabled={!selectedId}>
            Get card
          </button>
        </form>*/}
      </div>

      <div className="tarot-grid">
        {daily && (
          <article className="tarot-panel surface surface--metal-dark">
            <h2 className="tarot-panel__title">Card of the day</h2>
            <TarotCardView data={daily} />
          </article>
        )}

        {yn && (
          <article className="tarot-panel surface surface--metal-dark">
            <h2 className="tarot-panel__title">Yes / No</h2>
            <div className="tarot-yn-row">
              <YesNoBadge data={yn} />
              {yn?.reason && <span className="tarot-muted">· {yn.reason}</span>}
            </div>
            {yn?.card && (
              <>
                <h3 className="tarot-panel__subtitle">Drawn card</h3>
                <TarotCardView data={yn} />
              </>
            )}
          </article>
        )}

        {card && (
          <article className="tarot-panel surface surface--metal-dark">
            <h2 className="tarot-panel__title">Card details</h2>
            <TarotCardView data={card} />
          </article>
        )}
      </div>
    </section>
  );
}