export { api, signIn, signOut, token, setToken, ApiError } from './auth-client';
import { effectivePrice } from '../utils/pricing';

export function normalizeProduct(product) {
  if (!product) return null;
  const approvedReviews = (product.reviews || []).filter(review => review.isApproved);
  const images = (product.images || []).map((img, idx) => ({
    url: typeof img === 'string' ? img : img?.url || '',
    sortOrder: typeof img === 'object' && img !== null ? (img.sortOrder ?? idx) : idx
  })).sort((a, b) => a.sortOrder - b.sortOrder).map(i => i.url).filter(Boolean);

  return {
    ...product,
    price: effectivePrice(product),
    variants: (product.variants || []).filter(v => v.isActive).map(v => ({
      ...v,
      priceDiff: effectivePrice(product, v.priceDiff) - effectivePrice(product)
    })),
    images,
    image: images[0] || product.image || '',
    category: typeof product.category === 'object' ? product.category?.slug || '' : product.category || '',
    categoryId: product.categoryId || product.category?.id || '',
    collection: typeof product.collection === 'object' ? product.collection?.slug || '' : product.collection || '',
    collectionId: product.collectionId || product.collection?.id || '',
    sizes: [...new Set((product.variants || []).map(v => v.size))],
    colors: [...new Set((product.variants || []).map(v => v.color))],
    stock: (product.variants || []).reduce((n, v) => n + Math.max(0, (v.inventory?.quantity || 0) - (v.inventory?.reserved || 0)), 0),
    status: product.isActive ? 'Active' : 'Draft',
    featured: product.isFeatured ?? product.featured ?? false,
    dateAdded: product.createdAt,
    rating: approvedReviews.length ? approvedReviews.reduce((n, r) => n + r.rating, 0) / approvedReviews.length : 0,
    reviews: approvedReviews.length,
    reviewsList: approvedReviews
  };
}
