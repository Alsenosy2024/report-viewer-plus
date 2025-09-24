import React, { useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface InteractiveCardProps {
  children: React.ReactNode
  className?: string
  intensity?: "light" | "medium" | "strong"
  magnetic?: boolean
  tilt?: boolean
  style?: React.CSSProperties
}

export function InteractiveCard({ 
  children, 
  className, 
  intensity = "medium",
  magnetic = false,
  tilt = false,
  style
}: InteractiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY
    
    setMousePosition({ x: mouseX, y: mouseY })

    if (tilt) {
      const rotateX = (mouseY / rect.height) * -20
      const rotateY = (mouseX / rect.width) * 20
      
      cardRef.current.style.transform = `
        perspective(1000px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        scale3d(1.02, 1.02, 1.02)
        translateZ(8px)
      `
    }

    if (magnetic) {
      const magnetStrength = 0.1
      const offsetX = mouseX * magnetStrength
      const offsetY = mouseY * magnetStrength
      
      cardRef.current.style.transform = `
        translate3d(${offsetX}px, ${offsetY}px, 0) 
        scale3d(1.02, 1.02, 1.02)
      `
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (cardRef.current) {
      cardRef.current.style.transform = ""
    }
  }

  const intensityClasses = {
    light: "glass-light",
    medium: "glass-medium", 
    strong: "glass-strong"
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative rounded-2xl transition-all duration-500 ease-out cursor-pointer",
        "before:absolute before:inset-0 before:rounded-inherit before:bg-gradient-glass-light before:opacity-60 before:pointer-events-none",
        "after:absolute after:inset-0 after:rounded-inherit after:bg-gradient-glass-radial after:opacity-40 after:pointer-events-none",
        intensityClasses[intensity],
        isHovered && "glass-glow shadow-glass-strong",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ 
        willChange: "transform",
        transformStyle: "preserve-3d",
        ...style
      }}
    >
      {/* Floating particles effect */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-inherit">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-current rounded-full animate-pulse opacity-60"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 200}ms`,
                animationDuration: "2s"
              }}
            />
          ))}
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}