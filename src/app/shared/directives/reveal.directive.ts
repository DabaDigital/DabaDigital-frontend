import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

/**
 * Reveals an element the first time it scrolls into view.
 *
 * The visual half lives in `styles.scss` (`.reveal` / `.is-revealed`); this only
 * decides *when*. It disconnects after the first intersection — a reveal that
 * replays on every scroll past is a distraction, not a transition.
 *
 * Three ways out, all of which end with the content visible:
 *
 * - `prefers-reduced-motion` → revealed immediately, no observer created.
 * - No `IntersectionObserver` → revealed immediately.
 * - Observer created but never fires → the CSS only hides `.reveal` under
 *   `prefers-reduced-motion: no-preference`, and the element is still in the
 *   document, so nothing is ever unreachable.
 *
 * Usage: `<div appReveal>` or, to stagger a row, `<li appReveal [revealDelay]="i * 60">`.
 * Keep the stagger step between 30 and 60 ms; past that a grid reads as loading
 * rather than arriving.
 */
// The `.reveal` class it applies is styled by the *global* stylesheet, so it
// works on any host without the component's own style scoping getting involved.
@Directive({ selector: '[appReveal]' })
export class RevealDirective implements OnInit, OnDestroy {
  /** Stagger, in milliseconds. Read by CSS as `--reveal-delay`. */
  readonly revealDelay = input(0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const element = this.host.nativeElement;
    element.classList.add('reveal');

    const delay = this.revealDelay();
    if (delay > 0) {
      element.style.setProperty('--reveal-delay', `${delay}ms`);
    }

    const view = this.document.defaultView;
    const prefersReducedMotion =
      view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    if (prefersReducedMotion || !view || !('IntersectionObserver' in view)) {
      this.show();
      return;
    }

    this.observer = new view.IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.show();
          this.disconnect();
        }
      },
      // A sliver is enough: waiting for a quarter of a tall card means the top of
      // it is already well past the fold before it fades in.
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' },
    );
    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private show(): void {
    this.host.nativeElement.classList.add('is-revealed');
  }

  private disconnect(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }
}
