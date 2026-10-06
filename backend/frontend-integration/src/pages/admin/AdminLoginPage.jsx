import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';

/*
  NOBELLE Admin Login — Premium deep-burgundy entrance.

  Design language:
  - Left: deep burgundy brand panel with subtle tonal depth, wordmark,
    fine decorative linework (no fake photography or statistics).
  - Right: warm cream login panel matching the dashboard surfaces.
  - Auth: real backend (POST /api/v1/admin/auth/login). No demo credentials.
*/

const BURGUNDY = '#641F2D';
const BURGUNDY_RICH = '#7A2939';

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect authenticated admins straight to the dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email address and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password, rememberMe);
      navigate('/admin', { replace: true });
    } catch (err) {
      if (err?.status === 0 || err?.status >= 500) {
        setError('Unable to sign in right now. Please try again.');
      } else {
        // 401 and validation errors — same neutral message, no account hints
        setError('Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row" style={{ background: BURGUNDY }}>
      {/* ══════════ LEFT — Burgundy brand section ══════════ */}
      <section
        className="relative lg:w-[52%] flex flex-col justify-between overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${BURGUNDY_RICH} 0%, ${BURGUNDY} 45%, #551622 100%)`,
          minHeight: '240px',
        }}
      >
        {/* Subtle tonal depth — soft radial washes, no neon */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 18% 22%, rgba(217,139,151,0.10) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 85% 80%, rgba(100,31,45,0.9) 0%, transparent 70%)',
          }}
        />

        {/* Fine fashion-inspired linework — hairline arcs & threads */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.16 }}
          aria-hidden="true"
        >
          <defs>
            <pattern id="nb-threads" width="120" height="120" patternUnits="userSpaceOnUse">
              <path
                d="M0 60 Q 30 30, 60 60 T 120 60"
                fill="none"
                stroke="#D98B97"
                strokeWidth="0.6"
              />
              <path
                d="M0 90 Q 30 60, 60 90 T 120 90"
                fill="none"
                stroke="#E8D8C8"
                strokeWidth="0.4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#nb-threads)" />
        </svg>

        {/* Hairline frame — couture atelier detail */}
        <div
          className="absolute pointer-events-none hidden lg:block"
          style={{
            inset: '24px',
            border: '1px solid rgba(232,216,200,0.14)',
            borderRadius: '2px',
          }}
        />

        {/* Brand block */}
        <div className="relative z-10 px-8 sm:px-14 pt-10 lg:pt-16">
          <Link to="/" className="inline-flex items-center gap-3 group" aria-label="NOBELLE home">
            <img
              src="/nobelle.png"
              alt="NOBELLE"
              className="w-11 h-11 object-contain rounded-full"
              style={{
                filter: 'brightness(1.15)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                border: '1px solid rgba(232,216,200,0.25)',
              }}
            />
            <div>
              <div
                className="font-serif font-bold text-2xl tracking-[0.22em] text-[#FCFAF7] leading-none"
              >
                NOBELLE
              </div>
              <div
                className="text-[9px] uppercase tracking-[0.32em] mt-1.5"
                style={{ color: 'rgba(232,216,200,0.75)' }}
              >
                Fashion House
              </div>
            </div>
          </Link>
        </div>

        {/* Statement — visible on desktop only, keeps mobile compact */}
        <div className="relative z-10 hidden lg:flex flex-col justify-center flex-1 px-14 pb-8">
          <div
            className="w-10 h-px mb-8"
            style={{ background: 'linear-gradient(90deg, #D98B97, transparent)' }}
          />
          <p
            className="font-serif text-4xl leading-snug max-w-md"
            style={{ color: '#F8F3EC' }}
          >
            Elegance, managed beautifully.
          </p>
          <p
            className="mt-6 text-sm max-w-sm leading-relaxed"
            style={{ color: 'rgba(232,216,200,0.72)' }}
          >
            The private studio behind the NOBELLE atelier — where every collection,
            order and client is cared for.
          </p>
        </div>

        {/* Footer strip */}
        <div className="relative z-10 px-8 sm:px-14 pb-8 lg:pb-10 hidden lg:flex items-center gap-2">
          <ShieldCheck size={14} style={{ color: 'rgba(232,216,200,0.55)' }} />
          <span
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ color: 'rgba(232,216,200,0.55)' }}
          >
            Secure admin access
          </span>
        </div>
      </section>

      {/* ══════════ RIGHT — Cream login panel ══════════ */}
      <section
        className="relative flex-1 flex items-center justify-center p-6 sm:p-10"
        style={{
          background: 'linear-gradient(175deg, #FCFAF7 0%, #F8F3EC 100%)',
        }}
      >
        <div className="w-full max-w-md">
          {/* Mobile brand — burgundy block sits above on small screens */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/nobelle.png"
              alt="NOBELLE"
              className="w-12 h-12 object-contain rounded-full mx-auto mb-3"
              style={{ filter: 'brightness(1.1)' }}
            />
            <div
              className="font-serif font-bold text-xl tracking-[0.2em]"
              style={{ color: BURGUNDY }}
            >
              NOBELLE
            </div>
          </div>

          <div className="mb-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{
                background: 'rgba(100,31,45,0.06)',
                border: '1px solid rgba(100,31,45,0.14)',
              }}
            >
              <ShieldCheck size={12} style={{ color: BURGUNDY }} />
              <span
                className="text-[9px] font-bold uppercase tracking-[0.18em]"
                style={{ color: BURGUNDY }}
              >
                Admin Portal
              </span>
            </div>

            <h1
              className="font-serif text-3xl sm:text-4xl font-bold leading-tight"
              style={{ color: '#242124' }}
            >
              Welcome back
            </h1>
            <p className="mt-2.5 text-sm" style={{ color: '#777277' }}>
              Sign in to manage your NOBELLE store.
            </p>
          </div>

          {error && (
            <div
              className="mb-5 p-3.5 rounded-xl flex items-start gap-2.5 nb-fade-up"
              role="alert"
              style={{
                background: 'rgba(100,31,45,0.05)',
                border: '1px solid rgba(100,31,45,0.18)',
              }}
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: BURGUNDY }} />
              <p className="text-xs font-medium leading-relaxed" style={{ color: '#641F2D' }}>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="admin-email"
                className="block text-[10px] font-bold uppercase tracking-[0.16em] mb-2"
                style={{ color: '#555055' }}
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#A8A1A8' }}
                />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3.5 text-sm rounded-xl outline-none transition-all duration-200 disabled:opacity-60"
                  style={{
                    background: '#FCFAF7',
                    border: '1px solid #E8D8C8',
                    color: '#242124',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = BURGUNDY;
                    e.target.style.boxShadow = '0 0 0 3px rgba(100,31,45,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E8D8C8';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="admin-password"
                  className="block text-[10px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: '#555055' }}
                >
                  Password
                </label>
                <Link
                  to="/admin/forgot-password"
                  className="text-xs font-medium transition-colors hover:underline"
                  style={{ color: BURGUNDY }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#A8A1A8' }}
                />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  className="w-full pl-11 pr-11 py-3.5 text-sm rounded-xl outline-none transition-all duration-200 disabled:opacity-60"
                  style={{
                    background: '#FCFAF7',
                    border: '1px solid #E8D8C8',
                    color: '#242124',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = BURGUNDY;
                    e.target.style.boxShadow = '0 0 0 3px rgba(100,31,45,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E8D8C8';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
                  style={{ color: '#A8A1A8' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = BURGUNDY)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#A8A1A8')}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
              <span className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer w-4 h-4 appearance-none rounded-[4px] cursor-pointer transition-all duration-150 checked:bg-[#641F2D] border"
                  style={{
                    border: '1px solid #D8CFC4',
                    background: rememberMe ? BURGUNDY : '#FCFAF7',
                  }}
                />
                {rememberMe && (
                  <svg
                    className="absolute w-3 h-3 pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FCFAF7"
                    strokeWidth="3.5"
                    aria-hidden="true"
                  >
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-xs font-medium" style={{ color: '#555055' }}>
                Remember me
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              style={{
                background: loading ? '#7A2939' : BURGUNDY,
                color: '#FCFAF7',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(100,31,45,0.28)',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = BURGUNDY_RICH;
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = BURGUNDY;
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p
            className="mt-8 pt-6 text-center text-[11px]"
            style={{
              color: '#A8A1A8',
              borderTop: '1px solid rgba(232,216,200,0.7)',
            }}
          >
            Authorised personnel only · NOBELLE Admin
          </p>
        </div>
      </section>
    </div>
  );
}
