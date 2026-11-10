import { Link, useLocation } from 'react-router-dom';
import { X, ChevronRight, Search, Heart, User } from 'lucide-react';

export default function MobileNav({ isOpen, onClose, navLinks, onOpenSearch }) {
  const location = useLocation();

  const isLinkActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path.includes('?')) {
      const [base, query] = path.split('?');
      return location.pathname === base && location.search.includes(query);
    }
    return location.pathname === path && !location.search.includes('collection=');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-[#1A0A0F]/60 z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-84 max-w-[85vw] bg-[#F8F3ED] z-[70] transition-transform duration-300 ease-out flex flex-col shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#EFE5DA] bg-[#F8F3ED]">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
            <img
              src="/nobelle.png"
              alt="NOBELLE Logo"
              className="w-9 h-9 object-contain rounded-full border border-[#C8A96A]/60 bg-white/40 p-0.5 shadow-xs"
            />
            <div>
              <span className="font-serif text-xl font-bold tracking-wider text-[#292323] block">
                NOBELLE
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#641B32] font-semibold block -mt-1">
                Ready-to-Wear
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 text-[#292323] hover:text-[#641B32] transition-colors"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Search quick button */}
        <div className="p-4 border-b border-[#EFE5DA] bg-white">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#F8F3ED] border border-[#EFE5DA] text-xs text-[#6B6B6B] hover:text-[#292323] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Search size={14} className="text-[#641B32]" />
              <span>Search outfits & styles...</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#641B32] font-semibold">Search</span>
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Main Navigation */}
          <div>
            <p className="text-[10px] tracking-widest uppercase text-[#6B6B6B] mb-2 font-semibold">
              Menu
            </p>
            <ul className="space-y-1">
              {navLinks.map((link) => {
                const active = isLinkActive(link.path);
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      onClick={onClose}
                      className={`flex items-center justify-between py-2.5 px-3 text-xs tracking-wider uppercase transition-colors duration-200 border-b border-[#EFE5DA]/60 ${
                        active
                          ? 'text-[#641B32] font-bold bg-[#EFE5DA]/40'
                          : 'text-[#292323] hover:text-[#641B32]'
                      }`}
                    >
                      <span>{link.name}</span>
                      <ChevronRight size={14} className={active ? 'text-[#641B32]' : 'text-[#6B6B6B]'} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Authentic African Categories */}
          <div>
            <p className="text-[10px] tracking-widest uppercase text-[#6B6B6B] mb-2 font-semibold">
              Shop By Style
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { label: 'Ankara', slug: 'ankara' },
                { label: 'Dresses', slug: 'dresses' },
                { label: 'Aso-Oke', slug: 'aso-oke' },
                { label: 'Adire', slug: 'adire' },
                { label: 'Two-Piece Sets', slug: 'two-piece-sets' },
                { label: 'Kaftans & Boubou', slug: 'kaftans' },
                { label: 'Occasion Wear', slug: 'occasion-wear' },
                { label: 'Jumpsuits', slug: 'jumpsuits' },
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/shop?category=${cat.slug}`}
                  onClick={onClose}
                  className="px-2.5 py-1.5 bg-white border border-[#EFE5DA] text-[#292323] hover:border-[#641B32] hover:text-[#641B32] transition-colors truncate text-[11px]"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Account & Wishlist Links */}
          <div className="pt-2">
            <p className="text-[10px] tracking-widest uppercase text-[#6B6B6B] mb-2 font-semibold">
              Your Experience
            </p>
            <div className="space-y-1">
              <Link
                to="/account"
                onClick={onClose}
                className="flex items-center gap-2.5 py-2 px-3 text-xs text-[#292323] hover:text-[#641B32] transition-colors border-b border-[#EFE5DA]/60"
              >
                <User size={15} className="text-[#641B32]" />
                <span>Account & Orders</span>
              </Link>
              <Link
                to="/account"
                onClick={onClose}
                className="flex items-center gap-2.5 py-2 px-3 text-xs text-[#292323] hover:text-[#641B32] transition-colors border-b border-[#EFE5DA]/60"
              >
                <Heart size={15} className="text-[#641B32]" />
                <span>Saved Wishlist</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#EFE5DA] bg-[#EFE5DA]/50 flex items-center justify-between text-[11px] text-[#6B6B6B]">
          <Link to="/shipping-policy" onClick={onClose} className="hover:text-[#641B32] underline">
            Shipping
          </Link>
          <Link to="/return-policy" onClick={onClose} className="hover:text-[#641B32] underline">
            Returns
          </Link>
          <Link to="/contact" onClick={onClose} className="hover:text-[#641B32] underline">
            Help & FAQs
          </Link>
        </div>
      </div>
    </>
  );
}
