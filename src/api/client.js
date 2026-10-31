export { api, signIn, signOut, token, setToken, ApiError } from './auth-client';
import { effectivePrice } from '../utils/pricing';
export function normalizeProduct(product) {
  const approvedReviews=(product.reviews||[]).filter(review=>review.isApproved);
  const images = (product.images || []).sort((a,b)=>a.sortOrder-b.sortOrder).map(image => image.url);
  return { ...product, price: effectivePrice(product), variants:(product.variants||[]).filter(v=>v.isActive).map(v=>({...v,priceDiff:effectivePrice(product,v.priceDiff)-effectivePrice(product)})), images, image: images[0] || '', category: product.category?.slug || '',
    categoryId: product.categoryId, collection: product.collection?.slug || '', sizes: [...new Set(product.variants?.map(v => v.size))],
    colors: [...new Set(product.variants?.map(v => v.color))], stock: (product.variants || []).reduce((n, v) => n + Math.max(0, (v.inventory?.quantity || 0) - (v.inventory?.reserved || 0)), 0),
    status: product.isActive ? 'Active' : 'Draft', featured: product.isFeatured, dateAdded: product.createdAt,
    rating: approvedReviews.length ? approvedReviews.reduce((n, r) => n + r.rating, 0) / approvedReviews.length : 0,
    reviews: approvedReviews.length };
}
