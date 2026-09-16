import { Injectable, inject } from '@angular/core';
import type {
  Category,
  ClientMessage,
  ContactChannel,
  ContentRecord,
  ContentSection,
  ManagedProject,
  ManagedService,
  MessageStatus,
  SiteContent,
  SocialLink,
} from '../models/content.model';
import { SupabaseService } from './supabase.service';

const TABLES: Record<ContentSection, string> = {
  projects: 'dd_projects',
  categories: 'dd_categories',
  services: 'dd_services',
  social: 'dd_social_links',
  contact: 'dd_contact_channels',
};
type ProjectRow = Omit<ManagedProject, 'categories'> & {
  dd_project_categories: { category_id: string }[];
};
/** Public bucket for project covers — see the `dabadigital_project_images` migration. */
const PROJECT_IMAGES = 'dd-project-images';
const IMAGE_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

@Injectable({ providedIn: 'root' })
export class ContentApi {
  private readonly supabase = inject(SupabaseService);

  async load(publishedOnly = true): Promise<SiteContent> {
    const client = this.supabase.client;
    const read = (section: ContentSection, columns = '*') => {
      const query = client.from(TABLES[section]).select(columns).order('position');
      return publishedOnly && section !== 'categories' ? query.eq('status', 'published') : query;
    };
    const results = await Promise.all([
      read('projects', '*,dd_project_categories(category_id)'),
      read('categories'),
      read('services'),
      read('social'),
      read('contact'),
    ]);
    for (const result of results) if (result.error) throw result.error;
    return {
      projects: (results[0].data as unknown as ProjectRow[]).map(
        ({ dd_project_categories, ...project }) => ({
          ...project,
          categories: dd_project_categories.map((row) => row.category_id),
        }),
      ),
      categories: results[1].data as unknown as Category[],
      services: results[2].data as unknown as ManagedService[],
      social: results[3].data as unknown as SocialLink[],
      contact: results[4].data as unknown as ContactChannel[],
    };
  }

  /** Every project category, in display order — including ones added since the workspace loaded. */
  async categories(): Promise<Category[]> {
    const { data, error } = await this.supabase.client
      .from(TABLES.categories)
      .select('*')
      .order('position');
    if (error) throw error;
    return data as Category[];
  }

  async save(section: ContentSection, record: ContentRecord): Promise<void> {
    if (section === 'projects' && 'categories' in record) {
      const { categories, ...project } = record;
      const { error } = await this.supabase.client.rpc('dd_save_project', {
        project_data: project,
        category_ids: categories,
      });
      if (error) throw error;
    } else {
      const payload: Record<string, unknown> = { ...record };
      const { error } = await this.supabase.client
        .from(TABLES[section])
        .upsert(payload)
        .select('id')
        .single();
      if (error) throw error;
    }
  }

  /**
   * Stores a cover image under a random name and returns its public URL. Files
   * are never overwritten, so a cached cover cannot change under a saved project;
   * replacing or removing a cover leaves the old file in the bucket.
   */
  async uploadProjectImage(file: File): Promise<string> {
    const extension = IMAGE_EXTENSIONS[file.type];
    if (!extension) throw new Error('unsupported_image_type');
    const bucket = this.supabase.client.storage.from(PROJECT_IMAGES);
    const path = `projects/${crypto.randomUUID()}.${extension}`;
    const { error } = await bucket.upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    return bucket.getPublicUrl(path).data.publicUrl;
  }

  async remove(section: ContentSection, id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(TABLES[section])
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error) throw error;
  }

  async messages(): Promise<ClientMessage[]> {
    const { data, error } = await this.supabase.client
      .from('dd_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) throw error;
    return data as ClientMessage[];
  }

  async setMessageStatus(id: string, status: MessageStatus): Promise<void> {
    const { error } = await this.supabase.client
      .from('dd_messages')
      .update({ status })
      .eq('id', id)
      .select('id')
      .single();
    if (error) throw error;
  }
}
