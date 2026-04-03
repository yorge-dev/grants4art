'use client';

import { useState, useRef, useCallback, useMemo, type DragEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format, isValid } from 'date-fns';
import { AdminGrantSubmissionForm, type AdminGrantSubmission } from '@/components/AdminGrantSubmissionForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AdminAddSourceForm } from '@/components/admin/AdminAddSourceForm';
import { AdminSourcesTable } from '@/components/admin/AdminSourcesTable';
import { AdminGrantPreviewCard } from '@/components/admin/AdminGrantPreviewCard';
import { AdminToast, type AdminToastMessage } from '@/components/admin/AdminToast';
import {
  DraggableTableTh,
  getAdminTableColumnDragData,
  setAdminTableColumnDragData,
} from '@/components/admin/DraggableTableTh';
import {
  ADMIN_GRANT_TABLE_COLUMN_ORDER_KEY,
  DEFAULT_GRANT_COLUMN_ORDER,
  normalizeGrantColumnOrder,
  reorderColumnIds,
} from '@/lib/adminTableColumnOrder';

interface Grant {
  id: string;
  title: string;
  organization: string;
  amount?: string | null;
  amountMin?: number | null;
  amountMax?: number | null;
  deadline?: Date | string | null;
  location: string;
  eligibility?: string;
  description?: string;
  applicationUrl?: string | null;
  discoveredAt: Date | string;
  approvedAt?: Date | string | null;
  approvedBy?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  category?: string;
  scrapeJob?: {
    grantSource: {
      isActive: boolean;
    } | null;
  } | null;
  tags?: Array<{
    tag: {
      name: string;
    };
  }>;
}

interface GrantSource {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  lastScraped?: string | null;
}

interface ScrapeJob {
  id: string;
  sourceUrl: string;
  status: string;
  discoveredCount: number;
  errorMessage?: string | null;
  createdAt: Date | string;
  completedAt?: Date | string | null;
  grantSource?: { name: string };
  grants: Array<{
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
  }>;
}

