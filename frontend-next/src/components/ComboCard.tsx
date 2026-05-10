'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ComboData } from '@/lib/parse_combos';
import styles from './ComboCard.module.css';

interface Props {
  combo: ComboData;
  index: number;
}

export default function ComboCard({ combo, index }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  // Close on Escape key
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setModalOpen(false);
  }, []);

  useEffect(() => {
    if (modalOpen) {
      document.addEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [modalOpen, onKeyDown]);

  return (
    <>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <span className={styles.comboNumber}>{index + 1}</span>
          <h2 className={styles.comboTitle}>{combo.title}</h2>
        </div>

        {/* Description */}
        {combo.description && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Description</span>
            <p className={styles.description}>{combo.description}</p>
          </div>
        )}

        {/* Inputs w/ Move Names */}
        {combo.inputsWithMoveNames && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Inputs w/ Move Names</span>
            <div className={styles.moveNames}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {combo.inputsWithMoveNames}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Inputs w/ Keybinds — expandable */}
        {combo.keybindSteps.length > 0 && (
          <div className={styles.section}>
            <div className={styles.keybindHeader}>
              <span className={styles.sectionLabel}>Inputs w/ Keybinds</span>
              <button
                className={styles.expandBtn}
                onClick={() => setModalOpen(true)}
                title="View fullscreen"
              >
                ⛶ Expand
              </button>
            </div>
            <div className={styles.keybindFlow}>
              {combo.keybindSteps.map((step, i) => (
                <span key={i} className={styles.keybindStep}>
                  <kbd className={styles.key}>{step}</kbd>
                  {i < combo.keybindSteps.length - 1 && (
                    <span className={styles.arrow}>→</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen modal */}
      {modalOpen && (
        <div className={styles.overlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalSubtitle}>Ninja · Awakening · PvP</p>
                <h2 className={styles.modalTitle}>{combo.title} — Keybinds</h2>
              </div>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              {combo.keybindSteps.map((step, i) => (
                <span key={i} className={styles.keybindStep}>
                  <kbd className={styles.keyLarge}>{step}</kbd>
                  {i < combo.keybindSteps.length - 1 && (
                    <span className={styles.arrowLarge}>→</span>
                  )}
                </span>
              ))}
            </div>
            <p className={styles.modalHint}>Press <kbd className={styles.keySmall}>Esc</kbd> or click outside to close</p>
          </div>
        </div>
      )}
    </>
  );
}
