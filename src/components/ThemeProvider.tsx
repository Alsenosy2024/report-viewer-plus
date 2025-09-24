import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "aurora" | "sunset" | "ocean" | "neon" | "tropical" | "galaxy"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const themes = {
  aurora: {
    primary: "269 85% 68%",
    secondary: "232 82% 72%", 
    accent: "251 95% 78%",
    gradient: "linear-gradient(135deg, hsl(269 85% 68%), hsl(232 82% 72%), hsl(251 95% 78%))",
    glow: "269 85% 68%"
  },
  sunset: {
    primary: "15 92% 65%",
    secondary: "340 88% 72%",
    accent: "25 98% 78%", 
    gradient: "linear-gradient(135deg, hsl(15 92% 65%), hsl(340 88% 72%), hsl(25 98% 78%))",
    glow: "15 92% 65%"
  },
  ocean: {
    primary: "180 85% 65%",
    secondary: "200 82% 72%",
    accent: "170 95% 78%",
    gradient: "linear-gradient(135deg, hsl(180 85% 65%), hsl(200 82% 72%), hsl(170 95% 78%))",
    glow: "180 85% 65%"
  },
  neon: {
    primary: "300 100% 70%",
    secondary: "180 100% 65%",
    accent: "120 100% 75%",
    gradient: "linear-gradient(135deg, hsl(300 100% 70%), hsl(180 100% 65%), hsl(120 100% 75%))",
    glow: "300 100% 70%"
  },
  tropical: {
    primary: "340 92% 68%",
    secondary: "190 85% 65%",
    accent: "30 95% 72%",
    gradient: "linear-gradient(135deg, hsl(340 92% 68%), hsl(190 85% 65%), hsl(30 95% 72%))",
    glow: "340 92% 68%"
  },
  galaxy: {
    primary: "260 95% 75%",
    secondary: "220 88% 70%",
    accent: "45 90% 80%",
    gradient: "linear-gradient(135deg, hsl(260 95% 75%), hsl(220 88% 70%), hsl(45 90% 80%))",
    glow: "260 95% 75%"
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
    
    // Update glass colors based on theme with enhanced vibrancy
    root.style.setProperty("--glass-light", `hsl(${selectedTheme.primary} / 0.08)`)
    root.style.setProperty("--glass-medium", `hsl(${selectedTheme.primary} / 0.12)`)
    root.style.setProperty("--glass-strong", `hsl(${selectedTheme.primary} / 0.18)`)
    root.style.setProperty("--glass-border-light", `hsl(${selectedTheme.accent} / 0.15)`)
    root.style.setProperty("--glass-border-medium", `hsl(${selectedTheme.accent} / 0.25)`)
    root.style.setProperty("--glass-border-strong", `hsl(${selectedTheme.accent} / 0.4)`)
    root.style.setProperty("--theme-glow", selectedTheme.glow)
    
    // Enhanced visual effects
    root.style.setProperty("--shadow-primary", `0 10px 40px -12px hsl(${selectedTheme.glow} / 0.4)`)
    root.style.setProperty("--shadow-accent", `0 4px 20px -8px hsl(${selectedTheme.accent} / 0.3)`)
    root.style.setProperty("--glow-primary", `0 0 30px hsl(${selectedTheme.glow} / 0.5)`)
    
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