import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 will-change-transform",
  {
    variants: {
      variant: {
        default: "glass-medium glass-hover glass-ripple bg-primary/80 text-primary-foreground shadow-glass-medium",
        destructive: "glass-medium glass-hover glass-ripple bg-destructive/80 text-destructive-foreground shadow-glass-medium",
        outline: "glass-light glass-hover glass-ripple bg-background/20 text-foreground shadow-glass-light",
        secondary: "glass-medium glass-hover glass-ripple bg-secondary/80 text-secondary-foreground shadow-glass-medium",
        ghost: "glass-hover glass-ripple hover:glass-light text-foreground",
        link: "text-primary underline-offset-4 hover:underline glass-hover",
        glass: "glass-strong glass-hover glass-breathe glass-ripple text-foreground shadow-glass-strong",
        "glass-primary": "glass-strong glass-hover glass-pulse glass-ripple text-primary-foreground bg-primary/30 shadow-glass-glow",
        "glass-accent": "glass-strong glass-hover glass-morph glass-ripple text-accent-foreground bg-accent/30 shadow-glass-strong",
        floating: "glass-strong glass-float glass-hover glass-glow-pulse glass-ripple text-foreground shadow-glass-glow magnetic-float"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 rounded-glass-sm",
        lg: "h-11 px-8 rounded-glass-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",  
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
