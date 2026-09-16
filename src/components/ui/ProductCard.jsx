import { Link } from 'react-router-dom';
import { Eye, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';
import { formatNaira } from '../../utils/currency';

export default function ProductCard({ product, index = 0 }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, product.sizes[1] || product.sizes[0]);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const tagColors = {
    new: 'bg-brand-charcoal text-white',
    bestseller: 'bg-brand-gold text-white',
    sale: 'bg-brand-red text-white',
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="product-card group block"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Image */}
      <div className="product-card-image bg-brand-beige">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Tags */}
        {product.tags?.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className={`px-2.5 py-1 text-[10px] tracking-widest uppercase font-medium ${tagColors[tag] || 'bg-brand-charcoal text-white'}`}
              >
                {tag === 'bestseller' ? 'Best Seller' : tag}
              </span>
            ))}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-400 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100">
          <div className="flex gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-400">
            <button
              onClick={handleQuickAdd}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs tracking-wider uppercase font-medium transition-all duration-300 ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-brand-charcoal hover:bg-brand-red hover:text-white'
              }`}
            >
              <ShoppingBag size={14} />
              {added ? 'Added!' : 'Quick Add'}
            </button>
            <Link
              to={`/product/${product.id}`}
              className="flex items-center justify-center w-10 h-10 bg-white text-brand-charcoal hover:bg-brand-charcoal hover:text-white transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="pt-4 pb-2 px-1">
        <p className="text-xs tracking-wider uppercase text-brand-gray mb-1">{product.category}</p>
        <h3 className="font-serif text-base font-medium text-brand-charcoal mb-2 group-hover:text-brand-red transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-brand-charcoal">
            {formatNaira(product.salePrice ?? product.price)}
          </span>
          {product.salePrice && Number(product.salePrice) < Number(product.price) && (
            <span className="text-xs text-brand-gray-light line-through">
              {formatNaira(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
