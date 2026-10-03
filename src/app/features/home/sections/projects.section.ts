import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { ContentStore } from '../../../core/content.store';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { ManagedProject } from '../../../core/models/content.model';
import { ButtonComponent } from '../../../shared/ui/button.component';
import { SearchInputComponent } from '../../../shared/ui/search-input.component';
import {
  SelectButtonsComponent,
  type SelectButtonOption,
} from '../../../shared/ui/select-buttons.component';
import { ProjectCardComponent } from '../components/project-card.component';

/**
 * Every project, searchable and filterable by category — the `/portfolio` page.
 * (The landing page features three in `FeaturedWorkSection` and links here.)
 *
 * The filter is client-side over the published list, so it is a signal and a
 * `computed` and nothing else.
 */
@Component({
  selector: 'app-projects-section',
  imports: [ButtonComponent, ProjectCardComponent, SearchInputComponent, SelectButtonsComponent],
  templateUrl: './projects.section.html',
  styles: `
    @layer components {
      :host {
        display: block;
        padding-block-end: var(--section-space);
      }

      .portfolio__tools {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      @media (min-width: 1024px) {
        .portfolio__tools {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }

        .portfolio__search {
          inline-size: 100%;
          max-inline-size: 24rem;
        }
      }

      .portfolio__grid {
        display: grid;
        gap: 1.25rem;
        margin: 2.5rem 0 0;
        padding: 0;
        list-style: none;
      }

      @media (min-width: 640px) {
        .portfolio__grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (min-width: 1024px) {
        .portfolio__grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      .portfolio__empty {
        margin-block-start: 2.5rem;
        padding: 4rem 1.5rem;
        border: 1px dashed var(--border-strong);
        border-radius: var(--radius-lg);
        text-align: center;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsSection {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  private readonly content = inject(ContentStore);

  protected readonly filters = computed<readonly SelectButtonOption[]>(() => [
    { value: 'all', label: this.t('projects.filter.all') },
    ...this.content
      .content()
      .categories.map((category) => ({
        value: category.id,
        label: this.content.text(category.name),
      })),
  ]);
  protected readonly activeFilter = signal('all');
  protected readonly searchQuery = signal('');

  protected readonly visible = computed<readonly ManagedProject[]>(() => {
    const filter = this.activeFilter();
    const query = this.normalizeSearch(this.searchQuery());
    return this.content.projects().filter((project) => {
      const matchesCategory =
        filter === 'all' || project.categories.some((value) => value === filter);
      const searchText = [
        project.name,
        this.content.text(project.summary),
        ...project.categories.flatMap((category) => [category, this.categoryLabel(category)]),
      ].join(' ');
      return matchesCategory && (!query || this.normalizeSearch(searchText).includes(query));
    });
  });

  protected resetFilters(): void {
    this.activeFilter.set('all');
    this.searchQuery.set('');
  }

  private categoryLabel(category: string): string {
    const item = this.content.content().categories.find((entry) => entry.id === category);
    return item ? this.content.text(item.name) : '';
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .trim()
      .toLocaleLowerCase(this.i18n.locale());
  }
}
