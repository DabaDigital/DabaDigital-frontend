import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ProjectArtVariant = 'app' | 'branding' | 'city' | 'abstract';

/** FNV-1a: a stable pick between drawings for projects that do not name one. */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Which drawing stands in for a project without an image. The category decides
 * the family; the slug picks within it, so a project keeps the same picture on
 * every visit and through every filter.
 */
export function projectArtVariant(project: {
  readonly slug: string;
  readonly categories: readonly string[];
}): ProjectArtVariant {
  const categories = project.categories;
  if (categories.includes('branding')) {
    return 'branding';
  }
  if (categories.includes('ai') || categories.includes('mobile')) {
    return 'app';
  }
  const scenes: readonly ProjectArtVariant[] = ['abstract', 'city'];
  return scenes[fnv1a(project.slug) % scenes.length];
}

/**
 * Placeholder artwork for a project card, drawn to sit in the night palette.
 *
 * Real imagery wins whenever it exists: a project with an `image_url` (set in
 * the admin) shows that instead, and this component never renders. Until then
 * each card gets a scene that says what kind of work it was — an app on a
 * phone, a brand on its packaging, a city at night — rather than a grey box.
 *
 * Everything is a token or `currentColor`, apart from the illustration's warm
 * light (`--art-warm`). Decorative: the card's own text names the project.
 */
