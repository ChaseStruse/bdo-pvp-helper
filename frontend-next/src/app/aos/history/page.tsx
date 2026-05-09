'use client';

import { useState, useEffect } from 'react';
import { API_BASE, DEBUG_USER } from '@/lib/constants';
import { ScoreboardRecord } from '@/lib/types';

export default function AosHistoryPage() {
  const [uploads, setUploads] = useState<ScoreboardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const res = await fetch(`${API_BASE}/history/${DEBUG_USER}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ScoreboardRecord[] = await res.json();
        setUploads(data.map((r) => ({ ...r, expanded: false })));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError('Failed to load uploads: ' + msg);
      } finally {
        setLoading(false);
      }
    };

    fetchUploads();
  }, []);

  const toggleExpand = (id: number) => {
    setUploads((prev) =>
      prev.map((r) => (r.id === id ? { ...r, expanded: !r.expanded } : r))
    );
  };

  return (
    <div className="card">
      <h2 style={{ color: 'var(--primary-color)', marginTop: 0 }}>
        Upload History
        <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: '0.9rem', marginLeft: '10px' }}>
          ({DEBUG_USER})
        </span>
      </h2>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          Loading…
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#f85149' }}>
          {error}
        </div>
      )}

      {!loading && !error && uploads.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          No saved matches found for {DEBUG_USER}. Try uploading a scoreboard first.
        </div>
      )}

      {uploads.map((match) => (
        <div key={match.id} className="history-item">
          <div className="history-header" onClick={() => toggleExpand(match.id)}>
            <div>
              <span className="history-id">#{match.id}</span>
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
                    <tr key={p.name} className={p.Enemy ? 'enemy-row' : ''}>
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
