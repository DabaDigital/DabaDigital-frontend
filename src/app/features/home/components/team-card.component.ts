import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';

import { I18nService } from '../../../core/i18n/i18n.service';
import { IconComponent } from '../../../shared/ui/icon.component';

/**
 * One person: a portrait, the name, the role, one line about them, and a tile
 * that opens their own portfolio.
 *
 * Every string is an input, already translated — the section owns the content,
 * which the admin manages (`dd_team_members`).
 *
 * Unlike the project and service cards, the card itself is not a link — the
 * portfolio opens in a new tab, and a whole card that does that is too easy to
 * set off while selecting the text. So it does not lift on hover; only the
 * tile responds. A member without a portfolio has no tile.
 *
 * The portrait is ornament (`alt=""`): the name beside it is what a screen
 * reader needs. Until `photo` is set — or while its file is missing — the
 * initials stand in for it.
 */
@Component({
  selector: 'app-team-card',
  imports: [IconComponent],
  template: `
    <article class="team-card">
      <div class="team-card__photo">
        @if (portrait(); as portrait) {
          <img
            [src]="portrait"
            alt=""
            loading="lazy"
            decoding="async"
            class="team-card__image"
            (error)="photoFailed.set(true)"
          />
        } @else {
          <span class="team-card__initials" aria-hidden="true">{{ initials() }}</span>
        }
      </div>

      <div class="team-card__body">
        <h3 class="team-card__name">{{ name() }}</h3>
        <p class="team-card__role">{{ role() }}</p>
        <p class="team-card__bio">{{ bio() }}</p>

        @if (url()) {
          <a [href]="url()" target="_blank" rel="noopener noreferrer" class="team-card__link">
            <span class="team-card__link-icon" aria-hidden="true">
              <app-icon name="external-link" class="team-card__link-glyph" />
            </span>
            <span class="team-card__link-text">
              <span class="team-card__link-label">
                {{ t('team.portfolio') }}
              </span>
              <span class="team-card__link-host">
                {{ host() }}
              </span>
            </span>
            <span class="sr-only">
              {{ t('team.newTab') }}
            </span>
          </a>
        }
      </div>
    </article>
  `,
  styles: `
    @layer components {
      // The card lays itself out by its own width, not the viewport's: the
      // section puts it one-up on a tablet and two-up on a laptop, and the
      // narrowest two-up card is narrower than the one-up tablet card.
      :host {
        display: block;
        block-size: 100%;
        container-type: inline-size;
      }

      // Narrow: the portrait on top, the text under it.
      .team-card {
        display: grid;
        gap: 1.5rem;
        block-size: 100%;
        padding: 1rem;
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-lg);
        // A little translucent, so the section's glow shows through the edge.
        background-color: color-mix(in srgb, var(--surface-card) 86%, transparent);
      }

      .team-card__photo {
        position: relative;
        display: grid;
        place-items: center;
        overflow: hidden;
        aspect-ratio: 5 / 4;
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        background:
          radial-gradient(120% 90% at 30% 10%, var(--glow-brand), transparent 70%),
          var(--surface-raised);
      }

      .team-card__image {
        position: absolute;
        inset: 0;
        inline-size: 100%;
        block-size: 100%;
        object-fit: cover;
        // Faces sit in the upper part of a portrait; keep them in frame
        // whatever the crop.
        object-position: 50% 25%;
      }

      .team-card__initials {
        color: var(--text-strong);
        font-family: var(--font-display);
        font-size: clamp(2.75rem, 2rem + 2vw, 4rem);
        font-weight: 600;
        letter-spacing: -0.04em;
        line-height: 1;
        opacity: 0.88;
      }

      // A column whose last item, the portfolio tile, sits on the card's foot,
      // level with the bottom of the portrait.
      .team-card__body {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        min-inline-size: 0;
        padding: 0.25rem 0.5rem 0.5rem;
      }

      .team-card__name {
        color: var(--text-strong);
        font-size: 1.375rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        line-height: 1.25;
      }

      .team-card__role {
        margin: 0.5rem 0 0;
        color: var(--accent);
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.4;
      }

      .team-card__bio {
        max-inline-size: 32ch;
        margin: 1.25rem 0 1.75rem;
        color: var(--text-muted);
        font-size: 0.875rem;
        line-height: 1.65;
      }

      .team-card__link {
        display: flex;
        align-items: center;
        align-self: stretch;
        gap: 0.875rem;
        margin-block-start: auto;
        padding-block: 0.625rem;
        padding-inline: 0.625rem 1rem;
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        background-color: var(--surface-glass);
        color: var(--text-strong);
        text-decoration: none;
        transition:
          border-color var(--duration-base) var(--ease-standard),
          background-color var(--duration-base) var(--ease-standard);
      }

      .team-card__link:hover {
        border-color: var(--border-strong);
        background-color: var(--surface-raised);
      }

      .team-card__link-icon {
        display: grid;
        flex: none;
        place-items: center;
        inline-size: 2.5rem;
        block-size: 2.5rem;
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-sm);
      }

      // The arrow points out of the box — inline-end, so it mirrors in Arabic —
      // and steps that way on hover.
      .team-card__link-glyph {
        inline-size: 1.125rem;
        block-size: 1.125rem;
        transition: translate var(--duration-base) var(--ease-out);
      }

      .team-card__link:hover .team-card__link-glyph {
        translate: 0.125rem -0.125rem;
      }

      :host-context([dir='rtl']) .team-card__link-glyph {
        scale: -1 1;
      }

      :host-context([dir='rtl']) .team-card__link:hover .team-card__link-glyph {
        translate: -0.125rem -0.125rem;
      }

      .team-card__link-text {
        display: flex;
        flex-direction: column;
        min-inline-size: 0;
        font-size: 0.8125rem;
        line-height: 1.45;
      }

      .team-card__link-label {
        font-weight: 600;
      }

      .team-card__link-host {
        overflow: hidden;
        color: var(--text-muted);
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      // Wide enough for the portrait to stand beside the text. It keeps its
      // ratio as a minimum and stretches to the text's height when a bio (or a
      // translation) runs longer — so the tile always lines up with its foot.
      // The width is pinned to the column: stretched in height, a box with an
      // aspect ratio would otherwise widen to match and run into the text.
      @container (min-width: 28rem) {
        .team-card {
          grid-template-columns: minmax(0, 0.75fr) minmax(0, 1fr);
          gap: 1.25rem;
        }

        .team-card__photo {
          align-self: stretch;
          inline-size: 100%;
          aspect-ratio: 15 / 16;
        }
      }

      // Roomy: the portrait at a fixed width, the text taking the rest.
      @container (min-width: 34rem) {
        .team-card {
          grid-template-columns: minmax(0, 16rem) minmax(0, 1fr);
          gap: 1.75rem;
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamCardComponent {
  /** A person's name is a proper noun, so it is not translated. */
  readonly name = input.required<string>();
  readonly role = input.required<string>();
  readonly bio = input.required<string>();
  /** Their portfolio or profile; '' leaves the tile out. */
  readonly url = input('');
  /** The portrait's address; '' shows the initials. */
  readonly photo = input('');

  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  /**
   * Set when the portrait fails to load (a missing file, a mistyped path), so
   * the card shows the initials rather than a broken image. Starts over
   * whenever the photo changes.
   */
  protected readonly photoFailed = linkedSignal({
    source: this.photo,
    computation: () => false,
  });

  /** The portrait to show, or '' for the initials. */
  protected readonly portrait = computed(() => (this.photoFailed() ? '' : this.photo()));

  /**
   * "Keltoum Malouki" → "KM": the stand-in for a portrait not yet set. The
   * first and last names only, so a long name entered in the admin still fits.
   */
  protected readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/);
    const shown = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
    return shown.map((part) => part.charAt(0).toUpperCase()).join('');
  });

  /** The portfolio address as people say it: no scheme, no trailing slash. */
  protected readonly host = computed(() =>
    this.url()
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, ''),
  );
}
