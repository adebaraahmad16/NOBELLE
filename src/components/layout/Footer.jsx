import { Link } from 'react-router-dom';
import { Camera, MessageCircle, Hash, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-brand-charcoal text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container-custom py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="font-serif text-2xl lg:text-3xl mb-2">Stay in the Loop</h3>
              <p className="text-white/60 text-sm">
                Subscribe for exclusive offers, new arrivals, and style inspiration.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full max-w-md">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-brand-red transition-colors"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-brand-red text-white text-sm tracking-wider uppercase hover:bg-brand-red-dark transition-colors flex items-center gap-2"
              >
                {subscribed ? 'Subscribed!' : 'Subscribe'}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/nobelle.png"
                alt="NOBELLE Logo"
                className="w-10 h-10 object-contain rounded-full border border-white/25 shadow-md"
              />
              <h2 className="font-serif text-2xl font-bold tracking-wider text-white">NOBELLE</h2>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Bold. Elegant. Unapologetically You. Premium fashion for the modern, confident woman.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 border border-white/20 text-white/60 hover:text-white hover:border-brand-red hover:bg-brand-red transition-all duration-300" aria-label="Instagram">
                <Camera size={18} />
              </a>
              <a href="#" className="p-2 border border-white/20 text-white/60 hover:text-white hover:border-brand-red hover:bg-brand-red transition-all duration-300" aria-label="Facebook">
                <MessageCircle size={18} />
              </a>
              <a href="#" className="p-2 border border-white/20 text-white/60 hover:text-white hover:border-brand-red hover:bg-brand-red transition-all duration-300" aria-label="Twitter">
                <Hash size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-white/40 mb-6 font-sans font-medium">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { name: 'Shop All', path: '/shop' },
                { name: 'New Arrivals', path: '/shop' },
                { name: 'Best Sellers', path: '/shop' },
                { name: 'Categories', path: '/categories' },
                { name: 'About Us', path: '/about' },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-white/60 hover:text-brand-red transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-white/40 mb-6 font-sans font-medium">Customer Service</h4>
            <ul className="space-y-3">
              {[
                { name: 'Size Guide', path: '/size-guide' },
                { name: 'Return Policy', path: '/return-policy' },
                { name: 'Shipping Info', path: '/return-policy' },
                { name: 'FAQs', path: '/contact' },
                { name: 'Contact Us', path: '/contact' },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-white/60 hover:text-brand-red transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-white/40 mb-6 font-sans font-medium">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail size={16} className="text-brand-red mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/60">hello@nobelle.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-brand-red mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/60">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-brand-red mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/60">123 Fashion Ave,<br />New York, NY 10001</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-custom py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} NOBELLE. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-white/40">Privacy Policy</span>
            <span className="text-xs text-white/40">Terms of Service</span>
            <div className="flex items-center gap-2 text-white/40">
              <span className="text-xs">💳</span>
              <span className="text-xs">Visa</span>
              <span className="text-xs">•</span>
              <span className="text-xs">Mastercard</span>
              <span className="text-xs">•</span>
              <span className="text-xs">PayPal</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
