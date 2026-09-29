// Framework-free engine for the "Nora Hair Queens" carousel. The React
// component renders the markup (including the loop clones); this module only
// drives scrolling, auto-advance, dots, arrows and inline video playback.
//
// Expected markup inside `root`:
//   [data-qc-track]            horizontal scroll-snap container
//     [data-qc-card]           one per card; clones carry data-qc-clone
//       [data-qc-index]        real item index (clones repeat their source's)
//       video + [data-qc-play] for video cards
//   [data-qc-dot]              one per real item, data-qc-index set
//   [data-qc-prev], [data-qc-next]
//
// The track is laid out as [last K clones][n real cards][first K clones].
// Once a scroll settles on a clone we jump instantly to the matching real
// card; because the two are identical the jump is invisible.

const AUTO_DELAY = 3500;
const RESUME_DELAY = 4000;

export function initQueensCarousel(root, { count, clones, startIndex = 0, onOpen }) {
  const track = root.querySelector('[data-qc-track]');
  const cards = Array.from(track.querySelectorAll('[data-qc-card]'));
  const dots = Array.from(root.querySelectorAll('[data-qc-dot]'));
  const loops = count > 1;

  const holds = new Set();
  let timer = null;
  let settleTimer = null;
  let rafId = null;
  let lastScrollAt = 0;
  let current = clones + startIndex;
  let activeReal = startIndex;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hasScrollEnd = 'onscrollend' in window;

  const step = () => (cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth);
  const nearestIndex = () => Math.round((track.scrollLeft - cards[0].offsetLeft) / step());
  const realIndex = (i) => (((i - clones) % count) + count) % count;

  function scrollToCard(i, smooth) {
    current = i;
    track.scrollTo({
      left: cards[0].offsetLeft + i * step(),
      behavior: smooth && !reducedMotion.matches ? 'smooth' : 'auto',
    });
  }

  function renderDots() {
    const active = realIndex(nearestIndex());
    if (!Number.isFinite(active)) return;
    activeReal = active;
    dots.forEach((dot, i) => {
      const on = i === active;
      dot.classList.toggle('is-active', on);
      dot.setAttribute('aria-current', on ? 'true' : 'false');
    });
  }

  // Wrap from a clone back onto its real card once scrolling has stopped.
  // Skipped mid-touch so we never fight an in-progress iOS momentum scroll.
  function settle() {
    if (!loops || holds.has('touch')) return;
    let i = nearestIndex();
    if (i < clones) i += count;
    else if (i >= clones + count) i -= count;
    if (i !== nearestIndex()) scrollToCard(i, false);
    current = i;
    renderDots();
  }

  function onScroll() {
    lastScrollAt = performance.now();
    if (rafId === null) {
      rafId = requestAnimationFrame(() => { rafId = null; renderDots(); });
    }
    if (!hasScrollEnd) {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 150);
    }
  }

  // --- auto-advance ------------------------------------------------------

  function schedule(delay = AUTO_DELAY) {
    clearTimeout(timer);
    timer = null;
    if (!loops || holds.size > 0) return;
    timer = setTimeout(() => {
      scrollToCard(nearestIndex() + 1, true);
      schedule();
    }, delay);
  }

  function hold(reason) {
    holds.add(reason);
    clearTimeout(timer);
    timer = null;
  }

  function release(reason, delay = AUTO_DELAY) {
    if (!holds.delete(reason)) return;
    schedule(delay);
  }

  // --- videos --------------------------------------------------------------

  const videos = Array.from(track.querySelectorAll('video'));
  const playing = new Set();

  function playVideo(video) {
    videos.forEach((v) => { if (v !== video) v.pause(); });
    video.controls = true;
    video.play().catch(() => {});
  }

  function onVideoPlay(e) {
    playing.add(e.target);
    e.target.closest('[data-qc-card]').classList.add('is-playing');
    hold('video');
  }

  function onVideoStop(e) {
    playing.delete(e.target);
    e.target.closest('[data-qc-card]').classList.remove('is-playing');
    if (playing.size === 0) release('video', RESUME_DELAY);
  }

  videos.forEach((v) => {
    v.addEventListener('play', onVideoPlay);
    v.addEventListener('pause', onVideoStop);
    v.addEventListener('ended', onVideoStop);
  });

  // Pause any video that scrolls (mostly) out of the track's viewport.
  const videoObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && !entry.target.paused) entry.target.pause();
        });
      }, { root: track, threshold: 0.4 })
    : null;
  videos.forEach((v) => videoObserver?.observe(v));

  // A re-init (after a failed item is dropped) can happen mid-playback.
  videos.forEach((v) => {
    if (!v.paused) {
      playing.add(v);
      holds.add('video');
    }
  });

  // --- event handlers -------------------------------------------------------

  function onClick(e) {
    const play = e.target.closest('[data-qc-play]');
    if (play) {
      playVideo(play.closest('[data-qc-card]').querySelector('video'));
      return;
    }
    const open = e.target.closest('[data-qc-open]');
    if (open) {
      onOpen?.(Number(open.closest('[data-qc-card]').dataset.qcIndex));
      return;
    }
    const dot = e.target.closest('[data-qc-dot]');
    if (dot) {
      scrollToCard(clones + Number(dot.dataset.qcIndex), true);
      hold('interact');
      release('interact', RESUME_DELAY);
      return;
    }
    const arrow = e.target.closest('[data-qc-prev], [data-qc-next]');
    if (arrow) {
      const dir = arrow.hasAttribute('data-qc-next') ? 1 : -1;
      scrollToCard(nearestIndex() + dir, true);
      hold('interact');
      release('interact', RESUME_DELAY);
    }
  }

  const onPointerEnter = (e) => { if (e.pointerType === 'mouse') hold('hover'); };
  const onPointerLeave = (e) => { if (e.pointerType === 'mouse') release('hover', RESUME_DELAY); };
  const onTouchStart = () => hold('touch');
  const onTouchEnd = () => {
    release('touch', RESUME_DELAY);
    // With no scrollend event, the debounced settle handles it; otherwise the
    // scrollend that fired mid-touch was skipped, so settle once momentum ends.
    // If momentum is still going, the upcoming scrollend will settle instead.
    if (hasScrollEnd) {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        if (performance.now() - lastScrollAt > 150) settle();
      }, 200);
    }
  };
  // Only keyboard focus pauses — a tapped dot or arrow keeps focus afterwards
  // and would otherwise hold the carousel indefinitely.
  const onFocusIn = (e) => {
    try { if (e.target.matches(':focus-visible')) hold('focus'); } catch { /* old Safari */ }
  };
  const onFocusOut = (e) => { if (!root.contains(e.relatedTarget)) release('focus', RESUME_DELAY); };
  const onVisibility = () => (document.hidden ? hold('hidden') : release('hidden'));
  const onMotionChange = () => (reducedMotion.matches ? hold('reduced-motion') : release('reduced-motion'));
  const onResize = () => scrollToCard(current, false);

  const sectionObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) release('offscreen');
        else hold('offscreen');
      }, { threshold: 0.25 })
    : null;

  root.addEventListener('click', onClick);
  root.addEventListener('pointerenter', onPointerEnter);
  root.addEventListener('pointerleave', onPointerLeave);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  track.addEventListener('touchstart', onTouchStart, { passive: true });
  track.addEventListener('touchend', onTouchEnd, { passive: true });
  track.addEventListener('touchcancel', onTouchEnd, { passive: true });
  track.addEventListener('scroll', onScroll, { passive: true });
  if (hasScrollEnd) track.addEventListener('scrollend', settle);
  document.addEventListener('visibilitychange', onVisibility);
  reducedMotion.addEventListener?.('change', onMotionChange);
  window.addEventListener('resize', onResize);

  // --- start ----------------------------------------------------------------

  scrollToCard(current, false);
  renderDots();
  if (reducedMotion.matches) holds.add('reduced-motion');
  if (document.hidden) holds.add('hidden');
  if (sectionObserver) {
    holds.add('offscreen'); // cleared by the observer's first callback if visible
    sectionObserver.observe(root);
  }
  schedule();

  return function destroy() {
    clearTimeout(timer);
    clearTimeout(settleTimer);
    if (rafId !== null) cancelAnimationFrame(rafId);
    sectionObserver?.disconnect();
    videoObserver?.disconnect();
    videos.forEach((v) => {
      v.removeEventListener('play', onVideoPlay);
      v.removeEventListener('pause', onVideoStop);
      v.removeEventListener('ended', onVideoStop);
    });
    root.removeEventListener('click', onClick);
    root.removeEventListener('pointerenter', onPointerEnter);
    root.removeEventListener('pointerleave', onPointerLeave);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
    track.removeEventListener('touchstart', onTouchStart);
    track.removeEventListener('touchend', onTouchEnd);
    track.removeEventListener('touchcancel', onTouchEnd);
    track.removeEventListener('scroll', onScroll);
    track.removeEventListener('scrollend', settle);
    document.removeEventListener('visibilitychange', onVisibility);
    reducedMotion.removeEventListener?.('change', onMotionChange);
    window.removeEventListener('resize', onResize);
    // Not measured here: on a React re-render some cards are already detached.
    return activeReal;
  };
}
