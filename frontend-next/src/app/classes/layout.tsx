import ClassGuideSidebar from '@/components/ClassGuideSidebar';
import styles from './layout.module.css';

export default function ClassesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <ClassGuideSidebar />
      <div className={styles.divider} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
