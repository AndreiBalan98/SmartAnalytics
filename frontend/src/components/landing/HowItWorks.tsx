'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Devino Client',
    description: 'Disponibil momentan pentru clienții agenției. Accesul public va fi disponibil în curând.'
  },
  {
    number: '02',
    title: 'Creează-ți Contul',
    description: 'Primești acces prin agenția ta. Un singur click pentru a configura totul.'
  },
  {
    number: '03',
    title: 'Conectează Platformele',
    description: 'Linking cu anunțuri, tracking, surse de conversii - totul sincronizat automat.'
  },
  {
    number: '04',
    title: 'Vizualizează & Optimizează',
    description: 'Vezi exact ce generează venituri. Ia decizii bazate pe date reale, nu presupuneri.'
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-navy-900">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Cum funcționează?
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Patru pași simpli spre tracking perfect
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative card hover:border-electric-blue/30 transition-all duration-300"
            >
              {/* Step number */}
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-electric-blue rounded-full flex items-center justify-center shadow-glow-blue">
                <span className="text-2xl font-bold text-white">{step.number}</span>
              </div>

              <div className="pt-6">
                <h3 className="text-2xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Small notice */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="inline-block px-6 py-3 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
            <p className="text-electric-blue font-medium">
              💡 Acces public în curând
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
