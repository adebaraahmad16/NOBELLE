import { useEffect, useState } from 'react';

import { Link, useSearchParams, useParams } from 'react-router-dom';

import { api, signIn, signOut, setToken } from '../api/client';

import { formatNaira } from '../utils/currency';

export default function AccountPage() {

  const { orderId: focusedOrderId } = useParams();
  const [params] = useSearchParams(); const [user, setUser] = useState(null); const [mode, setMode] = useState(params.get('reset') ? 'reset' : 'login'); const [form, setForm] = useState({});

  const [orders, setOrders] = useState([]); const [addresses, setAddresses] = useState([]); const [wishlist, setWishlist] = useState([]); const [notifications, setNotifications] = useState([]); const [returns, setReturns] = useState([]);

  const [addressId, setAddressId] = useState(null); const [wishlistVariants,setWishlistVariants] = useState({});
  const [detail, setDetail] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');

  async function load() { const [me, os, ads, ws, ns, rs] = await Promise.all([api('/auth/me', { role: 'customer' }), api('/orders/my-orders', { role: 'customer' }), api('/addresses', { role: 'customer' }), api('/wishlist', { role: 'customer' }), api('/notifications', { role: 'customer' }), api('/returns', { role: 'customer' })]); setUser(me); setOrders(os); setAddresses(ads); setWishlist(ws); setNotifications(ns.items); setReturns(rs); if(focusedOrderId) setDetail(await api(`/orders/${focusedOrderId}`, { role:'customer' })); }

  useEffect(() => { if(params.get('verify')) api('/auth/verify-email', { method: 'POST', body: { token: params.get('verify') } }).then(() => setMessage('Email verified.')).catch(e => setError(e.message)); load().catch(e => { if(e.status !== 401) setError(e.message); }); }, [focusedOrderId]);

  useEffect(() => {
    if(!detail?.id) return;
    const interval = setInterval(() => { api(`/orders/${detail.id}`,{role:'customer'}).then(setDetail).catch(e => setError(e.message)); },3000);
    return () => clearInterval(interval);
  }, [detail?.id]);
  useEffect(() => {
    const expired = e => { if(e.detail === 'customer') { setUser(null); setOrders([]); setAddresses([]); setWishlist([]); setNotifications([]); setReturns([]); setDetail(null); } };
    window.addEventListener('nobelle-session-expired',expired);
    return () => window.removeEventListener('nobelle-session-expired',expired);
  }, []);
  const run = async (work, reload = true) => { setBusy(true); setError(''); setMessage(''); try { await work(); if(reload) await load(); setMessage(previous => previous || 'Saved successfully.'); } catch(e) { setError(e.message); } finally { setBusy(false); } };

  const auth = e => { e.preventDefault(); run(async () => {

    if(mode === 'login') await signIn('customer', form.email, form.password);

    if(mode === 'register') { const result = await api('/auth/register', { method: 'POST', body: form }); setToken('customer', result.accessToken); window.dispatchEvent(new CustomEvent('nobelle-session-changed', { detail: 'customer' })); }

    if(mode === 'forgot') { await api('/auth/forgot-password', { method: 'POST', body: { email: form.email } }); setMessage('If your account exists, a reset link will be emailed.'); return; }

    if(mode === 'reset') { await api('/auth/reset-password', { method: 'POST', body: { token: params.get('reset'), newPassword: form.password } }); setMode('login'); return; }

    await load(); setForm({});

  }, false); };

  const input = (name, label, type = 'text', required = true) => <label key={name} className="block">{label}<input className="input-field mt-1" type={type} required={required} value={form[name] || ''} onChange={e => setForm({ ...form, [name]: e.target.value })} autoComplete={name === 'password' ? 'current-password' : undefined} /></label>;

  return <section className="container-custom section-padding"><h1 className="font-serif text-3xl mb-6">Your NOBELLE account</h1>{error && <p className="text-red-700 mb-4" role="alert">{error}</p>}{message && <p role="status" className="mb-4">{message}</p>}{!user ? <div className="max-w-md"><form className="space-y-4" onSubmit={auth}>{mode === 'register' && <>{input('firstName', 'First name')}{input('lastName', 'Last name')}{input('phone', 'Phone', 'tel')}</>}{mode !== 'reset' && input('email', 'Email', 'email')}{mode !== 'forgot' && input('password', 'Password (12 characters minimum)', 'password')}{mode === 'register' && input('confirmPassword', 'Confirm password', 'password')}<button className="btn-primary" disabled={busy}>{busy ? 'Please wait…' : { login: 'Sign in', register: 'Create account', forgot: 'Send reset link', reset: 'Reset password' }[mode]}</button></form><div className="flex gap-4 mt-6">{['login', 'register', 'forgot'].map(m => <button key={m} onClick={() => { setMode(m); setForm({}); }}>{ { login: 'Sign in', register: 'Register', forgot: 'Forgot password' }[m]}</button>)}</div></div> : <>

    <div className="flex gap-4 items-center mb-8"><p>Welcome, {user.firstName}</p><button disabled={busy} onClick={() => run(async () => { await signOut('customer'); setUser(null); }, false)}>Sign out</button><Link to="/shop">Shop</Link></div>

    <div className="grid md:grid-cols-2 gap-10"><div><h2 className="font-serif text-2xl mb-4">Orders</h2>{!orders.length && <p>No orders yet.</p>}{orders.map(o => <div className="border-b py-4" key={o.id}><p>{o.orderNumber}</p><p>{o.status.replaceAll('_',' ')} — {formatNaira(Number(o.totalAmount))}</p><button className="underline" disabled={busy} onClick={() => run(async () => setDetail(await api(`/orders/${o.id}`, { role: 'customer' })), false)}>View order and tracking</button>{o.status === 'PAYMENT_PENDING' && <button className="underline ml-4" disabled={busy} onClick={() => run(async () => { const payment = await api('/payments/paystack/initialize', { role: 'customer', method: 'POST', body: { orderId: o.id } }); window.location.assign(payment.authorization_url); }, false)}>Pay order</button>}</div>)}

    {detail && <div className="border p-5 mt-5"><h3 className="font-bold">{detail.orderNumber}</h3>{detail.items.map(item => <div className="py-3" key={item.id}><p>{item.productName} — {item.size} / {item.color} × {item.quantity}</p>{detail.status === 'DELIVERED' && <><button disabled={busy} className="underline mr-4" onClick={() => { const reason = window.prompt('Reason for return'); const quantity = Number(window.prompt('Quantity to return', '1')); if(reason) run(() => api('/returns', { role: 'customer', method: 'POST', body: { orderId: detail.id, reason, items: [{ orderItemId: item.id, quantity }] } })); }}>Request return</button>{item.variantId && <button disabled={busy} className="underline" onClick={() => { const comment = window.prompt('Your review'); const rating = Number(window.prompt('Rating from 1 to 5', '5')); if(comment) run(async () => { await api(`/products/${item.productId}/reviews`, { role: 'customer', method: 'POST', body: { rating, comment } }); }); }}>Review purchase</button>}</>}</div>)}{detail.shipment && <p>Carrier: {detail.shipment.carrier} — tracking {detail.shipment.trackingNumber}</p>}<ol>{detail.statusHistory?.map(s => <li key={s.id}>{s.status.replaceAll('_',' ')} — {new Date(s.createdAt).toLocaleString()}</li>)}</ol><button onClick={() => setDetail(null)}>Close</button></div>}

    <h2 className="font-serif text-2xl mt-8 mb-4">Returns</h2>{!returns.length && <p>No return requests.</p>}{returns.map(r => <p key={r.id}>{r.order.orderNumber}: {r.status.replaceAll('_',' ')}</p>)}

    <h2 className="font-serif text-2xl mt-8 mb-4">Notifications</h2>{!notifications.length && <p>No notifications.</p>}{notifications.map(n => <div key={n.id} className="py-3"><p>{n.title}: {n.message}</p>{n.linkUrl && <Link className="underline mr-4" to={n.linkUrl}>View update</Link>}{!n.isRead && <button className="underline" disabled={busy} onClick={() => run(() => api(`/notifications/${n.id}/read`, { role: 'customer', method: 'PATCH', body: {} }))}>Mark read</button>}</div>)}</div>

    <div><h2 className="font-serif text-2xl mb-4">Profile</h2><form className="space-y-3" onSubmit={e => { e.preventDefault(); run(() => api('/profile', { role: 'customer', method: 'PATCH', body: { firstName: form.firstName || user.firstName, lastName: form.lastName || user.lastName, phone: form.phone || user.phone || '' } })); }}>{input('firstName','First name','text',false)}{input('lastName','Last name','text',false)}{input('phone','Phone','tel',false)}<button className="btn-primary" disabled={busy}>Save profile</button></form>

    <h2 className="font-serif text-2xl mt-8 mb-4">Change password</h2><form className="space-y-3" onSubmit={e => { e.preventDefault(); run(() => api('/profile/password', { role: 'customer', method: 'PATCH', body: { currentPassword: form.currentPassword, newPassword: form.newPassword } })); }}>{input('currentPassword','Current password','password')}{input('newPassword','New password','password')}<button className="btn-primary" disabled={busy}>Update password</button></form>

    <h2 className="font-serif text-2xl mt-8 mb-4">Addresses</h2>{addresses.map(a => <div className="border-b py-3" key={a.id}><p>{a.recipient}, {a.street}, {a.city}, {a.state} {a.isDefault && '(Default)'}</p><button className="underline mr-4" disabled={busy} onClick={() => run(() => api(`/addresses/${a.id}`, { role: 'customer', method: 'PATCH', body: { recipient: a.recipient, phoneNumber: a.phoneNumber, street: a.street, city: a.city, state: a.state, country: a.country, isDefault: true } }))}>Set default</button><button className="underline mr-4" disabled={busy} onClick={() => { setAddressId(a.id); setForm({...form,recipient:a.recipient,phoneNumber:a.phoneNumber,street:a.street,city:a.city,state:a.state}); }}>Edit</button><button disabled={busy} onClick={() => { if(window.confirm('Delete address?')) run(() => api(`/addresses/${a.id}`, { role: 'customer', method: 'DELETE' })); }}>Delete</button></div>)}

    <form className="space-y-3 mt-4" onSubmit={e => { e.preventDefault(); run(async () => { await api(addressId ? `/addresses/${addressId}` : '/addresses', { role: 'customer', method: addressId ? 'PATCH' : 'POST', body: { recipient: form.recipient, phoneNumber: form.phoneNumber, street: form.street, city: form.city, state: form.state, country: 'Nigeria' } }); setForm({}); setAddressId(null); }); }}>{['recipient','phoneNumber','street','city','state'].map(name => input(name, { recipient: 'Recipient', phoneNumber: 'Phone', street: 'Address', city: 'City', state: 'State' }[name]))}<button className="btn-primary" disabled={busy}>{addressId ? 'Save address' : 'Add address'}</button></form>

    <h2 className="font-serif text-2xl mt-8 mb-4">Wishlist</h2>{!wishlist.length && <p>No saved products.</p>}{wishlist.map(item => <div className="py-3" key={item.id}><Link className="underline mr-4" to={`/product/${item.product.slug}`}>{item.product.name}</Link><select className="input-field my-2" aria-label="Wishlist variant" value={wishlistVariants[item.id] || ''} onChange={e => setWishlistVariants({...wishlistVariants,[item.id]:e.target.value})}><option value="">Choose size and colour</option>{item.product.variants.filter(v => v.isActive && (v.inventory?.quantity || 0) > (v.inventory?.reserved || 0)).map(v => <option key={v.id} value={v.id}>{v.size} / {v.color}</option>)}</select><button className="underline mr-4" disabled={busy || !wishlistVariants[item.id]} onClick={() => run(async () => { await api('/cart/items',{role:'customer',method:'POST',body:{variantId:wishlistVariants[item.id],quantity:1}}); await api(`/wishlist/${item.productId}`,{role:'customer',method:'DELETE'}); window.dispatchEvent(new CustomEvent('nobelle-session-changed',{detail:'customer'})); })}>Move to cart</button><button disabled={busy} onClick={() => run(() => api(`/wishlist/${item.productId}`, { role: 'customer', method: 'DELETE' }))}>Remove</button></div>)}</div></div></>}

  </section>;

}

