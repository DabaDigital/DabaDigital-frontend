import type { MotionKit } from '../../core/motion/motion.service';

/**
 * The landing page's choreography, one builder per section.
 *
 * Every builder runs through `MotionService.bind` (via `injectMotion`), so it is
 * already outside Angular's zone and inside a `gsap.context` that reverts
 * everything it creates. Builders only ever *add* motion on top of a page that
 * is complete without it:
 *
 * - Nothing is hidden by CSS waiting for JavaScript. Initial states are inline
 *   styles GSAP sets here, and only on elements that exist at build time — a card
 *   Angular renders later simply appears, it can never be stuck invisible.
 * - Reveals animate `opacity`, never `visibility`. A `visibility: hidden` card
 *   drops out of the tab order, and a keyboard user tabbing down the page would
 *   skip every section they had not scrolled to yet.
 * - Angular-bound text is never written to. The counters draw over the real
 *   value with an overlay; the headings animate `aria-hidden` word copies.
 * - Under `prefers-reduced-motion` a builder registers its scene chapter and
 *   returns before creating a single tween.
 */

type Teardown = () => void;

const noop: Teardown = () => undefined;

function combine(...teardowns: Teardown[]): Teardown {
  return () => teardowns.forEach((teardown) => teardown());
}

function all<T extends Element = HTMLElement>(scope: ParentNode, selector: string): T[] {
  return Array.from(scope.querySelectorAll<T>(selector));
}

// ── Shared pieces ─────────────────────────────────────────────────────────────

/**
 * Headings marked `data-words`: each word rises out of its own line box, one
 * after another. The words are an `aria-hidden` copy — the heading's accessible
 * text is a visually hidden sibling — so a screen reader hears one heading, not
 * a list of words.
 */
export function revealWords(kit: MotionKit, scope: ParentNode): void {
  for (const heading of all(scope, '[data-words]')) {
    kit.gsap.from(heading.querySelectorAll('.word__inner'), {
      yPercent: 120,
      rotate: 6 * kit.inline,
      transformOrigin: kit.inline === 1 ? '0% 100%' : '100% 100%',
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: heading, start: 'clamp(top 88%)', once: true },
    });
  }
}

interface RevealOptions {
  /** Inline offset — mirrored in RTL, so "from the end side" stays true. */
  readonly x?: number;
  readonly y?: number;
  readonly rotateX?: number;
  readonly stagger?: number;
}

/** Cards, rows and panels rise into place in batches as they enter the viewport. */
export function revealUp(kit: MotionKit, targets: HTMLElement[], options: RevealOptions = {}): Teardown {
  if (targets.length === 0) {
    return noop;
  }
  const { gsap, ScrollTrigger } = kit;
  gsap.set(targets, {
    opacity: 0,
    x: (options.x ?? 0) * kit.inline,
    y: options.y ?? 48,
    rotateX: options.rotateX ?? 0,
    transformPerspective: 1000,
    transformOrigin: '50% 100%',
  });
  const show = (batch: Element[], stagger: number): void => {
    gsap.to(batch, {
      opacity: 1,
      x: 0,
      y: 0,
      rotateX: 0,
      duration: 1,
      ease: 'power3.out',
      stagger,
      overwrite: true,
    });
  };
  ScrollTrigger.batch(targets, {
    start: 'clamp(top 92%)',
    once: true,
    onEnter: kit.later((batch: Element[]) => show(batch, options.stagger ?? 0.08)),
  });
  // Focus can land inside a card before it has scrolled far enough to reveal —
  // it must never sit invisible under a focus ring.
  const onFocus = kit.later((event: FocusEvent) => {
    if (event.currentTarget instanceof Element) {
      show([event.currentTarget], 0);
    }
  });
  targets.forEach((target) => target.addEventListener('focusin', onFocus));
  return () => targets.forEach((target) => target.removeEventListener('focusin', onFocus));
}

