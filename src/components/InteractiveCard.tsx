import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'strong';
  magnetic?: boolean;
  tilt?: boolean;
  glow?: boolean;
  morphing?: boolean;
  style?: React.CSSProperties;
}

export function InteractiveCard({ 
  children, 
  className, 
  intensity = "strong",
  magnetic = true,
  tilt = true,
  glow = true,
  morphing = false,
  style
}: InteractiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [ripples, setRipples] = useState<Array<{id: number, x: number, y: number}>>([])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
    
    if (tilt || magnetic) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 8;
      const rotateY = (centerX - x) / 8;
      
      if (tilt && magnetic) {
        const magneticStrength = 0.5;
        const deltaX = (x - centerX) * magneticStrength;
        const deltaY = (y - centerY) * magneticStrength;
        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${deltaX}px, ${deltaY}px, 8px) scale3d(1.05, 1.05, 1.05)`;
      } else if (tilt) {
        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
      } else if (magnetic) {
        const magneticStrength = 0.4;
        const deltaX = (x - centerX) * magneticStrength;
        const deltaY = (y - centerY) * magneticStrength;
        cardRef.current.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale3d(1.02, 1.02, 1.02)`;
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (cardRef.current) {
      cardRef.current.style.transform = '';
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = {
      id: Date.now(),
      x: x,
      y: y
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  // Auto-remove old ripples
  useEffect(() => {
    if (ripples.length > 3) {
      setRipples(prev => prev.slice(-3));
    }
  }, [ripples]);

  const intensityClasses = {
    light: 'glass-light',
    medium: 'glass-medium',
    strong: 'glass-strong'
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative overflow-hidden transition-all duration-500 ease-out will-change-transform',
        intensityClasses[intensity],
        'glass-hover glass-ripple cursor-pointer',
        glow && 'glass-glow-pulse',
        morphing && 'glass-morph',
        magnetic && 'glass-magnetic',
        className
      )}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Enhanced glass surface with dynamic lighting */}
      <div 
        className="absolute inset-0 opacity-0 hover:opacity-60 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 30%, transparent 60%)`
        }}
      />
      
      {/* Secondary glow layer */}
      {glow && (
        <div 
          className="absolute inset-0 opacity-0 hover:opacity-40 transition-opacity duration-1000"
          style={{
            background: `conic-gradient(from ${mousePosition.x}deg at ${mousePosition.x}px ${mousePosition.y}px, hsl(var(--primary)/0.1) 0deg, transparent 60deg, hsl(var(--primary)/0.1) 120deg, transparent 180deg)`
          }}
        />
      )}
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{
            left: ripple.x - 50,
            top: ripple.y - 50,
            width: 100,
            height: 100,
          }}
        >
          <div className="w-full h-full rounded-full bg-white/10 animate-ping" />
        </div>
      ))}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Enhanced floating particles */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-white/20 to-primary/20"
              style={{
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                left: `${10 + i * 8}%`,
                top: `${20 + (i % 3) * 25}%`,
                animation: `liquid-float ${3 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}