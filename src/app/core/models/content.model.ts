import type { IconName } from '../../shared/ui/icon.component';

export interface LocalizedText {
  en: string;
  fr: string;
  ar: string;
}
export type PublicationStatus = 'published' | 'draft';
export type MessageStatus = 'new' | 'read' | 'replied' | 'archived';

export interface Category {
  id: string;
  name: LocalizedText;
  slug: string;
  position: number;
}

export interface ManagedProject {
  id: string;
  name: string;
  slug: string;
  summary: LocalizedText;
  description: LocalizedText;
  categories: string[];
  year: string;
  tone: 'primary' | 'accent';
  image_url: string;
  website_url: string;
  status: PublicationStatus;
  position: number;
  updated_at?: string;
}

export interface ManagedService {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  /** The built-in glyph, shown while no icon has been uploaded. */
  icon: IconName;
  /** An uploaded icon's public URL, '' for none. It takes the glyph's place. */
  icon_url: string;
  status: PublicationStatus;
  position: number;
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  /** The built-in glyph, shown while no icon has been uploaded. */
  icon: IconName;
  /** An uploaded icon's public URL, '' for none. It takes the glyph's place. */
  icon_url: string;
  status: PublicationStatus;
  position: number;
}

export interface ContactChannel {
  id: string;
  label: LocalizedText;
  value: LocalizedText;
  href: string;
  /** The built-in glyph, shown while no icon has been uploaded. */
  icon: IconName;
  /** An uploaded icon's public URL, '' for none. It takes the glyph's place. */
  icon_url: string;
  status: PublicationStatus;
  position: number;
}

export interface ManagedTeamMember {
  id: string;
  /** A person's name is a proper noun, so it is not translated. */
  name: string;
  role: LocalizedText;
  description: LocalizedText;
  /** Their portfolio or profile, '' for none. */
  url: string;
  /** An uploaded portrait's public URL, '' for none: the card then shows their initials. */
  photo_url: string;
  status: PublicationStatus;
  position: number;
}

export interface ClientMessage {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  project_type: string;
  budget: string;
  description: string;
  locale: string;
  status: MessageStatus;
  created_at: string;
}

export type ContentSection = 'projects' | 'categories' | 'services' | 'social' | 'contact' | 'team';
export type ContentRecord =
  ManagedProject | Category | ManagedService | SocialLink | ContactChannel | ManagedTeamMember;
export interface SiteContent {
  projects: ManagedProject[];
  categories: Category[];
  services: ManagedService[];
  social: SocialLink[];
  contact: ContactChannel[];
  team: ManagedTeamMember[];
}

/** A section with one of its own records, or null for a new one: what an editor opens on. */
export type SectionEntry = {
  [S in ContentSection]: { section: S; record: SiteContent[S][number] | null };
}[ContentSection];
