import type { MessageKey } from '../../core/i18n/messages/ar';
import type { BrandName } from '../../shared/ui/brand-icon.component';
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
 * PLACEHOLDER — the projects below come from the design mock-up. Confirm each
 * one (and its artwork in `public/images/`) against real client work before
 * launch. The live site reads projects, categories and services from Supabase;
 * this file is the seed and the offline fallback.
 */

export type ProjectCategory = 'web' | 'ecommerce' | 'mobile' | 'business';

export interface Project {
  /** The `/portfolio/:slug` route this card links to. */
  readonly slug: string;
  /** A project name is a proper noun — it is deliberately not translated. */
  readonly name: string;
  readonly summaryKey: MessageKey;
  readonly categories: readonly ProjectCategory[];
  /** Shown after the category chips. Seed-only: the content API has no tags. */
  readonly tagKeys: readonly MessageKey[];
  readonly year: string;
  readonly tone: WorkTone;
  readonly image_url?: string;
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

export interface ProcessStep {
  readonly id: string;
  readonly icon: IconName;
  readonly titleKey: MessageKey;
  readonly textKey: MessageKey;
}

export interface Tool {
  readonly id: BrandName;
  /** A product name — a proper noun, never translated. */
  readonly name: string;
}

export const PROJECT_FILTERS: readonly ProjectFilter[] = [
  { id: 'all', labelKey: 'projects.filter.all' },
  { id: 'web', labelKey: 'projects.filter.web' },
  { id: 'ecommerce', labelKey: 'projects.filter.ecommerce' },
  { id: 'mobile', labelKey: 'projects.filter.mobile' },
  { id: 'business', labelKey: 'projects.filter.business' },
];

/** Public showcase uses clearly labeled demo concepts; switch to managed for CMS case studies. */
export const PORTFOLIO_SOURCE: 'demo' | 'managed' = 'demo';

export const PROJECTS: readonly Project[] = [
  {
    slug: 'knowledge-hub',
    name: 'Knowledge Hub',
    summaryKey: 'projects.item.knowledge-hub.summary',
    categories: ['web', 'business'],
    tagKeys: ['projects.tag.customFeatures'],
    year: '2024',
    tone: 'primary',
    image_url: '/images/project-knowledge-tech.webp',
  },
  {
    slug: 'booking-cloud',
    name: 'Booking Cloud',
    summaryKey: 'projects.item.booking-cloud.summary',
    categories: ['web'],
    tagKeys: ['projects.tag.booking', 'projects.tag.payments'],
    year: '2024',
    tone: 'primary',
    image_url: '/images/project-booking-tech.webp',
  },
  {
    slug: 'learning-platform',
    name: 'Learning Platform',
    summaryKey: 'projects.item.learning-platform.summary',
    categories: ['web'],
    tagKeys: ['projects.tag.platform', 'projects.tag.education'],
    year: '2024',
    tone: 'primary',
    image_url: '/images/project-learning-tech.webp',
  },
  {
    slug: 'connect-app',
    name: 'Connect App',
    summaryKey: 'projects.item.connect-app.summary',
    categories: ['mobile'],
    tagKeys: ['projects.tag.marketplace', 'projects.tag.iosAndroid'],
    year: '2024',
    tone: 'primary',
    image_url: '/images/project-connect-tech.webp',
  },
  {
    slug: 'neural-ledger',
    name: 'Neural Ledger',
    summaryKey: 'projects.item.neural-ledger.summary',
    categories: ['business', 'web'],
    tagKeys: [],
    year: '2025',
    tone: 'primary',
  },
  {
    slug: 'aura-commerce',
    name: 'Aura Commerce',
    summaryKey: 'projects.item.aura-commerce.summary',
    categories: ['ecommerce', 'web'],
    tagKeys: ['projects.tag.payments'],
    year: '2025',
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
  { id: 'design', icon: 'pen', titleKey: 'services.design.title', textKey: 'services.design.text' },
  { id: 'cloud', icon: 'layers', titleKey: 'services.cloud.title', textKey: 'services.cloud.text' },
];

export const PILLARS: readonly Pillar[] = [
  { id: 'design', icon: 'cube', titleKey: 'about.pillar1.title', textKey: 'about.pillar1.text' },
  {
    id: 'performance',
    icon: 'bar-chart',
    titleKey: 'about.pillar2.title',
    textKey: 'about.pillar2.text',
  },
  {
    id: 'multilingual',
    icon: 'globe',
    titleKey: 'about.pillar3.title',
    textKey: 'about.pillar3.text',
  },
  { id: 'support', icon: 'users', titleKey: 'about.pillar4.title', textKey: 'about.pillar4.text' },
];

/** The five steps of an engagement, in order — the order is the content. */
export const PROCESS_STEPS: readonly ProcessStep[] = [
  { id: 'discover', icon: 'search', titleKey: 'process.step1.title', textKey: 'process.step1.text' },
  { id: 'plan', icon: 'file', titleKey: 'process.step2.title', textKey: 'process.step2.text' },
  { id: 'design', icon: 'pen', titleKey: 'process.step3.title', textKey: 'process.step3.text' },
  { id: 'build', icon: 'code', titleKey: 'process.step4.title', textKey: 'process.step4.text' },
  { id: 'launch', icon: 'rocket', titleKey: 'process.step5.title', textKey: 'process.step5.text' },
];

/** The tools named under the banner's calls to action. */
export const TOOLS: readonly Tool[] = [
  { id: 'laravel', name: 'Laravel' },
  { id: 'nextjs', name: 'Next.js' },
  { id: 'shopify', name: 'Shopify' },
  { id: 'figma', name: 'Figma' },
];

/**
 * `01`, `02`, … as an editorial index on cards and steps.
 *
 * Formatted through `Intl` rather than by padding a string so the digits follow
 * the locale's numbering system. Each supported language uses its own numbering conventions.
 */
export function indexLabel(index: number, localeTag: string): string {
  return new Intl.NumberFormat(localeTag, { minimumIntegerDigits: 2, useGrouping: false }).format(
    index + 1,
  );
}
