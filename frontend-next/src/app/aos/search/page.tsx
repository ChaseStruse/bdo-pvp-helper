'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/constants';
import { PlayerProfile } from '@/lib/types';
import styles from './page.module.css';

export default function AosSearchPage() {
  const [query, setQuery] = useState('');
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    setProfile(null);
    try {
      const res = await fetch(`${API_BASE}/player/${encodeURIComponent(query.trim())}`);
      if (res.status === 404) {
        setProfile(null);
      } else if (res.ok) {
        const data: PlayerProfile = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') runSearch();
  };

  return (
    <div>
      <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', marginTop: 0 }}>Player Search</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
        <input
          type="text"
          className="data-select"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Enter exact player name (e.g. Snoodle)"
        />
        <button className="btn" onClick={runSearch} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
          {loading ? '…' : 'Search'}
        </button>
      </div>

      {hasSearched && !loading && !profile && (
        <div className={styles.empty}>No data found for &quot;{query}&quot;.</div>
      )}

      {profile && (
        <div
          className={styles.playerCard}
          onClick={() => router.push(`/aos/player/${encodeURIComponent(profile.name)}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && router.push(`/aos/player/${encodeURIComponent(profile.name)}`)}
        >
          <div className={styles.cardLeft}>
            <div className={styles.playerAvatar}>{profile.name[0].toUpperCase()}</div>
            <div>
              <div className={styles.playerName}>{profile.name}</div>
              <div className={styles.playerMeta}>
                {profile.main_class !== 'Unknown' ? `${profile.main_class} · ${profile.main_spec}` : 'Class Unknown'}
              </div>
            </div>
          </div>

          <div className={styles.cardStats}>
            <div className={styles.stat}>
              <span className={styles.statVal}>{profile.matches_played}</span>
              <span className={styles.statLabel}>Matches</span>
            </div>
            {profile.win_rate !== null ? (
              <>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <span className={`${styles.statVal} ${styles.win}`}>{profile.wins}W</span>
                  <span className={styles.statLabel}>Wins</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <span className={`${styles.statVal} ${styles.loss}`}>{profile.losses}L</span>
                  <span className={styles.statLabel}>Losses</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <span className={styles.statVal}>{profile.win_rate}%</span>
                  <span className={styles.statLabel}>Win Rate</span>
                </div>
              </>
            ) : (
              <>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <span className={styles.statVal} style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>N/A</span>
                  <span className={styles.statLabel}>W/L (no data)</span>
                </div>
              </>
            )}
          </div>

          <div className={styles.cardArrow}>View Profile →</div>
        </div>
      )}
    </div>
  );
}
