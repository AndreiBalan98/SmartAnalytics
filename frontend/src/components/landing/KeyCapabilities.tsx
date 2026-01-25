'use client';

import { motion } from 'framer-motion';

const capabilities = [
  {
    icon: '🎯',
    title: 'Atribuirea conversiilor',
    subtitle: 'Știi exact ce generează venituri'
  },
  {
    icon: '🔗',
    title: 'Tracking multi-canal',
    subtitle: 'Facebook, Google, TikTok - într-un loc'
  },
  {
    icon: '📊',
    title: 'Dashboard-uri client',
    subtitle: 'Raportare clară și automată'
  },
  {
    icon: '⚡',
    title: 'Tracking server-side',
    subtitle: 'Date precise, fără blocare browser'
  },
  {
    icon: '📈',
    title: 'Analiză în timp real',
    subtitle: 'Decizii rapide bazate pe date live'
  },
  {
    icon: '🤖',
    title: 'Insights AI',
    subtitle: 'Optimizări sugerate automat'
  }
];

export default function KeyCapabilities() {
  return (
    <section id="capabilities" className="py-20 px-4 bg-navy-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Tot ce ai nevoie pentru tracking perfect
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Tehnologie enterprise, simplitate premium
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((capability, index) => (
            <motion.div
              key={capability.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="card hover:border-electric-blue/30 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{capability.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {capability.title}
              </h3>
              <p className="text-slate-300 text-sm">
                {capability.subtitle}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
