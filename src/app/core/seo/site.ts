/**
 * The facts search engines and AI assistants are told about the studio itself.
 *
 * Data, not copy — a domain, a founder's name and a logo file are the same in every
 * locale — so they live here rather than in `core/i18n/messages/`. What *is* copy (the
 * description, the slogan, the service names) comes from the catalogues and from the
 * live content, so the structured data always says what the page says.
 *
 * Shared with `public/robots.txt`, `public/sitemap.xml` and `public/llms.txt`, which
 * are static files and repeat the origin and the names — change them together.
 */
export const SITE = {
  /** The canonical origin: `https`, `www`, no trailing slash. The apex redirects here. */
  origin: 'https://www.dabadigital.ma',
  name: 'Daba Digital',
  /**
   * The other ways people write the name — the one-word form is the domain, and what most
   * people type into a search box. The Arabic is the catalogue's own spelling.
   */
  alternateNames: ['DabaDigital', 'دبا ديجيتال'],
  /** Square, so it reads in a knowledge panel; at least 112px, as Google asks. */
  logo: { path: '/icon-512.png', width: 512, height: 512 },
  /** The social preview: 1200×630, the size Open Graph and X both crop to without loss. */
  ogImage: { path: '/og-image.jpg', width: 1200, height: 630 },
  address: { locality: 'Casablanca', region: 'Casablanca-Settat', country: 'MA' },
  /** The two founders (see the `dabadigital_team_and_icons` migration, which seeds them). */
  founders: [
    { name: 'Keltoum Malouki', url: 'https://keltoummalouki.com' },
    { name: 'Jawad Boulmal', url: 'https://jawadboulmal.com' },
  ],
} as const;

/** An absolute URL on the canonical origin, for a path that starts with `/`. */
export function absoluteUrl(path: string): string {
  return path === '/' ? `${SITE.origin}/` : `${SITE.origin}${path}`;
}
