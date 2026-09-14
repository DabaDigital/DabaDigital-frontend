import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { ScaffoldNoteComponent } from '../../shared/ui/scaffold-note.component';

@Component({
  selector: 'app-portfolio-page',
  imports: [PageHeaderComponent, ScaffoldNoteComponent],
  templateUrl: './portfolio.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioPage {}
