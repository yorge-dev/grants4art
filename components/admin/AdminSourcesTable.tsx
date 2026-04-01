'use client';

import { format } from 'date-fns';
import { AdminGrantPreviewCard } from './AdminGrantPreviewCard';

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
  grantSource?: { name: string };
  grants?: Array<{
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
    tags?: Array<{ tag: { name: string; slug: string } }>;
  }>;
}

interface AdminSourcesTableProps {
  sources: GrantSource[];
  jobs: ScrapeJob[];
  scraping: boolean;
  previewingGrantId: string | null;
  onScrape: (sourceId: string) => void;
  onToggle: (sourceId: string, isActive: boolean) => void;
  onDelete: (sourceId: string) => void;
  onPreviewToggle: (sourceId: string | null) => void;
  onMessage: (message: string, type: 'success' | 'error') => void;
}

const getStatusBadge = (status: string) => {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    PENDING: { bg: 'var(--inset-bg)', color: 'var(--foreground)', border: 'var(--border-color)' },
    RUNNING: { bg: 'var(--inset-bg)', color: 'var(--foreground)', border: 'var(--primary)' },
    COMPLETED: { bg: 'var(--inset-bg)', color: 'var(--foreground)', border: 'var(--color-saddle-brown-600)' },
    FAILED: { bg: 'var(--inset-bg)', color: 'var(--foreground)', border: 'var(--color-saddle-brown-700)' },
  };
  return styles[status] || { bg: 'var(--inset-bg)', color: 'var(--foreground)', border: 'var(--muted)' };
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING': return 'schedule';
    case 'RUNNING': return 'sync';
    case 'COMPLETED': return 'check_circle';
    case 'FAILED': return 'error';
    default: return 'help_outline';
  }
};

export function AdminSourcesTable({
  sources,
  jobs,
  scraping,
  previewingGrantId,
  onScrape,
  onToggle,
  onDelete,
  onPreviewToggle,
  onMessage,
}: AdminSourcesTableProps) {
  const sortedSources = [...sources];

  return (
    <div style={{ margin: '0 8px 32px 8px' }}>
      <div className="aol-box" style={{ overflow: 'auto', padding: '16px' }}>
        <h2 className="aol-heading compact-mb" style={{ fontSize: '16px', marginBottom: '12px' }}>
          Grant Sources & Scrape Jobs
        </h2>
        <style>{`
          @media (max-width: 768px) {
            .sources-table {
              font-size: 10px !important;
            }
            .sources-table th,
            .sources-table td {
              padding: 6px 4px !important;
            }
            .sources-table .source-name {
              max-width: 120px !important;
            }
            .sources-table .actions-column {
              min-width: 140px !important;
            }
            .sources-table .last-scraped-column {
              min-width: 100px !important;
            }
            .sources-table .actions-column button {
              padding: 3px 6px !important;
              font-size: 9px !important;
            }
            .sources-table .actions-column .material-icons {
              font-size: 12px !important;
            }
          }
        `}</style>
        <table className="sources-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', fontSize: '11px' }}>
          <thead>
            <tr style={{ background: 'var(--inset-bg)' }}>
              <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>Source</th>
              <th className="last-scraped-column" style={{ padding: '8px', fontWeight: 'bold', color: 'var(--foreground)', whiteSpace: 'nowrap', minWidth: '120px' }}>Last Scraped</th>
              <th className="actions-column" style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--foreground)', whiteSpace: 'nowrap', minWidth: '160px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedSources.map((source) => {
              const sourceJobs = jobs.filter((job) => job.grantSource?.name === source.name);
              const latestJob = sourceJobs.length > 0 ? sourceJobs[0] : null;
              const isFailed = latestJob && (latestJob.status === 'FAILED' || (latestJob.status === 'COMPLETED' && latestJob.discoveredCount === 0 && latestJob.errorMessage));
              const displayStatus = latestJob ? (isFailed ? 'FAILED' : latestJob.status) : 'PENDING';
              const statusStyle = getStatusBadge(displayStatus);
              const hasGrants = latestJob && latestJob.grants && latestJob.grants.length > 0;

              return (
                <tr key={source.id} style={{ opacity: source.isActive ? 1 : 0.6 }}>
                  <td style={{ padding: '8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        fontSize: '18px',
                        color: statusStyle.color,
                        cursor: 'default',
                      }}
                      title={displayStatus}
                    >
                      <span className="material-icons" style={{ fontSize: '18px' }}>
                        {getStatusIcon(displayStatus)}
                      </span>
                    </span>
                  </td>
                  <td style={{ padding: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                    <div className="source-name" style={{ fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {source.name}
                    </div>
                  </td>
                  <td className="last-scraped-column" style={{ padding: '8px', fontSize: '11px', color: 'var(--foreground)', whiteSpace: 'nowrap', minWidth: '120px' }}>
                    {source.lastScraped ? format(new Date(source.lastScraped), 'MMM d, h:mm a') : 'Never'}
                  </td>
                  <td className="actions-column" style={{ padding: '8px', textAlign: 'right', whiteSpace: 'nowrap', minWidth: '160px', overflow: 'visible' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'nowrap', minWidth: 'fit-content' }}>
                      {hasGrants && (
                        <button
                          onClick={() => onPreviewToggle(previewingGrantId === source.id ? null : source.id)}
                          style={{
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
                          {previewingGrantId === source.id ? 'Hide' : 'Preview'}
                        </button>
                      )}
                      <button
                        onClick={() => onScrape(source.id)}
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
                          opacity: scraping || !source.isActive ? 0.6 : 1,
                        }}
                        title="Run Scraper"
                      >
                        <span className="material-icons" style={{ fontSize: '14px' }}>rocket_launch</span>
                      </button>
                      <button
                        onClick={() => onToggle(source.id, source.isActive)}
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
                          cursor: 'pointer',
                        }}
                        title={source.isActive ? 'Disable' : 'Enable'}
                      >
                        <span className="material-icons" style={{ fontSize: '14px' }}>
                          {source.isActive ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm('Are you sure you want to delete this source?')) return;
                          onDelete(source.id);
                        }}
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
                          cursor: 'pointer',
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
  );
}
