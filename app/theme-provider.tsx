'use client';

import { createContext, useContext, useState, useRef, ReactNode } from 'react';

type Theme = 'light' | 'grey' | 'grey-inverted' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mountedRef = useRef(false);
  const initializedRef = useRef(false);
  
  // Initialize theme from localStorage on first render - use const with IIFE to avoid mutation
  const initialTheme: Theme = (() => {
    if (typeof window !== 'undefined' && !initializedRef.current) {
      initializedRef.current = true;
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme) {
        return savedTheme;
      }
    }
    return 'light';
  })();
  
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const prevThemeRef = useRef<Theme>(initialTheme);

  // Initialize on mount
  if (typeof window !== 'undefined' && !mountedRef.current) {
    mountedRef.current = true;
    document.documentElement.setAttribute('data-theme', initialTheme);
  }

  // Update theme when it changes
  const updateTheme = (newTheme: Theme) => {
    if (prevThemeRef.current === newTheme) return;
    
    prevThemeRef.current = newTheme;
    setTheme(newTheme);
    
    // Temporarily hide background pattern during transition
    document.body.style.setProperty('--pattern-opacity', '0');
    
    // Small delay to ensure smooth transition
    setTimeout(() => {
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Restore pattern after transition
      setTimeout(() => {
        document.body.style.setProperty('--pattern-opacity', '1');
      }, 300);
    }, 10);
  };

  const toggleTheme = () => {
    // Reversed order: dark → grey → light → dark
    const nextTheme = theme === 'dark' ? 'grey' : theme === 'grey' ? 'light' : 'dark';
    updateTheme(nextTheme);
  };

  const setThemeDirectly = (newTheme: Theme) => {
    updateTheme(newTheme);
  };

  // Always provide the context, even before mounting
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeDirectly }}>
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

