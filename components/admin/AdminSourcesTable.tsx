'use client';

import { useState, type DragEvent } from 'react';
import { format } from 'date-fns';
import {
  ADMIN_SOURCES_TABLE_COLUMN_ORDER_KEY,
  DEFAULT_SOURCES_COLUMN_ORDER,
  normalizeSourcesColumnOrder,
  reorderColumnIds,
} from '@/lib/adminTableColumnOrder';
import {
  DraggableTableTh,
  getAdminTableColumnDragData,
  setAdminTableColumnDragData,
} from './DraggableTableTh';

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
  onPreviewToggle,
  onMessage,
}: AdminSourcesTableProps) {
  const sortedSources = [...sources];

  const [sourcesColumnOrder, setSourcesColumnOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(ADMIN_SOURCES_TABLE_COLUMN_ORDER_KEY);
      if (raw) {
        try {
          return normalizeSourcesColumnOrder(JSON.parse(raw));
        } catch {
          return [...DEFAULT_SOURCES_COLUMN_ORDER];
        }
      }
    }
    return [...DEFAULT_SOURCES_COLUMN_ORDER];
  });

  const [draggingSourcesColumn, setDraggingSourcesColumn] = useState<string | null>(null);

  const sourcesColDragProps = {
    draggingColumnId: draggingSourcesColumn,
    onColumnDragStart: (e: DragEvent, id: string) => {
      setAdminTableColumnDragData(e, id);
      setDraggingSourcesColumn(id);
    },
    onColumnDragEnd: () => setDraggingSourcesColumn(null),
    onColumnDragOver: (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    onColumnDrop: (e: DragEvent, targetId: string) => {
      e.preventDefault();
      const sourceId = getAdminTableColumnDragData(e);
      if (!sourceId || sourceId === targetId) {
        setDraggingSourcesColumn(null);
        return;
      }
      setSourcesColumnOrder((prev) => {
        const next = reorderColumnIds(prev, sourceId, targetId);
        if (typeof window !== 'undefined') {
          localStorage.setItem(ADMIN_SOURCES_TABLE_COLUMN_ORDER_KEY, JSON.stringify(next));
        }
        return next;
      });
      setDraggingSourcesColumn(null);
    },
  };

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
              {sourcesColumnOrder.map((colId) => {
                switch (colId) {
                  case 'status':
                    return (
                      <DraggableTableTh
                        key={colId}
                        columnId={colId}
                        {...sourcesColDragProps}
                        style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: 'var(--foreground)', whiteSpace: 'nowrap' }}
                      >
                        <span style={{ fontWeight: 'bold' }}>Status</span>
                      </DraggableTableTh>
                    );
                  case 'source':
                    return (
                      <DraggableTableTh
                        key={colId}
                        columnId={colId}
                        {...sourcesColDragProps}
                        style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', color: 'var(--foreground)', whiteSpace: 'nowrap' }}
                      >
                        <span style={{ fontWeight: 'bold' }}>Source</span>
                      </DraggableTableTh>
                    );
                  case 'lastScraped':
                    return (
                      <DraggableTableTh
                        key={colId}
                        columnId={colId}
                        {...sourcesColDragProps}
                        className="last-scraped-column"
                        style={{ padding: '8px', fontWeight: 'bold', color: 'var(--foreground)', whiteSpace: 'nowrap', minWidth: '120px' }}
                      >
                        <span style={{ fontWeight: 'bold' }}>Last Scraped</span>
                      </DraggableTableTh>
                    );
                  case 'actions':
                    return (
                      <DraggableTableTh
                        key={colId}
                        columnId={colId}
                        {...sourcesColDragProps}
                        className="actions-column"
                        style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--foreground)', whiteSpace: 'nowrap', minWidth: '160px' }}
                      >
                        <span style={{ fontWeight: 'bold' }}>Actions</span>
                      </DraggableTableTh>
                    );
                  default:
                    return null;
                }
              })}
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
                  {sourcesColumnOrder.map((colId) => {
                    switch (colId) {
                      case 'status':
                        return (
                          <td key={colId} style={{ padding: '8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
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
                        );
                      case 'source':
                        return (
                          <td key={colId} style={{ padding: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                            <div className="source-name" style={{ fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {source.name}
                            </div>
                          </td>
                        );
                      case 'lastScraped':
                        return (
                          <td key={colId} className="last-scraped-column" style={{ padding: '8px', fontSize: '11px', color: 'var(--foreground)', whiteSpace: 'nowrap', minWidth: '120px' }}>
                            {source.lastScraped ? (
                              <span
                                title={format(new Date(source.lastScraped), 'MMM d, yyyy h:mm a')}
                                style={{ cursor: 'default' }}
                              >
                                {format(new Date(source.lastScraped), 'MM/dd/yy')}
                              </span>
                            ) : (
                              'Never'
                            )}
                          </td>
                        );
                      case 'actions':
                        return (
                          <td key={colId} className="actions-column" style={{ padding: '8px', textAlign: 'right', whiteSpace: 'nowrap', minWidth: '160px', overflow: 'visible' }}>
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
                            </div>
                          </td>
                        );
                      default:
                        return null;
                    }
                  })}
                </tr>
              );
            })}
            {sortedSources.length === 0 && (
              <tr>
                <td colSpan={sourcesColumnOrder.length} style={{ padding: '16px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
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
