'use client';

import { useCallback, useRef, useState } from 'react';
import { isGrantSaved, SAVED_GRANTS_CHANGED_EVENT, toggleSavedGrant } from '@/lib/browser-storage';
import { formatTagName } from '@/lib/tag-utils';
import { deadlineLabel, formatGrantAmount, isGrantClosed, type PublicGrant } from '@/lib/public-grants';

interface GrantCardProps {
  grant: PublicGrant;
}

export function GrantCard({ grant }: GrantCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const closed = isGrantClosed(grant.deadline);
  const amount = formatGrantAmount(grant);
  const deadline = deadlineLabel(grant.deadline);
  const detailsId = `grant-details-${grant.id}`;

  const cardRef = useCallback((node: HTMLElement | null) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (!node) return;
    const sync = () => setSaved(isGrantSaved(grant.id));
    sync();
    window.addEventListener(SAVED_GRANTS_CHANGED_EVENT, sync);
    cleanupRef.current = () => window.removeEventListener(SAVED_GRANTS_CHANGED_EVENT, sync);
  }, [grant.id]);

  const toggleExpanded = () => setExpanded((current) => !current);

  return (
    <article
      ref={cardRef}
      className="aol-box grant-card"
      style={{
        padding: '16px',
        color: 'var(--foreground)',
        opacity: closed ? 0.72 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 className="aol-heading" style={{ fontSize: '16px', margin: '0 0 6px', color: 'var(--primary)' }}>
            {grant.title}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>{grant.organization}</p>
        </div>
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${grant.title} from saved grants` : `Save ${grant.title} on this device`}
          onClick={() => toggleSavedGrant(grant)}
          style={{
            flexShrink: 0,
            minWidth: '40px',
            minHeight: '40px',
            padding: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '999px',
            border: `1.5px solid ${saved ? 'var(--primary)' : 'var(--secondary)'}`,
            background: saved ? 'var(--primary)' : 'transparent',
            color: saved ? 'var(--background)' : 'var(--foreground)',
          }}
        >
          <span className="material-icons" aria-hidden="true" style={{ fontSize: '20px' }}>
            {saved ? 'bookmark' : 'bookmark_border'}
          </span>
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', marginTop: '10px', fontSize: '12px', fontWeight: 'bold' }}>
        {amount && <span>{amount}</span>}
        <span style={{ color: closed ? '#b71c1c' : 'var(--foreground)' }}>{deadline}</span>
        <span style={{ fontWeight: '500' }}>{grant.location}</span>
      </div>

      {grant.tags && grant.tags.length > 0 && (
        <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
          {grant.tags.map((tagRelation) => (
            <li
              key={tagRelation.tag.slug}
              style={{
                padding: '2px 6px',
                fontSize: '11px',
                background: 'var(--color-camel-800)',
                color: 'var(--color-charcoal-brown-500)',
                border: '1px solid var(--secondary)',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}
            >
              {formatTagName(tagRelation.tag.name)}
            </li>
          ))}
        </ul>
      )}

      {!expanded && (
        <p
          style={{
            margin: '12px 0 0',
            fontSize: '13px',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {grant.description}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={toggleExpanded}
          className="aol-button"
          style={{ minHeight: '36px', fontSize: '12px' }}
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>
        {grant.applicationUrl && (
          <a
            href={grant.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="aol-button-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: '36px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              textDecoration: 'none',
              color: 'var(--foreground)',
            }}
          >
            Apply
          </a>
        )}
      </div>

      {expanded && (
        <div id={detailsId} style={{ marginTop: '12px', padding: '12px', background: 'var(--text-field-bg)', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', margin: '0 0 6px' }}>Description</h4>
          <p style={{ fontSize: '13px', lineHeight: 1.45, margin: 0, whiteSpace: 'pre-wrap' }}>{grant.description}</p>
          {grant.eligibility && (
            <>
              <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', margin: '12px 0 6px' }}>Eligibility</h4>
              <p style={{ fontSize: '13px', lineHeight: 1.45, margin: 0, whiteSpace: 'pre-wrap' }}>{grant.eligibility}</p>
            </>
          )}
        </div>
      )}
    </article>
  );
}
