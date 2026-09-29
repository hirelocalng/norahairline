import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const VISIBLE_MS = 2600;

// Small confirmation shown after "Add to Cart". Announced to screen readers.
export default function CartToast() {
  const { lastAdded } = useCart();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!lastAdded) return;
    setToast({ ...lastAdded, leaving: false });
    const leave = setTimeout(() => setToast(t => t && { ...t, leaving: true }), VISIBLE_MS);
    const remove = setTimeout(() => setToast(null), VISIBLE_MS + 300);
    return () => { clearTimeout(leave); clearTimeout(remove); };
  }, [lastAdded]);

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-0 bottom-4 sm:bottom-6 z-[60] flex justify-center px-4 pointer-events-none"
    >
      {toast && (
        <div
          key={toast.key}
          className={`toast ${toast.leaving ? 'is-leaving' : ''} pointer-events-auto flex items-center gap-3 max-w-sm w-full sm:w-auto bg-burgundy-700 text-white rounded-full pl-4 pr-2 py-2 shadow-xl border border-gold-500/40`}
        >
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500 text-burgundy-800 flex items-center justify-center" aria-hidden="true">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <p className="text-sm flex-1 min-w-0 truncate">
            <span className="sr-only">Added to cart: </span>
            <span aria-hidden="true">Added · </span>{toast.name}
          </p>
          <Link to="/cart" className="flex-shrink-0 text-xs font-semibold bg-gold-500 text-burgundy-800 rounded-full px-3 py-1.5 hover:bg-gold-400 transition-colors">
            View cart
          </Link>
        </div>
      )}
    </div>
  );
}
