import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  FogExp2,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SpotLight,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
  type Material,
  type WebGLRenderTarget,
} from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

/**
 * The night scene behind the banner and the closing call to action.
 *
 * `hero`    — a faceted obsidian crystal inside a thin orbit ring, in front of a
 *             great lit arc, floating over dark rock with a still pool below it.
 * `horizon` — the same rock and light without the object: the arc rises over
 *             the horizon like the rim of a planet.
 *
 * Lighting reveals rather than floods: the ground stays near black, the rock is
 * picked out by a cold rim light from behind, and the crystal shows only what
 * its facets reflect — a handful of strip lights baked into an environment map.
 *
 * Built for one job and torn down completely: `dispose()` frees every geometry,
 * material, texture and the GL context itself. Colours here are lighting values
 * for a renderer, not interface colours, which is why they are not tokens.
 */

export type NightSceneVariant = 'hero' | 'horizon';

export interface NightSceneOptions {
  readonly variant: NightSceneVariant;
  /** The crystal sits on the side away from the copy, so it mirrors in RTL. */
  readonly dir: 'ltr' | 'rtl';
  /** Draw single frames on demand; no idle animation, no parallax. */
  readonly reducedMotion: boolean;
}

export interface NightScene {
  /** Resolves once shaders are compiled and the first frame is on the canvas. */
  readonly ready: Promise<void>;
  resize(width: number, height: number): void;
  /** Pointer position in -1…1 on both axes; the camera leans toward it a little. */
  setPointer(x: number, y: number): void;
  /** 0…1. `hero`: how far the banner has scrolled away. `horizon`: how far the arc has risen. */
  setProgress(progress: number): void;
  start(): void;
  stop(): void;
  dispose(): void;
}

// ── Palette (linear light values for the renderer) ────────────────────────────
const NIGHT = '#020406';
const ICE = '#dcebff';
const ICE_DEEP = '#8fb8e8';
const ROCK = '#0c1016';

// ── Noise ─────────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Ridged multifractal: sharp crests and soft valleys — rock, not hills. */
function ridged(x: number, y: number): number {
  let sum = 0;
  let amplitude = 0.55;
  let frequency = 1;
  for (let octave = 0; octave < 5; octave++) {
    let n = 1 - Math.abs(valueNoise(x * frequency, y * frequency) * 2 - 1);
    n *= n;
    sum += n * amplitude;
    frequency *= 2.07;
    amplitude *= 0.5;
  }
  return sum;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** A soft round alpha mask (white centre, black rim) for the pool's edge. */
function radialFalloff(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.45, '#c8c8c8');
    gradient.addColorStop(1, '#000000');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  return new CanvasTexture(canvas);
}

// ── Pieces ────────────────────────────────────────────────────────────────────

/** An irregular, elongated hull: faceted like cut obsidian, never a jeweller's diamond. */
function crystalGeometry(): BufferGeometry {
  const rand = mulberry32(7);
  const points: Vector3[] = [new Vector3(0.08, 1.62, 0.05), new Vector3(-0.07, -1.52, -0.02)];
  const rings = [
    { y: 1.05, radius: 0.5, count: 6 },
    { y: 0.5, radius: 0.86, count: 8 },
    { y: -0.05, radius: 1.0, count: 9 },
    { y: -0.62, radius: 0.84, count: 8 },
    { y: -1.12, radius: 0.42, count: 5 },
  ];
  for (const ring of rings) {
    const offset = rand() * Math.PI * 2;
    for (let i = 0; i < ring.count; i++) {
      const angle = offset + (i / ring.count) * Math.PI * 2 + (rand() - 0.5) * 0.55;
      const radius = ring.radius * (0.8 + rand() * 0.34);
      points.push(
        new Vector3(
          Math.cos(angle) * radius,
          ring.y + (rand() - 0.5) * 0.26,
          Math.sin(angle) * radius * 0.82,
        ),
      );
    }
  }
  return new ConvexGeometry(points);
}

