import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../core/i18n/i18n.service';
import { injectMotion } from '../../../core/motion/motion';
import { ButtonComponent } from '../../../shared/ui/button.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { NightVisualComponent } from '../components/night-visual.component';
import { finalCtaMotion } from '../home.motion';

/**
 * Section 6 — the closing call to action: the night opens onto a horizon, an
 * arc of light rises over the rock, and the one bright button leads to the form.
 *
 * Not registered with the section spy: it has no link in the header, and the
 * last section the visitor passed stays highlighted while they read it.
 */
@Component({
  selector: 'app-cta-section',
  imports: [RouterLink, ButtonComponent, IconComponent, NightVisualComponent],
  template: `
    <section class="cta section-rule" aria-labelledby="cta-title">
      <app-night-visual class="cta__visual" variant="horizon" />
      <div class="grain" aria-hidden="true"></div>

      <div class="cta__content container-wide">
        <p class="section-label" data-reveal>
          <span class="section-label__slashes" aria-hidden="true">//</span>
          {{ t('cta.eyebrow') }}
        </p>
        <h2 id="cta-title" class="cta__title" data-reveal>{{ t('cta.title') }}</h2>
        <div data-reveal>
          <a appButton="inverse" routerLink="/" fragment="contact" class="cta__button">
            {{ t('nav.cta') }}
            <app-icon name="arrow-right" class="cta-arrow" />
          </a>
        </div>
      </div>
    </section>
  `,
  styles: `
    @layer components {
      :host {
        display: block;
      }

      .cta {
        position: relative;
        isolation: isolate;
        display: flex;
        min-block-size: clamp(28rem, 78vh, 46rem);
        overflow: clip;
        background-color: var(--surface-page);
      }

      .cta__visual {
        position: absolute;
        inset: 0;
        z-index: -1;
      }

      .cta__content {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-block: clamp(4.5rem, 3rem + 6vw, 8.5rem) clamp(8rem, 4rem + 10vw, 12rem);
        text-align: center;
      }

      .cta__title {
        max-inline-size: 15ch;
        margin-block-start: 1.5rem;
        color: var(--text-strong);
        font-size: clamp(2.25rem, 1.1rem + 3.4vw, 4.25rem);
        font-weight: 600;
        letter-spacing: -0.04em;
        line-height: 1.05;
      }

      :host-context([lang='ar']) .cta__title {
        letter-spacing: 0;
        line-height: 1.35;
      }

      .cta__button {
        gap: 0.75rem;
        min-block-size: 3.25rem;
        margin-block-start: 2.5rem;
        padding-inline: 2rem;
        font-size: 0.9375rem;
      }

      // Narrower than a laptop the picture stacks under the copy (see
      // night-visual.component.scss), so the section grows with the copy and
      // keeps the foot clear for it: as high as the arc's top stands, then a
      // gap under the button.
      @media (max-width: 1023px) {
        .cta {
          min-block-size: 0;
        }

        .cta__content {
          padding-block-end: calc(min(41vw, 50vh) + 4rem);
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CtaSection {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  private readonly visual = viewChild.required(NightVisualComponent);

  constructor() {
    injectMotion((kit) => finalCtaMotion(kit, this.visual()));
  }
}
