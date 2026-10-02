import { Link } from 'react-router-dom';
import { Minus, Plus, X, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatNaira } from '../utils/currency';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartSubtotal, cartShipping, cartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="section-padding text-center">
        <div className="container-custom max-w-lg">
          <div className="w-20 h-20 mx-auto mb-6 bg-brand-beige rounded-full flex items-center justify-center">
            <ShoppingBag size={32} className="text-brand-gray" />
          </div>
          <h1 className="font-serif text-3xl text-brand-charcoal mb-3">Your Cart is Empty</h1>
          <p className="text-brand-gray text-sm mb-8">
            Looks like you haven't added anything to your cart yet. Discover our latest collection
            and find something you love.
          </p>
          <Link to="/shop" className="btn-primary">
            Continue Shopping
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="bg-brand-beige py-12 lg:py-16">
        <div className="container-custom text-center">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-charcoal mb-2">
            Shopping Cart
          </h1>
          <p className="text-brand-gray text-sm tracking-wider">
            Home / <span className="text-brand-charcoal">Cart</span>
          </p>
        </div>
      </div>

      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              {/* Free Shipping Bar */}
              {cartSubtotal < 150000 && (
                <div className="bg-brand-cream p-3.5 sm:p-4 mb-6 flex items-center gap-3">
                  <Truck size={18} className="text-brand-gold flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-brand-charcoal">
                    Add <span className="font-semibold text-brand-red font-numeric">{formatNaira(150000 - cartSubtotal)}</span> more
                    for <span className="font-semibold">free delivery!</span>
                  </p>
                </div>
              )}
              {cartSubtotal >= 150000 && (
                <div className="bg-green-50 p-3.5 sm:p-4 mb-6 flex items-center gap-3">
                  <Truck size={18} className="text-green-600 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-green-700 font-medium">
                    🎉 You qualify for free nationwide delivery!
                  </p>
                </div>
              )}

              {/* Table Header (Desktop) */}
              <div className="hidden sm:grid grid-cols-12 gap-4 pb-3 border-b border-brand-beige text-xs tracking-wider uppercase text-brand-gray">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Cart Items */}
              <div className="divide-y divide-brand-beige">
                {cart.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="py-5 sm:py-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center"
                  >
                    {/* Product Info */}
                    <div className="sm:col-span-6 flex gap-3 sm:gap-4">
                      <Link to={`/product/${item.id}`} className="w-16 h-20 sm:w-20 sm:h-24 bg-brand-beige flex-shrink-0 overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.id}`} className="font-serif text-sm text-brand-charcoal hover:text-brand-red transition-colors block mb-1">
                          {item.name}
                        </Link>
                        <p className="text-xs text-brand-gray">Size: {item.size}</p>
                        <p className="text-xs font-semibold text-brand-charcoal sm:hidden mt-1 font-numeric">
                          {formatNaira(item.price)} each
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id, item.size)}
                          className="mt-2 text-[11px] text-brand-gray-light hover:text-brand-red transition-colors flex items-center gap-1 sm:hidden"
                        >
                          <X size={12} /> Remove
                        </button>
                      </div>
                    </div>

                    {/* Price (Desktop) */}
                    <div className="sm:col-span-2 text-center hidden sm:block">
                      <span className="text-sm text-brand-charcoal font-numeric">{formatNaira(item.price)}</span>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-center">
                      <span className="text-xs text-brand-gray sm:hidden">Qty:</span>
                      <div className="inline-flex items-center border border-brand-beige-dark">
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-brand-gray hover:text-brand-charcoal transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 h-8 flex items-center justify-center text-xs font-medium border-x border-brand-beige-dark font-numeric">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-brand-gray hover:text-brand-charcoal transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Total + Remove */}
                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-4">
                      <span className="text-xs text-brand-gray sm:hidden">Total:</span>
                      <span className="text-sm font-semibold text-brand-charcoal font-numeric">
                        {formatNaira(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="hidden sm:block p-1 text-brand-gray-light hover:text-brand-red transition-colors"
                        aria-label="Remove item"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping */}
              <div className="mt-6 pt-6 border-t border-brand-beige">
                <Link
                  to="/shop"
                  className="text-sm text-brand-gray hover:text-brand-red transition-colors flex items-center gap-2"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-brand-cream p-5 sm:p-6 lg:p-8 sticky top-28">
                <h3 className="font-serif text-lg text-brand-charcoal mb-6 pb-4 border-b border-brand-beige-dark">
                  Order Summary
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-gray">Subtotal</span>
                    <span className="text-brand-charcoal font-numeric">{formatNaira(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-gray">Delivery</span>
                    <span className="text-brand-charcoal font-numeric">
                      {cartShipping === 0 ? (
                        <span className="text-green-600 font-semibold">Free</span>
                      ) : (
                        formatNaira(cartShipping)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-gray">Tax (VAT)</span>
                    <span className="text-brand-gray-light text-xs">Included in price</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-4 border-t border-brand-beige-dark mb-6">
                  <span className="font-serif text-lg text-brand-charcoal">Total</span>
                  <span className="font-serif text-xl font-semibold text-brand-charcoal font-numeric">
                    {formatNaira(cartTotal)}
                  </span>
                </div>

                <Link to="/checkout" className="btn-primary w-full mb-3 text-center">
                  Proceed to Checkout
                </Link>

                {/* Promo Code */}
                <div className="mt-6 pt-6 border-t border-brand-beige-dark">
                  <p className="text-xs tracking-wider uppercase text-brand-gray mb-3">Promo Code</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      className="input-field flex-1 py-2 text-xs"
                    />
                    <button className="px-4 py-2 border border-brand-charcoal text-brand-charcoal text-xs tracking-wider uppercase hover:bg-brand-charcoal hover:text-white transition-all">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
