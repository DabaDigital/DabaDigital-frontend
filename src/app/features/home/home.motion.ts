import { belowTheFold, revealOnScroll, type MotionKit } from '../../core/motion/motion';
import type { NightVisualComponent } from './components/night-visual.component';

/**
 * The landing page's choreography, one builder per section.
 *
 * Each runs through `injectMotion`, so it is outside Angular's zone and inside a
 * `gsap.context` that reverts everything on destroy. The rules every builder
 * keeps:
 *
 * - Motion supports the hierarchy; it is not applied to everything. Headlines,
 *   cards and the two 3D scenes move — body copy mostly does not.
 * - Short travel (20–40px), calm easing. Things are revealed, never thrown.
 * - Under `prefers-reduced-motion` only opacity changes remain: no transforms,
 *   no parallax, no scrubbing, no idle animation.
 * - Nothing is hidden by CSS waiting for JavaScript, and nothing already on
 *   screen is hidden by JavaScript either: the landing pages arrive prerendered,
 *   painted long before this runs. So the banner's entrance is CSS that plays
 *   with the first paint (see banner.section.scss), and the reveals below only
 *   take what is still under the fold (see `revealOnScroll`).
 */

const WIDE = '(min-width: 1024px)';

export function bannerMotion(kit: MotionKit, visual: NightVisualComponent): () => void {
  const { gsap, ScrollTrigger, root, reduced } = kit;
  const q = gsap.utils.selector(root);
  const media = gsap.matchMedia();

  // The scene recedes as the banner scrolls away (camera rise, see NightScene).
  ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => visual.setProgress(self.progress),
  });

  if (reduced) {
    return () => media.revert();
  }

  media.add(WIDE, () => {
    // The scene drifts up more slowly than the copy above it.
    gsap.to(q('[data-hero="visual"]'), {
      yPercent: 9,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
    });

    // The chapter rail follows the whole page, top to bottom.
    const dot = q('[data-rail-dot]')[0] as HTMLElement | undefined;
    if (dot?.parentElement) {
      const track = dot.parentElement;
      gsap.to(dot, {
        y: () => track.clientHeight - dot.offsetHeight,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.6, invalidateOnRefresh: true },
      });
    }
  });

  return () => media.revert();
}

/** Intro copy, then the cards rising in a short stagger. */
export function featuredWorkMotion(kit: MotionKit): void {
  const q = kit.gsap.utils.selector(kit.root);
  revealOnScroll(kit, q('[data-reveal]'), { y: 28, stagger: 0.08 });
  revealOnScroll(kit, q('[data-card]'), { y: 36, stagger: 0.12, start: 'top 90%' });
}

/** The image opens like a shutter; the copy and the figures follow. */
export function aboutMotion(kit: MotionKit): void {
  const { gsap, root, reduced } = kit;
  const q = gsap.utils.selector(root);
  const frame = q('[data-shutter]');
  // Like the reveals: never close a shutter the visitor can already see.
  if (frame.length && !reduced && belowTheFold(frame[0])) {
    gsap.from(frame, {
      clipPath: 'inset(12% 8% 12% 8% round 1rem)',
      scale: 1.04,
      duration: 1.6,
      ease: 'expo.out',
      scrollTrigger: { trigger: frame[0], start: 'top 80%', once: true },
    });
  }
  revealOnScroll(kit, q('[data-reveal]'), { y: 28, stagger: 0.09 });
}

export function servicesMotion(kit: MotionKit): void {
  const q = kit.gsap.utils.selector(kit.root);
  revealOnScroll(kit, q('[data-reveal]'), { y: 24 });
  revealOnScroll(kit, q('[data-card]'), { y: 32, stagger: 0.09, start: 'top 92%' });
}

/** The heading, then the two cards rising one after the other. */
export function teamMotion(kit: MotionKit): void {
  const q = kit.gsap.utils.selector(kit.root);
  revealOnScroll(kit, q('[data-reveal]'), { y: 28, stagger: 0.08 });
  revealOnScroll(kit, q('[data-card]'), { y: 36, stagger: 0.14, start: 'top 90%' });
}

/**
 * The closing scene: the arc rises as the section comes up the screen, the
 * rock drifts with a little parallax, then the headline and the button.
 */
export function finalCtaMotion(kit: MotionKit, visual: NightVisualComponent): () => void {
  const { gsap, ScrollTrigger, root, reduced } = kit;
  const q = gsap.utils.selector(root);
  const media = gsap.matchMedia();

  ScrollTrigger.create({
    trigger: root,
    start: 'top 85%',
    end: 'center 55%',
    scrub: reduced ? false : 0.8,
    onUpdate: (self) => visual.setProgress(reduced ? 1 : self.progress),
  });
  if (reduced) {
    visual.setProgress(1);
  }

  if (!reduced) {
    // The drawn arc (the scene's stand-in) rises the same way.
    gsap.from(q('.nv-arc'), {
      opacity: 0,
      scale: 0.86,
      transformOrigin: '50% 100%',
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top 85%', end: 'center 55%', scrub: 0.8 },
    });
    media.add(WIDE, () => {
      gsap.fromTo(
        q('.nv-terrain'),
        { yPercent: 6 },
        {
          yPercent: -2,
          ease: 'none',
          scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    });
  }

  // Headline first, the button after it.
  revealOnScroll(kit, q('[data-reveal]'), { y: 28, stagger: 0.18, start: 'top 82%' });

  return () => media.revert();
}

/** The contact header and the two panels. */
export function contactMotion(kit: MotionKit): void {
  const q = kit.gsap.utils.selector(kit.root);
  revealOnScroll(kit, q('[data-reveal]'), { y: 28, stagger: 0.1 });
}