/** Dark rock: a valley under the crystal, crests rising toward the edges and the distance. */
function terrainGeometry(variant: NightSceneVariant, valleyX: number): BufferGeometry {
  const geometry = new PlaneGeometry(80, 44, 220, 120);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.getAttribute('position') as BufferAttribute;
  const valleyWidth = variant === 'hero' ? 2.6 : 3.4;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const crest = ridged(x * 0.13 + 3.1, z * 0.13 - 1.7);
    const grit = valueNoise(x * 0.9, z * 0.9) * 0.18;
    const valley = smoothstep(valleyWidth, valleyWidth + 5.5, Math.abs(x - valleyX));
    const distance = smoothstep(2, -18, z);
    const nearEdge = smoothstep(4, 9, z);
    let height = (crest * 3.1 + grit) * (0.08 + 0.92 * valley) * (0.7 + 0.9 * distance);
    // Keep the foreground low so the rock frames the view rather than walling it.
    height *= 1 - nearEdge * 0.75;
    position.setY(i, -1.95 + height);
  }
  const faceted = geometry.toNonIndexed();
  faceted.computeVertexNormals();
  geometry.dispose();
  return faceted;
}

/**
 * The reflections the crystal shows: a few strip lights in a dark room, baked
 * once into a prefiltered environment map. Nothing here is ever drawn directly.
 */