/** A statement whose words light up as it crosses the viewport — scrubbed to the scrollbar. */
export function lightUpWords(kit: MotionKit, statement: Element): void {
  kit.gsap.fromTo(
    statement.querySelectorAll('.lit-word'),
    { opacity: 0.16 },
    {
      opacity: 1,
      ease: 'none',
      stagger: 0.08,
      scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 52%', scrub: true },
    },
  );
}

/**
 * Figures count up from zero. The real value — Angular's text node — is never
 * touched: it turns transparent (staying in the accessibility tree) while an
 * `aria-hidden` overlay counts over it, then the overlay goes and the real value
 * shows again. A language switch mid-count therefore cannot leave a stale figure.
 */
export function countUp(kit: MotionKit, elements: HTMLElement[], delay: number): Teardown {
  const cleanups: Teardown[] = [];
  for (const element of elements) {
    const value = element.querySelector<HTMLElement>('.count-value');
    const text = value?.textContent?.trim() ?? '';
    const digits = /\d+/.exec(text);
    if (!value || !digits) {
      continue;
    }
    const overlay = element.ownerDocument.createElement('span');
    overlay.className = 'count-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    element.append(overlay);
    element.classList.add('is-counting');

    const counter = { value: 0 };
    const draw = (): void => {
      overlay.textContent = text.replace(/\d+/, String(Math.round(counter.value)));
    };
    const finish = (): void => {
      overlay.remove();
      element.classList.remove('is-counting');
    };
    draw();
    kit.gsap.to(counter, {
      value: Number(digits[0]),
      duration: 1.8,
      delay,
      ease: 'power3.out',
      onUpdate: draw,
      onComplete: finish,
    });
    cleanups.push(finish);
  }
  return combine(...cleanups);
}

