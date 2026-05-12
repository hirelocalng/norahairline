import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, removeItem, updateQty, total, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-400 mb-8">Browse our collection and add items to your cart.</p>
        <Link to="/shop" className="btn-teal">Shop Now</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Your Cart</h1>
          <p className="text-gray-500 text-sm mt-1">{count} item{count !== 1 ? 's' : ''}</p>
        </div>

        {/* Sticky mobile checkout bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <p className="text-xs text-gray-500">{count} item{count !== 1 ? 's' : ''}</p>
            <p className="font-bold text-gray-800">₦{total.toLocaleString()}</p>
          </div>
          <Link
            to="/checkout"
            className="flex-1 max-w-xs text-center bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-full transition-colors text-sm"
          >
            Proceed to Checkout
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24 lg:pb-0">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-4 items-center">
                {/* Image */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-teal-50 flex-shrink-0">
                  {item.primary_image ? (
                    <img src={item.primary_image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 mb-1">{item.category}</p>
                  <p className="text-gold-600 font-bold">₦{Number(item.price).toLocaleString()}</p>
                </div>

                {/* Qty + Remove */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-teal-600 font-bold text-lg leading-none"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-teal-600 font-bold text-lg leading-none"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-gray-700">₦{(item.price * item.quantity).toLocaleString()}</p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary — hidden on mobile (sticky bar handles it) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24">
              <h2 className="font-bold text-gray-800 text-lg mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm text-gray-600">
                    <span className="truncate mr-2">{item.name} ×{item.quantity}</span>
                    <span className="flex-shrink-0">₦{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 mb-5">
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Total</span>
                  <span className="text-gold-600 text-lg">₦{total.toLocaleString()}</span>
                </div>
              </div>
              <Link
                to="/checkout"
                className="block text-center bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-full transition-colors"
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/shop"
                className="block text-center text-teal-600 hover:text-teal-800 text-sm font-medium mt-3 transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
