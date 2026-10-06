// ─────────────────────────────────────────────────────────────
// NOBELLE Admin — shared UI kit
// Reusable primitives so spacing, typography, borders, radius and
// interaction behaviour stay consistent across the whole dashboard.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import {
  Search, X, AlertTriangle, ChevronLeft, ChevronRight,
  Inbox, Loader2, CheckCircle2, XCircle, Info,
} from 'lucide-react';

/* ─── Card ─────────────────────────────────────────────── */
export function Card({ children, className = '', padded = true, ...rest }) {
  return (
    <div
      className={`rounded-2xl ${padded ? 'p-5' : ''} ${className}`}
      style={{
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
        boxShadow: 'var(--shadow-card)',
        ...rest.style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Page header with breadcrumb ──────────────────────── */
export function PageHeader({ title, subtitle, breadcrumb = [], actions = null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="min-w-0">
        {breadcrumb.length > 0 && (
          <>
            <nav aria-label="Breadcrumb" className="text-[10px] uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--admin-text-faint)' }}>
              {breadcrumb.map((c, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-1.5">/</span>}
                  {c}
                </span>
              ))}
            </nav>
            <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-text)' }}>
              {title}
            </h1>
          </>
        )}
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: 'var(--admin-text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ─── Primary button ───────────────────────────────────── */
export function PrimaryButton({ children, onClick, type = 'button', disabled = false, className = '', ...rest }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`ripple-btn inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
      style={{ background: '#97364f', ...rest.style }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, type = 'button', disabled = false, className = '', ...rest }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        border: '1px solid var(--admin-border)',
        color: 'var(--admin-text)',
        ...rest.style,
      }}
    >
      {children}
    </button>
  );
}

export function DangerButton({ children, onClick, type = 'button', disabled = false, className = '', ...rest }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 ${className}`}
      style={{ background: '#A94A5A', color: '#fff', ...rest.style }}
    >
      {children}
    </button>
  );
}

/* ─── Status pill ──────────────────────────────────────── */
const STATUS_TONES = {
  // success family
  'Delivered': 'green', 'Successful': 'green', 'Approved': 'green', 'Active': 'green',
  'Paid': 'green', 'Subscribed': 'green', 'Received': 'green', 'In Stock': 'green',
  // pending family
  'Pending': 'amber', 'Processing': 'blue', 'Confirmed': 'blue', 'Requested': 'amber',
  'Draft': 'neutral', 'Ready for Delivery': 'blue',
  // danger family
  'Cancelled': 'red', 'Failed': 'red', 'Rejected': 'red', 'Out of Stock': 'red',
  // neutral / others
  'Shipped': 'violet', 'Refunded': 'neutral', 'Archived': 'neutral', 'Inactive': 'neutral',
  'Low Stock': 'amber', 'Hidden': 'neutral', 'Unsubscribed': 'neutral',
};

const TONE_STYLES = {
  green:   { bg: 'rgba(22,163,74,0.12)',  text: '#16a34a' },
  amber:   { bg: 'rgba(217,119,6,0.12)',  text: '#d97706' },
  blue:    { bg: 'rgba(37,99,235,0.12)',  text: '#2563eb' },
  violet:  { bg: 'rgba(124,58,237,0.12)', text: '#7c3aed' },
  red:     { bg: 'rgba(169,74,90,0.10)',  text: '#A94A5A' },
  neutral: { bg: 'rgba(0,0,0,0.05)',      text: 'var(--admin-text-muted)' },
};

export function StatusBadge({ status }) {
  const tone = STATUS_TONES[status] || 'neutral';
  const s = TONE_STYLES[tone];
  return (
    <span
      className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.text }}
    >
      {status}
    </span>
  );
}

/* ─── Empty state ──────────────────────────────────────── */
export function EmptyState({ icon: Icon = Inbox, title, description, action = null, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10 px-6' : 'py-16 px-6'}`}>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: 'var(--admin-red-dim)',
          border: '1px solid rgba(169,74,90,0.15)',
        }}
      >
        <Icon size={24} style={{ color: '#A94A5A' }} strokeWidth={1.6} />
      </div>
      <h3 className="font-serif text-base font-bold" style={{ color: 'var(--admin-text)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-xs mt-1.5 max-w-xs leading-relaxed" style={{ color: 'var(--admin-text-muted)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ─── Error state ──────────────────────────────────────── */
export function ErrorState({ message = 'Something went wrong while loading your data.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(169,74,90,0.08)', border: '1px solid rgba(169,74,90,0.2)' }}
      >
        <AlertTriangle size={24} style={{ color: '#A94A5A' }} strokeWidth={1.6} />
      </div>
      <h3 className="font-serif text-base font-bold" style={{ color: 'var(--admin-text)' }}>
        Something went wrong
      </h3>
      <p className="text-xs mt-1.5 max-w-xs" style={{ color: 'var(--admin-text-muted)' }}>
        {message}
      </p>
      {onRetry && (
        <GhostButton className="mt-5" onClick={onRetry}>
          Try Again
        </GhostButton>
      )}
    </div>
  );
}

/* ─── Skeletons ────────────────────────────────────────── */
export function SkeletonLine({ w = '100%', h = 12 }) {
  return <div className="skeleton" style={{ width: w, height: h }} />;
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="p-5 space-y-4" aria-busy="true" aria-label="Loading data">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} w={c === 0 ? '28%' : '16%'} h={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 5 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" aria-busy="true" aria-label="Loading overview">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl p-5 space-y-3"
          style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
        >
          <div className="skeleton w-9 h-9 rounded-xl" />
          <SkeletonLine w="60%" h={10} />
          <SkeletonLine w="40%" h={22} />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ h = 260 }) {
  return (
    <div className="p-5 space-y-4" aria-busy="true" aria-label="Loading chart">
      <div className="flex items-end gap-2" style={{ height: h }}>
        {[45, 70, 55, 85, 60, 75, 50, 65].map((v, i) => (
          <div key={i} className="skeleton flex-1 rounded-t-lg" style={{ height: `${v}%` }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Search input ─────────────────────────────────────── */
export function SearchInput({ value, onChange, placeholder = 'Search...', className = '', ariaLabel = 'Search' }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--admin-text-faint)' }} />
      <input
        type="text"
        role="searchbox"
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-xs outline-none rounded-xl transition-all focus:ring-2"
        style={{
          background: 'var(--admin-surface-2)',
          border: '1px solid var(--admin-border-soft)',
          color: 'var(--admin-text)',
          ['--tw-ring-color']: 'rgba(169,74,90,0.15)',
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1"
          style={{ color: 'var(--admin-text-faint)' }}
          aria-label="Clear search"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

/* ─── Select ───────────────────────────────────────────── */
export function Select({ value, onChange, options = [], className = '', ariaLabel, ...rest }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={`px-3 py-2 text-xs outline-none rounded-xl ${className}`}
      style={{
        background: 'var(--admin-surface-2)',
        border: '1px solid var(--admin-border-soft)',
        color: 'var(--admin-text)',
        ...rest.style,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ─── Field wrapper for forms ──────────────────────────── */
export function Field({ label, required = false, hint, children, htmlFor }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5"
        style={{ color: 'var(--admin-text-muted)' }}
      >
        {label} {required && <span style={{ color: '#A94A5A' }}>*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[10px] mt-1" style={{ color: 'var(--admin-text-faint)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export const inputStyle = {
  background: 'var(--admin-surface-2)',
  border: '1px solid var(--admin-border-soft)',
  color: 'var(--admin-text)',
};

export const inputClass = 'w-full px-3.5 py-2.5 text-xs outline-none rounded-xl transition-all focus:ring-2';

/* ─── Modal shell ──────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative ${width} w-full rounded-2xl overflow-hidden dropdown-enter my-8`}
        style={{
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          boxShadow: 'var(--shadow-dropdown)',
        }}
      >
        {title && (
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--admin-border-soft)' }}>
            <h3 className="font-serif text-sm font-bold" style={{ color: 'var(--admin-text)' }}>
              {title}
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--admin-text-muted)' }} aria-label="Close dialog">
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ─── Confirmation dialog ──────────────────────────────── */
export function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm action', message, confirmLabel = 'Delete', tone = 'danger' }) {
  return (
    <Modal open={open} onClose={onClose} title={null} width="max-w-sm">
      <div className="p-6">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
          style={{ background: tone === 'danger' ? 'rgba(169,74,90,0.08)' : 'var(--admin-red-dim)' }}
        >
          <AlertTriangle size={20} style={{ color: '#A94A5A' }} />
        </div>
        <h3 className="font-serif text-base font-bold" style={{ color: 'var(--admin-text)' }}>
          {title}
        </h3>
        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--admin-text-muted)' }}>
          {message}
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <DangerButton onClick={onConfirm}>{confirmLabel}</DangerButton>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Toast system ─────────────────────────────────────── */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((message, tone = 'success') => {
    const tid = `t_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    setToasts((prev) => [...prev, { id: tid, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== tid));
    }, 3000);
  }, []);

  const ToastViewport = () => (
    <div className="fixed bottom-6 right-6 z-[9999] space-y-2" aria-live="polite">
      {toasts.map((t) => {
        const Icon = t.tone === 'error' ? XCircle : t.tone === 'info' ? Info : CheckCircle2;
        const color = t.tone === 'error' ? '#A94A5A' : t.tone === 'info' ? '#2563eb' : '#16a34a';
        return (
          <div key={t.id} className="admin-toast" style={{ borderColor: `${color}44` }}>
            <Icon size={16} style={{ color }} className="shrink-0" />
            <span className="text-xs font-semibold text-white">{t.message}</span>
          </div>
        );
      })}
    </div>
  );

  return { pushToast, ToastViewport };
}

/* ─── Pagination ───────────────────────────────────────── */
export function Pagination({ page, totalPages, onPageChange, total, label = 'records' }) {
  return (
    <div
      className="px-4 py-3 flex flex-wrap items-center justify-between gap-2"
      style={{ borderTop: '1px solid var(--admin-border-soft)', background: 'var(--admin-surface-2)' }}
    >
      <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
        Showing <strong style={{ color: 'var(--admin-text)' }}>{total}</strong> {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text)' }}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-bold" style={{ color: 'var(--admin-text)' }}>
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text)' }}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── Data resource hook: loading / error / data ─────────
   Simulates a data fetch lifecycle so every page has proper
   loading, error and empty states, and is ready to swap in a
   real API client (fetch/axios) without changing the UI.   */
export function useDataResource(loader, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    const run = async () => {
      try {
        const data = await loader();
        if (!cancelled) setState({ loading: false, error: null, data });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: e, data: null });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const retry = () => setTick((t) => t + 1);
  return { ...state, retry };
}
