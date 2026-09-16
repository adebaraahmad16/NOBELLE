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
      title: 'Passion for Craft',
      description: 'Every stitch tells a story. We pour our hearts into creating pieces that make you feel extraordinary.',
    },
    {
      icon: Award,
      title: 'Uncompromising Quality',
      description: 'From sourcing the finest fabrics to the final finishing touch, quality is never negotiable.',
    },
    {
      icon: Globe,
      title: 'Sustainable Luxury',
      description: 'We believe in responsible fashion. Our commitment to sustainability drives every decision we make.',
    },
    {
      icon: Sparkles,
      title: 'Empowering Women',
      description: 'NOBELLE exists to celebrate and empower the bold, confident woman in every aspect of her life.',
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] lg:h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/about_lifestyle.png"
            alt="NOBELLE Atelier"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
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
            Where bold ambition meets timeless elegance
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
                  Born from a Vision of Boldness
                </h2>
                <div className="space-y-4 text-brand-gray leading-relaxed text-sm">
                  <p>
                    NOBELLE was born in 2020 from a simple yet powerful idea: every woman deserves fashion
                    that matches her ambition. Founded by a team of visionary designers who refused to
                    compromise between elegance and empowerment, we set out to create something extraordinary.
                  </p>
                  <p>
                    Our name — NOBELLE — embodies the noble spirit of the women we dress. It represents
                    strength wrapped in sophistication, confidence draped in elegance, and the unapologetic
                    pursuit of excellence.
                  </p>
                  <p>
                    Today, NOBELLE has grown into a global fashion house, dressing women across continents
                    who share our belief that style is not just about what you wear — it's about how it makes
                    you feel.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src="/images/category_dresses.png"
                    alt="NOBELLE Story"
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
                  Empowering Through Elegance
                </h3>
                <p className="text-brand-gray text-sm leading-relaxed">
                  To create premium, meticulously crafted fashion that empowers women to express their
                  boldest selves. We believe that when a woman feels beautiful, she can conquer the world.
                  Every NOBELLE piece is designed to be that catalyst — the armor of confidence, the
                  embrace of elegance.
                </p>
              </div>
              <div className="bg-brand-charcoal text-white p-8 lg:p-12">
                <p className="text-brand-gold text-xs tracking-[0.3em] uppercase mb-4">Our Vision</p>
                <h3 className="font-serif text-2xl lg:text-3xl mb-4">
                  Redefining Modern Luxury
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  To become the world's most loved premium fashion brand for women — synonymous with
                  boldness, elegance, and uncompromising quality. We envision a world where luxury
                  fashion is not just worn, but lived, breathed, and celebrated as an extension of
                  every woman's unique story.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-white">
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
              { number: '50K+', label: 'Happy Customers' },
              { number: '200+', label: 'Unique Designs' },
              { number: '30+', label: 'Countries' },
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
            <h2 className="font-serif text-3xl lg:text-4xl text-brand-charcoal mb-4">
              Join the NOBELLE Movement
            </h2>
            <p className="text-brand-gray mb-8">
              Discover a world of bold elegance. Shop our latest collection and become part of the NOBELLE story.
            </p>
            <Link to="/shop" className="btn-primary">
              Shop Now
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
