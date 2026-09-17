import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

import { I18nService } from './core/i18n/i18n.service';
import { ThemeService } from './core/theme/theme.service';
import { SiteFooterComponent } from './shared/layout/site-footer.component';
import { SiteHeaderComponent } from './shared/layout/site-header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  protected readonly isAdmin = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => /^\/admin(?:\/|\?|$)/.test(event.urlAfterRedirects)),
    ),
    { initialValue: /^\/admin(?:\/|\?|$)/.test(this.router.url) },
  );
  protected readonly i18n = inject(I18nService);

  /**
   * Injected for its side effect only: the service owns `data-theme` on `<html>`
   * and the `prefers-color-scheme` listener, and nothing in the shell reads it.
   * Without this line the theme would not exist until the header happened to be
   * rendered — which is true today, and would silently stop being true the day
   * the toggle moves.
   */
  private readonly theme = inject(ThemeService);
}
