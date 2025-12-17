'use client';

import { useState, useRef, useCallback } from 'react';
import { useTheme } from '@/app/theme-provider';
import { GRANT_CATEGORIES } from '@/lib/constants';

interface GrantFiltersProps {
  onFilterChange: (filters: {
    search: string;
    categories: string[];
  }) => void;
  loading?: boolean;
  page?: number;
  total?: number;
}

// Icon and color mapping using GRANT_CATEGORIES constant
const getCategoryIcon = (slug: string): string => {
  const category = GRANT_CATEGORIES.find(c => c.slug === slug);
  return category?.icon || 'label';
};

const getCategoryColor = (slug: string, theme: string): string => {
  // In grey theme, use white (no colors)
  if (theme === 'grey') {
    return '#ffffff';
  }
  
  const category = GRANT_CATEGORIES.find(c => c.slug === slug);
  return category?.color || 'var(--primary)';
};

export function GrantFilters({ onFilterChange, loading = false, page = 1, total = 0 }: GrantFiltersProps) {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('Austin');

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevFiltersRef = useRef<string>('');
  const locationSelectRef = useRef<HTMLSelectElement>(null);

  // Helper to serialize filters for comparison
  const serializeFilters = useCallback((search: string, categories: string[]) => {
    return JSON.stringify({ 
      search, 
      categories: [...categories].sort()
    });
  }, []);

  // Update filters function
  const updateFilters = useCallback((searchValue: string, categoriesValue: string[]) => {
    const currentSerialized = serializeFilters(searchValue, categoriesValue);
    
    // Only call onFilterChange if values actually changed
    if (prevFiltersRef.current !== currentSerialized) {
      prevFiltersRef.current = currentSerialized;
      onFilterChange({ search: searchValue, categories: categoriesValue });
    }
  }, [serializeFilters, onFilterChange]);

  // Store current categories in ref to avoid stale closure
  const selectedCategoriesRef = useRef(selectedCategories);
  selectedCategoriesRef.current = selectedCategories;

  // Handle search change with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search - read from ref to get current value
    searchTimeoutRef.current = setTimeout(() => {
      updateFilters(value, selectedCategoriesRef.current);
      searchTimeoutRef.current = null;
    }, 300); // 300ms debounce delay
  }, [updateFilters]);

  // Handle category change (immediate update)
  const handleCategoryChange = useCallback((newCategories: string[]) => {
    setSelectedCategories(newCategories);
    
    // Clear any pending search debounce and apply immediately
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    updateFilters(search, newCategories);
  }, [search, updateFilters]);

  const toggleCategory = (slug: string) => {
    const newCategories = selectedCategories.includes(slug) 
      ? selectedCategories.filter(c => c !== slug)
      : [...selectedCategories, slug];
    handleCategoryChange(newCategories);
  };

  const handleClearFilters = () => {
    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    setSearch('');
    setSelectedCategories([]);
    prevFiltersRef.current = '';
    onFilterChange({ search: '', categories: [] });
  };

  return (
    <div className="aol-box" style={{ 
      width: '100%',
      padding: '16px',
      height: 'fit-content'
    }}>
      <h2 className="aol-heading" style={{ fontSize: '16px', marginBottom: '12px', marginTop: 0 }}>
        Filters
      </h2>

      {/* Pagination Info */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '12px', color: 'var(--foreground)', fontWeight: 'bold', margin: 0 }}>
          {loading ? 'Loading...' : (() => {
            if (total === 0) {
              return 'No grants found';
            }
            const start = (page - 1) * 10 + 1;
            const end = Math.min(page * 10, total);
            return `Showing ${start}-${end} of ${total} grants`;
          })()}
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="search" className="block compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Search
        </label>
        <input
          type="text"
          id="search"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Grant title, organization..."
          className="aol-input"
          style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
        />
      </div>

      {/* Category Toggle Buttons */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className="block compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
            Funding Source
          </label>
          {selectedCategories.length > 0 && (
            <button
              onClick={handleClearFilters}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '10px',
                color: 'var(--primary)',
                textDecoration: 'underline',
                cursor: 'pointer',
                opacity: 0.7,
                transition: 'opacity 0.15s ease',
                fontWeight: 'normal',
                textTransform: 'none',
                letterSpacing: '0'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
              }}
            >
              Clear
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {GRANT_CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category.slug);
            const icon = getCategoryIcon(category.slug);
            const color = getCategoryColor(category.slug, theme);
            
            return (
              <button
                key={category.slug}
                onClick={() => toggleCategory(category.slug)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  fontSize: '12px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--foreground)',
                  border: 'none',
                  opacity: isSelected ? 1 : 0.5,
                  fontWeight: isSelected ? '600' : 'normal',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.opacity = '0.7';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.opacity = '0.5';
                  }
                }}
              >
                <span className="material-icons" style={{ fontSize: '14px', lineHeight: '1', display: 'flex', alignItems: 'center', opacity: isSelected ? 1 : 0.5 }}>{icon}</span>
                <span style={{ flex: 1, opacity: isSelected ? 1 : 0.5 }}>{category.name}</span>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: `2px solid ${isSelected ? color : 'var(--secondary)'}`,
                    backgroundColor: isSelected ? color : 'transparent',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Location Dropdown */}
      <div style={{ marginBottom: '24px' }}>
        <label className="block compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Location
          <span style={{
            fontSize: '8px',
            padding: '1px 3px',
            background: 'var(--inset-bg)',
            border: '1px solid var(--secondary)',
            borderRadius: '12px',
            color: 'var(--foreground)',
            opacity: 0.7,
            fontWeight: 'normal',
            textTransform: 'none',
            letterSpacing: '0'
          }}>
            Coming Soon
          </span>
        </label>
        <select
          ref={locationSelectRef}
          value={selectedLocation}
          onChange={(e) => {
            // Prevent changing selection - keep it locked to Austin
            const newValue = e.target.value;
            if (newValue !== 'Austin') {
              // Reset to Austin if user tries to select something else
              setSelectedLocation('Austin');
              if (locationSelectRef.current) {
                locationSelectRef.current.value = 'Austin';
              }
            }
          }}
          className="aol-input"
          style={{ 
            width: '100%', 
            fontSize: '12px', 
            padding: '6px 10px',
            cursor: 'pointer'
          }}
        >
          <option value="Austin">Austin</option>
          <option value="Houston" disabled>Houston</option>
          <option value="Dallas" disabled>Dallas</option>
          <option value="San Antonio" disabled>San Antonio</option>
          <option value="Fort Worth" disabled>Fort Worth</option>
          <option value="El Paso" disabled>El Paso</option>
          <option value="Arlington" disabled>Arlington</option>
          <option value="Corpus Christi" disabled>Corpus Christi</option>
          <option value="Plano" disabled>Plano</option>
          <option value="Lubbock" disabled>Lubbock</option>
          <option value="Denton" disabled>Denton</option>
        </select>
      </div>

    </div>
  );
}
