'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

const links = [
  { href: '/',        label: 'Home' },
  { href: '/aos',     label: 'Arena of Solare' },
  { href: '/classes', label: 'Classes' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>BDO PvP Helper</Link>
      <nav className={styles.nav}>
        {links.map(({ href, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
