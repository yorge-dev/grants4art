'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

type Theme = 'light' | 'grey' | 'grey-inverted' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  const initRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      return;
    }

    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Temporarily hide background pattern during transition
      document.body.style.setProperty('--pattern-opacity', '0');
      
      // Small delay to ensure smooth transition
      setTimeout(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Restore pattern after transition
        setTimeout(() => {
          document.body.style.setProperty('--pattern-opacity', '1');
        }, 300);
      }, 10);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => {
      // Reversed order: dark → grey → light → dark
      if (prev === 'dark') return 'grey';
      if (prev === 'grey') return 'light';
      return 'dark';
    });
  };

  const setThemeDirectly = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeDirectly }}>
      <div ref={initRefCallback} aria-hidden style={{ display: 'none' }} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
