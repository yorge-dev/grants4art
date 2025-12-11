'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useState, useRef, useEffect } from 'react';
import { formatTagName } from '@/lib/tag-utils';

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

interface GrantCardProps {
  grant: Grant;
}

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
      }}
    >
      <div style={{ marginBottom: eligibility ? '12px' : '0' }}>
        <p style={{ fontSize: '12px', color: 'var(--foreground)', lineHeight: '1.4', margin: 0, whiteSpace: 'pre-wrap' }}>
          {description}
        </p>
      </div>
      {eligibility && (
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '8px' }}>
            Eligibility
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--foreground)', lineHeight: '1.4', margin: 0, whiteSpace: 'pre-wrap' }}>
            {eligibility}
          </p>
        </div>
      )}
    </div>
  );
}

export function GrantCard({ grant }: GrantCardProps) {
  const router = useRouter();
  const deadline = grant.deadline ? new Date(grant.deadline) : null;
  const isExpired = deadline && deadline < new Date();
  const [showTooltip, setShowTooltip] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format amount display - prefer amountMin/amountMax if available, otherwise use amount string
  const formatAmount = () => {
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

  const displayAmount = formatAmount();

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
    hideTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
      hideTimeoutRef.current = null;
    }, 150); // 150ms delay
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the application URL link
    const target = e.target as HTMLElement;
    if (target.closest('span[data-apply-link]')) {
      return;
    }
    router.push(`/grants/${grant.id}`);
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="aol-box block grant-card"
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
      <div className="flex items-start justify-between gap-2 mb-1" style={{ gap: '12px', marginBottom: '12px', position: 'relative' }}>
        <div className="flex-1">
          <h3 className="aol-heading compact-mb" style={{ fontSize: '15px', marginBottom: '8px', color: 'var(--primary)' }}>
            {grant.title}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ color: 'var(--foreground)', fontWeight: 'bold', margin: 0, fontSize: '12px' }}>
              {grant.organization}
            </p>
            <div className="flex items-center gap-2" style={{ gap: '12px', fontSize: '10px', flexWrap: 'nowrap' }}>
              <span className="flex items-center gap-1" style={{ fontWeight: 'bold', color: 'var(--foreground)' }}>
                <span className="material-icons" style={{ fontSize: '12px', verticalAlign: 'middle' }}>location_on</span> {grant.location}
              </span>
              {grant.applicationUrl && (
                <span
                  data-apply-link
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (grant.applicationUrl) {
                      window.open(grant.applicationUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="flex items-center gap-1"
                  style={{
                    fontWeight: 'bold',
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    opacity: 0.8,
                    transition: 'opacity 0.2s ease',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
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
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'var(--color-charcoal-brown-500)',
              border: '1px solid var(--color-saddle-brown-600)',
              borderRadius: '4px',
              background: 'var(--color-khaki-beige-800)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
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
        <div 
          className="flex flex-wrap gap-1 compact-mb" 
          style={{ 
            gap: '6px', 
            marginBottom: '12px',
          }}
        >
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

      <div 
        className="compact-mb grant-description" 
        style={{ 
          fontSize: '12px', 
          color: 'var(--foreground)', 
          marginBottom: showTooltip ? '0' : '12px', 
          lineHeight: '1.3',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          opacity: showTooltip ? 0 : 1,
          maxHeight: showTooltip ? '0' : 'none',
          transition: 'opacity 0.3s ease, max-height 0.3s ease, margin-bottom 0.3s ease',
        }}
      >
        <p style={{ margin: 0 }}>
          {grant.description}
        </p>
      </div>

      <GrantTooltip
        description={grant.description}
        eligibility={grant.eligibility || null}
        isVisible={showTooltip}
      />
    </div>
    </>
  );
}



