import { describe, expect, it } from 'vitest';

import {
  buildStructuredData,
  serializeStructuredData,
  type StructuredDataInput,
} from './structured-data';

type Node = Record<string, unknown>;

function input(overrides: Partial<StructuredDataInput> = {}): StructuredDataInput {
  return {
    locale: 'fr',
    path: '/fr',
    title: 'Daba Digital — Agence web',
    description: 'Agence digitale à Casablanca.',
    slogan: 'Concevoir. Lancer. Grandir.',
    servicesName: 'Services',
    workName: 'Réalisations',
    services: [{ name: 'E-commerce', description: 'Boutiques en ligne.' }],
    projects: [
      {
        name: 'Caffeine',
        description: 'Le café',
        url: 'https://caffeine.example.ma/',
        year: '2026',
      },
    ],
    founders: [
      { name: 'Keltoum Malouki', url: 'https://keltoummalouki.com', jobTitle: '', image: '' },
    ],
    email: 'contact@dabadigital.ma',
    telephone: '',
    sameAs: ['https://www.instagram.com/dabadigital_/'],
    ...overrides,
  };
}

function graph(data: Node): Node[] {
  return data['@graph'] as Node[];
}

function node(data: Node, type: string): Node {
  const found = graph(data).find((candidate) => candidate['@type'] === type);
  if (!found) {
    throw new Error(`no ${type} node`);
  }
  return found;
}

describe('buildStructuredData', () => {
  it('describes one studio, its website and this page as one linked graph', () => {
    const data = buildStructuredData(input());
    const studio = node(data, 'ProfessionalService');
    const website = node(data, 'WebSite');
    const page = node(data, 'WebPage');

    expect(data['@context']).toBe('https://schema.org');
    expect(studio['@id']).toBe('https://www.dabadigital.ma/#organization');
    expect(studio['name']).toBe('Daba Digital');
    // The one-word form is what people type into a search box.
    expect(studio['alternateName']).toContain('DabaDigital');
    expect(website['publisher']).toEqual({ '@id': studio['@id'] });
    expect(page['url']).toBe('https://www.dabadigital.ma/fr');
    expect(page['inLanguage']).toBe('fr');
    expect(page['isPartOf']).toEqual({ '@id': website['@id'] });
    expect(page['about']).toEqual({ '@id': studio['@id'] });
  });

  it('lists the services it sells, each provided by the studio', () => {
    const studio = node(buildStructuredData(input()), 'ProfessionalService');
    const catalog = studio['hasOfferCatalog'] as { itemListElement: { itemOffered: Node }[] };

    expect(studio['knowsAbout']).toEqual(['E-commerce']);
    expect(catalog.itemListElement.map((offer) => offer.itemOffered['name'])).toEqual([
      'E-commerce',
    ]);
    expect(catalog.itemListElement[0].itemOffered['provider']).toEqual({
      '@id': 'https://www.dabadigital.ma/#organization',
    });
  });

  it('credits each project to the studio, linking it only when it has a site', () => {
    const data = buildStructuredData(
      input({
        projects: [
          { name: 'Caffeine', description: '', url: 'https://caffeine.example.ma/', year: '2026' },
          { name: 'Sans site', description: '', url: '', year: '' },
          { name: '  ', description: 'no name, so not listed', url: '', year: '' },
        ],
      }),
    );
    const items = (node(data, 'ItemList')['itemListElement'] as { item: Node }[]).map(
      (entry) => entry.item,
    );

    expect(items.map((item) => item['name'])).toEqual(['Caffeine', 'Sans site']);
    expect(items[0]['url']).toBe('https://caffeine.example.ma/');
    expect(items[1]).not.toHaveProperty('url');
    expect(items[0]['creator']).toEqual({ '@id': 'https://www.dabadigital.ma/#organization' });
  });

  it('leaves the portfolio out entirely when there is none', () => {
    const data = buildStructuredData(input({ projects: [] }));

    expect(graph(data).map((entry) => entry['@type'])).toEqual([
      'ProfessionalService',
      'WebSite',
      'WebPage',
    ]);
  });

  /** A claim the page cannot back up is worse than no claim. */
  it('states a phone number or an email only when the site publishes one', () => {
    const withEmail = node(buildStructuredData(input()), 'ProfessionalService');
    expect(withEmail['email']).toBe('contact@dabadigital.ma');
    expect(withEmail).not.toHaveProperty('telephone');
    expect(withEmail['contactPoint']).toMatchObject({ email: 'contact@dabadigital.ma' });

    const bare = node(buildStructuredData(input({ email: '' })), 'ProfessionalService');
    expect(bare).not.toHaveProperty('email');
    expect(bare).not.toHaveProperty('contactPoint');
  });

  it('flattens the line breaks admin text arrives with', () => {
    const data = buildStructuredData(
      input({
        projects: [
          { name: 'Lma3louma', description: 'Mexicain\n\n🇲🇽  Nouveau', url: '', year: '' },
        ],
      }),
    );
    const item = (node(data, 'ItemList')['itemListElement'] as { item: Node }[])[0].item;

    expect(item['description']).toBe('Mexicain 🇲🇽 Nouveau');
  });
});

describe('serializeStructuredData', () => {
  it('cannot be closed early by text that contains a closing script tag', () => {
    const json = serializeStructuredData({ name: '</script><script>alert(1)</script>' });

    expect(json).not.toContain('</script>');
    expect(JSON.parse(json)).toEqual({ name: '</script><script>alert(1)</script>' });
  });
});
