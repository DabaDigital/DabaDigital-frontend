import { LOCALE_LIST, type Locale } from '../i18n/locale';
import { SITE, absoluteUrl } from './site';

/**
 * The schema.org description of a landing page, as one JSON-LD `@graph`.
 *
 * Pure: everything it says arrives in `StructuredDataInput`, already translated and
 * taken from the live content, so the graph can never claim something the page does
 * not show — Google's one hard rule for structured data — and `SeoService` stays a thin
 * layer that only writes it into `<head>`.
 *
 * Four nodes, linked by `@id` so search engines and AI assistants read them as one
 * entity rather than four unrelated facts:
 *
 * - the studio (`ProfessionalService`): names, logo, place, languages, founders, the
 *   services it sells, the profiles that are also it (`sameAs`);
 * - the website, published by the studio;
 * - this page, in its own language, about the studio;
 * - the portfolio, each project credited to the studio.
 */

export interface StructuredDataInput {
  readonly locale: Locale;
  /** The page's canonical path: `/`, `/fr` or `/en`. */
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly slogan: string;
  /** The heading the services are listed under, in the page's language. */
  readonly servicesName: string;
  /** The heading the projects are listed under, in the page's language. */
  readonly workName: string;
  readonly services: readonly { readonly name: string; readonly description: string }[];
  readonly projects: readonly {
    readonly name: string;
    readonly description: string;
    /** The live site the project is, '' when it has none. */
    readonly url: string;
    readonly year: string;
  }[];
  readonly founders: readonly {
    readonly name: string;
    readonly url: string;
    /** '' when the team section does not list them. */
    readonly jobTitle: string;
    /** An absolute portrait URL, '' for none. */
    readonly image: string;
  }[];
  /** '' when no published contact channel is an email address. */
  readonly email: string;
  /** '' when no published contact channel is a phone number. */
  readonly telephone: string;
  /** Profiles elsewhere that are the studio itself (Instagram, LinkedIn…). */
  readonly sameAs: readonly string[];
}

export type JsonLd = Readonly<Record<string, unknown>>;

const ORGANIZATION_ID = `${SITE.origin}/#organization`;
const WEBSITE_ID = `${SITE.origin}/#website`;
const LOGO_ID = `${SITE.origin}/#logo`;

export function buildStructuredData(input: StructuredDataInput): JsonLd {
  const url = absoluteUrl(input.path);
  const services = input.services
    .map((service) => ({ name: clean(service.name), description: clean(service.description) }))
    .filter((service) => service.name);
  const contactLanguages = [...LOCALE_LIST];

  const organization: JsonLd = {
    '@type': 'ProfessionalService',
    '@id': ORGANIZATION_ID,
    name: SITE.name,
    alternateName: [...SITE.alternateNames],
    url: absoluteUrl('/'),
    logo: {
      '@type': 'ImageObject',
      '@id': LOGO_ID,
      url: absoluteUrl(SITE.logo.path),
      contentUrl: absoluteUrl(SITE.logo.path),
      width: SITE.logo.width,
      height: SITE.logo.height,
      caption: SITE.name,
    },
    image: absoluteUrl(SITE.ogImage.path),
    description: clean(input.description),
    slogan: clean(input.slogan),
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.address.locality,
      addressRegion: SITE.address.region,
      addressCountry: SITE.address.country,
    },
    areaServed: { '@type': 'Country', name: 'Morocco' },
    knowsLanguage: contactLanguages,
    ...(services.length > 0 && { knowsAbout: services.map((service) => service.name) }),
    ...(input.email && { email: input.email }),
    ...(input.telephone && { telephone: input.telephone }),
    ...((input.email || input.telephone) && {
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        ...(input.email && { email: input.email }),
        ...(input.telephone && { telephone: input.telephone }),
        availableLanguage: contactLanguages,
        areaServed: SITE.address.country,
      },
    }),
    founder: input.founders.map((founder) => ({
      '@type': 'Person',
      name: founder.name,
      url: founder.url,
      ...(founder.jobTitle && { jobTitle: clean(founder.jobTitle) }),
      ...(founder.image && { image: founder.image }),
      worksFor: { '@id': ORGANIZATION_ID },
    })),
    ...(input.sameAs.length > 0 && { sameAs: [...new Set(input.sameAs)] }),
    ...(services.length > 0 && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: clean(input.servicesName),
        itemListElement: services.map((service) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service.name,
            ...(service.description && { description: service.description }),
            provider: { '@id': ORGANIZATION_ID },
            areaServed: { '@type': 'Country', name: 'Morocco' },
          },
        })),
      },
    }),
  };

  const website: JsonLd = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: absoluteUrl('/'),
    name: SITE.name,
    alternateName: [...SITE.alternateNames],
    inLanguage: contactLanguages,
    publisher: { '@id': ORGANIZATION_ID },
  };

  const page: JsonLd = {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: clean(input.title),
    description: clean(input.description),
    inLanguage: input.locale,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORGANIZATION_ID },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: absoluteUrl(SITE.ogImage.path),
      width: SITE.ogImage.width,
      height: SITE.ogImage.height,
    },
  };

  const projects = input.projects.filter((project) => clean(project.name));
  const work: JsonLd | null =
    projects.length === 0
      ? null
      : {
          '@type': 'ItemList',
          '@id': `${url}#work`,
          name: clean(input.workName),
          itemListElement: projects.map((project, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'CreativeWork',
              name: clean(project.name),
              ...(clean(project.description) && { description: clean(project.description) }),
              ...(project.url && { url: project.url }),
              ...(project.year && { dateCreated: project.year }),
              creator: { '@id': ORGANIZATION_ID },
            },
          })),
        };

  return {
    '@context': 'https://schema.org',
    '@graph': work ? [organization, website, page, work] : [organization, website, page],
  };
}

/**
 * JSON for a `<script type="application/ld+json">`. Every `<` is escaped, so text typed into
 * the admin — a project summary that happens to contain `</script>` — cannot end the script
 * element early and inject markup into the page.
 */
export function serializeStructuredData(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** Admin text arrives with line breaks and doubled spaces; structured data wants one line. */
function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
