'use client';

import { useRef, useCallback } from 'react';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeGrantsOptions {
  onInsert?: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
}

/**
 * Subscribes to Postgres changes on the Grant table via Supabase Realtime.
 * Calls the provided callbacks when rows change so the UI can refetch.
 *
 * Returns a ref-callback pair: call `subscribe()` to start and
 * `unsubscribe()` to stop. Designed for use inside event handlers
 * or ref callbacks (no useEffect).
 */
export function useRealtimeGrants(options: UseRealtimeGrantsOptions = {}) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedRef = useRef(false);

  const subscribe = useCallback(() => {
    if (subscribedRef.current) return;
    if (!supabase) return;
    subscribedRef.current = true;

    const channel = supabase
      .channel('grants-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Grant' },
        () => options.onInsert?.()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'Grant' },
        () => options.onUpdate?.()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'Grant' },
        () => options.onDelete?.()
      )
      .subscribe();

    channelRef.current = channel;
  }, [options]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current && supabase) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    subscribedRef.current = false;
  }, []);

  return { subscribe, unsubscribe };
}
