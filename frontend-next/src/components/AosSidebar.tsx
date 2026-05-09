'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AosSidebar.module.css';

const subLinks = [
  { href: '/aos',         label: 'Stats Extractor', icon: '📊' },
  { href: '/aos/history', label: 'Upload History',  icon: '📁' },
  { href: '/aos/search',  label: 'Player Search',   icon: '🔍' },
];

export default function AosSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sectionTitle}>Arena of Solare</div>
      <nav className={styles.nav}>
        {subLinks.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.link} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.icon}>{icon}</span>
              <span>{label}</span>
              {isActive && <span className={styles.activeDot} />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
