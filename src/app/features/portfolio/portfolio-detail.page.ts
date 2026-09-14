import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ScaffoldNoteComponent } from '../../shared/ui/scaffold-note.component';

@Component({
  selector: 'app-portfolio-detail-page',
  imports: [RouterLink, ScaffoldNoteComponent],
  templateUrl: './portfolio-detail.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioDetailPage {
  /** Bound from the `:slug` route parameter by `withComponentInputBinding()`. */
  readonly slug = input.required<string>();
}
