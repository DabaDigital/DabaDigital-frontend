import { DOCUMENT } from '@angular/common';
import {
  Injectable,
  TransferState,
  afterNextRender,
  computed,
  inject,
  makeStateKey,
  signal,
} from '@angular/core';
import { PROJECTS, PROJECT_FILTERS, SERVICES, TEAM } from '../features/home/home.content';
import { ContentApi } from './api/content.api';
import { SupabaseService } from './api/supabase.service';
import { COMPANY } from './company';
import { I18nService } from './i18n/i18n.service';
import { AR, type MessageKey } from './i18n/messages/ar';
import { EN } from './i18n/messages/en';
import { FR } from './i18n/messages/fr';
import type { LocalizedText, SiteContent } from './models/content.model';

const localized = (key: MessageKey): LocalizedText => ({ en: EN[key], fr: FR[key], ar: AR[key] });

export function seedContent(): SiteContent {
  return {
    projects: PROJECTS.map((p, position) => ({
      id: p.slug,
      name: p.name,
      slug: p.slug,
      summary: localized(p.summaryKey),
      description: localized(p.summaryKey),
      categories: [...p.categories],
      year: p.year,
      tone: p.tone,
      image_url: '',
      website_url: '',
      status: 'published',
      position,
    })),
    categories: PROJECT_FILTERS.filter((c) => c.id !== 'all').map((c, position) => ({
      id: c.id,
      slug: c.id,
      name: localized(c.labelKey),
      position,
    })),
    services: SERVICES.map((s, position) => ({
      id: s.id,
      title: localized(s.titleKey),
      description: localized(s.textKey),
      icon: s.icon,
      icon_url: '',
      status: 'published',
      position,
    })),
    social: [
      {
        id: 'linkedin',
        name: 'LinkedIn',
        url: COMPANY.linkedin,
        icon: 'linkedin',
        icon_url: '',
        status: 'published',
        position: 0,
      },
      {
        id: 'instagram',
        name: 'Instagram',
        url: COMPANY.instagram,
        icon: 'instagram',
        icon_url: '',
        status: 'published',
        position: 1,
      },
    ],
    contact: [
      {
        id: 'email',
        label: localized('contact.emailLabel'),
        value: { en: COMPANY.email, fr: COMPANY.email, ar: COMPANY.email },
        href: `mailto:${COMPANY.email}`,
        icon: 'mail',
        icon_url: '',
        status: 'published',
        position: 0,
      },
      {
        id: 'phone',
        label: localized('contact.phoneLabel'),
        value: { en: COMPANY.phone, fr: COMPANY.phone, ar: COMPANY.phone },
        href: `tel:${COMPANY.phoneHref}`,
        icon: 'phone',
        icon_url: '',
        status: 'published',
        position: 1,
      },
      {
        id: 'address',
        label: localized('contact.locationLabel'),
        value: localized('contact.locationValue'),
        href: '',
        icon: 'map-pin',
        icon_url: '',
        status: 'published',
        position: 2,
      },
      {
        id: 'hours',
        label: localized('contact.hoursLabel'),
        value: localized('contact.hoursValue'),
        href: '',
        icon: 'clock',
        icon_url: '',
        status: 'published',
        position: 3,
      },
    ],
    team: TEAM.map((member, position) => ({
      id: member.id,
      name: member.name,
      role: localized(member.roleKey),
      description: localized(member.bioKey),
      url: member.portfolioUrl,
      photo_url: member.photo ?? '',
      status: 'published',
      position,
    })),
  };
}

/** The content a prerendered page was built from, carried in the page to the browser. */
const PRERENDERED_CONTENT = makeStateKey<SiteContent>('dabadigital.content');

@Injectable({ providedIn: 'root' })
export class ContentStore {
  private readonly api = inject(ContentApi);
  private readonly supabase = inject(SupabaseService);
  private readonly i18n = inject(I18nService);
  private readonly transferState = inject(TransferState);
  /**
   * On a prerendered page, the live content the build rendered it with. Hydration has to
   * start from exactly that: from the seed instead, the projects would not match the cards
   * already in the page.
   */
  private readonly prerendered = this.transferState.get(PRERENDERED_CONTENT, null);
  readonly content = signal<SiteContent>(this.prerendered ?? seedContent());
  /** False until the first Supabase read settles, so a page can tell "loading" from "not found". */
  readonly loaded = signal(this.prerendered !== null || !this.supabase.configured());
  readonly projects = computed(() =>
    this.content().projects.filter((p) => p.status === 'published'),
  );
  readonly services = computed(() =>
    this.content().services.filter((s) => s.status === 'published'),
  );
  readonly social = computed(() => this.content().social.filter((s) => s.status === 'published'));
  readonly contact = computed(() => this.content().contact.filter((s) => s.status === 'published'));
  readonly team = computed(() => this.content().team.filter((m) => m.status === 'published'));

  readonly text = (value: LocalizedText): string =>
    value[this.i18n.locale()] || value.en || value.fr || value.ar;

  constructor() {
    if (!this.supabase.configured()) return;
    // Once the first frame is on screen, not while it is being drawn. The seed content fills
    // that frame anyway; requests in flight during it compete with the files it does need,
    // and the live content leads straight to the heaviest files on the page, the project
    // covers. A hidden tab paints no frame, so it does not wait for one.
    const document = inject(DOCUMENT);
    afterNextRender(() => {
      const load = (): void =>
        void this.refresh()
          .catch(() => undefined)
          .finally(() => this.loaded.set(true));
      const view = document.defaultView;
      if (!view || document.visibilityState === 'hidden') setTimeout(load);
      else view.requestAnimationFrame(() => setTimeout(load));
    });
  }

  async refresh(): Promise<void> {
    if (!this.supabase.configured()) return;
    this.content.set(await this.api.load());
  }

  /**
   * Build time: reads the live content before the page is prerendered, and stores it in the
   * page for the browser to hydrate from (see `app.config.server.ts`). The browser still
   * refreshes after its first paint, so an edit made in the admin since the build shows up.
   *
   * Throws when Supabase cannot be read, which fails `ng build`. A prerendered page built
   * from the seed — the brief's placeholder projects, a placeholder phone number — would be
   * what search engines and AI crawlers index; the previous deployment stays live instead.
   */
  async prerender(): Promise<void> {
    if (!this.supabase.configured()) {
      throw new Error(
        'Prerendering needs the live content, but public/supabase-config.json is missing or invalid.',
      );
    }
    await this.refresh();
    this.loaded.set(true);
    this.transferState.set(PRERENDERED_CONTENT, this.content());
  }
}
