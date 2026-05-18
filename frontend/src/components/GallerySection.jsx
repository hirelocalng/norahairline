import { useState, useEffect, useCallback } from 'react';
import { getGallery } from '../api';

function Lightbox({ item, items, onClose, onPrev, onNext }) {
  const hasPrev = items.indexOf(item) > 0;
  const hasNext = items.indexOf(item) < items.length - 1;

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

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center sm:bg-black/92 sm:p-4"
      onClick={onClose}
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
            alt=""
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

export default function GallerySection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    getGallery()
      .then(res => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const open = (index) => setLightboxIndex(index);
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-burgundy-50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item, index) =>
                item.media_type === 'video' ? (
                  <button
                    key={item.id}
                    onClick={() => open(index)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-burgundy-50 group cursor-pointer w-full"
                  >
                    <video
                      src={`${item.file_url}#t=0.5`}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-burgundy-700 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ) : (
                  <button
                    key={item.id}
                    onClick={() => open(index)}
                    className="aspect-square rounded-xl overflow-hidden bg-burgundy-50 group cursor-pointer w-full"
                  >
                    <img
                      src={item.file_url}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {lightboxIndex !== null && (
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
