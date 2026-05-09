'use client';

import { useRef, useState, useMemo } from 'react';
import { CLASSES, SPECS, ASCENSION_ONLY_CLASSES, API_BASE, DEBUG_USER } from '@/lib/constants';
import { PlayerRow, SortKey } from '@/lib/types';
import styles from './page.module.css';

export default function AoSPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractionResults, setExtractionResults] = useState<PlayerRow[] | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('Dealt');
  const [sortOrder, setSortOrder] = useState<1 | -1>(-1);

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
      const data = await res.json();

      // Map raw backend response { playerName: { Kills, Deaths, ... } }
      // to a flat array of PlayerRow
      const rows: PlayerRow[] = Object.entries(data).map(([name, stats]) => {
        const s = stats as PlayerRow;
        return {
          name,
          ...s,
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
    try {
      const res = await fetch(`${API_BASE}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: DEBUG_USER, data: sortedResults }),
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert(`Successfully saved! Scoreboard ID: ${result.scoreboard_id}`);
      } else {
        throw new Error(result.error);
      }
    } catch (err: unknown) {
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
      {/* Debug user pill */}
      <div className={styles.userPill}>
        <span className={styles.dot} />
        <span>Logged in as: <strong>{DEBUG_USER}</strong> (Debug Mode)</span>
      </div>

      {/* Upload zone */}
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

      {/* Preview */}
      {previewUrl && (
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

          <div style={{ marginTop: '30px', textAlign: 'right' }}>
            {isSaveDisabled && (
              <p style={{ color: '#f85149', fontSize: '0.85rem', marginBottom: '10px' }}>
                * Please select Class and Spec for all players to save.
              </p>
            )}
            <button className="btn" onClick={saveAndUpload} disabled={isSaveDisabled || isExtracting}>
              Save and Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
