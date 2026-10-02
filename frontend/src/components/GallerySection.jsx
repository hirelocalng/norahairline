import { useState, useEffect, useCallback, useRef } from 'react';
import { getGallery } from '../api';
import { initQueensCarousel } from './queensCarousel';
import './queensCarousel.css';

function Lightbox({ item, items, onClose, onPrev, onNext }) {
  const hasPrev = items.indexOf(item) > 0;
  const hasNext = items.indexOf(item) < items.length - 1;
  const touchStartX = useRef(null);

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    if (e.key === 'ArrowRight' && hasNext) onNext();
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0 && hasNext) onNext();
    if (dx > 0 && hasPrev) onPrev();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center sm:bg-black/92 sm:p-4"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Close */}
      <button
        className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors z-10"
        onClick={onClose}
        aria-label="Close"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-10"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next */}
      {hasNext && (
        <button
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-10"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Next"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Media — full screen on mobile, contained on desktop */}
      <div
        className="w-full h-full flex items-center justify-center sm:w-auto sm:h-auto sm:max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {item.media_type === 'video' ? (
          <video
            key={item.id}
            src={item.file_url}
            className="w-full h-full object-contain sm:max-h-[90vh] sm:rounded-2xl"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img
            key={item.id}
            src={item.file_url}
            alt="Nora Hair Queens customer photo"
            decoding="async"
            className="w-full h-full object-contain sm:max-h-[90vh] sm:rounded-2xl select-none"
            draggable={false}
          />
        )}
      </div>

      {/* Dot indicator */}
      {items.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {items.map((it) => (
            <div
              key={it.id}
              className={`w-1.5 h-1.5 rounded-full transition-all ${it.id === item.id ? 'bg-white scale-125' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Cards cloned onto each end of the track so the loop can wrap seamlessly.
// Must be at least the widest cards-per-view (4 on desktop).
const MAX_CLONES = 5;

function QueenCard({ item, index, clone }) {
  const cloneProps = clone ? { 'data-qc-clone': '', 'aria-hidden': true } : {};
  const tabIndex = clone ? -1 : undefined;

  return (
    <div className="qc-card" data-qc-card="" data-qc-index={index} {...cloneProps}>
      {item.media_type === 'video' ? (
        <>
          <video
            className="qc-media"
            src={item.file_url ? `${item.file_url}#t=0.1` : undefined}
            poster={item.poster_url || undefined}
            playsInline
            preload={clone ? 'none' : 'metadata'}
          />
          <button type="button" className="qc-play" data-qc-play="" tabIndex={tabIndex} aria-label="Play video">
            <span className="qc-play-icon">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: 2 }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        </>
      ) : (
        <button type="button" className="qc-open" data-qc-open="" tabIndex={tabIndex} aria-label="View photo">
          <img
            className="qc-media"
            src={item.file_url}
            alt="Nora Hair Queens customer photo"
            width="800"
            height="800"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </button>
      )}
    </div>
  );
}

export default function GallerySection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const rootRef = useRef(null);

  useEffect(() => {
    getGallery()
      .then(res => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const clones = items.length > 1 ? Math.min(items.length, MAX_CLONES) : 0;

  useEffect(() => {
    if (loading || !rootRef.current || items.length === 0) return;
    return initQueensCarousel(rootRef.current, {
      count: items.length,
      clones,
      onOpen: setLightboxIndex,
    });
  }, [loading, items, clones]);

  const close = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex(i => Math.max(0, i - 1));
  const next = () => setLightboxIndex(i => Math.min(items.length - 1, i + 1));

  if (!loading && items.length === 0) return null;

  return (
    <>
      <section className="py-16 bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-heading">Nora Hair Queens</h2>
            <div className="gold-divider"></div>
          </div>

          {loading ? (
            <div className="queens-carousel">
              <div className="qc-track">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="qc-card qc-skeleton" />
                ))}
              </div>
            </div>
          ) : (
            <div
              ref={rootRef}
              className="queens-carousel"
              role="region"
              aria-roledescription="carousel"
              aria-label="Nora Hair Queens gallery"
            >
              <div className="qc-track" data-qc-track="">
                {items.slice(items.length - clones).map((item, i) => (
                  <QueenCard key={`head-${item.id}`} item={item} index={items.length - clones + i} clone />
                ))}
                {items.map((item, i) => (
                  <QueenCard key={item.id} item={item} index={i} />
                ))}
                {items.slice(0, clones).map((item, i) => (
                  <QueenCard key={`tail-${item.id}`} item={item} index={i} clone />
                ))}
              </div>

              {items.length > 1 && (
                <>
                  <button type="button" className="qc-arrow qc-prev" data-qc-prev="" aria-label="Previous">
                    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button type="button" className="qc-arrow qc-next" data-qc-next="" aria-label="Next">
                    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="qc-dots">
                    {items.map((item, i) => (
                      <button
                        key={item.id}
                        type="button"
                        className="qc-dot"
                        data-qc-dot=""
                        data-qc-index={i}
                        aria-label={`Go to item ${i + 1} of ${items.length}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {lightboxIndex !== null && items[lightboxIndex] && (
        <Lightbox
          item={items[lightboxIndex]}
          items={items}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </>
  );
}
