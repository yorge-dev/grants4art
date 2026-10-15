'use client';

import { GRANT_CATEGORIES } from '@/lib/constants';
import type { GrantStatusFilter, PublicFilters } from '@/lib/public-grants';

interface GrantFiltersProps {
  filters: PublicFilters;
  onSearchChange: (search: string) => void;
  onCategoriesChange: (categories: string[]) => void;
  onStatusChange: (status: GrantStatusFilter) => void;
  onClear: () => void;
}

const STATUS_OPTIONS: Array<{ id: GrantStatusFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Closed' },
];

export function GrantFilters({
  filters,
  onSearchChange,
  onCategoriesChange,
  onStatusChange,
  onClear,
}: GrantFiltersProps) {
  const hasActiveFilters = filters.search.trim().length > 0
    || filters.categories.length > 0
    || filters.status !== 'all';

  const toggleCategory = (slug: string) => {
    const next = filters.categories.includes(slug)
      ? filters.categories.filter((category) => category !== slug)
      : [...filters.categories, slug];
    onCategoriesChange(next);
  };

  return (
    <div className="aol-box" style={{ width: '100%', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <h2 className="aol-heading" style={{ fontSize: '16px', margin: 0 }}>
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '12px',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="grant-search" style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Search
        </label>
        <input
          type="search"
          id="grant-search"
          value={filters.search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Grant title, organization..."
          className="aol-input"
          style={{ width: '100%', fontSize: '13px', padding: '8px 10px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p id="deadline-filter-label" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Deadline
        </p>
        <div role="group" aria-labelledby="deadline-filter-label" style={{ display: 'flex', gap: '6px' }}>
          {STATUS_OPTIONS.map((option) => {
            const isSelected = filters.status === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onStatusChange(option.id)}
                className="aol-button-secondary"
                style={{
                  flex: 1,
                  minHeight: '36px',
                  fontSize: '12px',
                  fontWeight: isSelected ? '700' : '500',
                  background: isSelected ? 'var(--primary)' : 'transparent',
                  color: isSelected ? 'var(--background)' : 'var(--foreground)',
                  border: '1.5px solid var(--secondary)',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p id="funding-filter-label" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Funding source
        </p>
        <div role="group" aria-labelledby="funding-filter-label" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {GRANT_CATEGORIES.map((category) => {
            const isSelected = filters.categories.includes(category.slug);
            return (
              <button
                key={category.slug}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleCategory(category.slug)}
                className="aol-button-secondary"
                style={{
                  width: '100%',
                  minHeight: '36px',
                  padding: '6px 12px',
                  fontSize: '13px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isSelected ? 'var(--primary)' : 'transparent',
                  color: isSelected ? 'var(--background)' : 'var(--foreground)',
                  border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--secondary)'}`,
                  fontWeight: isSelected ? '700' : '500',
                  borderRadius: '999px',
                }}
              >
                <span className="material-icons" aria-hidden="true" style={{ fontSize: '18px' }}>{category.icon}</span>
                <span style={{ flex: 1 }}>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
