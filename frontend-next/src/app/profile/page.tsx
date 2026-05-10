'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/constants';
import { PlayerProfile } from '@/lib/types';
import styles from './page.module.css';

interface Bookmark {
  id: number;
  guide_path: string;
  guide_title: string;
  created_at: string;
}

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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !session?.user?.name) {
      router.push('/auth/signin');
      return;
    }

    const familyName = session.user.name;

    // Fetch Profile
    fetch(`${API_BASE}/player/${encodeURIComponent(familyName)}`)
      .then(res => res.ok ? res.json() : null)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoadingProfile(false));

    // Fetch Bookmarks
    fetch(`${API_BASE}/bookmarks?family_name=${encodeURIComponent(familyName)}`)
      .then(res => res.ok ? res.json() : [])
      .then(setBookmarks)
      .catch(console.error)
      .finally(() => setLoadingBookmarks(false));
  }, [status, session, router]);

  const removeBookmark = async (path: string) => {
    if (!session?.user?.name) return;
    try {
      const res = await fetch(`${API_BASE}/bookmarks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_name: session.user.name, guide_path: path }),
      });
      if (res.ok) {
        setBookmarks(prev => prev.filter(b => b.guide_path !== path));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (status === 'loading') {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>Loading...</div>;
  }

  const isLoading = loadingProfile || loadingBookmarks;

  return (
    <div>
      <div className={styles.hero}>
        <div className={styles.heroAvatar}>
          {(session?.user?.name ?? 'U')[0].toUpperCase()}
        </div>
        <div className={styles.heroInfo}>
          <h1 className={styles.heroName}>{session?.user?.name}</h1>
          <div className={styles.heroSub}>
            {profile?.main_class && profile.main_class !== 'Unknown'
              ? `${profile.main_class} · ${profile.main_spec}`
              : 'Class not detected'}
          </div>
        </div>
        
        {/* Quick Record summary */}
        {!loadingProfile && profile && (
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
          </div>
        )}
      </div>

      <div className={styles.grid}>
        {/* Left Column: AoS Stats */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Arena of Solare Stats</h2>
            <Link href={`/aos/player/${session?.user?.name}`} className={styles.viewFullBtn}>
              Full Profile →
            </Link>
          </div>
          
          {loadingProfile ? (
            <div className={styles.emptyState}>Loading stats...</div>
          ) : !profile ? (
            <div className={styles.emptyState}>
              No Arena of Solare stats found. Upload matches to see your career stats.
            </div>
          ) : (
            <div className={styles.statsGrid}>
              {STATS.map(({ key, label }) => (
                <div key={key} className={styles.statCard}>
                  <span className={styles.statLabel}>{label}</span>
                  <span className={styles.statAvg}>{fmt(profile.averages[key])}</span>
                  <span className={styles.statTotal}>total: {fmt(profile.totals[key])}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Bookmarks */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Bookmarked Guides</h2>
          </div>
          
          {loadingBookmarks ? (
            <div className={styles.emptyState}>Loading bookmarks...</div>
          ) : bookmarks.length === 0 ? (
            <div className={styles.emptyState}>
              No guides bookmarked yet. Browse the classes section to save guides here!
            </div>
          ) : (
            <div className={styles.bookmarkList}>
              {bookmarks.map((b) => (
                <div key={b.id} className={styles.bookmarkCard}>
                  <Link href={b.guide_path} className={styles.bookmarkLink}>
                    {b.guide_title}
                  </Link>
                  <button
                    className={styles.removeBookmarkBtn}
                    onClick={() => removeBookmark(b.guide_path)}
                    title="Remove bookmark"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
