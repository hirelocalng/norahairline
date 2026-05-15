import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { id, name, price, original_price, category, primary_image } = product;
  const { addItem } = useCart();

  return (
    <div className="product-card group">
      {/* Image */}
      <Link to={`/product/${id}`}>
        <div className="relative overflow-hidden h-40 sm:h-52 lg:h-64 bg-gray-100">
          {primary_image ? (
            <img
              src={primary_image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
              <svg className="w-14 h-14 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-teal-400 text-xs mt-2">No image</span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <Link to={`/product/${id}`}>
          <h3 className="font-semibold text-gray-800 text-xs sm:text-base mb-1 hover:text-teal-600 transition-colors line-clamp-2">{name}</h3>
        </Link>
        <div className="mb-3">
          <p className="text-gold-600 font-bold text-sm sm:text-lg leading-tight">
            ₦{Number(price).toLocaleString()}
          </p>
          {original_price && (
            <p className="text-gray-400 text-xs sm:text-sm line-through leading-tight">
              ₦{Number(original_price).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 sm:gap-2">
          <button
            onClick={() => addItem(product)}
            className="text-center text-xs sm:text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded-full transition-all duration-200"
          >
            Add to Cart
          </button>
          <Link
            to={`/product/${id}`}
            className="text-center text-xs sm:text-sm font-medium text-teal-600 border border-teal-500 hover:bg-teal-50 py-1.5 sm:py-2 px-3 sm:px-4 rounded-full transition-all duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
