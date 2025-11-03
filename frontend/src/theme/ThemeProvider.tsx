import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { theme } from './theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: typeof theme;
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export function ThemeProvider({ children, defaultMode = 'light' }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('theme-mode');
    return (stored as ThemeMode) || defaultMode;
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
    document.documentElement.setAttribute('data-theme', mode);

    // Apply theme colors to CSS variables
    const root = document.documentElement;
    if (mode === 'dark') {
      root.style.setProperty('--color-background', theme.colors.neutral[900]);
      root.style.setProperty('--color-surface', theme.colors.neutral[800]);
      root.style.setProperty('--color-text', theme.colors.neutral[50]);
      root.style.setProperty('--color-text-secondary', theme.colors.neutral[400]);
    } else {
      root.style.setProperty('--color-background', theme.colors.neutral[0]);
      root.style.setProperty('--color-surface', theme.colors.neutral[50]);
      root.style.setProperty('--color-text', theme.colors.neutral[900]);
      root.style.setProperty('--color-text-secondary', theme.colors.neutral[600]);
    }
  }, [mode]);

  const toggleMode = () => {
    setModeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const value = {
    theme,
    mode,
    toggleMode,
    setMode
  };

  return (
    <ThemeContext.Provider value={value}>
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
