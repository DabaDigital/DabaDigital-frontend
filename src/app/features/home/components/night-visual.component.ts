import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { I18nService } from '../../../core/i18n/i18n.service';
import type { NightScene, NightSceneVariant } from '../scene/night-scene';
import { TerrainArtComponent } from './terrain-art.component';

/** The screens the 3D scene is drawn for: wide, with a fine pointer. */
const SCENE_MEDIA = '(min-width: 1024px) and (pointer: fine)';

/**
 * The night behind the banner (`hero`) and the closing call to action (`horizon`).
 *
 * Two layers, one picture:
 *
 * 1. **Static art**, painted with the first frame: an SVG crystal in its orbit
 *    ring, a CSS arc of light, drawn rock. This is the whole visual on a phone
 *    (only the horizon shows there — the banner leaves its visual out below
 *    1024px), under `prefers-reduced-data`/Save-Data, and wherever WebGL is
 *    missing — and it is what a desktop sees until the 3D scene is ready.
 * 2. **The WebGL scene** (`scene/night-scene.ts`), desktop only (a wide screen
 *    with a fine pointer). It is a separate chunk, imported when the browser is
 *    idle (banner) or when the section comes within a screen of the viewport
 *    (horizon), so Three.js never delays first paint and never loads on a
 *    phone. It renders outside Angular's zone, pauses whenever it is off
 *    screen or the tab is hidden, and fades in over the static art once its
 *    first frame is drawn. If the window narrows below a desktop's after that
 *    (a resized window, a phone preview in the devtools), it pauses and hands
 *    back to the static art, which has a layout for narrow screens and the
 *    scene's camera does not, until the window is wide again.
 *
 * Decorative throughout: the host is `aria-hidden`.
 */
