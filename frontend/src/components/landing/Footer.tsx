export default function Footer() {
  return (
    <footer className="py-8 px-4 bg-navy-900 border-t border-slate-400/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Brand */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-gradient">
              ConversionDriven
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Atribuire care chiar funcționează
            </p>
          </div>

          {/* Copyright */}
          <div className="text-slate-400 text-sm text-center md:text-right">
            <p>© 2026 ConversionDriven. Toate drepturile rezervate.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
