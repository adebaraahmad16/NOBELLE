import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (sidebarOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [sidebarOpen]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--nb-bg)' }}
    >
      {/* ── NOBELLE design tokens (soft rose accent on cream) ── */}
      <style>{`
        :root {
          /* Surfaces */
          --nb-bg: #F4F0EA;
          --nb-surface: #FCFAF7;
          --nb-surface-2: #F8F3EC;
          --nb-hover: rgba(169,74,90,0.06);

          /* Text */
          --nb-charcoal: #242124;
          --nb-text: #3A353A;
          --nb-text-strong: #242124;
          --nb-text-muted: #777277;
          --nb-text-faint: #A8A1A8;

          /* Accent — soft muted burgundy / rose red (never dominant) */
          --nb-accent: #A94A5A;
          --nb-accent-strong: #8E3D4C;
          --nb-accent-soft: rgba(169,74,90,0.10);
          --nb-accent-faint: rgba(169,74,90,0.05);

          /* Warm neutrals */
          --nb-beige: #E8D8C8;
          --nb-rose-light: #D98B97;

          /* Borders & shadows */
          --nb-border: rgba(232,216,200,0.9);
          --nb-border-soft: rgba(232,216,200,0.55);
          --nb-shadow-card: 0 1px 2px rgba(36,33,36,0.03), 0 6px 24px rgba(36,33,36,0.04);
          --nb-shadow-pop: 0 24px 64px rgba(36,33,36,0.16);

          /* Backwards-compatible aliases (existing pages read these) */
          --admin-bg: #F4F0EA;
          --admin-surface: #FCFAF7;
          --admin-surface-2: #F8F3EC;
          --admin-header-bg: rgba(252,250,247,0.92);
          --admin-border: rgba(232,216,200,0.9);
          --admin-border-soft: rgba(232,216,200,0.55);
          --admin-text: #242124;
          --admin-text-muted: #777277;
          --admin-text-faint: #A8A1A8;
          --admin-red: #A94A5A;
          --admin-red-dim: rgba(169,74,90,0.10);
          --admin-green: #4C8A64;
          --shadow-card: 0 1px 2px rgba(36,33,36,0.03), 0 6px 24px rgba(36,33,36,0.04);
          --shadow-dropdown: 0 24px 64px rgba(36,33,36,0.16), 0 4px 20px rgba(36,33,36,0.06);
        }

        html.dark {
          --nb-bg: #1B181B;
          --nb-surface: #232023;
          --nb-surface-2: #2B272B;
          --nb-hover: rgba(217,139,151,0.07);
          --nb-charcoal: #F5EFEA;
          --nb-text: #E8E0DA;
          --nb-text-strong: #F5EFEA;
          --nb-text-muted: #A89FA5;
          --nb-text-faint: #6E676E;
          --nb-accent: #D98B97;
          --nb-accent-strong: #E4A3AD;
          --nb-accent-soft: rgba(217,139,151,0.14);
          --nb-accent-faint: rgba(217,139,151,0.07);
          --nb-beige: #3A3238;
          --nb-rose-light: #D98B97;
          --nb-border: rgba(255,255,255,0.08);
          --nb-border-soft: rgba(255,255,255,0.05);

          --admin-bg: #1B181B;
          --admin-surface: #232023;
          --admin-surface-2: #2B272B;
          --admin-header-bg: rgba(35,32,35,0.92);
          --admin-border: rgba(255,255,255,0.08);
          --admin-border-soft: rgba(255,255,255,0.05);
          --admin-text: #F5EFEA;
          --admin-text-muted: #A89FA5;
          --admin-text-faint: #6E676E;
          --admin-red: #D98B97;
          --admin-red-dim: rgba(217,139,151,0.14);
        }

        html.dark body { background: #1B181B; }

        .nb-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .nb-scroll::-webkit-scrollbar-track { background: transparent; }
        .nb-scroll::-webkit-scrollbar-thumb { background: rgba(169,74,90,0.22); border-radius: 99px; }
        .nb-scroll::-webkit-scrollbar-thumb:hover { background: rgba(169,74,90,0.4); }
        html.dark .nb-scroll::-webkit-scrollbar-thumb { background: rgba(217,139,151,0.3); }

        @keyframes nbPageIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .admin-page { animation: nbPageIn 0.3s ease-out both; }

        @keyframes nbFadeUp {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .nb-fade-up { animation: nbFadeUp 0.22s ease-out both; }

        @keyframes nbShimmer {
          0%   { background-position: -900px 0; }
          100% { background-position:  900px 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #EFE9E1 20%, #E6DDD3 50%, #EFE9E1 80%);
          background-size: 900px 100%;
          animation: nbShimmer 1.6s ease-in-out infinite;
          border-radius: 8px;
        }
        html.dark .skeleton {
          background: linear-gradient(90deg, #2B272B 20%, #353034 50%, #2B272B 80%);
          background-size: 900px 100%;
        }

        .ripple-btn { position: relative; overflow: hidden; }
        .ripple-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle, rgba(255,255,255,0.28) 1%, transparent 70%);
          opacity: 0; transform: scale(0);
          transition: transform 0.55s, opacity 0.45s;
        }
        .ripple-btn:active::after { transform: scale(4); opacity: 1; transition: 0s; }

        @keyframes nbDropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dropdown-enter { animation: nbDropdownIn 0.2s cubic-bezier(0.16,1,0.3,1) both; }

        @keyframes nbTooltipIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .tooltip-enter { animation: nbTooltipIn 0.16s ease-out both; }

        /* Visible focus for keyboard navigation */
        button:focus-visible, a:focus-visible, input:focus-visible,
        select:focus-visible, textarea:focus-visible, [tabindex]:focus-visible {
          outline: 2px solid #A94A5A;
          outline-offset: 2px;
        }
        html.dark button:focus-visible, html.dark a:focus-visible,
        html.dark input:focus-visible, html.dark select:focus-visible,
        html.dark textarea:focus-visible, html.dark [tabindex]:focus-visible {
          outline-color: #D98B97;
        }

        main.admin-page { min-width: 0; }
      `}</style>

      {/* Off-canvas drawer — no layout space is ever reserved */}
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Full-width dashboard */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          onMenuClick={() => setSidebarOpen((o) => !o)}
          sidebarOpen={sidebarOpen}
        />
        <main
          className="flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-x-hidden admin-page admin-scroll"
          style={{ minWidth: 0 }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
