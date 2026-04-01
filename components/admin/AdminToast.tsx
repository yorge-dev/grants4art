'use client';

import { useRef } from 'react';

export interface AdminToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AdminToastProps {
  toasts: AdminToastMessage[];
  onDismiss: (id: number) => void;
}

const TOAST_STYLES: Record<AdminToastMessage['type'], { bg: string; border: string }> = {
  success: { bg: 'var(--color-saddle-brown-600)', border: 'var(--secondary)' },
  error: { bg: '#b71c1c', border: '#d32f2f' },
  info: { bg: 'var(--primary)', border: 'var(--secondary)' },
};

export function AdminToast({ toasts, onDismiss }: AdminToastProps) {
  const toastRef = useRef<HTMLDivElement>(null);

  if (toasts.length === 0) return null;

  return (
    <div
      ref={toastRef}
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10001,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '90vw',
        width: '400px',
      }}
    >
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: `2px solid ${style.border}`,
              background: style.bg,
              color: 'white',
              fontSize: '13px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.9,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
