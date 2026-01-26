'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="py-16 sm:py-24 md:py-32 px-4 bg-navy-gradient relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-electric-blue rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-electric-cyan rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight px-4">
            Pregătit să generezi conversii mai bune?
          </h2>

          <p className="text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto px-4">
            Alătură-te agențiilor care folosesc deja ConversionDriven pentru tracking precis și decizii bazate pe date.
          </p>

          <div className="pt-4 w-full px-4">
            <Link href="/login" className="block sm:inline-block w-full sm:w-auto">
              <button className="btn-primary text-lg px-12 py-5 shadow-glow-blue-lg w-full sm:w-auto">
                Începe acum
              </button>
            </Link>
          </div>

          <p className="text-sm text-slate-400 pt-4">
            Disponibil momentan pentru clienții agenției
          </p>
        </motion.div>
      </div>
    </section>
  );
}
