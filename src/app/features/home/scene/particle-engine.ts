import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Euler,
  Matrix3,
  Matrix4,
  NormalBlending,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
  type IUniform,
} from 'three';

import { SHAPE_RADIUS, buildSeeds, buildShapes } from './particle-shapes';
import type { ScreenLayout } from './scene-layout';

/**
 * The home page's WebGL particle field.
 *
 * One `Points` draw call. Every chapter shape is uploaded once as its own vertex
 * attribute, and the vertex shader interpolates between the two shapes either
 * side of `uMorph` — so scrolling through the page never touches a buffer, it
 * only moves one float. Everything else (swirl, drift, pointer repulsion,
 * twinkle) is computed on the GPU from a handful of uniforms.
 *
 * This module is the only one that imports Three.js, and it is loaded with a
 * dynamic `import()` after the page has painted: the copy never waits on WebGL.
 *
 * The engine knows nothing about Angular, GSAP or the page's sections. Each
 * frame it reads the scroll position through `readChapter`, and asks
 * `readLayout` where the shape should be — both supplied by `HomeSceneComponent`.
 */

export interface ScenePalette {
  /** sRGB channels, 0–1. */
  readonly base: readonly [number, number, number];
  readonly accent: readonly [number, number, number];
  /** Additive light on a dark ground; ordinary ink on a light one. */
  readonly glow: boolean;
}

export interface ParticleEngineOptions {
  readonly canvas: HTMLCanvasElement;
  readonly count: number;
  readonly maxPixelRatio: number;
  /** A still frame per chapter, re-rendered only when something changes. */
  readonly reducedMotion: boolean;
  readonly palette: ScenePalette;
  /** The scroll position as a chapter index, 0–5, fractional between chapters. */
  readonly readChapter: () => number;
  /**
   * Where the shape sits on screen at a (fractional) chapter, this frame. Read
   * every frame because a shape can follow a box that scrolls with the page.
   */
  readonly readLayout: (chapter: number) => ScreenLayout;
  readonly onFirstFrame: () => void;
  readonly onContextLost: () => void;
}

/** How a chapter's shape turns: tipped towards the camera, then spun, swayed and rolled. */
interface ShapeMotion {
  readonly tilt: number;
  /** Continuous spin about the shape's own up axis, rad/s. */
  readonly spin: number;
  /** Amplitude of a back-and-forth yaw, rad — for shapes that must keep facing the viewer. */
  readonly sway: number;
  readonly swaySpeed: number;
  /** Continuous roll about the view axis, rad/s. */
  readonly roll: number;
}

const SHAPE_MOTION: readonly ShapeMotion[] = [
  { tilt: 0, spin: 0, sway: 0.42, swaySpeed: 0.32, roll: 0.07 }, // khatam — sways, turns slowly
  { tilt: 0.28, spin: 0.14, sway: 0, swaySpeed: 0, roll: 0 }, // globe — spins
  { tilt: 0.32, spin: 0.015, sway: 0.12, swaySpeed: 0.2, roll: 0 }, // terrain — low, near still
  { tilt: 0.45, spin: 0.2, sway: 0, swaySpeed: 0, roll: 0.06 }, // tesseract — tumbles
  { tilt: 1.02, spin: 0.12, sway: 0, swaySpeed: 0, roll: 0 }, // galaxy — seen at an angle
  { tilt: 0.05, spin: 0, sway: 0.34, swaySpeed: 0.28, roll: 0 }, // arch — faces the viewer
];

