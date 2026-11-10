import { useStoreSettings } from '../context/StoreSettingsContext';
import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, normalizeProduct } from '../api/client';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { formatNaira } from '../utils/currency';
import { getDemoProductByIdOrSlug, isDemoProduct } from '../data/demoData';
import ProductCard from '../components/ui/ProductCard';

export default function ProductDetailPage() {
  const { settings } = useStoreSettings();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [variantId, setVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const { addVariant } = useCart();
  const { products: allProducts } = useProducts();

  useEffect(() => {
    let live = true;
    const load = () => {
      api(`/products/${encodeURIComponent(id)}`)
        .then(p => {
          if (live) {
            setProduct(normalizeProduct(p));
            setImageIndex(0);
            setError('');
          }
        })
        .catch(e => {
          if (!live) return;
          // Fallback to demo product if database has no match
          const demo = getDemoProductByIdOrSlug(id);
          if (demo) {
            setProduct(normalizeProduct(demo));
            setImageIndex(0);
            setError('');
          } else {
            setProduct(null);
            setError(e.message);
          }
        });
    };

    load();
    window.addEventListener('nobelle-data-changed', load);
    return () => {
      live = false;
      window.removeEventListener('nobelle-data-changed', load);
    };
  }, [id]);

  // Set default variant when product loads
  useEffect(() => {
    if (product?.variants?.length) {
      const activeVariant = product.variants.find(v => v.isActive) || product.variants[0];
      if (activeVariant) setVariant(activeVariant.id);
    }
  }, [product]);

  const run = async work => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await work();
    } catch(e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const chosen = product?.variants?.find(v => v.id === variantId);
  const isOnSale = product?.comparePrice && Number(product.comparePrice) > Number(product.price);

  // Related products from same category or collection
  const relatedProducts = useMemo(() => {
    if (!product || !allProducts.length) return [];
    return allProducts
      .filter(p => p.id !== product.id && (p.categoryId === product.categoryId || p.collectionId === product.collectionId || p.category === product.category))
      .slice(0, 4);
  }, [product, allProducts]);

  // Handle wishlist
  const handleSaveWishlist = async () => {
    if (isDemoProduct(product.id)) {
      try {
        const stored = JSON.parse(localStorage.getItem('nobelle_demo_wishlist') || '[]');
        if (!stored.includes(product.id)) {
          localStorage.setItem('nobelle_demo_wishlist', JSON.stringify([...stored, product.id]));
        }
      } catch (_) {}
      setMessage('Saved to wishlist.');
      return;
    }
    await api(`/wishlist/${product.id}`, { role: 'customer', method: 'POST', body: {} });
    setMessage('Saved to wishlist.');
  };

  return (
    <section className="container-custom section-padding">
      {error && (
        <p role="alert" className="text-red-700 mb-4 bg-red-50 p-3 border border-red-200 text-sm">
          {error} <Link to="/account" className="underline font-semibold ml-2">Sign in</Link>
        </p>
      )}

      {message && (
        <p role="status" className="text-green-800 mb-4 bg-green-50 p-3 border border-green-200 text-sm font-medium">
          {message}
        </p>
      )}

      {!product ? (
        <p className="py-12 text-brand-gray text-center">{error ? 'Unable to load this product.' : 'Loading product…'}</p>
      ) : (
        <>
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-brand-gray">
            <Link to="/" className="hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/shop" className="hover:underline">Shop</Link>
            {product.category && (
              <>
                <span className="mx-2">/</span>
                <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:underline">
                  {typeof product.category === 'object' ? product.category.name : product.category}
                </Link>
              </>
            )}
            <span className="mx-2">/</span>
            <span className="text-brand-charcoal">{product.name}</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
            {/* Gallery */}
            <div>
              <div className="bg-brand-cream overflow-hidden aspect-[3/4] relative">
                {product.images?.length ? (
                  <img
                    className="w-full h-full object-cover"
                    src={product.images[imageIndex] || product.images[0]}
                    alt={product.name}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-brand-gray">No image available.</div>
                )}
              </div>

              {product.images?.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                  {product.images.map((url, i) => (
                    <button
                      key={url}
                      aria-label={`View image ${i + 1}`}
                      onClick={() => setImageIndex(i)}
                      className={`w-20 h-24 flex-shrink-0 border-2 overflow-hidden transition-all ${
                        imageIndex === i ? 'border-brand-burgundy' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img className="w-full h-full object-cover" src={url} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl text-brand-charcoal mb-3">
                {product.name}
              </h1>

              {/* Price & Sale */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-2xl font-semibold text-brand-charcoal">
                  {formatNaira(chosen ? Number(product.price) + Number(chosen.priceDiff || 0) : product.price)}
                </span>
                {isOnSale && (
                  <span className="text-lg line-through text-brand-gray">
                    {formatNaira(Number(product.comparePrice) + Number(chosen?.priceDiff || 0))}
                  </span>
                )}
              </div>

              {/* Descriptions */}
              {product.shortDescription && (
                <p className="text-brand-charcoal/80 text-sm italic mb-4">
                  {product.shortDescription}
                </p>
              )}
              <p className="text-brand-charcoal/90 text-sm whitespace-pre-wrap leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Variant Picker */}
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-wider text-brand-gray mb-2 font-medium">
                  Size and Colour
                </label>
                <select
                  aria-label="Size and colour variant"
                  className="input-field"
                  value={variantId}
                  onChange={e => setVariant(e.target.value)}
                >
                  <option value="">Select a variant</option>
                  {product.variants?.filter(v => v.isActive).map(v => {
                    const stock = (v.inventory?.quantity || 0) - (v.inventory?.reserved || 0);
                    const disabled = stock <= 0 && !settings?.products?.allowOutOfStockPurchases;
                    return (
                      <option disabled={disabled} key={v.id} value={v.id}>
                        {v.size} / {v.color} — {stock > 0 ? `${stock} available` : settings?.products?.allowOutOfStockPurchases ? 'Available on backorder' : 'Sold out'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Quantity Picker */}
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-wider text-brand-gray mb-2 font-medium">
                  Quantity
                </label>
                <input
                  aria-label="Quantity"
                  className="input-field w-28"
                  type="number"
                  min="1"
                  max={settings?.products?.allowOutOfStockPurchases ? 99 : chosen ? Math.max(1, (chosen.inventory?.quantity || 0) - (chosen.inventory?.reserved || 0)) : 1}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-4 mb-8">
                <button
                  className="btn-primary flex-1 min-w-[160px]"
                  disabled={busy || !chosen || quantity < 1}
                  onClick={() => run(async () => {
                    await addVariant(variantId, quantity, { product, variant: chosen });
                    setMessage('Added to cart.');
                  })}
                >
                  {busy ? 'Saving…' : 'Add to Cart'}
                </button>
                <button
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => run(handleSaveWishlist)}
                >
                  Save to Wishlist
                </button>
                <Link className="btn-secondary" to="/cart">
                  View Cart
                </Link>
              </div>

              {/* Fabric & Care Accordion / Info */}
              <div className="border-t border-brand-gray/20 pt-6 space-y-3 text-sm">
                {product.material && (
                  <p><strong className="text-brand-charcoal">Material:</strong> {product.material}</p>
                )}
                {product.careInstructions && (
                  <p><strong className="text-brand-charcoal">Care:</strong> {product.careInstructions}</p>
                )}
                <p><strong className="text-brand-charcoal">Delivery:</strong> Fast, tracked delivery across Nigeria. 1–3 business days within Lagos, 3–5 business days nationwide.</p>
              </div>

              {/* Reviews Section */}
              <div className="border-t border-brand-gray/20 pt-8 mt-8">
                <h2 className="font-serif text-2xl text-brand-charcoal mb-3">Customer Reviews</h2>
                {product.reviews === 0 ? (
                  <p className="text-sm text-brand-gray mb-4">No approved reviews yet for this piece.</p>
                ) : (
                  <div className="mb-4">
                    <p className="text-base font-medium text-brand-charcoal">
                      ★ {product.rating?.toFixed(1)} / 5 <span className="text-xs text-brand-gray font-normal">({product.reviews} reviews)</span>
                    </p>
                    {/* Review list */}
                    {product.reviewsList?.map((rev, idx) => (
                      <div key={idx} className="border-t border-brand-gray/15 pt-3 mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-brand-charcoal">{rev.customer?.firstName || 'Customer'}</span>
                          <span className="text-xs text-brand-gray">
                            {new Date(rev.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="text-brand-gold text-xs mb-1">
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </div>
                        <p className="text-sm text-brand-charcoal/90">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Link className="text-xs underline text-brand-burgundy font-medium" to="/account">
                  Review a delivered purchase in your account
                </Link>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-20 pt-12 border-t border-brand-gray/20">
              <h2 className="font-serif text-2xl sm:text-3xl text-brand-charcoal mb-8 text-center">
                You May Also Like
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
