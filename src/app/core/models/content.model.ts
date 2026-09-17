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
  icon: IconName;
  status: PublicationStatus;
  position: number;
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: IconName;
  status: PublicationStatus;
  position: number;
}

export interface ContactChannel {
  id: string;
  label: LocalizedText;
  value: LocalizedText;
  href: string;
  icon: IconName;
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

export type ContentSection = 'projects' | 'categories' | 'services' | 'social' | 'contact';
export type ContentRecord =
  ManagedProject | Category | ManagedService | SocialLink | ContactChannel;
export interface SiteContent {
  projects: ManagedProject[];
  categories: Category[];
  services: ManagedService[];
  social: SocialLink[];
  contact: ContactChannel[];
}
