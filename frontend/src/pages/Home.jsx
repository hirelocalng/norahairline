import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedProducts } from '../api';
import ProductCard from '../components/ProductCard';

const CATEGORIES = [
  { name: 'Wigs', image: '/categories/wigs.jpg', desc: 'Full wigs for every occasion' },
  { name: 'Frontals', image: '/categories/frontals.jpg', desc: 'Natural hairline frontals' },
  { name: 'Closures', image: '/categories/closures.jpg', desc: 'Seamless closures' },
  { name: '360 Illusion Frontal', image: '/categories/360-frontal.jpg', desc: 'Full 360 coverage' },
  { name: 'Bundles', image: '/categories/bundles.jpg', desc: 'Premium hair bundles' },
  { name: 'Vietnam Bone Straight', image: '/categories/vietnam-bone-straight.jpg', desc: 'Ultra silky straight' },
  { name: 'Pixie Curls', image: '/categories/pixie-curls.jpg', desc: 'Beautiful curly pixie' },
  { name: 'Curly Hair', image: '/categories/curly-hair.jpg', desc: 'Natural curly textures' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeaturedProducts()
      .then(res => setFeatured(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">

        {/* Layer 1: deep teal base + diagonal gradient */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #082e2b 0%, #0D4A47 45%, #0f5752 70%, #082e2b 100%)',
        }} />

        {/* Layer 2: radial gold glow at centre */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 75% 55% at 50% 50%, rgba(201,168,76,0.10) 0%, transparent 70%)',
        }} />

        {/* Layer 3: subtle diamond grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='56' height='56' viewBox='0 0 56 56' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 2 L54 28 L28 54 L2 28 Z' fill='none' stroke='%23C9A84C' stroke-width='0.4' opacity='0.35'/%3E%3C/svg%3E")`,
          backgroundSize: '56px 56px',
          opacity: 0.18,
        }} />

        {/* Layer 4: fine dot grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(201,168,76,0.55) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.12,
        }} />

        {/* Top + bottom gold edge lines */}
        <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C 30%, #C9A84C 70%, transparent)', opacity: 0.5 }} />
        <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C 30%, #C9A84C 70%, transparent)', opacity: 0.5 }} />

        {/* Large background diamond silhouette */}
        <div className="absolute" style={{ width: '600px', height: '600px', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(45deg)', border: '1px solid rgba(201,168,76,0.07)', pointerEvents: 'none' }} />
        <div className="absolute" style={{ width: '480px', height: '480px', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(45deg)', border: '1px solid rgba(201,168,76,0.06)', pointerEvents: 'none' }} />

        {/* Corner ornament — top left */}
        <div className="absolute top-5 left-5 opacity-70">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <line x1="2" y1="2" x2="48" y2="2" stroke="#C9A84C" strokeWidth="1.5"/>
            <line x1="2" y1="2" x2="2" y2="48" stroke="#C9A84C" strokeWidth="1.5"/>
            <line x1="10" y1="10" x2="32" y2="10" stroke="#C9A84C" strokeWidth="0.6" opacity="0.5"/>
            <line x1="10" y1="10" x2="10" y2="32" stroke="#C9A84C" strokeWidth="0.6" opacity="0.5"/>
            <circle cx="2" cy="2" r="2.5" fill="#C9A84C"/>
            <circle cx="48" cy="2" r="1.2" fill="#C9A84C" opacity="0.5"/>
            <circle cx="2" cy="48" r="1.2" fill="#C9A84C" opacity="0.5"/>
          </svg>
        </div>

        {/* Corner ornament — top right */}
        <div className="absolute top-5 right-5 opacity-70">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <line x1="70" y1="2" x2="24" y2="2" stroke="#C9A84C" strokeWidth="1.5"/>
            <line x1="70" y1="2" x2="70" y2="48" stroke="#C9A84C" strokeWidth="1.5"/>
            <line x1="62" y1="10" x2="40" y2="10" stroke="#C9A84C" strokeWidth="0.6" opacity="0.5"/>
            <line x1="62" y1="10" x2="62" y2="32" stroke="#C9A84C" strokeWidth="0.6" opacity="0.5"/>
            <circle cx="70" cy="2" r="2.5" fill="#C9A84C"/>
            <circle cx="24" cy="2" r="1.2" fill="#C9A84C" opacity="0.5"/>
            <circle cx="70" cy="48" r="1.2" fill="#C9A84C" opacity="0.5"/>
          </svg>
        </div>

        {/* Corner ornament — bottom left */}
        <div className="absolute bottom-5 left-5 opacity-70">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <line x1="2" y1="70" x2="48" y2="70" stroke="#C9A84C" strokeWidth="1.5"/>
            <line x1="2" y1="70" x2="2" y2="24" stroke="#C9A84C" strokeWidth="1.5"/>
            <line x1="10" y1="62" x2="32" y2="62" stroke="#C9A84C" strokeWidth="0.6" opacity="0.5"/>
            <line x1="10" y1="62" x2="10" y2="40" stroke="#C9A84C" strokeWidth="0.6" opacity="0.5"/>
            <circle cx="2" cy="70" r="2.5" fill="#C9A84C"/>
          </svg>
        </div>

        {/* Corner ornament — bottom right */}
        <div className="absolute bottom-5 right-5 opacity-70">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <line x1="70" y1="70" x2="24" y2="70" stroke="#C9A84C" strokeWidth="1.5"/>
            <line x1="70" y1="70" x2="70" y2="24" stroke="#C9A84C" strokeWidth="1.5"/>
            <line x1="62" y1="62" x2="40" y2="62" stroke="#C9A84C" strokeWidth="0.6" opacity="0.5"/>
            <line x1="62" y1="62" x2="62" y2="40" stroke="#C9A84C" strokeWidth="0.6" opacity="0.5"/>
            <circle cx="70" cy="70" r="2.5" fill="#C9A84C"/>
          </svg>
        </div>

        {/* Side flowing curves — desktop only */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden lg:block" style={{ opacity: 0.15 }}>
          <svg width="48" height="320" viewBox="0 0 48 320" fill="none">
            <path d="M44 0 Q4 80 44 160 Q4 240 44 320" stroke="#C9A84C" strokeWidth="1.2"/>
            <path d="M36 0 Q2 80 36 160 Q2 240 36 320" stroke="#C9A84C" strokeWidth="0.5"/>
          </svg>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block" style={{ opacity: 0.15 }}>
          <svg width="48" height="320" viewBox="0 0 48 320" fill="none">
            <path d="M4 0 Q44 80 4 160 Q44 240 4 320" stroke="#C9A84C" strokeWidth="1.2"/>
            <path d="M12 0 Q46 80 12 160 Q46 240 12 320" stroke="#C9A84C" strokeWidth="0.5"/>
          </svg>
        </div>

        {/* ── CONTENT ── */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">

          {/* Top ornament */}
          <div className="flex items-center justify-center gap-3 mb-7">
            <div className="h-px w-12 sm:w-20" style={{ background: 'linear-gradient(to right, transparent, #C9A84C)' }} />
            <svg width="18" height="18" viewBox="0 0 18 18" fill="#C9A84C">
              <path d="M9 0 L11.2 6.8 L18 9 L11.2 11.2 L9 18 L6.8 11.2 L0 9 L6.8 6.8 Z"/>
            </svg>
            <div className="h-px w-12 sm:w-20" style={{ background: 'linear-gradient(to left, transparent, #C9A84C)' }} />
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-5 leading-tight" style={{ textShadow: '0 2px 24px rgba(0,0,0,0.4)' }}>
            Nora Hair Line
          </h1>

          {/* Gold rule with centre diamond */}
          <div className="flex items-center justify-center gap-0 mb-5">
            <div className="h-px flex-1 max-w-[80px]" style={{ background: '#C9A84C', opacity: 0.6 }} />
            <div className="mx-2 w-2.5 h-2.5 rotate-45" style={{ background: '#C9A84C' }} />
            <div className="h-px w-8" style={{ background: '#C9A84C', opacity: 0.4 }} />
            <div className="mx-2 w-1.5 h-1.5 rotate-45" style={{ background: '#C9A84C', opacity: 0.5 }} />
            <div className="h-px w-8" style={{ background: '#C9A84C', opacity: 0.4 }} />
            <div className="mx-2 w-2.5 h-2.5 rotate-45" style={{ background: '#C9A84C' }} />
            <div className="h-px flex-1 max-w-[80px]" style={{ background: '#C9A84C', opacity: 0.6 }} />
          </div>

          <p className="text-xl md:text-3xl italic font-serif mb-7" style={{ color: '#C9A84C', textShadow: '0 1px 12px rgba(201,168,76,0.3)' }}>
            "Luxury for less..."
          </p>

          <p className="text-teal-100 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ opacity: 0.9 }}>
            Discover premium quality wigs, frontals, bundles and more — crafted to make you look and feel your most confident.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop" className="btn-primary text-center">
              Shop Now
            </Link>
            <a
              href="https://wa.me/2348038707795"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-md"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat Us on WhatsApp
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6" style={{ color: '#C9A84C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ===== CATEGORIES SECTION ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-heading">Shop by Category</h2>
            <div className="gold-divider"></div>
            <p className="text-gray-500 mt-3">Find exactly what you're looking for</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="group rounded-2xl border-2 border-gray-100 hover:border-gold-400 bg-white hover:bg-gold-50 transition-all duration-300 text-center shadow-sm hover:shadow-md overflow-hidden"
              >
                <div className="aspect-square overflow-hidden rounded-t-xl">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-teal-700 text-sm group-hover:text-teal-900 mb-0.5">{cat.name}</h3>
                  <p className="text-gray-400 text-xs">{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-heading">Featured Products</h2>
            <div className="gold-divider"></div>
            <p className="text-gray-500 mt-3">Our latest and most popular pieces</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No products available yet.</p>
              <p className="text-gray-400 text-sm mt-2">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {featured.length > 0 && (
            <div className="text-center mt-10">
              <Link to="/shop" className="btn-teal inline-block">
                View All Products
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ===== ABOUT SNIPPET ===== */}
      <section className="py-16 bg-teal-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-gold-300 uppercase text-xs font-semibold tracking-widest mb-3">About Us</p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-5">
                Premium Hair, Accessible Prices
              </h2>
              <div className="w-16 h-1 bg-gold-400 mb-6"></div>
              <p className="text-teal-100 text-base leading-relaxed mb-4">
                At Nora Hair Line, we believe that every woman deserves to look and feel beautiful without breaking the bank. We source the finest quality hair products — from silky straight to luscious curls — and make them available to you at prices that won't empty your wallet.
              </p>
              <p className="text-teal-100 text-base leading-relaxed mb-8">
                Located at Trade Fair Complex in Lagos, we serve customers across Nigeria and beyond. Our collection is carefully curated to meet every hair need and style preference.
              </p>
              <Link to="/about" className="btn-primary inline-block">
                Read Our Story
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { number: '8+', label: 'Hair Categories' },
                { number: '100%', label: 'Premium Quality' },
                { number: '24/7', label: 'WhatsApp Support' },
                { number: '🇳🇬', label: 'Lagos, Nigeria' },
              ].map((stat, i) => (
                <div key={i} className="bg-teal-400/40 rounded-2xl p-6 text-center border border-teal-300/30">
                  <div className="text-3xl font-bold text-gold-300 mb-2">{stat.number}</div>
                  <div className="text-teal-100 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT / LOCATION SECTION ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-heading">Visit or Contact Us</h2>
            <div className="gold-divider"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Location */}
            <div className="bg-teal-50 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-teal-700 mb-2">Our Location</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                No 5 Veet Gold Plaza,<br />
                Trade Fair, Badagry Express Way,<br />
                Lagos, Nigeria
              </p>
            </div>

            {/* WhatsApp */}
            <div className="bg-green-50 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-green-700 mb-2">WhatsApp</h3>
              <p className="text-gray-600 text-sm mb-4">Chat with us directly for orders and enquiries</p>
              <a
                href="https://wa.me/2348038707795"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
              >
                08038707795
              </a>
            </div>

            {/* Instagram */}
            <div className="bg-purple-50 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-purple-700 mb-2">Instagram</h3>
              <p className="text-gray-600 text-sm mb-4">Follow us for new arrivals and style inspiration</p>
              <a
                href="https://instagram.com/norahairline"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all"
              >
                @norahairline
              </a>
            </div>

            {/* Linktree */}
            <div className="bg-emerald-50 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.953 15.066c-.08.163-.08.324-.08.486.08.517.528.897 1.052.897h2.182v4.906c0 .486.39.897.878.897h1.868c.488 0 .878-.41.878-.897v-4.906h2.182c.526 0 .973-.38 1.052-.897.08-.487-.196-.975-.645-1.218l-4.343-2.435c-.342-.163-.733-.163-1.075 0L8.598 14.44c-.234.162-.556.405-.645.626zm8.094-6.078l-4.343-2.435c-.342-.163-.733-.163-1.075 0L6.286 8.988c-.45.244-.725.73-.645 1.218.08.517.528.897 1.052.897h2.182v2.191h4.25v-2.19h2.182c.526 0 .973-.38 1.052-.897.08-.488-.196-.975-.645-1.22h.333z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-emerald-700 mb-2">All Our Links</h3>
              <p className="text-gray-600 text-sm mb-4">Find all our social media and contact links in one place</p>
              <a
                href="https://linktr.ee/norahairline_"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
              >
                linktr.ee/norahairline_
              </a>
            </div>

            {/* TikTok */}
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.73a4.85 4.85 0 01-1.01-.04z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">TikTok</h3>
              <p className="text-gray-600 text-sm mb-4">Watch our latest hair transformations and tutorials</p>
              <a
                href="https://tiktok.com/@norahairline1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gray-800 hover:bg-black text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
              >
                @norahairline1
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
