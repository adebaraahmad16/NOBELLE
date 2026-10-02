import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useAdminData } from '../context/AdminDataContext';
import ProductCard from '../components/ui/ProductCard';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

function AnimatedSection({ children, className = '' }) {
  const [ref, isVisible] = useScrollAnimation();
  return (
    <div ref={ref} className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${className}`}>
      {children}
    </div>
  );
}

export default function CategoriesPage() {
  const { products } = useProducts();
  const { categories } = useAdminData();

  const activeProducts = products.filter((p) => p.status !== 'Draft' && p.status !== 'Archived');
  const visibleCategories = categories.filter((c) => c.active !== false);

  return (
    <div>
      {/* Page Header */}
      <div className="bg-brand-beige py-12 lg:py-16">
        <div className="container-custom text-center">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-charcoal mb-2">
            Categories
          </h1>
          <p className="text-brand-gray text-sm tracking-wider">
            Home / <span className="text-brand-charcoal">Categories</span>
          </p>
        </div>
      </div>

      {/* Category Quick Nav */}
      {visibleCategories.length > 0 && (
        <div className="sticky top-16 lg:top-20 z-30 bg-white/95 backdrop-blur-md border-b border-brand-beige">
          <div className="container-custom">
            <div className="flex items-center justify-start sm:justify-center gap-4 sm:gap-6 py-3 overflow-x-auto scrollbar-none px-2 sm:px-0">
              {visibleCategories.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className="text-xs tracking-[0.15em] uppercase text-brand-gray hover:text-brand-red transition-colors whitespace-nowrap shrink-0"
                >
                  {cat.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {visibleCategories.length === 0 ? (
        <section className="section-padding">
          <div className="container-custom text-center">
            <p className="font-serif text-2xl text-brand-charcoal mb-2">Our collections are being curated</p>
            <p className="text-brand-gray text-sm mb-8">
              Ankara, Lace, Aso-Oke, and Occasion Wear categories will appear here once our team publishes the new NOBELLE catalog.
            </p>
            <Link to="/shop" className="btn-primary">Browse the Shop</Link>
          </div>
        </section>
      ) : (
        visibleCategories.map((cat, catIndex) => {
          const categoryProducts = activeProducts.filter((p) => p.category === cat.id);

          return (
            <section
              key={cat.id}
              id={cat.id}
              className={`section-padding ${catIndex % 2 === 0 ? 'bg-white' : 'bg-brand-cream'}`}
            >
              {/* Category Banner */}
              <AnimatedSection>
                <div className="container-custom mb-12">
                  <div className="relative h-48 sm:h-64 lg:h-80 overflow-hidden" style={{ background: '#1a1a1a' }}>
                    {cat.image && (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white mb-3">
                          {cat.name}
                        </h2>
                        {cat.description && (
                          <p className="text-white/70 text-sm max-w-md mx-auto px-4">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* Category Products */}
              <div className="container-custom">
                {categoryProducts.length === 0 ? (
                  <p className="text-center text-brand-gray text-sm py-8">
                    No pieces in this category yet — new Ankara, Lace, and Occasion Wear arrivals are on the way.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                      {categoryProducts.map((product, i) => (
                        <ProductCard key={product.id} product={product} index={i} />
                      ))}
                    </div>
                    <div className="text-center mt-10">
                      <Link to={`/shop?category=${cat.id}`} className="btn-secondary">
                        View All {cat.name}
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
