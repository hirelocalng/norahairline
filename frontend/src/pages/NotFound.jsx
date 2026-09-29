import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-ivory flex flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-gold-600 font-serif text-7xl sm:text-8xl font-bold mb-2">404</p>
      <div className="gold-divider" />
      <h1 className="text-2xl sm:text-3xl font-serif font-bold text-burgundy-600 mt-2 mb-3">This page has moved on</h1>
      <p className="text-gray-500 max-w-sm mb-8">
        The page you're looking for doesn't exist or is no longer available. Our latest styles are just a tap away.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/shop" className="btn-primary">Shop the Collection</Link>
        <Link to="/" className="btn-outline">Back to Home</Link>
      </div>
    </div>
  );
}
