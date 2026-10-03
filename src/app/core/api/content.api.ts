import { Injectable, inject } from '@angular/core';
import type {
  Category,
  ClientMessage,
  ContactChannel,
  ContentRecord,
  ContentSection,
  ManagedProject,
  ManagedService,
  ManagedTeamMember,
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
  team: 'dd_team_members',
};
type ProjectRow = Omit<ManagedProject, 'categories'> & {
  dd_project_categories: { category_id: string }[];
};
/** PostgREST's answer for a table it does not know: one whose migration has not run yet. */
const MISSING_TABLE = 'PGRST205';
/** Public bucket for project covers — see the `dabadigital_project_images` migration. */
const PROJECT_IMAGES = 'dd-project-images';
/** Public bucket for uploaded icons and team portraits — see the `dabadigital_team_and_icons` migration. */
const MEDIA = 'dd-media';
const IMAGE_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};
/** An icon may also be an SVG; a cover or a portrait may not. */
const MEDIA_EXTENSIONS: Readonly<Record<string, string>> = {
  ...IMAGE_EXTENSIONS,
  'image/svg+xml': 'svg',
};

/** Where an upload lands in the media bucket. */
export type MediaFolder = 'icons' | 'team';

/** Rows read before the icons migration have no `icon_url` at all; they keep their glyph. */
function withIconUrl<T extends { icon_url: string }>(rows: unknown): T[] {
  return (rows as T[]).map((row) => ({ ...row, icon_url: row.icon_url ?? '' }));
}

@Injectable({ providedIn: 'root' })
export class ContentApi {
  private readonly supabase = inject(SupabaseService);

  async load(publishedOnly = true): Promise<SiteContent> {
    // Published content is public: plain GETs read it, and the public site never loads the
    // client. Drafts need the signed-in admin's session, which only the client carries.
    const client = publishedOnly ? null : await this.supabase.connect();
    const read = (
      section: ContentSection,
      columns = '*',
    ): PromiseLike<{ data: unknown; error: { code: string } | null }> =>
      client
        ? client.from(TABLES[section]).select(columns).order('position')
        : this.supabase.select(TABLES[section], {
            select: columns,
            order: 'position.asc',
            ...(section === 'categories' ? {} : { status: 'eq.published' }),
          });
    const [projects, categories, services, social, contact, team] = await Promise.all([
      read('projects', '*,dd_project_categories(category_id)'),
      read('categories'),
      read('services'),
      read('social'),
      read('contact'),
      read('team'),
    ]);
    for (const result of [projects, categories, services, social, contact])
      if (result.error) throw result.error;
    // The team table came with a later migration. Until it is applied, everything else still loads.
    if (team.error && team.error.code !== MISSING_TABLE) throw team.error;
    return {
      projects: (projects.data as unknown as ProjectRow[]).map(
        ({ dd_project_categories, ...project }) => ({
          ...project,
          categories: dd_project_categories.map((row) => row.category_id),
        }),
      ),
      categories: categories.data as unknown as Category[],
      services: withIconUrl<ManagedService>(services.data),
      social: withIconUrl<SocialLink>(social.data),
      contact: withIconUrl<ContactChannel>(contact.data),
      team: team.error ? [] : (team.data as unknown as ManagedTeamMember[]),
    };
  }

  /** Every project category, in display order — including ones added since the workspace loaded. */
  async categories(): Promise<Category[]> {
    const client = await this.supabase.connect();
    const { data, error } = await client.from(TABLES.categories).select('*').order('position');
    if (error) throw error;
    return data as Category[];
  }

  async save(section: ContentSection, record: ContentRecord): Promise<void> {
    const client = await this.supabase.connect();
    if (section === 'projects' && 'categories' in record) {
      const { categories, ...project } = record;
      const { error } = await client.rpc('dd_save_project', {
        project_data: project,
        category_ids: categories,
      });
      if (error) throw error;
    } else {
      const payload: Record<string, unknown> = { ...record };
      const { error } = await client.from(TABLES[section]).upsert(payload).select('id').single();
      if (error) throw error;
    }
  }

  /**
   * Stores a cover image under a random name and returns its public URL. Files
   * are never overwritten, so a cached cover cannot change under a saved project;
   * replacing or removing a cover leaves the old file in the bucket.
   */
  uploadProjectImage(file: File): Promise<string> {
    return this.store(PROJECT_IMAGES, 'projects', file, IMAGE_EXTENSIONS);
  }

  /** Stores an icon or a team portrait the same way, in the media bucket. */
  uploadMedia(file: File, folder: MediaFolder): Promise<string> {
    return this.store(MEDIA, folder, file, MEDIA_EXTENSIONS);
  }

  private async store(
    bucketId: string,
    folder: string,
    file: File,
    extensions: Readonly<Record<string, string>>,
  ): Promise<string> {
    const extension = extensions[file.type];
    if (!extension) throw new Error('unsupported_image_type');
    const bucket = (await this.supabase.connect()).storage.from(bucketId);
    const path = `${folder}/${crypto.randomUUID()}.${extension}`;
    const { error } = await bucket.upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    return bucket.getPublicUrl(path).data.publicUrl;
  }

  async remove(section: ContentSection, id: string): Promise<void> {
    const client = await this.supabase.connect();
    const { error } = await client
      .from(TABLES[section])
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error) throw error;
  }

  async messages(): Promise<ClientMessage[]> {
    const client = await this.supabase.connect();
    const { data, error } = await client
      .from('dd_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) throw error;
    return data as ClientMessage[];
  }

  async setMessageStatus(id: string, status: MessageStatus): Promise<void> {
    const client = await this.supabase.connect();
    const { error } = await client
      .from('dd_messages')
      .update({ status })
      .eq('id', id)
      .select('id')
      .single();
    if (error) throw error;
  }
}
