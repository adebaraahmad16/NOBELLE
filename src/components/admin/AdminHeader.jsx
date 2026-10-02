import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ExternalLink, X, Check } from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { formatNaira } from '../../utils/currency';

const PAGE_META = [
  { match: /^\/admin\/?$/, title: 'Dashboard', crumb: 'Overview' },
  { match: /^\/admin\/products\/new$/, title: 'Add Product', crumb: 'Products / New' },
  { match: /^\/admin\/products\/edit/, title: 'Edit Product', crumb: 'Products / Edit' },
  { match: /^\/admin\/products$/, title: 'Products', crumb: 'Catalog' },
  { match: /^\/admin\/categories$/, title: 'Categories', crumb: 'Catalog' },
  { match: /^\/admin\/collections$/, title: 'Collections', crumb: 'Catalog' },
  { match: /^\/admin\/inventory$/, title: 'Inventory', crumb: 'Stock' },
  { match: /^\/admin\/orders$/, title: 'Orders', crumb: 'Sales' },
  { match: /^\/admin\/customers$/, title: 'Customers', crumb: 'Sales' },
  { match: /^\/admin\/payments$/, title: 'Payments', crumb: 'Sales' },
  { match: /^\/admin\/coupons$/, title: 'Coupons', crumb: 'Marketing' },
  { match: /^\/admin\/reviews$/, title: 'Reviews', crumb: 'Marketing' },
  { match: /^\/admin\/delivery$/, title: 'Delivery', crumb: 'Operations' },
  { match: /^\/admin\/returns$/, title: 'Returns', crumb: 'Operations' },
  { match: /^\/admin\/website$/, title: 'Website Manager', crumb: 'Store Management' },
  { match: /^\/admin\/analytics$/, title: 'Reports & Analytics', crumb: 'Store Management' },
  { match: /^\/admin\/notifications$/, title: 'Notifications', crumb: 'Store Management' },
  { match: /^\/admin\/settings$/, title: 'Settings', crumb: 'System' },
  { match: /^\/admin\/profile$/, title: 'Admin Profile', crumb: 'System' },
];

const SEARCH_SCOPES = [
  { name: 'Products', path: '/admin/products' },
  { name: 'Orders', path: '/admin/orders' },
  { name: 'Customers', path: '/admin/customers' },
  { name: 'Categories', path: '/admin/categories' },
  { name: 'Collections', path: '/admin/collections' },
  { name: 'Inventory', path: '/admin/inventory' },
  { name: 'Payments', path: '/admin/payments' },
  { name: 'Coupons', path: '/admin/coupons' },
  { name: 'Reviews', path: '/admin/reviews' },
  { name: 'Delivery', path: '/admin/delivery' },
  { name: 'Returns', path: '/admin/returns' },
  { name: 'Website Manager', path: '/admin/website' },
  { name: 'Reports & Analytics', path: '/admin/analytics' },
  { name: 'Notifications', path: '/admin/notifications' },
  { name: 'Settings', path: '/admin/settings' },
];

const NOTIF_ICONS = { order: '🛍', payment: '💳', review: '⭐', stock: '📦', return: '↩' };

