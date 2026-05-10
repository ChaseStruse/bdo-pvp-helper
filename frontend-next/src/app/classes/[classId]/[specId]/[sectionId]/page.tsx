import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GUIDE_TREE } from '@/lib/guide_config';
import styles from '../page.module.css'; // Reusing parent CSS

export default async function SectionPage({ params }: { params: Promise<{ classId: string, specId: string, sectionId: string }> }) {
  const { classId, specId, sectionId } = await params;

  const cls = GUIDE_TREE[classId];
  if (!cls) notFound();
  
  const spec = cls.specs[specId];
  if (!spec) notFound();

  const section = spec.sections[sectionId];
  if (!section) notFound();

  return (
    <div>
      <div className={styles.breadcrumb}>
        {cls.icon} {cls.label} &nbsp;/&nbsp; {spec.label} &nbsp;/&nbsp;
        <span style={{ color: 'var(--text-color)' }}>{section.label}</span>
      </div>

      <div className={styles.header}>
        <h2 className={styles.title}>{cls.label} {spec.label} — {section.label}</h2>
        <p className={styles.subtitle}>Select a guide to view.</p>
      </div>

      <div className={styles.sectionGrid}>
        {Object.entries(section.topics).map(([topicKey, topic]) => (
          <Link
            key={topicKey}
            href={`/classes/${classId}/${specId}/${sectionId}/${topicKey}`}
            className={styles.sectionCard}
          >
            <span className={styles.sectionLabel}>{topic.label}</span>
            <span className={styles.arrow}>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
