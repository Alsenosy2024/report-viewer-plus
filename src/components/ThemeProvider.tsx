import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'professional-dark' | 'professional-light' | 'business';

type ThemeProviderContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: { value: Theme; label: string; description: string }[];
};

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined);

export const themes = [
  {
    value: 'professional-dark' as Theme,
    label: 'Professional Dark',
    description: 'Deep navy with subtle blue accents'
  },
  {
    value: 'professional-light' as Theme,
    label: 'Professional Light',
    description: 'Clean whites with refined gray tones'
  },
  {
    value: 'business' as Theme,
    label: 'Business',
    description: 'Corporate blue with professional styling'
  }
];

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'professional-light'
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const savedTheme = localStorage.getItem('lovable-theme') as Theme;
    if (savedTheme && themes.some(t => t.value === savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    console.log('Theme changing to:', theme);
    
    // Remove all theme classes
    themes.forEach(({ value }) => {
      root.classList.remove(`theme-${value}`);
    });
    
    // Add current theme class
    if (theme !== 'professional-light') {
      root.classList.add(`theme-${theme}`);
      console.log('Added theme class:', `theme-${theme}`);
    } else {
      console.log('Using default professional-light theme (no class added)');
    }
    
    console.log('Current document classes:', root.className);
    
    // Save to localStorage
    localStorage.setItem('lovable-theme', theme);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    themes
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}