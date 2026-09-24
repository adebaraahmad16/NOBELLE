import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminData } from '../../context/AdminDataContext';
import { getAdminIdentity } from '../../utils/api';
import {
  LayoutDashboard, Package, FolderTree, Layers, Warehouse, ShoppingBag,
  Users, CreditCard, TicketPercent, Star, Truck, RotateCcw, Globe, BarChart3,
  Bell, Settings as SettingsIcon, LogOut, ChevronDown, UserCircle,
  X,
} from 'lucide-react';

/* ─── Navigation model ─────────────────────────────────────
   Flat items render as simple links. Items with a `children`
   array render as expandable submenus (chevron rotates).   */
const NAV_SECTIONS = [
  {
    label: 'Main Menu',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, end: true },
      {
        name: 'Products', href: '/admin/products', icon: Package,
        children: [
          { name: 'All Products', href: '/admin/products' },
          { name: 'Add Product', href: '/admin/products/new' },
        ],
      },
      { name: 'Categories', href: '/admin/categories', icon: FolderTree },
      { name: 'Collections', href: '/admin/collections', icon: Layers },
      { name: 'Inventory', href: '/admin/inventory', icon: Warehouse },
      { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      { name: 'Customers', href: '/admin/customers', icon: Users },
      { name: 'Payments', href: '/admin/payments', icon: CreditCard },
      { name: 'Coupons', href: '/admin/coupons', icon: TicketPercent },
      { name: 'Reviews', href: '/admin/reviews', icon: Star },
      { name: 'Delivery', href: '/admin/delivery', icon: Truck },
      { name: 'Returns', href: '/admin/returns', icon: RotateCcw },
    ],
  },
  {
    label: 'Store Management',
    items: [
      {
        name: 'Website Manager', href: '/admin/website', icon: Globe,
        children: [
          { name: 'Homepage', href: '/admin/website?tab=homepage' },
          { name: 'Banners', href: '/admin/website?tab=banners' },
          { name: 'Navigation', href: '/admin/website?tab=navigation' },
          { name: 'About', href: '/admin/website?tab=about' },
          { name: 'Contact', href: '/admin/website?tab=contact' },
        ],
      },
      { name: 'Reports & Analytics', href: '/admin/analytics', icon: BarChart3 },
      { name: 'Notifications', href: '/admin/notifications', icon: Bell },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Settings', href: '/admin/settings', icon: SettingsIcon },
      { name: 'Admin Profile', href: '/admin/profile', icon: UserCircle },
    ],
  },
];

// All routes that belong to a parent, used for active-state detection.
const CHILD_ROUTE_MAP = NAV_SECTIONS.flatMap((s) => s.items)
  .filter((i) => i.children)
  .map((parent) => ({
    href: parent.href,
    children: parent.children.map((c) => c.href.split('?')[0]),
  }));

