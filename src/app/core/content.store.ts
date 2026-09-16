import { Injectable, computed, inject, signal } from '@angular/core';
import { PROJECTS, PROJECT_FILTERS, SERVICES } from '../features/home/home.content';
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
      status: 'published',
      position,
    })),
    social: [
      {
        id: 'linkedin',
        name: 'LinkedIn',
        url: COMPANY.linkedin,
        icon: 'linkedin',
        status: 'published',
        position: 0,
      },
      {
        id: 'instagram',
        name: 'Instagram',
        url: COMPANY.instagram,
        icon: 'instagram',
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
        status: 'published',
        position: 0,
      },
      {
        id: 'phone',
        label: localized('contact.phoneLabel'),
        value: { en: COMPANY.phone, fr: COMPANY.phone, ar: COMPANY.phone },
        href: `tel:${COMPANY.phoneHref}`,
        icon: 'phone',
        status: 'published',
        position: 1,
      },
      {
        id: 'address',
        label: localized('contact.locationLabel'),
        value: localized('contact.locationValue'),
        href: '',
        icon: 'map-pin',
        status: 'published',
        position: 2,
      },
      {
        id: 'hours',
        label: localized('contact.hoursLabel'),
        value: localized('contact.hoursValue'),
        href: '',
        icon: 'clock',
        status: 'published',
        position: 3,
      },
    ],
  };
}

@Injectable({ providedIn: 'root' })
export class ContentStore {
  private readonly api = inject(ContentApi);
  private readonly supabase = inject(SupabaseService);
  private readonly i18n = inject(I18nService);
  readonly content = signal<SiteContent>(seedContent());
  /** False until the first Supabase read settles, so a page can tell "loading" from "not found". */
  readonly loaded = signal(!this.supabase.configured());
  readonly projects = computed(() =>
    this.content().projects.filter((p) => p.status === 'published'),
  );
  readonly services = computed(() =>
    this.content().services.filter((s) => s.status === 'published'),
  );
  readonly social = computed(() => this.content().social.filter((s) => s.status === 'published'));
  readonly contact = computed(() => this.content().contact.filter((s) => s.status === 'published'));

  readonly text = (value: LocalizedText): string =>
    value[this.i18n.locale()] || value.en || value.fr || value.ar;

  constructor() {
    if (this.supabase.configured()) {
      void this.refresh()
        .catch(() => undefined)
        .finally(() => this.loaded.set(true));
    }
  }

  async refresh(): Promise<void> {
    if (!this.supabase.configured()) return;
    this.content.set(await this.api.load());
  }
}
