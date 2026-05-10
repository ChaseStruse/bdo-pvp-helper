'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/constants';
import styles from '../auth.module.css';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    // Register via Flask backend
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, family_name: familyName }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        setLoading(false);
        return;
      }
    } catch {
      setError('Could not reach the server. Is the backend running?');
      setLoading(false);
      return;
    }

    // Registration successful, requires admin approval
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card} style={{ textAlign: 'center' }}>
          <div className={styles.logo}>BDO PvP Helper</div>
          <h1 className={styles.title} style={{ color: '#3fb950' }}>Registration Submitted</h1>
          <p className={styles.subtitle} style={{ marginBottom: '30px' }}>
            Your account has been created and is pending admin approval. You will be able to log in once an admin approves your request.
          </p>
          <Link href="/auth/signin" className={styles.submitBtn} style={{ display: 'inline-block', textDecoration: 'none' }}>
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>BDO PvP Helper</div>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Track your PvP performance</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="familyName">
              BDO Family Name
            </label>
            <input
              id="familyName"
              type="text"
              className={styles.input}
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g. Snoodle"
              required
              autoComplete="off"
            />
            <span className={styles.hint}>Your in-game family name — used for your player profile.</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
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
              placeholder="min. 8 characters"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link href="/auth/signin" className={styles.switchLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
