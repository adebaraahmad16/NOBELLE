import { Link } from 'react-router-dom';
import { Heart, Award, Globe, Sparkles } from 'lucide-react';
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
  const values = [
    {
      icon: Heart,
      title: 'African Heritage',
      description:
        'Every piece honours the rich tradition of Nigerian and African craft — Ankara, lace, aso-oke — reinterpreted for the modern woman.',
    },
    {
      icon: Award,
      title: 'Nigerian Craftsmanship',
      description:
        'From Lagos ateliers to skilled local artisans, our garments are made with precision, pride, and an uncompromising eye for detail.',
    },
    {
      icon: Globe,
      title: 'Contemporary Elegance',
      description:
        'We bridge the gap between traditional Nigerian fashion and the global runway — creating silhouettes that feel both rooted and forward-looking.',
    },
    {
      icon: Sparkles,
      title: 'Empowering Women',
      description:
        'NOBELLE exists to celebrate the Nigerian woman — bold, confident, and effortlessly elegant in everything she wears.',
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] lg:h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/about_lifestyle.png"
            alt="NOBELLE — Nigerian Fashion Atelier"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>
        <div className="container-custom relative z-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-brand-gold/40 p-2 mb-4 shadow-xl flex items-center justify-center">
            <img
              src="/nobelle.png"
              alt="NOBELLE Brand Mark"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
          <p className="text-brand-gold text-xs tracking-[0.3em] uppercase mb-3">Our Story</p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white mb-4">
            About NOBELLE
          </h1>
          <p className="text-white/70 max-w-lg mx-auto">
            Born in Lagos. Worn across Africa. Celebrated worldwide.
          </p>
        </div>
      </section>

      {/* Brand Story */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          <AnimatedSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-brand-gold text-xs tracking-[0.3em] uppercase mb-4">The Beginning</p>
                <h2 className="font-serif text-3xl lg:text-4xl text-brand-charcoal mb-6">
                  Born from the Heart of Lagos
                </h2>
                <div className="space-y-4 text-brand-gray leading-relaxed text-sm">
                  <p>
                    NOBELLE was founded in Lagos, Nigeria, with one belief: that Nigerian women deserve
                    fashion that reflects their culture, celebrates their beauty, and matches their ambition.
                    We started with Ankara — bold, vibrant, unmistakably African — and grew from there.
                  </p>
                  <p>
                    Our name — NOBELLE — embodies the noble spirit of the women we dress. It is a
                    celebration of strength wrapped in sophistication, of African heritage expressed through
                    contemporary silhouettes. Every garment is a love letter to Nigerian craft.
                  </p>
                  <p>
                    Today, NOBELLE brings modern Nigerian fashion — Ankara, lace, aso-oke, and everyday
                    ready-to-wear — to women who refuse to choose between their roots and their style.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src="/images/hero_fashion.png"
                    alt="NOBELLE Nigerian Fashion"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-brand-red text-white p-6 hidden lg:block">
                  <p className="font-serif text-3xl font-bold">6+</p>
                  <p className="text-xs tracking-wider uppercase mt-1">Years of Excellence</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding bg-brand-beige">
        <div className="container-custom">
          <AnimatedSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 lg:p-12">
                <p className="text-brand-red text-xs tracking-[0.3em] uppercase mb-4">Our Mission</p>
                <h3 className="font-serif text-2xl lg:text-3xl text-brand-charcoal mb-4">
                  Celebrating Nigerian Fashion
                </h3>
                <p className="text-brand-gray text-sm leading-relaxed">
                  To create premium, meticulously crafted Nigerian fashion that empowers women to wear
                  their heritage with pride and their elegance with confidence. From Ankara prints to
                  intricate lace, every NOBELLE piece is designed to honour where we come from while
                  looking forward to where we're going.
                </p>
              </div>
              <div className="bg-brand-charcoal text-white p-8 lg:p-12">
                <p className="text-brand-gold text-xs tracking-[0.3em] uppercase mb-4">Our Vision</p>
                <h3 className="font-serif text-2xl lg:text-3xl mb-4">
                  Nigeria's Premier Fashion House
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  To become Africa's most-loved contemporary fashion brand — synonymous with Nigerian
                  elegance, bold African prints, and the confident woman who wears them. We envision a
                  world where Nigerian fashion is celebrated not just at home, but on every runway, in
                  every city, across every culture.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Collections highlight */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <AnimatedSection className="text-center mb-12">
            <p className="text-brand-gold text-xs tracking-[0.3em] uppercase mb-4">What We Make</p>
            <h2 className="font-serif text-3xl lg:text-4xl text-brand-charcoal">
              Rooted in Nigerian Craft
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                img: '/images/ankara_edit_banner.jpg',
                name: 'Ankara',
                desc: 'Bold African prints in modern silhouettes — midi dresses, maxi gowns, two-piece sets.',
              },
              {
                img: '/images/lace_collection_banner.jpg',
                name: 'Lace',
                desc: 'Elegant French and Swiss lace designs for celebrations, weddings, and special occasions.',
              },
              {
                img: '/images/occasion_wear_banner.jpg',
                name: 'Occasion Wear',
                desc: 'Aso-oke-inspired pieces, embroidered gowns, and event-ready fashion for every milestone.',
              },
            ].map((item) => (
              <AnimatedSection key={item.name}>
                <div className="group relative overflow-hidden aspect-[3/4]">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h4 className="font-serif text-xl text-white mb-1">{item.name}</h4>
                    <p className="text-white/65 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-brand-cream">
        <div className="container-custom">
          <AnimatedSection className="text-center mb-14">
            <p className="text-brand-gold text-xs tracking-[0.3em] uppercase mb-4">What Drives Us</p>
            <h2 className="font-serif text-3xl lg:text-4xl text-brand-charcoal">Our Values</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, i) => (
              <AnimatedSection key={i}>
                <div className="text-center group">
                  <div className="w-16 h-16 mx-auto mb-6 border border-brand-beige-dark flex items-center justify-center group-hover:bg-brand-red group-hover:border-brand-red transition-all duration-300">
                    <value.icon size={24} className="text-brand-charcoal group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="font-serif text-lg text-brand-charcoal mb-3">{value.title}</h4>
                  <p className="text-sm text-brand-gray leading-relaxed">{value.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-brand-charcoal">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { number: '50K+', label: 'Nigerian Women Styled' },
              { number: '200+', label: 'Unique Designs' },
              { number: '6+', label: 'Years of Nigerian Fashion' },
              { number: '98%', label: 'Satisfaction Rate' },
            ].map((stat, i) => (
              <AnimatedSection key={i}>
                <p className="font-serif text-3xl lg:text-4xl text-brand-gold mb-1">{stat.number}</p>
                <p className="text-xs tracking-wider uppercase text-white/50">{stat.label}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-brand-cream text-center">
        <div className="container-custom max-w-2xl">
          <AnimatedSection>
            <p className="text-brand-gold text-xs tracking-[0.3em] uppercase mb-4">Ready to Shop?</p>
            <h2 className="font-serif text-3xl lg:text-4xl text-brand-charcoal mb-4">
              Wear Your Heritage with Pride
            </h2>
            <p className="text-brand-gray mb-8">
              Explore our Ankara dresses, lace gowns, and occasion wear — modern Nigerian fashion made
              to make every woman feel extraordinary.
            </p>
            <Link to="/shop" className="btn-primary">
              Explore the Collection
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
