// Responsive sources for product photos. The API returns the 300px "thumb"
// variant for list views; R2 also stores 800px "medium" and up-to-1600px
// "large" files under the same name, so larger boxes can request ~2x their
// display width and stay sharp on retina screens. Legacy (non-R2) URLs have
// a single size and are returned as-is.
const R2_THUMB = /-thumb\.webp$/;

export function productImageSources(thumbUrl) {
  if (!thumbUrl || !R2_THUMB.test(thumbUrl)) return { src: thumbUrl };
  const medium = thumbUrl.replace(R2_THUMB, '-medium.webp');
  return { src: medium, srcSet: `${thumbUrl} 300w, ${medium} 800w` };
}
