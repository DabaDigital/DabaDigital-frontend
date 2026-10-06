import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { NavigationEnd, NavigationError, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

import { ContentStore } from './core/content.store';
import { I18nService } from './core/i18n/i18n.service';
import { SeoService } from './core/seo/seo.service';
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

  /**
   * False until the first navigation settles. Every route is lazy, so the shell
   * paints before the page does: a footer rendered with it would sit right under
   * the header — on a phone it fills the screen — and then be thrown down the page
   * when the page arrives, a layout shift of nearly a whole viewport (Lighthouse
   * measured CLS 0.91). Held back until then, it first appears below the page.
   * A failed navigation counts too, so a broken chunk still leaves the footer's
   * links to get away from it.
   */
  protected readonly routed = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd || event instanceof NavigationError),
      take(1),
      map(() => true),
    ),
    { initialValue: false },
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

  constructor() {
    effect(() => this.theme.nightLocked.set(!this.isAdmin()));
    // Also for its side effect: the store starts its live read once the shell has
    // painted (see its constructor). Left to the page, a lazy route — a project
    // page, whose content is entirely live — would start it only after its chunk.
    inject(ContentStore);
    // And this one: it owns the title, the meta tags and the structured data of every page,
    // and must be listening before the first navigation ends.
    inject(SeoService);
  }
}
