import { useStoreSettings } from '../context/StoreSettingsContext';
import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, normalizeProduct } from '../api/client';
import ProductCard from '../components/ui/ProductCard';
import { affectsTables } from '../lib/supabase-sync.js';
import { DEMO_CATEGORIES, filterDemoProducts } from '../data/demoData';

export default function ShopPage() {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const update = e => {
      if (affectsTables(e, [
        'products',
        'product_categories',
        'product_collections',
        'product_images',
        'product_variants',
        'inventory',
        'discounts',
        'product_reviews',
        'product_collection_links'
      ])) {
        setRevision(n => n + 1);
      }
    };
    window.addEventListener('nobelle-data-changed', update);
    return () => window.removeEventListener('nobelle-data-changed', update);
  }, []);

  const { settings } = useStoreSettings();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState(params.get('search') || '');
  const hasRealProductsRef = useRef(false);

  const latestParams = useRef(params);
  const updateParams = useRef(setParams);
  useEffect(() => {
    latestParams.current = params;
    updateParams.current = setParams;
  }, [params, setParams]);

  useEffect(() => {
    api('/categories')
      .then(cats => {
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats);
        } else {
          setCategories(DEMO_CATEGORIES);
        }
      })
      .catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    if (search === (latestParams.current.get('search') || '')) return;
    const timer = setTimeout(() => {
      updateParams.current(previous => {
        const next = new URLSearchParams(previous);
        if (search) next.set('search', search);
        else next.delete('search');
        next.delete('page');
        return next;
      }, { replace: true });
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    api(`/products?${params}`, { full: true })
      .then(result => {
        if (!active) return;
        if (result?.data && result.data.length > 0) {
          hasRealProductsRef.current = true;
          setProducts(result.data.map(normalizeProduct));
          setPagination(result.pagination || {});
        } else if (hasRealProductsRef.current) {
          // Real products exist in the store, but this specific filter yielded 0
          setProducts([]);
          setPagination(result.pagination || {});
        } else {
          // Check if database has any products at all
          api('/products?limit=1')
            .then(probe => {
              if (!active) return;
              if (Array.isArray(probe) && probe.length > 0) {
                hasRealProductsRef.current = true;
                setProducts([]);
                setPagination(result.pagination || {});
              } else {
                // Database is empty -> fallback to centralized demo products
                const demoResult = filterDemoProducts(params, settings);
                setProducts(demoResult.data.map(normalizeProduct));
                setPagination(demoResult.pagination);
              }
            })
            .catch(() => {
              if (!active) return;
              const demoResult = filterDemoProducts(params, settings);
              setProducts(demoResult.data.map(normalizeProduct));
              setPagination(demoResult.pagination);
            });
        }
      })
      .catch(e => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [params, revision, settings?.products.outOfStockVisibility]);

  const filter = (key, value) => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    return next;
  });

  const availableSizes = settings?.products?.sizes?.length
    ? settings.products.sizes
    : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className="min-h-screen bg-fabric-pattern">
      {/* Warm Burgundy Hero Header */}
      <div className="relative bg-[#641B32] text-[#F8F3ED] overflow-hidden py-10 sm:py-14 mb-8 sm:mb-10 border-b border-[#EFE5DA]/20">
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/images/ankara_edit_banner.jpg"
            alt=""
            className="w-full h-full object-cover opacity-20 mix-blend-luminosity filter saturate-50"
          />
          <div className="absolute inset-0 bg-[#641B32]/80" />
        </div>
        <div className="container-custom relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-widest text-[#C8A96A] font-semibold block mb-2">
              Ready-to-Wear Catalog
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#F8F3ED] font-bold">
              Shop NOBELLE
            </h1>
            <p className="text-[#EFE5DA]/90 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
              Contemporary Nigerian and African ready-to-wear tailored with understated elegance, artisanal prints, and timeless silhouettes.
            </p>
          </div>

          {params.get('collection') && (
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#F8F3ED] bg-[#421020] px-4 py-2 border border-[#C8A96A]/40 shadow-sm self-start md:self-auto">
              <span>Collection: <strong className="text-[#C8A96A]">{params.get('collection').replace(/-/g, ' ')}</strong></span>
              <button onClick={() => filter('collection', '')} className="ml-2 underline font-semibold hover:text-[#C8A96A]">Clear</button>
            </div>
          )}
        </div>
      </div>

      <div className="container-custom pb-16">
        {/* Category Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 text-xs" style={{ scrollbarWidth: 'thin' }}>
          <button
            onClick={() => filter('category', '')}
            className={`px-4 py-2 font-medium tracking-wider uppercase transition-all duration-200 border whitespace-nowrap ${
              !params.get('category')
                ? 'bg-[#641B32] text-[#F8F3ED] border-[#641B32] shadow-sm'
                : 'bg-white text-[#292323] border-[#EFE5DA] hover:border-[#641B32]/40'
            }`}
          >
            All Categories
          </button>
          {categories.map(c => {
            const active = params.get('category') === c.slug;
            return (
              <button
                key={c.id || c.slug}
                onClick={() => filter('category', active ? '' : c.slug)}
                className={`px-4 py-2 font-medium tracking-wider uppercase transition-all duration-200 border whitespace-nowrap ${
                  active
                    ? 'bg-[#641B32] text-[#F8F3ED] border-[#641B32] shadow-sm'
                    : 'bg-white text-[#292323] border-[#EFE5DA] hover:border-[#641B32]/40'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-[#EFE5DA] p-4 sm:p-5 shadow-sm mb-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
            <input
              aria-label="Search products"
              className="w-full px-3.5 py-2.5 bg-[#F8F3ED]/40 border border-[#EFE5DA] text-[#292323] text-sm focus:outline-none focus:border-[#641B32] focus:ring-1 focus:ring-[#641B32]/20 transition-colors placeholder:text-[#6B6B6B]"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              aria-label="Category"
              className="w-full px-3.5 py-2.5 bg-[#F8F3ED]/40 border border-[#EFE5DA] text-[#292323] text-sm focus:outline-none focus:border-[#641B32] focus:ring-1 focus:ring-[#641B32]/20 transition-colors"
              value={params.get('category') || ''}
              onChange={e => filter('category', e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <select
              aria-label="Size"
              className="w-full px-3.5 py-2.5 bg-[#F8F3ED]/40 border border-[#EFE5DA] text-[#292323] text-sm focus:outline-none focus:border-[#641B32] focus:ring-1 focus:ring-[#641B32]/20 transition-colors"
              value={params.get('size') || ''}
              onChange={e => filter('size', e.target.value)}
            >
              <option value="">All sizes</option>
              {availableSizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <input
              aria-label="Colour"
              className="w-full px-3.5 py-2.5 bg-[#F8F3ED]/40 border border-[#EFE5DA] text-[#292323] text-sm focus:outline-none focus:border-[#641B32] focus:ring-1 focus:ring-[#641B32]/20 transition-colors placeholder:text-[#6B6B6B]"
              placeholder="Colour"
              value={params.get('color') || ''}
              onChange={e => filter('color', e.target.value)}
            />
            <input
              aria-label="Maximum price"
              className="w-full px-3.5 py-2.5 bg-[#F8F3ED]/40 border border-[#EFE5DA] text-[#292323] text-sm focus:outline-none focus:border-[#641B32] focus:ring-1 focus:ring-[#641B32]/20 transition-colors placeholder:text-[#6B6B6B]"
              type="number"
              min="0"
              placeholder="Max price"
              value={params.get('maxPrice') || ''}
              onChange={e => filter('maxPrice', e.target.value)}
            />
            <select
              aria-label="Sort products"
              className="w-full px-3.5 py-2.5 bg-[#F8F3ED]/40 border border-[#EFE5DA] text-[#292323] text-sm focus:outline-none focus:border-[#641B32] focus:ring-1 focus:ring-[#641B32]/20 transition-colors font-medium text-[#641B32]"
              value={params.get('sort') || 'newest'}
              onChange={e => filter('sort', e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="popular">Popular</option>
              <option value="best-selling">Best-selling</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#EFE5DA]/60">
            <div className="flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-2 text-xs font-medium text-[#292323]">
                Min price (₦)
                <input
                  type="number"
                  min="0"
                  className="w-28 px-2.5 py-1.5 bg-[#F8F3ED]/40 border border-[#EFE5DA] text-[#292323] text-xs focus:outline-none focus:border-[#641B32]"
                  value={params.get('minPrice') || ''}
                  onChange={e => filter('minPrice', e.target.value)}
                />
              </label>
              <label className="flex gap-2 items-center text-xs font-medium text-[#292323] cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#641B32] w-4 h-4 cursor-pointer"
                  checked={params.get('available') === 'true'}
                  onChange={e => filter('available', e.target.checked ? 'true' : '')}
                />
                In stock only
              </label>
              <label className="flex gap-2 items-center text-xs font-medium text-[#292323] cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#641B32] w-4 h-4 cursor-pointer"
                  checked={params.get('featured') === 'true'}
                  onChange={e => filter('featured', e.target.checked ? 'true' : '')}
                />
                Featured
              </label>
            </div>

            {Array.from(params.entries()).length > 0 && (
              <button
                onClick={() => setParams(new URLSearchParams())}
                className="text-xs text-[#641B32] underline font-medium hover:text-[#8E3D4C]"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-red-700 bg-red-50 border border-red-200 p-4 mb-6 text-sm">
            {error} <button className="underline ml-2 font-semibold" onClick={() => setParams(new URLSearchParams(params))}>Retry</button>
          </p>
        )}

        {loading ? (
          <div className="py-16 text-center text-[#6B6B6B]">
            <div className="w-8 h-8 border-2 border-[#641B32] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading NOBELLE collection…</p>
          </div>
        ) : !error && !products.length ? (
          <div className="py-14 px-6 text-center bg-white border border-[#EFE5DA] shadow-sm max-w-md mx-auto my-8">
            <h3 className="font-serif text-xl text-[#292323] mb-2">No outfits match your selection</h3>
            <p className="text-[#6B6B6B] text-xs sm:text-sm mb-6 leading-relaxed">
              We couldn't find any products matching your active filters. Try resetting filters or adjusting search keywords.
            </p>
            <button
              className="inline-flex items-center justify-center px-6 py-2.5 bg-[#641B32] text-[#F8F3ED] hover:bg-[#8E3D4C] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
              onClick={() => setParams(new URLSearchParams())}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12 pt-6 border-t border-[#EFE5DA]">
            <button
              className="px-5 py-2 border border-[#EFE5DA] bg-white text-[#292323] hover:border-[#641B32] hover:text-[#641B32] text-xs font-medium uppercase tracking-wider transition-colors disabled:opacity-40"
              disabled={loading || (pagination.page || 1) <= 1}
              onClick={() => filter('page', String(pagination.page - 1))}
            >
              Previous
            </button>
            <span className="text-xs text-[#6B6B6B]">Page {pagination.page || 1} of {pagination.totalPages}</span>
            <button
              className="px-5 py-2 border border-[#EFE5DA] bg-white text-[#292323] hover:border-[#641B32] hover:text-[#641B32] text-xs font-medium uppercase tracking-wider transition-colors disabled:opacity-40"
              disabled={loading || !pagination.totalPages || pagination.page >= pagination.totalPages}
              onClick={() => filter('page', String((pagination.page || 1) + 1))}
            >
              Next
            </button>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link to="/account" className="inline-block text-xs uppercase tracking-wider text-[#641B32] font-semibold hover:underline">
            View Your Saved Wishlist & Account Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
