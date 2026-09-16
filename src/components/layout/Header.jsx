import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, User, ShoppingBag, Menu, X, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useScrollHeader } from '../../hooks/useScrollAnimation';
import MobileNav from './MobileNav';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount } = useCart();
  const { scrolled } = useScrollHeader();
  const location = useLocation();

  const isHome = location.pathname === '/';

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Categories', path: '/categories' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-brand-charcoal text-white text-xs text-center py-2 tracking-widest uppercase font-light">
        Free shipping on orders over $200 &nbsp;|&nbsp; New arrivals every week
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm'
            : isHome
            ? 'bg-transparent'
            : 'bg-white'
        }`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-brand-charcoal hover:text-brand-red transition-colors"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <img
                src="/nobelle.png"
                alt="NOBELLE Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-full border border-brand-gold/40 shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
              <span className="font-serif text-2xl lg:text-3xl font-bold tracking-wider text-brand-charcoal">
                NOBELLE
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm tracking-wider uppercase transition-colors duration-300 hover:text-brand-red relative group ${
                    location.pathname === link.path
                      ? 'text-brand-red'
                      : 'text-brand-charcoal'
                  }`}
                >
                  {link.name}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-brand-red transition-all duration-300 ${
                      location.pathname === link.path
                        ? 'w-full'
                        : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              ))}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-brand-charcoal hover:text-brand-red transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              <Link
                to="/shop"
                className="hidden sm:block p-2 text-brand-charcoal hover:text-brand-red transition-colors"
                aria-label="Wishlist"
              >
                <Heart size={20} />
              </Link>

              <Link
                to="/cart"
                className="p-2 text-brand-charcoal hover:text-brand-red transition-colors relative"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-scale-in">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div
          className={`overflow-hidden transition-all duration-400 ${
            searchOpen ? 'max-h-20 border-t border-brand-beige-dark' : 'max-h-0'
          }`}
        >
          <div className="container-custom py-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for products..."
                className="input-field pl-10 pr-10"
                autoFocus={searchOpen}
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-light"
                size={18}
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray-light hover:text-brand-charcoal"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNav
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navLinks={navLinks}
      />
    </>
  );
}
