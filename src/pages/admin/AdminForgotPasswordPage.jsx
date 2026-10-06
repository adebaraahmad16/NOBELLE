import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { adminAuthApi } from '../../utils/api';

/*
  NOBELLE Admin — Forgot password screen.
  Connects to POST /api/v1/admin/auth/forgot-password.
  Never reveals whether a specific admin account exists.
*/

const BURGUNDY = '#641F2D';
const BURGUNDY_RICH = '#7A2939';

export default function AdminForgotPasswordPage() {
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await adminAuthApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(
        err?.status === 0 || err?.status >= 500
          ? 'Unable to send the reset link right now. Please try again.'
          : 'Unable to send the reset link right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row" style={{ background: BURGUNDY }}>
      {/* Left brand section — consistent with login */}
      <section
        className="relative lg:w-[52%] flex flex-col justify-between overflow-hidden"
        style={{
          background: '#91364d',
          minHeight: '200px',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'none',
          }}
        />
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.16 }}
          aria-hidden="true"
        >
          <defs>
            <pattern id="nb-threads-forgot" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M0 60 Q 30 30, 60 60 T 120 60" fill="none" stroke="#D98B97" strokeWidth="0.6" />
              <path d="M0 90 Q 30 60, 60 90 T 120 90" fill="none" stroke="#E8D8C8" strokeWidth="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#nb-threads-forgot)" />
        </svg>

        <div className="relative z-10 px-8 sm:px-14 pt-10 lg:pt-16">
          <Link to="/" className="inline-flex items-center gap-3" aria-label="NOBELLE home">
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
              <div className="font-serif font-bold text-2xl tracking-[0.22em] text-[#FCFAF7] leading-none">
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

        <div className="relative z-10 hidden lg:flex flex-col justify-center flex-1 px-14 pb-8">
          <div
            className="w-10 h-px mb-8"
            style={{ background: '#d98b97' }}
          />
          <p className="font-serif text-4xl leading-snug max-w-md" style={{ color: '#F8F3EC' }}>
            Recover access to your studio.
          </p>
          <p className="mt-6 text-sm max-w-sm leading-relaxed" style={{ color: 'rgba(232,216,200,0.72)' }}>
            We'll guide you back in with a secure, single-use reset link.
          </p>
        </div>
      </section>

      {/* Right panel — form */}
      <section
        className="relative flex-1 flex items-center justify-center p-6 sm:p-10"
        style={{ background: '#faf8f6' }}
      >
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <img
              src="/nobelle.png"
              alt="NOBELLE"
              className="w-12 h-12 object-contain rounded-full mx-auto mb-3"
              style={{ filter: 'brightness(1.1)' }}
            />
            <div className="font-serif font-bold text-xl tracking-[0.2em]" style={{ color: BURGUNDY }}>
              NOBELLE
            </div>
          </div>

          {sent ? (
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-6"
                style={{ background: 'rgba(100,31,45,0.07)', border: '1px solid rgba(100,31,45,0.16)' }}
              >
                <CheckCircle2 size={26} style={{ color: BURGUNDY }} />
              </div>
              <h1 className="font-serif text-3xl font-bold" style={{ color: '#242124' }}>
                Check your email
              </h1>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: '#777277' }}>
                If an admin account exists for that email, a password reset link is on its way.
                The link expires in 30 minutes.
              </p>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 mt-8 text-sm font-semibold transition-colors hover:underline"
                style={{ color: BURGUNDY }}
              >
                <ArrowLeft size={14} />
                Return to Admin Login
              </Link>
            </div>
          ) : (
            <>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 text-xs font-medium mb-8 transition-colors hover:underline"
                style={{ color: '#777277' }}
              >
                <ArrowLeft size={13} />
                Back to sign in
              </Link>

              <h1 className="font-serif text-3xl font-bold" style={{ color: '#242124' }}>
                Forgot your password?
              </h1>
              <p className="mt-2.5 text-sm" style={{ color: '#777277' }}>
                Enter your email and we'll send you a password reset link.
              </p>

              {error && (
                <div
                  className="mt-6 mb-5 p-3.5 rounded-xl flex items-start gap-2.5 nb-fade-up"
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

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div>
                  <label
                    htmlFor="forgot-email"
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
                      id="forgot-email"
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
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
