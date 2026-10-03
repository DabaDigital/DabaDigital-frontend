import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type TerrainVariant = 'hero' | 'horizon';

interface Ridge {
  readonly path: string;
  readonly crest: string;
  readonly className: string;
}

const WIDTH = 1600;
const HEIGHT = 520;

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * One mountain range as a jagged silhouette: a few sine waves for the shape of
 * the range, sharpened into crests, roughened per point, and pressed down
 * around the valley so the middle of the picture stays open.
 */
function ridge(
  seed: number,
  base: number,
  amplitude: number,
  valley: { center: number; width: number },
  className: string,
): Ridge {
  const rand = mulberry32(seed);
  const waves = Array.from({ length: 4 }, (_, i) => ({
    frequency: (0.0025 + rand() * 0.004) * (i + 1),
    phase: rand() * Math.PI * 2,
    weight: 1 / (i + 1.4),
  }));
  const points: string[] = [];
  for (let x = 0; x <= WIDTH; x += 16) {
    let shape = 0;
    for (const wave of waves) {
      shape += Math.sin(x * wave.frequency + wave.phase) * wave.weight;
    }
    const crest = Math.pow(Math.max(0, 0.55 + shape * 0.55), 1.6);
    const jitter = (rand() - 0.5) * 0.16;
    const open = smoothstep(valley.width * 0.35, valley.width, Math.abs(x - valley.center));
    const y = base - amplitude * (crest + jitter) * (0.12 + 0.88 * open);
    points.push(`${x} ${y.toFixed(1)}`);
  }
  const line = `M${points.join(' L')}`;
  return { path: `${line} L${WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`, crest: line, className };
}

/**
 * Dark rock at the foot of a night scene, drawn rather than photographed.
 *
 * The static stand-in for the WebGL terrain: what a phone shows, and what a
 * desktop shows until (or unless) the 3D scene is ready. Three ranges at three
 * depths, a cold rim along each crest, and a still pool with a faint streak of
 * reflected light — near black, as the brief asks, so the light does the work.
 *
 * The ridges are generated once from fixed seeds: the same mountains on every
 * visit, without hand-writing a hundred path points. Decorative throughout.
 */
@Component({
  selector: 'app-terrain-art',
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + width + ' ' + height"
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient [attr.id]="ids.rock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" class="stop-rock-top" />
          <stop offset="1" class="stop-night" />
        </linearGradient>
        <linearGradient [attr.id]="ids.pool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" class="stop-pool-top" />
          <stop offset="1" class="stop-night" />
        </linearGradient>
        <radialGradient [attr.id]="ids.streak" cx="0.5" cy="0" r="0.6">
          <stop offset="0" class="stop-streak" />
          <stop offset="1" class="stop-clear" />
        </radialGradient>
      </defs>

      @for (range of ridges(); track range.className) {
        <path
          [attr.d]="range.path"
          [attr.fill]="'url(#' + ids.rock + ')'"
          [attr.class]="range.className"
        />
        <path [attr.d]="range.crest" [attr.class]="range.className + '-crest crest'" />
      }

      <rect
        x="0"
        [attr.y]="poolTop()"
        [attr.width]="width"
        [attr.height]="height - poolTop()"
        [attr.fill]="'url(#' + ids.pool + ')'"
      />
      <ellipse
        [attr.cx]="streakX()"
        [attr.cy]="poolTop()"
        rx="140"
        [attr.ry]="height - poolTop()"
        [attr.fill]="'url(#' + ids.streak + ')'"
      />
    </svg>
  `,
  styles: `
    @layer components {
      :host {
        display: block;
        pointer-events: none;
      }

      svg {
        display: block;
        inline-size: 100%;
        block-size: 100%;
      }

      .stop-rock-top {
        stop-color: color-mix(in srgb, var(--surface-raised) 91%, var(--accent));
      }

      .stop-night {
        stop-color: var(--surface-page);
      }

      .stop-pool-top {
        stop-color: color-mix(in srgb, var(--surface-page) 40%, transparent);
      }

      .stop-streak {
        stop-color: color-mix(in srgb, var(--primary) 26%, transparent);
      }

      .stop-clear {
        stop-color: transparent;
      }

      .far {
        opacity: 0.45;
      }

      .mid {
        opacity: 0.8;
      }

      .crest {
        fill: none;
        stroke: var(--primary);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }

      .far-crest {
        opacity: 0.12;
      }

      .mid-crest {
        opacity: 0.2;
      }

      .near-crest {
        opacity: 0.28;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerrainArtComponent {
  readonly variant = input<TerrainVariant>('hero');
  /** Where the open valley sits, as a fraction of the width (the crystal's side). */
  readonly valley = input(0.64);

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;

  private static count = 0;
  private readonly uid = ++TerrainArtComponent.count;
  protected readonly ids = {
    rock: `terrain-rock-${this.uid}`,
    pool: `terrain-pool-${this.uid}`,
    streak: `terrain-streak-${this.uid}`,
  };

  protected readonly poolTop = computed(() => (this.variant() === 'hero' ? 448 : 430));
  protected readonly streakX = computed(() => this.valley() * WIDTH);

  protected readonly ridges = computed<readonly Ridge[]>(() => {
    const valley = { center: this.valley() * WIDTH, width: this.variant() === 'hero' ? 520 : 640 };
    const lift = this.variant() === 'hero' ? 0 : 18;
    return [
      ridge(11, 330 - lift, 150, valley, 'far'),
      ridge(23, 400 - lift, 210, valley, 'mid'),
      ridge(37, 470, 250, { center: valley.center, width: valley.width * 1.25 }, 'near'),
    ];
  });
}
