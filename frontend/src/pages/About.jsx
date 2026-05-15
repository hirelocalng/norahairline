import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-burgundy-900 via-burgundy-700 to-burgundy-500 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-48 h-48 rounded-full border-2 border-gold-400"></div>
          <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full border-2 border-gold-400"></div>
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <div className="w-20 h-20 rounded-full bg-gold-500 flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-gold-300">
            <span className="text-white font-bold text-3xl">N</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-3">About Us</h1>
          <p className="text-gold-300 italic text-xl">Luxury for less...</p>
        </div>
      </div>

      {/* Our Story */}
      <section className="py-16 bg-ivory">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-heading">Our Story</h2>
            <div className="gold-divider"></div>
          </div>

          <div className="prose max-w-none text-gray-700 leading-relaxed space-y-5 text-base">
            <p>
              Welcome to <strong className="text-burgundy-700">Nora Hair Line</strong> — your destination for premium quality hair products at prices that celebrate every woman, not just a few. We were founded with one simple belief: <em className="text-gold-600">luxury should be accessible.</em>
            </p>
            <p>
              Based in the heart of Lagos at the Trade Fair Complex, we started as a small stall with a big dream — to give Nigerian women access to the same quality of hair extensions, wigs, and accessories that were once only available at exorbitant prices. Today, we proudly serve customers across Lagos and ship nationwide.
            </p>
            <p>
              Our collection spans 8 carefully curated categories — from silky <strong>Vietnam Bone Straight</strong> bundles to luscious <strong>Curly Hair</strong>, elegant <strong>360 Illusion Frontals</strong>, and versatile <strong>Wigs</strong> for every occasion. Each product is hand-selected to meet our strict quality standards.
            </p>
            <p>
              At Nora Hair Line, we believe that your crown deserves the best. Whether you're preparing for a wedding, a night out, or simply want to refresh your look, we have everything you need to feel confident and beautiful — without the luxury price tag.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-14 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-heading">Why Choose Us</h2>
            <div className="gold-divider"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '💎',
                title: 'Premium Quality',
                desc: 'We source only the finest hair products. Every item in our collection is selected for its quality, texture, and longevity.'
              },
              {
                icon: '💰',
                title: 'Affordable Prices',
                desc: 'Our motto "Luxury for less" isn\'t just a tagline — it\'s our promise. We work hard to bring you quality at competitive prices.'
              },
              {
                icon: '🚚',
                title: 'Nationwide Delivery',
                desc: 'We deliver to all states in Nigeria. Order via WhatsApp and we\'ll arrange fast, reliable delivery to your doorstep.'
              },
              {
                icon: '💬',
                title: 'Personal Service',
                desc: 'Chat directly with us on WhatsApp for personalized recommendations, styling advice, and order support.'
              },
              {
                icon: '🔄',
                title: 'Trusted & Reliable',
                desc: 'Hundreds of satisfied customers trust Nora Hair Line for consistent quality and honest business practices.'
              },
              {
                icon: '🌟',
                title: 'New Arrivals Regularly',
                desc: 'We constantly update our collection with the latest hair trends and styles to keep you looking fresh and fashionable.'
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gold-200 transition-all">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-burgundy-700 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Contact */}
      <section className="py-16 bg-burgundy-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Find Us</h2>
            <div className="w-16 h-1 bg-gold-400 mx-auto my-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-4xl mx-auto">
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-burgundy-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gold-300 text-xs font-semibold uppercase tracking-wider mb-1">Store Address</p>
                  <p className="text-white">No 5 Veet Gold Plaza,<br />Trade Fair, Badagry Express Way,<br />Lagos, Nigeria</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-gold-300 text-xs font-semibold uppercase tracking-wider mb-1">WhatsApp</p>
                  <a href="https://wa.me/2348038707795" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gold-300 transition-colors">
                    08038707795
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-gold-300 text-xs font-semibold uppercase tracking-wider mb-1">Instagram</p>
                  <a href="https://instagram.com/norahairline" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gold-300 transition-colors">
                    @norahairline
                  </a>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-burgundy-400/30 rounded-2xl p-8 border border-burgundy-300/40">
                <p className="text-burgundy-100 text-sm mb-5">Ready to find your perfect hair?</p>
                <div className="space-y-3">
                  <a
                    href="https://wa.me/2348038707795"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-full transition-all"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Chat on WhatsApp
                  </a>
                  <Link to="/shop" className="flex items-center justify-center w-full border-2 border-gold-400 text-gold-300 hover:bg-gold-500 hover:text-white font-semibold py-3 px-6 rounded-full transition-all">
                    Browse Our Shop
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
