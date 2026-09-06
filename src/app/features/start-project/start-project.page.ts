import { ChangeDetectionStrategy, Component } from '@angular/core';

import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { ScaffoldNoteComponent } from '../../shared/ui/scaffold-note.component';

@Component({
  selector: 'app-start-project-page',
  imports: [PageHeaderComponent, ScaffoldNoteComponent],
  templateUrl: './start-project.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartProjectPage {
  /**
   * With `voice.enabled: false` the panel never renders and this page is the manual
   * form and nothing else. That is the safety net, not a fallback path — the form
   * must submit with the whole voice stack switched off.
   */
  protected readonly voiceEnabled = environment.voice.enabled;
}