/** A soft pull towards the cursor. Reserved for the one or two calls to action that earn it. */
export function magnetic(kit: MotionKit, elements: HTMLElement[], strength = 0.3): Teardown {
  if (!kit.finePointer || elements.length === 0) {
    return noop;
  }
  const { gsap } = kit;
  return combine(
    ...elements.map((element) => {
      const xTo = gsap.quickTo(element, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      const yTo = gsap.quickTo(element, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      // Measured once on entry: measuring while it moves would chase its own tail.
      let box: DOMRect | null = null;
      const enter = (): void => {
        box = element.getBoundingClientRect();
      };
      const move = (event: PointerEvent): void => {
        box ??= element.getBoundingClientRect();
        xTo((event.clientX - (box.left + box.width / 2)) * strength);
        yTo((event.clientY - (box.top + box.height / 2)) * strength);
      };
      const leave = (): void => {
        box = null;
        xTo(0);
        yTo(0);
      };
      element.addEventListener('pointerenter', enter);
      element.addEventListener('pointermove', move);
      element.addEventListener('pointerleave', leave);
      return () => {
        element.removeEventListener('pointerenter', enter);
        element.removeEventListener('pointermove', move);
        element.removeEventListener('pointerleave', leave);
      };
    }),
  );
}

/** Cards lean towards the cursor in 3D. Measured on the parent, which does not tilt. */
export function tilt(kit: MotionKit, elements: HTMLElement[], max = 6): Teardown {
  if (!kit.finePointer || elements.length === 0) {
    return noop;
  }
  const { gsap } = kit;
  return combine(
    ...elements.map((element) => {
      gsap.set(element, { transformPerspective: 900 });
      const rotateX = gsap.quickTo(element, 'rotationX', { duration: 0.8, ease: 'power3' });
      const rotateY = gsap.quickTo(element, 'rotationY', { duration: 0.8, ease: 'power3' });
      const frame = element.parentElement ?? element;
      const move = (event: PointerEvent): void => {
        const box = frame.getBoundingClientRect();
        rotateY(((event.clientX - box.left) / box.width - 0.5) * max * 2);
        rotateX(-((event.clientY - box.top) / box.height - 0.5) * max * 2);
      };
      const leave = (): void => {
        rotateX(0);
        rotateY(0);
      };
      element.addEventListener('pointermove', move);
      element.addEventListener('pointerleave', leave);
      return () => {
        element.removeEventListener('pointermove', move);
        element.removeEventListener('pointerleave', leave);
      };
    }),
  );
}

/**
 * Cards marked `data-spotlight` get a light that follows the cursor. One
 * delegated listener for the whole page; the CSS does the drawing from the two
 * custom properties written here.
 */
export function spotlight(kit: MotionKit, root: HTMLElement): Teardown {
  if (!kit.finePointer) {
    return noop;
  }
  const move = (event: PointerEvent): void => {
    const card =
      event.target instanceof Element ? event.target.closest<HTMLElement>('[data-spotlight]') : null;
    if (!card) {
      return;
    }
    const box = card.getBoundingClientRect();
    card.style.setProperty('--spot-x', `${event.clientX - box.left}px`);
    card.style.setProperty('--spot-y', `${event.clientY - box.top}px`);
  };
  root.addEventListener('pointermove', move, { passive: true });
  return () => root.removeEventListener('pointermove', move);
}

// ── Page ──────────────────────────────────────────────────────────────────────

/** The reading-progress hairline under the header, and the card spotlight. */
export function pageMotion(kit: MotionKit, root: HTMLElement): Teardown {
  if (kit.reduced) {
    return noop;
  }
  const bar = root.querySelector('[data-scroll-progress]');
  if (bar) {
    kit.gsap.fromTo(
      bar,
      { scaleX: 0 },
      { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } },
    );
  }
  return spotlight(kit, root);
}

// ── 1 · Banner ────────────────────────────────────────────────────────────────

export function bannerMotion(kit: MotionKit, section: HTMLElement, options: { intro: boolean }): Teardown {
  if (kit.reduced) {
    return noop;
  }
  const { gsap } = kit;
  const teardowns: Teardown[] = [];
  const backdrop = all(section, '[data-hero-backdrop]');
  const globe = all(section, '[data-hero-globe]');

  // The entrance plays once per visit to the page — not again on a language
  // switch, which rebuilds everything else here.
  if (options.intro) {
    gsap
      .timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 })
      // The panorama only settles — it is never hidden, so the first paint is
      // already the picture.
      .from(backdrop, { scale: 1.1, duration: 2.4, ease: 'power2.out' }, 0)
      .from(all(section, '[data-hero="eyebrow"]'), { opacity: 0, y: 24, duration: 0.9 }, 0)
      .from(
        all(section, '.hero-title__word'),
        {
          yPercent: 112,
          rotateX: -55,
          transformPerspective: 800,
          transformOrigin: '50% 100%',
          duration: 1.4,
          stagger: 0.12,
        },
        0.05,
      )
      .from(globe, { opacity: 0, scale: 0.88, duration: 1.8 }, 0.3)
      .from(all(section, '[data-hero="fade"]'), { opacity: 0, y: 28, duration: 1.1, stagger: 0.08 }, 0.5)
      .from(
        all(section, '[data-hero="card"]'),
        { opacity: 0, scale: 0.55, duration: 1.3, ease: 'back.out(1.6)', stagger: 0.09 },
        0.75,
      )
      .from(all(section, '[data-hero="stats"]'), { opacity: 0, y: 40, duration: 1.1 }, 0.85);
    teardowns.push(countUp(kit, all(section, '[data-count]'), 1));
  }

  // On the way out the opening comes apart in depth: the panorama lags behind
  // the page, the globe rises ahead of it, and each line of the headline leaves
  // at its own speed. `yPercent` throughout, so none of it competes with the
  // `x`/`y` the pointer effects below write.
  const leaving = { trigger: section, start: 'top top', end: 'bottom top' };
  gsap.to(backdrop, { yPercent: 14, ease: 'none', scrollTrigger: { ...leaving, scrub: true } });
  gsap.to(globe, { yPercent: -14, ease: 'none', scrollTrigger: { ...leaving, scrub: 0.9 } });
  gsap.to(all(section, '.hero-title__line'), {
    yPercent: (index: number) => -22 - index * 24,
    ease: 'none',
    scrollTrigger: { ...leaving, scrub: 0.5 },
  });

  if (kit.finePointer) {
    teardowns.push(depthParallax(kit, all(section, '[data-depth]')));
  }
  teardowns.push(magnetic(kit, all(section, '[data-magnetic]')));
  return combine(...teardowns);
}

