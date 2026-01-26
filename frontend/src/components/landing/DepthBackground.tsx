'use client';

import { motion } from 'framer-motion';

export default function DepthBackground() {
  // Generate random positions for particles
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }));

  // Generate diagonal lines
  const lines = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    rotation: -45 + (i * 10),
    opacity: 0.03 + (Math.random() * 0.05),
    width: Math.random() * 2 + 1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.03) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(0, 212, 255, 0.03) 100%)',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Diagonal lines for depth */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0, 212, 255, 0)" />
            <stop offset="50%" stopColor="rgba(0, 212, 255, 0.1)" />
            <stop offset="100%" stopColor="rgba(0, 212, 255, 0)" />
          </linearGradient>
        </defs>
        {lines.map((line) => (
          <motion.line
            key={line.id}
            x1="-100%"
            y1="50%"
            x2="200%"
            y2="50%"
            stroke="url(#lineGradient)"
            strokeWidth={line.width}
            style={{
              transformOrigin: 'center',
              opacity: line.opacity,
            }}
            initial={{ rotate: line.rotation, x: '-50%' }}
            animate={{ x: '50%' }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
              delay: line.id * 0.5,
            }}
          />
        ))}
      </svg>

      {/* Particle grid with varying opacity */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-electric-blue"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            opacity: [0.1, 0.6, 0.1],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: particle.delay,
          }}
        />
      ))}

      {/* Blur effect on edges for depth of field */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-navy-900/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-900/80 to-transparent" />
        <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-navy-900/60 to-transparent" />
        <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-navy-900/60 to-transparent" />
      </div>
    </div>
  );
}
