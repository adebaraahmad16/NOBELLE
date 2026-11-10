import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, Menu, X, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useScrollHeader } from '../../hooks/useScrollAnimation';
import MobileNav from './MobileNav';

export default function Header() {
  const { settings } = useStoreSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { cartCount } = useCart();
  const { scrolled } = useScrollHeader();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Categories', path: '/categories' },
    { name: 'Collections', path: '/shop?collection=all' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const searchSuggestions = [
    { label: 'Ankara Dresses', query: 'Ankara' },
    { label: 'Aso-Oke Sets', query: 'Aso-Oke' },
    { label: 'Adire Co-ords', query: 'Adire' },
    { label: 'Boubou Kaftans', query: 'Boubou' },
    { label: 'Wedding Guest', query: 'Wedding' },
    { label: 'Senator Jumpsuits', query: 'Jumpsuit' },
  ];

  const handleSearchSubmit = (term) => {
    const q = (term || searchQuery).trim();
    if (q) {
      setSearchOpen(false);
      navigate(`/shop?search=${encodeURIComponent(q)}`);
    }
  };

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
      {/* Announcement Bar */}
      {settings?.website?.announcementEnabled && (
        <div className="bg-[#292323] text-[#F8F3ED] text-xs text-center py-2 px-3 tracking-wide border-b border-[#EFE5DA]/20">
          {settings.website.announcementText}
        </div>
      )}

      {/* Sticky Warm Ivory Navbar with Burgundy Accents */}
      <header
        className={`sticky top-0 z-50 w-full bg-[#F8F3ED] transition-all duration-300 ${
          scrolled
            ? 'shadow-md border-b border-[#EFE5DA]'
            : 'border-b border-[#EFE5DA]/80'
        }`}
        style={{ position: 'sticky', top: 0, zIndex: 50 }}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 sm:h-20 lg:h-22">
            
            {/* ── LEFT: Prominent NOBELLE Logo ── */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 -ml-2 text-[#292323] hover:text-[#641B32] transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu size={22} />
              </button>

              <Link to="/" className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 group">
                <img
                  src={settings?.website?.logoUrl || '/nobelle.png'}
                  alt="NOBELLE"
                  className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-full border border-[#C8A96A]/60 bg-white/40 p-0.5 shadow-xs transition-transform duration-300 group-hover:scale-105"
                />
                <div className="flex flex-col">
                  <span className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold tracking-wider text-[#292323] group-hover:text-[#641B32] transition-colors">
                    {settings?.general?.storeName || 'NOBELLE'}
                  </span>
                  <span className="hidden sm:block text-[9px] uppercase tracking-widest text-[#641B32] font-semibold -mt-1">
                    Ready-to-Wear
                  </span>
                </div>
              </Link>
            </div>

            {/* ── CENTRE: Desktop Navigation Links ── */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navLinks.map((link) => {
                const active = isLinkActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-xs xl:text-sm tracking-wider uppercase transition-colors duration-200 py-1 font-medium relative group ${
                      active
                        ? 'text-[#641B32] font-semibold'
                        : 'text-[#292323] hover:text-[#B77B83]'
                    }`}
                  >
                    {link.name}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-[#641B32] transition-all duration-300 ${
                        active ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* ── RIGHT: 4 Action Icons (Search, Wishlist, Account, Cart) ── */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`p-2 transition-colors duration-200 rounded-full hover:bg-[#EFE5DA]/60 ${
                  searchOpen ? 'text-[#641B32] bg-[#EFE5DA]/80' : 'text-[#292323] hover:text-[#641B32]'
                }`}
                aria-label="Search outfits"
                title="Search"
              >
                <Search size={20} />
              </button>

              {/* Wishlist */}
              <Link
                to="/account"
                className="p-2 text-[#292323] hover:text-[#641B32] transition-colors duration-200 rounded-full hover:bg-[#EFE5DA]/60"
                aria-label="Wishlist"
                title="Wishlist"
              >
                <Heart size={20} />
              </Link>

              {/* Account */}
              <Link
                to="/account"
                className="p-2 text-[#292323] hover:text-[#641B32] transition-colors duration-200 rounded-full hover:bg-[#EFE5DA]/60"
                aria-label="Account"
                title="Account"
              >
                <User size={20} />
              </Link>

              {/* Shopping Bag / Cart */}
              <Link
                to="/cart"
                className="p-2 text-[#292323] hover:text-[#641B32] transition-colors duration-200 rounded-full hover:bg-[#EFE5DA]/60 relative"
                aria-label="Shopping Cart"
                title="Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#641B32] text-[#F8F3ED] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* ── EXPANDABLE SEARCH INTERFACE ── */}
        <div
          className={`overflow-hidden transition-all duration-300 bg-white border-t border-[#EFE5DA] ${
            searchOpen ? 'max-h-48 shadow-inner py-4' : 'max-h-0 py-0 border-transparent'
          }`}
        >
          <div className="container-custom">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for Ankara, Adire, Kaftans, Boubous, Dresses..."
                  className="w-full pl-10 pr-12 py-3 bg-[#F8F3ED]/50 border border-[#EFE5DA] text-sm text-[#292323] focus:outline-none focus:border-[#641B32] focus:ring-1 focus:ring-[#641B32]/30 transition-all placeholder:text-[#6B6B6B]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchSubmit();
                  }}
                  autoFocus={searchOpen}
                />
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#641B32]"
                  size={18}
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6B6B6B] hover:text-[#292323] transition-colors"
                  aria-label="Close search"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick Search Suggestions */}
              <div className="mt-2.5 flex items-center gap-2 overflow-x-auto text-xs pb-1">
                <span className="text-[#6B6B6B] text-[11px] whitespace-nowrap">Suggested:</span>
                {searchSuggestions.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleSearchSubmit(item.query)}
                    className="px-2.5 py-1 bg-[#F8F3ED] border border-[#EFE5DA] text-[#292323] hover:border-[#641B32] hover:text-[#641B32] transition-colors whitespace-nowrap rounded-xs text-[11px]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navLinks={navLinks}
        onOpenSearch={() => {
          setMobileOpen(false);
          setSearchOpen(true);
        }}
      />
    </>
  );
}
