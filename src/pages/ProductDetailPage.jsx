import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Heart, Share2, ChevronDown, Check, Truck, RotateCcw, Shield } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { formatNaira } from '../utils/currency';
import ProductCard from '../components/ui/ProductCard';
import StarRating from '../components/ui/StarRating';
import SectionHeader from '../components/ui/SectionHeader';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { products } = useProducts();
  const product = products.find((p) => p.id === parseInt(id) || p.id === id);
  const { addToCart } = useCart();

  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [openAccordion, setOpenAccordion] = useState('description');
  const [addedToCart, setAddedToCart] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  if (!product) {
    return (
      <div className="section-padding text-center">
        <h1 className="font-serif text-3xl text-brand-charcoal mb-4">Product Not Found</h1>
        <Link to="/shop" className="btn-primary">Back to Shop</Link>
      </div>
    );
  }

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addToCart(product, selectedSize, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="bg-brand-cream py-3">
        <div className="container-custom">
          <p className="text-xs text-brand-gray tracking-wider">
            <Link to="/" className="hover:text-brand-red transition-colors">Home</Link>
            {' / '}
            <Link to="/shop" className="hover:text-brand-red transition-colors">Shop</Link>
            {' / '}
            <Link to="/categories" className="hover:text-brand-red transition-colors capitalize">{product.category}</Link>
            {' / '}
            <span className="text-brand-charcoal">{product.name}</span>
          </p>
        </div>
      </div>

      {/* Product Detail */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div
                className="relative aspect-[3/4] bg-brand-beige overflow-hidden cursor-zoom-in sm:cursor-crosshair"
                onMouseEnter={() => setZoomed(true)}
                onMouseLeave={() => setZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                <img
                  src={product.images[activeImage]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300"
                  style={
                    zoomed
                      ? {
                          transform: 'scale(2)',
                          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        }
                      : {}
                  }
                />
                {product.tags?.includes('sale') && (
                  <span className="absolute top-4 left-4 bg-brand-red text-white px-3 py-1 text-xs tracking-wider uppercase">
                    Sale
                  </span>
                )}
                {product.tags?.includes('new') && (
                  <span className="absolute top-4 left-4 bg-brand-charcoal text-white px-3 py-1 text-xs tracking-wider uppercase">
                    New
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 border-2 overflow-hidden transition-all ${
                        i === activeImage
                          ? 'border-brand-red'
                          : 'border-transparent hover:border-brand-beige-dark'
                      }`}
                    >
                      <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="lg:py-4">
              <p className="text-xs tracking-[0.2em] uppercase text-brand-gray mb-2">
                {product.category}
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-brand-charcoal mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-6">
                <StarRating rating={product.rating} size={16} />
                <span className="text-sm text-brand-gray">
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-8 flex-wrap">
                <span className="text-2xl font-semibold text-brand-charcoal font-numeric">
                  {formatNaira(product.price)}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg text-brand-gray-light line-through font-numeric">
                      {formatNaira(product.originalPrice)}
                    </span>
                    <span className="bg-brand-red/10 text-brand-red text-xs px-2 py-1 font-medium">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Size Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-brand-charcoal">
                    Size {selectedSize && `— ${selectedSize}`}
                  </span>
                  <Link to="/size-guide" className="text-xs text-brand-red underline hover:no-underline">
                    Size Guide
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-11 h-11 sm:w-12 sm:h-12 border text-xs sm:text-sm font-medium transition-all duration-200 ${
                        selectedSize === size
                          ? 'border-brand-red bg-brand-red text-white'
                          : 'border-brand-beige-dark text-brand-charcoal hover:border-brand-charcoal'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {!selectedSize && (
                  <p className="text-xs text-brand-red mt-2">Please select a size</p>
                )}
              </div>

              {/* Quantity */}
              <div className="mb-8">
                <span className="text-sm font-medium text-brand-charcoal block mb-3">
                  Quantity
                </span>
                <div className="inline-flex items-center border border-brand-beige-dark">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-brand-gray hover:text-brand-charcoal transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center text-sm font-medium border-x border-brand-beige-dark">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-brand-gray hover:text-brand-charcoal transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-stretch gap-2 sm:gap-3 mb-8">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 px-4 text-xs sm:text-sm tracking-wider uppercase font-medium transition-all duration-300 ${
                    addedToCart
                      ? 'bg-green-600 text-white'
                      : selectedSize
                      ? 'bg-brand-red text-white hover:bg-brand-red-dark hover:shadow-lg hover:shadow-brand-red/20'
                      : 'bg-brand-beige-dark text-brand-gray cursor-not-allowed'
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <Check size={18} />
                      Added!
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      Add to Cart
                    </>
                  )}
                </button>
                <button className="w-11 sm:w-12 border border-brand-beige-dark flex items-center justify-center text-brand-gray hover:text-brand-red hover:border-brand-red transition-all shrink-0">
                  <Heart size={18} />
                </button>
                <button className="w-11 sm:w-12 border border-brand-beige-dark flex items-center justify-center text-brand-gray hover:text-brand-charcoal hover:border-brand-charcoal transition-all shrink-0">
                  <Share2 size={18} />
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8 py-5 sm:py-6 border-y border-brand-beige">
                <div className="text-center">
                  <Truck size={18} className="mx-auto text-brand-charcoal mb-1.5 sm:mb-2" />
                  <p className="text-[10px] sm:text-[11px] text-brand-gray leading-tight">Free Delivery ₦150k+</p>
                </div>
                <div className="text-center">
                  <RotateCcw size={18} className="mx-auto text-brand-charcoal mb-1.5 sm:mb-2" />
                  <p className="text-[10px] sm:text-[11px] text-brand-gray leading-tight">30-Day Returns</p>
                </div>
                <div className="text-center">
                  <Shield size={18} className="mx-auto text-brand-charcoal mb-1.5 sm:mb-2" />
                  <p className="text-[10px] sm:text-[11px] text-brand-gray leading-tight">Secure Payment</p>
                </div>
              </div>

              {/* Accordion */}
              <div className="space-y-0 border-t border-brand-beige">
                {[
                  { key: 'description', title: 'Description', content: product.description },
                  { key: 'fabric', title: 'Fabric & Care', content: product.fabric },
                  {
                    key: 'reviews',
                    title: `Reviews (${product.reviews})`,
                    content: `Average rating: ${product.rating}/5 stars from ${product.reviews} verified customers. Our customers love the quality craftsmanship and elegant design of this piece.`,
                  },
                ].map((item) => (
                  <div key={item.key} className="border-b border-brand-beige">
                    <button
                      onClick={() =>
                        setOpenAccordion(openAccordion === item.key ? '' : item.key)
                      }
                      className="w-full flex items-center justify-between py-4 text-sm font-medium text-brand-charcoal hover:text-brand-red transition-colors"
                    >
                      {item.title}
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-300 ${
                          openAccordion === item.key ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-400 ${
                        openAccordion === item.key ? 'max-h-40 pb-4' : 'max-h-0'
                      }`}
                    >
                      <p className="text-sm text-brand-gray leading-relaxed">{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="section-padding bg-brand-cream">
          <div className="container-custom">
            <SectionHeader title="You May Also Like" subtitle="Complete the look" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
