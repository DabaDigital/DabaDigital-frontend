/**
 * Where the particle shape sits on screen in each chapter, and how it travels
 * between chapters.
 *
 * Pure on purpose: `HomeSceneComponent` measures the DOM, this module turns the
 * measurements into screen-space layouts, and the engine turns a layout into
 * world space. Keeping the middle step free of the DOM and of Three.js is what
 * lets the specs cover RTL mirroring and interpolation directly.
 */

export type LayoutDirection = 'ltr' | 'rtl';

/** One chapter, in viewport-relative terms. */
export interface ChapterSpec {
  /** Centre, as a fraction of the half-width from the viewport centre. Positive = inline-end. */
  readonly x: number;
  /** Centre, as a fraction of the half-height from the viewport centre. Positive = up. */
  readonly y: number;
  /** Diameter of the shape's core, as a fraction of the viewport's shorter side. */
  readonly size: number;
  /** When the section reserves a box for the visual: core diameter as a fraction of its width. */
  readonly anchorScale: number;
  readonly opacity: number;
}

/** One chapter, resolved to CSS pixels from the viewport's top-left corner. */
export interface ScreenLayout {
  readonly x: number;
  readonly y: number;
  /** Diameter of the shape's core. */
  readonly size: number;
  readonly opacity: number;
}

export interface Viewport {
  readonly width: number;
  readonly height: number;
}

/**
 * A box the design reserved for the visual, measured this frame. The shape
 * centres on it and scales to it, so it stays in the empty space the layout
 * made for it — and scrolls with it, rather than hanging over whatever content
 * scrolls into that part of the viewport.
 */
export interface SceneAnchor {
  readonly centerX: number;
  readonly centerY: number;
  readonly width: number;
}

/**
 * How far a tracked shape may follow its box off screen, as a fraction of the
 * viewport height from each edge. Past this it waits at the edge, still partly
 * visible, until the next chapter's morph carries it away.
 */
export const ANCHOR_EDGE = 0.14;

/**
 * Wide screens: the shape sits in the empty half of each section. Each entry
 * matches the composition of its section — beside the headline, a floor under
 * the gallery, inside the sticky column, behind the direct channels.
 */
export const WIDE_CHAPTERS: readonly ChapterSpec[] = [
  { x: 0.5, y: 0.02, size: 0.66, anchorScale: 0.86, opacity: 1 }, // banner — khatam
  { x: 0.55, y: 0.08, size: 0.6, anchorScale: 0.82, opacity: 0.95 }, // about — globe
  { x: 0, y: -0.92, size: 1.25, anchorScale: 1, opacity: 0.8 }, // projects — terrain
  { x: -0.52, y: -0.3, size: 0.5, anchorScale: 0.78, opacity: 0.95 }, // services — tesseract
  { x: 0.5, y: 0.2, size: 0.72, anchorScale: 0.9, opacity: 0.9 }, // process — galaxy
  { x: -0.55, y: -0.34, size: 0.72, anchorScale: 0.8, opacity: 0.9 }, // contact — arch
];

/**
 * Narrow screens have no empty half: the copy takes the full width, so the
 * shape becomes a dim backdrop centred behind it — large, and quiet enough that
 * body text stays readable over it.
 */
export const COMPACT_CHAPTERS: readonly ChapterSpec[] = [
  { x: 0, y: 0.16, size: 1.1, anchorScale: 1, opacity: 0.42 },
  { x: 0, y: 0, size: 0.95, anchorScale: 1, opacity: 0.3 },
  { x: 0, y: -0.55, size: 1.5, anchorScale: 1, opacity: 0.34 },
  { x: 0, y: 0, size: 0.9, anchorScale: 1, opacity: 0.3 },
  { x: 0, y: 0.1, size: 1.1, anchorScale: 1, opacity: 0.3 },
  { x: 0, y: 0, size: 0.95, anchorScale: 1, opacity: 0.3 },
];

/**
 * Resolves one chapter to screen pixels.
 *
 * Without an anchor the shape holds a fixed place in the viewport, and in RTL
 * that place mirrors: the copy moves to the right, so the shape moves to the
 * left. With one — a visible box the section reserved — the shape takes the
 * box's centre and size instead, vertically clamped to {@link ANCHOR_EDGE}. An
 * anchor is measured in physical pixels, so it needs no mirroring.
 */
export function resolveChapter(
  spec: ChapterSpec,
  viewport: Viewport,
  dir: LayoutDirection,
  anchor?: SceneAnchor,
): ScreenLayout {
  const halfWidth = viewport.width / 2;
  const halfHeight = viewport.height / 2;
  if (anchor) {
    const edge = viewport.height * ANCHOR_EDGE;
    return {
      x: anchor.centerX,
      y: Math.min(viewport.height - edge, Math.max(edge, anchor.centerY)),
      size: Math.min(anchor.width * spec.anchorScale, viewport.height * 0.8),
      opacity: spec.opacity,
    };
  }
  const mirror = dir === 'rtl' ? -1 : 1;
  return {
    x: halfWidth + spec.x * mirror * halfWidth,
    y: halfHeight - spec.y * halfHeight,
    size: spec.size * Math.min(viewport.width, viewport.height),
    opacity: spec.opacity,
  };
}

export function smoothstep(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** The two chapters a fractional position falls between, and the eased blend between them. */
export function chapterSpan(chapter: number, last: number): { from: number; to: number; t: number } {
  const clamped = Math.min(last, Math.max(0, chapter));
  const from = Math.floor(clamped);
  return { from, to: Math.min(last, from + 1), t: smoothstep(clamped - from) };
}

export function blendLayouts(a: ScreenLayout, b: ScreenLayout, t: number): ScreenLayout {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    size: lerp(a.size, b.size, t),
    opacity: lerp(a.opacity, b.opacity, t),
  };
}

/**
 * The layout at a fractional chapter — eased between the two chapters it falls
 * between, so the shape glides into place instead of travelling at a constant
 * speed and stopping dead.
 */
export function layoutAt(layouts: readonly ScreenLayout[], chapter: number): ScreenLayout {
  const { from, to, t } = chapterSpan(chapter, layouts.length - 1);
  return blendLayouts(layouts[from], layouts[to], t);
}

/**
 * Parses a computed CSS colour into sRGB channels in 0–1.
 *
 * Browsers serialise a computed colour as `rgb()`/`rgba()`, or as
 * `color(srgb …)` when it came out of `color-mix()`; both are handled so a token
 * can change its syntax without silently breaking the scene.
 */
export function parseColor(value: string): [number, number, number] | null {
  const clamp = (channel: number): number => Math.min(1, Math.max(0, channel));
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(value.trim());
  if (rgb) {
    return [clamp(Number(rgb[1]) / 255), clamp(Number(rgb[2]) / 255), clamp(Number(rgb[3]) / 255)];
  }
  const srgb = /^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i.exec(value.trim());
  if (srgb) {
    return [clamp(Number(srgb[1])), clamp(Number(srgb[2])), clamp(Number(srgb[3]))];
  }
  return null;
}
