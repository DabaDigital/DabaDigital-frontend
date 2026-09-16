import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ContentStore } from '../../core/content.store';
import { I18nService } from '../../core/i18n/i18n.service';
import { WorkThumbComponent } from '../home/components/work-thumb.component';

@Component({
  selector: 'app-portfolio-detail-page',
  imports: [RouterLink, WorkThumbComponent],
  templateUrl: './portfolio-detail.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioDetailPage {
  /** Bound from the `:slug` route parameter by `withComponentInputBinding()`. */
  readonly slug = input.required<string>();
  protected readonly content = inject(ContentStore);
  protected readonly t = inject(I18nService).t;
  protected readonly project = computed(() =>
    this.content.projects().find((p) => p.slug === this.slug()),
  );
}
