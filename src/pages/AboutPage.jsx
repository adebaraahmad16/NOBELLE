import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Heart, ShieldCheck, Compass, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

function AnimatedSection({ children, className = '' }) {
  const [ref, isVisible] = useScrollAnimation();
  return (
    <div ref={ref} className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${className}`}>
      {children}
    </div>
  );
}

export default function AboutPage() {
  const [content, setContent] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/content/about')
      .then(value => setContent(value || {}))
      .catch(e => setError(e.message));
  }, []);

  return (
    <div className="bg-white">
      {/* ── 1. HERO SECTION WITH AUTHENTIC AFRICAN FASHION BACKGROUND ── */}
      <section className="relative min-h-[480px] lg:min-h-[560px] flex items-center justify-center overflow-hidden">
        {/* Full-width authentic African lifestyle fashion photography */}
        <img
          src="/images/about_lifestyle.png"
          alt="NOBELLE African Fashion"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Subtle dark burgundy overlay for contrast and readability (no gradients) */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(26, 10, 15, 0.78)' }}
        />

        <div className="container-custom relative z-10 text-center py-20 px-4 max-w-4xl mx-auto">
          <p className="text-brand-gold text-xs sm:text-sm tracking-[0.3em] uppercase mb-4 font-medium">
            The NOBELLE Story
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-white font-bold leading-tight mb-6">
            Celebrating Elegance, Culture and Modern African Fashion
          </h1>
          <p className="text-white/85 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-light mb-8">
            {content?.content ||
              'Where authentic Nigerian heritage meets contemporary ready-to-wear design, tailored for the confident modern woman.'}
          </p>
          <Link to="/shop" className="btn-primary inline-flex items-center">
            Explore the Collection
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </section>

      {/* ── 2. WHO WE ARE ── */}
      <section className="section-padding bg-brand-cream">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <AnimatedSection>
              <p className="text-brand-gold text-xs tracking-[0.25em] uppercase mb-3 font-semibold">
                Who We Are
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-brand-charcoal mb-6 leading-snug">
                Modern Nigerian Ready-to-Wear Crafted for Every Woman
              </h2>
              <div className="space-y-4 text-brand-charcoal/85 text-base leading-relaxed">
                <p>
                  <strong>NOBELLE</strong> is a premier Nigerian-inspired ready-to-wear fashion brand dedicated to
                  creating sophisticated clothing for women who appreciate cultural richness, refined aesthetics, and everyday comfort.
                </p>
                <p>
                  We believe that traditional African fabrics and cultural silhouettes shouldn't be reserved only for occasional ceremonies.
                  By merging timeless West African textile traditions with modern cosmopolitan cuts, our pieces transition effortlessly
                  from the executive boardroom to weekend soirees and glamorous celebrations.
                </p>
                <p>
                  Every garment is thoughtfully conceived to honour our roots while celebrating the independence, grace, and individuality
                  of the woman wearing it.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="relative">
                <div className="aspect-[4/5] overflow-hidden bg-brand-beige border border-brand-beige-dark/40 shadow-sm">
                  <img
                    src="/images/product_dress_1.png"
                    alt="African Ready-to-Wear Elegance"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-brand-charcoal text-white p-6 max-w-xs shadow-md hidden sm:block border-l-4 border-brand-burgundy">
                  <p className="font-serif text-lg font-bold mb-1 text-brand-gold">Rooted in Heritage</p>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Authentic African prints, hand-dyed Adire, and contemporary Aso-Oke tailored with understated luxury.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── 3. OUR STORY ── */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl text-center">
          <AnimatedSection>
            <p className="text-brand-gold text-xs tracking-[0.25em] uppercase mb-3 font-semibold">
              Our Story
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-brand-charcoal mb-6">
              Born from a Passion for African Craftsmanship
            </h2>
            <div className="space-y-5 text-brand-charcoal/85 text-base leading-relaxed text-left sm:text-center">
              <p>
                NOBELLE began with a straightforward vision: to bridge the gap between traditional bespoke African tailoring
                and accessible, high-quality ready-to-wear fashion.
              </p>
              <p>
                For generations, African women have navigated fabric markets, sourcing yards of vibrant Ankara, delicate French lace,
                and handwoven Aso-Oke, before entrusting them to custom tailors with unpredictable turnaround times and varied fittings.
                We envisioned a fashion house where women could browse curated, immaculately constructed African pieces online,
                select their precise size, and receive a garment cut to perfection.
              </p>
              <p>
                Inspired by the dynamic energy of Lagos, the artisanal indigo heritage of Abeokuta, and the refined grace of modern
                African women across the globe, NOBELLE creates garments that feel deeply personal, culturally authentic, and enduringly stylish.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 4. WHAT WE OFFER ── */}
      <section className="section-padding bg-brand-beige">
        <div className="container-custom">
          <AnimatedSection className="text-center mb-14">
            <p className="text-brand-gold text-xs tracking-[0.25em] uppercase mb-3 font-semibold">
              What We Offer
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-brand-charcoal">
              Our Curated Wardrobe
            </h2>
            <p className="text-brand-gray text-sm mt-3 max-w-lg mx-auto">
              Each collection is purposefully curated to provide a versatile, elevated wardrobe for the modern African woman.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatedSection>
              <div className="bg-white p-6 h-full border border-brand-beige-dark/30 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-brand-cream flex items-center justify-center text-brand-burgundy mb-4 font-serif text-xl font-bold">
                    01
                  </div>
                  <h3 className="font-serif text-xl text-brand-charcoal mb-2">Ankara Ready-to-Wear</h3>
                  <p className="text-xs text-brand-gray leading-relaxed mb-4">
                    Floor-length maxi dresses, flattering wrap dresses, shift dresses, and tailored halter jumpsuits cut from 100% authentic African wax cotton.
                  </p>
                </div>
                <Link to="/shop?category=dresses" className="text-xs font-semibold text-brand-burgundy hover:underline flex items-center gap-1">
                  Browse Dresses <ArrowRight size={12} />
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="bg-white p-6 h-full border border-brand-beige-dark/30 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-brand-cream flex items-center justify-center text-brand-burgundy mb-4 font-serif text-xl font-bold">
                    02
                  </div>
                  <h3 className="font-serif text-xl text-brand-charcoal mb-2">Aso-Oke & Sets</h3>
                  <p className="text-xs text-brand-gray leading-relaxed mb-4">
                    Handwoven contemporary Aso-Oke blazers, tailored female Senator-inspired suits, and coordinating separates designed for impactful entrances.
                  </p>
                </div>
                <Link to="/shop?category=two-piece-sets" className="text-xs font-semibold text-brand-burgundy hover:underline flex items-center gap-1">
                  Browse Two-Piece Sets <ArrowRight size={12} />
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="bg-white p-6 h-full border border-brand-beige-dark/30 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-brand-cream flex items-center justify-center text-brand-burgundy mb-4 font-serif text-xl font-bold">
                    03
                  </div>
                  <h3 className="font-serif text-xl text-brand-charcoal mb-2">Kaftans & Boubou</h3>
                  <p className="text-xs text-brand-gray leading-relaxed mb-4">
                    Flowing Moroccan-cut kaftans, loose-fitting regal Boubou gowns, and linen abayas with intricate gold soutache and wax print trims.
                  </p>
                </div>
                <Link to="/shop?category=kaftans" className="text-xs font-semibold text-brand-burgundy hover:underline flex items-center gap-1">
                  Browse Kaftans <ArrowRight size={12} />
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="bg-white p-6 h-full border border-brand-beige-dark/30 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-brand-cream flex items-center justify-center text-brand-burgundy mb-4 font-serif text-xl font-bold">
                    04
                  </div>
                  <h3 className="font-serif text-xl text-brand-charcoal mb-2">Adire & Occasion Wear</h3>
                  <p className="text-xs text-brand-gray leading-relaxed mb-4">
                    Artisanal Abeokuta Adire silk coordinates, French cord lace wedding guest gowns, and modern pre-tied Iro & Buba wrapper ensembles.
                  </p>
                </div>
                <Link to="/shop?category=african-inspired-wear" className="text-xs font-semibold text-brand-burgundy hover:underline flex items-center gap-1">
                  Browse African-Inspired <ArrowRight size={12} />
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── 5. OUR MISSION ── */}
      <section className="section-padding bg-brand-charcoal text-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedSection>
              <p className="text-brand-gold text-xs tracking-[0.3em] uppercase mb-4 font-semibold">
                Our Mission
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-white mb-6">
                Championing African Identity Through Thoughtful Design
              </h2>
              <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-8">
                Our mission is to celebrate African identity by providing women worldwide with stylish, premium, and thoughtfully designed ready-to-wear clothing.
                We are committed to preserving traditional textile crafts while advancing modern fashion standards, ensuring every woman feels regal, confident, and unapologetically herself.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10 text-left">
                <div>
                  <h4 className="font-serif text-lg text-brand-gold mb-1">Authentic Heritage</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Honouring centuries of West African textile traditions and hand-dye craftsmanship.
                  </p>
                </div>
                <div>
                  <h4 className="font-serif text-lg text-brand-gold mb-1">Modern Sensibility</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Ready-to-wear sizing, clean tailoring, and comfortable fabrics made for everyday living.
                  </p>
                </div>
                <div>
                  <h4 className="font-serif text-lg text-brand-gold mb-1">Empowered Womanhood</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Silhouettes crafted to flatter natural curves with elegance, poise, and dignified style.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── 6. WHY CHOOSE NOBELLE ── */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <AnimatedSection className="text-center mb-14">
            <p className="text-brand-gold text-xs tracking-[0.25em] uppercase mb-3 font-semibold">
              The NOBELLE Difference
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-brand-charcoal">
              Why Choose NOBELLE
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatedSection>
              <div className="p-6 bg-brand-cream border border-brand-beige-dark/30 h-full">
                <Sparkles size={28} className="text-brand-burgundy mb-4" />
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2">Distinctive Designs</h3>
                <p className="text-xs text-brand-charcoal/80 leading-relaxed">
                  Every silhouette is created with an original aesthetic that highlights African prints and heritage textiles in fresh, modern ways.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="p-6 bg-brand-cream border border-brand-beige-dark/30 h-full">
                <ShieldCheck size={28} className="text-brand-burgundy mb-4" />
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2">Flattering Fit & Quality</h3>
                <p className="text-xs text-brand-charcoal/80 leading-relaxed">
                  Carefully drafted size curves developed to fit real bodies comfortably, with secure linings and robust seam finishes.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="p-6 bg-brand-cream border border-brand-beige-dark/30 h-full">
                <Heart size={28} className="text-brand-burgundy mb-4" />
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2">Elegance & Comfort</h3>
                <p className="text-xs text-brand-charcoal/80 leading-relaxed">
                  Breathable cottons, smooth silk linings, and fluid drapes ensure you look regal without sacrificing ease of movement.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="p-6 bg-brand-cream border border-brand-beige-dark/30 h-full">
                <Compass size={28} className="text-brand-burgundy mb-4" />
                <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-2">Seamless Shopping</h3>
                <p className="text-xs text-brand-charcoal/80 leading-relaxed">
                  Convenient online shopping with real-time stock updates, transparent pricing in Nigerian Naira, and nationwide delivery.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── 7. CALL TO ACTION ── */}
      <section className="py-20 bg-brand-cream border-t border-brand-beige-dark/40 text-center">
        <div className="container-custom max-w-2xl mx-auto px-4">
          <AnimatedSection>
            <h2 className="font-serif text-3xl sm:text-4xl text-brand-charcoal mb-4">
              Discover the New NOBELLE Collection
            </h2>
            <p className="text-brand-gray text-base mb-8">
              Explore authentic Ankara maxi dresses, Aso-Oke sets, Adire separates, and regal Boubous tailored for your wardrobe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop" className="btn-primary">
                Shop All Products
                <ArrowRight size={16} className="ml-2" />
              </Link>
              <Link to="/categories" className="btn-secondary">
                View Categories
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
