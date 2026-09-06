import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The DabaDigital wordmark.
 *
 * Painted as a CSS mask over `currentColor` rather than as an `<img>`. The
 * supplied brand files are presentation renders — the white mark burned onto a
 * blue plate, with no alpha — so dropping one into the header would put a blue
 * rectangle in the nav bar. `public/dabadigital-logo.webp` is that same mark with
 * the plate keyed out into an alpha channel; the geometry is untouched, only the
 * background is gone.
 *
 * Masking it over `currentColor` means one asset serves both themes: the mark
 * inherits `--text-strong`, so it is near-white on the dark surface and near-black
 * on the light one, and it can never drift out of step with the palette.
 *
 * The mark is `aria-hidden` — it is a picture of the company name, so the
 * accessible name belongs to whatever wraps it (`aria-label` on the link, or the
 * `.sr-only` text beside it). Size it by setting a height on the host:
 * `<app-logo class="h-8" />`.
 */
@Component({
  selector: 'app-logo',
  template: `<span class="mark" aria-hidden="true"></span>`,
  styles: `
    :host {
      display: block;
      /* Falls back to the header size when the caller sets no height. */
      block-size: 2rem;
    }

    .mark {
      display: block;
      block-size: 100%;
      /* The intrinsic ratio of the keyed asset (311 × 160), so the host only
         ever needs a height and the width follows. */
      aspect-ratio: 311 / 160;
      background-color: currentColor;
      -webkit-mask: url('/dabadigital-logo.webp') no-repeat center / contain;
      mask: url('/dabadigital-logo.webp') no-repeat center / contain;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {}