/** Each floating card drifts with the cursor at its own depth — nearer cards travel further. */
function depthParallax(kit: MotionKit, cards: HTMLElement[]): Teardown {
  const { gsap } = kit;
  const movers = cards.map((card) => ({
    depth: Number(card.dataset['depth'] ?? '1'),
    x: gsap.quickTo(card, 'x', { duration: 1.2, ease: 'power3' }),
    y: gsap.quickTo(card, 'y', { duration: 1.2, ease: 'power3' }),
  }));
  const move = (event: PointerEvent): void => {
    const nx = event.clientX / window.innerWidth - 0.5;
    const ny = event.clientY / window.innerHeight - 0.5;
    for (const mover of movers) {
      mover.x(nx * 36 * mover.depth);
      mover.y(ny * 28 * mover.depth);
    }
  };
  window.addEventListener('pointermove', move, { passive: true });
  return () => window.removeEventListener('pointermove', move);
}

// ── 2 · About ─────────────────────────────────────────────────────────────────

export function aboutMotion(kit: MotionKit, section: HTMLElement): Teardown {
  kit.chapter(1, section);
  if (kit.reduced) {
    return noop;
  }
  revealWords(kit, section);
  for (const statement of all(section, '[data-lit]')) {
    lightUpWords(kit, statement);
  }
  return combine(
    revealUp(kit, all(section, '[data-reveal]'), { y: 64, rotateX: -16, stagger: 0.1 }),
    tilt(kit, all(section, '[data-tilt]')),
  );
}

// ── 3 · Projects ──────────────────────────────────────────────────────────────

export function projectsMotion(kit: MotionKit, section: HTMLElement): Teardown {
  kit.chapter(2, section);
  if (kit.reduced) {
    return noop;
  }
  revealWords(kit, section);
  const stage = section.querySelector<HTMLElement>('[data-projects-stage]');
  const viewport = section.querySelector<HTMLElement>('[data-projects-viewport]');
  const track = section.querySelector<HTMLElement>('[data-projects-track]');
  if (!stage || !viewport || !track) {
    return noop;
  }
  // The list is filterable, so the page changes height under every trigger
  // below it — and in rail mode the pin's own length changes. Re-measure on
  // any change to the list's size, or a reveal could be left waiting for a
  // scroll position the shortened page no longer has.
  const observer = new ResizeObserver(() => kit.refresh());
  observer.observe(track);
  const layout = kit.wide
    ? rail(kit, section, stage, viewport, track)
    : revealUp(kit, all(track, '[data-project-card]'), { y: 56 });
  return combine(layout, () => observer.disconnect());
}

/**
 * Wide screens: the section pins and the gallery travels sideways as the page
 * scrolls down — mirrored in RTL, where the rail runs right to left.
 */
