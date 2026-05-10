import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GUIDE_TREE } from '@/lib/guide_config';
import styles from './page.module.css';

export default async function SpecPage({ params }: { params: Promise<{ classId: string, specId: string }> }) {
  const { classId, specId } = await params;
  
  const cls = GUIDE_TREE[classId];
  if (!cls) notFound();
  
  const spec = cls.specs[specId];
  if (!spec) notFound();

  return (
    <div>
      <div className={styles.breadcrumb}>
        {cls.icon} {cls.label} &nbsp;/&nbsp;
        <span style={{ color: 'var(--text-color)' }}>{spec.label}</span>
      </div>

      <div className={styles.header}>
        <h2 className={styles.title}>{cls.label} — {spec.label}</h2>
        <p className={styles.subtitle}>Select a category to browse guides.</p>
      </div>

      <div className={styles.sectionGrid}>
        {Object.entries(spec.sections).map(([sectionKey, section]) => {
          const topicCount = Object.keys(section.topics).length;
          return (
            <Link
              key={sectionKey}
              href={`/classes/${classId}/${specId}/${sectionKey}`}
              className={styles.sectionCard}
            >
              <span className={styles.sectionLabel}>{section.label}</span>
              <span className={styles.topicCount}>{topicCount} guide{topicCount !== 1 ? 's' : ''}</span>
              <span className={styles.arrow}>→</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
