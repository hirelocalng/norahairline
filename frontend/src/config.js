// Single source for contact details used across the storefront.
// WhatsApp number in international format, digits only (used in wa.me links).
export const WHATSAPP_NUMBER = '2348038707795';
export const WHATSAPP_DISPLAY = '08038707795';

export function whatsappLink(text) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

// Real product photos on the R2 CDN, used for the homepage hero and the
// closing banner. `medium` is 800px wide, `large` is 1284px (the originals'
// full width). If one of these products is deleted in admin its images are
// removed from R2 too — swap in another product's URLs here.
const CDN = 'https://cdn.norahairline.com/norahairline/products';
const productPhoto = (uuid, alt) => ({
  medium: `${CDN}/${uuid}-medium.webp`,
  large: `${CDN}/${uuid}-large.webp`,
  alt,
});

export const HERO_IMAGES = [
  productPhoto('3dfdca80-fc13-459c-9163-1c5f3a2fc448', 'Copper body-wave wig with 5x5 closure'),
  productPhoto('ee9c37d3-1f98-478f-b8c0-60b0d529025f', 'Two-toned SDD yaki loose curls wig'),
  productPhoto('d20b2d9c-f400-4c4e-8367-337a7b88cd34', 'Mayqueen piano-colour pixie curls wig'),
  productPhoto('f181bf72-2f74-4444-87df-6519cc985474', 'Layered raw donor unit with HD closure'),
];

export const CLOSING_BANNER_IMAGE = productPhoto('788e3cf8-2a5f-4924-bbed-befb8c920131', 'Long natural-colour pixie curls wig');
export const FOOTER_TEXTURE_IMAGE = productPhoto('1ffd2cef-f441-4157-8643-8a219390e28a', '');
