import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { adminAuthApi } from '../../utils/api';

/*
  NOBELLE Admin — Password reset screen.
  Connects to POST /api/v1/admin/auth/reset-password.
  Token arrives from the email link: /admin/reset-password?token=...
*/

const BURGUNDY = '#641F2D';
const BURGUNDY_RICH = '#7A2939';

const inputStyle = {
  background: '#FCFAF7',
  border: '1px solid #E8D8C8',
  color: '#242124',
};

const focusHandlers = {
  onFocus: (e) => {
    e.target.style.borderColor = BURGUNDY;
    e.target.style.boxShadow = '0 0 0 3px rgba(100,31,45,0.08)';
  },
  onBlur: (e) => {
    e.target.style.borderColor = '#E8D8C8';
    e.target.style.boxShadow = 'none';
  },
};

export default function AdminResetPasswordPage() {
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is invalid. Please request a new one.');
      return;
    }
    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await adminAuthApi.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(
        err?.status === 0 || err?.status >= 500
          ? 'Unable to reset your password right now. Please try again.'
          : err?.message || 'This reset link is invalid or has expired. Please request a new one.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row" style={{ background: BURGUNDY }}>
      {/* Left brand section */}
      <section
        className="relative lg:w-[52%] flex flex-col justify-between overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${BURGUNDY_RICH} 0%, ${BURGUNDY} 45%, #551622 100%)`,
          minHeight: '200px',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 18% 22%, rgba(217,139,151,0.10) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 85% 80%, rgba(100,31,45,0.9) 0%, transparent 70%)',
          }}
        />
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.16 }}
          aria-hidden="true"
        >
          <defs>
            <pattern id="nb-threads-reset" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M0 60 Q 30 30, 60 60 T 120 60" fill="none" stroke="#D98B97" strokeWidth="0.6" />
              <path d="M0 90 Q 30 60, 60 90 T 120 90" fill="none" stroke="#E8D8C8" strokeWidth="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#nb-threads-reset)" />
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
            style={{ background: 'linear-gradient(90deg, #D98B97, transparent)' }}
          />
          <p className="font-serif text-4xl leading-snug max-w-md" style={{ color: '#F8F3EC' }}>
            A new key to the atelier.
          </p>
          <p className="mt-6 text-sm max-w-sm leading-relaxed" style={{ color: 'rgba(232,216,200,0.72)' }}>
            Choose a strong password — all other sessions will be signed out for your security.
          </p>
          <ul className="mt-8 space-y-2.5">
            {['Single-use, 30-minute link', 'All sessions revoked after reset', 'Encrypted in transit'].map(
              (item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-xs"
                  style={{ color: 'rgba(232,216,200,0.65)' }}
                >
                  <span className="w-1 h-1 rounded-full shrink-0" style={{ background: '#D98B97' }} />
                  {item}
                </li>
              )
            )}
          </ul>
        </div>
      </section>

      {/* Right panel — form */}
      <section
        className="relative flex-1 flex items-center justify-center p-6 sm:p-10"
        style={{ background: 'linear-gradient(175deg, #FCFAF7 0%, #F8F3EC 100%)' }}
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

          {success ? (
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-6"
                style={{ background: 'rgba(100,31,45,0.07)', border: '1px solid rgba(100,31,45,0.16)' }}
              >
                <CheckCircle2 size={26} style={{ color: BURGUNDY }} />
              </div>
              <h1 className="font-serif text-3xl font-bold" style={{ color: '#242124' }}>
                Password updated successfully.
              </h1>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: '#777277' }}>
                Your new password is active and all previous sessions have been signed out.
              </p>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={{
                  background: BURGUNDY,
                  color: '#FCFAF7',
                  boxShadow: '0 8px 24px rgba(100,31,45,0.28)',
                }}
              >
                Return to Admin Login
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center">
              <h1 className="font-serif text-3xl font-bold" style={{ color: '#242124' }}>
                Link invalid
              </h1>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: '#777277' }}>
                This reset link is missing its token. Please request a fresh password reset email.
              </p>
              <Link
                to="/admin/forgot-password"
                className="inline-flex items-center gap-2 mt-8 text-sm font-semibold hover:underline"
                style={{ color: BURGUNDY }}
              >
                <ArrowLeft size={14} />
                Request a new link
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
                Set a new password
              </h1>
              <p className="mt-2.5 text-sm" style={{ color: '#777277' }}>
                Choose a strong password for your NOBELLE admin account.
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
                    htmlFor="new-password"
                    className="block text-[10px] font-bold uppercase tracking-[0.16em] mb-2"
                    style={{ color: '#555055' }}
                  >
                    New password
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: '#A8A1A8' }}
                    />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      disabled={loading}
                      className="w-full pl-11 pr-11 py-3.5 text-sm rounded-xl outline-none transition-all duration-200 disabled:opacity-60"
                      style={inputStyle}
                      {...focusHandlers}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md"
                      style={{ color: '#A8A1A8' }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Live requirement indicator */}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full transition-colors"
                      style={{ background: newPassword.length >= 8 ? BURGUNDY : '#D8CFC4' }}
                    />
                    <span
                      className="text-[11px] transition-colors"
                      style={{ color: newPassword.length >= 8 ? BURGUNDY : '#A8A1A8' }}
                    >
                      At least 8 characters
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-[10px] font-bold uppercase tracking-[0.16em] mb-2"
                    style={{ color: '#555055' }}
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: '#A8A1A8' }}
                    />
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      disabled={loading}
                      className="w-full pl-11 pr-11 py-3.5 text-sm rounded-xl outline-none transition-all duration-200 disabled:opacity-60"
                      style={inputStyle}
                      {...focusHandlers}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md"
                      style={{ color: '#A8A1A8' }}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
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
                      Updating...
                    </>
                  ) : (
                    'Reset Password'
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
