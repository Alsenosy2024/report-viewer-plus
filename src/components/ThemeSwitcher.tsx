import React from "react"
import { Palette } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

const themeOptions = [
  { value: "aurora", label: "Aurora", colors: ["#A855F7", "#8B5CF6", "#C084FC"] },
  { value: "sunset", label: "Sunset", colors: ["#F97316", "#EC4899", "#FB923C"] },
  { value: "ocean", label: "Ocean", colors: ["#06B6D4", "#3B82F6", "#10B981"] },
  { value: "neon", label: "Neon Cyber", colors: ["#E879F9", "#06D6A0", "#4ADE80"] },
  { value: "tropical", label: "Tropical", colors: ["#F472B6", "#22D3EE", "#FBBF24"] },
  { value: "galaxy", label: "Galaxy", colors: ["#A855F7", "#60A5FA", "#FDE047"] },
] as const

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="glass" size="icon" className="glass-hover glass-glow">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="glass-medium backdrop-blur-md border-0 shadow-glass-strong animate-scale-in"
        align="end"
      >
        {themeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value as any)}
            className={`glass-hover cursor-pointer p-3 ${
              theme === option.value ? "glass-glow" : ""
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                {option.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="font-medium">{option.label}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}