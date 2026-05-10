'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/constants';
import styles from '../auth.module.css';

export default function SignInPage() {
  const [familyName, setFamilyName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Pre-flight check to get the exact error message since NextAuth masks custom errors
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_name: familyName, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Invalid family name or password.');
        setLoading(false);
        return;
      }
    } catch {
      setError('Could not reach the server.');
      setLoading(false);
      return;
    }

    const result = await signIn('credentials', {
      familyName,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid family name or password.');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>BDO PvP Helper</div>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your account</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="familyName">BDO Family Name</label>
            <input
              id="familyName"
              type="text"
              className={styles.input}
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g. Snoodle"
              required
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className={styles.switchText}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className={styles.switchLink}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