function environmentMap(renderer: WebGLRenderer): WebGLRenderTarget {
  const room = new Scene();
  const disposables: { dispose(): void }[] = [];

  // A dome that is not pitch black — night-blue overhead, black underfoot — so
  // every facet reflects *something*, and the stone reads as glass, not tar.
  const domeGeometry = new SphereGeometry(20, 32, 16);
  const domeMaterial = new ShaderMaterial({
    side: BackSide,
    vertexShader: /* glsl */ `
      varying vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vDirection;
      void main() {
        float h = vDirection.y;
        vec3 top = vec3(0.1, 0.14, 0.22);
        vec3 horizon = vec3(0.025, 0.035, 0.05);
        vec3 low = vec3(0.004, 0.006, 0.01);
        vec3 color = h > 0.0 ? mix(horizon, top, pow(h, 0.8)) : mix(horizon, low, pow(-h, 0.6));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  room.add(new Mesh(domeGeometry, domeMaterial));
  disposables.push(domeGeometry, domeMaterial);

  const strip = (
    width: number,
    height: number,
    color: string,
    intensity: number,
    position: Vector3,
  ): void => {
    const geometry = new PlaneGeometry(width, height);
    const material = new MeshBasicMaterial({
      color: new Color(color).multiplyScalar(intensity),
      side: DoubleSide,
    });
    const mesh = new Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.lookAt(0, 0, 0);
    room.add(mesh);
    disposables.push(geometry, material);
  };
  strip(10, 1.2, '#ffffff', 6, new Vector3(2, 8, 3));
  strip(0.5, 9, ICE, 6, new Vector3(-7, 1, 3));
  strip(0.5, 7, '#ffffff', 5, new Vector3(7, 0.5, 1));
  strip(0.4, 6, ICE_DEEP, 4, new Vector3(-4, 0, -7));
  strip(0.4, 6, '#ffffff', 3, new Vector3(5, 2, -6));
  strip(8, 0.35, ICE, 3.5, new Vector3(0, -4, 6));
  strip(1.2, 1.2, '#ffffff', 10, new Vector3(-2.5, 5, 6));

  const generator = new PMREMGenerator(renderer);
  const target = generator.fromScene(room, 0.025);
  generator.dispose();
  disposables.forEach((item) => item.dispose());
  return target;
}

const arcVertex = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const arcFragment = /* glsl */ `
  uniform float uRadius;
  uniform float uReveal;
  uniform float uStart;
  uniform float uEnd;
  uniform float uMirror;
  uniform vec3 uColor;
  varying vec2 vPos;
  void main() {
    vec2 p = vec2(vPos.x * uMirror, vPos.y);
    float d = length(p) - uRadius;
    float core = exp(-abs(d) * 46.0);
    float halo = exp(-abs(d) * 4.5) * 0.16;
    float rim = smoothstep(0.0, -2.4, d) * smoothstep(-2.4, -0.05, d) * 0.035;
    // 0 at the top of the circle, clockwise positive.
    float angle = atan(p.x, p.y);
    float from = mix(0.0, uStart, uReveal);
    float to = mix(0.0, uEnd, uReveal);
    float mask = smoothstep(from - 0.45, from + 0.12, angle) * (1.0 - smoothstep(to - 0.12, to + 0.45, angle));
    float a = (core + halo + rim) * mask * uReveal;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

const ringVertex = /* glsl */ `
  varying float vAround;
  void main() {
    vAround = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;
  varying float vAround;
  void main() {
    float head = fract(vAround - uTime * 0.035);
    float glint = pow(head, 22.0) * 1.6 + pow(head, 4.0) * 0.35;
    float a = (0.42 + glint) * uOpacity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

const dustVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.y = mod(p.y + uTime * (0.04 + aSeed * 0.07) + 2.0, 7.0) - 2.0;
    p.x += sin(uTime * 0.17 + aSeed * 6.283) * 0.2;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPixelRatio * (1.1 + aSeed * 2.1) * (9.0 / -mv.z);
    float twinkle = 0.45 + 0.55 * sin(uTime * (0.6 + aSeed * 1.5) + aSeed * 40.0);
    vAlpha = twinkle * smoothstep(-30.0, -7.0, mv.z) * smoothstep(-2.0, -0.5, p.y) * 0.75;
  }
`;

const dustFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    gl_FragColor = vec4(vec3(0.82, 0.89, 1.0) * a, a);
  }
`;

const glintVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPixelRatio * (10.0 + aSeed * 12.0);
    vAlpha = pow(0.5 + 0.5 * sin(uTime * (0.7 + aSeed) + aSeed * 30.0), 3.0);
  }
`;

const glintFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float cross = max(0.0, 1.0 - abs(p.x) * 16.0) * max(0.0, 1.0 - abs(p.y) * 2.2)
                + max(0.0, 1.0 - abs(p.y) * 16.0) * max(0.0, 1.0 - abs(p.x) * 2.2);
    float core = smoothstep(0.14, 0.0, length(p));
    float a = (cross * 0.8 + core) * vAlpha;
    gl_FragColor = vec4(vec3(0.93, 0.96, 1.0) * a, a);
  }
`;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ── Scene ─────────────────────────────────────────────────────────────────────

export function createNightScene(
  canvas: HTMLCanvasElement,
  options: NightSceneOptions,
): NightScene {
  const { variant, dir, reducedMotion } = options;
  const mirror = dir === 'rtl' ? -1 : 1;
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const context = canvas.getContext('webgl2', {
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  if (!context) {
    throw new Error('WebGL 2 is not available');
  }
  const renderer = new WebGLRenderer({ canvas, context, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(pixelRatio);

  const scene = new Scene();
  scene.fog = new FogExp2(new Color(NIGHT), variant === 'hero' ? 0.052 : 0.045);
  const environment = track(environmentMap(renderer));
  scene.environment = environment.texture;

  const camera = new PerspectiveCamera(32, 1, 0.1, 120);
  const cameraBase =
    variant === 'hero' ? new Vector3(0, 0.35, 10.5) : new Vector3(0, -0.05, 11);
  const lookTarget = variant === 'hero' ? new Vector3(0, 0.12, 0) : new Vector3(0, 0.55, 0);
  camera.position.copy(cameraBase);
  camera.lookAt(lookTarget);

  // Rim light from behind and above: it finds the crests and nothing else.
  const rim = new DirectionalLight(new Color(ICE), variant === 'hero' ? 2.2 : 1.9);
  rim.position.set(-3 * mirror, 7, -12);
  scene.add(rim);
  const counterRim = new DirectionalLight(new Color('#c9dcf5'), variant === 'hero' ? 1.2 : 0.75);
  counterRim.position.set(6 * mirror, 4, -10);
  scene.add(counterRim);
  const fill = new DirectionalLight(new Color('#9db6d6'), 0.08);
  fill.position.set(2 * mirror, 3, 9);
  scene.add(fill);
  scene.add(new HemisphereLight(new Color('#1a2433'), new Color('#000000'), 0.2));

  // Where the crystal floats; recomputed on resize so it keeps its place on screen.
  let objectX = 0;

  const terrainMaterial = track(
    new MeshStandardMaterial({
      color: new Color(ROCK),
      roughness: 0.8,
      metalness: 0.15,
      flatShading: true,
      envMapIntensity: variant === 'hero' ? 0.34 : 0.18,
    }),
  );
  const terrain = new Mesh(terrainGeometry(variant, 0), terrainMaterial);
  terrain.userData['valleyX'] = 0;
  scene.add(terrain);

  // A still pool: dark, glossy, catching the strip lights and the crystal's twin.
  const pool = new Mesh(
    track(new CircleGeometry(1, 72)),
    track(
      new MeshPhysicalMaterial({
        color: new Color('#05080d'),
        roughness: 0.1,
        metalness: 0.9,
        envMapIntensity: variant === 'hero' ? 0.45 : 0.28,
        transparent: true,
        opacity: 0.88,
        alphaMap: track(radialFalloff()),
        depthWrite: false,
      }),
    ),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.scale.set(variant === 'hero' ? 7.5 : 13, variant === 'hero' ? 4 : 6, 1);
  pool.position.set(0, -1.78, variant === 'hero' ? 0.5 : -2);
  scene.add(pool);

  // The great arc — the lit edge of something much larger, far behind.
  const arcRadius = variant === 'hero' ? 3.55 : 8.6;
  const arcMaterial = track(
    new ShaderMaterial({
      vertexShader: arcVertex,
      fragmentShader: arcFragment,
      uniforms: {
        uRadius: { value: arcRadius },
        uReveal: { value: reducedMotion ? 1 : 0 },
        uStart: { value: variant === 'hero' ? -1.05 : -1.45 },
        uEnd: { value: variant === 'hero' ? 2.55 : 1.45 },
        uMirror: { value: mirror },
        uColor: { value: new Color(ICE) },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  const arcSize = arcRadius * 2 + 6;
  const arc = new Mesh(track(new PlaneGeometry(arcSize, arcSize)), arcMaterial);
  arc.position.set(0, variant === 'hero' ? 0.12 : -3.2, variant === 'hero' ? -6 : -14);
  scene.add(arc);

  // Dust: a few hundred lights at most, mostly invisible — atmosphere, not effect.
  const dustCount = variant === 'hero' ? 150 : 110;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSeeds = new Float32Array(dustCount);
  const dustRand = mulberry32(19);
  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (dustRand() - 0.5) * 22;
    dustPositions[i * 3 + 1] = dustRand() * 7 - 2;
    dustPositions[i * 3 + 2] = -dustRand() * 16 + 4;
    dustSeeds[i] = dustRand();
  }
  const dustGeometry = track(new BufferGeometry());
  dustGeometry.setAttribute('position', new BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute('aSeed', new BufferAttribute(dustSeeds, 1));
  const dustMaterial = track(
    new ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  const dust = new Points(dustGeometry, dustMaterial);
  scene.add(dust);

  // ── The object ────────────────────────────────────────────────────────────
  const object = new Group();
  let crystal: Mesh | undefined;
  let ringMaterial: ShaderMaterial | undefined;
  let glintMaterial: ShaderMaterial | undefined;
  const ring = new Group();

  if (variant === 'hero') {
    const geometry = track(crystalGeometry());
    const glass = track(
      new MeshPhysicalMaterial({
        color: new Color('#8592a6'),
        metalness: 0.94,
        roughness: 0.055,
        clearcoat: 0.6,
        clearcoatRoughness: 0.04,
        envMapIntensity: 1.7,
        flatShading: true,
      }),
    );
    crystal = new Mesh(geometry, glass);
    crystal.rotation.set(0.12, 0.4, -0.16);
    object.add(crystal);

    // Silver edges — what makes it read as engineered rather than grown.
    const edges = new LineSegments(
      track(new EdgesGeometry(geometry, 1)),
      track(
        new LineBasicMaterial({
          color: new Color('#d8e4f5'),
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        }),
      ),
    );
    edges.scale.setScalar(1.003);
    crystal.add(edges);

    // Glints at a few vertices.
    const source = geometry.getAttribute('position') as BufferAttribute;
    const seen = new Set<string>();
    const corners: number[] = [];
    for (let i = 0; i < source.count; i++) {
      const key = `${source.getX(i).toFixed(3)}:${source.getY(i).toFixed(3)}:${source.getZ(i).toFixed(3)}`;
      if (!seen.has(key)) {
        seen.add(key);
        corners.push(source.getX(i), source.getY(i), source.getZ(i));
      }
    }
    const glintRand = mulberry32(3);
    const picked: number[] = [];
    const seeds: number[] = [];
    for (let i = 0; i < corners.length / 3; i++) {
      if (glintRand() < 0.35) {
        picked.push(corners[i * 3], corners[i * 3 + 1], corners[i * 3 + 2]);
        seeds.push(glintRand());
      }
    }
    const glintGeometry = track(new BufferGeometry());
    glintGeometry.setAttribute('position', new BufferAttribute(new Float32Array(picked), 3));
    glintGeometry.setAttribute('aSeed', new BufferAttribute(new Float32Array(seeds), 1));
    glintMaterial = track(
      new ShaderMaterial({
        vertexShader: glintVertex,
        fragmentShader: glintFragment,
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
    crystal.add(new Points(glintGeometry, glintMaterial));

    // The twin in the pool, dimmer and flipped.
    const twin = new Mesh(
      geometry,
      track(
        new MeshPhysicalMaterial({
          color: new Color('#6b778a'),
          metalness: 0.9,
          roughness: 0.18,
          envMapIntensity: 0.9,
          flatShading: true,
          transparent: true,
          opacity: 0.35,
        }),
      ),
    );
    twin.name = 'twin';
    scene.add(twin);

    // The orbit: a hairline ring with one travelling glint.
    ringMaterial = track(
      new ShaderMaterial({
        vertexShader: ringVertex,
        fragmentShader: ringFragment,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 1 },
          uColor: { value: new Color(ICE) },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
    const orbit = new Mesh(track(new TorusGeometry(1.34, 0.006, 6, 400)), ringMaterial);
    ring.add(orbit);
    ring.rotation.set(1.08, 0.3 * mirror, 0.52 * mirror);
    object.add(ring);
    scene.add(object);

    // A narrow key light from above and in front: it finds the stone's facets
    // and the pool beneath it, and leaves the rock to the rim light.
    const key = new SpotLight(new Color('#ffffff'), 140, 0, 0.2, 0.7, 2);
    key.position.set(3.5 * mirror, 7, 8);
    key.target = object;
    scene.add(key);
  }

  const objectScale = 1.12;
  const objectBaseY = 0.32;
  object.position.set(0, objectBaseY, 0);
  object.scale.setScalar(objectScale * (reducedMotion ? 1 : 0.9));

  // ── State ─────────────────────────────────────────────────────────────────
  // Seconds since the scene started moving; frozen while it is stopped.
  let startedAt = 0;
  let pausedElapsed = 0;
  let compiled = false;
  let frame = 0;
  let running = false;
  let progress = 0;
  const pointer = { x: 0, y: 0 };
  const lean = { x: 0, y: 0 };
  let width = 1;
  let height = 1;
  let slowFrames = 0;
  let lastFrameAt = 0;

  const placeObject = (): void => {
    if (variant !== 'hero') {
      return;
    }
    const aspect = width / height;
    const distance = cameraBase.z;
    const halfWidth = Math.tan(((camera.fov / 2) * Math.PI) / 180) * distance * aspect;
    // Wide screens: on the side away from the copy. Narrow: centred.
    objectX = aspect > 1.15 ? halfWidth * 0.3 * mirror : 0;
    object.position.x = objectX;
    pool.position.x = objectX;
    arc.position.x = objectX;
    const twin = scene.getObjectByName('twin');
    if (twin && crystal) {
      twin.position.set(objectX, -1.78 * 2 - objectBaseY, 0);
      twin.scale.set(objectScale, -objectScale, objectScale);
      twin.rotation.copy(crystal.rotation);
    }
    // Rebuild the rock around the new valley, only when it moved enough to matter.
    const valley = terrain.userData['valleyX'] as number | undefined;
    if (valley === undefined || Math.abs(valley - objectX) > 0.4) {
      const next = terrainGeometry(variant, objectX);
      terrain.geometry.dispose();
      terrain.geometry = next;
      terrain.userData['valleyX'] = objectX;
    }
  };

  const draw = (): void => {
    const elapsed = running ? (performance.now() - startedAt) / 1000 : pausedElapsed;
    if (!reducedMotion) {
      const intro = easeOutCubic(Math.min(1, elapsed / 1.8));
      object.scale.setScalar(objectScale * (0.9 + 0.1 * intro));
      if (crystal) {
        crystal.rotation.y = 0.4 + elapsed * 0.11;
        object.position.y = objectBaseY + Math.sin(elapsed * 0.55) * 0.085;
        const twin = scene.getObjectByName('twin');
        if (twin) {
          twin.rotation.y = crystal.rotation.y;
          twin.position.y = -1.78 * 2 - object.position.y;
        }
      }
      ring.rotation.z = 0.52 * mirror + Math.sin(elapsed * 0.08) * 0.05;
      if (variant === 'hero') {
        arcMaterial.uniforms['uReveal'].value = easeOutCubic(Math.min(1, elapsed / 2.6));
      }
      lean.x += (pointer.x - lean.x) * 0.04;
      lean.y += (pointer.y - lean.y) * 0.04;
    }
    if (variant === 'horizon') {
      arcMaterial.uniforms['uReveal'].value = reducedMotion ? 1 : easeOutCubic(progress);
    }
    camera.position.set(
      cameraBase.x + lean.x * 0.32,
      cameraBase.y + lean.y * 0.18 + (variant === 'hero' ? progress * 0.6 : (1 - progress) * -0.35),
      cameraBase.z,
    );
    camera.lookAt(lookTarget.x + objectX * 0.08, lookTarget.y, lookTarget.z);
    dustMaterial.uniforms['uTime'].value = elapsed;
    if (ringMaterial) {
      ringMaterial.uniforms['uTime'].value = elapsed;
    }
    if (glintMaterial) {
      glintMaterial.uniforms['uTime'].value = elapsed;
    }
    renderer.render(scene, camera);
  };

  const loop = (now: number): void => {
    if (!running || !compiled) {
      frame = running ? requestAnimationFrame(loop) : 0;
      return;
    }
    // Adaptive quality: a GPU that cannot hold ~35 fps drops to 1× pixels.
    if (lastFrameAt) {
      slowFrames = now - lastFrameAt > 28 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
      if (slowFrames > 45 && pixelRatio > 1) {
        pixelRatio = 1;
        renderer.setPixelRatio(1);
        renderer.setSize(width, height, false);
        dustMaterial.uniforms['uPixelRatio'].value = 1;
        if (glintMaterial) {
          glintMaterial.uniforms['uPixelRatio'].value = 1;
        }
        slowFrames = 0;
      }
    }
    lastFrameAt = now;
    draw();
    frame = requestAnimationFrame(loop);
  };

  // Shaders compile off the main thread where the driver allows it; nothing is
  // drawn before that, so the first frame never blocks on a compile.
  const parallel = renderer.extensions.has('KHR_parallel_shader_compile');
  const ready = (
    parallel
      ? renderer.compileAsync(scene, camera)
      : new Promise<void>((resolve) =>
          setTimeout(() => {
            renderer.compile(scene, camera);
            resolve();
          }),
        )
  ).then(() => {
    compiled = true;
    draw();
  });

  return {
    ready,
    resize(nextWidth, nextHeight) {
      width = Math.max(1, Math.round(nextWidth));
      height = Math.max(1, Math.round(nextHeight));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      placeObject();
      if (compiled && !running) {
        draw();
      }
    },
    setPointer(x, y) {
      pointer.x = Math.max(-1, Math.min(1, x));
      pointer.y = Math.max(-1, Math.min(1, y));
    },
    setProgress(value) {
      progress = Math.max(0, Math.min(1, value));
      if (compiled && !running) {
        draw();
      }
    },
    start() {
      if (running || reducedMotion) {
        if (compiled) {
          draw();
        }
        return;
      }
      running = true;
      startedAt = performance.now() - pausedElapsed * 1000;
      lastFrameAt = 0;
      frame = requestAnimationFrame(loop);
    },
    stop() {
      if (running) {
        pausedElapsed = (performance.now() - startedAt) / 1000;
      }
      running = false;
      cancelAnimationFrame(frame);
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      terrain.geometry.dispose();
      disposables.forEach((item) => item.dispose());
      scene.traverse((node) => {
        const mesh = node as Mesh;
        if (mesh.material) {
          (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(
            (material: Material) => material.dispose(),
          );
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
