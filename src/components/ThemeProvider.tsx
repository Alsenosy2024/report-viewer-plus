import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "aurora" | "sunset" | "ocean"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const themes = {
  aurora: {
    primary: "269 77% 58%",
    secondary: "232 74% 65%", 
    accent: "251 91% 73%",
    gradient: "linear-gradient(135deg, hsl(269 77% 58%), hsl(232 74% 65%), hsl(251 91% 73%))"
  },
  sunset: {
    primary: "15 88% 58%",
    secondary: "340 82% 65%",
    accent: "25 95% 73%", 
    gradient: "linear-gradient(135deg, hsl(15 88% 58%), hsl(340 82% 65%), hsl(25 95% 73%))"
  },
  ocean: {
    primary: "180 77% 58%",
    secondary: "200 74% 65%",
    accent: "170 91% 73%",
    gradient: "linear-gradient(135deg, hsl(180 77% 58%), hsl(200 74% 65%), hsl(170 91% 73%))"
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("aurora")

  useEffect(() => {
    const root = document.documentElement
    const selectedTheme = themes[theme]
    
    // Apply theme CSS variables with smooth transitions
    root.style.setProperty("--theme-primary", selectedTheme.primary)
    root.style.setProperty("--theme-secondary", selectedTheme.secondary)
    root.style.setProperty("--theme-accent", selectedTheme.accent)
    root.style.setProperty("--theme-gradient", selectedTheme.gradient)
    
    // Update glass colors based on theme
    root.style.setProperty("--glass-light", `hsl(${selectedTheme.primary} / 0.05)`)
    root.style.setProperty("--glass-medium", `hsl(${selectedTheme.primary} / 0.08)`)
    root.style.setProperty("--glass-strong", `hsl(${selectedTheme.primary} / 0.12)`)
    root.style.setProperty("--glass-border-light", `hsl(${selectedTheme.accent} / 0.1)`)
    root.style.setProperty("--glass-border-medium", `hsl(${selectedTheme.accent} / 0.2)`)
    root.style.setProperty("--glass-border-strong", `hsl(${selectedTheme.accent} / 0.3)`)
    
    // Add theme class for additional styling
    root.className = root.className.replace(/theme-\w+/g, "")
    root.classList.add(`theme-${theme}`)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}