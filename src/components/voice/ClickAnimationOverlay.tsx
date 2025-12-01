import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ClickAnimation {
  id: string;
  targetX: number;
  targetY: number;
}

// Mouse cursor SVG component
const MouseCursor: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z"
      fill="hsl(var(--primary))"
      stroke="white"
      strokeWidth="1.5"
    />
  </svg>
);

// Single click animation instance
const CursorAnimation: React.FC<ClickAnimation & { onComplete: () => void }> = ({
  targetX,
  targetY,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'moving' | 'clicking' | 'ripple'>('moving');

  // Get window dimensions for starting position (bottom-right corner)
  const startX = typeof window !== 'undefined' ? window.innerWidth - 50 : 0;
  const startY = typeof window !== 'undefined' ? window.innerHeight - 50 : 0;

  useEffect(() => {
    // Phase transitions (slower cursor movement: 1000ms)
    const moveTimer = setTimeout(() => setPhase('clicking'), 1000);
    const rippleTimer = setTimeout(() => setPhase('ripple'), 1150);
    const completeTimer = setTimeout(() => onComplete(), 1600);

    return () => {
      clearTimeout(moveTimer);
      clearTimeout(rippleTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <>
      {/* Animated cursor */}
      <motion.div
        className="fixed pointer-events-none"
        style={{ zIndex: 10000 }}
        initial={{ x: startX, y: startY, opacity: 0, scale: 1 }}
        animate={{
          x: targetX - 5,
          y: targetY - 5,
          opacity: phase === 'ripple' ? 0 : 1,
          scale: phase === 'clicking' ? 0.8 : 1,
        }}
        transition={{
          x: { duration: 1.0, ease: 'easeInOut' },
          y: { duration: 1.0, ease: 'easeInOut' },
          opacity: { duration: 0.15 },
          scale: { duration: 0.15 },
        }}
      >
        <MouseCursor />
      </motion.div>

      {/* Ripple effect */}
      <AnimatePresence>
        {phase === 'ripple' && (
          <motion.div
            className="fixed pointer-events-none"
            style={{
              left: targetX,
              top: targetY,
              zIndex: 9999,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Outer ring */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 border-primary"
              style={{ borderColor: 'hsl(var(--primary))' }}
            />
            {/* Inner dot */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary"
              style={{ backgroundColor: 'hsl(var(--primary))' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Main overlay component
export const ClickAnimationOverlay: React.FC = () => {
  const [animations, setAnimations] = useState<ClickAnimation[]>([]);

  useEffect(() => {
    const handleClickAnimation = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      const { x, y } = customEvent.detail;

      const newAnimation: ClickAnimation = {
        id: `click-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        targetX: x,
        targetY: y,
      };

      console.log('[ClickAnimationOverlay] New animation triggered:', newAnimation);
      setAnimations((prev) => [...prev, newAnimation]);
    };

    window.addEventListener('agent-click-animation', handleClickAnimation);
    return () => window.removeEventListener('agent-click-animation', handleClickAnimation);
  }, []);

  const removeAnimation = (id: string) => {
    setAnimations((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      <AnimatePresence>
        {animations.map((anim) => (
          <CursorAnimation
            key={anim.id}
            {...anim}
            onComplete={() => removeAnimation(anim.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ClickAnimationOverlay;
