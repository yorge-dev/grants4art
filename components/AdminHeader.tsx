'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function AdminHeader() {
  return (
    <div style={{ margin: '4px', padding: '4px', border: 'none' }}>
      <div className="mx-auto" style={{ maxWidth: '1440px', padding: '0 16px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ gap: '4px' }}>
            <Link
              href="/admin/grants/new"
              className="aol-button"
              style={{ textDecoration: 'none', fontSize: '12px', padding: '3px 8px' }}
            >
              + Add Grant
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="aol-button-secondary"
              style={{ fontSize: '12px', padding: '3px 8px', border: 'none', cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

