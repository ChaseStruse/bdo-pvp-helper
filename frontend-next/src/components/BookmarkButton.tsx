'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { API_BASE } from '@/lib/constants';
import styles from './BookmarkButton.module.css';

export default function BookmarkButton({ title }: { title: string }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.name) return;
    
    // Check if this path is already bookmarked
    fetch(`${API_BASE}/bookmarks?family_name=${encodeURIComponent(session.user.name)}`)
      .then(res => res.ok ? res.json() : [])
      .then((bookmarks: any[]) => {
        setIsBookmarked(bookmarks.some(b => b.guide_path === pathname));
      })
      .catch(console.error);
  }, [status, session, pathname]);

  const toggleBookmark = async () => {
    if (status !== 'authenticated' || !session?.user?.name || loading) {
      if (status === 'unauthenticated') {
        alert("You must be signed in to bookmark guides.");
      }
      return;
    }
    
    setLoading(true);
    try {
      const family_name = session.user.name;
      if (isBookmarked) {
        await fetch(`${API_BASE}/bookmarks`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ family_name, guide_path: pathname })
        });
        setIsBookmarked(false);
      } else {
        await fetch(`${API_BASE}/bookmarks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ family_name, guide_path: pathname, guide_title: title })
        });
        setIsBookmarked(true);
      }
    } catch (e) {
      console.error("Failed to toggle bookmark", e);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <div className={styles.skeleton}></div>;

  return (
    <button 
      className={`${styles.btn} ${isBookmarked ? styles.bookmarked : ''}`} 
      onClick={toggleBookmark}
      disabled={loading}
      title={isBookmarked ? "Remove bookmark" : "Bookmark this guide"}
    >
      <span className={styles.icon}>{isBookmarked ? '★' : '☆'}</span>
      <span className={styles.text}>{isBookmarked ? 'Saved' : 'Save'}</span>
    </button>
  );
}
