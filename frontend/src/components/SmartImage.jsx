import { useEffect, useRef, useState } from 'react';

// <img> with a shimmer placeholder behind it and a soft fade-in once decoded.
// Lazy by default; pass eager for above-the-fold images. The wrapper takes
// the sizing classes; width/height reserve space to avoid layout shift. If
// the image fails, the shimmer stops and the image still keeps its alt text.
export default function SmartImage({
  src,
  alt = '',
  width,
  height,
  eager = false,
  className = '',
  imgClassName = '',
  ...rest
}) {
  const imgRef = useRef(null);
  const [state, setState] = useState('loading');

  // An image served from cache can finish before React attaches onLoad
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setState(img.naturalWidth > 0 ? 'loaded' : 'error');
  }, [src]);

  return (
    <div className={`skeleton ${state !== 'loading' ? 'is-loaded' : ''} ${className}`}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchpriority={eager ? 'high' : undefined}
        onLoad={() => setState('loaded')}
        onError={() => setState('error')}
        className={`fade-img ${state === 'loaded' ? 'is-loaded' : ''} ${imgClassName}`}
        {...rest}
      />
    </div>
  );
}
