import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { ScaffoldNoteComponent } from '../../shared/ui/scaffold-note.component';

@Component({
  selector: 'app-services-page',
  imports: [PageHeaderComponent, ScaffoldNoteComponent],
  templateUrl: './services.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesPage {}
