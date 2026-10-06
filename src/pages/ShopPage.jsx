import { useStoreSettings } from '../context/StoreSettingsContext';
import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, normalizeProduct } from '../api/client';
import ProductCard from '../components/ui/ProductCard';
export default function ShopPage() {
  const {settings}=useStoreSettings();
  const [params, setParams] = useSearchParams(); const [products, setProducts] = useState([]); const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [pagination, setPagination] = useState({}); const [search, setSearch] = useState(params.get('search') || '');
  const latestParams = useRef(params); const updateParams = useRef(setParams); latestParams.current = params; updateParams.current = setParams;
  useEffect(() => { api('/categories').then(setCategories).catch(e => setError(e.message)); }, []);
  useEffect(() => { if(search === (latestParams.current.get('search') || '')) return; const timer = setTimeout(() => { updateParams.current(previous => { const next = new URLSearchParams(previous); if(search) next.set('search', search); else next.delete('search'); next.delete('page'); return next; }, { replace: true }); }, 350); return () => clearTimeout(timer); }, [search]);
  useEffect(() => { let active = true; setLoading(true); setError(''); api(`/products?${params}`, { full: true }).then(result => { if(active) { setProducts(result.data.map(normalizeProduct)); setPagination(result.pagination || {}); } }).catch(e => { if(active) setError(e.message); }).finally(() => { if(active) setLoading(false); }); return () => { active = false; }; }, [params,settings?.products.outOfStockVisibility]);
  const filter = (key, value) => setParams(previous => { const next = new URLSearchParams(previous); if(value) next.set(key, value); else next.delete(key); if(key !== 'page') next.delete('page'); return next; });
  return <section className="container-custom section-padding"><h1 className="font-serif text-3xl mb-6">Shop NOBELLE</h1>
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8"><input aria-label="Search products" className="input-field" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
      <select aria-label="Category" className="input-field" value={params.get('category') || ''} onChange={e => filter('category', e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}</select>
      <select aria-label="Size" className="input-field" value={params.get('size') || ''} onChange={e=>filter('size',e.target.value)}><option value="">All sizes</option>{settings?.products.sizes.map(size=><option key={size}>{size}</option>)}</select>
      <input aria-label="Colour" className="input-field" placeholder="Colour" value={params.get('color') || ''} onChange={e => filter('color', e.target.value)} />
      <input aria-label="Maximum price" className="input-field" type="number" min="0" placeholder="Maximum price" value={params.get('maxPrice') || ''} onChange={e => filter('maxPrice', e.target.value)} />
      <select aria-label="Sort products" className="input-field" value={params.get('sort') || 'newest'} onChange={e => filter('sort', e.target.value)}><option value="newest">Newest</option><option value="price-low">Price low to high</option><option value="price-high">Price high to low</option><option value="popular">Popular</option><option value="best-selling">Best-selling</option></select></div>
    <div className="flex flex-wrap gap-5 mb-6"><label>Minimum price<input type="number" min="0" className="input-field" value={params.get('minPrice') || ''} onChange={e => filter('minPrice',e.target.value)} /></label><label className="flex gap-2 items-center"><input type="checkbox" checked={params.get('available') === 'true'} onChange={e => filter('available',e.target.checked ? 'true':'')} />Available stock only</label><label className="flex gap-2 items-center"><input type="checkbox" checked={params.get('featured') === 'true'} onChange={e => filter('featured',e.target.checked ? 'true':'')} />Featured</label></div>
    {error && <p role="alert" className="text-red-700 mb-4">{error} <button onClick={() => setParams(new URLSearchParams(params))}>Retry</button></p>}
    {loading ? <p role="status">Loading products…</p> : !error && !products.length ? <p>No products match your search.</p> : <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">{products.map(p => <ProductCard key={p.id} product={p} />)}</div>}
    <div className="flex gap-4 mt-8"><button className="btn-secondary" disabled={loading || (pagination.page || 1) <= 1} onClick={() => filter('page', String(pagination.page - 1))}>Previous</button><span>Page {pagination.page || 1}</span><button className="btn-secondary" disabled={loading || !pagination.totalPages || pagination.page >= pagination.totalPages} onClick={() => filter('page', String((pagination.page || 1) + 1))}>Next</button></div>
    <Link to="/account" className="underline block mt-6">Your account and wishlist</Link>
  </section>;
}

