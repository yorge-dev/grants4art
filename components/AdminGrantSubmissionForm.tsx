'use client';

import { useState, useRef, useEffect } from 'react';
import { format, isValid } from 'date-fns';

interface Submission {
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

export function AdminGrantSubmissionForm() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsExpanded(true);
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
      interactionTimeoutRef.current = null;
    }
    if (submissions.length === 0) {
      fetchSubmissions();
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

  const fetchSubmissions = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (grantId: string) => {
    if (!confirm('Approve this grant submission?')) return;

    try {
      const response = await fetch('/api/grants/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId, action: 'approve' })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Grant approved successfully!');
        fetchSubmissions();
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
        body: JSON.stringify({ grantId, action: 'reject' })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Grant rejected and deleted');
        fetchSubmissions();
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

  const formatAmount = (submission: Submission) => {
    if (submission.amountMin !== null && submission.amountMin !== undefined && submission.amountMax !== null && submission.amountMax !== undefined) {
      if (submission.amountMin === submission.amountMax) {
        return `$${submission.amountMin.toLocaleString()}`;
      }
      return `$${submission.amountMin.toLocaleString()} - $${submission.amountMax.toLocaleString()}`;
    } else if (submission.amountMax !== null && submission.amountMax !== undefined) {
      return `Up to $${submission.amountMax.toLocaleString()}`;
    } else if (submission.amountMin !== null && submission.amountMin !== undefined) {
      return `From $${submission.amountMin.toLocaleString()}`;
    }
    return submission.amount || 'N/A';
  };

  return (
    <div
      ref={formRef}
      className="aol-box"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: isExpanded ? '240px' : 'auto',
        padding: '16px',
        height: 'fit-content',
        position: 'relative',
        opacity: isExpanded ? 1 : (isHovered ? 0.9 : 0.5),
        transition: 'width 0.3s ease, opacity 0.4s ease',
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
            transition: 'opacity 0.3s ease',
          }}
        >
          <span>Know of a grant?</span>
          <span
            className="material-icons"
            style={{
              fontSize: '16px',
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            arrow_forward
          </span>
        </h2>
      ) : (
        <div
          style={{
            opacity: isExpanded ? 1 : 0,
            transition: 'opacity 0.4s ease'
          }}
          onFocus={handleInteractionStart}
          onBlur={handleInteractionEnd}
        >
          <h2 className="aol-heading" style={{ fontSize: '16px', marginBottom: '16px', marginTop: 0 }}>
            User Submissions
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <span className="material-icons" style={{ fontSize: '28px', color: 'var(--primary)', display: 'inline-block', animation: 'spin 1s linear infinite' }}>
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
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="aol-box-inset"
                  style={{
                    marginBottom: '12px',
                    padding: '12px',
                    fontSize: '11px'
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
                      onClick={() => handleApprove(submission.id)}
                      className="aol-button"
                      style={{ flex: 1, fontSize: '11px', padding: '4px 8px' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(submission.id)}
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





