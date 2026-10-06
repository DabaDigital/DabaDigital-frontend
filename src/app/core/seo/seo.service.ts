import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { type ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { ContentStore } from '../content.store';
import { I18nService } from '../i18n/i18n.service';
import { LOCALE_HOME_PATH, LOCALE_LIST, type Locale } from '../i18n/locale';
import { SITE, absoluteUrl } from './site';
import { buildStructuredData, serializeStructuredData, type JsonLd } from './structured-data';

/**
 * Route data that keeps a page out of search results while letting crawlers follow its
 * links: `data: NOINDEX` in `app.routes.ts`. For pages that are not ready to be found —
 * scaffolds, duplicates of a landing-page section, the admin — not for pages that should
 * be invisible to people.
 */
export const NOINDEX = { noindex: true } as const;

/** Open Graph wants language_TERRITORY. English has no territory of its own here. */
const OG_LOCALE: Readonly<Record<Locale, string>> = { ar: 'ar_MA', fr: 'fr_MA', en: 'en_US' };

const STRUCTURED_DATA_ID = 'structured-data';

/** What the current route is, as far as search engines are concerned. */
type Page =
  | { readonly landing: true }
  | { readonly landing: false; readonly path: string; readonly noindex: boolean };

/**
 * Everything in `<head>` that search engines, AI assistants and link previews read:
 * the title and description, `robots`, the canonical URL, the `hreflang` alternates, the
 * Open Graph and X cards, and the JSON-LD graph (`structured-data.ts`).
 *
 * One effect owns all of it, so nothing else in the app writes these tags. It reruns on
 * every navigation, on a language change and when the live content arrives — the
 * structured data lists the published services and projects, so it must follow them.
 *
 * It runs on the server too: `ng build` prerenders the landing pages with all of this
 * already in place, which is what a crawler that never executes JavaScript receives.
 * In the browser it then finds those same elements and updates them rather than
 * adding a second set.
 *
 * Route titles of the other pages stay with the router's title strategy (`title` in
 * `app.routes.ts`); this only mirrors them into the cards.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly i18n = inject(I18nService);
  private readonly content = inject(ContentStore);

  /** `null` until the first navigation has settled — before that there is no page to describe. */
  private readonly page = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => pageOf(this.router.routerState.snapshot.root, this.router.url)),
    ),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const page = this.page();
      if (!page) {
        return;
      }
      if (page.landing) {
        this.describeLanding(this.i18n.locale());
      } else {
        this.describePage(page.path, page.noindex);
      }
    });
  }

  private describeLanding(locale: Locale): void {
    const t = this.i18n.t;
    const path = LOCALE_HOME_PATH[locale];
    const url = absoluteUrl(path);
    const title = t('meta.title');
    const description = t('meta.description');
    const image = absoluteUrl(SITE.ogImage.path);

    this.title.setTitle(title);
    this.setName('description', description);
    this.setName('robots', 'index, follow, max-image-preview:large');
    this.setProperty('og:type', 'website');
    this.setProperty('og:site_name', SITE.name);
    this.setProperty('og:title', title);
    this.setProperty('og:description', description);
    this.setProperty('og:url', url);
    this.setProperty('og:image', image);
    this.setProperty('og:image:width', String(SITE.ogImage.width));
    this.setProperty('og:image:height', String(SITE.ogImage.height));
    this.setProperty('og:image:alt', t('meta.ogImageAlt'));
    this.setProperty('og:locale', OG_LOCALE[locale]);
    this.setAlternateOgLocales(LOCALE_LIST.filter((code) => code !== locale));
    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', title);
    this.setName('twitter:description', description);
    this.setName('twitter:image', image);

    this.setLinks('canonical', [{ href: url }]);
    this.setLinks('alternate', [
      ...LOCALE_LIST.map((code) => ({ hreflang: code, href: absoluteUrl(LOCALE_HOME_PATH[code]) })),
      // Visitors whose language is none of the three: the root, which `vercel.json`
      // redirects by `Accept-Language` and which otherwise shows the primary locale.
      { hreflang: 'x-default', href: absoluteUrl('/') },
    ]);

    this.setStructuredData(this.structuredData(locale, path, title, description));
  }

  /** Any page other than a landing page: its own canonical URL, and `noindex` if it asks. */
  private describePage(path: string, noindex: boolean): void {
    const url = absoluteUrl(path);
    const title = this.title.getTitle();
    this.setName('description', this.i18n.t('meta.description'));
    this.setName('robots', noindex ? 'noindex, follow' : 'index, follow');
    this.setProperty('og:title', title);
    this.setProperty('og:url', url);
    this.setName('twitter:title', title);
    this.setLinks('canonical', [{ href: url }]);
    // Only the landing pages exist in three languages.
    this.setLinks('alternate', []);
    this.setAlternateOgLocales([]);
    this.setStructuredData(null);
  }

  private structuredData(locale: Locale, path: string, title: string, description: string): JsonLd {
    const t = this.i18n.t;
    const text = this.content.text;
    const team = this.content.team();
    const contact = this.content.contact();
    return buildStructuredData({
      locale,
      path,
      title,
      description,
      slogan: [t('banner.title1'), t('banner.title2'), t('banner.title3')].join(' '),
      servicesName: t('nav.services'),
      workName: t('nav.projects'),
      services: this.content.services().map((service) => ({
        name: text(service.title),
        description: text(service.description),
      })),
      projects: this.content.projects().map((project) => ({
        name: project.name,
        description: text(project.summary),
        url: isWebUrl(project.website_url) ? project.website_url : '',
        year: project.year,
      })),
      founders: SITE.founders.map((founder) => {
        const member = team.find((candidate) => candidate.name.trim() === founder.name);
        return {
          name: founder.name,
          url: founder.url,
          jobTitle: member ? text(member.role) : '',
          image: member?.photo_url ? toAbsolute(member.photo_url) : '',
        };
      }),
      email: channelValue(contact, 'mailto:'),
      telephone: channelValue(contact, 'tel:'),
      sameAs: this.content
        .social()
        .map((link) => link.url)
        .filter(isWebUrl),
    });
  }

  private setName(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  private setProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content });
  }

  private setAlternateOgLocales(locales: readonly Locale[]): void {
    for (const tag of this.meta.getTags('property="og:locale:alternate"')) {
      this.meta.removeTagElement(tag);
    }
    this.meta.addTags(
      locales.map((code) => ({ property: 'og:locale:alternate', content: OG_LOCALE[code] })),
      true,
    );
  }

  /**
   * Replaces every `<link rel="…">` of that kind (for `alternate`, only the language ones —
   * an RSS `alternate` would be left alone) with the given set.
   */
  private setLinks(
    rel: 'canonical' | 'alternate',
    links: readonly { readonly href: string; readonly hreflang?: string }[],
  ): void {
    const head = this.document.head;
    const selector = rel === 'alternate' ? 'link[rel="alternate"][hreflang]' : `link[rel="${rel}"]`;
    for (const existing of Array.from(head.querySelectorAll(selector))) {
      existing.parentNode?.removeChild(existing);
    }
    for (const { href, hreflang } of links) {
      const link = this.document.createElement('link');
      link.setAttribute('rel', rel);
      if (hreflang) {
        link.setAttribute('hreflang', hreflang);
      }
      link.setAttribute('href', href);
      head.appendChild(link);
    }
  }

  private setStructuredData(data: JsonLd | null): void {
    let script = this.document.getElementById(STRUCTURED_DATA_ID);
    if (!data) {
      script?.parentNode?.removeChild(script);
      return;
    }
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('id', STRUCTURED_DATA_ID);
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    script.textContent = serializeStructuredData(data);
  }
}

