import { DOCUMENT } from '@angular/common';
import { DestroyRef, ElementRef, NgZone, afterNextRender, inject } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** ScrollTrigger touches `matchMedia` as it registers, so it waits for a real browser. */
let registered = false;

/** What a motion builder receives: GSAP, ScrollTrigger, and the host to scope to. */
export interface MotionKit {
  readonly gsap: typeof gsap;
  readonly ScrollTrigger: typeof ScrollTrigger;
  /** The component's host element. Selector strings inside a builder are scoped to it. */
  readonly root: HTMLElement;
  /** 1 in left-to-right documents, -1 in right-to-left — multiply inline offsets by it. */
  readonly inline: 1 | -1;
  /** The visitor asked for less motion: keep to opacity, skip transforms and scrubbing. */
  readonly reduced: boolean;
}

export type MotionBuilder = (kit: MotionKit) => void | (() => void);

/**
 * Runs a GSAP builder for the calling component, and undoes all of it on destroy.
 *
 * - The builder runs in `afterNextRender`: after Angular has written the DOM,
 *   before the browser paints it. Starting states (`gsap.from`, `gsap.set`)
 *   are therefore in place for the first frame — no flash of the final layout.
 * - It runs outside Angular's zone: GSAP ticks on every animation frame, and
 *   inside the zone each tick would schedule change detection for the app.
 * - Everything it creates lives in one `gsap.context` scoped to the host, so
 *   `ctx.revert()` kills every tween and ScrollTrigger and restores every
 *   inline style it touched. Nothing leaks across navigations.
 * - Nothing in the static design waits on this. Content is complete in CSS;
 *   motion only ever animates what is already there.
 *
 * Call it from a constructor (it needs an injection context).
 */
export function injectMotion(builder: MotionBuilder): void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const document = inject(DOCUMENT);
  const zone = inject(NgZone);
  let context: gsap.Context | undefined;
  let teardown: void | (() => void);

  afterNextRender(() => {
    const view = document.defaultView;
    // No media queries means no real browser (a test DOM, a bare renderer):
    // there is nothing to animate for, and GSAP's matchMedia would throw.
    if (!view?.matchMedia) {
      return;
    }
    if (!registered) {
      gsap.registerPlugin(ScrollTrigger);
      registered = true;
    }
    const reduced = view.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const kit: MotionKit = {
      gsap,
      ScrollTrigger,
      root: host,
      inline: document.documentElement.dir === 'rtl' ? -1 : 1,
      reduced,
    };
    zone.runOutsideAngular(() => {
      context = gsap.context(() => {
        teardown = builder(kit);
      }, host);
    });
  });

  inject(DestroyRef).onDestroy(() => {
    if (typeof teardown === 'function') {
      teardown();
    }
    context?.revert();
  });
}

/**
 * Elements rise a short distance into place as they enter the viewport, in
 * batches, so a row of cards arrives as a sequence rather than a block.
 * Under reduced motion they only fade. Focus inside an element reveals it at
 * once, so nothing a keyboard reaches is ever invisible.
 */
export function revealOnScroll(
  kit: MotionKit,
  targets: readonly Element[],
  options: { y?: number; stagger?: number; start?: string } = {},
): void {
  if (targets.length === 0) {
    return;
  }
  const { gsap: g, ScrollTrigger: st } = kit;
  const y = kit.reduced ? 0 : (options.y ?? 32);
  // `opacity`, never `autoAlpha`: `visibility: hidden` would take a card out of
  // the tab order, and a keyboard user would skip every section not yet seen.
  g.set(targets, { opacity: 0, y });
  const show = (batch: Element[]): void => {
    g.to(batch, {
      opacity: 1,
      y: 0,
      duration: kit.reduced ? 0.4 : 1,
      ease: 'power3.out',
      stagger: options.stagger ?? 0.08,
      overwrite: true,
    });
  };
  st.batch(targets as Element[], {
    start: options.start ?? 'top 88%',
    once: true,
    onEnter: (batch) => show(batch),
  });
  for (const target of targets) {
    target.addEventListener('focusin', () => show([target]), { once: true });
  }
}
