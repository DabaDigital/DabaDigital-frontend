/**
 * The locales the site ships in, and the metadata the language menu renders.
 *
 * Arabic is first because it is the primary locale, not because the list is
 * alphabetical — `DEFAULT_LOCALE` and the order of `LOCALE_LIST` both say so.
 *
 * ── Why this exists next to `@angular/localize` ──────────────────────────────
 * `$localize` resolves at build time: one bundle per locale, and switching means
 * a full navigation to `/ar/`, `/fr/` or `/en/`. The landing page needs a
 * selector that switches in place, which build-time i18n cannot do. So the
 * landing page reads this runtime catalogue instead, and the rule that matters —
 * no user-facing string inside a component — is kept by putting every string in
 * `./messages/`. The `$localize` calls elsewhere in the app still work unchanged.
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

/** Shared with the inline bootstrap in `index.html` — change both together. */
export const LOCALE_STORAGE_KEY = 'dabadigital.locale';

/** Narrows an untrusted value (storage, `navigator.language`) to a supported locale. */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALE_LIST as readonly string[]).includes(value);
}
