'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format, isValid } from 'date-fns';
import { AdminGrantSubmissionForm } from '@/components/AdminGrantSubmissionForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';

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

  // Scraper State
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [sources, setSources] = useState<GrantSource[]>([]);
  const [scraping, setScraping] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [addingSource, setAddingSource] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      Promise.all([
        fetchPendingGrants(),
        fetchJobs(),
        fetchSources()
      ]).finally(() => setLoading(false));
    }
  }, [status, router]);

  const fetchPendingGrants = async () => {
    try {
      const response = await fetch('/api/grants?limit=1000');
      const data = await response.json();
      setPendingGrants(data.grants || []);
    } catch (error) {
      console.error('Error fetching grants:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/scrape');
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching scrape jobs:', error);
    }
  };

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/scrape/sources');
      const data = await response.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

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
          <div className="aol-box" style={{ overflow: 'auto', margin: '0 8px 32px 8px' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', fontSize: '11px', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: 'var(--inset-bg)' }}>
                  <th className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', color: 'var(--foreground)', borderBottom: '2px inset var(--border-color)', whiteSpace: 'nowrap' }}>
                    Actions
                  </th>
                  <SortableHeader label="Title" sortKey="title" />
                  <SortableHeader label="Organization" sortKey="organization" />
                  <SortableHeader label="Location" sortKey="location" />
                  <SortableHeader label="Amount Min" sortKey="amountMin" />
                  <SortableHeader label="Amount Max" sortKey="amountMax" />
                  <SortableHeader label="Deadline" sortKey="deadline" />
                  <th className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 'bold', color: 'var(--foreground)', borderBottom: '2px inset var(--border-color)', whiteSpace: 'nowrap' }}>
                    Application URL
                  </th>
                  <SortableHeader label="Funding Source" sortKey="category" />
                  <th className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 'bold', color: 'var(--foreground)', borderBottom: '2px inset var(--border-color)', whiteSpace: 'nowrap' }}>
                    Tags
                  </th>
                  <SortableHeader label="Live Date" sortKey="createdAt" />
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
                    <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', maxWidth: '200px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{grant.title}</div>
                    </td>
                    <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', maxWidth: '150px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--foreground)' }}>{grant.organization}</div>
                    </td>
                    <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--foreground)' }}>
                      {grant.location}
                    </td>
                    <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--foreground)' }}>
                      {grant.amountMin ? `$${grant.amountMin.toLocaleString()}` : '-'}
                    </td>
                    <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--foreground)' }}>
                      {grant.amountMax ? `$${grant.amountMax.toLocaleString()}` : '-'}
                    </td>
                    <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--foreground)' }}>
                      {grant.deadline ? formatSafeDate(grant.deadline, 'MM/dd/yyyy') : '-'}
                    </td>
                    <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', fontSize: '10px', color: 'var(--primary)', maxWidth: '200px' }}>
                      {grant.applicationUrl ? (
                        <a href={grant.applicationUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', wordBreak: 'break-all' }}>
                          {grant.applicationUrl.length > 30 ? `${grant.applicationUrl.substring(0, 30)}...` : grant.applicationUrl}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', fontSize: '10px', color: 'var(--foreground)' }}>
                      {grant.category || '-'}
                    </td>
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
                    <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)', fontSize: '10px', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                      {formatSafeDate(grant.createdAt, 'MM/dd/yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Scraper Dashboard Section */}
        <div className="compact-mb" style={{ marginBottom: '16px', margin: '0 8px' }}>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          
          {/* Left Column: Sources */}
          <div style={{ minWidth: '0' }}>
            <div className="aol-box" style={{ margin: '0 8px 16px 8px', padding: '16px' }}>
              <h2 className="aol-heading compact-mb" style={{ fontSize: '16px', marginBottom: '8px' }}>
                Grant Sources
              </h2>
              
              {/* Add Source Form */}
              <form onSubmit={handleAddSource} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="Source Name"
                    required
                    className="aol-input"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="url"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    placeholder="URL"
                    required
                    className="aol-input"
                    style={{ flex: 2 }}
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
                        style={{ fontSize: '11px', padding: '2px 8px', height: 'auto' }}
                        title={source.isActive ? 'Disable' : 'Enable'}
                      >
                        {source.isActive ? '⏸️' : '▶️'}
                      </button>
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="aol-button"
                        style={{ fontSize: '11px', padding: '2px 8px', height: 'auto', color: 'red' }}
                        title="Delete"
                      >
                        ❌
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
                            <div style={{ marginTop: '4px' }}>
                              {job.grants.map((grant) => (
                                <div key={grant.id} style={{ fontSize: '12px', marginBottom: '4px' }}>
                                  <a
                                    href={`/admin/grants/${grant.id}`}
                                    style={{ color: 'var(--primary)', textDecoration: 'none' }}
                                  >
                                    {grant.title}
                                  </a>
                                </div>
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