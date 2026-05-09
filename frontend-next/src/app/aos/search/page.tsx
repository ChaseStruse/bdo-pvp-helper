'use client';

import { useState } from 'react';
import { API_BASE } from '@/lib/constants';
import { ScoreboardRecord } from '@/lib/types';

export default function AosSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScoreboardRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`${API_BASE}/search?name=${encodeURIComponent(query)}`);
      const data: ScoreboardRecord[] = await res.json();
      setResults(data.map((r) => ({ ...r, expanded: false })));
    } catch (err) {
      console.error(err);
      alert('Search failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setResults((prev) =>
      prev.map((r) => (r.id === id ? { ...r, expanded: !r.expanded } : r))
    );
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') runSearch();
  };

  return (
    <div className="card">
      <h2 style={{ color: 'var(--primary-color)', marginTop: 0 }}>Player Search</h2>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '20px' }}>
        Search across all uploaded AoS scoreboards by player name.
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          className="data-select"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Enter player name (e.g. Valla)"
        />
        <button className="btn" onClick={runSearch} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
          {loading ? '…' : 'Search'}
        </button>
      </div>

      {hasSearched && results.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          No matches found for &quot;{query}&quot;.
        </div>
      )}

      {results.map((match) => (
        <div key={match.id} className="history-item">
          <div className="history-header" onClick={() => toggleExpand(match.id)}>
            <div>
              <span className="history-id">#{match.id}</span>
              <span style={{ color: 'var(--text-dim)', marginRight: '15px', fontSize: '0.9rem' }}>
                Uploaded by: {match.user_id}
              </span>
              <span className="history-date">
                {new Date(match.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="history-summary">
              {match.expanded ? 'Click to collapse' : 'Click to view details'}
            </div>
          </div>

          {match.expanded && (
            <div className="history-details">
              <table className="results-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Class</th>
                    <th>Spec</th>
                    <th>K/D</th>
                    <th>Dealt</th>
                  </tr>
                </thead>
                <tbody>
                  {match.data.map((p) => (
                    <tr
                      key={p.name}
                      className={[
                        p.Enemy ? 'enemy-row' : '',
                        p.name.toLowerCase() === query.toLowerCase() ? 'search-highlight' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <td className="player-name">{p.name}</td>
                      <td>{p.selectedClass || p.Class}</td>
                      <td>{p.selectedSpec || p.Spec}</td>
                      <td className="stat-value">{p.Kills} / {p.Deaths}</td>
                      <td className="stat-value">{p.Dealt.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
