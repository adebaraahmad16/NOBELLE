import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email address and password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const success = login(email.trim(), password);
      if (success) {
        navigate('/admin', { replace: true });
      } else {
        setLoading(false);
        setError('Invalid email or password. Please try again.');
      }
    }, 400);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSent(false);
      setForgotEmail('');
    }, 1200);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0b0b0e 0%, #1c050c 50%, #0d0d12 100%)',
      }}
    >
      {/* Background glows */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-[#A94A5A]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#C8A96A]/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl overflow-hidden relative z-10"
        style={{
          background: 'rgba(18, 18, 22, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(169,74,90,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div
          className="h-1.5 w-full"
          style={{ background: 'linear-gradient(90deg, #A94A5A 0%, #C8A96A 100%)' }}
        />

        <div className="p-8 space-y-6">
          {/* Brand header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#A94A5A]/20 border border-[#A94A5A]/40 mb-2 shadow-2xl p-2.5 backdrop-blur-sm">
              <img
                src="/nobelle.png"
                alt="NOBELLE Logo"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-widest uppercase">
              NOBELLE
            </h1>
            <p className="text-xs font-semibold tracking-wider uppercase text-[#F5F5DC]/60">
              Admin Studio
            </p>
          </div>

          {error && (
            <div
              className="p-3.5 rounded-xl text-xs font-medium leading-relaxed text-center"
              style={{ background: 'rgba(169,74,90,0.15)', border: '1px solid rgba(169,74,90,0.4)', color: '#f2b8bc' }}
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-[10px] font-bold uppercase tracking-widest text-[#F5F5DC]/70 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@nobelle.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-[#A94A5A]/30 rounded-xl text-white text-xs outline-none focus:border-[#A94A5A] focus:ring-1 focus:ring-[#A94A5A] transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-[10px] font-bold uppercase tracking-widest text-[#F5F5DC]/70 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-white/5 border border-[#A94A5A]/30 rounded-xl text-white text-xs outline-none focus:border-[#A94A5A] focus:ring-1 focus:ring-[#A94A5A] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#A94A5A] cursor-pointer"
                />
                <span className="text-xs text-neutral-300 font-medium">Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-[#C8A96A] hover:underline font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #A94A5A 0%, #8E3D4C 100%)',
                boxShadow: '0 8px 24px rgba(169,74,90,0.4)',
              }}
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <p className="pt-2 text-center text-[11px] text-neutral-500 border-t border-white/10">
            Authorised personnel only. All activity is logged.
          </p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm p-6 rounded-2xl bg-neutral-900 border border-[#A94A5A]/40 text-white space-y-4"
            role="dialog"
            aria-modal="true"
            aria-label="Reset password"
          >
            <h3 className="font-serif font-bold text-lg">Reset Password</h3>
            {forgotSent ? (
              <p className="text-xs text-green-400">
                If an account exists for {forgotEmail}, password reset instructions have been sent.
              </p>
            ) : (
              <>
                <p className="text-xs text-neutral-300">
                  Enter your administrator email address and we will send you a password reset link.
                </p>
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@nobelle.com"
                    aria-label="Your email address"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-neutral-700 rounded-xl text-xs outline-none text-white focus:border-[#A94A5A]"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-neutral-800 text-neutral-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#A94A5A]"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
