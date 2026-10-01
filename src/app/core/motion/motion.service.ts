import { DOCUMENT } from '@angular/common';
import {
  ElementRef,
  Injectable,
  NgZone,
  afterRenderEffect,
  computed,
  inject,
  signal,
  untracked,
  type Signal,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export type MotionDirection = 'ltr' | 'rtl';

export interface MotionState {
  /**
   * The visitor asked for reduced motion — or there is no way to ask (no
   * `matchMedia`). Builders still register state (scene chapters), never tweens.
   */
  readonly reduced: boolean;
  /** Wide *and* tall enough for pinned, horizontal choreography. */
  readonly wide: boolean;
  /** A mouse or trackpad — hover-driven effects (magnetism, tilt, spotlight) make sense. */
  readonly finePointer: boolean;
}

export interface MotionKit extends MotionState {
  readonly gsap: typeof gsap;
  readonly ScrollTrigger: typeof ScrollTrigger;
  readonly dir: MotionDirection;
  /** `1` in LTR, `-1` in RTL. Multiply every horizontal offset by it. */
  readonly inline: 1 | -1;
  /**
   * Registers `section` as scene chapter `index` (1–5; the banner is 0). Its
   * progress runs 0 → 1 while the section's top crosses the middle of the
   * viewport, and the particle field sums every chapter's progress.
   */
  chapter(index: number, section: Element): void;
  /**
   * Wraps a callback that fires later (an `onEnter`, a batch) so whatever it
   * creates is still reverted with the rest of this builder's work.
   */
  later<A extends unknown[]>(callback: (...args: A) => void): (...args: A) => void;
  /** Debounced `ScrollTrigger.refresh()` — after a layout-changing DOM update. */
  refresh(): void;
}

/** Returns an optional teardown for whatever it set up outside GSAP (listeners, observers). */
export type MotionBuilder = (kit: MotionKit) => void | (() => void);

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const WIDE_QUERY = '(min-width: 1024px) and (min-height: 680px)';
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

const noop = (): void => undefined;

/**
 * The one door into GSAP.
 *
 * Every tween, timeline and ScrollTrigger in the app is created through
 * {@link bind}, which runs it **outside Angular's zone**. That is not an
 * optimisation, it is load-bearing: GSAP's ticker sleeps after ~2 idle seconds
 * and wakes by calling `requestAnimationFrame` from whatever zone the waking
 * call ran in. One tween created inside the zone would put the ticker's frame
 * loop inside it — and zone.js would then run app-wide change detection on every
 * animation frame until the ticker next slept.
 *
 * Everything a builder creates lives in one `gsap.context`, so `bind` returns a
 * single disposer that reverts all of it: inline styles, ScrollTriggers, pins.
 *
 * Motion is progressive enhancement. Without `matchMedia` (jsdom, a server
 * render) `supported` is false and nothing is ever built; under
 * `prefers-reduced-motion` builders run with `reduced: true` and only register
 * state — the page is complete, and fully usable, with no motion at all.
 */
@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);
  private readonly view = this.document.defaultView;

  /** False wherever there is no real layout to animate. */
  readonly supported = typeof this.view?.matchMedia === 'function';

  readonly reduced = this.mediaSignal(REDUCED_QUERY, true);
  readonly wide = this.mediaSignal(WIDE_QUERY, false);
  readonly finePointer = this.mediaSignal(FINE_POINTER_QUERY, false);

  /** The media state as one value — read it in an effect to rebuild when any of it changes. */
  readonly state: Signal<MotionState> = computed(() => ({
    reduced: this.reduced(),
    wide: this.wide(),
    finePointer: this.finePointer(),
  }));

  private registered = false;
  private refreshQueued = false;
  private readonly chapters = new Map<number, ScrollTrigger>();

  /**
   * Runs `build` in a `gsap.context` scoped to `host`, outside the zone, and
   * returns the disposer that reverts everything it created.
   */
  bind(host: HTMLElement, build: MotionBuilder): () => void {
    if (!this.supported) {
      return noop;
    }
    return this.zone.runOutsideAngular(() => {
      this.register();
      const state = untracked(this.state);
      const dir: MotionDirection = this.document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
      const owned: [number, ScrollTrigger][] = [];
      const context = gsap.context(noop, host);

      const kit: MotionKit = {
        ...state,
        gsap,
        ScrollTrigger,
        dir,
        inline: dir === 'rtl' ? -1 : 1,
        chapter: (index, section) => {
          const trigger = ScrollTrigger.create({ trigger: section, start: 'top 78%', end: 'top 22%' });
          this.chapters.set(index, trigger);
          owned.push([index, trigger]);
        },
        later:
          (callback) =>
          (...args) => {
            if (!context.isReverted) {
              context.add(() => callback(...args));
            }
          },
        refresh: () => this.refresh(),
      };

      let teardown: void | (() => void);
      context.add(() => {
        teardown = build(kit);
      });
      this.refresh();

      return () =>
        this.zone.runOutsideAngular(() => {
          if (typeof teardown === 'function') {
            teardown();
          }
          context.revert();
          for (const [index, trigger] of owned) {
            if (this.chapters.get(index) === trigger) {
              this.chapters.delete(index);
            }
          }
          this.refresh();
        });
    });
  }

  /**
   * Where the page is, as a scene chapter: 0 at the top, 5 once the contact
   * section has arrived, fractional in between. Called every animation frame by
   * the particle engine, so it reads cached ScrollTrigger progress and never
   * touches layout.
   */
  chapterProgress(): number {
    let sum = 0;
    for (const trigger of this.chapters.values()) {
      sum += trigger.progress;
    }
    return sum;
  }

  /** Coalesces refresh requests into one, on the next frame. */
  refresh(): void {
    if (!this.supported || !this.registered || this.refreshQueued || !this.view) {
      return;
    }
    this.refreshQueued = true;
    const view = this.view;
    this.zone.runOutsideAngular(() =>
      view.requestAnimationFrame(() => {
        this.refreshQueued = false;
        ScrollTrigger.refresh();
      }),
    );
  }

  /** Calls `callback` after every ScrollTrigger refresh; returns the unsubscribe. */
  onRefresh(callback: () => void): () => void {
    if (!this.supported) {
      return noop;
    }
    this.register();
    ScrollTrigger.addEventListener('refresh', callback);
    return () => ScrollTrigger.removeEventListener('refresh', callback);
  }

  private register(): void {
    if (this.registered) {
      return;
    }
    this.registered = true;
    this.zone.runOutsideAngular(() => {
      gsap.registerPlugin(ScrollTrigger);
      // Mobile browsers resize the viewport as the address bar slides away; a
      // refresh on each of those would make pinned sections jump mid-scroll.
      ScrollTrigger.config({ ignoreMobileResize: true, limitCallbacks: true });
      // Web fonts change line lengths, and so every trigger position after them.
      void this.document.fonts?.ready.then(() => this.refresh());
    });
  }

  private mediaSignal(query: string, fallback: boolean): Signal<boolean> {
    const list = this.view?.matchMedia?.(query);
    const value = signal(list ? list.matches : fallback);
    list?.addEventListener('change', (event) => value.set(event.matches));
    return value.asReadonly();
  }
}

/**
 * Builds a component's choreography after its first render, and rebuilds it
 * after any render in which `deps` (or the media state) changed — a language
 * switch re-renders every heading, and the old tweens point at detached nodes.
 * The previous build is reverted first; the last one is reverted on destroy.
 *
 * Call from a constructor. `build` receives the component's host element.
 */
export function injectMotion(
  build: (kit: MotionKit, host: HTMLElement) => void | (() => void),
  deps?: () => unknown,
): void {
  const motion = inject(MotionService);
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  afterRenderEffect((onCleanup) => {
    motion.state();
    deps?.();
    const dispose = untracked(() => motion.bind(host, (kit) => build(kit, host)));
    onCleanup(dispose);
  });
}
