import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api';
import { whatsappLink } from '../config';

// Keep in sync with backend/config/delivery.js — the server's fee is what's saved.
const NIGERIA_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT - Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara',
  'Lagos Mainland','Lagos Island',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];

const LIMITS = { name: 100, phone: 20, email: 254, address: 300 };

function getDeliveryFee(state) {
  if (state === 'Lagos Mainland') return 4000;
  if (state === 'Lagos Island') return 5000;
  return state ? 5000 : 0;
}

const naira = (n) => `₦${Number(n).toLocaleString('en-NG')}`;

// Mirrors backend/utils/validate.js cleanLine: drops control, zero-width and
// bidi characters, folds newlines, collapses spaces, caps length. Everything
// typed by the customer goes through this before it reaches the WhatsApp text.
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁤﻿]/g;
function cleanLine(value, maxLength) {
  return String(value ?? '')
    .replace(INVISIBLE, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLength);
}

const PHONE_RE = /^\+?[0-9][0-9\s\-()]{6,18}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function cleanForm(form) {
  return {
    name: cleanLine(form.name, LIMITS.name),
    phone: cleanLine(form.phone, LIMITS.phone),
    email: cleanLine(form.email, LIMITS.email).toLowerCase(),
    address: cleanLine(form.address, LIMITS.address),
    state: NIGERIA_STATES.includes(form.state) ? form.state : '',
  };
}

