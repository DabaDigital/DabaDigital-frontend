import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ContentStore } from '../../../core/content.store';
import { I18nService } from '../../../core/i18n/i18n.service';
import { injectMotion } from '../../../core/motion/motion';
import { SectionSpyDirective } from '../../../shared/directives/section-spy';
import { TeamCardComponent } from '../components/team-card.component';
import { teamMotion } from '../home.motion';

/**
 * Section 5 — the people behind the work: a short heading, then one card per
 * published member, in the order the admin set, with the way to their own
 * portfolio.
 */
@Component({
  selector: 'app-team-section',
  imports: [SectionSpyDirective, TeamCardComponent],
  templateUrl: './team.section.html',
  styleUrl: './team.section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSection {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly content = inject(ContentStore);

  constructor() {
    injectMotion((kit) => teamMotion(kit));
  }
}
