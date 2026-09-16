import { Link, useLocation } from 'react-router-dom';
import { X, ChevronRight } from 'lucide-react';

export default function MobileNav({ isOpen, onClose, navLinks }) {
  const location = useLocation();

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-[70] transition-transform duration-400 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-beige">
          <div className="flex items-center gap-2.5">
            <img
              src="/nobelle.png"
              alt="NOBELLE Logo"
              className="w-8 h-8 object-contain rounded-full border border-brand-gold/40 shadow-sm"
            />
            <h2 className="font-serif text-xl font-bold tracking-wider">NOBELLE</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-brand-gray hover:text-brand-charcoal transition-colors"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-6">
          <ul className="space-y-1">
            {navLinks.map((link, index) => (
              <li
                key={link.path}
                style={{ animationDelay: `${index * 50}ms` }}
                className={isOpen ? 'animate-fade-in-up' : ''}
              >
                <Link
                  to={link.path}
                  onClick={onClose}
                  className={`flex items-center justify-between py-3 px-2 text-sm tracking-wider uppercase transition-colors duration-300 border-b border-brand-beige/50 ${
                    location.pathname === link.path
                      ? 'text-brand-red font-medium'
                      : 'text-brand-charcoal hover:text-brand-red'
                  }`}
                >
                  {link.name}
                  <ChevronRight size={16} className="text-brand-gray-light" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Category Links */}
        <div className="px-6 pt-4 border-t border-brand-beige">
          <p className="text-xs tracking-widest uppercase text-brand-gray mb-4">Categories</p>
          <ul className="space-y-2">
            {['Dresses', 'Two-Piece Sets', 'Casual Wear', 'Corporate Wear'].map((cat) => (
              <li key={cat}>
                <Link
                  to="/categories"
                  onClick={onClose}
                  className="text-sm text-brand-gray hover:text-brand-red transition-colors"
                >
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-brand-beige bg-brand-cream">
          <Link
            to="/size-guide"
            onClick={onClose}
            className="block text-xs tracking-wider uppercase text-brand-gray hover:text-brand-red mb-2 transition-colors"
          >
            Size Guide
          </Link>
          <Link
            to="/return-policy"
            onClick={onClose}
            className="block text-xs tracking-wider uppercase text-brand-gray hover:text-brand-red transition-colors"
          >
            Return Policy
          </Link>
        </div>
      </div>
    </>
  );
}
