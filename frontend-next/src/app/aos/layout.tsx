import AosSidebar from '@/components/AosSidebar';
import styles from './layout.module.css';

export default function AosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <AosSidebar />
      <div className={styles.divider} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
