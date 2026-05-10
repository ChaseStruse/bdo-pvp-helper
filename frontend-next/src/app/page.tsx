import Link from 'next/link';
import styles from './page.module.css';

// Debug: default user for development
const DEBUG_USER = 'Snoodle';

export default function HomePage() {
  return (
    <div className={`card ${styles.hero}`}>
      <h1 className={styles.welcome}>Welcome, {DEBUG_USER}</h1>
      <p className={styles.subtitle}>
        The ultimate tool for tracking your Arena of Solare performance.
        Extract stats from screenshots, track your climb, and analyze your competition.
      </p>
      <div className={styles.actions}>
        <Link href="/aos">
          <button className="btn">Start Extracting</button>
        </Link>
        <Link href="/uploads">
          <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}>
            View My Uploads
          </button>
        </Link>
      </div>
    </div>
  );
}
