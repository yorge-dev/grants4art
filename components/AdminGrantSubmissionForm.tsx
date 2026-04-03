'use client';

import { useMemo, useState, useRef } from 'react';
import { format, isValid } from 'date-fns';

export interface AdminGrantSubmission {
  id: string;
  title: string;
  organization: string;
  amount?: string | null;
  amountMin?: number | null;
  amountMax?: number | null;
  deadline?: Date | string | null;
  location: string;
  eligibility?: string | null;
  description?: string | null;
  applicationUrl?: string | null;
  category?: string | null;
  createdAt: Date | string;
}

function submissionSearchBlob(s: AdminGrantSubmission): string {
  let amt = '';
  if (
    s.amountMin !== null &&
    s.amountMin !== undefined &&
    s.amountMax !== null &&
    s.amountMax !== undefined
  ) {
    amt =
      s.amountMin === s.amountMax
        ? `$${s.amountMin.toLocaleString()}`
        : `$${s.amountMin.toLocaleString()} - $${s.amountMax.toLocaleString()}`;
  } else if (s.amountMax !== null && s.amountMax !== undefined) {
    amt = `Up to $${s.amountMax.toLocaleString()}`;
  } else if (s.amountMin !== null && s.amountMin !== undefined) {
    amt = `From $${s.amountMin.toLocaleString()}`;
  } else {
    amt = s.amount || '';
  }

  const deadlineFmt =
    s.deadline != null && isValid(new Date(s.deadline))
      ? `${format(new Date(s.deadline), 'MMM d yyyy')} ${format(new Date(s.deadline), 'yyyy-MM-dd')}`
      : '';
  const createdFmt =
    s.createdAt != null && isValid(new Date(s.createdAt))
      ? `${format(new Date(s.createdAt), 'MMM d yyyy')} ${format(new Date(s.createdAt), 'yyyy-MM-dd')}`
      : '';

  return [
    s.title,
    s.organization,
    s.location,
    amt,
    s.amount,
    String(s.amountMin ?? ''),
    String(s.amountMax ?? ''),
    s.description,
    s.eligibility,
    s.applicationUrl,
    s.category,
    deadlineFmt,
    createdFmt,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function submissionMatchesSearch(s: AdminGrantSubmission, needle: string): boolean {
  const q = needle.trim().toLowerCase();
  if (!q) return true;
  return submissionSearchBlob(s).includes(q);
}

export interface AdminGrantSubmissionFormProps {
  submissions: AdminGrantSubmission[];
  submissionsRefreshing: boolean;
  onRefreshSubmissions: () => void | Promise<void>;
  searchQuery: string;
}

export function AdminGrantSubmissionForm({
  submissions,
  submissionsRefreshing,
  onRefreshSubmissions,
  searchQuery,
}: AdminGrantSubmissionFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const visibleSubmissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter((s) => submissionMatchesSearch(s, q));
  }, [submissions, searchQuery]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsExpanded(true);
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
      interactionTimeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!isInteracting) {
      setTimeout(() => {
        if (!isInteracting) {
          setIsExpanded(false);
        }
      }, 200);
    }
  };

  const handleInteractionStart = () => {
    setIsInteracting(true);
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
  };

  const handleInteractionEnd = () => {
    interactionTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 300);
  };

  const handleApprove = async (grantId: string) => {
    if (!confirm('Approve this grant submission?')) return;

    try {
      const response = await fetch('/api/grants/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId, action: 'approve' }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Grant approved successfully!');
        await onRefreshSubmissions();
      } else {
        alert(data.error || 'Failed to approve grant');
      }
    } catch (error) {
      console.error('Error approving grant:', error);
      alert('Error approving grant');
    }
  };

  const handleReject = async (grantId: string) => {
    if (!confirm('Reject and delete this grant submission?')) return;

    try {
      const response = await fetch('/api/grants/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId, action: 'reject' }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Grant rejected and deleted');
        await onRefreshSubmissions();
      } else {
        alert(data.error || 'Failed to reject grant');
      }
    } catch (error) {
      console.error('Error rejecting grant:', error);
      alert('Error rejecting grant');
    }
  };

  const formatSafeDate = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid Date';
  };

  const formatAmount = (submission: AdminGrantSubmission) => {
    if (
      submission.amountMin !== null &&
      submission.amountMin !== undefined &&
      submission.amountMax !== null &&
      submission.amountMax !== undefined
    ) {
      if (submission.amountMin === submission.amountMax) {
        return `$${submission.amountMin.toLocaleString()}`;
      }
      return `$${submission.amountMin.toLocaleString()} - $${submission.amountMax.toLocaleString()}`;
    }
    if (submission.amountMax !== null && submission.amountMax !== undefined) {
      return `Up to $${submission.amountMax.toLocaleString()}`;
    }
    if (submission.amountMin !== null && submission.amountMin !== undefined) {
      return `From $${submission.amountMin.toLocaleString()}`;
    }
    return submission.amount || 'N/A';
  };

  const searchActive = searchQuery.trim().length > 0;

  return (
    <div
      ref={formRef}
      className="aol-box"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: isExpanded ? '100%' : 'auto',
        padding: '16px',
        height: 'fit-content',
        position: 'relative',
        opacity: isExpanded ? 1 : isHovered ? 0.9 : 0.5,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      {!isExpanded ? (
        <h2
          className="aol-heading"
          style={{
            cursor: 'pointer',
            fontSize: '16px',
            marginBottom: 0,
            marginTop: 0,
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <span>User submissions{submissions.length > 0 ? ` (${submissions.length})` : ''}</span>
          <span
            className="material-icons"
            style={{
              fontSize: '16px',
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
              transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            arrow_forward
          </span>
        </h2>
      ) : (
        <div
          style={{
            opacity: isExpanded ? 1 : 0,
            transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onFocus={handleInteractionStart}
          onBlur={handleInteractionEnd}
        >
          <h2 className="aol-heading" style={{ fontSize: '16px', marginBottom: '16px', marginTop: 0 }}>
            User submissions
            {searchActive && (
              <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--foreground)', marginLeft: '8px', opacity: 0.75 }}>
                Showing {visibleSubmissions.length} of {submissions.length}
              </span>
            )}
          </h2>

          {submissionsRefreshing ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <span
                className="material-icons"
                style={{ fontSize: '28px', color: 'var(--primary)', display: 'inline-block', animation: 'spin 1s linear infinite' }}
              >
                refresh
              </span>
              <p style={{ fontSize: '12px', color: 'var(--foreground)', marginTop: '8px' }}>Loading...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <span className="material-icons" style={{ fontSize: '28px', color: 'var(--foreground)', opacity: 0.5 }}>
                description
              </span>
              <p style={{ fontSize: '12px', color: 'var(--foreground)', marginTop: '8px', opacity: 0.7 }}>
                No pending submissions
              </p>
            </div>
          ) : visibleSubmissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <span className="material-icons" style={{ fontSize: '28px', color: 'var(--foreground)', opacity: 0.5 }}>
                search_off
              </span>
              <p style={{ fontSize: '12px', color: 'var(--foreground)', marginTop: '8px', opacity: 0.7 }}>
                No submissions match your search
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {visibleSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="aol-box-inset"
                  style={{
                    marginBottom: '12px',
                    padding: '12px',
                    fontSize: '11px',
                  }}
                >
                  <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '8px', marginTop: 0 }}>
                    {submission.title}
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--foreground)', margin: '4px 0', opacity: 0.8 }}>
                    <strong>Org:</strong> {submission.organization}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--foreground)', margin: '4px 0', opacity: 0.8 }}>
                    <strong>Amount:</strong> {formatAmount(submission)}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--foreground)', margin: '4px 0', opacity: 0.8 }}>
                    <strong>Location:</strong> {submission.location}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--foreground)', margin: '4px 0', opacity: 0.8 }}>
                    <strong>Deadline:</strong> {formatSafeDate(submission.deadline)}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--foreground)', margin: '4px 0', opacity: 0.8 }}>
                    <strong>Submitted:</strong> {formatSafeDate(submission.createdAt)}
                  </p>
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => void handleApprove(submission.id)}
                      className="aol-button"
                      style={{ flex: 1, fontSize: '11px', padding: '4px 8px' }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReject(submission.id)}
                      className="aol-button-secondary"
                      style={{ flex: 1, fontSize: '11px', padding: '4px 8px' }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
