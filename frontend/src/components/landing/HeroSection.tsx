'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import DepthBackground from './DepthBackground';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-navy-gradient flex items-center justify-center px-4 py-20 overflow-hidden">
      {/* Depth background layer */}
      <DepthBackground />

      {/* Main content layer */}
      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Badge with enhanced visual effects */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-block relative"
          >
            {/* Light rays background effect */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(0, 212, 255, 0.15) 0%, transparent 70%)',
                filter: 'blur(20px)',
                transform: 'scale(1.5)',
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Animated rotating border */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #06b6d4 50%, #00d4ff 100%)',
                padding: '1px',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Main badge content */}
            <span className="relative px-4 py-2 bg-electric-blue/10 border border-electric-blue/30 rounded-full text-electric-blue text-sm font-medium inline-block backdrop-blur-sm shadow-[0_0_20px_rgba(0,212,255,0.3)]">
              AI-powered conversion tracking
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold text-white leading-tight"
          >
            <span className="text-gradient glow-text">ConversionDriven</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-2xl text-slate-200 max-w-3xl mx-auto leading-relaxed"
          >
            Înțelege exact de unde provin conversiile tale.
            Atribuire precisă, tracking server-side și insights bazate pe AI pentru decizii mai bune.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <Link href="/login">
              <button className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
                Începe acum
              </button>
            </Link>

            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto"
            >
              Vezi cum funcționează
            </button>
          </motion.div>

          {/* Small notice */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-sm text-slate-400 pt-4"
          >
            Disponibil momentan pentru clienții agenției
          </motion.p>

          {/* Animated scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="pt-16 flex justify-center"
          >
            <button
              onClick={() => document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex flex-col items-center gap-2 text-slate-400 hover:text-electric-blue transition-colors duration-300 group mx-auto"
              aria-label="Scroll down"
            >
              <span className="text-[11px] uppercase tracking-wider font-medium">Descoperă</span>
              <motion.div
                animate={{
                  y: [0, 8, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-3xl leading-none"
              >
                ↓
              </motion.div>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
