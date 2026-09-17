import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AdminAuthService } from '../../core/api/admin-auth.service';
import { ContentApi } from '../../core/api/content.api';
import { ContentStore } from '../../core/content.store';
import { I18nService } from '../../core/i18n/i18n.service';
import { isLocale, type Locale } from '../../core/i18n/locale';
import { AR, type Catalog, type MessageKey } from '../../core/i18n/messages/ar';
import { EN } from '../../core/i18n/messages/en';
import { FR } from '../../core/i18n/messages/fr';
import type {
  ClientMessage,
  ContentRecord,
  ContentSection,
  MessageStatus,
} from '../../core/models/content.model';
import { PROJECT_TYPES } from '../../core/project-types';
import { ButtonComponent } from '../../shared/ui/button.component';
import { DialogComponent } from '../../shared/ui/dialog.component';
import { IconComponent, type IconName } from '../../shared/ui/icon.component';
import { LogoComponent } from '../../shared/ui/logo.component';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import {
  SelectButtonsComponent,
  type SelectButtonOption,
} from '../../shared/ui/select-buttons.component';
import { ThemeToggleComponent } from '../../shared/ui/theme-toggle.component';
import { LanguageMenuComponent } from '../../shared/ui/language-menu.component';
import { WorkThumbComponent } from '../home/components/work-thumb.component';
import { AdminEditorComponent } from './admin-editor.component';
import { AdminStore } from './admin.store';

/** Reply subjects go out in the language the client wrote in, not the dashboard's. */
const CATALOGS: Readonly<Record<Locale, Catalog>> = { ar: AR, fr: FR, en: EN };

type Section = ContentSection | 'overview' | 'messages';
const NAV: {
  id: Section;
  icon: IconName;
  label: MessageKey;
  description: MessageKey;
  add?: MessageKey;
}[] = [
  { id: 'overview', icon: 'dashboard', label: 'admin.overview', description: 'admin.overviewDesc' },
  {
    id: 'projects',
    icon: 'folder',
    label: 'admin.projects',
    description: 'admin.projectsDesc',
    add: 'admin.addProject',
  },
  {
    id: 'categories',
    icon: 'layers',
    label: 'admin.categories',
    description: 'admin.categoriesDesc',
    add: 'admin.addCategory',
  },
  {
    id: 'services',
    icon: 'code',
    label: 'admin.services',
    description: 'admin.servicesDesc',
    add: 'admin.addService',
  },
  {
    id: 'social',
    icon: 'globe',
    label: 'admin.social',
    description: 'admin.socialDesc',
    add: 'admin.addSocial',
  },
  {
    id: 'contact',
    icon: 'phone',
    label: 'admin.contact',
    description: 'admin.contactDesc',
    add: 'admin.addContact',
  },
  { id: 'messages', icon: 'mail', label: 'admin.messages', description: 'admin.messagesDesc' },
];

