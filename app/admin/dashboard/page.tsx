'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format, isValid, formatDistanceToNow } from 'date-fns';
import { AdminGrantSubmissionForm } from '@/components/AdminGrantSubmissionForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatTagName } from '@/lib/tag-utils';

interface GrantTooltipProps {
  description: string;
  eligibility?: string | null;
  isVisible: boolean;
}

function GrantTooltip({ description, eligibility, isVisible }: GrantTooltipProps) {
  return (
    <div
      className="grant-tooltip"
      style={{
        marginTop: '12px',
        padding: isVisible ? '16px' : '0 16px',
        background: 'var(--text-field-bg)',
        border: '2px inset',
        borderColor: isVisible ? 'var(--secondary)' : 'transparent',
        borderRadius: '8px',
        opacity: isVisible ? 1 : 0,
        maxHeight: isVisible ? '600px' : '0',
        overflowY: isVisible ? 'auto' : 'hidden',
        overflowX: 'hidden',
        transition: 'opacity 0.3s ease, max-height 0.3s ease, padding 0.3s ease, border-color 0.3s ease',
        visibility: isVisible ? 'visible' : 'hidden',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      <div style={{ marginBottom: eligibility ? '12px' : '0' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '8px', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
          Description
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--foreground)', lineHeight: '1.4', margin: 0, whiteSpace: 'pre-wrap', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
          {description}
        </p>
      </div>
      {eligibility && (
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '8px', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
            Eligibility
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--foreground)', lineHeight: '1.4', margin: 0, whiteSpace: 'pre-wrap', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
            {eligibility}
          </p>
        </div>
      )}
    </div>
  );
}

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

const formatGrantAmount = (grant: ScrapeJob['grants'][0]) => {
  if (grant.amountMin !== null && grant.amountMin !== undefined && grant.amountMax !== null && grant.amountMax !== undefined) {
    if (grant.amountMin === grant.amountMax) {
      return `$${grant.amountMin.toLocaleString()}`;
    }
    return `$${grant.amountMin.toLocaleString()} - $${grant.amountMax.toLocaleString()}`;
  } else if (grant.amountMax !== null && grant.amountMax !== undefined) {
    return `Up to $${grant.amountMax.toLocaleString()}`;
  } else if (grant.amountMin !== null && grant.amountMin !== undefined) {
    return `From $${grant.amountMin.toLocaleString()}`;
  } else if (grant.amount) {
    return grant.amount;
  }
  return null;
};

interface GrantPreviewCardProps {
  grant: ScrapeJob['grants'][0];
  router: ReturnType<typeof useRouter>;
}

function GrantPreviewCard({ grant, router }: GrantPreviewCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deadline = grant.deadline ? new Date(grant.deadline) : null;
  const isExpired = deadline && deadline < new Date();
  const displayAmount = formatGrantAmount(grant);

  const handleMouseEnter = () => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    // Add a small delay before hiding to prevent flickering when moving between cards
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
      hideTimeoutRef.current = null;
    }, 150); // 150ms delay
  };

  const tooltipVisible = showTooltip;

  return (
    <div
      className="aol-box block grant-card"
      onClick={() => router.push(`/admin/grants/${grant.id}`)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        textDecoration: 'none',
        color: 'var(--foreground)',
        padding: '16px',
        marginBottom: '0',
        display: 'block',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', position: 'relative' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '13px',
            marginBottom: '6px',
            color: 'var(--primary)',
            fontWeight: 'bold',
            textDecoration: tooltipVisible ? 'underline' : 'none',
            textDecorationColor: tooltipVisible ? 'var(--secondary)' : 'transparent',
            textDecorationThickness: tooltipVisible ? '2px' : '0',
            textUnderlineOffset: tooltipVisible ? '2px' : '0',
            transition: 'text-decoration 0.2s ease, text-decoration-color 0.2s ease',
            display: 'inline-block',
          }}>
            {grant.title}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ color: 'var(--foreground)', fontWeight: 'bold', margin: 0, fontSize: '11px' }}>
              {grant.organization}
            </p>
            <div className="flex items-center gap-2" style={{ gap: '12px', fontSize: '10px', flexWrap: 'wrap' }}>
              <span className="flex items-center gap-1" style={{ fontWeight: 'bold', color: 'var(--foreground)' }}>
                <span className="material-icons" style={{ fontSize: '12px', verticalAlign: 'middle' }}>location_on</span> {grant.location}
              </span>
              {grant.applicationUrl && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(grant.applicationUrl!, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex items-center gap-1"
                  style={{
                    fontWeight: 'bold',
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    opacity: 0.8,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '12px', verticalAlign: 'middle' }}>link</span> Apply
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', textAlign: 'right' }}>
          {displayAmount && (
            <span style={{
              display: 'inline-block',
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: 'bold',
              color: 'var(--foreground)',
              border: '1px solid var(--secondary)',
              borderRadius: '4px',
              background: 'transparent',
              textAlign: 'right',
            }}>
              {displayAmount}
            </span>
          )}
          {deadline && (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontWeight: 'bold', color: isExpired ? '#d32f2f' : 'var(--foreground)', fontSize: '10px', textAlign: 'right' }}>
              <span className="material-icons" style={{ fontSize: '12px', verticalAlign: 'middle' }}>calendar_today</span> {isExpired ? 'Expired' : `Due in ${formatDistanceToNow(deadline)}`}
            </span>
          )}
        </div>
      </div>

      {grant.tags && grant.tags.length > 0 && (
        <div className="flex flex-wrap gap-1" style={{ gap: '6px', marginBottom: '12px' }}>
          {grant.tags.map((tagRelation) => (
            <span
              key={tagRelation.tag.slug}
              style={{
                padding: '1px 4px',
                fontSize: '10px',
                background: 'var(--color-camel-800)',
                color: 'var(--color-charcoal-brown-500)',
                border: '1px solid var(--secondary)',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}
            >
              {formatTagName(tagRelation.tag.name)}
            </span>
          ))}
        </div>
      )}

      {grant.description && (
        <div
          className="compact-mb grant-description"
          style={{
            fontSize: '11px',
            color: 'var(--foreground)',
            marginBottom: tooltipVisible ? '0' : '12px',
            lineHeight: '1.3',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: tooltipVisible ? 0 : 1,
            maxHeight: tooltipVisible ? '0' : 'none',
            transition: 'opacity 0.3s ease, max-height 0.3s ease, margin-bottom 0.3s ease',
          }}
        >
          <p style={{ margin: 0 }}>
            {grant.description}
          </p>
        </div>
      )}

      <GrantTooltip
        description={grant.description}
        eligibility={grant.eligibility || null}
        isVisible={tooltipVisible}
      />
    </div>
  );
}

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
  const columnSettingsRef = useRef<HTMLDivElement>(null);
  
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

  // Scraper State
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [sources, setSources] = useState<GrantSource[]>([]);
  const [scraping, setScraping] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [addingSource, setAddingSource] = useState(false);

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
        fetchSources()
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
        alert(`Grant discovered: ${result.grant?.title || 'Unknown'}`);
        fetchJobs();
        fetchSources();
        fetchPendingGrants();
      } else {
        alert(result.message || 'No grant information found');
        fetchJobs();
        fetchSources();
      }
    } catch (error) {
      console.error('Error scraping source:', error);
      alert('Error scraping source');
    } finally {
      setScraping(false);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName || !newSourceUrl) return;

    setAddingSource(true);
    try {
      const response = await fetch('/api/scrape/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSourceName, url: newSourceUrl })
      });
      
      const result = await response.json();
      if (result.source) {
        setNewSourceName('');
        setNewSourceUrl('');
        fetchSources();
      } else {
        alert(result.error || 'Failed to add source');
      }
    } catch (error) {
      console.error('Error adding source:', error);
      alert('Error adding source');
    } finally {
      setAddingSource(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this source?')) return;
    
    try {
      const response = await fetch(`/api/scrape/sources/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchSources();
      } else {
        alert('Failed to delete source');
      }
    } catch (error) {
      console.error('Error deleting source:', error);
      alert('Error deleting source');
    }
  };

  const handleToggleSource = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/scrape/sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      fetchSources();
    } catch (error) {
      console.error('Error toggling source:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; border: string }> = {
      PENDING: { bg: 'var(--inset-bg)', color: 'var(--foreground)', border: 'var(--border-color)' },
      RUNNING: { bg: 'var(--inset-bg)', color: 'var(--foreground)', border: 'var(--primary)' },
      COMPLETED: { bg: 'var(--inset-bg)', color: 'var(--foreground)', border: 'var(--color-saddle-brown-600)' },
      FAILED: { bg: 'var(--inset-bg)', color: 'var(--foreground)', border: 'var(--color-saddle-brown-700)' }
    };
    return styles[status] || { bg: 'var(--inset-bg)', color: 'var(--foreground)', border: 'var(--muted)' };
  };

  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: keyof Grant }) => (
    <th
      className="compact-px compact-py"
      style={{
        padding: '4px 6px',
        textAlign: 'left',
        fontWeight: 'bold',
        color: 'var(--foreground)',
        borderBottom: '2px inset var(--border-color)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => handleSort(sortKey)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {label}
        {sortConfig.key === sortKey && (
          <span style={{ fontSize: '10px' }}>
            {sortConfig.direction === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </div>
    </th>
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
      
      <main className="mx-auto" style={{ maxWidth: '1440px', padding: '0 16px', marginTop: '8px' }}>
        <div className="compact-mb" style={{ marginBottom: '8px', margin: '0 8px 16px 8px' }}>
          <h1 className="aol-heading-large compact-mb" style={{ fontSize: '23px', marginBottom: '2px' }}>Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 'bold' }}>
            {pendingGrants.length} total grants
          </p>
        </div>

        {/* Search Bar Placeholder */}
        <div className="aol-box" style={{ margin: '0 8px 16px 8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons" style={{ fontSize: '16px', color: 'var(--foreground)', opacity: 0.6 }}>search</span>
            <input 
              type="text" 
              placeholder="Search grants... (Coming Soon)" 
              disabled
              className="aol-input" 
              style={{ flex: 1, opacity: 0.6, cursor: 'not-allowed' }} 
            />
          </div>
        </div>

        {/* User Submissions */}
        <div style={{ margin: '0 8px 16px 8px' }}>
          <AdminGrantSubmissionForm />
        </div>

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
              {/* Backdrop for closing dropdown */}
              {showColumnSettings && (
                <div
                  onClick={() => setShowColumnSettings(false)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 15,
                    background: 'transparent',
                  }}
                />
              )}
              
              {/* Column Settings Button */}
              <div style={{ position: 'relative', zIndex: 20 }}>
                <button
                  onClick={() => setShowColumnSettings(!showColumnSettings)}
                  className="aol-button-secondary"
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Column Settings"
                >
                  <span className="material-icons" style={{ fontSize: '16px' }}>build</span>
                </button>
                
                {/* Column Settings Dropdown */}
                {showColumnSettings && (
                  <div
                    ref={columnSettingsRef}
                    className="aol-box-inset"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      marginTop: '4px',
                      padding: '12px',
                      minWidth: '200px',
                      zIndex: 25,
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--primary)' }}>
                      Column Visibility
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                      ].map((col) => (
                        <label
                          key={col.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={columnVisibility[col.key] ?? true}
                            onChange={(e) => updateColumnVisibility(col.key, e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="aol-box" style={{ overflow: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', fontSize: '11px', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: 'var(--inset-bg)' }}>
                  <th className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', color: 'var(--foreground)', borderBottom: '2px inset var(--border-color)', whiteSpace: 'nowrap' }}>
                    Actions
                  </th>
                  {columnVisibility.title && <SortableHeader label="Title" sortKey="title" />}
                  {columnVisibility.organization && <SortableHeader label="Organization" sortKey="organization" />}
                  {columnVisibility.location && <SortableHeader label="Location" sortKey="location" />}
                  {columnVisibility.amountMin && <SortableHeader label="Amount Min" sortKey="amountMin" />}
                  {columnVisibility.amountMax && <SortableHeader label="Amount Max" sortKey="amountMax" />}
                  {columnVisibility.deadline && <SortableHeader label="Deadline" sortKey="deadline" />}
                  {columnVisibility.applicationUrl && (
                    <th className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 'bold', color: 'var(--foreground)', borderBottom: '2px inset var(--border-color)', whiteSpace: 'nowrap' }}>
                      Application URL
                    </th>
                  )}
                  {columnVisibility.category && <SortableHeader label="Funding Source" sortKey="category" />}
                  {columnVisibility.tags && (
                    <th className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 'bold', color: 'var(--foreground)', borderBottom: '2px inset var(--border-color)', whiteSpace: 'nowrap' }}>
                      Tags
                    </th>
                  )}
                  {columnVisibility.createdAt && <SortableHeader label="Live Date" sortKey="createdAt" />}
                </tr>
              </thead>
              <tbody>
                {sortedGrants.map((grant) => (
                  <tr key={grant.id}>
                    <td className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'right', borderBottom: '1px solid var(--border-color)' }}>
                      <button
                        onClick={() => router.push(`/admin/grants/${grant.id}`)}
                        className="aol-button-secondary"
                        style={{ textDecoration: 'none', fontSize: '10px', padding: '2px 6px' }}
                      >
                        Edit
                      </button>
                    </td>
                    {columnVisibility.title && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', maxWidth: '200px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{grant.title}</div>
                      </td>
                    )}
                    {columnVisibility.organization && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', maxWidth: '150px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--foreground)' }}>{grant.organization}</div>
                      </td>
                    )}
                    {columnVisibility.location && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--foreground)' }}>
                        {grant.location}
                      </td>
                    )}
                    {columnVisibility.amountMin && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--foreground)' }}>
                        {grant.amountMin ? `$${grant.amountMin.toLocaleString()}` : '-'}
                      </td>
                    )}
                    {columnVisibility.amountMax && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--foreground)' }}>
                        {grant.amountMax ? `$${grant.amountMax.toLocaleString()}` : '-'}
                      </td>
                    )}
                    {columnVisibility.deadline && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--foreground)' }}>
                        {grant.deadline ? formatSafeDate(grant.deadline, 'MM/dd/yyyy') : '-'}
                      </td>
                    )}
                    {columnVisibility.applicationUrl && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', fontSize: '10px', color: 'var(--primary)', maxWidth: '200px' }}>
                        {grant.applicationUrl ? (
                          <a href={grant.applicationUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', wordBreak: 'break-all' }}>
                            {grant.applicationUrl.length > 30 ? `${grant.applicationUrl.substring(0, 30)}...` : grant.applicationUrl}
                          </a>
                        ) : '-'}
                      </td>
                    )}
                    {columnVisibility.category && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', fontSize: '10px', color: 'var(--foreground)' }}>
                        {grant.category || '-'}
                      </td>
                    )}
                    {columnVisibility.tags && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', fontSize: '10px', maxWidth: '150px' }}>
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
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '3px',
                                  fontWeight: 'bold',
                                  display: 'inline-block'
                                }}
                              >
                                {tagRelation.tag.name}
                              </span>
                            ))}
                            {grant.tags.length > 3 && (
                              <span style={{ fontSize: '9px', color: 'var(--foreground)' }}>+{grant.tags.length - 3}</span>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                    )}
                    {columnVisibility.createdAt && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', fontSize: '10px', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                        {formatSafeDate(grant.createdAt, 'MM/dd/yyyy')}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Scraper Dashboard Section */}
        <div className="compact-mb" style={{ marginBottom: '16px', margin: '0 8px' }}>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          
          {/* Left Column: Sources */}
          <div style={{ minWidth: '0' }}>
            <div className="aol-box" style={{ margin: '0 8px 16px 8px', padding: '16px', overflow: 'hidden' }}>
              <h2 className="aol-heading compact-mb" style={{ fontSize: '16px', marginBottom: '8px' }}>
                Grant Sources
              </h2>
              
              {/* Add Source Form */}
              <style>{`
                @media (max-width: 640px) {
                  .source-inputs-container {
                    flex-direction: column !important;
                  }
                  .source-inputs-container input {
                    width: 100% !important;
                    flex: 1 1 100% !important;
                  }
                }
              `}</style>
              <form onSubmit={handleAddSource} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <div className="source-inputs-container" style={{ 
                  display: 'flex', 
                  flexDirection: 'row',
                  gap: '8px',
                  flexWrap: 'wrap',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <input
                    type="text"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="Source Name"
                    required
                    className="aol-input"
                    style={{ 
                      flex: '1 1 150px',
                      minWidth: '0',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  />
                  <input
                    type="url"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    placeholder="URL"
                    required
                    className="aol-input"
                    style={{ 
                      flex: '2 1 200px',
                      minWidth: '0',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingSource}
                  className="aol-button"
                  style={{ alignSelf: 'flex-end' }}
                >
                  {addingSource ? 'Adding...' : 'Add Source'}
                </button>
              </form>

              {/* Sources List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sources.map((source) => (
                  <div key={source.id} className="aol-box-inset" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: source.isActive ? 1 : 0.6 }}>
                    <div style={{ flex: 1, overflow: 'hidden', paddingRight: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{source.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                        Last scraped: {source.lastScraped ? format(new Date(source.lastScraped), 'MMM d, yyyy h:mm a') : 'Never'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleScrapeSource(source.id)}
                        disabled={scraping || !source.isActive}
                        className="aol-button"
                        style={{ fontSize: '11px', padding: '2px 8px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Run Scraper"
                      >
                        <span className="material-icons" style={{ fontSize: '14px' }}>rocket_launch</span>
                      </button>
                      <button
                        onClick={() => handleToggleSource(source.id, source.isActive)}
                        className="aol-button"
                        style={{ fontSize: '11px', padding: '2px 8px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title={source.isActive ? 'Disable' : 'Enable'}
                      >
                        <span className="material-icons" style={{ fontSize: '14px' }}>
                          {source.isActive ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="aol-button"
                        style={{ fontSize: '11px', padding: '2px 8px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: 'red' }}
                        title="Delete"
                      >
                        <span className="material-icons" style={{ fontSize: '14px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                ))}
                {sources.length === 0 && (
                  <p style={{ fontSize: '12px', textAlign: 'center', color: 'var(--muted-foreground)' }}>No sources configured.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Jobs */}
          <div style={{ minWidth: '0' }}>
            <div className="aol-box" style={{ margin: '0 8px', padding: '12px' }}>
              <h2 className="aol-heading compact-mb" style={{ fontSize: '16px', marginBottom: '8px' }}>
                Recent Scrape Jobs
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
                {jobs.length === 0 ? (
                  <div className="aol-box-inset text-center" style={{ padding: '16px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--foreground)' }}>No scrape jobs yet</p>
                  </div>
                ) : (
                  jobs.map((job) => {
                    const isFailed = job.status === 'FAILED' || (job.status === 'COMPLETED' && job.discoveredCount === 0 && job.errorMessage);
                    const displayStatus = isFailed ? 'FAILED' : job.status;
                    const statusStyle = getStatusBadge(displayStatus);
                    
                    return (
                      <div key={job.id} className="aol-box-inset" style={{ padding: '12px', opacity: isFailed ? 0.6 : 1 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                padding: '2px 6px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                background: statusStyle.bg,
                                color: statusStyle.color,
                                border: `2px outset ${statusStyle.border}`,
                                borderRadius: '4px',
                                display: 'inline-block'
                                }}>
                                {displayStatus}
                                </span>
                                {job.grantSource && (
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>
                                        {job.grantSource.name}
                                    </span>
                                )}
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--foreground)' }}>
                              {format(new Date(job.createdAt), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--foreground)' }}>
                            Discovered {job.discoveredCount} grant(s)
                          </div>
                          {job.errorMessage && (
                            <div style={{ fontSize: '12px', color: 'var(--color-saddle-brown-700)' }}>
                              Error: {job.errorMessage}
                            </div>
                          )}
                          {job.grants && job.grants.length > 0 && (
                            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {job.grants.map((grant) => (
                                <GrantPreviewCard key={grant.id} grant={grant} router={router} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}