const FOV = 35;
const CAMERA_Z = 10;
const TAN_HALF_FOV = Math.tan((FOV * Math.PI) / 360);
/** World units visible top-to-bottom on the z = 0 plane, where every shape sits. */
const VISIBLE_HEIGHT = 2 * CAMERA_Z * TAN_HALF_FOV;
const INTRO_SECONDS = 2.6;
const LAST_CHAPTER = SHAPE_MOTION.length - 1;

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uIntro;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec2 uPointer;
  uniform float uPointerForce;
  uniform float uAspect;
  uniform float uTanHalfFov;
  uniform float uWave;
  uniform float uTwinkle;
  uniform mat3 uRot0;
  uniform mat3 uRot1;
  uniform mat3 uRot2;
  uniform mat3 uRot3;
  uniform mat3 uRot4;
  uniform mat3 uRot5;

  attribute vec3 aShape1;
  attribute vec3 aShape2;
  attribute vec3 aShape3;
  attribute vec3 aShape4;
  attribute vec3 aShape5;
  attribute vec4 aSeed;

  varying float vAlpha;
  varying float vAccent;

  vec3 shapeAt(float index) {
    if (index < 0.5) return uRot0 * position;
    if (index < 1.5) return uRot1 * aShape1;
    if (index < 2.5) return uRot2 * aShape2;
    if (index < 3.5) return uRot3 * aShape3;
    if (index < 4.5) return uRot4 * aShape4;
    return uRot5 * aShape5;
  }

  void main() {
    float seed = aSeed.x;
    float phase = aSeed.z * 6.2831853;

    // Each particle starts its crossing a little later than the last, so a morph
    // ripples through the cloud. Both ends stay exact: at a whole chapter every
    // particle is on its shape.
    float from = floor(uMorph);
    float local = clamp((uMorph - from - seed * 0.4) / 0.6, 0.0, 1.0);
    local = local * local * (3.0 - 2.0 * local);
    vec3 p = mix(shapeAt(from), shapeAt(min(from + 1.0, 5.0)), local);

    // Mid-crossing, particles lift off along a flow field — strongest halfway.
    float swirl = sin(local * 3.1415926);
    p += swirl * 0.5 * vec3(
      sin(p.y * 1.7 + phase + uTime * 0.7),
      sin(p.z * 1.9 + phase * 0.7 + uTime * 0.6),
      cos(p.x * 1.5 + phase * 1.3 + uTime * 0.5)
    );

    // A swell runs through the terrain chapter only.
    p.y += uWave * 0.16 * sin(p.x * 1.4 + uTime * 0.9) * cos(p.z * 1.1 + uTime * 0.6);

    // Idle drift, so a settled shape still breathes.
    p += 0.022 * vec3(
      sin(uTime * 0.8 + phase * 7.0),
      cos(uTime * 0.6 + phase * 5.0),
      sin(uTime * 0.7 + phase * 3.0)
    );

    // Intro: every particle falls in from a far shell, the outer ones last.
    float intro = clamp(uIntro * 1.5 - seed * 0.5, 0.0, 1.0);
    intro = 1.0 - pow(1.0 - intro, 3.0);
    vec3 scatter = normalize(vec3(
      sin(seed * 91.7 + 1.3),
      cos(seed * 57.1 + 0.7),
      sin(seed * 33.3 + 2.1)
    )) * (7.0 + seed * 5.0);
    p = mix(scatter, p, intro);

    vec4 view = modelViewMatrix * vec4(p, 1.0);

    // The cursor parts the cloud: measured in screen space, pushed in view space.
    vec4 clip = projectionMatrix * view;
    vec2 away = clip.xy / clip.w - uPointer;
    away.x *= uAspect;
    float dist = length(away);
    float force = uPointerForce * (1.0 - smoothstep(0.0, 0.34, dist));
    view.xy += (away / max(dist, 0.0001)) * force * 0.2 * -view.z * uTanHalfFov;

    gl_Position = projectionMatrix * view;
    gl_PointSize = uSize * aSeed.y * uPixelRatio * (0.6 + 0.4 * intro) / -view.z;

    float twinkle = 0.62 + 0.38 * sin(uTime * (0.8 + seed * 2.2) + phase * 9.0);
    vAlpha = mix(1.0, twinkle, uTwinkle) * (0.35 + 0.65 * intro) * smoothstep(-24.0, -5.0, view.z);
    // A cloud between shapes is at its widest, and most likely to drift behind
    // body copy: it dims while it travels and brightens as it settles.
    vAlpha *= 1.0 - 0.45 * swirl;
    vAccent = aSeed.w;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uOpacity;
  uniform float uSoftness;

  varying float vAlpha;
  varying float vAccent;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float alpha = pow(1.0 - d, uSoftness) * vAlpha * uOpacity;
    gl_FragColor = vec4(mix(uColor, uAccent, vAccent), alpha);
  }
