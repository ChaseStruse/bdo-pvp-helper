'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { API_BASE, DEBUG_USER } from '@/lib/constants';
import { ScoreboardRecord } from '@/lib/types';

export default function AosHistoryPage() {
  const { data: session, status } = useSession();
  // Use email as user_id when authenticated, fall back to DEBUG_USER in dev
  const userId = session?.user?.name ?? DEBUG_USER;
  const displayName = session?.user?.name ?? DEBUG_USER;

  const [uploads, setUploads] = useState<ScoreboardRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    const fetchUploads = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/history/${encodeURIComponent(userId)}`);
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
  }, [userId, status]);

  const toggleExpand = (id: number) => {
    setUploads((prev) =>
      prev.map((r) => (r.id === id ? { ...r, expanded: !r.expanded } : r))
    );
  };

  if (status === 'unauthenticated') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--text-dim)', marginBottom: '20px' }}>
          Sign in to view your upload history.
        </p>
        <Link href="/auth/signin" className="btn">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ color: 'var(--primary-color)', marginTop: 0 }}>
        Upload History
        <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: '0.9rem', marginLeft: '10px' }}>
          ({displayName})
        </span>
      </h2>

      {(loading || status === 'loading') && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          Loading…
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#f85149' }}>{error}</div>
      )}

      {!loading && !error && uploads.length === 0 && status !== 'loading' && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          No saved matches found. Upload a scoreboard to get started.
        </div>
      )}

      {uploads.map((match) => (
        <div key={match.id} className="history-item">
          <div className="history-header" onClick={() => toggleExpand(match.id)}>
            <div>
              <span className="history-id">#{match.id}</span>
              <span className="history-date">{new Date(match.timestamp).toLocaleString()}</span>
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
                    <th>Player</th><th>Class</th><th>Spec</th><th>K/D</th><th>Dealt</th>
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
