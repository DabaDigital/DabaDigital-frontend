import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../core/i18n/i18n.service';
import { ScaffoldNoteComponent } from '../../shared/ui/scaffold-note.component';

@Component({
  selector: 'app-confirmation-page',
  imports: [RouterLink, ScaffoldNoteComponent],
  templateUrl: './confirmation.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationPage {
  /** The landing page in the language on screen. */
  protected readonly home = inject(I18nService).homePath;
}
