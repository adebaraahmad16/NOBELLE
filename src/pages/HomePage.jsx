import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useProducts } from '../context/ProductContext';
import { useAdminData } from '../context/AdminDataContext';
import ProductCard from '../components/ui/ProductCard';
import SectionHeader from '../components/ui/SectionHeader';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

function AnimatedSection({ children, className = '' }) {
  const [ref, isVisible] = useScrollAnimation();
  return (
    <div ref={ref} className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${className}`}>
      {children}
    </div>
  );
}

// ── Nigerian Collections editorial strip ──────────────────────────────────
const NIGERIAN_COLLECTIONS = [
  {
    id: 'ankara',
    label: 'The Ankara Edit',
    tagline: 'Bold prints. Beautiful silhouettes.',
    image: '/images/ankara_edit_banner.jpg',
    href: '/shop',
  },
  {
    id: 'lace',
    label: 'Lace Collection',
    tagline: 'Elegance for every celebration.',
    image: '/images/lace_collection_banner.jpg',
    href: '/shop',
  },
  {
    id: 'occasion',
    label: 'Occasion Wear',
    tagline: 'Made for celebrations that matter.',
    image: '/images/occasion_wear_banner.jpg',
    href: '/shop',
  },
  {
    id: 'everyday',
    label: 'Everyday Naija',
    tagline: 'Stylish, effortless, authentically you.',
    image: '/images/everyday_naija_banner.jpg',
    href: '/shop',
  },
];

export default function HomePage() {
  const { products } = useProducts();
  const { cms } = useAdminData();
  const home = cms?.homepage || {};

  const activeProducts = products.filter((p) => p.status !== 'Draft' && p.status !== 'Archived');
  const featured = (home.featuredProductIds || [])
    .map((id) => activeProducts.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 4);
  const featuredFallBack = featured.length > 0 ? featured : activeProducts.slice(0, 4);
  const heroImage = home.heroImage || '';

  return (
    <div>
      {/* ===== HERO SECTION ===== */}
      <section className="nobelle-hero">
        <div className="nobelle-hero__bg">
          <img
            src={heroImage || '/images/hero_fashion.png'}
            alt="NOBELLE — Elegance, Rooted in Culture"
            className="nobelle-hero__img"
          />
          <div className="nobelle-hero__overlay" />
        </div>

        <div className="container-custom relative z-10 h-full flex items-center">
          <div className="nobelle-hero__content">
            <p className="nobelle-hero__eyebrow">
              {home.heroTagline || 'Modern Nigerian Women\'s Fashion'}
            </p>
            <div className="nobelle-hero__rule" />
            <h1 className="nobelle-hero__title">
              {home.heroTitle
                ? home.heroTitle
                : <>NOBELLE<br /><em>Elegance, Rooted in Culture.</em></>}
            </h1>
            <p className="nobelle-hero__sub">
              {home.heroSubtitle ||
                'Discover modern Nigerian fashion designed to make every woman feel confident, beautiful, and effortlessly elegant.'}
            </p>
            <div className="nobelle-hero__ctas">
              <Link to={home.ctaLink || '/shop'} className="nobelle-hero__btn-primary">
                {home.ctaText || 'Shop Collection'}
                <ArrowRight size={15} className="ml-2 flex-shrink-0" />
              </Link>
              <Link to="/shop" className="nobelle-hero__btn-ghost">
                Explore New Arrivals
              </Link>
            </div>
          </div>
        </div>

        <div className="nobelle-hero__scroll-hint" aria-hidden="true">
          <span />
        </div>
      </section>

      {/* ===== NIGERIAN COLLECTIONS STRIP ===== */}
      <section className="section-padding bg-brand-charcoal">
        <div className="container-custom">
          <AnimatedSection className="text-center mb-10">
            <p className="text-brand-gold text-xs tracking-[0.3em] uppercase mb-3">Our Collections</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-white">
              {home.featuredCollectionTitle || 'The NOBELLE Edit'}
            </h2>
            <p className="text-white/50 text-sm mt-2 max-w-md mx-auto">
              Modern Nigerian fashion, made for every woman and every occasion.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {NIGERIAN_COLLECTIONS.map((col, i) => (
              <AnimatedSection key={col.id}>
                <Link
                  to={col.href}
                  className="group block relative overflow-hidden aspect-[3/4]"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <img
                    src={col.image}
                    alt={col.label}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Dark bottom gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Text */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                    <p className="text-brand-gold text-[10px] tracking-[0.2em] uppercase mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {col.tagline}
                    </p>
                    <h3 className="font-serif text-base sm:text-lg text-white leading-tight">
                      {col.label}
                    </h3>
                    <div className="flex items-center gap-1 mt-2 text-white/60 text-xs tracking-wider uppercase group-hover:text-brand-gold transition-colors duration-300">
                      <span>Shop Now</span>
                      <ArrowRight size={11} />
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <SectionHeader
            title={home.featuredCollectionTitle || 'Featured Pieces'}
            subtitle="Curated Nigerian fashion for the contemporary woman"
          />
          {featuredFallBack.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles size={28} className="mx-auto mb-3 text-brand-red/40" />
              <p className="font-serif text-xl text-brand-charcoal mb-2">
                Our Ankara & Lace collection is being curated
              </p>
              <p className="text-brand-gray text-sm mb-6">
                New Nigerian fashion pieces are on their way. Check back soon.
              </p>
              <Link to="/shop" className="btn-secondary">Browse the Shop</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {featuredFallBack.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
              <AnimatedSection className="text-center mt-10">
                <Link to="/shop" className="btn-secondary">
                  View All Products
                  <ArrowRight size={16} className="ml-2" />
                </Link>
              </AnimatedSection>
            </>
          )}
        </div>
      </section>

      {/* ===== CMS BANNERS ===== */}
      {(home.banners || []).filter((b) => b.title).map((banner) => (
        <section key={banner.id} className="relative py-20 lg:py-28 overflow-hidden" style={{ background: '#0d0d0d' }}>
          {banner.image && (
            <div className="absolute inset-0 opacity-40">
              <img src={banner.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="container-custom relative z-10 text-center">
            <p className="text-brand-gold text-xs tracking-[0.3em] uppercase mb-4">NOBELLE</p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-6xl text-white mb-4">{banner.title}</h2>
            {banner.subtitle && <p className="text-white/60 max-w-lg mx-auto mb-8">{banner.subtitle}</p>}
            {banner.link && (
              <Link to={banner.link} className="btn-primary">
                Discover Now
                <ArrowRight size={16} className="ml-2" />
              </Link>
            )}
          </div>
        </section>
      ))}

      {/* ===== LATEST PIECES ===== */}
      <section className="section-padding bg-brand-cream">
        <div className="container-custom">
          <SectionHeader
            title="New Arrivals"
            subtitle="Fresh Nigerian fashion added to the NOBELLE wardrobe"
          />
          {activeProducts.length === 0 ? (
            <p className="text-center text-brand-gray text-sm py-10">
              New Ankara, Lace, and occasion wear pieces will appear here as they are added.
            </p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {activeProducts.slice(0, 4).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className="section-padding bg-brand-beige">
        <div className="container-custom max-w-2xl text-center">
          <AnimatedSection>
            <p className="text-brand-gold text-xs tracking-[0.3em] uppercase mb-4">Stay Connected</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-brand-charcoal mb-4">
              Join the NOBELLE Community
            </h2>
            <p className="text-brand-gray mb-8">
              Be the first to know about new Ankara drops, Lace collections, and exclusive offers
              delivered straight to your inbox.
            </p>
            <NewsletterForm />
            <p className="text-[11px] text-brand-gray-light mt-3">
              By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
            </p>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const { addSubscriber } = useAdminData();

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    addSubscriber(email.trim(), 'Homepage');
    setDone(true);
    setEmail('');
  };

  if (done) {
    return <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>You're on the list — welcome to NOBELLE.</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="input-field flex-1"
        required
      />
      <button type="submit" className="btn-primary whitespace-nowrap">
        Subscribe
      </button>
    </form>
  );
}
