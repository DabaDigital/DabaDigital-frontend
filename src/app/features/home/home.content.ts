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
 * This is the seed and the offline fallback. The live site reads projects,
 * categories, services and the team from Supabase (see `core/content.store.ts`), and
 * `scripts/generate-content-seed.cjs` turns this file into starter SQL — so the
 * shapes of `PROJECTS`, `PROJECT_FILTERS` and `SERVICES` are a contract.
 *
 * PLACEHOLDER — the three projects come from the design brief. Confirm them,
 * and upload their real imagery through the admin (`image_url`), before launch.
 */

export type ProjectCategory = 'webapp' | 'branding' | 'mobile' | 'ai';

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

export const PROJECT_FILTERS: readonly ProjectFilter[] = [
  { id: 'all', labelKey: 'projects.filter.all' },
  { id: 'webapp', labelKey: 'projects.filter.webapp' },
  { id: 'branding', labelKey: 'projects.filter.branding' },
  { id: 'mobile', labelKey: 'projects.filter.mobile' },
  { id: 'ai', labelKey: 'projects.filter.ai' },
];

export const PROJECTS: readonly Project[] = [
  {
    slug: 'nextgen',
    name: 'NextGen',
    summaryKey: 'projects.item.nextgen.summary',
    categories: ['webapp', 'ai'],
    year: '2025',
    tone: 'primary',
  },
  {
    slug: 'le-maitre-du-sandwich',
    name: 'Le Maître du Sandwich',
    summaryKey: 'projects.item.le-maitre-du-sandwich.summary',
    categories: ['branding'],
    year: '2025',
    tone: 'accent',
  },
  {
    slug: 'casablanca-night',
    name: 'Casablanca Night',
    summaryKey: 'projects.item.casablanca-night.summary',
    categories: ['webapp'],
    year: '2024',
    tone: 'primary',
  },
];

export const SERVICES: readonly Service[] = [
  { id: 'web', icon: 'browser', titleKey: 'services.web.title', textKey: 'services.web.text' },
  {
    id: 'mobile',
    icon: 'mobile',
    titleKey: 'services.mobile.title',
    textKey: 'services.mobile.text',
  },
  {
    id: 'design',
    icon: 'layers',
    titleKey: 'services.design.title',
    textKey: 'services.design.text',
  },
  { id: 'ai', icon: 'cube', titleKey: 'services.ai.title', textKey: 'services.ai.text' },
];

/**
 * The picture for the About section: the wordmark on its brand blue
 * (`public/dabadigital.webp`). Set it to `null` and the section draws
 * `OfficeArtComponent` in its place.
 */
export const ABOUT_IMAGE: string | null = '/dabadigital.webp';

export interface TeamMember {
  readonly id: string;
  /** A person's name is a proper noun — it is deliberately not translated. */
  readonly name: string;
  readonly roleKey: MessageKey;
  readonly bioKey: MessageKey;
  /** The member's own site. The card shows it without the scheme. */
  readonly portfolioUrl: string;
  /**
   * A portrait under `public/` (square or a little taller than wide, at least
   * 500px across). When it is `null` — or the file fails to load — the card
   * shows the member's initials in its place.
   */
  readonly photo: string | null;
}

/**
 * The Team section's seed and offline fallback, in card order. The live site
 * shows the members and portraits managed in the admin (`dd_team_members`).
 */
export const TEAM: readonly TeamMember[] = [
  {
    id: 'keltoum-malouki',
    name: 'Keltoum Malouki',
    roleKey: 'team.role.fullStack',
    bioKey: 'team.member.keltoum-malouki.bio',
    portfolioUrl: 'https://keltoummalouki.com',
    photo: '/images/team/keltoum-malouki.webp',
  },
  {
    id: 'jawad-boulmal',
    name: 'Jawad Boulmal',
    roleKey: 'team.role.fullStack',
    bioKey: 'team.member.jawad-boulmal.bio',
    portfolioUrl: 'https://jawadboulmal.com',
    photo: '/images/team/jawad-boulmal.webp',
  },
];

/** The figures under the About copy, in reading order. */
export const STATS: readonly { readonly valueKey: MessageKey; readonly labelKey: MessageKey }[] = [
  { valueKey: 'about.stat1Value', labelKey: 'about.stat1Label' },
  { valueKey: 'about.stat2Value', labelKey: 'about.stat2Label' },
  { valueKey: 'about.stat3Value', labelKey: 'about.stat3Label' },
];
