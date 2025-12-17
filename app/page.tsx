'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { GrantCard } from '@/components/GrantCard';
import { GrantFilters } from '@/components/GrantFilters';
import { GrantStats } from '@/components/GrantStats';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GrantSubmissionForm } from '@/components/GrantSubmissionForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { HeroSearch } from '@/components/HeroSearch';
import { VersionPatchNotes } from '@/components/VersionPatchNotes';

interface Grant {
  id: string;
  title: string;
  organization: string;
  amount?: string | null;
  amountMin?: number | null;
  amountMax?: number | null;
  deadline?: Date | string | null;
  location: string;
  description: string;
  eligibility?: string | null;
  applicationUrl?: string | null;
  category?: string;
  tags?: Array<{
    tag: {
      name: string;
      slug: string;
    };
  }>;
}

export default function Home() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    categories: [] as string[]
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
    totalAmount: 0
  });
  const [isVersionNotesExpanded, setIsVersionNotesExpanded] = useState(false);
  const [lockedGrantId, setLockedGrantId] = useState<string | null>(null);
  const grantsContainerRef = useRef<HTMLDivElement>(null);

  const prevFiltersRef = useRef(filters);
  const mountedRef = useRef(false);

  const fetchGrants = useCallback(async (currentFilters = filters, currentPage = pagination.page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(currentFilters.search && { search: currentFilters.search }),
        ...(currentFilters.categories.length > 0 && { categories: currentFilters.categories.join(',') })
      });

      const response = await fetch(`/api/grants?${params}`);
      const data = await response.json();
      
      if (response.ok && data.pagination) {
        setGrants(data.grants || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages,
          totalAmount: data.pagination.totalAmount || 0
        }));
      } else {
        console.error('Error fetching grants:', data.error || 'Unknown error');
        setGrants([]);
        setPagination(prev => ({
          ...prev,
          total: 0,
          pages: 0,
          totalAmount: 0
        }));
      }
    } catch (error) {
      console.error('Error fetching grants:', error);
      setGrants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on initial mount
  if (!mountedRef.current) {
    mountedRef.current = true;
    setTimeout(() => {
      fetchGrants(filters, pagination.page);
    }, 0);
  }

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    // Check if filters actually changed
    const prevFilters = prevFiltersRef.current;
    const filtersChanged = 
      prevFilters.search !== newFilters.search ||
      JSON.stringify([...prevFilters.categories].sort()) !== JSON.stringify([...newFilters.categories].sort());
    
    // Update the ref
    prevFiltersRef.current = newFilters;
    
    // Update filters
    setFilters(newFilters);
    
    // Only reset pagination if filters actually changed
    if (filtersChanged) {
      setPagination(prev => ({ ...prev, page: 1 }));
      // Unlock any locked card when filters change
      setLockedGrantId(null);
      // Fetch with new filters and page 1
      fetchGrants(newFilters, 1);
    }
  }, [fetchGrants]);

  const handleLockGrant = useCallback((grantId: string) => {
    setLockedGrantId(grantId);
  }, []);

  const handleUnlockGrant = useCallback(() => {
    setLockedGrantId(null);
  }, []);

  // Handle click outside to unlock
  const clickOutsideHandlerRef = useRef<((event: MouseEvent) => void) | null>(null);
  const lockedGrantIdRef = useRef<string | null>(lockedGrantId);
  
  // Update ref when lockedGrantId changes
  lockedGrantIdRef.current = lockedGrantId;
  
  // Setup click outside handler when lockedGrantId changes
  if (lockedGrantId && !clickOutsideHandlerRef.current) {
    clickOutsideHandlerRef.current = (event: MouseEvent) => {
      // Read from ref to get current value, not closure
      if (lockedGrantIdRef.current && grantsContainerRef.current) {
        const target = event.target as Node;
        if (!grantsContainerRef.current.contains(target)) {
          setLockedGrantId(null);
        }
      }
    };
    document.addEventListener('mousedown', clickOutsideHandlerRef.current);
  } else if (!lockedGrantId && clickOutsideHandlerRef.current) {
    document.removeEventListener('mousedown', clickOutsideHandlerRef.current);
    clickOutsideHandlerRef.current = null;
  }


  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="mx-auto" style={{ maxWidth: '1440px', padding: '0 16px', marginBottom: '24px' }}>
        <div style={{ margin: '16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h1 className="aol-heading-large" style={{ margin: 0, textAlign: 'left', cursor: 'pointer' }}>
                grants4.art
              </h1>
            </Link>
            <a
              href="#version-patch-notes"
              onClick={(e) => {
                e.preventDefault();
                setIsVersionNotesExpanded(true);
                // Small delay to ensure state update happens before scroll
                setTimeout(() => {
                  const element = document.getElementById('version-patch-notes');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 50);
              }}
              style={{
                margin: '4px 0 0 0',
                fontSize: '12px',
                color: 'var(--foreground)',
                opacity: 0.7,
                textDecoration: 'none',
                cursor: 'pointer',
                display: 'block',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
              }}
            >
              Version 0.0.1
            </a>
          </div>
          <div style={{ flexShrink: 0 }}>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto" style={{ maxWidth: '1440px', padding: '0 16px' }}>
        {/* Hero Search */}
        <div style={{ margin: '0 8px 32px 8px' }}>
          <HeroSearch onSearch={(searchTerm) => {
            handleFilterChange({ ...filters, search: searchTerm });
          }} />
        </div>

        {/* Grant Statistics */}
        <div style={{ margin: '0 8px 24px 8px' }}>
          {!loading && <GrantStats totalGrants={pagination.total} totalAmount={pagination.totalAmount} />}
        </div>

        {/* Sidebar Layout: Filters on left, Grants on right */}
        <div style={{ 
          display: 'flex', 
          gap: '24px', 
          alignItems: 'flex-start'
        }} className="flex-col md:flex-row">
          {/* Sidebar Filters */}
          <aside style={{ 
            flexShrink: 0
          }} className="w-full md:w-auto">
            <div style={{ 
              position: 'sticky', 
              top: '20px',
              display: 'flex',
              flexDirection: 'column'
            }} className="w-full md:max-w-[240px]">
              <GrantFilters 
                onFilterChange={handleFilterChange}
                loading={loading}
                page={pagination.page}
                total={pagination.total}
              />
              <div style={{ marginTop: '24px' }}>
                <GrantSubmissionForm />
              </div>
            </div>
          </aside>

          {/* Grants List */}
          <div style={{ flex: 1, minWidth: 0 }} className="w-full md:w-auto">
            {/* Grants Grid */}
            {loading ? (
              <div className="text-center aol-box-inset" style={{ padding: '32px', margin: '0 8px 24px 8px' }}>
                <LoadingSpinner size={28} />
                <p className="compact-mt" style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 'bold', marginTop: '8px' }}>Loading grants...</p>
              </div>
            ) : grants.length === 0 ? (
              <div className="text-center aol-box-inset" style={{ padding: '32px', margin: '0 8px 24px 8px' }}>
                <span className="material-icons" style={{ fontSize: '37px', color: 'var(--foreground)', opacity: 0.5 }}>description</span>
                <h3 className="aol-heading compact-mt" style={{ fontSize: '16px', marginTop: '8px' }}>No grants found</h3>
                <p className="compact-p" style={{ fontSize: '13px', color: 'var(--foreground)', marginTop: '8px' }}>
                  Try adjusting your filters or check back later for new opportunities.
                </p>
              </div>
            ) : (
              <div 
                ref={grantsContainerRef}
                className="grid grid-cols-1 gap-2" 
                style={{ gap: '16px', marginBottom: '24px' }}
              >
                {grants.map((grant) => (
                  <GrantCard 
                    key={grant.id} 
                    grant={grant}
                    isLocked={lockedGrantId === grant.id}
                    onLock={handleLockGrant}
                    onUnlock={handleUnlockGrant}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="compact-mt" style={{ marginTop: '32px', marginBottom: '24px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    const newPage = Math.max(1, pagination.page - 1);
                    setPagination(prev => ({ ...prev, page: newPage }));
                    fetchGrants(filters, newPage);
                  }}
                  disabled={pagination.page === 1}
                  className="aol-button"
                  style={{ opacity: pagination.page === 1 ? 0.5 : 1, cursor: pagination.page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  &lt; Previous
                </button>
                <span className="compact-px compact-py" style={{ padding: '4px 8px', fontSize: '13px', color: 'var(--foreground)', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center' }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => {
                    const newPage = Math.min(pagination.pages, pagination.page + 1);
                    setPagination(prev => ({ ...prev, page: newPage }));
                    fetchGrants(filters, newPage);
                  }}
                  disabled={pagination.page === pagination.pages}
                  className="aol-button"
                  style={{ opacity: pagination.page === pagination.pages ? 0.5 : 1, cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer' }}
                >
                  Next &gt;
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Version Patch Notes */}
      <div className="mx-auto" style={{ maxWidth: '1440px', padding: '0 16px', marginTop: '32px' }}>
        <div style={{ margin: '0 8px' }}>
          <VersionPatchNotes 
            expanded={isVersionNotesExpanded}
            onExpandedChange={setIsVersionNotesExpanded}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mx-auto" style={{ maxWidth: '1440px', padding: '0 16px', marginTop: '32px' }}>
        <footer style={{ margin: '0 8px 16px 8px' }}>
          <p className="text-center" style={{ fontSize: '12px', color: 'var(--foreground)' }}>
            © 2026 Grants4. All rights reserved.
          </p>
          <p className="text-center" style={{ fontSize: '12px', color: 'var(--foreground)', marginTop: '8px' }}>
            Created by <Link href="https://www.yorge.net" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Yorge</Link> (<Link href="https://x.com/yor9e_" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>@yor9e_</Link>)
          </p>
        </footer>
      </div>
    </div>
  );
}
