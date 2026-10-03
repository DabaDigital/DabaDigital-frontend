import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent, type IconName } from '../../../shared/ui/icon.component';

/**
 * One service: a minimal icon with a little light behind it, a title, a line,
 * and a round arrow. The whole card is one link (on the title, stretched by
 * `.card-link`) to the service on `/services`.
 *
 * Every string is an input, already translated — the section owns the content.
 */
@Component({
  selector: 'app-service-card',
  imports: [RouterLink, IconComponent],
  template: `
    <article class="service-card surface-card card-hit group">
      <span class="service-card__icon">
        <app-icon [name]="icon()" class="size-5" />
      </span>
      <div class="service-card__row">
        <div class="min-w-0">
          <h3 class="service-card__title">
            <a routerLink="/services" [fragment]="id()" class="card-link">{{ title() }}</a>
          </h3>
          <p class="service-card__text">{{ description() }}</p>
        </div>
        <span class="arrow-orb" aria-hidden="true">
          <app-icon name="arrow-right" class="cta-arrow" />
        </span>
      </div>
    </article>
  `,
  styles: `
    @layer components {
      :host {
        display: block;
        block-size: 100%;
      }

      .service-card {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        block-size: 100%;
        padding: 1.5rem;
      }

      .service-card:hover {
        background-color: var(--surface-raised);
      }

      // The icon sits in a dark tile with a little light behind it — the only
      // light on the card, and it brightens on hover.
      .service-card__icon {
        position: relative;
        display: grid;
        place-items: center;
        inline-size: 2.75rem;
        block-size: 2.75rem;
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        background-color: var(--surface-raised);
        color: var(--text-strong);
      }

      .service-card__icon::before {
        content: '';
        position: absolute;
        inset: -1.5rem;
        z-index: -1;
        border-radius: 50%;
        background: radial-gradient(closest-side, var(--glow-primary), transparent);
        opacity: 0.55;
        transition: opacity var(--duration-slow) var(--ease-standard);
      }

      .service-card:hover .service-card__icon::before {
        opacity: 1;
      }

      // Top-aligned, so every title sits on the same line across the row of
      // cards whatever the length of the line under it.
      .service-card__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .service-card__title {
        color: var(--text-strong);
        font-size: 1rem;
        font-weight: 600;
        line-height: 1.35;
      }

      .service-card__title a {
        color: inherit;
        text-decoration: none;
      }

      .service-card__text {
        margin-block-start: 0.5rem;
        color: var(--text-muted);
        font-size: 0.8125rem;
        line-height: 1.6;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceCardComponent {
  /** The service id — the fragment on `/services`. */
  readonly id = input.required<string>();
  readonly icon = input.required<IconName>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
