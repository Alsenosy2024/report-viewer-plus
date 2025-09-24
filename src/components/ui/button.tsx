import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-300",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-300",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-2xl hover:scale-105 hover:shadow-md transition-all duration-300",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-2xl hover:scale-105 hover:shadow-lg transition-all duration-300",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-2xl hover:scale-105 transition-all duration-300",
        link: "text-primary underline-offset-4 hover:underline rounded-2xl transition-all duration-300",
        glass: "glass-medium text-foreground hover:text-primary glass-morph glass-ripple border-0 rounded-3xl group relative overflow-hidden",
        "glass-primary": "glass-medium bg-primary/10 text-primary hover:text-primary-foreground glass-morph glass-ripple border border-primary/20 rounded-3xl group relative overflow-hidden",
        "glass-secondary": "glass-light bg-secondary/10 text-secondary hover:text-secondary-foreground glass-morph glass-ripple border border-secondary/20 rounded-3xl group relative overflow-hidden"
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
