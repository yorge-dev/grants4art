'use client';

import { GRANT_TAGS } from '@/lib/constants';
import { formatTagName } from '@/lib/tag-utils';

interface PersonaSelectorProps {
  persona: string;
  onChange: (slug: string) => void;
}

export function PersonaSelector({ persona, onChange }: PersonaSelectorProps) {
  const selected = GRANT_TAGS.find((tag) => tag.slug === persona);

  return (
    <section
      className="aol-box"
      aria-labelledby="persona-heading"
      style={{ padding: '16px 18px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <h2 id="persona-heading" className="aol-heading" style={{ fontSize: '22px', margin: 0 }}>
          I am a
        </h2>
        {selected && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="aol-button-secondary"
            style={{ fontSize: '12px', padding: '4px 10px' }}
          >
            Clear persona
          </button>
        )}
      </div>
      <p style={{ margin: '8px 0 14px', fontSize: '13px', color: 'var(--foreground)' }}>
        Choose a discipline to show matching grants. Your choice stays in this browser.
      </p>
      <div role="group" aria-label="Artist persona" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {GRANT_TAGS.map((tag) => {
          const isSelected = persona === tag.slug;
          const label = formatTagName(tag.name);
          return (
            <button
              key={tag.slug}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(isSelected ? '' : tag.slug)}
              className="aol-button-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '36px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: isSelected ? '700' : '500',
                borderRadius: '999px',
                border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--secondary)'}`,
                background: isSelected ? 'var(--primary)' : 'transparent',
                color: isSelected ? 'var(--background)' : 'var(--foreground)',
              }}
            >
              <span className="material-icons" aria-hidden="true" style={{ fontSize: '16px' }}>{tag.icon}</span>
              {label}
            </button>
          );
        })}
      </div>
      <p
        aria-hidden={!selected}
        style={{
          margin: '12px 0 0',
          minHeight: '18px',
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'var(--primary)',
          visibility: selected ? 'visible' : 'hidden',
        }}
      >
        {selected ? `Showing grants tagged for ${selected.name}.` : 'Showing all grants.'}
      </p>
    </section>
  );
}
