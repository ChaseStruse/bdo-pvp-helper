import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GUIDE_TREE } from '@/lib/guide_config';
import styles from '../page.module.css';

export default async function ClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  
  const cls = GUIDE_TREE[classId];
  if (!cls) notFound();

  return (
    <div>
      <div className={styles.breadcrumb}>
        {cls.icon} <span style={{ color: 'var(--text-color)' }}>{cls.label}</span>
      </div>


      <div className={styles.grid}>
        {Object.entries(cls.specs).map(([specKey, spec]) => (
          <Link
            key={specKey}
            href={`/classes/${classId}/${specKey}`}
            className={`${styles.classCard} ${styles.available}`}
            style={{ textDecoration: 'none' }}
          >
            <div className={styles.classIcon}>❖</div>
            <span className={styles.className}>{spec.label}</span>
            <span className={styles.available_badge}>View Spec →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