export default function AdminHeader({ onMenuClick, sidebarOpen = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, markAllNotificationsRead, markNotificationRead, products, orders, customers, categories, collections } = useAdminData();

  const [notifOpen, setNotifOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const meta = PAGE_META.find((m) => m.match.test(location.pathname)) || { title: 'Dashboard', crumb: '' };

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ⌘K focuses search
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  // Search across real data + page navigation
  const results = useMemo(() => {
    const q = searchVal.trim().toLowerCase();
    if (!q) return null;

    const prodHits = products
      .filter((p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
      .slice(0, 4)
      .map((p) => ({ id: p.id, title: p.name, sub: `${formatNaira(p.price)} · ${p.category || 'Uncategorized'}`, path: `/admin/products/edit/${p.id}` }));

    const orderHits = orders
      .filter((o) => o.id?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q) || o.email?.toLowerCase().includes(q))
      .slice(0, 3)
      .map((o) => ({ id: o.id, title: `${o.id} — ${o.customerName}`, sub: formatNaira(o.totalAmount), path: `/admin/orders?search=${encodeURIComponent(o.id)}` }));

    const custHits = customers
      .filter((c) => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
      .slice(0, 3)
      .map((c) => ({ id: c.id, name: c.name, title: c.name, sub: c.email, path: '/admin/customers' }));

    const catHits = categories
      .filter((c) => c.name?.toLowerCase().includes(q))
      .slice(0, 2)
      .map((c) => ({ id: c.id, title: c.name, sub: 'Category', path: '/admin/categories' }));

    const colHits = collections
      .filter((c) => c.name?.toLowerCase().includes(q))
      .slice(0, 2)
      .map((c) => ({ id: c.id, title: c.name, sub: 'Collection', path: '/admin/collections' }));

    const pageHits = SEARCH_SCOPES.filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map((p) => ({ id: p.path, title: p.name, sub: 'Page', path: p.path }));

    return {
      groups: [
        { label: 'Products', items: prodHits },
        { label: 'Orders', items: orderHits },
        { label: 'Customers', items: custHits },
        { label: 'Catalog', items: [...catHits, ...colHits] },
        { label: 'Pages', items: pageHits },
      ].filter((g) => g.items.length > 0),
      total: prodHits.length + orderHits.length + custHits.length + catHits.length + colHits.length + pageHits.length,
    };
  }, [searchVal, products, orders, customers, categories, collections]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header
      className="h-[64px] flex items-center justify-between gap-3 px-4 sm:px-6 shrink-0 sticky top-0 z-30"
      style={{
        background: 'var(--nb-surface)',
        borderBottom: '1px solid var(--nb-border)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* ── Left: menu button (always visible), brand, title ── */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Menu / dashboard button — ☰ ⇄ ✕ */}
        <button
          onClick={onMenuClick}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            color: sidebarOpen ? 'var(--nb-accent)' : 'var(--nb-text)',
            background: sidebarOpen ? 'var(--nb-accent-faint)' : 'transparent',
            border: sidebarOpen ? '1px solid var(--nb-accent-soft)' : '1px solid transparent',
          }}
          onMouseEnter={(e) => {
            if (!sidebarOpen) e.currentTarget.style.background = 'var(--nb-hover)';
          }}
          onMouseLeave={(e) => {
            if (!sidebarOpen) e.currentTarget.style.background = 'transparent';
          }}
          aria-expanded={sidebarOpen}
          aria-controls="admin-sidebar"
          aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
          title={sidebarOpen ? 'Close navigation' : 'Open navigation'}
        >
          {/* Crossfade between ☰ and ✕ */}
          <span
            className="absolute inset-0 flex items-center justify-center transition-all duration-200"
            style={{ opacity: sidebarOpen ? 0 : 1, transform: sidebarOpen ? 'rotate(90deg) scale(0.8)' : 'rotate(0) scale(1)' }}
            aria-hidden="true"
          >
            <Menu size={18} strokeWidth={1.8} />
          </span>
          <span
            className="absolute inset-0 flex items-center justify-center transition-all duration-200"
            style={{ opacity: sidebarOpen ? 1 : 0, transform: sidebarOpen ? 'rotate(0) scale(1)' : 'rotate(-90deg) scale(0.8)' }}
            aria-hidden="true"
          >
            <X size={18} strokeWidth={1.8} />
          </span>
        </button>

        {/* Brand (mobile) */}
        <Link to="/admin" className="flex items-center gap-2 lg:hidden shrink-0">
          <img src="/nobelle.png" alt="NOBELLE" className="w-7 h-7 object-contain rounded-full" />
          <span className="font-serif text-sm font-bold tracking-[0.18em]" style={{ color: 'var(--nb-charcoal)' }}>
            NOBELLE
          </span>
        </Link>

        {/* Page title + breadcrumb (desktop) */}
        <div className="hidden lg:block min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--nb-text-faint)' }}>
            {meta.crumb}
          </div>
          <h2 className="font-serif text-base font-bold leading-tight truncate" style={{ color: 'var(--nb-charcoal)' }}>
            {meta.title}
          </h2>
        </div>
      </div>

      {/* ── Search (Desktop + Mobile overlay) ── */}
      <div
        className={`${
          mobileSearchOpen
            ? 'absolute inset-x-0 top-0 h-[64px] z-50 flex items-center px-4 bg-[var(--nb-surface)] border-b border-[var(--nb-border)]'
            : 'relative hidden sm:block w-full max-w-xs'
        }`}
        ref={searchRef}
      >
        <Search size={14} className="absolute left-7 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--nb-text-faint)' }} />
        <input
          ref={searchRef}
          type="text"
          role="searchbox"
          aria-label="Search the dashboard"
          placeholder="Search products, orders, customers..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          className="w-full pl-9 pr-9 py-2 text-xs outline-none rounded-xl transition-all focus:ring-2"
          style={{
            background: 'var(--nb-surface-2)',
            border: '1px solid var(--nb-border-soft)',
            color: 'var(--nb-charcoal)',
            ['--tw-ring-color']: 'rgba(169,74,90,0.15)',
          }}
        />
        {mobileSearchOpen ? (
          <button
            type="button"
            className="absolute right-7 top-1/2 -translate-y-1/2 p-1"
            style={{ color: 'var(--nb-text-muted)' }}
            onClick={() => { setMobileSearchOpen(false); setSearchVal(''); setSearchFocused(false); }}
            aria-label="Close search"
          >
            <X size={15} />
          </button>
        ) : searchVal ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--nb-text-faint)' }}
            onClick={() => setSearchVal('')}
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        ) : (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono px-1.5 py-0.5 rounded hidden sm:inline"
            style={{ background: 'var(--nb-surface)', color: 'var(--nb-text-faint)', border: '1px solid var(--nb-border-soft)' }}
            aria-hidden="true"
          >
            ⌘K
          </span>
        )}

        {(searchFocused || mobileSearchOpen) && results && (
          <div
            className="absolute left-0 right-0 top-full mt-2 rounded-2xl overflow-hidden z-50 dropdown-enter"
            style={{
              background: 'var(--nb-surface)',
              border: '1px solid var(--nb-border)',
              boxShadow: 'var(--nb-shadow-pop)',
              maxHeight: '420px',
              overflowY: 'auto',
            }}
            role="listbox"
          >
            {results.total === 0 ? (
              <div className="p-5 text-center text-xs" style={{ color: 'var(--nb-text-muted)' }}>
                No matches for “{searchVal}”
              </div>
            ) : (
              results.groups.map((g) => (
                <div key={g.label} className="p-2">
                  <div className="text-[9px] uppercase tracking-[0.16em] font-bold px-2 py-1" style={{ color: 'var(--nb-text-faint)' }}>
                    {g.label}
                  </div>
                  {g.items.map((it) => (
                    <button
                      key={it.id}
                      role="option"
                      aria-selected="false"
                      onMouseDown={() => { navigate(it.path); setSearchFocused(false); setMobileSearchOpen(false); setSearchVal(''); }}
                      className="w-full text-left flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--nb-charcoal)' }}>{it.title}</p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--nb-text-muted)' }}>{it.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Mobile Search Button */}
        <button
          onClick={() => {
            setMobileSearchOpen((o) => !o);
            setTimeout(() => searchRef.current?.focus(), 150);
          }}
          className="sm:hidden relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200"
          style={{ color: 'var(--nb-text-muted)' }}
          aria-label="Search dashboard"
        >
          <Search size={16} strokeWidth={1.8} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200"
            style={{ color: 'var(--nb-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--nb-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
          >
            <Bell size={16} strokeWidth={1.8} />
            {/* Real unread count only */}
            {unread > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[15px] h-[15px] text-[8px] font-bold flex items-center justify-center rounded-full text-white px-0.5"
                style={{ background: 'var(--nb-accent)' }}
              >
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 mt-2 z-50 rounded-2xl overflow-hidden dropdown-enter"
              style={{
                width: 'min(340px, calc(100vw - 1.5rem))',
                background: 'var(--nb-surface)',
                border: '1px solid var(--nb-border)',
                boxShadow: 'var(--nb-shadow-pop)',
              }}
              role="dialog"
              aria-label="Notifications"
            >
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--nb-border-soft)' }}>
                <p className="text-xs font-bold" style={{ color: 'var(--nb-charcoal)' }}>
                  Notifications {unread > 0 && <span style={{ color: 'var(--nb-accent)' }}>({unread} new)</span>}
                </p>
                {unread > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                    style={{ background: 'var(--nb-accent-soft)', color: 'var(--nb-accent)' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto nb-scroll">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={22} className="mx-auto mb-2" style={{ color: 'var(--nb-text-faint)' }} />
                    <p className="text-xs font-semibold" style={{ color: 'var(--nb-charcoal)' }}>You're all caught up.</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--nb-text-muted)' }}>
                      Notifications appear here when real events happen — new orders, payments, low stock or reviews.
                    </p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { markNotificationRead(n.id); setNotifOpen(false); if (n.link) navigate(n.link); }}
                      className="w-full text-left px-4 py-3 flex gap-3 items-start transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ borderBottom: '1px solid var(--nb-border-soft)' }}
                    >
                      <span className="text-base leading-none mt-0.5">{NOTIF_ICONS[n.type] || '🔔'}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-xs font-bold truncate" style={{ color: 'var(--nb-charcoal)' }}>{n.title}</span>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--nb-accent)' }} />}
                        </span>
                        <span className="text-[11px] block mt-0.5" style={{ color: 'var(--nb-text-muted)' }}>{n.message}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <button
                  onClick={() => { setNotifOpen(false); navigate('/admin/notifications'); }}
                  className="w-full py-2.5 text-[11px] font-bold flex items-center justify-center gap-1.5"
                  style={{ color: 'var(--nb-accent)', borderTop: '1px solid var(--nb-border-soft)' }}
                >
                  View all notifications
                </button>
              )}
            </div>
          )}
        </div>

        {/* View storefront */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
          style={{ border: '1px solid var(--nb-border-soft)', color: 'var(--nb-text)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--nb-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          title="Open the customer-facing storefront"
        >
          View Store
          <ExternalLink size={11} style={{ color: 'var(--nb-text-faint)' }} />
        </Link>
      </div>
    </header>
  );
}
