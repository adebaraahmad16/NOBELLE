import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { DEMO_CATEGORIES } from '../data/demoData';

// Verified mapping ensuring Nigerian/African fashion imagery accurately matches each category
const CATEGORY_IMAGE_MAP = {
  'ankara': '/images/category_ankara.jpg',
  'dresses': '/images/category_dresses.png',
  'aso-oke': '/images/product_twopiece_2.png',
  'adire': '/images/product_casual_1.png',
  'two-piece-sets': '/images/product_twopiece_1.png',
  'kaftans': '/images/product_dress_2.png',
  'occasion-wear': '/images/occasion_wear_banner.jpg',
  'jumpsuits': '/images/product_corporate_1.png',
};

// Fallback descriptions if database categories lack descriptions
const CATEGORY_DESC_MAP = {
  'ankara': 'Colourful high-thread African wax prints tailored into contemporary statement silhouettes.',
  'dresses': 'Flattering maxi dresses, modern wrap gowns, and effortless daytime silhouettes.',
  'aso-oke': 'Authentic handwoven Yoruba luxury textiles crafted into striking heirloom outfits.',
  'adire': 'Hand-dyed Abeokuta indigo and silk resist-dyed pieces celebrating Nigerian textile artistry.',
  'two-piece-sets': 'Coordinated African-inspired tops and trousers or skirts tailored for modern versatility.',
  'kaftans': 'Flowing African kaftans and regal boubous offering timeless Nigerian grace and ease.',
  'occasion-wear': 'Nigerian wedding guest gowns, Owambe corset styles, and opulent celebration ensembles.',
  'jumpsuits': 'Sleek, tailored ready-to-wear Senator and African-inspired jumpsuits cut for confident elegance.',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/categories')
      .then(cats => {
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats);
        } else {
          setCategories(DEMO_CATEGORIES);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F3ED] text-[#292323]">
      {/* Visual Header */}
      <div className="container-custom pt-12 pb-8 sm:pt-16 sm:pb-12 text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#EFE5DA] text-[#641B32] text-xs uppercase tracking-widest font-semibold mb-4 shadow-2xs">
          <Sparkles size={12} className="text-[#C8A96A]" />
          <span>Curated Nigerian Ready-to-Wear</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#292323] tracking-tight">
          Explore by Category
        </h1>
        <p className="text-[#6B6B6B] text-sm sm:text-base mt-3 leading-relaxed">
          From vibrant Ankara prints and handwoven Aso-Oke to regal flowing Boubous and modern tailored sets, browse our complete collection by garment design and textile tradition.
        </p>
      </div>

      <div className="container-custom pb-20">
        {error && (
          <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm mb-8 text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-[#6B6B6B]">
            <div className="w-8 h-8 border-2 border-[#641B32] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading categories…</p>
          </div>
        ) : !error && !categories.length ? (
          <div className="py-16 text-center bg-white border border-[#EFE5DA] p-8 max-w-md mx-auto">
            <p className="font-serif text-lg mb-2">No categories published yet.</p>
            <Link to="/shop" className="inline-block mt-4 text-xs font-semibold uppercase tracking-wider text-[#641B32] underline">
              Browse All Outfits →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {categories.map(category => {
              const slug = category.slug?.toLowerCase();
              const imageSrc = category.imageUrl || category.image_url || CATEGORY_IMAGE_MAP[slug] || '/images/category_ankara.jpg';
              const description = category.description || CATEGORY_DESC_MAP[slug] || 'Explore our premium ready-to-wear designs.';

              return (
                <Link
                  key={category.id || category.slug}
                  to={`/shop?category=${encodeURIComponent(category.slug)}`}
                  className="group relative block aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-white border border-[#EFE5DA] shadow-sm hover:shadow-xl transition-all duration-500"
                >
                  {/* Category Image with smooth hover zoom */}
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    src={imageSrc}
                    alt={category.name}
                    loading="lazy"
                    onError={e => {
                      // Fallback to verified local asset if any image fails
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = CATEGORY_IMAGE_MAP[slug] || '/images/category_ankara.jpg';
                    }}
                  />

                  {/* Dark overlay on lower portion ensuring crisp text readability */}
                  <div className="absolute inset-x-0 bottom-0 bg-[#1A0A0F]/85 p-5 sm:p-6 transition-all duration-300">
                    <span className="text-[10px] uppercase tracking-widest text-[#C8A96A] font-semibold block mb-1">
                      NOBELLE Collection
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl text-[#F8F3ED] font-bold group-hover:text-white transition-colors tracking-wide">
                      {category.name}
                    </h2>
                    <p className="text-xs text-[#EFE5DA]/85 mt-1.5 line-clamp-2 leading-relaxed">
                      {description}
                    </p>
                    <div className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C8A96A] group-hover:text-[#F8F3ED] transition-colors">
                      <span>Explore Category</span>
                      <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Bottom Banner to Shop */}
        <div className="mt-16 bg-white border border-[#EFE5DA] p-8 sm:p-10 text-center shadow-sm max-w-2xl mx-auto">
          <h3 className="font-serif text-2xl text-[#292323] font-bold mb-2">Looking for a specific look?</h3>
          <p className="text-[#6B6B6B] text-sm mb-6 leading-relaxed">
            Browse our complete ready-to-wear catalog with advanced filters by color, size, and price range.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center px-8 py-3 bg-[#641B32] hover:bg-[#8E3D4C] text-[#F8F3ED] text-xs font-semibold uppercase tracking-widest transition-colors shadow-sm"
          >
            View All Products
          </Link>
        </div>
      </div>
    </div>
  );
}