const formatSafeDate = (dateValue: Date | string | null | undefined, formatString: string = 'MMM d, yyyy') => {
  if (!dateValue) return 'Unknown';

  const date = new Date(dateValue);
  return isValid(date) ? format(date, formatString) : 'Invalid Date';
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Grant State
  const [pendingGrants, setPendingGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Grant | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });

  // Column Visibility State
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [isColumnSettingsHovered, setIsColumnSettingsHovered] = useState(false);
  const columnSettingsRef = useRef<HTMLDivElement>(null);
  const columnSettingsHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load column visibility from localStorage or use defaults
  const getDefaultColumnVisibility = () => ({
    title: true,
    organization: true,
    location: true,
    amountMin: true,
    amountMax: true,
    deadline: true,
    applicationUrl: true,
    category: true,
    tags: true,
    createdAt: true,
  });

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('grantTableColumnVisibility');
      if (saved) {
        try {
          return { ...getDefaultColumnVisibility(), ...JSON.parse(saved) };
        } catch {
          return getDefaultColumnVisibility();
        }
      }
    }
    return getDefaultColumnVisibility();
  });

  // Save column visibility to localStorage
  const updateColumnVisibility = (column: string, visible: boolean) => {
    const newVisibility = { ...columnVisibility, [column]: visible };
    setColumnVisibility(newVisibility);
    if (typeof window !== 'undefined') {
      localStorage.setItem('grantTableColumnVisibility', JSON.stringify(newVisibility));
    }
  };

  const [grantColumnOrder, setGrantColumnOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(ADMIN_GRANT_TABLE_COLUMN_ORDER_KEY);
      if (raw) {
        try {
          return normalizeGrantColumnOrder(JSON.parse(raw));
        } catch {
          return [...DEFAULT_GRANT_COLUMN_ORDER];
        }
      }
    }
    return [...DEFAULT_GRANT_COLUMN_ORDER];
  });

  const [draggingGrantColumn, setDraggingGrantColumn] = useState<string | null>(null);

  const visibleGrantColumnOrder = useMemo(
    () => grantColumnOrder.filter((id) => id === 'actions' || columnVisibility[id]),
    [grantColumnOrder, columnVisibility]
  );

  const handleGrantColDragStart = (e: DragEvent, id: string) => {
    setAdminTableColumnDragData(e, id);
    setDraggingGrantColumn(id);
  };

  const handleGrantColDragEnd = () => setDraggingGrantColumn(null);

  const handleGrantColDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGrantColDrop = (e: DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = getAdminTableColumnDragData(e);
    if (!sourceId || sourceId === targetId) {
      setDraggingGrantColumn(null);
      return;
    }
    setGrantColumnOrder((prev) => {
      const next = reorderColumnIds(prev, sourceId, targetId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_GRANT_TABLE_COLUMN_ORDER_KEY, JSON.stringify(next));
      }
      return next;
    });
    setDraggingGrantColumn(null);
  };

  const grantColDragProps = {
    draggingColumnId: draggingGrantColumn,
    onColumnDragStart: handleGrantColDragStart,
    onColumnDragEnd: handleGrantColDragEnd,
    onColumnDragOver: handleGrantColDragOver,
    onColumnDrop: handleGrantColDrop,
  };

  // Scraper State
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [sources, setSources] = useState<GrantSource[]>([]);
  const [submissions, setSubmissions] = useState<AdminGrantSubmission[]>([]);
  const [submissionsRefreshing, setSubmissionsRefreshing] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [scraping, setScraping] = useState(false);
  const [previewingGrantId, setPreviewingGrantId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<AdminToastMessage[]>([]);
  const toastIdRef = useRef(0);
  const [grantPendingDelete, setGrantPendingDelete] = useState<Grant | null>(null);
  const [deletePermanentAcknowledged, setDeletePermanentAcknowledged] = useState(false);
  const [deletingGrantId, setDeletingGrantId] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: AdminToastMessage['type']) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Declare fetch functions as function declarations (hoisted) before they're used
  async function fetchPendingGrants() {
    try {
      const response = await fetch('/api/grants?limit=1000');
      const data = await response.json();
      setPendingGrants(data.grants || []);
    } catch (error) {
      console.error('Error fetching grants:', error);
    }
  }

  async function fetchJobs() {
    try {
      const response = await fetch('/api/scrape');
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching scrape jobs:', error);
    }
  }

  async function fetchSources() {
    try {
      const response = await fetch('/api/scrape/sources');
      const data = await response.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  }

  async function fetchSubmissions() {
    try {
      const response = await fetch('/api/grants/submissions');
      const data = await response.json();
      if (response.ok) {
        setSubmissions(data.submissions || []);
      } else {
        console.error('Error fetching submissions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  }

  const refreshSubmissions = async () => {
    setSubmissionsRefreshing(true);
    try {
      await fetchSubmissions();
    } finally {
      setSubmissionsRefreshing(false);
    }
  };

  const authCheckedRef = useRef(false);
  const prevStatusRef = useRef(status);

  // Handle auth status changes
  if (status !== prevStatusRef.current) {
    prevStatusRef.current = status;
    authCheckedRef.current = false;
  }

  if (!authCheckedRef.current) {
    authCheckedRef.current = true;
    if (status === 'unauthenticated') {
      setTimeout(() => router.push('/admin/login'), 0);
    } else if (status === 'authenticated') {
      Promise.all([
        fetchPendingGrants(),
        fetchJobs(),
        fetchSources(),
        fetchSubmissions(),
      ]).finally(() => setLoading(false));
    }
  }

  // Grant Sorting
  const handleSort = (key: keyof Grant) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedGrants = [...pendingGrants].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const compareResult = aValue < bValue ? -1 : 1;
    return sortConfig.direction === 'asc' ? compareResult : -compareResult;
  });

  const dashboardSearchNormalized = useMemo(
    () => dashboardSearch.trim().toLowerCase(),
    [dashboardSearch]
  );

  const filteredSources = useMemo(() => {
    if (!dashboardSearchNormalized) return sources;
    return sources.filter(
      (s) =>
        s.name.toLowerCase().includes(dashboardSearchNormalized) ||
        s.url.toLowerCase().includes(dashboardSearchNormalized)
    );
  }, [sources, dashboardSearchNormalized]);

  // Scraper Handlers
  const handleScrapeSource = async (sourceId: string) => {
    if (scraping) return;
    setScraping(true);
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId })
      });

      const result = await response.json();
      
      if (result.success) {
        showToast(`Grant discovered: ${result.grant?.title || 'Unknown'}`, 'success');
        fetchJobs();
        fetchSources();
        fetchPendingGrants();
      } else {
        showToast(
          result.message || result.error || 'No grant information found',
          'error'
        );
        fetchJobs();
        fetchSources();
      }
    } catch (error) {
      console.error('Error scraping source:', error);
      showToast('Error scraping source', 'error');
    } finally {
      setScraping(false);
    }
  };

  const handleAddSource = async (name: string, url: string) => {
    const response = await fetch('/api/scrape/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url })
    });
    const result = await response.json();
    if (result.source) {
      fetchSources();
      return { success: true };
    }
    return { success: false, error: result.error || 'Failed to add source' };
  };

  const handleToggleSource = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/scrape/sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      fetchSources();
      fetchPendingGrants();
    } catch (error) {
      console.error('Error toggling source:', error);
      showToast('Failed to toggle source', 'error');
    }
  };

  const openDeleteGrantDialog = (grant: Grant) => {
    setGrantPendingDelete(grant);
    setDeletePermanentAcknowledged(false);
  };

  const closeDeleteGrantDialog = () => {
    setGrantPendingDelete(null);
    setDeletePermanentAcknowledged(false);
    setDeletingGrantId(null);
  };

  const confirmDeleteGrant = async () => {
    if (!grantPendingDelete || !deletePermanentAcknowledged) return;
    const id = grantPendingDelete.id;
    setDeletingGrantId(id);
    try {
      const response = await fetch(`/api/grants/${id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setPendingGrants((prev) => prev.filter((g) => g.id !== id));
        showToast('Grant permanently deleted', 'success');
        closeDeleteGrantDialog();
      } else if (response.status === 401) {
        showToast(data.error || 'You must be signed in to delete grants', 'error');
      } else {
        showToast(data.error || 'Failed to delete grant', 'error');
      }
    } catch (error) {
      console.error('Error deleting grant:', error);
      showToast('Failed to delete grant', 'error');
    } finally {
      setDeletingGrantId(null);
    }
  };

  const SortableHeaderInner = ({ label, sortKey }: { label: string; sortKey: keyof Grant }) => (
    <div
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: 'bold',
        color: 'var(--foreground)',
      }}
      onClick={() => handleSort(sortKey)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSort(sortKey);
        }
      }}
      role="button"
      tabIndex={0}
    >
      {label}
      {sortConfig.key === sortKey && (
        <span style={{ fontSize: '10px' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
      )}
    </div>
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="flex items-center justify-center" style={{ minHeight: '200px' }}>
          <div className="text-center aol-box-inset" style={{ padding: '16px' }}>
            <LoadingSpinner size={28} />
            <p className="compact-mt" style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 'bold' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <AdminToast toasts={toasts} onDismiss={dismissToast} />

      <main className="mx-auto" style={{ maxWidth: '1440px', padding: '0 16px', marginTop: '8px' }}>
        <div className="compact-mb" style={{ marginBottom: '8px', margin: '0 8px 16px 8px' }}>
          <h1 className="aol-heading-large compact-mb" style={{ fontSize: '23px', marginBottom: '2px' }}>Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 'bold' }}>
            {pendingGrants.length} total grants
          </p>
        </div>

        <AdminAddSourceForm
          onAdd={handleAddSource}
          onMessage={showToast}
        />

        {/* Grant Preview Section */}
        {previewingGrantId && (() => {
          const source = sources.find(s => s.id === previewingGrantId);
          if (!source) return null;
          const sourceJobs = jobs.filter(job => job.grantSource?.name === source.name);
          const latestJob = sourceJobs.find(job => job.grants && job.grants.length > 0);
          if (!latestJob || !latestJob.grants || latestJob.grants.length === 0) return null;
          
          return (
            <div style={{ margin: '0 8px 16px 8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--primary)' }}>
                Grant Preview: {source.name}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {latestJob.grants.map((grant) => (
                  <AdminGrantPreviewCard key={grant.id} grant={grant} />
                ))}
              </div>
            </div>
          );
        })()}

        <div className="aol-box" style={{ margin: '0 8px 16px 8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons" style={{ fontSize: '16px', color: 'var(--foreground)', opacity: 0.6 }}>
              search
            </span>
            <input
              type="search"
              value={dashboardSearch}
              onChange={(e) => setDashboardSearch(e.target.value)}
              placeholder="Search grant sources and user submissions..."
              className="aol-input"
              style={{ flex: 1 }}
              aria-label="Search grant sources and submissions"
            />
          </div>
          <p style={{ fontSize: '11px', color: 'var(--foreground)', marginTop: '10px', marginBottom: 0, opacity: 0.7 }}>
            Filters the grant source table and user submission list. Grant inventory below is unchanged.
          </p>
        </div>

        <AdminSourcesTable
          sources={filteredSources}
          jobs={jobs}
          scraping={scraping}
          previewingGrantId={previewingGrantId}
          onScrape={handleScrapeSource}
          onToggle={handleToggleSource}
          onPreviewToggle={setPreviewingGrantId}
          onMessage={showToast}
        />

        {/* Grant Table Section */}
        {pendingGrants.length === 0 ? (
          <div className="aol-box-inset text-center" style={{ padding: '16px', margin: '0 8px 32px 8px' }}>
            <span className="material-icons" style={{ fontSize: '37px', color: 'var(--foreground)', opacity: 0.5 }}>description</span>
            <h3 className="aol-heading compact-mt" style={{ fontSize: '16px', marginTop: '4px' }}>No grants yet</h3>
            <p style={{ fontSize: '13px', color: 'var(--foreground)' }}>
              Start by adding your first grant.
            </p>
          </div>
        ) : (
          <div style={{ margin: '0 8px 32px 8px' }}>
            {/* Table Header with Column Settings */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', position: 'relative' }}>
              {/* Column Settings Button */}
            <div 
              style={{ position: 'relative', zIndex: 20 }}
              onMouseEnter={() => {
                if (columnSettingsHideTimeoutRef.current) {
                  clearTimeout(columnSettingsHideTimeoutRef.current);
                  columnSettingsHideTimeoutRef.current = null;
                }
                setIsColumnSettingsHovered(true);
                setShowColumnSettings(true);
              }}
              onMouseLeave={() => {
                columnSettingsHideTimeoutRef.current = setTimeout(() => {
                  setIsColumnSettingsHovered(false);
                  setShowColumnSettings(false);
                  columnSettingsHideTimeoutRef.current = null;
                }, 150);
              }}
            >
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--foreground)',
                  opacity: isColumnSettingsHovered ? 1 : 0.7,
                  transition: 'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderRadius: '4px'
                }}
                title="Column Settings"
                aria-label="Column Settings"
              >
                <span className="material-icons" style={{ fontSize: '20px' }}>build</span>
              </button>
              
              {/* Column Settings Dropdown */}
              {showColumnSettings && (
                <div
                  ref={columnSettingsRef}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    background: 'var(--text-field-bg)',
                    border: '2px solid var(--secondary)',
                    borderRadius: '8px',
                    padding: '8px',
                    minWidth: '200px',
                    zIndex: 10000,
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                  }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {[
                        { key: 'title', label: 'Title' },
                        { key: 'organization', label: 'Organization' },
                        { key: 'location', label: 'Location' },
                        { key: 'amountMin', label: 'Amount Min' },
                        { key: 'amountMax', label: 'Amount Max' },
                        { key: 'deadline', label: 'Deadline' },
                        { key: 'applicationUrl', label: 'Application URL' },
                        { key: 'category', label: 'Funding Source' },
                        { key: 'tags', label: 'Tags' },
                        { key: 'createdAt', label: 'Live Date' },
                      ].map((col) => {
                        const isVisible = columnVisibility[col.key] ?? true;
                        return (
                          <button
                            key={col.key}
                            onClick={() => updateColumnVisibility(col.key, !isVisible)}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              fontSize: '12px',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: 'transparent',
                              color: 'var(--foreground)',
                              border: 'none',
                              opacity: isVisible ? 1 : 0.5,
                              fontWeight: isVisible ? '600' : 'normal',
                              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                              cursor: 'pointer',
                              borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => {
                              if (!isVisible) {
                                e.currentTarget.style.opacity = '0.7';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isVisible) {
                                e.currentTarget.style.opacity = '0.5';
                              }
                            }}
                          >
                            <span style={{ flex: 1, opacity: isVisible ? 1 : 0.5 }}>
                              {col.label}
                            </span>
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                border: isVisible ? 'none' : `2px solid var(--secondary)`,
                                backgroundColor: isVisible ? 'var(--accent)' : 'transparent',
                                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                flexShrink: 0
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="aol-box" style={{ overflow: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', fontSize: '11px', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: 'var(--inset-bg)' }}>
                  {visibleGrantColumnOrder.map((colId) => {
                    const thBase = {
                      className: 'compact-px compact-py' as const,
                      style: {
                        padding: '4px 6px' as const,
                        textAlign: 'left' as const,
                        fontWeight: 'bold' as const,
                        color: 'var(--foreground)',
                        whiteSpace: 'nowrap' as const,
                      },
                    };
                    switch (colId) {
                      case 'actions':
                        return (
                          <DraggableTableTh
                            key={colId}
                            columnId={colId}
                            {...grantColDragProps}
                            className="compact-px compact-py"
                            style={{
                              padding: '4px 6px',
                              textAlign: 'right',
                              fontWeight: 'bold',
                              color: 'var(--foreground)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span style={{ fontWeight: 'bold' }}>Actions</span>
                          </DraggableTableTh>
                        );
                      case 'title':
                        return (
                          <DraggableTableTh key={colId} columnId={colId} {...grantColDragProps} {...thBase}>
                            <SortableHeaderInner label="Title" sortKey="title" />
                          </DraggableTableTh>
                        );
                      case 'organization':
                        return (
                          <DraggableTableTh key={colId} columnId={colId} {...grantColDragProps} {...thBase}>
                            <SortableHeaderInner label="Organization" sortKey="organization" />
                          </DraggableTableTh>
                        );
                      case 'location':
                        return (
                          <DraggableTableTh key={colId} columnId={colId} {...grantColDragProps} {...thBase}>
                            <SortableHeaderInner label="Location" sortKey="location" />
                          </DraggableTableTh>
                        );
                      case 'amountMin':
                        return (
                          <DraggableTableTh key={colId} columnId={colId} {...grantColDragProps} {...thBase}>
                            <SortableHeaderInner label="Amount Min" sortKey="amountMin" />
                          </DraggableTableTh>
                        );
                      case 'amountMax':
                        return (
                          <DraggableTableTh key={colId} columnId={colId} {...grantColDragProps} {...thBase}>
                            <SortableHeaderInner label="Amount Max" sortKey="amountMax" />
                          </DraggableTableTh>
                        );
                      case 'deadline':
                        return (
                          <DraggableTableTh key={colId} columnId={colId} {...grantColDragProps} {...thBase}>
                            <SortableHeaderInner label="Deadline" sortKey="deadline" />
                          </DraggableTableTh>
                        );
                      case 'applicationUrl':
                        return (
                          <DraggableTableTh key={colId} columnId={colId} {...grantColDragProps} {...thBase}>
                            <span style={{ fontWeight: 'bold', color: 'var(--foreground)' }}>Application URL</span>
                          </DraggableTableTh>
                        );
                      case 'category':
                        return (
                          <DraggableTableTh key={colId} columnId={colId} {...grantColDragProps} {...thBase}>
                            <SortableHeaderInner label="Funding Source" sortKey="category" />
                          </DraggableTableTh>
                        );
                      case 'tags':
                        return (
                          <DraggableTableTh key={colId} columnId={colId} {...grantColDragProps} {...thBase}>
                            <span style={{ fontWeight: 'bold', color: 'var(--foreground)' }}>Tags</span>
                          </DraggableTableTh>
                        );
                      case 'createdAt':
                        return (
                          <DraggableTableTh key={colId} columnId={colId} {...grantColDragProps} {...thBase}>
                            <SortableHeaderInner label="Live Date" sortKey="createdAt" />
                          </DraggableTableTh>
                        );
                      default:
                        return null;
                    }
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedGrants.map((grant) => {
                  const grantSourceDisabled =
                    grant.scrapeJob?.grantSource != null && !grant.scrapeJob.grantSource.isActive;
                  return (
                  <tr key={grant.id} style={{ opacity: grantSourceDisabled ? 0.6 : 1 }}>
                    {visibleGrantColumnOrder.map((colId) => {
                      switch (colId) {
                        case 'actions':
                          return (
                            <td key={colId} className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', flexWrap: 'nowrap' }}>
                                <button
                                  type="button"
                                  onClick={() => router.push(`/admin/grants/${grant.id}`)}
                                  style={{
                                    textDecoration: 'none',
                                    fontSize: '10px',
                                    padding: '4px 8px',
                                    background: 'var(--secondary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteGrantDialog(grant)}
                                  title="Delete"
                                  aria-label="Delete"
                                  style={{
                                    padding: '4px 6px',
                                    background: 'var(--background)',
                                    color: 'var(--foreground)',
                                    border: '2px solid #b91c1c',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <span className="material-icons" style={{ fontSize: '16px', color: '#b91c1c' }}>
                                    delete
                                  </span>
                                </button>
                              </div>
                            </td>
                          );
                        case 'title':
                          return (
                            <td key={colId} className="compact-px compact-py" style={{ padding: '4px 6px', maxWidth: '200px' }}>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{grant.title}</div>
                            </td>
                          );
                        case 'organization':
                          return (
                            <td key={colId} className="compact-px compact-py" style={{ padding: '4px 6px', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <div style={{ fontSize: '11px', color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={grant.organization}>{grant.organization}</div>
                            </td>
                          );
                        case 'location':
                          return (
                            <td key={colId} className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '11px', color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                              <span title={grant.location}>{grant.location}</span>
                            </td>
                          );
                        case 'amountMin':
                          return (
                            <td key={colId} className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '11px', color: 'var(--foreground)' }}>
                              {grant.amountMin ? `$${grant.amountMin.toLocaleString()}` : '-'}
                            </td>
                          );
                        case 'amountMax':
                          return (
                            <td key={colId} className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '11px', color: 'var(--foreground)' }}>
                              {grant.amountMax ? `$${grant.amountMax.toLocaleString()}` : '-'}
                            </td>
                          );
                        case 'deadline':
                          return (
                            <td key={colId} className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '11px', color: 'var(--foreground)' }}>
                              {grant.deadline ? formatSafeDate(grant.deadline, 'MM/dd/yyyy') : '-'}
                            </td>
                          );
                        case 'applicationUrl':
                          return (
                            <td key={colId} className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'center' }}>
                              {grant.applicationUrl ? (
                                <a
                                  href={grant.applicationUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: 'var(--primary)',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '0.7';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                  }}
                                  title={grant.applicationUrl}
                                >
                                  <span className="material-icons" style={{ fontSize: '16px' }}>language</span>
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                          );
                        case 'category':
                          return (
                            <td key={colId} className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '10px', color: 'var(--foreground)' }}>
                              {grant.category || '-'}
                            </td>
                          );
                        case 'tags':
                          return (
                            <td key={colId} className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '10px', maxWidth: '150px' }}>
                              {grant.tags && grant.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1" style={{ gap: '2px' }}>
                                  {grant.tags.slice(0, 3).map((tagRelation, idx) => (
                                    <span
                                      key={idx}
                                      style={{
                                        padding: '1px 4px',
                                        fontSize: '9px',
                                        background: 'var(--inset-bg)',
                                        color: 'var(--foreground)',
                                        border: 'none',
                                        borderRadius: '3px',
                                        fontWeight: 'bold',
                                        display: 'inline-block',
                                      }}
                                    >
                                      {tagRelation.tag.name}
                                    </span>
                                  ))}
                                  {grant.tags.length > 3 && (
                                    <span style={{ fontSize: '9px', color: 'var(--foreground)' }}>+{grant.tags.length - 3}</span>
                                  )}
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                          );
                        case 'createdAt':
                          return (
                            <td key={colId} className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '10px', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                              {formatSafeDate(grant.createdAt, 'MM/dd/yyyy')}
                            </td>
                          );
                        default:
                          return null;
                      }
                    })}
                  </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}

        <div style={{ margin: '0 8px 32px 8px' }}>
          <AdminGrantSubmissionForm
            submissions={submissions}
            submissionsRefreshing={submissionsRefreshing}
            onRefreshSubmissions={refreshSubmissions}
            searchQuery={dashboardSearch}
          />
        </div>
      </main>

      {grantPendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-grant-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 20000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.55)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteGrantDialog();
          }}
        >
          <div
            className="aol-box"
            style={{
              maxWidth: '420px',
              width: '100%',
              padding: '20px',
              border: '2px solid #b91c1c',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-grant-dialog-title"
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '12px',
                color: 'var(--foreground)',
              }}
            >
              Permanently delete this grant?
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--foreground)', marginBottom: '10px', lineHeight: 1.5 }}>
              This will remove the grant record from the database (including Supabase). Related tag links for this grant
              are removed as well. This action cannot be undone and there is no way to recover the data afterward.
            </p>
            <p
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '14px',
                color: '#b91c1c',
                lineHeight: 1.45,
              }}
            >
              Grant: {grantPendingDelete.title}
            </p>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '12px',
                color: 'var(--foreground)',
                cursor: 'pointer',
                marginBottom: '18px',
                lineHeight: 1.45,
              }}
            >
              <input
                type="checkbox"
                checked={deletePermanentAcknowledged}
                onChange={(e) => setDeletePermanentAcknowledged(e.target.checked)}
                style={{ marginTop: '2px', flexShrink: 0 }}
              />
              <span>I understand this grant will be permanently deleted and cannot be restored.</span>
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={closeDeleteGrantDialog}
                disabled={deletingGrantId !== null}
                className="aol-input"
                style={{
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: deletingGrantId ? 'not-allowed' : 'pointer',
                  opacity: deletingGrantId ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteGrant()}
                disabled={!deletePermanentAcknowledged || deletingGrantId !== null}
                style={{
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: '#b91c1c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor:
                    !deletePermanentAcknowledged || deletingGrantId ? 'not-allowed' : 'pointer',
                  opacity: !deletePermanentAcknowledged || deletingGrantId ? 0.55 : 1,
                }}
              >
                {deletingGrantId ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}