function rail(
  kit: MotionKit,
  section: HTMLElement,
  stage: HTMLElement,
  viewport: HTMLElement,
  track: HTMLElement,
): Teardown {
  const { gsap, ScrollTrigger } = kit;
  // Switches the list from grid to rail *before* anything is measured.
  section.classList.add('projects--rail');

  const distance = (): number => Math.max(0, track.scrollWidth - viewport.clientWidth);
  const progress = section.querySelector<HTMLElement>('[data-projects-progress]');
  const setProgress = progress ? gsap.quickSetter(progress, 'scaleX') : null;
  const skewTo = gsap.quickTo(track, 'skewX', { duration: 0.6, ease: 'power3' });

  const travel = gsap.to(track, {
    x: () => -distance() * kit.inline,
    ease: 'none',
    scrollTrigger: {
      trigger: stage,
      pin: true,
      start: 'top top',
      end: () => `+=${Math.max(1, distance())}`,
      scrub: 0.8,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      // Everything below the gallery is offset by this pin's spacing, so it has
      // to be measured first whenever the page is re-measured.
      refreshPriority: 1,
      onUpdate: (self) => {
        setProgress?.(self.progress);
        skewTo(gsap.utils.clamp(-4, 4, (self.getVelocity() / -300) * kit.inline));
      },
    },
  });

  const settle = (): void => {
    skewTo(0);
  };
  ScrollTrigger.addEventListener('scrollEnd', settle);

  // Keyboard: tabbing to a card that is still off to the side scrolls the page
  // until the rail has carried it into view. `overflow: clip` on the viewport
  // stops the browser from scrolling the rail itself behind the animation.
  const onFocus = (event: FocusEvent): void => {
    const card =
      event.target instanceof Element ? event.target.closest('[data-project-card]') : null;
    const trigger = travel.scrollTrigger;
    const total = distance();
    if (!card || !trigger || total <= 0) {
      return;
    }
    const box = card.getBoundingClientRect();
    const frame = viewport.getBoundingClientRect();
    // Where the card will sit once the scrubbed tween has caught up with the scrollbar.
    const settledX = -trigger.progress * total * kit.inline;
    const left = box.left + (settledX - Number(gsap.getProperty(track, 'x')));
    if (left >= frame.left && left + box.width <= frame.right) {
      return;
    }
    const offCentre = left + box.width / 2 - (frame.left + frame.width / 2);
    const scrollPerPixel = (trigger.end - trigger.start) / total;
    trigger.scroll(
      gsap.utils.clamp(trigger.start, trigger.end, trigger.scroll() + offCentre * scrollPerPixel * kit.inline),
    );
  };
  track.addEventListener('focusin', onFocus);

  return () => {
    ScrollTrigger.removeEventListener('scrollEnd', settle);
    track.removeEventListener('focusin', onFocus);
    section.classList.remove('projects--rail');
  };
}

// ── 4 · Services ──────────────────────────────────────────────────────────────

export function servicesMotion(kit: MotionKit, section: HTMLElement): Teardown {
  kit.chapter(3, section);
  if (kit.reduced) {
    return noop;
  }
  revealWords(kit, section);
  const rows = all(section, '[data-service]');
  // A row lights up while it crosses the middle band of the viewport, so the
  // sticky column always has one discipline "in focus" beside it.
  for (const row of rows) {
    kit.ScrollTrigger.create({
      trigger: row,
      start: 'top 64%',
      end: 'bottom 36%',
      toggleClass: { targets: row, className: 'is-active' },
    });
  }
  return combine(
    revealUp(kit, rows, { x: 72, y: 0, stagger: 0.1 }),
    revealUp(kit, all(section, '[data-reveal]')),
  );
}

// ── 5 · Process ───────────────────────────────────────────────────────────────

export function processMotion(kit: MotionKit, section: HTMLElement): Teardown {
  kit.chapter(4, section);
  if (kit.reduced) {
    return noop;
  }
  revealWords(kit, section);
  const path = section.querySelector<HTMLElement>('[data-process]');
  const steps = all(section, '[data-step]');
  if (path) {
    // Without this class every step looks reached — the static design is the
    // finished journey, and only the animated one starts from the first step.
    path.classList.add('process--animated');
    kit.gsap.fromTo(
      path,
      { '--progress': 0 },
      {
        '--progress': 1,
        ease: 'none',
        scrollTrigger: {
          trigger: path,
          start: 'top 75%',
          end: 'bottom 55%',
          scrub: 0.6,
          onUpdate: (self) => {
            const last = Math.max(1, steps.length - 1);
            steps.forEach((step, index) =>
              step.classList.toggle('is-active', self.progress >= (index / last) * 0.98),
            );
          },
        },
      },
    );
  }
  return combine(
    revealUp(kit, steps, { y: 40, stagger: 0.12 }),
    revealUp(kit, all(section, '[data-reveal]')),
    () => path?.classList.remove('process--animated'),
  );
}

// ── 6 · Contact ───────────────────────────────────────────────────────────────

export function contactMotion(kit: MotionKit, section: HTMLElement): Teardown {
  kit.chapter(5, section);
  if (kit.reduced) {
    return noop;
  }
  revealWords(kit, section);
  return revealUp(kit, all(section, '[data-reveal]'), { y: 60, stagger: 0.12 });
}
