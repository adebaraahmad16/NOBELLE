import { useStoreSettings } from '../context/StoreSettingsContext';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatNaira } from '../utils/currency';
export default function CartPage() {
  const {settings}=useStoreSettings();
  const { cart, cartSubtotal, loading, error, updateQuantity, removeFromCart, clearCart } = useCart();
  const safely = work => work().catch(() => {});
  return <section className="container-custom section-padding"><h1 className="font-serif text-3xl mb-6">Your cart</h1>{error && <p role="alert" className="text-red-700">{error} <Link to="/account">Sign in</Link></p>}{loading && <p role="status">Updating cart…</p>}{!cart.length ? <p>Your cart is empty. <Link className="underline" to="/shop">Shop NOBELLE</Link></p> : <><div className="space-y-6">{cart.map(item => <div key={item.cartItemId} className="flex flex-wrap gap-4 items-center border-b py-4">{item.image && <img className="w-20 h-24 object-cover" src={item.image} alt="" />}<div className="flex-1"><Link to={`/product/${item.productSlug}`}>{item.name}</Link><p>{item.size} / {item.color}</p><p>{formatNaira(item.price)}</p></div><label>Quantity<input className="input-field w-20" type="number" min="1" max={settings?.products.allowOutOfStockPurchases?99:item.availableStock} disabled={loading} value={item.quantity} onChange={e => safely(() => updateQuantity(item.id, item.size, Number(e.target.value)))} /></label><button disabled={loading} onClick={() => safely(() => removeFromCart(item.id, item.size))}>Remove</button></div>)}</div><p className="text-xl my-6">Subtotal: {formatNaira(cartSubtotal)}</p><p className="mb-6">Delivery is calculated at checkout.</p><div className="flex gap-4"><Link to="/checkout" className="btn-primary">Checkout</Link><button className="btn-secondary" disabled={loading} onClick={() => { if(window.confirm('Clear your cart?')) safely(clearCart); }}>Clear cart</button></div></>}</section>;
}

