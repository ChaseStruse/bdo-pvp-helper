import { notFound } from 'next/navigation';
import { getGuideContent } from '@/lib/guides';
import { parseCombos } from '@/lib/parse_combos';
import { GUIDE_TREE } from '@/lib/guide_config';
import ComboCard from '@/components/ComboCard';
import BookmarkButton from '@/components/BookmarkButton';
import styles from './page.module.css';

export default async function TopicPage({ params }: { params: Promise<{ classId: string, specId: string, sectionId: string, topicId: string }> }) {
  const { classId, specId, sectionId, topicId } = await params;

  const cls = GUIDE_TREE[classId];
  if (!cls) notFound();
  
  const spec = cls.specs[specId];
  if (!spec) notFound();

  const section = spec.sections[sectionId];
  if (!section) notFound();

  const topic = section.topics[topicId];
  if (!topic) notFound();

  const content = getGuideContent(topic.file);
  if (content === null) {
    return (
      <div className="card">
        <h2 className={styles.title}>{topic.label}</h2>
        <p style={{ color: '#f85149' }}>
          Guide file not found: <code>{topic.file}</code>
        </p>
      </div>
    );
  }

  const combos = parseCombos(content);

  return (
    <div>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        {cls.icon} {cls.label} &nbsp;/&nbsp; {spec.label} &nbsp;/&nbsp; {section.label} &nbsp;/&nbsp;
        <span style={{ color: 'var(--text-color)' }}>{topic.label}</span>
      </div>

      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className={styles.title}>{cls.label} {spec.label} — {section.label} {topic.label}</h1>
          <BookmarkButton title={`${cls.label} ${spec.label} — ${section.label} ${topic.label}`} />
        </div>
        <p className={styles.hint}>
          Click <strong>⛶ Expand</strong> on any combo to view the keybind sequence fullscreen.
        </p>
      </div>

      {combos.map((combo, i) => (
        <ComboCard key={combo.title} combo={combo} index={i} />
      ))}
    </div>
  );
}
