import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api';

const NIGERIA_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT - Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];

const WHATSAPP_NUMBER = '2348038707795';

function buildWhatsAppMessage(form, items, total) {
  const lines = items.map(i => `- ${i.name} x${i.quantity} - ₦${(i.price * i.quantity).toLocaleString()}`).join('\n');
  return `Hi Nora Hair Line! I want to order:\n${lines}\nTotal: ₦${total.toLocaleString()}\nName: ${form.name}, Phone: ${form.phone}, Address: ${form.address}, State: ${form.state}`;
}

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', address: '', state: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (items.length === 0 && !done) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
        <Link to="/shop" className="btn-teal mt-4">Shop Now</Link>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^[0-9+\s\-()]{7,15}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number';
    if (!form.address.trim()) e.address = 'Delivery address is required';
    if (!form.state) e.state = 'Please select a state';
    return e;
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const saveOrder = async (paymentMethod) => {
    const res = await api.post('/orders', {
      customerName: form.name,
      customerPhone: form.phone,
      customerAddress: form.address,
      customerState: form.state,
      items,
      total,
      paymentMethod,
    });
    return res.data;
  };

  const handleWhatsApp = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    try {
      await saveOrder('whatsapp');
      const msg = buildWhatsAppMessage(form, items, total);
      clearCart();
      setDone(true);
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch {
      setErrors({ submit: 'Failed to place order. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleKorapay = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const pubKey = import.meta.env.VITE_KORAPAY_PUBLIC_KEY;
    if (!pubKey) {
      setErrors({ submit: 'Online payment is being set up. Please use WhatsApp to order for now.' });
      return;
    }

    setSubmitting(true);
    try {
      const order = await saveOrder('korapay');
      window.Korapay.initialize({
        key: pubKey,
        reference: `NORA-${order.id}-${Date.now()}`,
        amount: Math.round(total * 100),
        currency: 'NGN',
        customer: { name: form.name, phone: form.phone },
        onClose: () => setSubmitting(false),
        onSuccess: () => { clearCart(); setDone(true); },
        onFailed: () => {
          setErrors({ submit: 'Payment failed. Please try again or use WhatsApp.' });
          setSubmitting(false);
        },
      });
    } catch {
      setErrors({ submit: 'Failed to initiate payment. Please try again.' });
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-teal-700 mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-8 max-w-sm">Thank you! Your order has been received. We'll confirm availability and arrange delivery for you.</p>
        <Link to="/shop" className="btn-teal">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/cart" className="text-teal-600 hover:text-teal-800 text-sm font-medium">← Back to Cart</Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="font-bold text-gray-800 mb-5">Delivery Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                  <input
                    name="name" value={form.name} onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
                    placeholder="e.g. Amara Johnson"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                  <input
                    name="phone" value={form.phone} onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
                    placeholder="e.g. 08012345678"
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Address *</label>
                  <textarea
                    name="address" value={form.address} onChange={handleChange} rows={3}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none ${errors.address ? 'border-red-400' : 'border-gray-200'}`}
                    placeholder="House number, street, area..."
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
                  <select
                    name="state" value={form.state} onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white ${errors.state ? 'border-red-400' : 'border-gray-200'}`}
                  >
                    <option value="">Select your state</option>
                    {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                </div>
              </div>
            </div>

            {/* Payment Options */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="font-bold text-gray-800 mb-2">Choose Payment Method</h2>
              <p className="text-sm text-gray-500 mb-5">Select how you'd like to complete your order.</p>

              {errors.submit && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {errors.submit}
                </div>
              )}

              <div className="space-y-3">
                {/* WhatsApp */}
                <button
                  onClick={handleWhatsApp}
                  disabled={submitting}
                  className="w-full flex items-center gap-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-400 text-left px-5 py-4 rounded-2xl transition-all disabled:opacity-60"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">Order on WhatsApp</p>
                    <p className="text-xs text-green-600 mt-0.5">Your order details will be sent to us via WhatsApp</p>
                  </div>
                </button>

                {/* Korapay */}
                <button
                  onClick={handleKorapay}
                  disabled={submitting}
                  className="w-full flex items-center gap-4 bg-teal-50 hover:bg-teal-100 border-2 border-teal-200 hover:border-teal-400 text-left px-5 py-4 rounded-2xl transition-all disabled:opacity-60"
                >
                  <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-teal-800">Pay Online with Korapay</p>
                    <p className="text-xs text-teal-600 mt-0.5">Pay securely with card, bank transfer or USSD</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24">
              <h2 className="font-bold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm text-gray-600">
                    <span className="truncate mr-2">{item.name} ×{item.quantity}</span>
                    <span className="flex-shrink-0">₦{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Total</span>
                  <span className="text-gold-600 text-lg">₦{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
