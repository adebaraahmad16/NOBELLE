import { useState, useMemo } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { useAdminData } from '../context/AdminDataContext';
import ProductCard from '../components/ui/ProductCard';

export default function ShopPage() {
  const { products } = useProducts();
  const { categories: adminCategories } = useAdminData();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [sortBy, setSortBy] = useState('newest');

  const activeProducts = useMemo(
    () => products.filter((p) => p.status !== 'Draft' && p.status !== 'Archived'),
    [products]
  );

  const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const allColors = [...new Set(activeProducts.map((p) => p.colors?.[0] || p.color).filter(Boolean))];
  const maxPrice = Math.max(50000, ...activeProducts.map((p) => Number(p.price) || 0));
  const [priceCap, setPriceCap] = useState(null);
  const effectiveCap = priceCap ?? maxPrice;

  const toggleSize = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceCap(null);
  };

  const filteredProducts = useMemo(() => {
    let result = [...activeProducts];

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (selectedSizes.length > 0) {
      result = result.filter((p) => (p.sizes || []).some((s) => selectedSizes.includes(s)));
    }
    if (selectedColors.length > 0) {
      result = result.filter((p) => {
        const colors = p.colors || (p.color ? [p.color] : []);
        return colors.some((c) => selectedColors.includes(c));
      });
    }
    result = result.filter((p) => (Number(p.price) || 0) <= effectiveCap);

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
        break;
    }

    return result;
  }, [activeProducts, selectedCategory, selectedSizes, selectedColors, effectiveCap, sortBy]);

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) + selectedSizes.length + selectedColors.length + (priceCap !== null ? 1 : 0);

  const FilterSidebar = () => (
    <div className="space-y-8">
      {/* Category Filter */}
      <div>
        <h4 className="text-xs tracking-[0.15em] uppercase text-brand-charcoal font-semibold mb-4">
          Category
        </h4>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`text-sm transition-colors ${
                selectedCategory === 'all'
                  ? 'text-brand-red font-medium'
                  : 'text-brand-gray hover:text-brand-charcoal'
              }`}
            >
              All Products ({activeProducts.length})
            </button>
          </li>
          {adminCategories.map((cat) => {
            const count = activeProducts.filter((p) => p.category === cat.id).length;
            return (
              <li key={cat.id}>
                <button
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-sm transition-colors ${
                    selectedCategory === cat.id
                      ? 'text-brand-red font-medium'
                      : 'text-brand-gray hover:text-brand-charcoal'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Price Filter */}
      <div>
        <h4 className="text-xs tracking-[0.15em] uppercase text-brand-charcoal font-semibold mb-4">
          Max Price
        </h4>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max={maxPrice}
            step="500"
            value={effectiveCap}
            onChange={(e) => setPriceCap(parseInt(e.target.value))}
            className="w-full accent-brand-red"
            aria-label="Maximum price"
          />
          <div className="flex justify-between text-xs text-brand-gray">
            <span>₦0</span>
            <span>₦{effectiveCap.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Size Filter */}
      <div>
        <h4 className="text-xs tracking-[0.15em] uppercase text-brand-charcoal font-semibold mb-4">
          Size
        </h4>
        <div className="flex flex-wrap gap-2">
          {allSizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`w-10 h-10 text-xs border transition-all duration-200 ${
                selectedSizes.includes(size)
                  ? 'border-brand-red bg-brand-red text-white'
                  : 'border-brand-beige-dark text-brand-gray hover:border-brand-charcoal'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Color Filter */}
      <div>
        <h4 className="text-xs tracking-[0.15em] uppercase text-brand-charcoal font-semibold mb-4">
          Colour
        </h4>
        <div className="space-y-2">
          {allColors.map((color) => (
            <button
              key={color}
              onClick={() => toggleColor(color)}
              className={`flex items-center gap-2 text-sm w-full py-1 transition-colors ${
                selectedColors.includes(color)
                  ? 'text-brand-red font-medium'
                  : 'text-brand-gray hover:text-brand-charcoal'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full border border-black/10"
                style={{ backgroundColor: '#d9c6b8' }}
              />
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="text-xs text-brand-red underline hover:no-underline tracking-wider uppercase"
        >
          Clear All Filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* Page Header */}
      <div className="bg-brand-beige py-12 lg:py-16">
        <div className="container-custom text-center">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-charcoal mb-2">
            Shop All
          </h1>
          <p className="text-brand-gray text-sm tracking-wider">
            Home / <span className="text-brand-charcoal">Shop</span>
          </p>
        </div>
      </div>

      <div className="container-custom section-padding">
        <div className="flex gap-8 lg:gap-12">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-beige">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 text-sm text-brand-charcoal border border-brand-beige-dark px-4 py-2 hover:border-brand-charcoal transition-colors"
                >
                  <SlidersHorizontal size={16} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-brand-red text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <p className="text-sm text-brand-gray">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
                </p>
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-brand-beige-dark px-4 py-2 pr-8 text-sm text-brand-charcoal focus:outline-none focus:border-brand-red cursor-pointer"
                  aria-label="Sort products"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low → High</option>
                  <option value="price-high">Price: High → Low</option>
                  <option value="name">Name A–Z</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray pointer-events-none"
                />
              </div>
            </div>

            {/* Product Grid / Empty state */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {filteredProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            ) : activeProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-serif text-2xl text-brand-charcoal mb-2">The collection is being prepared</p>
                <p className="text-brand-gray text-sm">
                  Our new catalog is on its way. Please check back soon.
                </p>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="font-serif text-2xl text-brand-charcoal mb-2">No products found</p>
                <p className="text-brand-gray text-sm mb-6">
                  Try adjusting your filters to find what you're looking for.
                </p>
                <button onClick={clearFilters} className="btn-primary">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 lg:hidden ${
          filtersOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setFiltersOpen(false)}
      />
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-[70] transition-transform duration-400 lg:hidden overflow-y-auto ${
          filtersOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-brand-beige">
          <h3 className="font-serif text-lg font-semibold">Filters</h3>
          <button
            onClick={() => setFiltersOpen(false)}
            className="p-1 text-brand-gray hover:text-brand-charcoal"
            aria-label="Close filters"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <FilterSidebar />
        </div>
      </div>
    </div>
  );
}
