'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuthStatusHandlerProps {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  onAuthenticated: () => void;
}

/** Handles auth redirect and authenticated bootstrap without ref access during render. */
export function AuthStatusHandler({ status, onAuthenticated }: AuthStatusHandlerProps) {
  const router = useRouter();

  const refCallback = useCallback(
    (node: HTMLSpanElement | null) => {
      if (!node) {
        return;
      }

      if (status === 'unauthenticated') {
        router.push('/admin/login');
      } else if (status === 'authenticated') {
        onAuthenticated();
      }
    },
    [status, router, onAuthenticated]
  );

  return <span ref={refCallback} aria-hidden style={{ display: 'none' }} />;
}
