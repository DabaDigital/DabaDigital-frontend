import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { storageImage, storageSrcset } from '../../../core/api/storage-image';
import { ContentStore } from '../../../core/content.store';
import type { ManagedProject } from '../../../core/models/content.model';
import { IconComponent } from '../../../shared/ui/icon.component';
import { ProjectArtComponent, projectArtVariant } from './project-art.component';

/** The widths a cover is offered at; the uploads themselves stop at about 1670px. */
const COVER_WIDTHS = [480, 640, 960, 1280, 1600] as const;

/**
 * One project, as an image card: the picture fills the card and the text sits
 * on a shade at its foot — category, name, one line, and a round arrow.
 *
 * The whole card is one link, and only one: the anchor is on the title, so its
 * accessible name is the project name, and `.card-link` stretches its hit area
 * over the card. The arrow is ornament (`aria-hidden`).
 *
 * Hover is deliberately small — the image breathes to 1.03, the edge brightens,
 * the card lifts 4px, the arrow steps forward.
 */
@Component({
  selector: 'app-project-card',
  imports: [RouterLink, IconComponent, ProjectArtComponent],
  template: `
    <article class="project-card surface-card card-hit group">
      <div class="project-card__media">
        @if (project().image_url) {
          <!--
            Resized by Supabase (see core/api/storage-image.ts). \`sizes\` is the
            width the picture is drawn at, not the card's: \`object-fit: cover\`
            scales a 16:9 screenshot to the card's height, about twice the width
            of a 9:10 card (1.4× on the 5:4 phone card). The width and height only
            give it an aspect ratio; the stylesheet sets its box.
          -->
          <img
            [src]="cover().src"
            [attr.srcset]="cover().srcset"
            sizes="(min-width: 1024px) 32rem, (min-width: 768px) 65vw, 142vw"
            width="1600"
            height="900"
            alt=""
            loading="lazy"
            decoding="async"
            class="project-card__image"
            (error)="resizeFailed.set(true)"
          />
        } @else {
          <app-project-art
            class="project-card__image"
            [variant]="art()"
            [name]="project().name"
          />
        }
      </div>
      <div class="project-card__shade" aria-hidden="true"></div>

      <div class="project-card__body">
        <div class="min-w-0">
          @if (category()) {
            <p class="project-card__category">{{ category() }}</p>
          }
          <h3 class="project-card__title">
            <a [routerLink]="['/portfolio', project().slug]" class="card-link">
              {{ project().name }}
            </a>
          </h3>
          <p class="project-card__subtitle">{{ content.text(project().summary) }}</p>
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
      }

      // A flex column with the text at its foot, in normal flow: the card itself
      // stays the containing block for the title link's stretched hit area.
      .project-card {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        overflow: hidden;
        aspect-ratio: 9 / 10;
      }

      .project-card__media {
        position: absolute;
        inset: 0;
        z-index: -1;
        overflow: hidden;
        background-color: var(--surface-card);
      }

      .project-card__image {
        display: block;
        inline-size: 100%;
        block-size: 100%;
        object-fit: cover;
        transition: scale 700ms var(--ease-out);
      }

      .project-card:hover .project-card__image {
        scale: 1.03;
      }

      // Darkens the foot of the picture so the text reads on any image.
      .project-card__shade {
        position: absolute;
        inset: 0;
        z-index: -1;
        background: linear-gradient(
          to top,
          color-mix(in srgb, var(--surface-page) 92%, transparent) 0%,
          color-mix(in srgb, var(--surface-page) 55%, transparent) 30%,
          transparent 58%
        );
        pointer-events: none;
      }

      .project-card__body {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.25rem 1.25rem 1.375rem;
      }

      .project-card__category {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.625rem;
        font-weight: 500;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }

      .project-card__title {
        margin-block-start: 0.5rem;
        color: var(--text-strong);
        font-size: 1.125rem;
        font-weight: 600;
        letter-spacing: -0.01em;
        line-height: 1.3;
      }

      .project-card__title a {
        color: inherit;
        text-decoration: none;
      }

      // Wraps rather than truncating: the line is the project's one sentence.
      // Two lines at most, for the narrow three-up row on a tablet.
      .project-card__subtitle {
        display: -webkit-box;
        margin-block-start: 0.25rem;
        overflow: hidden;
        color: var(--text-muted);
        font-size: 0.8125rem;
        line-height: 1.5;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      :host-context([lang='ar']) .project-card__category {
        letter-spacing: 0;
        font-size: 0.75rem;
      }

      @media (max-width: 767px) {
        .project-card {
          aspect-ratio: 5 / 4;
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  readonly project = input.required<ManagedProject>();

  protected readonly content = inject(ContentStore);

  protected readonly art = computed(() => projectArtVariant(this.project()));

  /** Set when a resized copy fails to load; cleared whenever the cover changes. */
  protected readonly resizeFailed = linkedSignal({
    source: () => this.project().image_url,
    computation: () => false,
  });

  /** The cover at a sensible size, or the upload itself if resizing is unavailable. */
  protected readonly cover = computed(() => {
    const url = this.project().image_url;
    return this.resizeFailed()
      ? { src: url, srcset: null }
      : { src: storageImage(url, 960), srcset: storageSrcset(url, COVER_WIDTHS) };
  });

  /** The first category's name, in the visitor's language. */
  protected readonly category = computed(() => {
    const first = this.project().categories[0];
    const match = this.content.content().categories.find((item) => item.id === first);
    return match ? this.content.text(match.name) : '';
  });
}
