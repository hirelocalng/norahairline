import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HERO_IMAGES, whatsappLink } from '../config';

const SLIDE_MS = 5000;

const WHATSAPP_ICON = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// Full-width hero: crossfading product photos (slow zoom on the active one)
// under a burgundy gradient. Slides are mounted one ahead of the active one,
// so a phone on mobile data only downloads the next photo when it's needed.
export default function Hero({ installButton }) {
  const sectionRef = useRef(null);
  const [active, setActive] = useState(0);
  // The outgoing slide keeps its zoom while it fades out, instead of snapping back
  const [previous, setPrevious] = useState(null);
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(1);
  const [ready, setReady] = useState(() => new Set());
  const [failed, setFailed] = useState(() => new Set());
  const [paused, setPaused] = useState(false);
  const [reduced] = useState(prefersReducedMotion);

  const count = HERO_IMAGES.length;
  const canSlide = count >= 3 && !reduced;

  // Pause while the hero is off-screen or the tab is hidden
  useEffect(() => {
    if (!canSlide) return;
    let offscreen = false;
    const update = () => setPaused(offscreen || document.hidden);
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver(([e]) => { offscreen = !e.isIntersecting; update(); })
      : null;
    if (io && sectionRef.current) io.observe(sectionRef.current);
    document.addEventListener('visibilitychange', update);
    return () => { io?.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, [canSlide]);

  // Preload the next slide once the current one is showing
  useEffect(() => {
    if (!canSlide || !ready.has(active)) return;
    setMounted(m => Math.max(m, Math.min(count, active + 2)));
  }, [active, ready, canSlide, count]);

  // Advance only to a slide that has actually loaded
  useEffect(() => {
    if (!canSlide || paused) return;
    const timer = setTimeout(() => {
      for (let step = 1; step < count; step++) {
        const next = (active + step) % count;
        if (ready.has(next) && !failed.has(next)) {
          setPrevious(active);
          setActive(next);
          return;
        }
        if (next >= mounted) break; // not downloaded yet
      }
      setTick(t => t + 1); // nothing ready yet: try again in another SLIDE_MS
    }, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [active, tick, paused, ready, failed, mounted, canSlide, count]);

  const markReady = (i) => setReady(prev => (prev.has(i) ? prev : new Set(prev).add(i)));
  const markFailed = (i) => {
    setFailed(prev => new Set(prev).add(i));
    if (i === active) setActive((i + 1) % count);
    setMounted(m => Math.max(m, Math.min(count, i + 2)));
  };

  return (
    <section ref={sectionRef} className="hero relative flex items-center justify-center overflow-hidden bg-burgundy-900">
      {/* Photos */}
      <div className="absolute inset-0" aria-hidden="true">
        {HERO_IMAGES.slice(0, mounted).map((img, i) => (
          !failed.has(i) && (
            <div
              key={img.large}
              className={`hero-slide absolute inset-0 ${i === active && ready.has(i) ? 'is-active' : ''} ${canSlide && ((i === active && ready.has(i)) || i === previous) ? 'is-zooming' : ''}`}
            >
              <img
                src={img.large}
                srcSet={`${img.medium} 800w, ${img.large} 1284w`}
                sizes="100vw"
                alt=""
                width="1284"
                height="1600"
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchpriority={i === 0 ? 'high' : 'low'}
                decoding={i === 0 ? 'sync' : 'async'}
                onLoad={() => markReady(i)}
                onError={() => markFailed(i)}
                className="w-full h-full object-cover object-[center_25%]"
              />
            </div>
          )
        ))}
      </div>

      {/* Burgundy overlay: keeps the headline and buttons readable on any photo.
          1) brand gradient top-to-bottom, 2) a dark scrim centred behind the
          text block so bright/red areas of a photo can't tint the copy,
          3) edge vignette on wider screens. */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(49,12,27,0.78) 0%, rgba(83,20,45,0.7) 45%, rgba(49,12,27,0.92) 100%)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 55%, rgba(30,6,16,0.6) 0%, rgba(30,6,16,0.35) 55%, transparent 85%)' }}
      />
      <div
        className="absolute inset-0 hidden md:block"
        style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 50%, transparent 0%, rgba(49,12,27,0.55) 100%)' }}
      />
      <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #C9A96E 30%, #C9A96E 70%, transparent)', opacity: 0.6 }} />

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-3xl mx-auto py-20">
        <div className="hero-rise flex items-center justify-center gap-3 mb-6" style={{ '--rise-delay': '100ms' }}>
          <div className="h-px w-12 sm:w-20" style={{ background: 'linear-gradient(to right, transparent, #C9A96E)' }} />
          <svg width="16" height="16" viewBox="0 0 18 18" fill="#C9A96E" aria-hidden="true">
            <path d="M9 0 L11.2 6.8 L18 9 L11.2 11.2 L9 18 L6.8 11.2 L0 9 L6.8 6.8 Z" />
          </svg>
          <div className="h-px w-12 sm:w-20" style={{ background: 'linear-gradient(to left, transparent, #C9A96E)' }} />
        </div>

        <h1
          className="hero-rise text-[clamp(2.4rem,10.5vw,2.9rem)] leading-[1.1] sm:text-6xl md:text-7xl font-serif font-bold text-white mb-4"
          style={{ '--rise-delay': '200ms', textShadow: '0 2px 4px rgba(0,0,0,0.35), 0 2px 24px rgba(0,0,0,0.5)' }}
        >
          Nora Hair Line
        </h1>

        <p
          className="hero-rise text-xl md:text-3xl italic font-serif mb-5 text-gold-400"
          style={{ '--rise-delay': '350ms', textShadow: '0 1px 3px rgba(0,0,0,0.55), 0 1px 12px rgba(0,0,0,0.45)' }}
        >
          “Luxury for less…”
        </p>

        <p
          className="hero-rise text-white text-base md:text-lg max-w-xl mx-auto mb-9 leading-relaxed"
          style={{ '--rise-delay': '500ms', textShadow: '0 1px 2px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.6)' }}
        >
          Premium wigs, frontals, bundles and more, crafted to make you look and feel your most confident.
        </p>

        <div className="hero-rise flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center" style={{ '--rise-delay': '650ms' }}>
          <Link
            to="/shop"
            className="btn-shimmer w-full sm:w-auto text-center bg-gold-500 hover:bg-gold-400 text-burgundy-900 font-semibold tracking-wide py-3.5 px-10 rounded-full shadow-lg transition-colors duration-300"
          >
            Shop Now
          </Link>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 border border-white/60 hover:border-white hover:bg-white/10 text-white font-semibold py-3.5 px-7 rounded-full transition-colors duration-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d={WHATSAPP_ICON} /></svg>
            Chat on WhatsApp
          </a>
          {installButton}
        </div>
      </div>
    </section>
  );
}
