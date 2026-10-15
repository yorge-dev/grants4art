'use client';

import { useCallback, useRef, useState } from 'react';
import { SAVED_GRANTS_CHANGED_EVENT, type SavedGrantChange } from '@/lib/browser-storage';

function messageFor(change: SavedGrantChange): string {
  switch (change.action) {
    case 'saved':
      return `Saved "${change.title}" on this device.`;
    case 'removed':
      return `Removed "${change.title}" from saved grants.`;
    case 'error':
      return `Could not update saved grants for "${change.title}" in this browser.`;
    default: {
      const unreachable: never = change;
      return unreachable;
    }
  }
}

export function SaveToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const rootRef = useCallback((node: HTMLDivElement | null) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (timerRef.current && !node) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!node) return;

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<SavedGrantChange>).detail;
      if (!detail) return;
      setMessage(messageFor(detail));
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setMessage(null);
        timerRef.current = null;
      }, 2800);
    };

    window.addEventListener(SAVED_GRANTS_CHANGED_EVENT, onChange);
    cleanupRef.current = () => window.removeEventListener(SAVED_GRANTS_CHANGED_EVENT, onChange);
  }, []);

  return (
    <div ref={rootRef} aria-live="polite" style={{ position: 'fixed', left: 0, right: 0, bottom: '16px', display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 50 }}>
      {message && (
        <p
          role="status"
          className="aol-box"
          style={{
            margin: 0,
            padding: '10px 14px',
            fontSize: '13px',
            maxWidth: 'min(520px, calc(100% - 32px))',
            background: 'var(--background)',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