@Component({
  selector: 'app-night-visual',
  imports: [TerrainArtComponent],
  host: {
    'aria-hidden': 'true',
    '[class]': "'night-visual night-visual--' + variant()",
    '[class.is-live]': 'live()',
  },
  template: `
    <div class="nv-static">
      <div class="nv-glow"></div>
      <div class="nv-arc"></div>
      <app-terrain-art class="nv-terrain" [variant]="variant()" [valley]="valley()" />

      @if (variant() === 'hero') {
        <div class="nv-object">
          <svg
            class="nv-crystal"
            viewBox="0 0 400 440"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient [attr.id]="ids.sheen" x1="1" y1="0" x2="0.2" y2="0.9">
                <stop offset="0" class="stop-sheen" />
                <stop offset="0.55" class="stop-clear" />
              </linearGradient>
            </defs>

            <!-- The far half of the orbit, behind the stone. -->
            <g class="nv-ring" transform="rotate(-16 204 222)">
              <path class="nv-ring__line" d="M12 222 A192 54 0 0 1 396 222" />
              <path
                class="nv-ring__glint nv-ring__glint--far"
                d="M12 222 A192 54 0 0 1 396 222"
                pathLength="100"
              />
            </g>

            <!-- Edges seen through the glass, under the facets. -->
            <g class="nv-inner">
              <path d="M120 128 246 244M304 150 154 252M90 222 290 300M176 98 214 334M258 104 122 312" />
            </g>

            <g class="nv-facets">
              <polygon class="t2" points="214,30 120,128 176,98" />
              <polygon class="t4" points="214,30 176,98 258,104" />
              <polygon class="t5" points="214,30 258,104 304,150" />
              <polygon class="t0" points="120,128 90,222 154,252" />
              <polygon class="t1" points="120,128 176,98 154,252" />
              <polygon class="t3" points="176,98 154,252 246,244" />
              <polygon class="t2" points="176,98 258,104 246,244" />
              <polygon class="t4" points="258,104 246,244 318,214" />
              <polygon class="t5" points="258,104 304,150 318,214" />
              <polygon class="t0" points="90,222 122,312 154,252" />
              <polygon class="t1" points="154,252 122,312 214,334" />
              <polygon class="t2" points="154,252 214,334 246,244" />
              <polygon class="t3" points="246,244 214,334 290,300" />
              <polygon class="t2" points="246,244 290,300 318,214" />
              <polygon class="t0" points="122,312 188,410 214,334" />
              <polygon class="t1" points="214,334 188,410 290,300" />
            </g>

            <polygon
              class="nv-sheen"
              [attr.fill]="'url(#' + ids.sheen + ')'"
              points="214,30 304,150 318,214 290,300 188,410 122,312 90,222 120,128"
            />

            <!-- Where the light catches: the right-hand edges and a few corners. -->
            <g class="nv-highlight">
              <path class="strong" d="M214 30 304 150 318 214" />
              <path d="M214 30 258 104 246 244M258 104 318 214M318 214 290 300 188 410" />
            </g>
            <g class="nv-glints">
              <path d="M214 22v16M206 30h16" />
              <path d="M304 143v14M297 150h14" />
              <path d="M318 208v12M312 214h12" />
            </g>

            <!-- The near half of the orbit, in front of the stone. -->
            <g class="nv-ring" transform="rotate(-16 204 222)">
              <path class="nv-ring__line" d="M396 222 A192 54 0 0 1 12 222" />
              <path
                class="nv-ring__glint"
                d="M396 222 A192 54 0 0 1 12 222"
                pathLength="100"
              />
            </g>
          </svg>
        </div>
      }
    </div>

    <canvas #canvas class="nv-canvas"></canvas>
  `,
  styleUrl: './night-visual.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NightVisualComponent {
  readonly variant = input<NightSceneVariant>('hero');

  private readonly i18n = inject(I18nService);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  /** True once the WebGL scene has drawn its first frame and taken over. */
  protected readonly live = signal(false);
  /** The open valley in the drawn rock follows the crystal's side. */
  protected readonly valley = computed(() =>
    this.variant() === 'horizon' ? 0.5 : this.i18n.meta().dir === 'rtl' ? 0.36 : 0.64,
  );

  private static count = 0;
  protected readonly ids = { sheen: `nv-sheen-${++NightVisualComponent.count}` };

  private scene?: NightScene;
  private progress = 0;
  /** False while the window is narrower than the scene is drawn for. */
  private wide = true;
  private disposed = false;
  private readonly cleanups: (() => void)[] = [];

  constructor() {
    afterNextRender(() => this.zone.runOutsideAngular(() => this.schedule()));
    inject(DestroyRef).onDestroy(() => {
      this.disposed = true;
      this.cleanups.forEach((cleanup) => cleanup());
      this.scene?.dispose();
    });
  }

  /** 0…1, driven by the section's scroll animation. See `NightScene.setProgress`. */
  setProgress(value: number): void {
    this.progress = value;
    // Handed back to the static art, the paused scene need not redraw.
    if (this.wide) {
      this.scene?.setProgress(value);
    }
  }

  private schedule(): void {
    if (!this.wantsWebgl()) {
      return;
    }
    const view = this.document.defaultView;
    if (!view) {
      return;
    }
    if (this.variant() === 'hero') {
      // After the banner has painted and the main thread has a moment.
      const idle = view.requestIdleCallback
        ? view.requestIdleCallback(() => void this.boot(), { timeout: 1500 })
        : view.setTimeout(() => void this.boot(), 700);
      this.cleanups.push(() =>
        view.cancelIdleCallback ? view.cancelIdleCallback(idle) : view.clearTimeout(idle),
      );
      return;
    }
    // Further down the page: only once it is within a screen of the viewport.
    const approach = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          approach.disconnect();
          void this.boot();
        }
      },
      { rootMargin: '100% 0px' },
    );
    approach.observe(this.host);
    this.cleanups.push(() => approach.disconnect());
  }

  /** A wide screen, a fine pointer, and no request to save data. */
  private wantsWebgl(): boolean {
    const view = this.document.defaultView;
    if (!view?.matchMedia || typeof IntersectionObserver === 'undefined') {
      return false;
    }
    const saveData = (view.navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection?.saveData;
    return (
      !saveData &&
      view.matchMedia(SCENE_MEDIA).matches &&
      !view.matchMedia('(prefers-reduced-data: reduce)').matches
    );
  }

  private async boot(): Promise<void> {
    const view = this.document.defaultView;
    if (this.disposed || !view) {
      return;
    }
    const { createNightScene } = await import('../scene/night-scene');
    if (this.disposed) {
      return;
    }

    let scene: NightScene;
    try {
      scene = createNightScene(this.canvas().nativeElement, {
        variant: this.variant(),
        dir: this.i18n.meta().dir,
        reducedMotion: view.matchMedia('(prefers-reduced-motion: reduce)').matches,
      });
    } catch {
      return; // No WebGL: the static art simply stays.
    }
    this.scene = scene;
    const media = view.matchMedia(SCENE_MEDIA);
    this.wide = media.matches;
    scene.setProgress(this.progress);

    const resize = new ResizeObserver(([entry]) =>
      scene.resize(entry.contentRect.width, entry.contentRect.height),
    );
    resize.observe(this.host);
    this.cleanups.push(() => resize.disconnect());

    // Only animate while it can be seen, and only show it while the window is
    // still wide: narrowed, the static art takes back over.
    let onScreen = false;
    let ready = false;
    const sync = (): void =>
      onScreen && this.wide && this.document.visibilityState === 'visible'
        ? scene.start()
        : scene.stop();
    const show = (): void => this.zone.run(() => this.live.set(ready && this.wide));
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    const onMedia = (): void => {
      this.wide = media.matches;
      if (this.wide) {
        scene.setProgress(this.progress);
      }
      sync();
      show();
    };
    visibility.observe(this.host);
    this.document.addEventListener('visibilitychange', sync);
    media.addEventListener('change', onMedia);
    this.cleanups.push(() => {
      visibility.disconnect();
      this.document.removeEventListener('visibilitychange', sync);
      media.removeEventListener('change', onMedia);
    });

    if (this.variant() === 'hero') {
      const onPointer = (event: PointerEvent): void =>
        scene.setPointer(
          (event.clientX / view.innerWidth) * 2 - 1,
          -((event.clientY / view.innerHeight) * 2 - 1),
        );
      view.addEventListener('pointermove', onPointer, { passive: true });
      this.cleanups.push(() => view.removeEventListener('pointermove', onPointer));
    }

    const canvas = this.canvas().nativeElement;
    const onLost = (event: Event): void => {
      event.preventDefault();
      ready = false;
      show();
    };
    canvas.addEventListener('webglcontextlost', onLost);
    this.cleanups.push(() => canvas.removeEventListener('webglcontextlost', onLost));

    await scene.ready;
    if (!this.disposed) {
      ready = true;
      show();
    }
  }
}
