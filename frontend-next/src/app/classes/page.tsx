import { CLASSES } from '@/lib/constants';
import styles from './page.module.css';

export default function ClassesPage() {
  return (
    <div>
      <div className="card" style={{ marginBottom: '30px' }}>
        <h2 style={{ color: 'var(--primary-color)', marginTop: 0 }}>Classes</h2>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>
          Browse class guides for all playable classes in Black Desert Online.
          Detailed guides — including skill builds, combos, and PvP tips — are coming soon.
        </p>
      </div>

      <div className={styles.grid}>
        {CLASSES.map((cls) => (
          <div key={cls} className={styles.classCard}>
            <div className={styles.classIcon}>⚔</div>
            <span className={styles.className}>{cls}</span>
            <span className={styles.comingSoon}>Guide coming soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}
