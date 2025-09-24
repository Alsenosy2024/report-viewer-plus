import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group micro-bounce",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-xl hover:scale-105 btn-glow",
        destructive: "bg-gradient-error text-destructive-foreground hover:shadow-xl hover:scale-105",
        outline: "border-2 border-primary/30 bg-card/50 backdrop-blur-sm hover:border-primary hover:bg-primary/10 hover:shadow-glow glass",
        secondary: "bg-gradient-secondary text-secondary-foreground hover:shadow-lg hover:scale-105",
        ghost: "hover:bg-primary/10 hover:text-primary hover:shadow-glow",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-glow",
        neon: "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-neon transition-all duration-300",
        glass: "bg-card/10 backdrop-blur-md border border-primary/20 text-foreground hover:bg-card/20 hover:border-primary/40 glass-intense",
        glow: "bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-primary-foreground hover:shadow-glow pulse-glow"
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-13 rounded-lg px-10 text-base",
        icon: "h-11 w-11",
        xl: "h-16 px-12 text-lg rounded-xl"
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
