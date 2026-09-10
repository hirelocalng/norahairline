import { useState, useEffect, useCallback, useRef } from 'react';
import { getGallery } from '../api';

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
  const dragState = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });

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

  const handleDragStart = (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    const container = event.currentTarget;
    dragState.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
      moved: false,
    };
    container.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event) => {
    if (!dragState.current.active) return;

    const container = event.currentTarget;
    const distance = event.clientX - dragState.current.startX;
    if (Math.abs(distance) > 5) dragState.current.moved = true;
    container.scrollLeft = dragState.current.startScrollLeft - distance;
  };

  const handleDragEnd = (event) => {
    if (!dragState.current.active) return;

    dragState.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleItemClick = (index, event) => {
    if (dragState.current.moved) {
      event.preventDefault();
      dragState.current.moved = false;
      return;
    }
    open(index);
  };

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
            <div className="gallery-carousel">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="gallery-carousel-item aspect-square rounded-xl bg-burgundy-50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div
              className="gallery-carousel"
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={handleDragEnd}
            >
              {items.map((item, index) =>
                item.media_type === 'video' ? (
                  <button
                    key={item.id}
                    onClick={(event) => handleItemClick(index, event)}
                    className="gallery-carousel-item relative aspect-square rounded-xl overflow-hidden bg-burgundy-50 group cursor-pointer"
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
                    onClick={(event) => handleItemClick(index, event)}
                    className="gallery-carousel-item aspect-square rounded-xl overflow-hidden bg-burgundy-50 group cursor-pointer"
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
