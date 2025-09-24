import * as React from "react"
import { cn } from "@/lib/utils"

export interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "light" | "medium" | "strong"
  interactive?: boolean
  floating?: boolean
  shimmer?: boolean
  glow?: boolean
}

const LiquidGlassCard = React.forwardRef<HTMLDivElement, LiquidGlassCardProps>(
  ({ className, intensity = "medium", interactive = false, floating = false, shimmer = false, glow = false, children, ...props }, ref) => {
    const intensityClasses = {
      light: "glass-light",
      medium: "glass-medium", 
      strong: "glass-strong"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative isolation-isolate z-10 group",
          intensityClasses[intensity],
          interactive && "glass-hover glass-morph glass-ripple cursor-pointer",
          floating && "glass-float",
          shimmer && "glass-shimmer",
          glow && "glass-glow glass-breathe",
          className
        )}
        {...props}
      >
        {/* Enhanced glass highlight effect */}
        <div className="absolute inset-0 rounded-inherit pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-inherit" />
          <div className="absolute inset-0 bg-gradient-to-tl from-primary/5 via-transparent to-transparent rounded-inherit" />
        </div>
        
        {/* Soft specular highlight */}
        <div className="absolute inset-0 rounded-inherit pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity duration-700">
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-white/20 to-transparent rounded-inherit" />
        </div>
        
        {/* Content layer */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)
LiquidGlassCard.displayName = "LiquidGlassCard"

const LiquidGlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
LiquidGlassCardHeader.displayName = "LiquidGlassCardHeader"

const LiquidGlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
LiquidGlassCardTitle.displayName = "LiquidGlassCardTitle"

const LiquidGlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
LiquidGlassCardDescription.displayName = "LiquidGlassCardDescription"

const LiquidGlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
LiquidGlassCardContent.displayName = "LiquidGlassCardContent"

const LiquidGlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
LiquidGlassCardFooter.displayName = "LiquidGlassCardFooter"

export { 
  LiquidGlassCard, 
  LiquidGlassCardHeader, 
  LiquidGlassCardFooter, 
  LiquidGlassCardTitle, 
  LiquidGlassCardDescription, 
  LiquidGlassCardContent 
}