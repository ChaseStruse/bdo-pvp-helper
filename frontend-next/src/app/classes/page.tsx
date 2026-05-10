import Link from 'next/link';
import { CLASSES } from '@/lib/constants';
import { GUIDE_TREE } from '@/lib/guide_config';
import styles from './page.module.css';

// Classes that have at least one guide entry
const availableClasses = new Set(Object.keys(GUIDE_TREE));

export default function ClassesPage() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: 'var(--primary-color)', marginBottom: '8px' }}>Classes</h2>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.6, fontSize: '0.95rem' }}>
          Browse class guides for all playable classes in Black Desert Online.
        </p>
      </div>

      <div className={styles.grid}>
        {CLASSES.map((cls) => {
          const key = cls.toLowerCase().replace(' ', '_');
          const hasGuide = availableClasses.has(key);
          const cardContent = (
            <div className={`${styles.classCard} ${hasGuide ? styles.available : ''}`}>
              <div className={styles.classIcon}>⚔</div>
              <span className={styles.className}>{cls}</span>
              <span className={hasGuide ? styles.available_badge : styles.comingSoon}>
                {hasGuide ? 'View Guide →' : 'Coming soon'}
              </span>
            </div>
          );

          return hasGuide ? (
            <Link key={cls} href={`/classes/${key}`} style={{ textDecoration: 'none' }}>
              {cardContent}
            </Link>
          ) : (
            <div key={cls}>{cardContent}</div>
          );
        })}
      </div>
    </div>
  );
}
