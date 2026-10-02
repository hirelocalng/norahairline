import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedProducts } from '../api';
import ProductCard from '../components/ProductCard';
import FlashSaleBanner from '../components/FlashSaleBanner';
import GallerySection from '../components/GallerySection';
import Hero from '../components/Hero';
import ClosingBanner from '../components/ClosingBanner';
import Reveal from '../components/Reveal';
import SmartImage from '../components/SmartImage';
import { WHATSAPP_DISPLAY, whatsappLink } from '../config';

const CATEGORIES = [
  { name: 'Wigs', image: '/categories/wigs.jpg', desc: 'Full wigs for every occasion' },
  { name: 'Frontals', image: '/categories/frontals.jpg', desc: 'Natural hairline frontals' },
  { name: 'Closures', image: '/categories/closures.jpg', desc: 'Seamless closures' },
  { name: '360 Illusion Frontal', image: '/categories/360-frontal.jpg', desc: 'Full 360 coverage' },
  { name: 'Bundles', image: '/categories/bundles.jpg', desc: 'Premium hair bundles' },
  { name: 'Vietnam Bone Straight', image: '/categories/vietnam-bone-straight.jpg', desc: 'Ultra silky straight' },
  { name: 'Pixie Curls', image: '/categories/pixie-curls.jpg', desc: 'Beautiful curly pixie' },
  { name: 'Curly Hair', image: '/categories/curly-hair.jpg', desc: 'Natural curly textures' },
  { name: 'Hair Products', image: '/categories/hair-products.jpg', desc: 'Premium hair care products' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    getFeaturedProducts()
      .then(res => setFeatured(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    };
    const handleInstalled = () => setShowInstall(false);
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowInstall(false);
  };

  return (
    <div>
      <FlashSaleBanner />

      {/* ===== HERO SECTION ===== */}
      <Hero
        installButton={showInstall && (
          <button
            type="button"
            onClick={handleInstall}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-white font-semibold py-3.5 px-7 rounded-full transition-colors duration-300 border border-white/60 hover:border-white hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Install Our App
          </button>
        )}
      />

      {/* ===== CATEGORIES SECTION ===== */}
      <section className="py-16 bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="section-heading">Shop by Category</h2>
            <div className="gold-divider"></div>
            <p className="text-gray-500 mt-3">Find exactly what you're looking for</p>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {CATEGORIES.map((cat, i) => (
              <Reveal key={cat.name} delay={(i % 4) * 80}>
                <Link
                  to={`/shop?category=${encodeURIComponent(cat.name)}`}
                  className="group block h-full rounded-2xl border-2 border-gray-100 hover:border-gold-400 bg-white hover:bg-gold-50 transition-colors duration-300 text-center shadow-sm overflow-hidden active:scale-[0.98]"
                >
                  <SmartImage
                    src={cat.image}
                    alt={cat.name}
                    width="400"
                    height="500"
                    className="aspect-[4/5] rounded-t-xl"
                    imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="p-3">
                    <h3 className="font-semibold text-burgundy-700 text-sm group-hover:text-burgundy-900 mb-0.5">{cat.name}</h3>
                    <p className="text-gray-400 text-xs">{cat.desc}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="section-heading">Featured Products</h2>
            <div className="gold-divider"></div>
            <p className="text-gray-500 mt-3">Our latest and most popular pieces</p>
          </Reveal>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md">
                  <div className="skeleton aspect-[4/5]"></div>
                  <div className="p-4 space-y-3">
                    <div className="skeleton h-4 rounded w-3/4"></div>
                    <div className="skeleton h-4 rounded w-1/2"></div>
                    <div className="skeleton h-8 rounded-full"></div>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {featured.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 80} className="h-full">
                  <ProductCard product={p} />
                </Reveal>
              ))}
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
      <section className="py-16 bg-burgundy-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <p className="text-gold-300 uppercase text-xs font-semibold tracking-widest mb-3">About Us</p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-5">
                Premium Hair, Accessible Prices
              </h2>
              <div className="w-16 h-1 bg-gold-400 mb-6"></div>
              <p className="text-burgundy-100 text-base leading-relaxed mb-4">
                At Nora Hair Line, we believe that every woman deserves to look and feel beautiful without breaking the bank. We source the finest quality hair products, from silky straight to luscious curls, and make them available to you at prices that won't empty your wallet.
              </p>
              <p className="text-burgundy-100 text-base leading-relaxed mb-8">
                Located at Trade Fair Complex in Lagos, we serve customers across Nigeria and beyond. Our collection is carefully curated to meet every hair need and style preference.
              </p>
              <Link to="/about" className="btn-primary inline-block">
                Read Our Story
              </Link>
            </Reveal>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { number: '8+', label: 'Hair Categories' },
                { number: '100%', label: 'Premium Quality' },
                { number: '24/7', label: 'WhatsApp Support' },
                { number: '🇳🇬', label: 'Lagos, Nigeria' },
              ].map((stat, i) => (
                <Reveal key={i} delay={i * 90} className="bg-burgundy-400/40 rounded-2xl p-6 text-center border border-burgundy-300/30">
                  <div className="text-3xl font-bold text-gold-300 mb-2">{stat.number}</div>
                  <div className="text-burgundy-100 text-sm">{stat.label}</div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== NORA HAIR QUEENS GALLERY ===== */}
      <GallerySection />

      {/* Flash sale banner — second instance above contact section */}
      <FlashSaleBanner />

      {/* ===== CONTACT / LOCATION SECTION ===== */}
      <section className="py-16 bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="section-heading">Visit or Contact Us</h2>
            <div className="gold-divider"></div>
          </Reveal>

          <Reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Location */}
            <div className="bg-burgundy-50 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-burgundy-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-burgundy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-burgundy-700 mb-2">Our Location</h3>
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
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
              >
                {WHATSAPP_DISPLAY}
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
          </Reveal>
        </div>
      </section>

      {/* ===== CLOSING CALL TO ACTION (above the footer) ===== */}
      <ClosingBanner />
    </div>
  );
}
