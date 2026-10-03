import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { storageImage, storageSrcset } from '../../core/api/storage-image';
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

  /** Set when a resized copy fails to load; cleared whenever the cover changes. */
  protected readonly resizeFailed = linkedSignal({
    source: () => this.project()?.image_url ?? '',
    computation: () => false,
  });

  /** The cover resized by Supabase (see core/api/storage-image.ts), or the upload itself. */
  protected readonly cover = computed(() => {
    const url = this.project()?.image_url ?? '';
    return this.resizeFailed()
      ? { src: url, srcset: null }
      : { src: storageImage(url, 1280), srcset: storageSrcset(url, [640, 960, 1280, 1600]) };
  });
}
