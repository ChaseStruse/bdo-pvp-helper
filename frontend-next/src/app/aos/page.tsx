'use client';

import { useRef, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CLASSES, SPECS, ASCENSION_ONLY_CLASSES, API_BASE, DEBUG_USER } from '@/lib/constants';
import { PlayerRow, SortKey } from '@/lib/types';
import styles from './page.module.css';

export default function AoSPage() {
  const { data: session, status } = useSession();
  // Use family_name (session.user.name) as user_id so it matches in-game name
  const userId = session?.user?.name ?? DEBUG_USER;
  const displayName = session?.user?.name ?? DEBUG_USER;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractionResults, setExtractionResults] = useState<PlayerRow[] | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('Dealt');
  const [sortOrder, setSortOrder] = useState<1 | -1>(-1);
  const [didWin, setDidWin] = useState<boolean | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'pending' | 'error'>('idle');
  const [showPendingSuccess, setShowPendingSuccess] = useState(false);

  // ── File Handling ──────────────────────────────────────────────────────────

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setExtractionResults(null);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFileSelect(file);
  };

  // ── Extraction ─────────────────────────────────────────────────────────────

  const runExtraction = async () => {
    if (!selectedFile) return;
    setIsExtracting(true);
    setExtractionResults(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${API_BASE}/extract`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Extraction failed');
      const resData = await res.json();
      
      const data = resData.results || resData; // Support both old and new backend formats
      if (resData.image_path) setImagePath(resData.image_path);

      // Map raw backend response { playerName: { Kills, Deaths, ... } }
      // to a flat array of PlayerRow
      const rows: PlayerRow[] = Object.entries(data).map(([name, stats]) => {
        const s = stats as PlayerRow;
        return {
          ...s,
          name,
          selectedClass: s.Class ?? '',
          selectedSpec: s.Spec ?? '',
        };
      });
      setExtractionResults(rows);
    } catch (err) {
      console.error(err);
      alert('Failed to extract stats. Make sure the backend is running.');
    } finally {
      setIsExtracting(false);
    }
  };

  // ── Sorting ────────────────────────────────────────────────────────────────

  const sortBy = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortOrder(-1);
    }
  };

  const sortedResults = useMemo(() => {
    if (!extractionResults) return [];
    return [...extractionResults].sort((a, b) => {
      if (a.Enemy !== b.Enemy) return a.Enemy ? 1 : -1;
      if (sortKey === 'name' || sortKey === 'selectedClass' || sortKey === 'selectedSpec') {
        return a[sortKey].localeCompare(b[sortKey]) * sortOrder;
      }
      return ((a[sortKey] as number) - (b[sortKey] as number)) * sortOrder;
    });
  }, [extractionResults, sortKey, sortOrder]);

  // ── Class/Spec ─────────────────────────────────────────────────────────────

  const handleClassChange = (idx: number, cls: string) => {
    setExtractionResults((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        selectedClass: cls,
        selectedSpec: ASCENSION_ONLY_CLASSES.includes(cls)
          ? 'Ascension'
          : next[idx].selectedSpec === 'Ascension'
          ? 'Awakening'
          : next[idx].selectedSpec,
      };
      return next;
    });
  };

  const handleSpecChange = (idx: number, spec: string) => {
    setExtractionResults((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], selectedSpec: spec };
      return next;
    });
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const isSaveDisabled =
    !sortedResults.length || sortedResults.some((p) => !p.selectedClass || !p.selectedSpec);

  const saveAndUpload = async () => {
    setIsExtracting(true);
    setSaveStatus('saving');
    try {
      const res = await fetch(`${API_BASE}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, data: sortedResults, won: didWin, image_path: imagePath }),
      });
      const result = await res.json();
      if (result.status === 'success') {
        if (result.is_approved) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 5000);
        } else {
          // Clear the form and show the pending success screen
          setShowPendingSuccess(true);
          setExtractionResults(null);
          setSelectedFile(null);
          setPreviewUrl(null);
          setImagePath(null);
          setDidWin(null);
          setSaveStatus('idle');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err: unknown) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert('Failed to save: ' + msg);
    } finally {
      setIsExtracting(false);
    }
  };

  // ── Sort indicator ─────────────────────────────────────────────────────────

  const indicator = (key: SortKey) =>
    sortKey === key ? (sortOrder === 1 ? ' ▲' : ' ▼') : '';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Debug / auth user pill */}
      <div className={styles.userPill}>
        <span className={styles.dot} />
        {status === 'authenticated'
          ? <span>Logged in as: <strong>{displayName}</strong></span>
          : <span style={{ color: '#f0a000' }}>Not signed in — uploads saved as <strong>{DEBUG_USER}</strong> (dev mode)</span>
        }
      </div>

      {/* Login prompt if not authenticated */}
      {status === 'unauthenticated' && (
        <div style={{ background: 'rgba(47,129,247,0.06)', border: '1px solid rgba(47,129,247,0.2)', borderRadius: '8px', padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Sign in to save matches to your profile and track your W/L record.</span>
          <Link href="/auth/signin" className="btn" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>Sign In</Link>
        </div>
      )}

      {/* Pending Success Screen */}
      {showPendingSuccess && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', marginBottom: '20px', borderColor: 'rgba(210, 153, 34, 0.4)', background: 'rgba(210, 153, 34, 0.05)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ color: '#d29922', margin: '0 0 16px 0' }}>Submission successfully submitted</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '30px', fontSize: '1.1rem' }}>
            Awaiting admin approval. Once approved, it will appear on your profile.
          </p>
          <button className="btn btn-primary" onClick={() => setShowPendingSuccess(false)}>
            Upload Another Match
          </button>
        </div>
      )}

      {/* Upload zone */}
      {!showPendingSuccess && (
        <div
          className="upload-zone"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <div className="upload-icon">✦</div>
          <p>{selectedFile ? selectedFile.name : 'Click or drag AoS Scoreboard screenshot here'}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onInputChange}
          />
        </div>
      )}

      {/* Preview */}
      {!showPendingSuccess && previewUrl && (
        <div className="preview-container">
          <img src={previewUrl} className="preview-img" alt="Scoreboard Preview" />
          <div style={{ marginTop: '20px' }}>
            <button className="btn" onClick={runExtraction} disabled={isExtracting}>
              {isExtracting ? 'Extracting…' : 'Extract Stats'}
            </button>
          </div>
        </div>
      )}

      {/* Results table */}
      {extractionResults && (
        <div className="card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <h2 style={{ color: 'var(--primary-color)', marginTop: 0 }}>Extracted Statistics</h2>
          <table className="results-table">
            <thead>
              <tr>
                {(['name', 'selectedClass', 'selectedSpec', 'Kills', 'Deaths', 'CC', 'Dealt', 'Taken', 'Healed'] as SortKey[]).map((key) => (
                  <th key={key} className="sortable" onClick={() => sortBy(key)}>
                    {key === 'selectedClass' ? 'Class' : key === 'selectedSpec' ? 'Spec' : key}
                    {indicator(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((player, idx) => (
                <tr key={player.name} className={player.Enemy ? 'enemy-row' : ''}>
                  <td className="player-name">{player.name}</td>
                  <td>
                    <select
                      className="data-select"
                      value={player.selectedClass}
                      onChange={(e) => handleClassChange(idx, e.target.value)}
                      required
                    >
                      <option value="" disabled>Select Class</option>
                      {CLASSES.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                  </td>
                  <td>
                    <select
                      className="data-select"
                      value={player.selectedSpec}
                      onChange={(e) => handleSpecChange(idx, e.target.value)}
                      required
                    >
                      <option value="" disabled>Select Spec</option>
                      {SPECS.map((spec) => <option key={spec} value={spec}>{spec}</option>)}
                    </select>
                  </td>
                  <td className="stat-value">{player.Kills}</td>
                  <td className="stat-value">{player.Deaths}</td>
                  <td className="stat-value">{player.CC}</td>
                  <td className="stat-value">{player.Dealt.toLocaleString()}</td>
                  <td className="stat-value">{player.Taken.toLocaleString()}</td>
                  <td className="stat-value">{player.Healed.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '30px' }}>
            {/* Win/Loss toggle */}
            <div className={styles.winLoss}>
              <span className={styles.winLossLabel}>Match Result:</span>
              <button
                className={`${styles.resultBtn} ${didWin === true ? styles.winActive : ''}`}
                onClick={() => setDidWin((prev) => (prev === true ? null : true))}
              >
                ✓ Win
              </button>
              <button
                className={`${styles.resultBtn} ${didWin === false ? styles.lossActive : ''}`}
                onClick={() => setDidWin((prev) => (prev === false ? null : false))}
              >
                ✗ Loss
              </button>
              {didWin === null && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Optional</span>
              )}
            </div>

            {isSaveDisabled && (
              <p style={{ color: '#f85149', fontSize: '0.85rem', marginBottom: '10px' }}>
                * Please select Class and Spec for all players to save.
              </p>
            )}
            <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
              {saveStatus === 'saved' && <span style={{ color: '#3fb950', fontSize: '0.9rem', fontWeight: 'bold' }}>✓ Match saved & stats updated!</span>}
              {saveStatus === 'error' && <span style={{ color: '#f85149', fontSize: '0.9rem' }}>Failed to save.</span>}
              
              <button className="btn" onClick={saveAndUpload} disabled={isSaveDisabled || isExtracting || saveStatus === 'saving'}>
                {saveStatus === 'saving' ? 'Saving...' : 'Save and Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
