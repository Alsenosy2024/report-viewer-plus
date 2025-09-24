import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transform translate-z-0 will-change-transform",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-glass shadow-glass-light hover:shadow-glass-medium",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-glass shadow-glass-light hover:shadow-glass-medium",
        outline:
          "border border-glass-border-medium bg-glass-light text-foreground hover:bg-glass-medium hover:backdrop-blur-glass-strong rounded-glass shadow-glass-light hover:shadow-glass-glow",
        secondary:
          "bg-glass-medium text-foreground hover:bg-glass-strong backdrop-blur-glass-medium hover:backdrop-blur-glass-strong rounded-glass shadow-glass-light hover:shadow-glass-medium",
        ghost: "hover:bg-glass-light hover:backdrop-blur-glass-light rounded-glass",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "bg-glass-medium backdrop-blur-glass-medium border border-glass-border-medium text-foreground hover:bg-glass-strong hover:backdrop-blur-glass-strong hover:scale-105 hover:-translate-y-0.5 rounded-glass-lg shadow-glass-light hover:shadow-glass-glow",
        "glass-primary": "bg-primary-glass backdrop-blur-glass-medium border border-primary/20 text-primary-foreground hover:bg-primary/20 hover:backdrop-blur-glass-strong hover:scale-105 hover:-translate-y-0.5 rounded-glass-lg shadow-glass-light hover:shadow-glass-glow",
        "glass-accent": "bg-accent-glass backdrop-blur-glass-medium border border-accent/20 text-accent-foreground hover:bg-accent/20 hover:backdrop-blur-glass-strong hover:scale-105 hover:-translate-y-0.5 rounded-glass-lg shadow-glass-light hover:shadow-glass-glow",
        floating: "bg-glass-medium backdrop-blur-glass-medium border border-glass-border-light text-foreground hover:bg-glass-strong hover:backdrop-blur-glass-strong hover:scale-110 hover:-translate-y-1 rounded-glass-lg shadow-glass-medium hover:shadow-glass-strong glass-float"
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
