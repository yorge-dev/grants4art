'use client';

import { useCallback, type RefObject } from 'react';

interface ClickOutsideListenerProps {
  containerRef: RefObject<HTMLElement | null>;
  onOutsideClick: () => void;
}

/** Listens for clicks outside a container; mounts/unmounts with the component. */
export function ClickOutsideListener({ containerRef, onOutsideClick }: ClickOutsideListenerProps) {
  const refCallback = useCallback(
    (node: HTMLSpanElement | null) => {
      if (!node) {
        return;
      }

      const handler = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          onOutsideClick();
        }
      };

      document.addEventListener('mousedown', handler);
      return () => {
        document.removeEventListener('mousedown', handler);
      };
    },
    [containerRef, onOutsideClick]
  );

  return <span ref={refCallback} aria-hidden style={{ display: 'none' }} />;
}
