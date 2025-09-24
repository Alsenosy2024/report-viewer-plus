import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'neon-cyber' | 'tropical' | 'galaxy' | 'aurora' | 'electric' | 'light';

type ThemeProviderContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: { value: Theme; label: string; description: string }[];
};

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined);

export const themes = [
  {
    value: 'neon-cyber' as Theme,
    label: 'Neon Cyber',
    description: 'Futuristic neon lights with purple and cyan'
  },
  {
    value: 'tropical' as Theme,
    label: 'Tropical Paradise',
    description: 'Vibrant coral, yellow, and turquoise'
  },
  {
    value: 'galaxy' as Theme,
    label: 'Galaxy Dreams',
    description: 'Deep space purples with starlight accents'
  },
  {
    value: 'aurora' as Theme,
    label: 'Aurora Borealis',
    description: 'Northern lights greens and blues'
  },
  {
    value: 'electric' as Theme,
    label: 'Electric Storm',
    description: 'High-energy yellows and electric purple'
  },
  {
    value: 'light' as Theme,
    label: 'Pure Light',
    description: 'Clean light mode with colorful accents'
  }
];

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'neon-cyber'
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
    
    // Remove all theme classes
    themes.forEach(({ value }) => {
      root.classList.remove(`theme-${value}`);
    });
    
    // Add current theme class
    if (theme !== 'neon-cyber') {
      root.classList.add(`theme-${theme}`);
    }
    
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