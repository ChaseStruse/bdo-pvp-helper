'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

const baseLinks = [
  { href: '/',        label: 'Home' },
  { href: '/aos',     label: 'Arena of Solare' },
  { href: '/classes', label: 'Classes' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.name) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001'}/auth/admin_status/${encodeURIComponent(session.user.name)}`)
        .then(res => res.json())
        .then(data => setIsAdmin(data.is_admin))
        .catch(console.error);
    } else {
      setIsAdmin(false);
    }
  }, [status, session]);

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>BDO PvP Helper</Link>

      <nav className={styles.nav}>
        {(isAdmin ? [...baseLinks, { href: '/admin', label: 'Admin' }] : baseLinks).map(({ href, label }) => {
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

      {/* Auth area */}
      <div className={styles.authArea}>
        {status === 'loading' && (
          <div className={styles.skeleton} />
        )}

        {status === 'unauthenticated' && (
          <div className={styles.authButtons}>
            <Link href="/auth/signin" className={styles.signInBtn}>Sign In</Link>
            <Link href="/auth/signup" className={styles.signUpBtn}>Create Account</Link>
          </div>
        )}

        {status === 'authenticated' && session.user && (
          <div className={styles.userMenu}>
            <Link href="/profile" className={styles.profileLink}>
              <div className={styles.avatarFallback}>
                {(session.user.name ?? 'A')[0].toUpperCase()}
              </div>
              <span className={styles.userName}>{session.user.name}</span>
            </Link>
            <button
              className={styles.logoutBtn}
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
