import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Palette, Moon, Sun, Briefcase } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

const themeIcons = {
  'professional-dark': Moon,
  'professional-light': Sun,
  'business': Briefcase
};

const themeColors = {
  'professional-dark': 'hsl(215, 85%, 60%)',
  'professional-light': 'hsl(213, 94%, 68%)',
  'business': 'hsl(217, 91%, 60%)'
};

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative gap-2 hover-lift glass interactive",
            "hover:shadow-md transition-smooth"
          )}
        >
          <Palette className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline text-foreground">
            {themes.find(t => t.value === theme)?.label}
          </span>
          <div 
            className="w-3 h-3 rounded-full shadow-inner"
            style={{ 
              backgroundColor: themeColors[theme]
            }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={cn(
          "w-80 p-2 glass border-border"
        )}
        sideOffset={8}
      >
        <div className="grid grid-cols-2 gap-2">
          {themes.map((themeOption) => {
            const Icon = themeIcons[themeOption.value];
            const isActive = theme === themeOption.value;
            
            return (
              <DropdownMenuItem
                key={themeOption.value}
                className={cn(
                  "flex flex-col items-start p-3 cursor-pointer rounded-lg",
                  "transition-smooth hover:scale-[1.02]",
                  "border border-transparent hover:border-primary/20",
                  "relative overflow-hidden group",
                  isActive && "bg-primary/10 border-primary/30 shadow-md"
                )}
                onClick={() => {
                  setTheme(themeOption.value);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-2 w-full mb-1">
                  <Icon 
                    className="h-4 w-4 transition-smooth group-hover:scale-110" 
                    style={{ color: themeColors[themeOption.value] }}
                  />
                  <span className="font-medium text-sm">
                    {themeOption.label}
                  </span>
                  {isActive && (
                    <Badge 
                      variant="secondary" 
                      className="ml-auto text-xs"
                    >
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {themeOption.description}
                </p>
                <div 
                  className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-5",
                    "transition-opacity duration-300 rounded-lg"
                  )}
                  style={{ 
                    background: `linear-gradient(135deg, ${themeColors[themeOption.value]}22, transparent)`
                  }}
                />
              </DropdownMenuItem>
            );
          })}
        </div>
        
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-center text-xs text-muted-foreground">
            <Palette className="inline-block w-3 h-3 mr-1" />
            Choose your visual experience
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}