/** The deepest route decides: the landing page says so with its `locale` data. */
function pageOf(root: ActivatedRouteSnapshot, url: string): Page {
  let route = root;
  while (route.firstChild) {
    route = route.firstChild;
  }
  if (route.data['locale'] !== undefined) {
    return { landing: true };
  }
  return {
    landing: false,
    path: url.split(/[?#]/)[0] || '/',
    noindex: route.data['noindex'] === true,
  };
}

/** The address behind the first published channel of that kind, '' when there is none. */
function channelValue(channels: readonly { href: string }[], scheme: 'mailto:' | 'tel:'): string {
  const channel = channels.find((candidate) => candidate.href.startsWith(scheme));
  return channel ? decodeURIComponent(channel.href.slice(scheme.length)).trim() : '';
}

/**
 * An `https` URL with a real host. Admin input has produced `https://mailto:contact@…`
 * before — which parses as user `mailto`, password `contact`, host `dabadigital.ma` — and
 * a link like that must not reach `sameAs`, where it would claim a profile that does not
 * exist.
 */
function isWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' && url.hostname.includes('.') && !url.username && !url.password
    );
  } catch {
    return false;
  }
}

/** Seed portraits are site paths; uploaded ones are already absolute. */
function toAbsolute(src: string): string {
  return src.startsWith('/') ? absoluteUrl(src) : src;
}
