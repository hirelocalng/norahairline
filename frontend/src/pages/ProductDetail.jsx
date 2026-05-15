import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, getProducts } from '../api';
import ProductCard from '../components/ProductCard';
import FlashSaleBanner from '../components/FlashSaleBanner';

const WHATSAPP_NUMBER = '2348038707795';

function buildWhatsAppLink(name, price) {
  const text = `Hi Nora Hair Line! I want to order: ${name} - ₦${Number(price).toLocaleString()}. Please confirm availability and delivery details.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    setLoading(true);
    setRelatedProducts([]);
    getProduct(id)
      .then(res => {
        setProduct(res.data);
        setActiveImage(0);
        getProducts(res.data.category)
          .then(relRes => {
            setRelatedProducts(
              relRes.data.filter(p => p.id !== Number(id)).slice(0, 2)
            );
          })
          .catch(() => {});
      })
      .catch(err => {
        setError(err.response?.status === 404 ? 'Product not found' : 'Failed to load product');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-teal-600">Loading product...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">{error}</h2>
        <Link to="/shop" className="btn-teal inline-block mt-4">Back to Shop</Link>
      </div>
    </div>
  );

  if (!product) return null;

  const images = product.images || [];
  const activeImg = images[activeImage];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-teal-600">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-teal-600">Shop</Link>
            <span>/</span>
            <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-teal-600">{product.category}</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium truncate max-w-xs">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            {/* Main Image */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-md mb-4 aspect-square">
              {activeImg ? (
                <img
                  src={activeImg.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
                  <svg className="w-20 h-20 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-teal-400 mt-3">No image available</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activeImage ? 'border-gold-500 shadow-md' : 'border-gray-200 hover:border-teal-400'
                    }`}
                  >
                    <img src={img.image_url} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Product Video */}
            {product.video_url && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Product Video</h3>
                <video
                  src={product.video_url}
                  controls
                  playsInline
                  className="w-full rounded-2xl shadow-md bg-black"
                  style={{ maxHeight: '360px' }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Category */}
            <div className="mb-3">
              <span className="category-badge">{product.category}</span>
            </div>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-3">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mb-5">
              <span className="text-3xl font-bold text-gold-600">
                ₦{Number(product.price).toLocaleString()}
              </span>
              {product.original_price && (
                <span className="ml-3 text-lg text-gray-400 line-through">
                  ₦{Number(product.original_price).toLocaleString()}
                </span>
              )}
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-2.5 h-2.5 rounded-full ${product.available ? 'bg-green-500' : 'bg-red-400'}`}></div>
              <span className={`text-sm font-medium ${product.available ? 'text-green-600' : 'text-red-500'}`}>
                {product.available ? 'In Stock — Available' : 'Currently Unavailable'}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{product.description}</p>
              </div>
            )}

            <div className="border-t border-gray-100 pt-6 mt-auto space-y-3">
              {/* WhatsApp Order Button */}
              {product.available && (
                <a
                  href={buildWhatsAppLink(product.name, product.price)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-full transition-all duration-300 shadow-md hover:shadow-lg text-base"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Order on WhatsApp
                </a>
              )}

              <Link
                to="/shop"
                className="flex items-center justify-center gap-2 w-full border-2 border-teal-500 text-teal-600 hover:bg-teal-500 hover:text-white font-semibold py-3 px-6 rounded-full transition-all duration-300"
              >
                ← Continue Shopping
              </Link>
            </div>

            {/* Delivery note */}
            <div className="mt-6 bg-teal-50 rounded-xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-teal-700 text-sm font-medium">Order & Delivery</p>
                <p className="text-teal-600 text-xs mt-1">Place your order via WhatsApp and we'll confirm availability and arrange delivery for you. Nationwide delivery available.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flash sale banner — shown when a sale is active */}
      <FlashSaleBanner />

      {/* You May Also Like */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
          <div className="border-t border-gray-100 pt-10">
            <h2 className="text-xl font-serif font-bold text-gray-800 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-2xl">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
