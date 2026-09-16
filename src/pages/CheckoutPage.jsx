import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, CreditCard, Shield, Check, ChevronLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAdminData } from '../context/AdminDataContext';
import { useProducts } from '../context/ProductContext';
import { formatNaira } from '../utils/currency';

export default function CheckoutPage() {
  const { cart, cartSubtotal, cartShipping, cartTotal, clearCart } = useCart();
  const { addOrder, addCustomer, addTransaction, settings } = useAdminData();
  const { products, updateStock } = useProducts();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '', country: 'Nigeria',
    cardNumber: '', cardExpiry: '', cardCvc: '', cardName: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();

    const orderId = `#NB${Date.now().toString().slice(-6)}`;
    const customerName = `${formData.firstName} ${formData.lastName}`.trim();
    const methodLabel =
      paymentMethod === 'card' ? 'Card' :
      paymentMethod === 'transfer' ? 'Bank Transfer' :
      paymentMethod === 'paystack' ? 'Paystack' : 'Payment on Delivery';

    // 1. Create the real order record.
    const order = addOrder({
      id: orderId,
      customerId: formData.email.toLowerCase(),
      customerName,
      email: formData.email,
      phone: formData.phone,
      amount: cartSubtotal,
      shippingRate: cartShipping,
      totalAmount: cartTotal,
      paymentMethod: methodLabel,
      paymentStatus: paymentMethod === 'transfer' || paymentMethod === 'ondelivery' ? 'Pending' : 'Paid',
      status: 'Pending',
      shippingAddress: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
      },
      deliveryMethod: 'Standard delivery',
      items: cart.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image,
      })),
    });

    // 2. Record the payment transaction (Paid gateways only).
    if (order.paymentStatus === 'Paid') {
      addTransaction({
        reference: `NBL-${Date.now().toString(36).toUpperCase()}`,
        orderId: order.id,
        customerName,
        customerEmail: formData.email,
        amount: cartTotal,
        method: methodLabel,
        status: 'Successful',
      });
    }

    // 3. Register / update the customer.
    addCustomer({
      name: customerName,
      email: formData.email,
      phone: formData.phone,
      amount: cartTotal,
      orderCount: 1,
    });

    // 4. Decrement stock for ordered items (only tracked products).
    cart.forEach((item) => {
      const product = products.find((p) => p.id === item.id);
      if (product && product.trackStock !== false) {
        updateStock(product.id, (Number(product.stock) || 0) - (Number(item.quantity) || 1));
      }
    });

    setPlacedOrderId(orderId);
    setOrderPlaced(true);
    clearCart();
  };

  if (orderPlaced) {
    return (
      <div className="section-padding text-center">
        <div className="container-custom max-w-lg">
          <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-full flex items-center justify-center p-3 shadow-md border border-brand-beige">
            <img src="/nobelle.png" alt="NOBELLE" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-serif text-3xl text-brand-charcoal mb-3">Order Confirmed!</h1>
          <p className="text-brand-gray text-sm mb-2">
            Thank you for your purchase. Your order number is:
          </p>
          <p className="font-mono text-lg font-semibold text-brand-red mb-6">
            {placedOrderId}
          </p>
          <p className="text-brand-gray text-sm mb-8">
            A confirmation has been sent to your email. We'll notify you when your order ships.
          </p>
          <Link to="/shop" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="section-padding text-center">
        <div className="container-custom max-w-lg">
          <h1 className="font-serif text-3xl text-brand-charcoal mb-4">Nothing to Checkout</h1>
          <p className="text-brand-gray text-sm mb-8">Your cart is empty. Add some items first.</p>
          <Link to="/shop" className="btn-primary">Shop Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="bg-brand-beige py-8">
        <div className="container-custom">
          <div className="flex items-center justify-between">
            <Link to="/cart" className="flex items-center gap-2 text-sm text-brand-gray hover:text-brand-charcoal transition-colors">
              <ChevronLeft size={16} /> Back to Cart
            </Link>
            <div className="flex items-center gap-2.5">
              <img src="/nobelle.png" alt="NOBELLE Logo" className="w-7 h-7 object-contain rounded-full border border-brand-gold/40 shadow-sm" />
              <h1 className="font-serif text-2xl text-brand-charcoal">Checkout</h1>
            </div>
            <div className="flex items-center gap-1 text-xs text-brand-gray">
              <Lock size={14} /> Secure
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mt-6 gap-0">
            {['Shipping', 'Payment', 'Review'].map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                      step > i + 1
                        ? 'bg-green-600 text-white'
                        : step === i + 1
                        ? 'bg-brand-red text-white'
                        : 'bg-brand-beige-dark text-brand-gray'
                    }`}
                  >
                    {step > i + 1 ? <Check size={14} /> : i + 1}
                  </div>
                  <span className={`text-xs tracking-wider uppercase hidden sm:block ${
                    step === i + 1 ? 'text-brand-charcoal font-medium' : 'text-brand-gray'
                  }`}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div className="w-12 sm:w-20 h-px bg-brand-beige-dark mx-3" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <form onSubmit={handlePlaceOrder}>
                {/* Step 1: Shipping */}
                {step === 1 && (
                  <div className="animate-fade-in">
                    <h2 className="font-serif text-xl text-brand-charcoal mb-6">Shipping Details</h2>
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs tracking-wider uppercase text-brand-gray mb-2">First Name *</label>
                          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                          <label className="block text-xs tracking-wider uppercase text-brand-gray mb-2">Last Name *</label>
                          <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="input-field" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs tracking-wider uppercase text-brand-gray mb-2">Email *</label>
                          <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                          <label className="block text-xs tracking-wider uppercase text-brand-gray mb-2">Phone *</label>
                          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" required />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs tracking-wider uppercase text-brand-gray mb-2">Address *</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className="input-field" placeholder="Street address" required />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs tracking-wider uppercase text-brand-gray mb-2">City *</label>
                          <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                          <label className="block text-xs tracking-wider uppercase text-brand-gray mb-2">State *</label>
                          <input type="text" name="state" value={formData.state} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                          <label className="block text-xs tracking-wider uppercase text-brand-gray mb-2">ZIP</label>
                          <input type="text" name="zip" value={formData.zip} onChange={handleChange} className="input-field" />
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setStep(2)} className="btn-primary mt-8">
                      Continue to Payment
                    </button>
                  </div>
                )}

                {/* Step 2: Payment */}
                {step === 2 && (
                  <div className="animate-fade-in">
                    <h2 className="font-serif text-xl text-brand-charcoal mb-6">Payment Method</h2>

                    <div className="space-y-3 mb-8">
                      <label className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${paymentMethod === 'paystack' ? 'border-brand-red bg-brand-red/5' : 'border-brand-beige-dark hover:border-brand-charcoal'}`}>
                        <input type="radio" name="payment" value="paystack" checked={paymentMethod === 'paystack'} onChange={() => setPaymentMethod('paystack')} className="accent-brand-red" />
                        <CreditCard size={20} className="text-brand-charcoal" />
                        <span className="text-sm font-medium text-brand-charcoal">Pay with Card (Paystack)</span>
                      </label>
                      <label className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${paymentMethod === 'transfer' ? 'border-brand-red bg-brand-red/5' : 'border-brand-beige-dark hover:border-brand-charcoal'}`}>
                        <input type="radio" name="payment" value="transfer" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} className="accent-brand-red" />
                        <span className="text-sm font-medium text-brand-charcoal">Bank Transfer</span>
                      </label>
                      <label className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${paymentMethod === 'ondelivery' ? 'border-brand-red bg-brand-red/5' : 'border-brand-beige-dark hover:border-brand-charcoal'}`}>
                        <input type="radio" name="payment" value="ondelivery" checked={paymentMethod === 'ondelivery'} onChange={() => setPaymentMethod('ondelivery')} className="accent-brand-red" />
                        <span className="text-sm font-medium text-brand-charcoal">Payment on Delivery</span>
                      </label>
                    </div>

                    {paymentMethod === 'paystack' && (
                      <div className="space-y-5">
                        <div>
                          <label className="block text-xs tracking-wider uppercase text-brand-gray mb-2">Card Number</label>
                          <input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleChange} className="input-field" placeholder="1234 5678 9012 3456" />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs tracking-wider uppercase text-brand-gray mb-2">Expiry Date</label>
                            <input type="text" name="cardExpiry" value={formData.cardExpiry} onChange={handleChange} className="input-field" placeholder="MM/YY" />
                          </div>
                          <div>
                            <label className="block text-xs tracking-wider uppercase text-brand-gray mb-2">CVC</label>
                            <input type="text" name="cardCvc" value={formData.cardCvc} onChange={handleChange} className="input-field" placeholder="123" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 mt-8">
                      <button type="button" onClick={() => setStep(1)} className="btn-secondary">Back</button>
                      <button type="button" onClick={() => setStep(3)} className="btn-primary">Review Order</button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                  <div className="animate-fade-in">
                    <h2 className="font-serif text-xl text-brand-charcoal mb-6">Review Order</h2>

                    <div className="bg-brand-cream p-6 mb-6">
                      <h4 className="text-xs tracking-wider uppercase text-brand-gray mb-3">Shipping To</h4>
                      <p className="text-sm text-brand-charcoal">
                        {formData.firstName} {formData.lastName}<br />
                        {formData.address}<br />
                        {formData.city}, {formData.state} {formData.zip}
                      </p>
                    </div>

                    <div className="bg-brand-cream p-6 mb-6">
                      <h4 className="text-xs tracking-wider uppercase text-brand-gray mb-3">Payment</h4>
                      <p className="text-sm text-brand-charcoal flex items-center gap-2">
                        {paymentMethod === 'paystack' ? (
                          <>
                            <CreditCard size={16} />
                            Card ending in {formData.cardNumber.slice(-4) || '****'}
                          </>
                        ) : paymentMethod === 'transfer' ? 'Bank Transfer' : 'Payment on Delivery'}
                      </p>
                    </div>

                    <div className="bg-brand-cream p-6 mb-6">
                      <h4 className="text-xs tracking-wider uppercase text-brand-gray mb-3">Items ({cart.length})</h4>
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={`${item.id}-${item.size}`} className="flex items-center gap-3">
                            <img src={item.image} alt={item.name} className="w-12 h-14 object-cover bg-white" />
                            <div className="flex-1">
                              <p className="text-sm text-brand-charcoal">{item.name}</p>
                              <p className="text-xs text-brand-gray">Size: {item.size} × {item.quantity}</p>
                            </div>
                            <p className="text-sm font-medium">{formatNaira(item.price * item.quantity)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button type="button" onClick={() => setStep(2)} className="btn-secondary">Back</button>
                      <button type="submit" className="btn-primary flex items-center gap-2">
                        <Lock size={16} />
                        Place Order — {formatNaira(cartTotal)}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-brand-cream p-6 lg:p-8 sticky top-28">
                <h3 className="font-serif text-lg text-brand-charcoal mb-6 pb-4 border-b border-brand-beige-dark">
                  Order Summary
                </h3>

                <div className="space-y-3 mb-4">
                  {cart.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="flex justify-between text-sm">
                      <span className="text-brand-gray truncate pr-2">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="text-brand-charcoal flex-shrink-0">
                        {formatNaira(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t border-brand-beige-dark mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-gray">Subtotal</span>
                    <span className="text-brand-charcoal">{formatNaira(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-gray">Shipping</span>
                    <span className="text-brand-charcoal">
                      {cartShipping === 0 ? <span className="text-green-600">Free</span> : formatNaira(cartShipping)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-brand-beige-dark">
                  <span className="font-serif text-lg text-brand-charcoal">Total</span>
                  <span className="font-serif text-xl font-semibold text-brand-charcoal">
                    {formatNaira(cartTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-brand-beige-dark">
                  <Shield size={14} className="text-brand-gray" />
                  <p className="text-[11px] text-brand-gray">Secure 256-bit SSL encryption</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
