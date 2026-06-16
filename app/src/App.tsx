import { useEffect, useMemo, useState } from 'react';
import { requestDigest } from '@/digest/ai/client';
import {
  addCard,
  groupByCategory,
  loadBoard,
  recategorize,
  removeCard,
  saveBoard,
  updateCardTitle,
} from '@/board/store';
import { CATEGORIES } from '@/digest/category';
import type { Category } from '@/digest/types';
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
  cardControls: { display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' as const },
  iconButton: { fontSize: '0.8rem', cursor: 'pointer', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', color: '#374151', padding: '0.2rem 0.5rem' },
  select: { fontSize: '0.8rem', padding: '0.2rem 0.4rem', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff' },
  titleInput: { fontSize: '1rem', fontWeight: 600, padding: '0.2rem 0.4rem', borderRadius: 6, border: '1px solid #d1d5db', width: '100%', boxSizing: 'border-box' as const },
};

function CardView({
  card,
  onDelete,
  onRename,
  onRecategorize,
}: {
  card: Card;
  onDelete: () => void;
  onRename: (title: string) => void;
  onRecategorize: (category: Category) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(card.title);

  const startEdit = () => {
    setDraftTitle(card.title);
    setEditing(true);
  };
  const commitEdit = () => {
    onRename(draftTitle);
    setEditing(false);
  };

  return (
    <article style={styles.card}>
      {editing ? (
        <input
          style={styles.titleInput}
          aria-label="Edit title"
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <h3 style={{ margin: '0 0 0.25rem' }}>{card.title}</h3>
      )}
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
      <div style={styles.cardControls}>
        {!editing && (
          <button type="button" style={styles.iconButton} onClick={startEdit}>
            Edit title
          </button>
        )}
        <label>
          <span style={{ fontSize: '0.75rem', color: '#6b7280', marginRight: 4 }}>Category</span>
          <select
            style={styles.select}
            aria-label="Card category"
            value={card.digest.category}
            onChange={(e) => onRecategorize(e.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          style={{ ...styles.iconButton, color: '#b91c1c', borderColor: '#fecaca', marginLeft: 'auto' }}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default function App() {
  const [board, setBoard] = useState<Board>(() => loadBoard());
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    saveBoard(board);
  }, [board]);

  const sections = useMemo(() => groupByCategory(board), [board]);
  const canAdd = text.trim().length > 0 && !loading;

  const handleAdd = async () => {
    if (!canAdd) return;
    setLoading(true);
    setNotice(null);
    const trimmedSource = source.trim();
    const outcome = await requestDigest(text);
    const card: Card = {
      id: newId(),
      title: title.trim() || 'Untitled',
      ...(trimmedSource ? { source: trimmedSource } : {}),
      createdAt: new Date().toISOString(),
      digest: outcome.digest,
    };
    setBoard((b) => addCard(b, card));
    setNotice(outcome.source === 'local' ? (outcome.notice ?? null) : null);
    setText('');
    setTitle('');
    setSource('');
    setLoading(false);
  };

  const handleDelete = (id: string) => setBoard((b) => removeCard(b, id));
  const handleRename = (id: string, newTitle: string) =>
    setBoard((b) => updateCardTitle(b, id, newTitle));
  const handleRecategorize = (id: string, category: Category) =>
    setBoard((b) => recategorize(b, id, category));

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
          {loading ? 'Summarizing…' : 'Add digest'}
        </button>
        {loading && (
          <span role="status" style={{ marginLeft: '0.75rem', color: '#6b7280' }}>
            Asking the AI…
          </span>
        )}
        {notice && (
          <p role="status" style={{ marginTop: '0.75rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '0.5rem 0.75rem' }}>
            {notice}
          </p>
        )}
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
                <CardView
                  key={card.id}
                  card={card}
                  onDelete={() => handleDelete(card.id)}
                  onRename={(t) => handleRename(card.id, t)}
                  onRecategorize={(c) => handleRecategorize(card.id, c)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
