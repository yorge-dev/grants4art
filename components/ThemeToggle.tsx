'use client';

import { useTheme, type Theme } from '@/app/theme-provider';
import { useState, useRef } from 'react';

const THEMES = [
  { slug: 'grey', name: 'Grey', icon: 'invert_colors' },
  { slug: 'dark', name: 'Taiga', icon: null },
  { slug: 'light', name: 'Desert', icon: null },
  { slug: 'arctic', name: 'Arctic', icon: null },
  { slug: 'prairie', name: 'Prairie', icon: null },
] as const;

type ThemeOption = (typeof THEMES)[number]['slug'];

const getThemeColor = (slug: ThemeOption, currentTheme: Theme): string => {
  if (currentTheme === 'grey' || currentTheme === 'grey-inverted') {
    return '#ffffff';
  }

  switch (slug) {
    case 'dark':
      return 'var(--color-charcoal-brown-500)';
    case 'grey':
      return '#888888';
    case 'light':
      return 'var(--color-khaki-beige-800)';
    case 'arctic':
      return '#6096ba';
    case 'prairie':
      return '#acc18a';
    default: {
      const unreachable: never = slug;
      return unreachable;
    }
  }
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // Add a small delay before hiding to prevent flickering
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      hideTimeoutRef.current = null;
    }, 150);
  };

  const handleThemeSelect = (themeSlug: ThemeOption) => {
    if (setTheme) {
      // If selecting grey and currently on grey-inverted, switch to grey
      // Otherwise, set the theme normally
      if (themeSlug === 'grey' && theme === 'grey-inverted') {
        setTheme('grey');
      } else if (themeSlug !== theme) {
        setTheme(themeSlug);
      }
    }
  };

  const handleGreyInvertToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (setTheme) {
      if (theme === 'grey') {
        setTheme('grey-inverted');
      } else if (theme === 'grey-inverted') {
        setTheme('grey');
      }
    }
  };

  const isGreyTheme = theme === 'grey' || theme === 'grey-inverted';
  const isGreyInverted = theme === 'grey-inverted';

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end'
      }}
    >
      {/* Gear Icon */}
      <button
        style={{
          background: 'transparent',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--foreground)',
          opacity: isHovered ? 1 : 0.7,
          transition: 'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '4px'
        }}
        aria-label="Theme settings"
      >
        <span className="material-icons" style={{ fontSize: '20px' }}>settings</span>
      </button>

      {/* Theme List Dropdown */}
      {isHovered && (
        <div
          className="theme-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'var(--text-field-bg)',
            border: '2px solid var(--secondary)',
            borderRadius: '8px',
            padding: '8px',
            minWidth: '160px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            zIndex: 10000
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {THEMES.map((themeOption) => {
              const isSelected = theme === themeOption.slug || (themeOption.slug === 'grey' && isGreyTheme);
              const color = getThemeColor(themeOption.slug, theme);
              const isGreyOption = themeOption.slug === 'grey';
              
              return (
                <div
                  key={themeOption.slug}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <button
                    onClick={() => handleThemeSelect(themeOption.slug)}
                    style={{
                      flex: 1,
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
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
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
                    {themeOption.icon && (
                      <span 
                        className="material-icons" 
                        style={{ 
                          fontSize: '14px', 
                          lineHeight: '1', 
                          display: 'flex', 
                          alignItems: 'center', 
                          opacity: isSelected ? 1 : 0.5 
                        }}
                      >
                        {themeOption.icon}
                      </span>
                    )}
                    <span style={{ flex: 1, opacity: isSelected ? 1 : 0.5 }}>
                      {themeOption.name}
                    </span>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: isSelected ? 'none' : `2px solid var(--secondary)`,
                        backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                        flexShrink: 0
                      }}
                    />
                  </button>
                  {isGreyOption && isGreyTheme && (
                    <button
                      onClick={handleGreyInvertToggle}
                      style={{
                        width: '32px',
                        height: '18px',
                        borderRadius: '9px',
                        border: '2px solid var(--secondary)',
                        backgroundColor: isGreyInverted ? '#888888' : 'transparent',
                        position: 'relative',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                        flexShrink: 0
                      }}
                      aria-label={isGreyInverted ? 'Disable inverted grey' : 'Enable inverted grey'}
                    >
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--foreground)',
                          position: 'absolute',
                          top: '1px',
                          left: isGreyInverted ? '15px' : '1px',
                          transition: 'left 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                        }}
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

