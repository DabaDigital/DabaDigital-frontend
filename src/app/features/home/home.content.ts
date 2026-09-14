import type { MessageKey } from '../../core/i18n/messages/ar';
import type { IconName } from '../../shared/ui/icon.component';
import type { WorkTone } from './components/work-thumb.component';

/**
 * The landing page's content, as data.
 *
 * Only the *keys* live here — the prose lives in `core/i18n/messages/`, so a
 * section template never holds a user-facing string and adding a language never
 * means touching this file. Names, slugs, icons and categories are not
 * translatable and so are inline.
 *
 * PLACEHOLDER — the six projects below are invented. Replace them with real
 * client work before launch, and swap `<app-work-thumb>` for real screenshots
 * (see the note on that component).
 */

export type ProjectCategory = 'web' | 'ecommerce' | 'ai' | 'mobile';

export interface Project {
  /** The `/portfolio/:slug` route this card links to. */
  readonly slug: string;
  /** A project name is a proper noun — it is deliberately not translated. */
  readonly name: string;
  readonly summaryKey: MessageKey;
  readonly categories: readonly ProjectCategory[];
  readonly year: string;
  readonly tone: WorkTone;
}

export interface ProjectFilter {
  readonly id: ProjectCategory | 'all';
  readonly labelKey: MessageKey;
}

export interface Service {
  readonly id: string;
  readonly icon: IconName;
  readonly titleKey: MessageKey;
  readonly textKey: MessageKey;
}

export interface Pillar {
  readonly id: string;
  readonly icon: IconName;
  readonly titleKey: MessageKey;
  readonly textKey: MessageKey;
}

export const PROJECT_FILTERS: readonly ProjectFilter[] = [
  { id: 'all', labelKey: 'projects.filter.all' },
  { id: 'web', labelKey: 'projects.filter.web' },
  { id: 'ecommerce', labelKey: 'projects.filter.ecommerce' },
  { id: 'ai', labelKey: 'projects.filter.ai' },
  { id: 'mobile', labelKey: 'projects.filter.mobile' },
];

export const PROJECTS: readonly Project[] = [
  {
    slug: 'neural-ledger',
    name: 'Neural Ledger',
    summaryKey: 'projects.item.neural-ledger.summary',
    categories: ['ai', 'web'],
    year: '2025',
    tone: 'primary',
  },
  {
    slug: 'aura-commerce',
    name: 'Aura Commerce',
    summaryKey: 'projects.item.aura-commerce.summary',
    categories: ['ecommerce', 'web'],
    year: '2025',
    tone: 'accent',
  },
  {
    slug: 'atlas-cargo',
    name: 'Atlas Cargo',
    summaryKey: 'projects.item.atlas-cargo.summary',
    categories: ['web'],
    year: '2024',
    tone: 'primary',
  },
  {
    slug: 'souk-connect',
    name: 'Souk Connect',
    summaryKey: 'projects.item.souk-connect.summary',
    categories: ['mobile', 'ecommerce'],
    year: '2024',
    tone: 'accent',
  },
  {
    slug: 'zellige-studio',
    name: 'Zellige Studio',
    summaryKey: 'projects.item.zellige-studio.summary',
    categories: ['web'],
    year: '2024',
    tone: 'primary',
  },
  {
    slug: 'riad-atlas',
    name: 'Riad Atlas',
    summaryKey: 'projects.item.riad-atlas.summary',
    categories: ['web', 'ecommerce'],
    year: '2023',
    tone: 'accent',
  },
];

export const SERVICES: readonly Service[] = [
  { id: 'web', icon: 'code', titleKey: 'services.web.title', textKey: 'services.web.text' },
  {
    id: 'ecommerce',
    icon: 'bag',
    titleKey: 'services.ecommerce.title',
    textKey: 'services.ecommerce.text',
  },
  { id: 'ai', icon: 'sparkles', titleKey: 'services.ai.title', textKey: 'services.ai.text' },
  { id: 'mobile', icon: 'mobile', titleKey: 'services.mobile.title', textKey: 'services.mobile.text' },
  { id: 'design', icon: 'palette', titleKey: 'services.design.title', textKey: 'services.design.text' },
  { id: 'cloud', icon: 'cloud', titleKey: 'services.cloud.title', textKey: 'services.cloud.text' },
];

export const PILLARS: readonly Pillar[] = [
  {
    id: 'design',
    icon: 'palette',
    titleKey: 'about.pillar1.title',
    textKey: 'about.pillar1.text',
  },
  { id: 'performance', icon: 'gauge', titleKey: 'about.pillar2.title', textKey: 'about.pillar2.text' },
  {
    id: 'multilingual',
    icon: 'languages',
    titleKey: 'about.pillar3.title',
    textKey: 'about.pillar3.text',
  },
  { id: 'support', icon: 'shield', titleKey: 'about.pillar4.title', textKey: 'about.pillar4.text' },
];
