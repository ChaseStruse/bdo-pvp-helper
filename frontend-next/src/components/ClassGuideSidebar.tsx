'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { GUIDE_TREE } from '@/lib/guide_config';
import styles from './ClassGuideSidebar.module.css';

export default function ClassGuideSidebar() {
  const pathname = usePathname();

  // Track which classes / specs are expanded (open by default if active)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const classKey of Object.keys(GUIDE_TREE)) {
      init[classKey] = pathname.includes(`/classes/${classKey}`);
      for (const specKey of Object.keys(GUIDE_TREE[classKey].specs)) {
        init[`${classKey}/${specKey}`] = pathname.includes(`/classes/${classKey}/${specKey}`);
        for (const sectionKey of Object.keys(GUIDE_TREE[classKey].specs[specKey].sections)) {
          init[`${classKey}/${specKey}/${sectionKey}`] = pathname.includes(
            `/classes/${classKey}/${specKey}/${sectionKey}`
          );
        }
      }
    }
    return init;
  });

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const isActive = (href: string) => pathname === href;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sectionTitle}>Class Guides</div>
      <nav>
        {Object.entries(GUIDE_TREE).map(([classKey, cls]) => {
          const classExpanded = expanded[classKey];
          return (
            <div key={classKey}>
              {/* Class row */}
              <button
                className={`${styles.treeBtn} ${styles.classBtn}`}
                onClick={() => toggle(classKey)}
              >
                <span className={styles.treeIcon}>{cls.icon}</span>
                <span>{cls.label}</span>
                <span className={`${styles.chevron} ${classExpanded ? styles.open : ''}`}>▸</span>
              </button>

              {classExpanded && Object.entries(cls.specs).map(([specKey, spec]) => {
                const specExpanded = expanded[`${classKey}/${specKey}`];
                return (
                  <div key={specKey} className={styles.indent1}>
                    {/* Spec row */}
                    <button
                      className={`${styles.treeBtn} ${styles.specBtn}`}
                      onClick={() => toggle(`${classKey}/${specKey}`)}
                    >
                      <span>{spec.label}</span>
                      <span className={`${styles.chevron} ${specExpanded ? styles.open : ''}`}>▸</span>
                    </button>

                    {specExpanded && Object.entries(spec.sections).map(([sectionKey, section]) => {
                      const sectionExpanded = expanded[`${classKey}/${specKey}/${sectionKey}`];
                      return (
                        <div key={sectionKey} className={styles.indent2}>
                          {/* Section row */}
                          <button
                            className={`${styles.treeBtn} ${styles.sectionBtn}`}
                            onClick={() => toggle(`${classKey}/${specKey}/${sectionKey}`)}
                          >
                            <span>{section.label}</span>
                            <span className={`${styles.chevron} ${sectionExpanded ? styles.open : ''}`}>▸</span>
                          </button>

                          {sectionExpanded && Object.entries(section.topics).map(([topicKey, topic]) => {
                            const topicHref = `/classes/${classKey}/${specKey}/${sectionKey}/${topicKey}`;
                            const active = isActive(topicHref);
                            return (
                              <div key={topicKey} className={styles.indent3}>
                                <Link
                                  href={topicHref}
                                  className={`${styles.topicLink} ${active ? styles.active : ''}`}
                                >
                                  {active && <span className={styles.activeDot} />}
                                  {topic.label}
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
