'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { readSavedGrants, SAVED_GRANTS_CHANGED_EVENT } from '@/lib/browser-storage';

export function PublicHeader() {
  const pathname = usePathname();
  const savedSelected = pathname === '/saved';
  const [savedCount, setSavedCount] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const headerRef = useCallback((node: HTMLElement | null) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (!node) return;

    const sync = () => setSavedCount(readSavedGrants().length);
    sync();
    window.addEventListener(SAVED_GRANTS_CHANGED_EVENT, sync);
    cleanupRef.current = () => window.removeEventListener(SAVED_GRANTS_CHANGED_EVENT, sync);
  }, []);

  return (
    <header ref={headerRef} className="mx-auto" style={{ maxWidth: '1440px', padding: '0 16px', marginBottom: '24px' }}>
      <div style={{ margin: '16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1 className="aol-heading-large" style={{ margin: 0, textAlign: 'left' }}>
            grants4.art
          </h1>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <Link
            href="/saved"
            aria-current={savedSelected ? 'page' : undefined}
            aria-label={savedCount > 0 ? `Saved grants, ${savedCount} saved` : 'Saved grants'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              minHeight: '36px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: savedSelected ? 700 : 600,
              borderRadius: '999px',
              border: `1.5px solid ${savedSelected ? 'var(--primary)' : 'var(--secondary)'}`,
              background: savedSelected ? 'var(--primary)' : 'transparent',
              color: savedSelected ? 'var(--background)' : 'var(--foreground)',
            }}
          >
            <span className="material-icons" aria-hidden="true" style={{ fontSize: '18px' }}>bookmark</span>
            Saved
            <span aria-hidden="true">({savedCount})</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
