import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../core/i18n/i18n.service';
import type { MessageKey } from '../../../core/i18n/messages/ar';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { SectionSpyDirective } from '../../../shared/directives/section-spy';
import { ButtonComponent } from '../../../shared/ui/button.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { SearchInputComponent } from '../../../shared/ui/search-input.component';
import {
  SelectButtonsComponent,
  type SelectButtonOption,
} from '../../../shared/ui/select-buttons.component';
import { WorkThumbComponent } from '../components/work-thumb.component';
import { PROJECTS, PROJECT_FILTERS, type Project, type ProjectCategory } from '../home.content';

/** The chip label for each category, so a card's tags read the same as the filters. */
const CATEGORY_LABEL: Readonly<Record<ProjectCategory, MessageKey>> = {
  web: 'projects.filter.web',
  ecommerce: 'projects.filter.ecommerce',
  ai: 'projects.filter.ai',
  mobile: 'projects.filter.mobile',
};

/**
 * Section 3 — the work, searchable and filterable by category.
 *
 * The filter is client-side over a fixed list, so it is a signal and a `computed`
 * and nothing else. When `GET /portfolio` lands, `projects` becomes the resource
 * and `visible` stays exactly as it is.
 */
@Component({
  selector: 'app-projects-section',
  imports: [
    RouterLink,
    ButtonComponent,
    IconComponent,
    SearchInputComponent,
    SelectButtonsComponent,
    WorkThumbComponent,
    RevealDirective,
    SectionSpyDirective,
  ],
  templateUrl: './projects.section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsSection {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  protected readonly filters = computed<readonly SelectButtonOption[]>(() =>
    PROJECT_FILTERS.map((filter) => ({ value: filter.id, label: this.t(filter.labelKey) })),
  );
  protected readonly activeFilter = signal('all');
  protected readonly searchQuery = signal('');

  protected readonly visible = computed<readonly Project[]>(() => {
    const filter = this.activeFilter();
    const query = this.normalizeSearch(this.searchQuery());
    return PROJECTS.filter((project) => {
      const matchesCategory =
        filter === 'all' || project.categories.some((value) => value === filter);
      const searchText = [
        project.name,
        this.t(project.summaryKey),
        ...project.categories.flatMap((category) => [category, this.categoryLabel(category)]),
      ].join(' ');
      return matchesCategory && (!query || this.normalizeSearch(searchText).includes(query));
    });
  });

  protected resetFilters(): void {
    this.activeFilter.set('all');
    this.searchQuery.set('');
  }

  protected categoryLabel(category: ProjectCategory): string {
    return this.t(CATEGORY_LABEL[category]);
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .trim()
      .toLocaleLowerCase(this.i18n.locale());
  }
}