`;

// The index signature is what `ShaderMaterial` requires; the named members are
// what keeps every uniform typed where the engine writes it.
interface Uniforms {
  [uniform: string]: IUniform;
  uTime: IUniform<number>;
  uMorph: IUniform<number>;
  uIntro: IUniform<number>;
  uSize: IUniform<number>;
  uPixelRatio: IUniform<number>;
  uPointer: IUniform<Vector2>;
  uPointerForce: IUniform<number>;
  uAspect: IUniform<number>;
  uTanHalfFov: IUniform<number>;
  uWave: IUniform<number>;
  uTwinkle: IUniform<number>;
  uRot0: IUniform<Matrix3>;
  uRot1: IUniform<Matrix3>;
  uRot2: IUniform<Matrix3>;
  uRot3: IUniform<Matrix3>;
  uRot4: IUniform<Matrix3>;
  uRot5: IUniform<Matrix3>;
  uColor: IUniform<Vector3>;
  uAccent: IUniform<Vector3>;
  uOpacity: IUniform<number>;
  uSoftness: IUniform<number>;
}

/** Frame-rate independent exponential approach. */
function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export class ParticleEngine {
  /** `null` when WebGL is unavailable — the CSS ground behind the canvas is the fallback. */
  static create(options: ParticleEngineOptions): ParticleEngine | null {
    try {
      return new ParticleEngine(options);
    } catch {
      return null;
    }
  }

  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
  private readonly geometry = new BufferGeometry();
  private readonly material: ShaderMaterial;
  private readonly points: Points;
  private readonly uniforms: Uniforms;
  private readonly rotations = [0, 1, 2, 3, 4, 5].map(() => new Matrix3());
  private readonly euler = new Euler(0, 0, 0, 'XYZ');
  private readonly matrix = new Matrix4();
  private readonly resizeObserver: ResizeObserver;

  private paletteOpacity = 1;
  private width = 1;
  private height = 1;
  private pixelRatio = 1;

  private running = false;
  private lastTime: number | null = null;
  private elapsed = 0;
  private intro = 0;
  private morph = 0;
  private velocity = 0;
  private lastScroll = 0;
  private readonly pointer = new Vector2(0, 0);
  private readonly pointerTarget = new Vector2(0, 0);
  private pointerForce = 0;
  private pointerForceTarget = 0;
  private stillFrameQueued = false;
  private firstFrameDone = false;
  private framesMeasured = 0;
  private slowFrames = 0;
  private degraded = false;
  private disposed = false;

  private constructor(private readonly options: ParticleEngineOptions) {
    const { canvas, count, reducedMotion } = options;

    // No depth buffer and no MSAA: points never overlap in a way depth could fix,
    // and antialiasing a soft sprite buys nothing but fill rate.
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'default',
    });
    this.renderer.setClearColor(0x000000, 0);

    const shapes = buildShapes(count);
    this.geometry.setAttribute('position', new BufferAttribute(shapes[0], 3));
    for (let i = 1; i < shapes.length; i++) {
      this.geometry.setAttribute(`aShape${i}`, new BufferAttribute(shapes[i], 3));
    }
    this.geometry.setAttribute('aSeed', new BufferAttribute(buildSeeds(count), 4));

    this.uniforms = {
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uIntro: { value: reducedMotion ? 1 : 0 },
      uSize: { value: 27 },
      uPixelRatio: { value: 1 },
      uPointer: { value: new Vector2(10, 10) },
      uPointerForce: { value: 0 },
      uAspect: { value: 1 },
      uTanHalfFov: { value: TAN_HALF_FOV },
      uWave: { value: 0 },
      uTwinkle: { value: reducedMotion ? 0 : 1 },
      uRot0: { value: this.rotations[0] },
      uRot1: { value: this.rotations[1] },
      uRot2: { value: this.rotations[2] },
      uRot3: { value: this.rotations[3] },
      uRot4: { value: this.rotations[4] },
      uRot5: { value: this.rotations[5] },
      uColor: { value: new Vector3() },
      uAccent: { value: new Vector3() },
      uOpacity: { value: 1 },
      uSoftness: { value: 1.5 },
    };

    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    this.points = new Points(this.geometry, this.material);
    // The shader moves vertices far from the geometry's bounds (the intro shell),
    // so the bounding sphere would cull particles that are on screen.
    this.points.frustumCulled = false;
    this.scene.add(this.points);
    this.camera.position.set(0, 0, CAMERA_Z);
    this.camera.lookAt(0, 0, 0);

    this.intro = reducedMotion ? 1 : 0;
    this.lastScroll = window.scrollY;
    this.setPalette(options.palette);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();

    canvas.addEventListener('webglcontextlost', this.onContextLost);
    document.addEventListener('visibilitychange', this.onVisibility);

    if (reducedMotion) {
      window.addEventListener('scroll', this.onStillScroll, { passive: true });
      this.renderStill();
    } else {
      window.addEventListener('pointermove', this.onPointerMove, { passive: true });
      document.addEventListener('pointerout', this.onPointerOut, { passive: true });
      this.start();
    }
  }

  setPalette(palette: ScenePalette): void {
    this.uniforms.uColor.value.set(...palette.base);
    this.uniforms.uAccent.value.set(...palette.accent);
    this.material.blending = palette.glow ? AdditiveBlending : NormalBlending;
    // Light on dark glows and can afford a soft falloff; ink on paper needs a
    // crisper dot and a little restraint, or the page turns grey.
    this.uniforms.uSoftness.value = palette.glow ? 1.5 : 2.1;
    this.uniforms.uSize.value = palette.glow ? 30 : 32;
    this.paletteOpacity = palette.glow ? 1 : 0.78;
    this.invalidate();
  }

  /**
   * Something `readLayout` depends on changed (a resize, a re-flow). The live
   * loop picks that up by itself on its next frame; a still frame has to be
   * redrawn.
   */
  invalidate(): void {
    if (this.options.reducedMotion && !this.disposed) {
      this.renderStill();
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.stop();
    this.resizeObserver.disconnect();
    const canvas = this.options.canvas;
    canvas.removeEventListener('webglcontextlost', this.onContextLost);
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('scroll', this.onStillScroll);
    window.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerout', this.onPointerOut);
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
    // Browsers cap live WebGL contexts (8–16). Without this, every visit to the
    // home page in one session would leak one until the oldest is killed.
    this.renderer.forceContextLoss();
  }

  // ── Loop ────────────────────────────────────────────────────────────────

  private start(): void {
    if (this.running || this.disposed || this.options.reducedMotion) {
      return;
    }
    this.running = true;
    this.lastTime = null;
    this.renderer.setAnimationLoop(this.tick);
  }

  private stop(): void {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  private readonly tick = (time: number): void => {
    const dt = this.lastTime === null ? 1 / 60 : Math.min(0.1, (time - this.lastTime) / 1000);
    this.lastTime = time;

    // Fast scrolling speeds the whole field up for a moment — a warp, not a jolt.
    const scroll = window.scrollY;
    const speed = (scroll - this.lastScroll) / Math.max(dt, 0.001);
    this.lastScroll = scroll;
    this.velocity = damp(this.velocity, Math.min(1, Math.abs(speed) / 2600), 5, dt);
    this.elapsed += dt * (1 + this.velocity * 1.8);

    this.intro = Math.min(1, this.intro + dt / INTRO_SECONDS);
    // Damped, so a long jump (an anchor link) becomes a flight through every chapter.
    this.morph = damp(this.morph, this.readChapter(), 4.5, dt);
    this.pointer.lerp(this.pointerTarget, 1 - Math.exp(-8 * dt));
    this.pointerForce = damp(this.pointerForce, this.pointerForceTarget, 5, dt);

    this.render();
    this.watchPerformance(dt);
  };

  /**
   * Reduced motion: no loop, no morph, no drift — the nearest chapter's shape,
   * drawn at rest, and redrawn only when scrolling, sizing or colour change it.
   */
  private renderStill(): void {
    this.morph = Math.round(this.readChapter());
    this.render();
  }

  // A shape that follows its box moves with the page like any other element, so
  // a still frame is redrawn on scroll — at most once per frame. That is
  // scrolling, not animation: nothing moves unless the visitor scrolls.
  private readonly onStillScroll = (): void => {
    if (this.stillFrameQueued) {
      return;
    }
    this.stillFrameQueued = true;
    requestAnimationFrame(() => {
      this.stillFrameQueued = false;
      if (!this.disposed) {
        this.renderStill();
      }
    });
  };

  private readChapter(): number {
    return Math.min(LAST_CHAPTER, Math.max(0, this.options.readChapter()));
  }

  private render(): void {
    const u = this.uniforms;
    u.uTime.value = this.elapsed;
    u.uMorph.value = this.morph;
    u.uIntro.value = this.intro;
    u.uPointer.value.copy(this.pointer);
    u.uPointerForce.value = this.pointerForce;
    u.uWave.value = Math.max(0, 1 - Math.abs(this.morph - 2));

    const t = this.elapsed;
    SHAPE_MOTION.forEach((motion, index) => {
      const yaw = motion.spin * t + motion.sway * Math.sin(t * motion.swaySpeed);
      this.euler.set(motion.tilt, yaw, motion.roll * t, 'XYZ');
      this.rotations[index].setFromMatrix4(this.matrix.makeRotationFromEuler(this.euler));
    });

    // Screen-space layout → world space on the z = 0 plane.
    const layout = this.options.readLayout(this.morph);
    const visibleWidth = VISIBLE_HEIGHT * (this.width / this.height);
    this.points.position.set(
      (layout.x / this.width - 0.5) * visibleWidth,
      (0.5 - layout.y / this.height) * VISIBLE_HEIGHT,
      0,
    );
    this.points.scale.setScalar((layout.size / this.height) * (VISIBLE_HEIGHT / (2 * SHAPE_RADIUS)));
    // The cursor also tips the whole shape a little — parallax, not steering.
    this.points.rotation.set(-this.pointer.y * 0.12 * this.pointerForce, this.pointer.x * 0.16 * this.pointerForce, 0);
    u.uOpacity.value = layout.opacity * this.paletteOpacity;

    this.renderer.render(this.scene, this.camera);

    if (!this.firstFrameDone) {
      this.firstFrameDone = true;
      this.options.onFirstFrame();
    }
  }

  /**
   * One-shot quality step-down. If most frames in the first two seconds miss
   * 40 fps, drop to 1× pixel ratio and draw 55% of the particles. The field
   * still reads as a field — a stutter would not.
   */
  private watchPerformance(dt: number): void {
    if (this.degraded || this.framesMeasured > 140) {
      return;
    }
    this.framesMeasured++;
    if (this.framesMeasured > 20 && dt > 1 / 40) {
      this.slowFrames++;
    }
    if (this.slowFrames > 60) {
      this.degraded = true;
      this.geometry.setDrawRange(0, Math.floor(this.options.count * 0.55));
      this.pixelRatio = 1;
      this.applySize();
    }
  }

  // ── Sizing ──────────────────────────────────────────────────────────────

  private resize(): void {
    const canvas = this.options.canvas;
    this.width = Math.max(1, canvas.clientWidth);
    this.height = Math.max(1, canvas.clientHeight);
    if (!this.degraded) {
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, this.options.maxPixelRatio);
    }
    this.applySize();
  }

  private applySize(): void {
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.uniforms.uAspect.value = this.camera.aspect;
    this.uniforms.uPixelRatio.value = this.pixelRatio;
    this.invalidate();
  }

  // ── Input & lifecycle events ───────────────────────────────────────────

  private readonly onPointerMove = (event: PointerEvent): void => {
    // Touch has no hover: a finger would drag a hole through the shape it is
    // trying to scroll past.
    if (event.pointerType === 'touch') {
      this.pointerForceTarget = 0;
      return;
    }
    this.pointerTarget.set((event.clientX / this.width) * 2 - 1, 1 - (event.clientY / this.height) * 2);
    this.pointerForceTarget = 1;
  };

  private readonly onPointerOut = (event: PointerEvent): void => {
    if (!event.relatedTarget) {
      this.pointerForceTarget = 0;
    }
  };

  private readonly onVisibility = (): void => {
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  };

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    this.stop();
    this.options.onContextLost();
  };
}
