import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ScaffoldNoteComponent } from '../../shared/ui/scaffold-note.component';

@Component({
  selector: 'app-confirmation-page',
  imports: [RouterLink, ScaffoldNoteComponent],
  templateUrl: './confirmation.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationPage {}
