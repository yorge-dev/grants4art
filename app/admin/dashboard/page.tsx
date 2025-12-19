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
        border: 'none',
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

  // Scraper State
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [sources, setSources] = useState<GrantSource[]>([]);
  const [scraping, setScraping] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [addingSource, setAddingSource] = useState(false);
  const [previewingGrantId, setPreviewingGrantId] = useState<string | null>(null);

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

  // Sources Table Sorting
  const [sourceSortConfig, setSourceSortConfig] = useState<{ key: 'name' | 'status' | 'lastScraped' | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });

  const handleSourceSort = (key: 'name' | 'status' | 'lastScraped') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sourceSortConfig.key === key && sourceSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSourceSortConfig({ key, direction });
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

  // Sort sources
  const sortedSources = [...sources].sort((a, b) => {
    if (!sourceSortConfig.key) return 0;

    if (sourceSortConfig.key === 'name') {
      const compareResult = a.name.localeCompare(b.name);
      return sourceSortConfig.direction === 'asc' ? compareResult : -compareResult;
    }

    if (sourceSortConfig.key === 'status') {
      const aJobs = jobs.filter(job => job.grantSource?.name === a.name);
      const bJobs = jobs.filter(job => job.grantSource?.name === b.name);
      const aLatestJob = aJobs.length > 0 ? aJobs[0] : null;
      const bLatestJob = bJobs.length > 0 ? bJobs[0] : null;
      const aStatus = aLatestJob ? (aLatestJob.status === 'FAILED' || (aLatestJob.status === 'COMPLETED' && aLatestJob.discoveredCount === 0 && aLatestJob.errorMessage) ? 'FAILED' : aLatestJob.status) : 'PENDING';
      const bStatus = bLatestJob ? (bLatestJob.status === 'FAILED' || (bLatestJob.status === 'COMPLETED' && bLatestJob.discoveredCount === 0 && bLatestJob.errorMessage) ? 'FAILED' : bLatestJob.status) : 'PENDING';
      const compareResult = aStatus.localeCompare(bStatus);
      return sourceSortConfig.direction === 'asc' ? compareResult : -compareResult;
    }

    if (sourceSortConfig.key === 'lastScraped') {
      const aDate = a.lastScraped ? new Date(a.lastScraped).getTime() : 0;
      const bDate = b.lastScraped ? new Date(b.lastScraped).getTime() : 0;
      const compareResult = aDate - bDate;
      return sourceSortConfig.direction === 'asc' ? compareResult : -compareResult;
    }

    return 0;
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

  const SortableSourceHeader = ({ label, sortKey }: { label: string; sortKey: 'name' | 'status' | 'lastScraped' }) => (
    <th
      style={{
        padding: '8px',
        textAlign: 'left',
        fontWeight: 'bold',
        color: 'var(--foreground)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => handleSourceSort(sortKey)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {label}
        {sourceSortConfig.key === sortKey && (
          <span style={{ fontSize: '10px' }}>
            {sourceSortConfig.direction === 'asc' ? '▲' : '▼'}
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
                  transition: 'opacity 0.15s ease',
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
                              transition: 'all 0.15s ease',
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
                                transition: 'all 0.15s ease',
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
                  <th className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                    Actions
                  </th>
                  {columnVisibility.title && <SortableHeader label="Title" sortKey="title" />}
                  {columnVisibility.organization && <SortableHeader label="Organization" sortKey="organization" />}
                  {columnVisibility.location && <SortableHeader label="Location" sortKey="location" />}
                  {columnVisibility.amountMin && <SortableHeader label="Amount Min" sortKey="amountMin" />}
                  {columnVisibility.amountMax && <SortableHeader label="Amount Max" sortKey="amountMax" />}
                  {columnVisibility.deadline && <SortableHeader label="Deadline" sortKey="deadline" />}
                  {columnVisibility.applicationUrl && (
                    <th className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 'bold', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                      Application URL
                    </th>
                  )}
                  {columnVisibility.category && <SortableHeader label="Funding Source" sortKey="category" />}
                  {columnVisibility.tags && (
                    <th className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 'bold', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                      Tags
                    </th>
                  )}
                  {columnVisibility.createdAt && <SortableHeader label="Live Date" sortKey="createdAt" />}
                </tr>
              </thead>
              <tbody>
                {sortedGrants.map((grant) => (
                  <tr key={grant.id}>
                    <td className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'right' }}>
                      <button
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
                          fontWeight: 'bold'
                        }}
                      >
                        Edit
                      </button>
                    </td>
                    {columnVisibility.title && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', maxWidth: '200px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{grant.title}</div>
                      </td>
                    )}
                    {columnVisibility.organization && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', maxWidth: '150px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--foreground)' }}>{grant.organization}</div>
                      </td>
                    )}
                    {columnVisibility.location && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '11px', color: 'var(--foreground)' }}>
                        {grant.location}
                      </td>
                    )}
                    {columnVisibility.amountMin && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '11px', color: 'var(--foreground)' }}>
                        {grant.amountMin ? `$${grant.amountMin.toLocaleString()}` : '-'}
                      </td>
                    )}
                    {columnVisibility.amountMax && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '11px', color: 'var(--foreground)' }}>
                        {grant.amountMax ? `$${grant.amountMax.toLocaleString()}` : '-'}
                      </td>
                    )}
                    {columnVisibility.deadline && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '11px', color: 'var(--foreground)' }}>
                        {grant.deadline ? formatSafeDate(grant.deadline, 'MM/dd/yyyy') : '-'}
                      </td>
                    )}
                    {columnVisibility.applicationUrl && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '10px', color: 'var(--primary)', maxWidth: '200px' }}>
                        {grant.applicationUrl ? (
                          <a href={grant.applicationUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', wordBreak: 'break-all' }}>
                            {grant.applicationUrl.length > 30 ? `${grant.applicationUrl.substring(0, 30)}...` : grant.applicationUrl}
                          </a>
                        ) : '-'}
                      </td>
                    )}
                    {columnVisibility.category && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '10px', color: 'var(--foreground)' }}>
                        {grant.category || '-'}
                      </td>
                    )}
                    {columnVisibility.tags && (
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '10px', maxWidth: '150px' }}>
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
                      <td className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '10px', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
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

        {/* Add Source Form */}
        <div style={{ margin: '0 8px 16px 8px' }}>
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
          <form onSubmit={handleAddSource} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
              <button
                type="submit"
                disabled={addingSource}
                style={{ 
                  flexShrink: 0,
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: addingSource ? 'not-allowed' : 'pointer',
                  opacity: addingSource ? 0.6 : 1
                }}
              >
                {addingSource ? 'Adding...' : 'Add Source'}
              </button>
            </div>
          </form>
        </div>

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
                  <GrantPreviewCard key={grant.id} grant={grant} router={router} />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Combined Sources and Jobs Table */}
        <div style={{ margin: '0 8px 32px 8px' }}>
          <div className="aol-box" style={{ overflow: 'auto', padding: '16px' }}>
            <h2 className="aol-heading compact-mb" style={{ fontSize: '16px', marginBottom: '12px' }}>
              Grant Sources & Scrape Jobs
            </h2>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: 'var(--inset-bg)' }}>
                  <SortableSourceHeader label="Source" sortKey="name" />
                  <SortableSourceHeader label="Status" sortKey="status" />
                  <SortableSourceHeader label="Last Scraped" sortKey="lastScraped" />
                  <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--foreground)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedSources.map((source) => {
                  // Find jobs for this source
                  const sourceJobs = jobs.filter(job => job.grantSource?.name === source.name);
                  const latestJob = sourceJobs.length > 0 ? sourceJobs[0] : null;
                  const isFailed = latestJob && (latestJob.status === 'FAILED' || (latestJob.status === 'COMPLETED' && latestJob.discoveredCount === 0 && latestJob.errorMessage));
                  const displayStatus = latestJob ? (isFailed ? 'FAILED' : latestJob.status) : 'PENDING';
                  const statusStyle = getStatusBadge(displayStatus);
                  const totalGrants = sourceJobs.reduce((sum, job) => sum + job.discoveredCount, 0);
                  const hasGrants = latestJob && latestJob.grants && latestJob.grants.length > 0;
                  
                  return (
                    <tr key={source.id} style={{ opacity: source.isActive ? 1 : 0.6 }}>
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{source.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                          {source.url.length > 50 ? `${source.url.substring(0, 50)}...` : source.url}
                        </div>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: 'none',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          {displayStatus}
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontSize: '11px', color: 'var(--foreground)' }}>
                        {source.lastScraped ? format(new Date(source.lastScraped), 'MMM d, h:mm a') : 'Never'}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {hasGrants && (
                            <button
                              onClick={() => setPreviewingGrantId(previewingGrantId === source.id ? null : source.id)}
                              style={{ 
                                fontSize: '10px', 
                                padding: '4px 8px',
                                background: 'var(--secondary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                              }}
                            >
                              {previewingGrantId === source.id ? 'Hide' : 'Preview'}
                            </button>
                          )}
                          <button
                            onClick={() => handleScrapeSource(source.id)}
                            disabled={scraping || !source.isActive}
                            style={{ 
                              fontSize: '11px', 
                              padding: '4px 8px', 
                              height: 'auto', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px',
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: scraping || !source.isActive ? 'not-allowed' : 'pointer',
                              opacity: scraping || !source.isActive ? 0.6 : 1
                            }}
                            title="Run Scraper"
                          >
                            <span className="material-icons" style={{ fontSize: '14px' }}>rocket_launch</span>
                          </button>
                          <button
                            onClick={() => handleToggleSource(source.id, source.isActive)}
                            style={{ 
                              fontSize: '11px', 
                              padding: '4px 8px', 
                              height: 'auto', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px',
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title={source.isActive ? 'Disable' : 'Enable'}
                          >
                            <span className="material-icons" style={{ fontSize: '14px' }}>
                              {source.isActive ? 'pause' : 'play_arrow'}
                            </span>
                          </button>
                          <button
                            onClick={() => handleDeleteSource(source.id)}
                            style={{ 
                              fontSize: '11px', 
                              padding: '4px 8px', 
                              height: 'auto', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              color: 'white',
                              background: '#d32f2f',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title="Delete"
                          >
                            <span className="material-icons" style={{ fontSize: '14px' }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sortedSources.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                      No sources configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}