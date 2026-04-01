'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { AdminGrantTooltip } from './AdminGrantTooltip';
import { formatTagName } from '@/lib/tag-utils';

interface AdminGrantPreviewCardGrant {
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

const formatGrantAmount = (grant: AdminGrantPreviewCardGrant) => {
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

interface AdminGrantPreviewCardProps {
  grant: AdminGrantPreviewCardGrant;
}

export function AdminGrantPreviewCard({ grant }: AdminGrantPreviewCardProps) {
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deadline = grant.deadline ? new Date(grant.deadline) : null;
  const isExpired = deadline && deadline < new Date();
  const displayAmount = formatGrantAmount(grant);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
      hideTimeoutRef.current = null;
    }, 150);
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
            transition: 'text-decoration 0.2s cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
                    transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
              <span className="material-icons" style={{ fontSize: '12px', verticalAlign: 'middle' }}>calendar_today</span> {isExpired ? 'Applications Closed' : `Due in ${formatDistanceToNow(deadline)}`}
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
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <p style={{ margin: 0 }}>
            {grant.description}
          </p>
        </div>
      )}

      <AdminGrantTooltip
        description={grant.description}
        eligibility={grant.eligibility || null}
        isVisible={tooltipVisible}
      />
    </div>
  );
}
