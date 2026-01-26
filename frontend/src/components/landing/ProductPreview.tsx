'use client';

import { motion } from 'framer-motion';

export default function ProductPreview() {
  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 bg-navy-800">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 px-4">
            Dashboard-uri clare, decizii rapide
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto px-4">
            Totul într-o singură interfață - de la anunțuri la conversii
          </p>
        </motion.div>

        {/* Desktop: Overlapping layout with 1.png most prominent */}
        <div className="hidden md:block relative max-w-6xl mx-auto">
          {/* Screenshot 3 - Background (smallest) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 0.6, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="absolute left-0 top-20 w-1/2 z-10"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50">
              <img
                src="/images/3.png"
                alt="Dashboard analytics view"
                className="w-full h-auto hover:scale-105 transition-transform duration-300"
              />
            </div>
          </motion.div>

          {/* Screenshot 2 - Middle layer */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 0.7, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="absolute right-0 top-40 w-1/2 z-20"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50">
              <img
                src="/images/2.png"
                alt="Client dashboard view"
                className="w-full h-auto hover:scale-105 transition-transform duration-300"
              />
            </div>
          </motion.div>

          {/* Screenshot 1 - PRIMARY (largest, most prominent) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="relative z-30 mx-auto w-4/5 mt-20"
          >
            <div className="rounded-2xl overflow-hidden shadow-glow-blue-lg border-2 border-electric-blue/30">
              <img
                src="/images/1.png"
                alt="Main dashboard - ConversionDriven"
                className="w-full h-auto hover:scale-105 transition-transform duration-300"
              />
            </div>
          </motion.div>

          {/* Spacer for overlapping layout */}
          <div className="h-96"></div>
        </div>

        {/* Mobile: Vertical stack with 1.png first */}
        <div className="md:hidden space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl overflow-hidden shadow-glow-blue border-2 border-electric-blue/30"
          >
            <img
              src="/images/1.png"
              alt="Main dashboard - ConversionDriven"
              className="w-full h-auto"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50"
          >
            <img
              src="/images/2.png"
              alt="Client dashboard view"
              className="w-full h-auto"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50"
          >
            <img
              src="/images/3.png"
              alt="Dashboard analytics view"
              className="w-full h-auto"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
