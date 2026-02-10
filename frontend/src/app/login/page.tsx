'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function UnifiedLoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.user_type === 'agency') {
        router.push('/agency/dashboard');
      } else if (user.user_type === 'client' || user.user_type === 'agency_client') {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      // Auto-routing will happen via useEffect when user state updates
      // No need to manually redirect here
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Email sau parolă incorectă');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-gradient flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-[500px]">
        {/* Back to home link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-electric-blue transition-colors duration-200 mb-4 sm:mb-8 text-sm sm:text-base"
        >
          <span>←</span>
          <span>Înapoi la pagina principală</span>
        </Link>

        {/* Login Card */}
        <div className="card p-4 sm:p-6">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">
              ConversionDriven
            </h1>
            <p className="text-slate-300 text-base sm:text-lg">
              Autentificare
            </p>
          </div>

          {/* Info Notice */}
          <div className="mb-5 sm:mb-6 p-3 sm:p-4 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
            <p className="text-electric-blue text-sm leading-relaxed">
              ℹ️ Conturile trebuie create de către agenție pentru a avea acces.
              Nu se pot crea conturi noi independent.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-200 mb-2"
              >
                Adresă de email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="exemplu@email.com"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-200 mb-2"
              >
                Parolă
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base sm:text-lg py-3 sm:py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Se conectează...' : 'Conectează-te'}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-slate-400/10">
            <p className="text-center text-slate-400 text-sm">
              Ai probleme cu autentificarea?<br />
              Contactează agenția ta pentru suport.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
