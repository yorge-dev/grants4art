'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { GrantCard } from '@/components/GrantCard';
import { GrantFilters } from '@/components/GrantFilters';
import { GrantStats } from '@/components/GrantStats';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PersonaSelector } from '@/components/PersonaSelector';
import { PublicHeader } from '@/components/PublicHeader';
import { readPersona, writePersona } from '@/lib/browser-storage';
import { useRealtimeGrants } from '@/lib/useRealtimeGrants';
import {
  EMPTY_PUBLIC_FILTERS,
  type GrantStatusFilter,
  type PublicFilters,
  type PublicGrant,
} from '@/lib/public-grants';

function filtersAreActive(filters: PublicFilters): boolean {
  return filters.search.trim().length > 0
    || filters.categories.length > 0
    || filters.persona.length > 0
    || filters.status !== 'all';
}

export default function Home() {
  const [grants, setGrants] = useState<PublicGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PublicFilters>(EMPTY_PUBLIC_FILTERS);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
    totalAmount: 0,
  });

  const filtersRef = useRef(filters);
  const paginationPageRef = useRef(pagination.page);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  const fetchGrants = useCallback(async (
    currentFilters = filtersRef.current,
    currentPage = paginationPageRef.current
  ) => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '25',
      });
      if (currentFilters.search.trim()) params.set('search', currentFilters.search.trim());
      if (currentFilters.categories.length > 0) params.set('categories', currentFilters.categories.join(','));
      if (currentFilters.persona) params.set('tags', currentFilters.persona);
      if (currentFilters.status !== 'all') params.set('status', currentFilters.status);

      const response = await fetch(`/api/grants?${params}`);
      const data = await response.json();

      if (response.ok && data.pagination) {
        setGrants(data.grants || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages,
          totalAmount: data.pagination.totalAmount || 0,
        }));
        setHasLoaded(true);
      } else {
        setGrants([]);
        setLoadError('Grants could not be loaded. Refresh the page and try again.');
        setPagination((prev) => ({ ...prev, total: 0, pages: 0, totalAmount: 0 }));
      }
    } catch (error) {
      console.error('Error fetching grants:', error);
      setGrants([]);
      setLoadError('Grants could not be loaded. Refresh the page and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchCurrent = useCallback(() => {
    fetchGrants();
  }, [fetchGrants]);

  const { subscribe } = useRealtimeGrants();

  const rootRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current) return;
    initializedRef.current = true;

    const persona = readPersona();
    const nextFilters = { ...filtersRef.current, persona };
    filtersRef.current = nextFilters;
    setFilters(nextFilters);
    fetchGrants(nextFilters, 1);
    subscribe({
      onInsert: refetchCurrent,
      onUpdate: refetchCurrent,
      onDelete: refetchCurrent,
    });
  }, [fetchGrants, refetchCurrent, subscribe]);

  const replaceFilters = useCallback((nextFilters: PublicFilters, page = 1) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    filtersRef.current = nextFilters;
    paginationPageRef.current = page;
    setFilters(nextFilters);
    setPagination((prev) => ({ ...prev, page }));
    fetchGrants(nextFilters, page);
  }, [fetchGrants]);

  const handleSearchChange = useCallback((search: string) => {
    const nextFilters = { ...filtersRef.current, search };
    filtersRef.current = nextFilters;
    setFilters(nextFilters);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      paginationPageRef.current = 1;
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchGrants(filtersRef.current, 1);
      searchTimerRef.current = null;
    }, 300);
  }, [fetchGrants]);

  const handlePersonaChange = useCallback((persona: string) => {
    writePersona(persona);
    replaceFilters({ ...filtersRef.current, persona });
  }, [replaceFilters]);

  const handleStatusChange = useCallback((status: GrantStatusFilter) => {
    replaceFilters({ ...filtersRef.current, status });
  }, [replaceFilters]);

  const handleCategoriesChange = useCallback((categories: string[]) => {
    replaceFilters({ ...filtersRef.current, categories });
  }, [replaceFilters]);

  const handleClearFilters = useCallback(() => {
    replaceFilters({ ...filtersRef.current, search: '', categories: [], status: 'all' });
  }, [replaceFilters]);

  const handleClearAll = useCallback(() => {
    writePersona('');
    replaceFilters(EMPTY_PUBLIC_FILTERS);
  }, [replaceFilters]);

  const goToPage = (page: number) => {
    paginationPageRef.current = page;
    setPagination((prev) => ({ ...prev, page }));
    fetchGrants(filtersRef.current, page);
  };

  const filtered = filtersAreActive(filters);

  return (
    <div ref={rootRefCallback} className="min-h-screen" style={{ background: 'var(--background)' }}>
      <PublicHeader />

      <main className="mx-auto" style={{ maxWidth: '1440px', padding: '0 16px' }}>
        <div style={{ margin: '0 8px 24px 8px' }}>
          <PersonaSelector persona={filters.persona} onChange={handlePersonaChange} />
        </div>

        <div style={{ margin: '0 8px 24px 8px' }}>
          <div aria-busy={loading} style={{ visibility: hasLoaded ? 'visible' : 'hidden' }}>
            <GrantStats
              totalGrants={pagination.total}
              totalAmount={pagination.totalAmount}
              filtered={filtered}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }} className="flex-col md:flex-row">
          <aside className="w-full md:w-auto" style={{ flexShrink: 0 }}>
            <div className="w-full md:max-w-[260px] md:sticky md:top-5">
              <GrantFilters
                filters={filters}
                onSearchChange={handleSearchChange}
                onCategoriesChange={handleCategoriesChange}
                onStatusChange={handleStatusChange}
                onClear={handleClearFilters}
              />
            </div>
          </aside>

          <div style={{ flex: 1, minWidth: 0 }} className="w-full md:w-auto">
            {loading && !hasLoaded ? (
              <div className="text-center aol-box-inset" style={{ padding: '32px', margin: '0 8px 24px 8px' }}>
                <LoadingSpinner size={28} />
                <p style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 'bold', marginTop: '8px' }}>Loading grants...</p>
              </div>
            ) : loadError ? (
              <div className="text-center aol-box-inset" role="alert" style={{ padding: '32px', margin: '0 8px 24px 8px' }}>
                <h3 className="aol-heading" style={{ fontSize: '16px', marginTop: 0 }}>Something went wrong</h3>
                <p style={{ fontSize: '13px', marginTop: '8px' }}>{loadError}</p>
              </div>
            ) : grants.length === 0 ? (
              <div className="text-center aol-box-inset" style={{ padding: '32px', margin: '0 8px 24px 8px' }}>
                <h3 className="aol-heading" style={{ fontSize: '16px', marginTop: 0 }}>No grants match your filters</h3>
                <p style={{ fontSize: '13px', margin: '8px 0 16px' }}>
                  Try clearing search, switching the deadline filter, or selecting a different persona.
                </p>
                {filtered && (
                  <button type="button" className="aol-button" onClick={handleClearAll} style={{ minHeight: '36px' }}>
                    Clear search, filters, and persona
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1" aria-busy={loading} style={{ gap: '16px', marginBottom: '24px', opacity: loading ? 0.55 : 1 }}>
                {grants.map((grant) => (
                  <GrantCard key={grant.id} grant={grant} />
                ))}
              </div>
            )}

            {pagination.pages > 1 && (
              <div style={{ marginTop: '32px', marginBottom: '24px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => goToPage(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1}
                  className="aol-button"
                  style={{ opacity: pagination.page === 1 ? 0.5 : 1 }}
                >
                  Previous
                </button>
                <span style={{ padding: '4px 8px', fontSize: '13px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center' }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(Math.min(pagination.pages, pagination.page + 1))}
                  disabled={pagination.page === pagination.pages}
                  className="aol-button"
                  style={{ opacity: pagination.page === pagination.pages ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="mx-auto" style={{ maxWidth: '1440px', padding: '0 16px', marginTop: '32px' }}>
        <footer style={{ margin: '0 8px 16px 8px' }}>
          <p className="text-center" style={{ fontSize: '12px', color: 'var(--foreground)' }}>
            © 2026 Grants4. All rights reserved.
          </p>
          <p className="text-center" style={{ fontSize: '12px', color: 'var(--foreground)', marginTop: '8px' }}>
            Created by <Link href="https://www.yorge.net" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Yorge</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
