import { useEffect, useRef, useState } from 'react';

// One observer shared by every <Reveal>, so a long product grid doesn't
// create dozens of IntersectionObservers.
let sharedObserver = null;
const callbacks = new WeakMap();

function getObserver() {
  if (sharedObserver || typeof IntersectionObserver === 'undefined') return sharedObserver;
  sharedObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      callbacks.get(entry.target)?.();
      sharedObserver.unobserve(entry.target);
      callbacks.delete(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  return sharedObserver;
}

// Fades/slides its children in the first time they scroll into view.
// `delay` (ms) staggers siblings, e.g. delay={(i % 4) * 80} in a grid.
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const observer = getObserver();
    if (!el || !observer) { setVisible(true); return; }
    callbacks.set(el, () => setVisible(true));
    observer.observe(el);
    return () => {
      observer.unobserve(el);
      callbacks.delete(el);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { ...style, '--reveal-delay': `${delay}ms` } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
