/**
 * Images from Supabase Storage, resized on the way out.
 *
 * Covers are stored as uploaded — the first ones are 1672px PNG screenshots of
 * up to 2.4 MB each, and the landing page shows four of them. Supabase's image
 * transformation endpoint (`/storage/v1/render/image/…`) serves the same object
 * at a given width, re-encoded as WebP or AVIF for any browser that accepts
 * them: that 2.4 MB cover is 51 kB at 640px, 132 kB at 1280px. Nothing has to be
 * re-uploaded.
 *
 * Transformation is a paid Supabase feature. A page using these URLs should fall
 * back to the original on an image `error`, so a plan change degrades to slow
 * images rather than missing ones — see `ProjectCardComponent`.
 */

const OBJECT = '/storage/v1/object/public/';
const RENDER = '/storage/v1/render/image/public/';

/** Whether `url` points into Supabase Storage, i.e. whether the helpers below change it. */
export function isStorageImage(url: string): boolean {
  return url.includes(OBJECT);
}

/** The object at `url` resized to `width` pixels; any URL outside Supabase Storage unchanged. */
export function storageImage(url: string, width: number, quality = 70): string {
  if (!isStorageImage(url)) return url;
  const [path, query] = url.replace(OBJECT, RENDER).split('?');
  const params = new URLSearchParams(query);
  params.set('width', String(width));
  params.set('quality', String(quality));
  // Without it Supabase crops to `width` × the original height (`cover`, its
  // default) instead of scaling. `contain` keeps the proportions and never
  // enlarges: past the upload's own width, the upload's size comes back.
  params.set('resize', 'contain');
  return `${path}?${params}`;
}

/** A `srcset` of the object at each width, or `null` (no attribute) outside Supabase Storage. */
export function storageSrcset(url: string, widths: readonly number[]): string | null {
  return isStorageImage(url) ? widths.map((w) => `${storageImage(url, w)} ${w}w`).join(', ') : null;
}