@Component({
  selector: 'app-project-art',
  template: `
    <svg
      viewBox="0 0 400 440"
      preserveAspectRatio="xMidYMin slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient [attr.id]="id('ground')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" class="stop-raised" />
          <stop offset="1" class="stop-page" />
        </linearGradient>
        <radialGradient [attr.id]="id('glow')" cx="0.62" cy="0.36" r="0.55">
          <stop offset="0" class="stop-glow" />
          <stop offset="1" class="stop-clear" />
        </radialGradient>
        <radialGradient [attr.id]="id('spot')" cx="0.5" cy="0.05" r="0.75">
          <stop offset="0" class="stop-warm-glow" />
          <stop offset="1" class="stop-clear" />
        </radialGradient>
        <linearGradient [attr.id]="id('sky')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" class="stop-page" />
          <stop offset="0.68" class="stop-raised" />
          <stop offset="1" class="stop-horizon" />
        </linearGradient>
        <linearGradient [attr.id]="id('stone')" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" class="stop-warm-deep" />
          <stop offset="0.55" class="stop-warm" />
          <stop offset="1" class="stop-warm-deep" />
        </linearGradient>
        <linearGradient [attr.id]="id('reflect')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" class="stop-warm-glow" />
          <stop offset="1" class="stop-clear" />
        </linearGradient>
        <linearGradient [attr.id]="id('screen')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" class="stop-card" />
          <stop offset="1" class="stop-page" />
        </linearGradient>
      </defs>

      @switch (variant()) {
        @case ('app') {
          <rect width="400" height="440" [attr.fill]="url('ground')" />
          <rect width="400" height="440" [attr.fill]="url('glow')" />
          <circle cx="300" cy="96" r="176" class="hairline" />
          <path
            d="M0 372 34 344 62 356 96 318 132 348 168 330 196 352 232 326 272 360 312 338 352 366 400 342V440H0Z"
            class="rock"
          />
          <g transform="translate(176 26) rotate(-17)">
            <rect width="196" height="388" rx="32" class="device" />
            <rect x="8" y="8" width="180" height="372" rx="25" [attr.fill]="url('screen')" />
            <rect x="72" y="17" width="52" height="12" rx="6" class="device-notch" />
            <circle cx="36" cy="60" r="9" class="ui-ring" />
            <text x="54" y="66" class="ui-brand">{{ name() }}</text>
            @for (row of rows; track $index) {
              <rect
                x="20"
                [attr.y]="98 + $index * 44"
                width="156"
                height="34"
                rx="10"
                class="ui-row"
                [class.is-active]="$index === 0"
              />
              <rect x="31" [attr.y]="107 + $index * 44" width="16" height="16" rx="4" class="ui-icon" />
              <rect x="57" [attr.y]="112 + $index * 44" [attr.width]="row" height="6" rx="3" class="ui-text" />
            }
            <path d="M24 344 52 326 78 332 104 310 132 316 160 292" class="ui-spark" />
            <path d="M188 40V330" class="device-edge" />
          </g>
        }

        @case ('branding') {
          <rect width="400" height="440" [attr.fill]="url('ground')" />
          <rect width="400" height="440" [attr.fill]="url('spot')" />
          <rect y="338" width="400" height="102" class="floor" />
          <ellipse cx="150" cy="342" rx="104" ry="9" class="floor-shadow" />
          <ellipse cx="276" cy="368" rx="84" ry="8" class="floor-shadow" />

          <!-- The tall bag, further back. -->
          <g transform="translate(70 104)">
            <path d="M152 22 182 38V238L152 222Z" class="bag-side" />
            <rect y="22" width="152" height="200" class="bag-front" />
            <path d="M0 22H152L182 38H30Z" class="bag-top" />
            <path d="M44 24C44-22 108-22 108 24" class="bag-handle" />
            <text x="76" y="134" class="bag-mono">{{ initials() }}</text>
            <path d="M152 22V222" class="bag-rim" />
          </g>

          <!-- The short bag, in front. -->
          <g transform="translate(206 196)">
            <path d="M120 16 144 30V174L120 160Z" class="bag-side" />
            <rect y="16" width="120" height="144" class="bag-front bag-front--near" />
            <path d="M0 16H120L144 30H24Z" class="bag-top" />
            <path d="M34 18C34-18 86-18 86 18" class="bag-handle" />
            <text x="60" y="100" class="bag-mono bag-mono--small">{{ initials() }}</text>
            <path d="M120 16V160" class="bag-rim" />
          </g>
        }

        @case ('city') {
          <rect width="400" height="440" [attr.fill]="url('sky')" />
          <g class="stars">
            <circle cx="42" cy="44" r="1" />
            <circle cx="118" cy="82" r="0.8" />
            <circle cx="186" cy="36" r="1.1" />
            <circle cx="330" cy="58" r="0.9" />
            <circle cx="366" cy="120" r="0.7" />
            <circle cx="78" cy="150" r="0.7" />
          </g>

          <!-- The far city, a low band of lit windows. -->
          <path
            d="M0 300V276H22V284H40V262H56V280H80V270H96V300ZM300 300V272H316V282H334V258H350V276H372V266H400V300Z"
            class="skyline"
          />
          <g class="city-lights">
            <rect x="8" y="284" width="3" height="3" />
            <rect x="46" y="270" width="3" height="3" />
            <rect x="62" y="288" width="3" height="3" />
            <rect x="86" y="278" width="3" height="3" />
            <rect x="306" y="280" width="3" height="3" />
            <rect x="340" y="266" width="3" height="3" />
            <rect x="358" y="284" width="3" height="3" />
            <rect x="380" y="272" width="3" height="3" />
          </g>

          <!-- The prayer hall: a long low body with lit arches. -->
          <path d="M150 300V258H380V300Z" class="hall" />
          @for (arch of arches; track arch) {
            <path
              [attr.d]="'M' + arch + ' 292V276Q' + (arch + 6) + ' 266 ' + (arch + 12) + ' 276V292Z'"
              class="arch"
            />
          }

          <!-- The minaret, lit from below. -->
          <g>
            <rect x="236" y="104" width="36" height="196" [attr.fill]="url('stone')" />
            <path d="M236 140H272M236 182H272M236 224H272" class="band" />
            <rect x="248" y="150" width="4" height="22" class="slit" />
            <rect x="256" y="150" width="4" height="22" class="slit" />
            <rect x="248" y="194" width="4" height="22" class="slit" />
            <rect x="256" y="194" width="4" height="22" class="slit" />
            <rect x="241" y="80" width="26" height="26" [attr.fill]="url('stone')" />
            <path d="M241 80Q254 58 267 80Z" class="dome" />
            <path d="M254 60V40" class="finial" />
            <circle cx="254" cy="38" r="2.5" class="finial-ball" />
          </g>
          <ellipse cx="254" cy="110" rx="70" ry="120" class="halo" />

          <!-- A palm in the foreground, in silhouette. -->
          <g class="palm">
            <path d="M92 304C94 252 98 214 108 178" class="trunk" />
            <path d="M108 178C86 164 62 166 40 184M108 178C96 152 72 140 50 142M108 178C116 150 136 138 160 140M108 178C130 168 154 170 172 186M108 178C104 156 108 136 120 120" />
          </g>

          <rect y="300" width="400" height="4" class="quay" />
          <g class="quay-lights">
            @for (light of quayLights; track light) {
              <circle [attr.cx]="light" cy="298" r="1.6" />
            }
          </g>
          <rect y="304" width="400" height="136" class="water" />
          <rect x="238" y="306" width="32" height="118" [attr.fill]="url('reflect')" class="ripple" />
          <rect x="160" y="306" width="10" height="64" [attr.fill]="url('reflect')" class="ripple ripple--faint" />
          <rect x="330" y="306" width="10" height="70" [attr.fill]="url('reflect')" class="ripple ripple--faint" />
        }

        @default {
          <rect width="400" height="440" [attr.fill]="url('ground')" />
          <rect width="400" height="440" [attr.fill]="url('glow')" />
          <path d="M0 330H400M0 370H400M0 410H400M80 300V440M180 300V440M280 300V440" class="grid" />
          <circle cx="220" cy="190" r="112" class="hairline hairline--bright" />
          <polygon points="220,92 286,170 252,292 182,286 150,180" class="shard" />
          <polygon points="220,92 286,170 220,196" class="shard shard--lit" />
          <path d="M220 92 286 170 252 292" class="shard-edge" />
        }
      }
    </svg>
  `,
  styles: `
    @layer components {
      :host {
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

      .stop-glow {
        stop-color: color-mix(in srgb, var(--accent) 24%, transparent);
      }

      .stop-clear {
        stop-color: transparent;
      }

      .stop-warm {
        stop-color: var(--art-warm);
      }

      .stop-warm-deep {
        stop-color: var(--art-warm-deep);
      }

      .stop-warm-glow {
        stop-color: color-mix(in srgb, var(--art-warm) 30%, transparent);
      }

      .stop-horizon {
        stop-color: color-mix(in srgb, var(--surface-raised) 80%, var(--art-warm-deep));
      }

      .hairline {
        stroke: color-mix(in srgb, var(--primary) 20%, transparent);
        stroke-width: 1;
      }

      .hairline--bright {
        stroke: color-mix(in srgb, var(--primary) 45%, transparent);
      }

      .rock {
        fill: var(--surface-page);
        stroke: color-mix(in srgb, var(--primary) 14%, transparent);
      }

      /* ── App ─────────────────────────────────────────────────── */

      .device {
        fill: var(--device-frame);
        stroke: color-mix(in srgb, var(--primary) 28%, transparent);
      }

      .device-notch {
        fill: var(--device-frame);
      }

      .device-edge {
        stroke: color-mix(in srgb, var(--primary) 55%, transparent);
        stroke-width: 1.5;
        stroke-linecap: round;
      }

      .ui-ring {
        stroke: var(--primary);
        stroke-width: 2;
      }

      .ui-brand {
        fill: var(--text-strong);
        font-family: var(--font-display);
        font-size: 17px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .ui-row {
        fill: transparent;
      }

      .ui-row.is-active {
        fill: var(--primary-soft);
        stroke: color-mix(in srgb, var(--primary) 22%, transparent);
      }

      .ui-icon {
        stroke: color-mix(in srgb, var(--primary) 70%, transparent);
        stroke-width: 1.5;
      }

      .ui-text {
        fill: var(--text-muted);
        opacity: 0.6;
      }

      .ui-spark {
        stroke: var(--accent);
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      /* ── Branding ────────────────────────────────────────────── */

      .floor {
        fill: color-mix(in srgb, var(--surface-page) 70%, var(--surface-raised));
      }

      .floor-shadow {
        fill: var(--surface-page);
        opacity: 0.9;
      }

      .bag-front {
        fill: var(--surface-card);
        stroke: color-mix(in srgb, var(--art-warm) 18%, transparent);
      }

      .bag-front--near {
        fill: var(--surface-raised);
      }

      .bag-side {
        fill: var(--surface-page);
      }

      .bag-top {
        fill: var(--surface-raised);
      }

      .bag-handle {
        stroke: color-mix(in srgb, var(--text-strong) 70%, transparent);
        stroke-width: 2.5;
        stroke-linecap: round;
      }

      .bag-rim {
        stroke: color-mix(in srgb, var(--art-warm) 55%, transparent);
        stroke-width: 1.5;
      }

      .bag-mono {
        fill: var(--text-strong);
        font-family: var(--font-display);
        font-size: 40px;
        font-weight: 700;
        letter-spacing: -0.04em;
        text-anchor: middle;
      }

      .bag-mono--small {
        font-size: 30px;
      }

      /* ── City ────────────────────────────────────────────────── */

      .stars circle {
        fill: var(--text-strong);
        opacity: 0.7;
      }

      .skyline {
        fill: var(--surface-card);
      }

      .city-lights rect,
      .quay-lights circle {
        fill: var(--art-warm);
      }

      .hall {
        fill: color-mix(in srgb, var(--surface-card) 70%, var(--art-warm-deep));
      }

      .arch {
        fill: var(--art-warm);
        opacity: 0.85;
      }

      .band {
        stroke: color-mix(in srgb, var(--surface-page) 45%, transparent);
        stroke-width: 2;
      }

      .slit {
        fill: color-mix(in srgb, var(--surface-page) 60%, transparent);
      }

      .dome {
        fill: var(--art-warm-deep);
      }

      .finial {
        stroke: var(--art-warm);
        stroke-width: 2;
      }

      .finial-ball {
        fill: var(--art-warm);
      }

      .halo {
        fill: color-mix(in srgb, var(--art-warm) 9%, transparent);
      }

      .palm path {
        stroke: var(--surface-page);
        stroke-width: 7;
        stroke-linecap: round;
        fill: none;
      }

      .palm .trunk {
        stroke-width: 9;
      }

      .quay {
        fill: color-mix(in srgb, var(--surface-card) 60%, var(--art-warm-deep));
      }

      .water {
        fill: color-mix(in srgb, var(--surface-page) 85%, var(--accent));
      }

      .ripple {
        opacity: 0.9;
      }

      .ripple--faint {
        opacity: 0.5;
      }

      /* ── Abstract ────────────────────────────────────────────── */

      .grid {
        stroke: color-mix(in srgb, var(--primary) 8%, transparent);
      }

      .shard {
        fill: color-mix(in srgb, var(--surface-raised) 70%, var(--accent));
        stroke: color-mix(in srgb, var(--primary) 30%, transparent);
      }

      .shard--lit {
        fill: color-mix(in srgb, var(--primary) 45%, var(--surface-card));
      }

      .shard-edge {
        stroke: var(--primary);
        stroke-width: 1.5;
        stroke-linejoin: round;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectArtComponent {
  readonly variant = input<ProjectArtVariant>('abstract');
  /** The project's name — shown on the drawn product (a proper noun, never translated). */
  readonly name = input('');

  /** Two initials for the drawn packaging: "Le Maître du Sandwich" → "MS". */
  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .slice(0, 2)
      .map((word) => word.charAt(0).toLocaleUpperCase())
      .join(''),
  );

  /** Widths of the menu lines on the drawn phone. */
  protected readonly rows = [84, 62, 92, 70, 56];
  protected readonly arches = [168, 196, 288, 316, 344];
  protected readonly quayLights = [20, 64, 108, 152, 196, 240, 284, 328, 372];

  private static count = 0;
  private readonly uid = ++ProjectArtComponent.count;

  protected id(name: string): string {
    return `art-${name}-${this.uid}`;
  }

  protected url(name: string): string {
    return `url(#${this.id(name)})`;
  }
}
