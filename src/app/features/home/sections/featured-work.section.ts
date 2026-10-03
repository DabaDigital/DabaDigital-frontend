import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ContentStore } from '../../../core/content.store';
import { I18nService } from '../../../core/i18n/i18n.service';
import { injectMotion } from '../../../core/motion/motion';
import { SectionSpyDirective } from '../../../shared/directives/section-spy';
import { ButtonComponent } from '../../../shared/ui/button.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { ProjectCardComponent } from '../components/project-card.component';
import { featuredWorkMotion } from '../home.motion';

/** How many projects the landing page features. The rest live on `/portfolio`. */
const FEATURED_COUNT = 3;

/**
 * Section 2 — featured work: an introduction on one side, three projects on the
 * other. The first three published projects, in the order the admin set; the
 * full, filterable list is one link away on `/portfolio`.
 */
@Component({
  selector: 'app-featured-work-section',
  imports: [RouterLink, ButtonComponent, IconComponent, ProjectCardComponent, SectionSpyDirective],
  templateUrl: './featured-work.section.html',
  styleUrl: './featured-work.section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedWorkSection {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  private readonly content = inject(ContentStore);

  protected readonly featured = computed(() => this.content.projects().slice(0, FEATURED_COUNT));

  constructor() {
    injectMotion((kit) => featuredWorkMotion(kit));
  }
}