@Component({
  selector: 'app-admin-page',
  imports: [
    RouterLink,
    RouterLinkActive,
    DatePipe,
    ButtonComponent,
    DialogComponent,
    IconComponent,
    LogoComponent,
    SearchInputComponent,
    SelectButtonsComponent,
    ThemeToggleComponent,
    LanguageMenuComponent,
    WorkThumbComponent,
    AdminEditorComponent,
  ],
  templateUrl: './admin.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPage {
  readonly section = input<Section>('overview');
  protected readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly auth = inject(AdminAuthService);
  protected readonly store = inject(ContentStore);
  private readonly workspace = inject(AdminStore);
  private readonly api = inject(ContentApi);
  private readonly router = inject(Router);
  protected readonly nav = NAV;
  protected readonly messageFilterOptions = computed<SelectButtonOption[]>(() =>
    (['all', 'new', 'read', 'replied', 'archived'] as const).map((status) => ({
      value: status,
      label: status === 'all' ? this.t('admin.all') : this.statusLabel(status),
    })),
  );
  /** Categories have no draft state, so they only get the "All" tab. */
  protected readonly contentFilterOptions = computed<SelectButtonOption[]>(() => [
    { value: 'all', label: this.t('admin.all'), count: this.sectionTotal() },
    ...(this.section() === 'categories'
      ? []
      : [
          { value: 'published', label: this.t('admin.published') },
          { value: 'draft', label: this.t('admin.draft') },
        ]),
  ]);
  protected readonly current = computed(
    () => NAV.find((item) => item.id === this.section()) ?? NAV[0],
  );
  // Held by AdminStore, so moving between sections does not refetch the workspace.
  protected readonly data = this.workspace.data;
  protected readonly messages = this.workspace.messages;
  protected readonly loading = this.workspace.loading;
  protected readonly loadError = this.workspace.loadError;
  protected readonly busy = signal(false);
  protected readonly notice = signal('');
  protected readonly error = signal('');
  protected readonly query = signal('');
  protected readonly filter = signal('all');
  protected readonly page = signal(0);
  protected readonly menuOpen = signal(false);
  protected readonly editing = signal<{
    section: ContentSection;
    record: ContentRecord | null;
  } | null>(null);
  protected readonly deleting = signal<{ section: ContentSection; record: ContentRecord } | null>(
    null,
  );
  protected readonly selectedMessage = signal<string | null>(null);
  protected readonly message = computed(() =>
    this.messages().find((m) => m.id === this.selectedMessage()),
  );
  protected readonly unread = computed(
    () => this.messages().filter((m) => m.status === 'new').length,
  );
  protected readonly published = computed(
    () => this.data().projects.filter((p) => p.status === 'published').length,
  );
  protected readonly drafts = computed(
    () => this.data().projects.filter((p) => p.status === 'draft').length,
  );
  /** Everything in the section, whatever the filter — the count on the "All" tab. */
  protected readonly sectionTotal = computed(() => {
    const section = this.section();
    return section === 'overview' || section === 'messages' ? 0 : this.data()[section].length;
  });
  protected readonly rows = computed<ContentRecord[]>(() => {
    const section = this.section();
    if (section === 'overview' || section === 'messages') return [];
    return this.data()[section].filter((row) => {
      const status = 'status' in row ? row.status : 'published';
      return (
        (this.filter() === 'all' || status === this.filter()) &&
        this.recordName(row).toLocaleLowerCase().includes(this.query().trim().toLocaleLowerCase())
      );
    });
  });
  protected readonly pageRows = computed(() =>
    this.rows().slice(this.page() * 8, (this.page() + 1) * 8),
  );
  protected readonly filteredMessages = computed(() =>
    this.messages().filter(
      (m) =>
        (this.filter() === 'all' || m.status === this.filter()) &&
        `${m.full_name} ${m.email} ${m.company_name} ${m.description}`
          .toLocaleLowerCase()
          .includes(this.query().trim().toLocaleLowerCase()),
    ),
  );
  protected readonly recentProjects = computed(() =>
    [...this.data().projects]
      .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
      .slice(0, 4),
  );
  protected readonly today = new Date();

  constructor() {
    effect(() => {
      this.section();
      this.query.set('');
      this.filter.set('all');
      this.page.set(0);
      this.menuOpen.set(false);
      this.notice.set('');
      this.error.set('');
    });
    void this.workspace.load();
  }

  /** The Refresh and Try again buttons: always refetch. */
  protected load(): Promise<void> {
    return this.workspace.load(true);
  }

  protected recordName(record: ContentRecord): string {
    if ('name' in record)
      return typeof record.name === 'string' ? record.name : this.store.text(record.name);
    return this.store.text('title' in record ? record.title : record.label);
  }
  protected recordDescription(record: ContentRecord): string {
    if ('summary' in record) return this.store.text(record.summary);
    if ('description' in record) return this.store.text(record.description);
    if ('url' in record) return record.url;
    if ('value' in record) return this.store.text(record.value);
    return `${this.data().projects.filter((p) => p.categories.includes(record.id)).length} ${this.t('admin.projectCount')}`;
  }
  protected recordIcon(record: ContentRecord): IconName {
    return 'icon' in record ? record.icon : 'layers';
  }
  protected categoryName(id: string): string {
    const category = this.data().categories.find((c) => c.id === id);
    return category ? this.store.text(category.name) : '';
  }
  protected statusLabel(status: 'published' | 'draft' | MessageStatus): string {
    return this.t(`admin.${status}`);
  }
  /** The label the visitor picked on the contact form; an unknown value is shown as stored. */
  protected projectTypeLabel(value: string, catalog: Catalog | null = null): string {
    const type = PROJECT_TYPES.find((option) => option.value === value);
    if (!type) return value;
    return catalog ? catalog[type.labelKey] : this.t(type.labelKey);
  }
  protected setQuery(value: string): void {
    this.query.set(value);
    this.page.set(0);
  }
  protected setFilter(value: string): void {
    this.filter.set(value);
    this.page.set(0);
  }
  protected clear(): void {
    this.setQuery('');
    this.setFilter('all');
  }
  protected openEditor(section: Section, record: ContentRecord | null = null): void {
    if (section === 'overview' || section === 'messages') return;
    this.error.set('');
    this.editing.set({ section, record });
    if (section === 'projects') void this.workspace.refreshCategories();
  }

  protected async save(record: ContentRecord): Promise<void> {
    const editing = this.editing();
    if (!editing || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.save(editing.section, record);
      this.data.set(await this.api.load(false));
      await this.store.refresh();
      this.editing.set(null);
      this.notice.set(this.t('admin.saved'));
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected confirmDelete(record: ContentRecord): void {
    const section = this.section();
    if (section === 'overview' || section === 'messages') return;
    this.error.set('');
    this.deleting.set({ section, record });
  }
  protected cancelDelete(): void {
    if (this.busy()) return;
    this.deleting.set(null);
    this.error.set('');
  }
  protected async remove(): Promise<void> {
    const item = this.deleting();
    if (!item || this.busy()) return;
    this.busy.set(true);
    try {
      await this.api.remove(item.section, item.record.id);
      this.data.set(await this.api.load(false));
      await this.store.refresh();
      this.deleting.set(null);
      this.page.set(0);
      this.notice.set(this.t('admin.deleted'));
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
  private errorMessage(error: unknown): string {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
    return this.t(
      code === '23503'
        ? 'admin.categoryInUse'
        : code === '23505'
          ? 'admin.duplicate'
          : 'admin.error',
    );
  }
  protected async openMessage(message: ClientMessage): Promise<void> {
    this.selectedMessage.set(message.id);
    if (message.status === 'new') await this.setMessageStatus(message, 'read');
  }
  protected async setMessageStatus(message: ClientMessage, status: MessageStatus): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.setMessageStatus(message.id, status);
      this.messages.update((messages) =>
        messages.map((m) => (m.id === message.id ? { ...m, status } : m)),
      );
    } catch {
      this.error.set(this.t('admin.error'));
    } finally {
      this.busy.set(false);
    }
  }
  protected replyHref(message: ClientMessage): string {
    const catalog = CATALOGS[isLocale(message.locale) ? message.locale : 'en'];
    const subject = `Re: ${this.projectTypeLabel(message.project_type, catalog)} — DabaDigital`;
    return `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(subject)}`;
  }
  protected async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
      this.workspace.reset();
      await this.router.navigateByUrl('/admin/login');
    } catch {
      this.error.set(this.t('admin.error'));
    }
  }
}