function validate(c) {
  const e = {};
  if (c.name.length < 2) e.name = 'Full name is required';
  if (!c.phone) e.phone = 'Phone number is required';
  else if (!PHONE_RE.test(c.phone) || c.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a valid phone number';
  if (c.email && !EMAIL_RE.test(c.email)) e.email = 'Enter a valid email address';
  if (c.address.length < 5) e.address = 'Please enter your full delivery address';
  if (!c.state) e.state = 'Please select a state';
  return e;
}

export function buildWhatsAppMessage({ orderId, customer, items, subtotal, deliveryFee, total }) {
  const lines = items
    .map(i => `• ${cleanLine(i.name, 120)} × ${i.quantity} — ${naira(i.price * i.quantity)}`)
    .join('\n');
  return [
    `Hi Nora Hair Line! I'd like to place an order.`,
    '',
    orderId ? `Order #${orderId}` : null,
    lines,
    '',
    `Subtotal: ${naira(subtotal)}`,
    `Delivery (${customer.state}): ${naira(deliveryFee)}`,
    `Total: ${naira(total)}`,
    '',
    `Name: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Address: ${customer.address}`,
    `State: ${customer.state}`,
    '',
    'Please confirm availability and payment details. Thank you!',
  ].filter(line => line !== null).join('\n');
}

export default function Checkout() {
  const { items, total, clearCart, removeItem } = useCart();
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', state: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const deliveryFee = getDeliveryFee(form.state);
  const grandTotal = total + deliveryFee;

  if (placedOrder) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-serif font-bold text-burgundy-700 mb-2">
          {placedOrder.id ? `Order #${placedOrder.id} sent!` : 'Order sent!'}
        </h2>
        <p className="text-gray-500 mb-6 max-w-sm">
          Your order has opened in WhatsApp. Tap <strong>send</strong> there so we receive it — we'll confirm availability and delivery with you.
        </p>
        <a
          href={placedOrder.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 text-sm font-semibold text-green-700 underline underline-offset-4"
        >
          WhatsApp didn't open? Tap here
        </a>
        <Link to="/shop" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
        <Link to="/shop" className="btn-primary mt-4">Shop Now</Link>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value.slice(0, LIMITS[name] ?? 100) }));
    setErrors(prev => ({ ...prev, [name]: '', submit: '' }));
  };

  const handleWhatsApp = async () => {
    const customer = cleanForm(form);
    const fieldErrors = validate(customer);
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }

    // Open the tab now, while we're still inside the tap — browsers (iOS
    // Safari especially) block window.open once we've awaited the network.
    const waWindow = window.open('', '_blank');
    if (waWindow) waWindow.opener = null; // same protection as rel="noopener"
    setSubmitting(true);

    let summary;
    try {
      const res = await api.post('/orders', {
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || undefined,
        customerAddress: customer.address,
        customerState: customer.state,
        items: items.map(i => ({ id: i.id, quantity: i.quantity })),
        paymentMethod: 'whatsapp',
      }, { timeout: 10000 });
      // Server-priced order: names, prices and total come from the database.
      const o = res.data;
      summary = { orderId: o.id, customer: o.customer, items: o.items, subtotal: o.subtotal, deliveryFee: o.deliveryFee, total: o.total };
    } catch (err) {
      const status = err.response?.status;
      if (status === 400 || status === 409 || status === 429) {
        waWindow?.close();
        setSubmitting(false);
        if (status === 409) err.response.data.unavailable?.forEach(id => removeItem(id));
        setErrors({ ...(err.response.data.fields || {}), submit: err.response.data.error });
        return;
      }
      // Server unreachable or failing: never block the order — send it on
      // WhatsApp from the cart instead (it just won't have an order number).
      console.error('[checkout] could not save order, sending via WhatsApp only:', err.message);
      summary = { orderId: null, customer, items, subtotal: total, deliveryFee, total: grandTotal };
    }

    const link = whatsappLink(buildWhatsAppMessage(summary));
    if (waWindow && !waWindow.closed) waWindow.location.href = link;
    else window.location.href = link;

    clearCart();
    setSubmitting(false);
    setPlacedOrder({ id: summary.orderId, link });
  };

  const inputClass = (field) =>
    `w-full px-4 py-2.5 border rounded-xl text-base sm:text-sm focus:outline-none focus:border-burgundy-500 focus:ring-1 focus:ring-burgundy-500 ${errors[field] ? 'border-red-400' : 'border-gray-200'}`;

  return (
    <div className="min-h-screen bg-ivory py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/cart" className="text-burgundy-600 hover:text-burgundy-800 text-sm font-medium">← Back to Cart</Link>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-800 mt-2">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="font-bold text-gray-800 mb-5">Delivery Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="co-name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                  <input
                    id="co-name" name="name" value={form.name} onChange={handleChange}
                    autoComplete="name" maxLength={LIMITS.name}
                    className={inputClass('name')}
                    placeholder="e.g. Amara Johnson"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="co-phone" className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                  <input
                    id="co-phone" name="phone" value={form.phone} onChange={handleChange}
                    type="tel" inputMode="tel" autoComplete="tel" maxLength={LIMITS.phone}
                    className={inputClass('phone')}
                    placeholder="e.g. 08012345678"
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="co-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address <span className="text-gray-400 font-normal">(optional — for order updates)</span>
                  </label>
                  <input
                    id="co-email" name="email" value={form.email} onChange={handleChange}
                    type="email" inputMode="email" autoComplete="email" maxLength={LIMITS.email}
                    className={inputClass('email')}
                    placeholder="e.g. amara@example.com"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="co-address" className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Address *</label>
                  <textarea
                    id="co-address" name="address" value={form.address} onChange={handleChange} rows={3}
                    autoComplete="street-address" maxLength={LIMITS.address}
                    className={`${inputClass('address')} resize-none`}
                    placeholder="House number, street, area..."
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label htmlFor="co-state" className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
                  <select
                    id="co-state" name="state" value={form.state} onChange={handleChange}
                    className={`${inputClass('state')} bg-white`}
                  >
                    <option value="">Select your state</option>
                    {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                </div>
              </div>
            </div>

            {/* Place order */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="font-bold text-gray-800 mb-2">Place Your Order</h2>
              <p className="text-sm text-gray-500 mb-5">
                We'll open WhatsApp with your order filled in. Send it, and we'll confirm availability, payment and delivery with you.
              </p>

              {errors.submit && (
                <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {errors.submit}
                </div>
              )}

              <button
                type="button"
                onClick={handleWhatsApp}
                disabled={submitting}
                className="w-full flex items-center gap-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-400 text-left px-5 py-4 rounded-2xl transition-colors disabled:opacity-60 active:scale-[0.99]"
              >
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-800">{submitting ? 'Placing your order…' : 'Order on WhatsApp'}</p>
                  <p className="text-xs text-green-600 mt-0.5">Your order details will be sent to us via WhatsApp</p>
                </div>
              </button>
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
                    <span className="flex-shrink-0">{naira(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{naira(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery</span>
                  <span>{form.state ? naira(deliveryFee) : <span className="text-gray-400 italic">Select state</span>}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 border-t border-gray-100 pt-2">
                  <span>Total</span>
                  <span className="text-gold-600 text-lg">{naira(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
