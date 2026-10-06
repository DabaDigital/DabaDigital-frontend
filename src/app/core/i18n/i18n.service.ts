import { DOCUMENT, PlatformLocation, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';

import { AR, type Catalog, type MessageKey } from './messages/ar';
import { EN } from './messages/en';
import { FR } from './messages/fr';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_HOME_PATH,
  LOCALE_LIST,
  LOCALE_STORAGE_KEY,
  isLocale,
  localeOfPath,
  type Locale,
  type LocaleMeta,
} from './locale';

/** A year: long enough to outlast a return visit, short enough to be forgotten eventually. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const CATALOGS: Readonly<Record<Locale, Catalog>> = { ar: AR, fr: FR, en: EN };

/** Matches `{name}` / `{count}` placeholders in a message. */
const PLACEHOLDER = /\{(\w+)\}/g;

export type MessageParams = Readonly<Record<string, string | number>>;

/**
 * Runtime translation for the landing page.
 *
 * One signal holds the locale; everything else — the catalogue, the text
 * direction, the `lang` attribute — is derived from it, so a language change is
 * a single `set()` and the whole page follows. No reload, which is the entire
 * reason this exists alongside `@angular/localize` (see `./locale.ts`).
 *
 * `t` is a bound arrow property rather than a method so a component can expose
 * it straight to its template (`protected readonly t = this.i18n.t`). Reading it
 * inside a template registers the catalogue signal as a dependency, so OnPush
 * components re-render on a language change without any extra wiring.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly location = inject(PlatformLocation);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _locale = signal<Locale>(this.resolveInitialLocale());

  readonly locale = this._locale.asReadonly();

  readonly meta = computed<LocaleMeta>(() => LOCALES[this._locale()]);

  /** `'rtl'` for Arabic. Layout code must read this rather than assume LTR. */
  readonly dir = computed(() => this.meta().dir);

  readonly available: readonly LocaleMeta[] = LOCALE_LIST.map((code) => LOCALES[code]);

  /** The landing page in the current language — where every "home" link points. */
  readonly homePath = computed(() => LOCALE_HOME_PATH[this._locale()]);

  private readonly catalog = computed<Catalog>(() => CATALOGS[this._locale()]);

  constructor() {
    // The document is the one place outside Angular's control that has to follow
    // the signal, so it is a genuine side effect rather than derived state.
    effect(() => {
      const meta = this.meta();
      const root = this.document.documentElement;
      root.setAttribute('lang', meta.code);
      root.setAttribute('dir', meta.dir);
    });
  }

  /**
   * Translate a key, substituting `{placeholders}`.
   *
   * A missing key cannot happen — `MessageKey` is derived from the Arabic
   * catalogue and the other two are typed against it — so there is no fallback
   * path to maintain here.
   */
  readonly t = (key: MessageKey, params?: MessageParams): string => {
    const message = this.catalog()[key];
    if (!params) {
      return message;
    }
    return message.replace(PLACEHOLDER, (match, name: string) =>
      name in params ? String(params[name]) : match,
    );
  };

  /**
   * `persist` is for the visitor's own choice (the language menu): it is remembered, and the
   * next visit to `/` is sent to it (`vercel.json`). A landing page following its URL passes
   * `false` — arriving on `/fr` from a search result is not a choice.
   */
  setLocale(locale: Locale, { persist = true }: { persist?: boolean } = {}): void {
    if (persist) {
      // Even when it is already the current language: picking Arabic on `/` must still be
      // remembered, or a French browser would be sent to `/fr` next time.
      this.persist(locale);
    }
    if (locale !== this._locale()) {
      this._locale.set(locale);
    }
  }

  /**
   * A landing page's URL decides its language: `/`, `/fr`, `/en` (`LOCALE_HOME_PATH`). That
   * holds on the server, which prerenders each of them, and in the browser, which has to
   * hydrate exactly the text the server wrote.
   *
   * Any other page: storage → browser language → Arabic. Kept in step with the inline
   * bootstrap in `index.html`, which runs the same resolution before Angular loads so the
   * first paint is already in the right language and direction.
   */
  private resolveInitialLocale(): Locale {
    const fromPath = localeOfPath(this.location.pathname);
    if (fromPath) {
      return fromPath;
    }
    if (!this.browser) {
      return DEFAULT_LOCALE;
    }

    const stored = this.read(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) {
      return stored;
    }

    // `navigator.language` is a BCP 47 tag ('fr-MA'), so compare the base subtag.
    const preferred = this.document.defaultView?.navigator.language?.split('-')[0];
    return isLocale(preferred) ? preferred : DEFAULT_LOCALE;
  }

  /**
   * Storage throws outright in some privacy modes rather than returning null, so
   * both directions are guarded. A visitor who blocks storage simply gets the
   * default locale on every visit — never a crash.
   */
  private read(key: string): string | null {
    try {
      return this.document.defaultView?.localStorage.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  private persist(locale: Locale): void {
    const view = this.document.defaultView;
    try {
      view?.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Nothing to do — the choice holds for this page view.
    }
    // Storage never reaches the server. The cookie does: `vercel.json` reads it to send a
    // returning visitor from `/` straight to the language they chose, with no flash of Arabic.
    try {
      const secure = view?.location.protocol === 'https:' ? '; secure' : '';
      this.document.cookie = `${LOCALE_STORAGE_KEY}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${secure}`;
    } catch {
      // Cookies blocked: the stored choice still applies on this device (see `index.html`).
    }
  }
}
