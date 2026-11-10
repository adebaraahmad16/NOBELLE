import { useStoreSettings } from '../../context/StoreSettingsContext';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { api } from '../../api/client';

function InstagramIcon({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function XIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
    </svg>
  );
}

export default function Footer() {
  const { settings } = useStoreSettings();
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    api('/content/contact')
      .then(value => setContact(value || {}))
      .catch(() => {});
  }, [settings?.store?.supportEmail, settings?.store?.phone, settings?.store?.address]);

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/newsletter', { method: 'POST', body: { email } });
      setDone(true);
      setEmail('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const supportEmail = contact.email || settings?.store?.supportEmail;
  const phone = contact.phone || settings?.store?.phone;
  const address = contact.address || settings?.store?.address;

  return (
    <footer className="bg-[#421020] text-[#F8F3ED] border-t border-[#641B32]/40">
      <div className="container-custom pt-14 pb-10 sm:pt-16 sm:pb-12">
        {/* 4 Organised Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Column 1 – NOBELLE */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={settings?.website?.logoUrl || '/nobelle.png'}
                alt="NOBELLE"
                className="w-11 h-11 object-contain rounded-full border border-[#C8A96A]/60 bg-white/10 p-0.5 shadow-sm"
              />
              <div>
                <span className="font-serif text-2xl font-bold tracking-wider text-[#F8F3ED] block">
                  {settings?.general?.storeName || 'NOBELLE'}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#C8A96A] font-semibold">
                  Women's Ready-to-Wear
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#EFE5DA]/85 leading-relaxed mb-3">
              NOBELLE is a premier Nigerian ready-to-wear fashion house creating elegant, culturally inspired clothing for the modern woman.
            </p>
            <p className="text-xs text-[#C8A96A]/90 italic leading-relaxed">
              Celebrating African heritage, artisanal textile traditions, and timeless feminine grace through contemporary design.
            </p>
          </div>

          {/* Column 2 – Explore */}
          <div>
            <h3 className="font-serif text-lg font-bold text-[#F8F3ED] mb-4 tracking-wide pb-1.5 border-b border-[#F8F3ED]/15 inline-block">
              Explore
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#EFE5DA]/90">
              <li>
                <Link to="/" className="hover:text-[#C8A96A] transition-colors duration-200 inline-block">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-[#C8A96A] transition-colors duration-200 inline-block">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-[#C8A96A] transition-colors duration-200 inline-block">
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 – Customer Care */}
          <div>
            <h3 className="font-serif text-lg font-bold text-[#F8F3ED] mb-4 tracking-wide pb-1.5 border-b border-[#F8F3ED]/15 inline-block">
              Customer Care
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#EFE5DA]/90">
              <li>
                <Link to="/contact" className="hover:text-[#C8A96A] transition-colors duration-200 inline-block">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#C8A96A] transition-colors duration-200 inline-block">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-[#C8A96A] transition-colors duration-200 inline-block">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/return-policy" className="hover:text-[#C8A96A] transition-colors duration-200 inline-block">
                  Returns Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 – Stay Connected */}
          <div>
            <h3 className="font-serif text-lg font-bold text-[#F8F3ED] mb-4 tracking-wide pb-1.5 border-b border-[#F8F3ED]/15 inline-block">
              Stay Connected
            </h3>
            <p className="text-xs text-[#EFE5DA]/80 mb-3 leading-relaxed">
              Subscribe for private previews of new African collections and exclusive edits.
            </p>

            {/* Newsletter Subscription Area */}
            <form onSubmit={submit} className="mb-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="footer-email"
                  type="email"
                  required
                  placeholder="Enter your email"
                  aria-label="Newsletter email address"
                  className="w-full px-3.5 py-2.5 bg-[#2E0B16] border border-[#F8F3ED]/30 text-[#F8F3ED] text-xs placeholder:text-[#F8F3ED]/40 focus:outline-none focus:border-[#C8A96A] transition-colors"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setDone(false);
                  }}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2.5 bg-[#641B32] hover:bg-[#8E3D4C] border border-[#C8A96A]/60 text-[#F8F3ED] text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm"
                >
                  {busy ? 'Subscribing…' : 'Subscribe'}
                </button>
              </div>
              {error && <p role="alert" className="text-xs text-red-300 mt-2">{error}</p>}
              {done && <p role="status" className="text-xs text-[#C8A96A] font-medium mt-2">✓ You are subscribed to NOBELLE updates.</p>}
            </form>

            {/* Social Media Links (only if configured or standard handles) */}
            <div className="mb-4">
              <span className="text-[10px] uppercase tracking-widest text-[#C8A96A] font-semibold block mb-2">
                Follow Us
              </span>
              <div className="flex items-center gap-2.5">
                {(settings?.store?.instagram || true) && (
                  <a
                    href={settings?.store?.instagram || 'https://instagram.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-[#2E0B16] text-[#F8F3ED] hover:text-[#C8A96A] hover:border-[#C8A96A] border border-[#F8F3ED]/20 transition-all rounded-xs"
                    aria-label="Instagram"
                  >
                    <InstagramIcon size={14} />
                  </a>
                )}
                {(settings?.store?.facebook || true) && (
                  <a
                    href={settings?.store?.facebook || 'https://facebook.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-[#2E0B16] text-[#F8F3ED] hover:text-[#C8A96A] hover:border-[#C8A96A] border border-[#F8F3ED]/20 transition-all rounded-xs"
                    aria-label="Facebook"
                  >
                    <FacebookIcon size={14} />
                  </a>
                )}
                {(settings?.store?.twitter || true) && (
                  <a
                    href={settings?.store?.twitter || 'https://x.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-[#2E0B16] text-[#F8F3ED] hover:text-[#C8A96A] hover:border-[#C8A96A] border border-[#F8F3ED]/20 transition-all rounded-xs"
                    aria-label="X (formerly Twitter)"
                  >
                    <XIcon size={13} />
                  </a>
                )}
                {settings?.store?.tiktok && (
                  <a
                    href={settings.store.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-[#2E0B16] text-[#F8F3ED] hover:text-[#C8A96A] hover:border-[#C8A96A] border border-[#F8F3ED]/20 transition-all rounded-xs"
                    aria-label="TikTok"
                  >
                    <TikTokIcon size={13} />
                  </a>
                )}
              </div>
            </div>

            {/* Existing Contact Information */}
            {(supportEmail || phone || address) && (
              <div className="pt-3 border-t border-[#F8F3ED]/15 space-y-1.5 text-xs text-[#EFE5DA]/80">
                {supportEmail && (
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-[#C8A96A] flex-shrink-0" />
                    <a href={`mailto:${supportEmail}`} className="hover:text-[#C8A96A] transition-colors truncate">
                      {supportEmail}
                    </a>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-[#C8A96A] flex-shrink-0" />
                    <a href={`tel:${phone}`} className="hover:text-[#C8A96A] transition-colors">
                      {phone}
                    </a>
                  </div>
                )}
                {address && (
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-[#C8A96A] flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">{address}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Supported Payment Methods Indicator */}
        <div className="mt-10 pt-6 border-t border-[#F8F3ED]/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#EFE5DA]/80">
            <ShieldCheck size={16} className="text-[#C8A96A]" />
            <span>Payments Secured by Paystack (PCI-DSS Certified)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#EFE5DA]/90 font-medium">
            <span className="px-2 py-1 bg-[#2E0B16] border border-[#F8F3ED]/20">Mastercard</span>
            <span className="px-2 py-1 bg-[#2E0B16] border border-[#F8F3ED]/20">Visa</span>
            <span className="px-2 py-1 bg-[#2E0B16] border border-[#F8F3ED]/20">Verve</span>
            <span className="px-2 py-1 bg-[#2E0B16] border border-[#F8F3ED]/20">Bank Transfer</span>
          </div>
        </div>

        {/* Bottom Footer Section: Divider & Copyright */}
        <div className="mt-6 pt-6 border-t border-[#F8F3ED]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#EFE5DA]/60">
          <p>
            © {currentYear} {settings?.website?.copyrightText || `${settings?.general?.storeName || 'NOBELLE'}. All rights reserved.`}
          </p>
          <p className="tracking-wide">
            Artisanal Nigerian & African Ready-to-Wear
          </p>
        </div>
      </div>
    </footer>
  );
}
