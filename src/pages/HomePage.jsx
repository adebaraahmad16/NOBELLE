import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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

export default function HomePage() {
  const { products } = useProducts();
  const { cms } = useAdminData();
  const home = cms?.homepage || {};
  const [ref, isVisible] = useScrollAnimation();

  const activeProducts = products.filter((p) => p.status !== 'Draft' && p.status !== 'Archived');
  const featured = (home.featuredProductIds || [])
    .map((id) => activeProducts.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 4);
  const featuredFallBack = featured.length > 0 ? featured : activeProducts.slice(0, 4);
  const heroImage = home.heroImage || '';

  return (
    <div>
      {/* ===== HERO SECTION (managed in Website Manager) ===== */}
      <section className="relative h-[90vh] min-h-[600px] lg:h-screen flex items-center overflow-hidden" style={{ background: '#0d0d0d' }}>
        {heroImage && (
          <div className="absolute inset-0">
            <img src={heroImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          </div>
        )}
        <div className="container-custom relative z-10">
          <div className="max-w-xl">
            {home.heroTagline && (
              <p className="text-brand-gold text-xs sm:text-sm tracking-[0.3em] uppercase mb-4 animate-fade-in">
                {home.heroTagline}
              </p>
            )}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl text-white leading-[1.1] mb-6 animate-fade-in-up">
              {home.heroTitle || 'Bold. Elegant.\nUnapologetically You.'}
            </h1>
            {home.heroSubtitle && (
              <p className="text-white/70 text-base sm:text-lg mb-8 max-w-md leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                {home.heroSubtitle}
              </p>
            )}
            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <Link to={home.ctaLink || '/shop'} className="btn-primary">
                {home.ctaText || 'Shop Now'}
                <ArrowRight size={16} className="ml-2" />
              </Link>
              <Link to="/categories" className="btn-outline-white">
                Explore Collections
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURED COLLECTION ===== */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <SectionHeader
            title={home.featuredCollectionTitle || 'Featured Collection'}
            subtitle="Curated pieces for the discerning woman"
          />
          {featuredFallBack.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles size={28} className="mx-auto mb-3 text-brand-red/40" />
              <p className="font-serif text-xl text-brand-charcoal mb-2">Our collection is being curated</p>
              <p className="text-brand-gray text-sm mb-6">New pieces are on their way. Check back soon.</p>
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
            title="Latest Pieces"
            subtitle="Fresh additions to the NOBELLE wardrobe"
          />
          {activeProducts.length === 0 ? (
            <p className="text-center text-brand-gray text-sm py-10">New arrivals will appear here as they are added.</p>
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
            <h2 className="font-serif text-3xl sm:text-4xl text-brand-charcoal mb-4">
              Join the NOBELLE Community
            </h2>
            <p className="text-brand-gray mb-8">
              Be the first to know about new collections, exclusive offers, and style inspiration delivered straight to your inbox.
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
