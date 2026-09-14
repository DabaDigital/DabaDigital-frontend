import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, Injectable, OnDestroy, OnInit, inject, signal } from '@angular/core';

/**
 * Which landing section is currently on screen.
 *
 * The header's nav highlights the active section, and the header renders long
 * before the lazily-loaded home page does — so the sections register themselves
 * here instead of the header querying the DOM for them. That also means the
 * header keeps working on the routes that *have* no sections: nothing registers,
 * `active` stays empty, and no link is marked current.
 *
 * One observer for the whole page, shared across every section.
 */
@Injectable({ providedIn: 'root' })
export class SectionSpyService {
  private readonly document = inject(DOCUMENT);

  /** The id of the section crossing the middle band of the viewport, or `''`. */
  readonly active = signal('');

  private observer?: IntersectionObserver;
  private readonly observed = new Set<Element>();

  register(element: HTMLElement): void {
    const observer = this.ensureObserver();
    if (!observer) {
      return;
    }
    observer.observe(element);
    this.observed.add(element);
  }

  unregister(element: HTMLElement): void {
    this.observer?.unobserve(element);
    this.observed.delete(element);

    if (this.observed.size === 0) {
      this.observer?.disconnect();
      this.observer = undefined;
      this.active.set('');
    }
  }

  private ensureObserver(): IntersectionObserver | undefined {
    if (this.observer) {
      return this.observer;
    }

    const view = this.document.defaultView;
    if (!view || !('IntersectionObserver' in view)) {
      return undefined;
    }

    this.observer = new view.IntersectionObserver(
      (entries) => this.onIntersect(entries),
      // A thin band across the middle of the viewport. Anything wider lets two
      // sections qualify at once on a tall screen, and the highlight flickers
      // between them as the visitor scrolls.
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    );
    return this.observer;
  }

  private onIntersect(entries: readonly IntersectionObserverEntry[]): void {
    const entering = entries.find((entry) => entry.isIntersecting);
    if (entering) {
      this.active.set(entering.target.id);
    }
    // Nothing entered the band: the visitor is in the gap between two sections,
    // or above the first one. The last value is deliberately kept — clearing it
    // would blink the highlight off for the frame before the next section
    // arrives, which reads as a glitch rather than as "no section".
  }
}

/**
 * Registers the host `<section id="…">` with {@link SectionSpyService}.
 *
 * The id is read from the element rather than taken as an input: it is already
 * there for the fragment links in the header, and two sources for the same
 * string is one source too many.
 */
@Directive({ selector: 'section[appSectionSpy]' })
export class SectionSpyDirective implements OnInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly spy = inject(SectionSpyService);

  ngOnInit(): void {
    this.spy.register(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.spy.unregister(this.host.nativeElement);
  }
}
