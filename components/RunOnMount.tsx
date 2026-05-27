'use client';

import { useCallback, useRef } from 'react';

interface RunOnMountProps {
  onMount: () => void;
}

/** Runs a callback once per mount cycle, via ref callback (not during render). */
export function RunOnMount({ onMount }: RunOnMountProps) {
  const ranRef = useRef(false);

  const refCallback = useCallback(
    (node: HTMLSpanElement | null) => {
      if (!node) {
        ranRef.current = false;
        return;
      }
      if (ranRef.current) {
        return;
      }
      ranRef.current = true;
      onMount();
    },
    [onMount]
  );

  return <span ref={refCallback} aria-hidden style={{ display: 'none' }} />;
}

interface RunOnChangeProps {
  /** Change this key to re-run the callback when dependencies change. */
  changeKey: string;
  onRun: () => void;
}

/** Runs a callback when `changeKey` changes, via remount + ref callback. */
export function RunOnChange({ changeKey, onRun }: RunOnChangeProps) {
  return <RunOnMount key={changeKey} onMount={onRun} />;
}
