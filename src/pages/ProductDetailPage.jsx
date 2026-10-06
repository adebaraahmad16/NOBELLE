import { useStoreSettings } from '../context/StoreSettingsContext';
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, normalizeProduct } from '../api/client';
import { useCart } from '../context/CartContext';
import { formatNaira } from '../utils/currency';
export default function ProductDetailPage() {
  const {settings}=useStoreSettings();
  const { id } = useParams(); const [product, setProduct] = useState(null); const [variantId, setVariant] = useState(''); const [quantity, setQuantity] = useState(1); const [image, setImage] = useState(0); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const { addVariant } = useCart();
  useEffect(() => { setProduct(null); api(`/products/${encodeURIComponent(id)}`).then(p => setProduct(normalizeProduct(p))).catch(e => setError(e.message)); }, [id]);
  const run = async work => { setBusy(true); setError(''); setMessage(''); try { await work(); } catch(e) { setError(e.message); } finally { setBusy(false); } };
  const chosen = product?.variants.find(v => v.id === variantId);
  return <section className="container-custom section-padding">{error && <p role="alert" className="text-red-700 mb-4">{error} <Link to="/account">Sign in</Link></p>}{message && <p role="status">{message}</p>}{!product ? <p>{error ? 'Unable to load this product.' : 'Loading product…'}</p> : <div className="grid md:grid-cols-2 gap-8">
    <div>{product.images.length ? <img className="w-full aspect-[3/4] object-cover" src={product.images[image]} alt={product.name} /> : <p>No image available.</p>}<div className="flex gap-3 mt-3">{product.images.map((url, i) => <button key={url} aria-label={`Image ${i+1}`} onClick={() => setImage(i)}><img className="w-16 h-20 object-cover" src={url} alt="" /></button>)}</div></div>
    <div><h1 className="font-serif text-3xl mb-4">{product.name}</h1><p className="text-xl mb-6">{formatNaira(chosen ? Number(product.price) + Number(chosen.priceDiff) : product.price)}</p><p className="whitespace-pre-wrap mb-6">{product.description}</p>
      <label>Size and colour<select className="input-field mt-2 mb-4" value={variantId} onChange={e => setVariant(e.target.value)}><option value="">Select a variant</option>{product.variants.filter(v => v.isActive).map(v => { const stock = (v.inventory?.quantity || 0) - (v.inventory?.reserved || 0); return <option disabled={stock <= 0&&!settings?.products.allowOutOfStockPurchases} key={v.id} value={v.id}>{v.size} / {v.color} — {stock > 0 ? `${stock} available` : settings?.products.allowOutOfStockPurchases?'Available on backorder':'Sold out'}</option>; })}</select></label>
      <label>Quantity<input className="input-field mb-4" type="number" min="1" max={settings?.products.allowOutOfStockPurchases?99:chosen ? chosen.inventory.quantity - chosen.inventory.reserved : 1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></label>
      <div className="flex flex-wrap gap-3"><button className="btn-primary" disabled={busy || !chosen || quantity < 1} onClick={() => run(async () => { await addVariant(variantId, quantity); setMessage('Added to cart.'); })}>{busy ? 'Saving…' : 'Add to cart'}</button><button className="btn-secondary" disabled={busy} onClick={() => run(async () => { await api(`/wishlist/${product.id}`, { role: 'customer', method: 'POST', body: {} }); setMessage('Saved to wishlist.'); })}>Save to wishlist</button><Link className="btn-secondary" to="/cart">View cart</Link></div>
      {product.material && <p className="mt-6">Material: {product.material}</p>}{product.careInstructions && <p className="mt-3">Care: {product.careInstructions}</p>}
      {settings?.products.reviewsEnabled&&<><h2 className="font-serif text-xl mt-8">Customer reviews</h2>{product.reviews === 0 ? <p>No approved reviews yet.</p> : <p>{product.rating.toFixed(1)} / 5 from {product.reviews} reviews</p>}<Link className="underline" to="/account">Review a delivered purchase in your account</Link></>}
    </div></div>}</section>;
}

