'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { PublicHeader } from '@/components/PublicHeader';
import { deadlineLabel, isGrantClosed } from '@/lib/public-grants';
import {
  readSavedGrants,
  removeSavedGrant,
  SAVED_GRANTS_CHANGED_EVENT,
  type SavedGrant,
} from '@/lib/browser-storage';

export default function SavedGrantsPage() {
  const [grants, setGrants] = useState<SavedGrant[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);

  const pageRef = useCallback((node: HTMLDivElement | null) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (!node) return;
    const sync = () => setGrants(readSavedGrants());
    sync();
    window.addEventListener(SAVED_GRANTS_CHANGED_EVENT, sync);
    cleanupRef.current = () => window.removeEventListener(SAVED_GRANTS_CHANGED_EVENT, sync);
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen" style={{ background: 'var(--background)' }}>
      <PublicHeader />
      <main className="mx-auto" style={{ maxWidth: '900px', padding: '0 16px 48px' }}>
        <div style={{ margin: '0 8px 16px' }}>
          <h2 className="aol-heading" style={{ fontSize: '22px', margin: '0 0 8px' }}>Saved grants</h2>
          <p style={{ margin: 0, fontSize: '13px' }}>
            These grants are saved in this browser only. They are not tied to an account and will not appear on another device.
          </p>
        </div>

        {grants.length === 0 ? (
          <div className="aol-box-inset" style={{ margin: '0 8px', padding: '28px', textAlign: 'center' }}>
            <h3 className="aol-heading" style={{ fontSize: '16px', marginTop: 0 }}>No saved grants yet</h3>
            <p style={{ fontSize: '13px', margin: '8px 0 16px' }}>
              Use the bookmark on a grant card to keep it here.
            </p>
            <Link href="/" className="aol-button" style={{ display: 'inline-block', textDecoration: 'none', minHeight: '36px', lineHeight: '24px' }}>
              Browse grants
            </Link>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
            {grants.map((grant) => {
              const closed = isGrantClosed(grant.deadline);
              return (
                <li key={grant.id} className="aol-box" style={{ padding: '16px', opacity: closed ? 0.75 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 className="aol-heading" style={{ fontSize: '16px', margin: '0 0 4px', color: 'var(--primary)' }}>{grant.title}</h3>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>{grant.organization}</p>
                      <p style={{ margin: '8px 0 0', fontSize: '12px', fontWeight: 'bold' }}>
                        {grant.amountLabel ?? 'Amount not listed'}
                        {' · '}
                        <span style={{ color: closed ? '#b71c1c' : 'var(--foreground)' }}>{deadlineLabel(grant.deadline)}</span>
                        {' · '}
                        {grant.location}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {grant.applicationUrl && (
                        <a
                          href={grant.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aol-button-secondary"
                          style={{ textDecoration: 'none', color: 'var(--foreground)', minHeight: '36px', display: 'inline-flex', alignItems: 'center', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}
                        >
                          Apply
                        </a>
                      )}
                      <button
                        type="button"
                        className="aol-button"
                        onClick={() => removeSavedGrant(grant.id)}
                        style={{ minHeight: '36px', fontSize: '12px' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
