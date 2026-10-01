import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  afterRenderEffect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

import { I18nService } from '../../../core/i18n/i18n.service';
import { MotionService } from '../../../core/motion/motion.service';
import { ThemeService } from '../../../core/theme/theme.service';
import type { ParticleEngine, ScenePalette } from './particle-engine';
import {
  COMPACT_CHAPTERS,
  WIDE_CHAPTERS,
  blendLayouts,
  chapterSpan,
  parseColor,
  resolveChapter,
  type ChapterSpec,
  type LayoutDirection,
  type ScreenLayout,
  type Viewport,
} from './scene-layout';

/** Below this width the copy takes the full row, and the shape becomes a backdrop. */
const WIDE_LAYOUT_MIN = 1024;

/** Everything about the page's layout that only changes on resize, re-flow or a language switch. */
interface LayoutFrame {
  readonly viewport: Viewport;
  readonly dir: LayoutDirection;
  readonly specs: readonly ChapterSpec[];
  /** Per chapter: the box its shape follows, when the section reserves one. */
  readonly anchors: readonly (Element | null)[];
}

/**
 * The fixed backdrop behind the whole landing page: a CSS night sky, and the
 * WebGL particle field drawn over it.
 *
 * The sky is plain CSS and paints with the first frame. The particle engine —
 * and Three.js with it — is fetched with a dynamic `import()` only after the
 * page has rendered, so the headline never waits on WebGL. When WebGL is
 * missing or fails, the sky is simply all there is, and nothing else changes.
 *
 * Sections steer the field without knowing about it: each registers its scene
 * chapter with `MotionService` (the scroll position) and may mark a box with
 * `data-scene-anchor="<chapter>"` (where the shape should sit). This component
 * turns those into layouts and hands them to the engine.
 *
 * Everything here is decorative, so the whole backdrop is `aria-hidden`.
 */
@Component({
  selector: 'app-home-scene',
  template: `
    <div class="scene" [class.scene--live]="live()" aria-hidden="true">
      <div class="scene__sky"></div>
      <canvas #canvas class="scene__canvas"></canvas>
      <div class="scene__veil"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSceneComponent {
  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);
  private readonly theme = inject(ThemeService);
  private readonly i18n = inject(I18nService);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  /** True once the first WebGL frame is on screen; fades the canvas in over the CSS sky. */
  protected readonly live = signal(false);

  private engine: ParticleEngine | null = null;
  private frame: LayoutFrame | null = null;
  private destroyed = false;
  private readonly cleanups: (() => void)[] = [];

  constructor() {
    afterNextRender(() => void this.boot());

    // Colour follows the theme. Read after render, when `data-theme` is on <html>
    // and the computed tokens are the new ones.
    afterRenderEffect(() => {
      const dark = this.theme.isDark();
      untracked(() => {
        const palette = this.readPalette(dark);
        if (palette) {
          this.engine?.setPalette(palette);
        }
      });
    });

    // A language switch can flip the direction and re-flow every section.
    afterRenderEffect(() => {
      this.i18n.dir();
      this.motion.wide();
      untracked(() => this.relayout());
    });

    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.cleanups.forEach((cleanup) => cleanup());
      this.engine?.dispose();
      this.engine = null;
    });
  }

  private async boot(): Promise<void> {
    const view = this.document.defaultView;
    if (!this.motion.supported || !view) {
      return;
    }
    const palette = this.readPalette(this.theme.isDark());
    const { ParticleEngine } = await import('./particle-engine');
    if (this.destroyed || !palette) {
      return;
    }

    const canvas = this.canvas().nativeElement;
    const wide = view.innerWidth >= WIDE_LAYOUT_MIN;
    // Fewer, and at a lower pixel ratio, on small screens and on low-core machines —
    // where the GPU is usually the integrated kind.
    const lowPower = (view.navigator.hardwareConcurrency || 8) <= 4;
    const count = wide ? (lowPower ? 9000 : 14000) : 6500;

    this.engine = this.zone.runOutsideAngular(() =>
      ParticleEngine.create({
        canvas,
        count,
        maxPixelRatio: wide ? 1.75 : 1.5,
        reducedMotion: untracked(this.motion.reduced),
        palette,
        readChapter: () => this.motion.chapterProgress(),
        readLayout: this.readLayout,
        onFirstFrame: () => this.zone.run(() => this.live.set(true)),
        onContextLost: () => this.zone.run(() => this.live.set(false)),
      }),
    );
    if (!this.engine) {
      return;
    }

    // Anchors move when anything above them changes height — re-measure whenever
    // ScrollTrigger does, and on resize.
    this.cleanups.push(this.motion.onRefresh(() => this.relayout()));
    const onResize = (): void => this.relayout();
    this.zone.runOutsideAngular(() => view.addEventListener('resize', onResize, { passive: true }));
    this.cleanups.push(() => view.removeEventListener('resize', onResize));
  }

  /** Re-reads what only changes on resize or re-flow; the engine picks it up next frame. */
  private relayout(): void {
    this.frame = this.measureFrame();
    this.engine?.invalidate();
  }

  private measureFrame(): LayoutFrame {
    const canvas = this.canvas().nativeElement;
    const view = this.document.defaultView;
    const viewport = {
      width: canvas.clientWidth || view?.innerWidth || 1,
      height: canvas.clientHeight || view?.innerHeight || 1,
    };
    const wide = viewport.width >= WIDE_LAYOUT_MIN;
    const specs = wide ? WIDE_CHAPTERS : COMPACT_CHAPTERS;
    return {
      viewport,
      dir: this.i18n.dir(),
      specs,
      anchors: specs.map((_, chapter) =>
        wide ? this.document.querySelector(`[data-scene-anchor="${chapter}"]`) : null,
      ),
    };
  }

  /**
   * Called by the engine every frame, outside Angular. Only the (at most two)
   * chapters being blended are measured, so a frame costs two layout reads.
   */
  private readonly readLayout = (chapter: number): ScreenLayout => {
    const frame = (this.frame ??= this.measureFrame());
    const { from, to, t } = chapterSpan(chapter, frame.specs.length - 1);
    const start = this.layoutFor(frame, from);
    return from === to || t === 0 ? start : blendLayouts(start, this.layoutFor(frame, to), t);
  };

  /** One chapter, following its section's reserved box when that box is visible. */
  private layoutFor(frame: LayoutFrame, chapter: number): ScreenLayout {
    const box = frame.anchors[chapter]?.getBoundingClientRect();
    const anchor =
      box && box.width > 0
        ? { centerX: box.left + box.width / 2, centerY: box.top + box.height / 2, width: box.width }
        : undefined;
    return resolveChapter(frame.specs[chapter], frame.viewport, frame.dir, anchor);
  }

  /**
   * The particle colours come from the same tokens as everything else, so the
   * field re-tints with the theme and no colour is duplicated in TypeScript. A
   * throwaway probe resolves `var()` to a computed colour.
   */
  private readPalette(dark: boolean): ScenePalette | null {
    const probe = this.document.createElement('span');
    probe.style.display = 'none';
    this.host.append(probe);
    const read = (token: string): [number, number, number] | null => {
      probe.style.color = `var(${token})`;
      return parseColor(getComputedStyle(probe).color);
    };
    const base = read('--scene-particle');
    const accent = read('--scene-particle-accent');
    probe.remove();
    return base && accent ? { base, accent, glow: dark } : null;
  }
}
