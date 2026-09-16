import { Link } from 'react-router-dom';
import { Ruler, Info } from 'lucide-react';
import { sizeChart } from '../data/products';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

function AnimatedSection({ children, className = '' }) {
  const [ref, isVisible] = useScrollAnimation();
  return (
    <div ref={ref} className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${className}`}>
      {children}
    </div>
  );
}

export default function SizeGuidePage() {
  return (
    <div>
      {/* Page Header */}
      <div className="bg-brand-beige py-12 lg:py-16">
        <div className="container-custom text-center">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-charcoal mb-2">
            Size Guide
          </h1>
          <p className="text-brand-gray text-sm tracking-wider">
            Home / <span className="text-brand-charcoal">Size Guide</span>
          </p>
        </div>
      </div>

      <section className="section-padding bg-white">
        <div className="container-custom max-w-5xl">
          {/* Intro */}
          <AnimatedSection className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-6 bg-brand-beige rounded-full flex items-center justify-center">
              <Ruler size={24} className="text-brand-red" />
            </div>
            <h2 className="font-serif text-2xl text-brand-charcoal mb-3">Find Your Perfect Fit</h2>
            <p className="text-brand-gray text-sm max-w-lg mx-auto">
              Use our comprehensive size chart below to find the perfect fit. 
              All measurements are in inches. If you're between sizes, we recommend sizing up for a more comfortable fit.
            </p>
          </AnimatedSection>

          {/* Size Chart Table */}
          <AnimatedSection className="mb-16">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-brand-charcoal text-white">
                    <th className="px-4 py-3 text-left text-xs tracking-wider uppercase font-medium">Size</th>
                    <th className="px-4 py-3 text-center text-xs tracking-wider uppercase font-medium">Bust</th>
                    <th className="px-4 py-3 text-center text-xs tracking-wider uppercase font-medium">Waist</th>
                    <th className="px-4 py-3 text-center text-xs tracking-wider uppercase font-medium">Hips</th>
                    <th className="px-4 py-3 text-center text-xs tracking-wider uppercase font-medium">UK</th>
                    <th className="px-4 py-3 text-center text-xs tracking-wider uppercase font-medium">EU</th>
                    <th className="px-4 py-3 text-center text-xs tracking-wider uppercase font-medium">US</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.map((row, i) => (
                    <tr
                      key={row.size}
                      className={`border-b border-brand-beige transition-colors hover:bg-brand-cream ${
                        i % 2 === 0 ? 'bg-white' : 'bg-brand-beige/30'
                      }`}
                    >
                      <td className="px-4 py-4 font-semibold text-sm text-brand-charcoal">{row.size}</td>
                      <td className="px-4 py-4 text-center text-sm text-brand-gray">{row.bust}</td>
                      <td className="px-4 py-4 text-center text-sm text-brand-gray">{row.waist}</td>
                      <td className="px-4 py-4 text-center text-sm text-brand-gray">{row.hips}</td>
                      <td className="px-4 py-4 text-center text-sm text-brand-gray">{row.uk}</td>
                      <td className="px-4 py-4 text-center text-sm text-brand-gray">{row.eu}</td>
                      <td className="px-4 py-4 text-center text-sm text-brand-gray">{row.us}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimatedSection>

          {/* How to Measure */}
          <AnimatedSection className="mb-16">
            <h2 className="font-serif text-2xl text-brand-charcoal text-center mb-10">
              How to Measure
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Bust',
                  instruction: 'Measure around the fullest part of your bust, keeping the tape measure horizontal and snug but not tight.',
                  icon: '📏',
                  tip: 'Wear a non-padded bra for the most accurate measurement.',
                },
                {
                  title: 'Waist',
                  instruction: 'Measure around the narrowest part of your natural waistline, typically about an inch above your belly button.',
                  icon: '📐',
                  tip: 'Stand naturally and don\'t hold your breath while measuring.',
                },
                {
                  title: 'Hips',
                  instruction: 'Measure around the fullest part of your hips and buttocks, standing with your feet together.',
                  icon: '✂️',
                  tip: 'The tape should be parallel to the floor all the way around.',
                },
              ].map((item, i) => (
                <div key={i} className="bg-brand-cream p-6 lg:p-8 text-center">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="font-serif text-lg text-brand-charcoal mb-3">{item.title}</h3>
                  <p className="text-sm text-brand-gray leading-relaxed mb-4">{item.instruction}</p>
                  <div className="flex items-start gap-2 bg-white p-3 text-left">
                    <Info size={14} className="text-brand-gold mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-brand-gray">{item.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>

          {/* Fit Guide */}
          <AnimatedSection className="mb-16">
            <div className="bg-brand-charcoal p-8 lg:p-12 text-center">
              <h2 className="font-serif text-2xl text-white mb-6">Fit Guide Tips</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
                {[
                  { title: 'Slim Fit', desc: 'Designed close to the body. If between sizes, size up for comfort.' },
                  { title: 'Regular Fit', desc: 'Classic silhouette with room to move. Order your usual size.' },
                  { title: 'Relaxed Fit', desc: 'Generous cut for an effortless drape. Order your usual size or size down for a closer fit.' },
                  { title: 'Oversized', desc: 'Intentionally roomy design. Order your usual size for the intended oversized effect.' },
                ].map((fit, i) => (
                  <div key={i} className="border border-white/20 p-4">
                    <h4 className="text-brand-gold text-xs tracking-wider uppercase mb-2">{fit.title}</h4>
                    <p className="text-white/70 text-sm">{fit.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Help */}
          <AnimatedSection className="text-center">
            <h3 className="font-serif text-xl text-brand-charcoal mb-3">Still Not Sure?</h3>
            <p className="text-brand-gray text-sm mb-6">
              Our styling team is here to help you find the perfect fit. Don't hesitate to reach out!
            </p>
            <Link to="/contact" className="btn-primary">
              Contact Us
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
