import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LogoComponent } from '../../../shared/ui/logo.component';

/** Building outlines for the city seen through the windows: x, width, height. */
const LEFT_CITY: readonly (readonly [number, number, number])[] = [
  [0, 26, 150],
  [30, 18, 210],
  [52, 30, 120],
  [86, 22, 180],
  [112, 34, 96],
  [148, 20, 140],
];
const RIGHT_CITY: readonly (readonly [number, number, number])[] = [
  [508, 24, 120],
  [536, 18, 190],
  [558, 30, 140],
  [592, 22, 220],
  [618, 26, 110],
];

/**
 * A stand-in for the studio photograph: a dark office at night, the city
 * through floor-to-ceiling glass, one warm line of light, laptops lit on a long
 * table, and the Daba Digital wordmark on the back wall — the real mark, glowing
 * (it is the `app-logo` asset, laid over the drawing).
 *
 * Replace it with a photograph by setting `ABOUT_IMAGE` in `home.content.ts`;
 * the section then shows the picture and never renders this. Decorative.
 */
@Component({
  selector: 'app-office-art',
  imports: [LogoComponent],
  host: { 'aria-hidden': 'true' },
  template: `
    <svg
      viewBox="0 0 640 420"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="office-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" class="stop-raised" />
          <stop offset="1" class="stop-card" />
        </linearGradient>
        <linearGradient id="office-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" class="stop-card" />
          <stop offset="1" class="stop-page" />
        </linearGradient>
        <linearGradient id="office-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" class="stop-page" />
          <stop offset="1" class="stop-sky" />
        </linearGradient>
        <radialGradient id="office-pool" cx="0.5" cy="0" r="0.8">
          <stop offset="0" class="stop-warm-glow" />
          <stop offset="1" class="stop-clear" />
        </radialGradient>
        <clipPath id="office-left-glass">
          <path d="M0 0 170 70V300L0 420Z" />
        </clipPath>
        <clipPath id="office-right-glass">
          <path d="M640 0 500 70V300L640 420Z" />
        </clipPath>
      </defs>

      <!-- Ceiling, back wall, floor. -->
      <path d="M0 0H640L500 70H170Z" class="ceiling" />
      <rect x="170" y="70" width="330" height="230" fill="url(#office-wall)" />
      <path d="M0 420H640L500 300H170Z" fill="url(#office-floor)" />

      <!-- The city through the glass, both sides. -->
      <g clip-path="url(#office-left-glass)">
        <rect width="170" height="420" fill="url(#office-sky)" />
        @for (block of leftCity; track block[0]) {
          <rect [attr.x]="block[0]" [attr.y]="330 - block[2]" [attr.width]="block[1]" [attr.height]="block[2] + 90" class="tower" />
          @for (row of windowRows(block[2]); track row) {
            <rect [attr.x]="block[0] + 5" [attr.y]="336 - block[2] + row" width="3" height="3" class="lit" />
            <rect [attr.x]="block[0] + block[1] - 9" [attr.y]="342 - block[2] + row" width="3" height="3" class="lit lit--cold" />
          }
        }
        <path d="M58 24V384M116 48V350" class="mullion" />
      </g>
      <g clip-path="url(#office-right-glass)">
        <rect x="500" width="140" height="420" fill="url(#office-sky)" />
        @for (block of rightCity; track block[0]) {
          <rect [attr.x]="block[0]" [attr.y]="330 - block[2]" [attr.width]="block[1]" [attr.height]="block[2] + 90" class="tower" />
          @for (row of windowRows(block[2]); track row) {
            <rect [attr.x]="block[0] + 6" [attr.y]="338 - block[2] + row" width="3" height="3" class="lit" />
          }
        }
        <path d="M570 36V364" class="mullion" />
      </g>
      <path d="M170 70V300M500 70V300" class="frame" />

      <!-- One warm line of light along the ceiling, down the corner. -->
      <path d="M190 70H480" class="led" />
      <path d="M500 74V296" class="led led--soft" />
      <rect x="170" y="296" width="330" height="60" fill="url(#office-pool)" />

      <!-- The long table, its laptops, its chairs. -->
      <path d="M196 300H474L548 364H122Z" class="table" />
      <path d="M196 300H474" class="table-edge" />
      <g class="laptop">
        <path d="M232 296 244 280H272L266 296Z" />
        <path d="M312 296 320 278H350L346 296Z" />
        <path d="M394 296 398 280H426L428 296Z" />
      </g>
      <g class="chair">
        <rect x="150" y="318" width="34" height="56" rx="8" />
        <rect x="214" y="352" width="38" height="58" rx="9" />
        <rect x="300" y="356" width="40" height="60" rx="9" />
        <rect x="390" y="352" width="38" height="58" rx="9" />
        <rect x="486" y="318" width="34" height="56" rx="8" />
      </g>

      <!-- A plant by the glass. -->
      <g class="plant">
        <path d="M560 300C548 252 520 230 492 222M560 300C562 250 584 214 612 204M560 300C570 262 598 250 624 252M560 300C540 268 512 268 492 276M560 300C556 244 560 206 572 176" />
        <path d="M546 300H574L570 340H550Z" class="pot" />
      </g>
    </svg>

    <app-logo class="office-mark" />
  `,
  styles: `
    @layer components {
      :host {
        position: relative;
        display: block;
        overflow: hidden;
        background-color: var(--surface-page);
      }

      svg {
        display: block;
        inline-size: 100%;
        block-size: 100%;
      }

      .stop-raised {
        stop-color: var(--surface-raised);
      }

      .stop-card {
        stop-color: var(--surface-card);
      }

      .stop-page {
        stop-color: var(--surface-page);
      }

      .stop-sky {
        stop-color: color-mix(in srgb, var(--surface-card) 70%, var(--accent));
      }

      .stop-warm-glow {
        stop-color: color-mix(in srgb, var(--art-warm) 16%, transparent);
      }

      .stop-clear {
        stop-color: transparent;
      }

      .ceiling {
        fill: var(--surface-page);
      }

      .tower {
        fill: var(--surface-page);
      }

      .lit {
        fill: var(--art-warm);
        opacity: 0.75;
      }

      .lit--cold {
        fill: var(--primary);
        opacity: 0.45;
      }

      .mullion,
      .frame {
        stroke: var(--surface-page);
        stroke-width: 4;
      }

      .frame {
        stroke: var(--surface-card);
        stroke-width: 3;
      }

      .led {
        stroke: var(--art-warm);
        stroke-width: 2;
        stroke-linecap: round;
        filter: drop-shadow(0 0 0.375rem var(--art-warm-deep));
      }

      .led--soft {
        opacity: 0.7;
      }

      .table {
        fill: var(--surface-raised);
      }

      .table-edge {
        stroke: color-mix(in srgb, var(--art-warm) 40%, transparent);
        stroke-width: 1.5;
      }

      .laptop path {
        fill: color-mix(in srgb, var(--primary) 40%, var(--surface-card));
        filter: drop-shadow(0 0 0.3125rem color-mix(in srgb, var(--primary) 50%, transparent));
      }

      .chair rect {
        fill: var(--surface-page);
        stroke: color-mix(in srgb, var(--text-strong) 8%, transparent);
      }

      .plant path {
        stroke: var(--surface-page);
        stroke-width: 6;
        stroke-linecap: round;
      }

      .plant .pot {
        fill: var(--surface-page);
        stroke: none;
      }

      // The real wordmark, lit on the back wall.
      .office-mark {
        position: absolute;
        left: 52%;
        top: 37%;
        block-size: 15%;
        color: var(--text-strong);
        filter: drop-shadow(0 0 0.75rem color-mix(in srgb, var(--primary) 55%, transparent));
        opacity: 0.92;
        translate: -50% -50%;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfficeArtComponent {
  protected readonly leftCity = LEFT_CITY;
  protected readonly rightCity = RIGHT_CITY;

  /** Lit windows every 14 units up a tower, from just under its roof. */
  protected windowRows(height: number): readonly number[] {
    return Array.from({ length: Math.max(0, Math.floor((height - 10) / 14)) }, (_, i) => i * 14);
  }
}
