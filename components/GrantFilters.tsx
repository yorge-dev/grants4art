'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/app/theme-provider';
import { GRANT_CATEGORIES } from '@/lib/constants';

interface GrantFiltersProps {
  onFilterChange: (filters: {
    search: string;
    categories: string[];
  }) => void;
}

// Icon and color mapping using GRANT_CATEGORIES constant
const getCategoryIcon = (slug: string): string => {
  const category = GRANT_CATEGORIES.find(c => c.slug === slug);
  return category?.icon || '🏷';
};

const getCategoryColor = (slug: string, theme: string): string => {
  // In grey theme, use white (no colors)
  if (theme === 'grey') {
    return '#ffffff';
  }
  
  const category = GRANT_CATEGORIES.find(c => c.slug === slug);
  return category?.color || 'var(--primary)';
};

export function GrantFilters({ onFilterChange }: GrantFiltersProps) {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const filtersRef = useRef({ search, categories: selectedCategories });
  const prevFiltersRef = useRef<string>('');

  // Keep refs in sync with state
  useEffect(() => {
    filtersRef.current = { search, categories: selectedCategories };
  }, [search, selectedCategories]);

  // Helper to serialize filters for comparison
  const serializeFilters = (f: typeof filtersRef.current) => {
    return JSON.stringify({ 
      search: f.search, 
      categories: [...f.categories].sort()
    });
  };

  // Debounced search effect - only triggers on search changes
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      const currentFilters = filtersRef.current;
      const currentSerialized = serializeFilters(currentFilters);
      
      // Only update if filters actually changed
      if (prevFiltersRef.current !== currentSerialized) {
        prevFiltersRef.current = currentSerialized;
        onFilterChange(currentFilters);
      }
    }, 300); // 300ms debounce delay

    // Cleanup function to clear timeout
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, onFilterChange]); // Only depend on search changes

  // Update filters when other fields change (non-search)
  useEffect(() => {
    // Clear any pending search debounce and apply immediately
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    const currentFilters = filtersRef.current;
    const currentSerialized = serializeFilters(currentFilters);
    
    // Only call onFilterChange if values actually changed
    if (prevFiltersRef.current !== currentSerialized) {
      prevFiltersRef.current = currentSerialized;
      onFilterChange(currentFilters);
    }
  }, [selectedCategories, onFilterChange]); // Exclude search to avoid bypassing debounce

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const toggleCategory = (slug: string) => {
    setSelectedCategories(prev => 
      prev.includes(slug) 
        ? prev.filter(c => c !== slug)
        : [...prev, slug]
    );
  };

  const handleClearFilters = () => {
    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    setSearch('');
    setSelectedCategories([]);
    onFilterChange({ search: '', categories: [] });
  };

  return (
    <div className="aol-box" style={{ 
      width: '100%',
      maxWidth: '100%',
      padding: '16px',
      height: 'fit-content',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <h2 className="aol-heading" style={{ fontSize: '16px', marginBottom: '16px', marginTop: 0 }}>
        Filters
      </h2>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="search" className="block compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Search
        </label>
        <input
          type="text"
          id="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Grant title, organization..."
          className="aol-input"
          style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
        />
      </div>

      {/* Category Toggle Buttons */}
      <div style={{ marginBottom: '24px' }}>
        <label className="block compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Funding Source
          {selectedCategories.length > 0 && (
            <a
              onClick={(e) => {
                e.preventDefault();
                handleClearFilters();
              }}
              href="#"
              style={{
                fontSize: '9px',
                color: 'var(--foreground)',
                opacity: 0.6,
                textDecoration: 'none',
                fontWeight: 'normal',
                textTransform: 'none',
                letterSpacing: 'normal',
                cursor: 'pointer',
                transition: 'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.6';
              }}
            >
              (clear all)
            </a>
          )}
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {GRANT_CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category.slug);
            const icon = getCategoryIcon(category.slug);
            const color = getCategoryColor(category.slug, theme);
            
            return (
              <button
                key={category.slug}
                onClick={() => toggleCategory(category.slug)}
                className="aol-button-secondary"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  fontSize: '12px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: isSelected ? color : 'transparent',
                  color: isSelected ? '#fff' : 'var(--foreground)',
                  border: `1.5px solid var(--secondary)`,
                  opacity: isSelected ? 1 : 0.5,
                  fontWeight: isSelected ? '600' : 'normal',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                <span className="material-icons" style={{ fontSize: '18px', lineHeight: '1', display: 'flex', alignItems: 'center' }}>{icon}</span>
                <span style={{ flex: 1 }}>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}