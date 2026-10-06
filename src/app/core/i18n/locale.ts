/**
 * The locales the site ships in, and the metadata the language menu renders.
 *
 * Arabic is first because it is the primary locale, not because the list is
 * alphabetical — `DEFAULT_LOCALE` and the order of `LOCALE_LIST` both say so.
 *
 * ── Why this exists next to `@angular/localize` ──────────────────────────────
 * `$localize` resolves at build time: one bundle per locale, and switching means
 * a full page load of another bundle. The landing page needs a selector that
 * switches in place, which build-time i18n cannot do. So the landing page reads
 * this runtime catalogue instead, and the rule that matters — no user-facing
 * string inside a component — is kept by putting every string in `./messages/`.
 * The `$localize` calls elsewhere in the app still work unchanged.
 *
 * The landing page still has one URL per language (`LOCALE_HOME_PATH`), because
 * search engines index URLs, not languages: switching is a router navigation
 * between them, in place, with no reload.
 */
export const LOCALE_LIST = ['ar', 'fr', 'en'] as const;

export type Locale = (typeof LOCALE_LIST)[number];

export const DEFAULT_LOCALE: Locale = 'ar';

export interface LocaleMeta {
  readonly code: Locale;
  /** Written in the language itself — a menu that says "Arabic" in French helps nobody. */
  readonly nativeName: string;
  /** Two letters for the collapsed header button, where the full name will not fit. */
  readonly short: string;
  readonly dir: 'ltr' | 'rtl';
  /** BCP 47 tag for `lang`, `Intl` and the `hreflang` alternates. */
  readonly tag: string;
}

export const LOCALES: Readonly<Record<Locale, LocaleMeta>> = {
  ar: { code: 'ar', nativeName: 'العربية', short: 'AR', dir: 'rtl', tag: 'ar-MA' },
  fr: { code: 'fr', nativeName: 'Français', short: 'FR', dir: 'ltr', tag: 'fr-MA' },
  en: { code: 'en', nativeName: 'English', short: 'EN', dir: 'ltr', tag: 'en' },
};

/**
 * Where each locale's landing page lives — one URL per language, so a search engine can
 * index all three and an AI crawler that never runs JavaScript still reads the right one.
 * Arabic, the primary locale, owns the root.
 *
 * Shared with the inline bootstrap in `index.html`, the redirects in `vercel.json`, the
 * prerendered routes in `app.routes.server.ts` and `public/sitemap.xml` — change them together.
 */
export const LOCALE_HOME_PATH: Readonly<Record<Locale, string>> = {
  ar: '/',
  fr: '/fr',
  en: '/en',
};

/** The locale a landing-page path is written in, or `null` for any other page. */
export function localeOfPath(pathname: string): Locale | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  return LOCALE_LIST.find((code) => LOCALE_HOME_PATH[code] === path) ?? null;
}

/**
 * Shared with the inline bootstrap in `index.html` — change both together. The same name is
 * the cookie `vercel.json` reads to send a returning visitor from `/` to the language they
 * chose; storage alone never reaches the server.
 */
export const LOCALE_STORAGE_KEY = 'dabadigital.locale';

/** Narrows an untrusted value (storage, `navigator.language`) to a supported locale. */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALE_LIST as readonly string[]).includes(value);
}
