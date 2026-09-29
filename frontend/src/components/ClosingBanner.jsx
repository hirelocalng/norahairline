import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CLOSING_BANNER_IMAGE } from '../config';
import Reveal from './Reveal';

// Full-width closing call to action shown just above the footer on the homepage.
export default function ClosingBanner() {
  const [loaded, setLoaded] = useState(false);

  return (
    <section className="relative overflow-hidden bg-burgundy-800">
      <img
        src={CLOSING_BANNER_IMAGE.large}
        srcSet={`${CLOSING_BANNER_IMAGE.medium} 800w, ${CLOSING_BANNER_IMAGE.large} 1284w`}
        sizes="100vw"
        alt=""
        width="1284"
        height="1624"
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`fade-img ${loaded ? 'is-loaded' : ''} absolute inset-0 w-full h-full object-cover object-[center_30%]`}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(49,12,27,0.9) 0%, rgba(110,26,60,0.72) 55%, rgba(49,12,27,0.88) 100%)' }}
      />
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #C9A96E 30%, #C9A96E 70%, transparent)', opacity: 0.6 }} />

      <Reveal className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
        <p className="text-gold-400 uppercase text-xs font-semibold tracking-[0.3em] mb-4">Nora Hair Line</p>
        <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white leading-tight mb-4" style={{ textShadow: '0 2px 18px rgba(0,0,0,0.4)' }}>
          Luxury for less
        </h2>
        <p className="text-white/85 text-base sm:text-lg max-w-lg mx-auto mb-9">
          Wigs, frontals, closures and bundles you'll love — shop the collection.
        </p>
        <Link
          to="/shop"
          className="btn-shimmer inline-block bg-gold-500 hover:bg-gold-400 text-burgundy-900 font-semibold tracking-wide py-3.5 px-10 rounded-full shadow-lg transition-colors duration-300"
        >
          Shop the Collection
        </Link>
      </Reveal>
    </section>
  );
}
