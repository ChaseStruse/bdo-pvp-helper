'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/constants';
import { PlayerProfile, ProfileMatch } from '@/lib/types';
import styles from './page.module.css';

const STATS: Array<{ key: keyof PlayerProfile['totals']; label: string }> = [
  { key: 'Kills',  label: 'Kills'   },
  { key: 'Deaths', label: 'Deaths'  },
  { key: 'CC',     label: 'CC'      },
  { key: 'Dealt',  label: 'Damage Dealt'  },
  { key: 'Taken',  label: 'Damage Taken'  },
  { key: 'Healed', label: 'Healed'  },
];

function fmt(n: number) {
  return n >= 1000 ? n.toLocaleString() : n.toString();
}

function WinBadge({ won }: { won: boolean | null }) {
  if (won === null) return <span className={styles.badgeNeutral}>—</span>;
  return won
    ? <span className={styles.badgeWin}>W</span>
    : <span className={styles.badgeLoss}>L</span>;
}

function MatchCard({ match }: { match: ProfileMatch }) {
  const [open, setOpen] = useState(false);
  const ps = match.player_stats;
  return (
    <div className={styles.matchCard}>
      <div className={styles.matchHeader} onClick={() => setOpen(!open)}>
        <div className={styles.matchLeft}>
          <WinBadge won={match.won} />
          <span className={styles.matchDate}>{new Date(match.timestamp).toLocaleString()}</span>
          <span className={styles.matchUploader}>uploaded by {match.uploaded_by}</span>
        </div>
        <div className={styles.matchQuickStats}>
          <span>{ps.Kills}K / {ps.Deaths}D</span>
          <span>{ps.Dealt.toLocaleString()} dmg</span>
          <span className={styles.chevron}>{open ? '▾' : '▸'}</span>
        </div>
      </div>
      {open && (
        <div className={styles.matchBody}>
          <table className="results-table" style={{ fontSize: '0.8rem', marginTop: 0 }}>
            <thead>
              <tr><th>Player</th><th>Class</th><th>Spec</th><th>K/D</th><th>Dealt</th><th>Taken</th></tr>
            </thead>
            <tbody>
              {match.all_players.map((p) => (
                <tr key={p.name} className={p.Enemy ? 'enemy-row' : p.name === match.player_stats.name ? styles.highlightRow : ''}>
                  <td className="player-name">{p.name}</td>
                  <td>{p.selectedClass || p.Class}</td>
                  <td>{p.selectedSpec || p.Spec}</td>
                  <td className="stat-value">{p.Kills} / {p.Deaths}</td>
                  <td className="stat-value">{p.Dealt.toLocaleString()}</td>
                  <td className="stat-value">{p.Taken.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PlayerProfilePage() {
  const params = useParams();
  const playerName = decodeURIComponent(params.name as string);

  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/player/${encodeURIComponent(playerName)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`No data found for "${playerName}"`);
        return r.json();
      })
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [playerName]);

  if (loading) return <div className={styles.center} style={{ color: 'var(--text-dim)' }}>Loading profile…</div>;
  if (error || !profile) return <div className={styles.center} style={{ color: '#f85149' }}>{error}</div>;

  return (
    <div>
      {/* Back link */}
      <Link href="/aos/search" className={styles.back}>← Back to Search</Link>

      {/* Hero card */}
      <div className={styles.hero}>
        <div className={styles.heroAvatar}>{profile.name[0].toUpperCase()}</div>
        <div className={styles.heroInfo}>
          <h1 className={styles.heroName}>{profile.name}</h1>
          <div className={styles.heroSub}>
            {profile.main_class !== 'Unknown'
              ? `${profile.main_class} · ${profile.main_spec}`
              : 'Class not detected'}
          </div>
        </div>
        <div className={styles.heroRecord}>
          <div className={styles.recordItem}>
            <span className={styles.recordVal}>{profile.matches_played}</span>
            <span className={styles.recordLabel}>Matches</span>
          </div>
          {profile.win_rate !== null && (
            <>
              <div className={styles.recordDivider} />
              <div className={styles.recordItem}>
                <span className={`${styles.recordVal} ${styles.win}`}>{profile.wins}W</span>
                <span className={styles.recordLabel}>Wins</span>
              </div>
              <div className={styles.recordDivider} />
              <div className={styles.recordItem}>
                <span className={`${styles.recordVal} ${styles.loss}`}>{profile.losses}L</span>
                <span className={styles.recordLabel}>Losses</span>
              </div>
              <div className={styles.recordDivider} />
              <div className={styles.recordItem}>
                <span className={styles.recordVal}>{profile.win_rate}%</span>
                <span className={styles.recordLabel}>Win Rate</span>
              </div>
            </>
          )}
          {profile.win_rate === null && (
            <>
              <div className={styles.recordDivider} />
              <div className={styles.recordItem}>
                <span className={styles.recordVal} style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>N/A</span>
                <span className={styles.recordLabel}>W/L</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats table */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Career Stats</h2>
        <div className={styles.statsGrid}>
          {STATS.map(({ key, label }) => (
            <div key={key} className={styles.statCard}>
              <span className={styles.statLabel}>{label}</span>
              <span className={styles.statAvg}>{fmt(profile.averages[key])}</span>
              <span className={styles.statTotal}>total: {fmt(profile.totals[key])}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Last 3 matches */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Matches</h2>
        {profile.last_3_matches.length === 0 ? (
          <p style={{ color: 'var(--text-dim)' }}>No matches on record.</p>
        ) : (
          profile.last_3_matches.map((m) => <MatchCard key={m.id} match={m} />)
        )}
      </div>
    </div>
  );
}
