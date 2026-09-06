import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type WorkTone = 'primary' | 'accent';

/**
 * Placeholder artwork for a featured project card.
 *
 * The real screenshots arrive with the content API (`GET /portfolio`, see
 * `README.md` § Routes). Until then this draws an abstract product surface so
 * the cards have the right weight and the layout is tested against real
 * proportions — an empty grey box would hide every spacing bug.
 *
 * When the API lands, replace the `<app-work-thumb>` element in `home.page.html`
 * with an `<img>` carrying `width`/`height` and a localized `alt`. Nothing else
 * about the card has to change.
 */
@Component({
  selector: 'app-work-thumb',
  template: `
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient [attr.id]="gradientId" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" [attr.stop-color]="hue()" stop-opacity="0.28" />
          <stop offset="100%" [attr.stop-color]="hue()" stop-opacity="0.04" />
        </linearGradient>
      </defs>

      <rect width="400" height="300" [attr.fill]="'url(#' + gradientId + ')'" />

      <!-- Window chrome: reads as "a product", not as a decorative pattern. -->
      <g>
        <rect
          x="32"
          y="30"
          width="336"
          height="240"
          rx="10"
          fill="currentColor"
          fill-opacity="0.05"
          stroke="currentColor"
          stroke-opacity="0.14"
        />
        <path d="M32 58 H368" stroke="currentColor" stroke-opacity="0.14" />
        <g fill="currentColor" fill-opacity="0.22">
          <circle cx="48" cy="44" r="3.5" />
          <circle cx="60" cy="44" r="3.5" />
          <circle cx="72" cy="44" r="3.5" />
        </g>
      </g>

      <!-- Stat row -->
      <g fill="currentColor" fill-opacity="0.09">
        <rect x="48" y="74" width="96" height="40" rx="6" />
        <rect x="152" y="74" width="96" height="40" rx="6" />
        <rect x="256" y="74" width="96" height="40" rx="6" />
      </g>
      <g fill="currentColor" fill-opacity="0.3">
        <rect x="58" y="84" width="40" height="5" rx="2.5" />
        <rect x="162" y="84" width="34" height="5" rx="2.5" />
        <rect x="266" y="84" width="44" height="5" rx="2.5" />
      </g>

      <!-- Trend panel -->
      <rect
        x="48"
        y="126"
        width="200"
        height="128"
        rx="8"
        fill="currentColor"
        fill-opacity="0.07"
      />
      <path
        d="M62 226 L96 198 L124 210 L156 166 L188 184 L220 148 L234 156"
        [attr.stroke]="hue()"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <g fill="currentColor" fill-opacity="0.16">
        <rect x="62" y="140" width="52" height="5" rx="2.5" />
      </g>

      <!-- Bar panel -->
      <rect
        x="256"
        y="126"
        width="96"
        height="128"
        rx="8"
        fill="currentColor"
        fill-opacity="0.07"
      />
      <g [attr.fill]="hue()" fill-opacity="0.75">
        <rect x="270" y="196" width="12" height="42" rx="3" />
        <rect x="290" y="174" width="12" height="64" rx="3" />
        <rect x="310" y="208" width="12" height="30" rx="3" />
        <rect x="330" y="160" width="12" height="78" rx="3" />
      </g>
      <g fill="currentColor" fill-opacity="0.16">
        <rect x="270" y="140" width="40" height="5" rx="2.5" />
      </g>
    </svg>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkThumbComponent {
  readonly tone = input<WorkTone>('primary');

  /** Which token tints the data marks. Everything else rides on `currentColor`. */
  protected readonly hue = computed(() =>
    this.tone() === 'accent' ? 'var(--accent)' : 'var(--primary)',
  );

  /**
   * `<defs>` ids are global to the document, so the id has to be unique per
   * *instance*, not per tone — the projects grid renders several cards sharing a
   * tone, and keying on the tone alone would put duplicate ids in the DOM.
   */
  private readonly instanceId = nextInstanceId();
  protected readonly gradientId = `work-thumb-${this.instanceId}`;
}

let instanceCount = 0;

function nextInstanceId(): number {
  return ++instanceCount;
}