export default function AdminSidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const { notifications } = useAdminData();

  const [expanded, setExpanded] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [hovered, setHovered] = useState(null);

  const unread = notifications.filter((n) => !n.read).length;

  // Admin identity — real session data only, falls back to "Administrator".
  const identity = getAdminIdentity();
  const adminName = identity.name;
  const adminEmail = identity.email;
  const adminImage = localStorage.getItem('nobelle_admin_image') || '';
  const initials = adminName === 'Administrator'
    ? 'A'
    : adminName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  /* ── Active-state helpers ── */
  const isItemActive = (item) => {
    const path = location.pathname;
    if (item.end) return path === item.href;
    if (item.children) {
      // Parent is active when on a route belonging to its section
      const base = item.href;
      const onBase = path === base || path.startsWith(base + '/');
      const childMap = CHILD_ROUTE_MAP.find((m) => m.href === base);
      const onChild = childMap ? childMap.children.some((cp) => path === cp || path.startsWith(cp + '/')) : false;
      return onBase || onChild;
    }
    return path === item.href || path.startsWith(item.href + '/');
  };

  const isChildActive = (href) => {
    const [path, query] = href.split('?');
    if (query) {
      return location.pathname === path && location.search.includes(query);
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  /* ── Auto-expand the submenu containing the active route ── */
  useEffect(() => {
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (item.children && isItemActive(item)) {
          setExpanded((cur) => cur ?? item.name);
          return;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  /* ── Escape closes the drawer ── */
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, setIsOpen]);

  const handleNavigate = () => {
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  const renderItem = (item) => {
    const active = isItemActive(item);
    const Icon = item.icon;
    const isExpanded = expanded === item.name;
    const isHovered = hovered === item.name;

    if (item.children) {
      return (
        <div key={item.name}>
          <button
            onClick={() => setExpanded(isExpanded ? null : item.name)}
            aria-expanded={isExpanded}
            className="w-full flex items-center gap-3 rounded-xl transition-all duration-200 text-left"
            style={{
              padding: '9px 12px',
              background: active ? 'var(--nb-accent-soft)' : isHovered ? 'var(--nb-hover)' : 'transparent',
              color: active ? 'var(--nb-accent)' : 'var(--nb-text)',
            }}
            onMouseEnter={() => setHovered(item.name)}
            onMouseLeave={() => setHovered(null)}
          >
            <Icon
              size={17}
              strokeWidth={1.7}
              className="shrink-0 transition-colors duration-200"
              style={{ color: active ? 'var(--nb-accent)' : 'var(--nb-text-muted)' }}
            />
            <span
              className="text-[13px] font-medium flex-1 truncate"
              style={{
                color: active ? 'var(--nb-accent)' : isHovered ? 'var(--nb-text-strong)' : 'var(--nb-text)',
                fontWeight: active ? 600 : 500,
              }}
            >
              {item.name}
            </span>
            <ChevronDown
              size={13}
              className="shrink-0 transition-transform duration-200"
              style={{
                transform: isExpanded ? 'rotate(-180deg)' : 'rotate(0deg)',
                color: 'var(--nb-text-faint)',
              }}
            />
          </button>

          {/* Submenu */}
          <div
            className="overflow-hidden transition-all duration-300 ease-out"
            style={{ maxHeight: isExpanded ? item.children.length * 38 + 8 : 0, opacity: isExpanded ? 1 : 0 }}
          >
            <div className="pl-[26px] pr-2 pt-0.5 pb-1 space-y-0.5">
              {item.children.map((child) => {
                const childActive = isChildActive(child.href);
                return (
                  <Link
                    key={child.name}
                    to={child.href}
                    onClick={handleNavigate}
                    aria-current={childActive ? 'page' : undefined}
                    className="flex items-center gap-2.5 rounded-lg transition-all duration-200"
                    style={{
                      padding: '7px 12px',
                      background: childActive ? 'var(--nb-accent-soft)' : 'transparent',
                      color: childActive ? 'var(--nb-accent)' : 'var(--nb-text-muted)',
                      fontWeight: childActive ? 600 : 500,
                    }}
                    onMouseEnter={(e) => { if (!childActive) e.currentTarget.style.background = 'var(--nb-hover)'; }}
                    onMouseLeave={(e) => { if (!childActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Rail dot aligning with parent icon center */}
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        background: childActive ? 'var(--nb-accent)' : 'var(--nb-border)',
                        marginLeft: 2,
                      }}
                    />
                    <span className="text-[12.5px] truncate">{child.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        to={item.href}
        onClick={handleNavigate}
        aria-current={active ? 'page' : undefined}
        className="flex items-center gap-3 rounded-xl transition-all duration-200 relative"
        style={{
          padding: '9px 12px',
          background: active ? 'var(--nb-accent-soft)' : isHovered ? 'var(--nb-hover)' : 'transparent',
          boxShadow: active ? 'inset 3px 0 0 var(--nb-accent)' : 'none',
        }}
        onMouseEnter={() => setHovered(item.name)}
        onMouseLeave={() => setHovered(null)}
      >
        <Icon
          size={17}
          strokeWidth={1.7}
          className="shrink-0 transition-colors duration-200"
          style={{ color: active ? 'var(--nb-accent)' : isHovered ? 'var(--nb-accent)' : 'var(--nb-text-muted)' }}
        />
        <span
          className="text-[13px] flex-1 truncate"
          style={{
            color: active ? 'var(--nb-accent)' : isHovered ? 'var(--nb-text-strong)' : 'var(--nb-text)',
            fontWeight: active ? 600 : 500,
          }}
        >
          {item.name}
        </span>
        {/* Real data badge only — never a fake count */}
        {item.name === 'Notifications' && unread > 0 && (
          <span
            className="text-[9px] font-bold min-w-[17px] h-[17px] px-1 flex items-center justify-center rounded-full shrink-0"
            style={{ background: 'var(--nb-accent)', color: '#fff' }}
            aria-label={`${unread} unread notifications`}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* ── Overlay (behind drawer) ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(36,33,36,0.42)', backdropFilter: 'blur(2px)' }}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}      {/* ── Off-canvas drawer ── */}
      <aside
        id="admin-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`
        }
        style={{
          width: 'min(80vw, 300px)',
          background: 'var(--nb-surface)',
          borderRight: '1px solid var(--nb-border)',
          boxShadow: isOpen ? '12px 0 48px rgba(36,33,36,0.10)' : 'none',
        }}
      >
        {/* ── Brand header (visually stable) ── */}
        <div
          className="shrink-0 px-5 pt-6 pb-5"
          style={{ borderBottom: '1px solid var(--nb-border-soft)' }}
        >
          <div className="flex items-center justify-between">
            <Link to="/admin" onClick={handleNavigate} className="flex items-center gap-3 min-w-0">
              <img
                src="/nobelle.png"
                alt="NOBELLE"
                className="w-9 h-9 object-contain rounded-full"
                style={{ border: '1px solid var(--nb-border)' }}
              />
              <span
                className="font-serif text-[17px] font-bold tracking-[0.26em] leading-none"
                style={{ color: 'var(--nb-charcoal)' }}
              >
                NOBELLE
              </span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
              style={{ color: 'var(--nb-text-faint)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--nb-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              aria-label="Close navigation"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Scrollable navigation ── */}
        <nav
          className="flex-1 overflow-y-auto nb-scroll px-3 py-4 space-y-5"
          aria-label="Admin navigation"
        >
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p
                className="text-[9px] font-bold uppercase tracking-[0.22em] px-3 mb-1.5"
                style={{ color: 'var(--nb-text-faint)' }}
              >
                {section.label}
              </p>
              <div className="space-y-0.5">{section.items.map(renderItem)}</div>
            </div>
          ))}
        </nav>

        {/* ── Profile + logout footer ── */}
        <div className="shrink-0 px-3 pb-4 pt-3" style={{ borderTop: '1px solid var(--nb-border-soft)' }}>
          <div
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: 'var(--nb-surface-2)' }}
          >
            {adminImage ? (
              <img src={adminImage} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: 'var(--nb-accent-soft)', color: 'var(--nb-accent)' }}
                aria-hidden="true"
              >
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--nb-charcoal)' }}>
                {adminName}
              </p>
              {adminEmail && (
                <p className="text-[10px] truncate" style={{ color: 'var(--nb-text-faint)' }}>
                  {adminEmail}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setConfirmLogout(true)}
            className="mt-1.5 w-full flex items-center gap-3 rounded-xl transition-all duration-200"
            style={{ padding: '9px 12px', color: 'var(--nb-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--nb-hover)';
              e.currentTarget.style.color = 'var(--nb-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--nb-text-muted)';
            }}
          >
            <LogOut size={17} strokeWidth={1.7} />
            <span className="text-[13px] font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Logout confirmation ── */}
      {confirmLogout && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(36,33,36,0.45)' }}
            onClick={() => setConfirmLogout(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm logout"
            className="relative w-full max-w-sm rounded-2xl p-6 nb-fade-up"
            style={{
              background: 'var(--nb-surface)',
              border: '1px solid var(--nb-border)',
              boxShadow: '0 24px 64px rgba(36,33,36,0.18)',
            }}
          >
            <h3 className="font-serif text-base font-bold" style={{ color: 'var(--nb-charcoal)' }}>
              Are you sure you want to log out?
            </h3>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--nb-text-muted)' }}>
              You will need to sign in again to access the NOBELLE dashboard.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setConfirmLogout(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                style={{ border: '1px solid var(--nb-border)', color: 'var(--nb-text)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirmLogout(false); logout(); navigate('/admin/login'); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'var(--nb-accent)' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
