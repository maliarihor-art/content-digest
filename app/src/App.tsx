import { useEffect, useMemo, useState } from 'react';
import { buildDigest } from '@/digest/digest';
import { addCard, groupByCategory, loadBoard, saveBoard } from '@/board/store';
import type { Board, Card } from '@/board/types';

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

const styles = {
  page: { fontFamily: 'system-ui, sans-serif', maxWidth: 1100, margin: '0 auto', padding: '2rem' },
  field: { display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' as const },
  button: { padding: '0.6rem 1.2rem', fontSize: '1rem', cursor: 'pointer', borderRadius: 6, border: '1px solid #444', background: '#1f2937', color: '#fff' },
  board: { display: 'flex', flexWrap: 'wrap' as const, gap: '1rem', marginTop: '2rem', alignItems: 'flex-start' },
  section: { flex: '1 1 320px', minWidth: 280, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem', background: '#fafafa' },
  card: { border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.75rem', marginBottom: '0.75rem', background: '#fff' },
  tag: { display: 'inline-block', fontSize: '0.75rem', background: '#eef2ff', color: '#3730a3', borderRadius: 999, padding: '0.1rem 0.5rem', marginRight: 4, marginTop: 4 },
};

function CardView({ card }: { card: Card }) {
  return (
    <article style={styles.card}>
      <h3 style={{ margin: '0 0 0.25rem' }}>{card.title}</h3>
      {card.source && (
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>{card.source}</p>
      )}
      <p style={{ margin: '0 0 0.5rem' }}>{card.digest.summary}</p>
      {card.digest.keyPoints.length > 0 && (
        <ul style={{ margin: '0 0 0.5rem', paddingLeft: '1.1rem' }}>
          {card.digest.keyPoints.map((point, i) => (
            <li key={i} style={{ fontSize: '0.9rem' }}>{point}</li>
          ))}
        </ul>
      )}
      <div>
        {card.digest.tags.map((tag) => (
          <span key={tag} style={styles.tag}>#{tag}</span>
        ))}
      </div>
    </article>
  );
}

export default function App() {
  const [board, setBoard] = useState<Board>(() => loadBoard());
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');

  useEffect(() => {
    saveBoard(board);
  }, [board]);

  const sections = useMemo(() => groupByCategory(board), [board]);
  const canAdd = text.trim().length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    const trimmedSource = source.trim();
    const card: Card = {
      id: newId(),
      title: title.trim() || 'Untitled',
      ...(trimmedSource ? { source: trimmedSource } : {}),
      createdAt: new Date().toISOString(),
      digest: buildDigest(text),
    };
    setBoard((b) => addCard(b, card));
    setText('');
    setTitle('');
    setSource('');
  };

  return (
    <main style={styles.page}>
      <header>
        <h1 style={{ marginBottom: '0.25rem' }}>Content Digest</h1>
        <p style={{ color: '#6b7280', marginTop: 0 }}>
          Paste an article&apos;s text. Get a summary, key points, tags, and a category — filed onto
          a board by topic. Everything runs locally; your board is saved in this browser.
        </p>
      </header>

      <section aria-label="New digest">
        <input
          style={styles.field}
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          style={styles.field}
          placeholder="Source / link label (optional)"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <textarea
          style={{ ...styles.field, minHeight: 160, resize: 'vertical' }}
          placeholder="Paste the article text here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button style={styles.button} onClick={handleAdd} disabled={!canAdd}>
          Add digest
        </button>
      </section>

      {sections.length === 0 ? (
        <p style={{ marginTop: '2rem', color: '#9ca3af' }}>
          No cards yet — paste some text above to create your first digest.
        </p>
      ) : (
        <div style={styles.board}>
          {sections.map((section) => (
            <div key={section.category} style={styles.section}>
              <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>
                {section.category}{' '}
                <span style={{ color: '#9ca3af', fontWeight: 400 }}>({section.cards.length})</span>
              </h2>
              {section.cards.map((card) => (
                <CardView key={card.id} card={card} />
              ))}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
