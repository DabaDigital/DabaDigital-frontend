/**
 * Target layouts for the home page's particle field — one `Float32Array` of
 * `count * 3` coordinates per scene chapter, in chapter order.
 *
 * Pure and deterministic: every generator draws from its own seeded random
 * source, so a particle lands in the same place on every visit and the specs can
 * pin the output. Nothing here knows about Three.js — the engine uploads these
 * arrays as vertex attributes and the shader interpolates between them.
 *
 * Every shape is centred on the origin and framed so its *core* fits a sphere of
 * radius {@link SHAPE_RADIUS}; one scale factor frames any of them. Halos, orbits
 * and dust deliberately spill past that radius — they are the faint part.
 *
 * Particle `i` of one shape has no spatial relationship to particle `i` of the
 * next. That is on purpose: a morph then reads as the cloud dissolving and
 * re-forming, rather than as one rigid sheet sliding into another.
 */

export const SHAPE_RADIUS = 1.6;

/** The six chapters, in page order. The index is the chapter number. */
export const SHAPE_NAMES = ['star', 'globe', 'terrain', 'tesseract', 'galaxy', 'arch'] as const;

export type ShapeName = (typeof SHAPE_NAMES)[number];

type Vec3 = readonly [number, number, number];
type Random = () => number;

/** mulberry32 — tiny, fast, and plenty for scattering dots. */
export function seededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample (Box–Muller). `1 - r` keeps `log(0)` out of reach. */
function gaussian(random: Random): number {
  return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
}

/**
 * Splits `count` into integer parts proportional to `weights`, summing to exactly
 * `count` (largest-remainder rounding). Every shape is built from sub-parts —
 * outline, halo, orbit — and none of them may leave a particle unplaced.
 */
export function allocate(count: number, weights: readonly number[]): number[] {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const exact = weights.map((weight) => (weight / total) * count);
  const parts = exact.map(Math.floor);
  let missing = count - parts.reduce((sum, part) => sum + part, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; missing > 0; i = (i + 1) % byRemainder.length, missing--) {
    parts[byRemainder[i].index]++;
  }
  return parts;
}

/** Sequential writer over the output buffer, so each sub-part just appends. */
class ShapeBuffer {
  readonly data: Float32Array;
  private cursor = 0;

  constructor(count: number) {
    this.data = new Float32Array(count * 3);
  }

  push(x: number, y: number, z: number): void {
    this.data[this.cursor++] = x;
    this.data[this.cursor++] = y;
    this.data[this.cursor++] = z;
  }
}

/**
 * Returns a sampler that picks a uniformly distributed point along a polyline:
 * a segment is chosen with probability proportional to its length, then a point
 * along it. Without the length weighting, short segments would come out denser.
 */
function polyline(vertices: readonly Vec3[], closed: boolean, random: Random): () => Vec3 {
  const segments: { a: Vec3; b: Vec3; end: number }[] = [];
  let length = 0;
  const last = closed ? vertices.length : vertices.length - 1;
  for (let i = 0; i < last; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    length += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    segments.push({ a, b, end: length });
  }
  return () => {
    const at = random() * length;
    const segment = segments.find((candidate) => candidate.end >= at) ?? segments[segments.length - 1];
    const t = random();
    return [
      segment.a[0] + (segment.b[0] - segment.a[0]) * t,
      segment.a[1] + (segment.b[1] - segment.a[1]) * t,
      segment.a[2] + (segment.b[2] - segment.a[2]) * t,
    ];
  };
}

/** Uniform direction on the unit sphere. */
function direction(random: Random): Vec3 {
  const z = random() * 2 - 1;
  const angle = random() * Math.PI * 2;
  const ring = Math.sqrt(1 - z * z);
  return [Math.cos(angle) * ring, Math.sin(angle) * ring, z];
}

/** Vertices of an n-pointed star, alternating outer and inner radius. */
function starVertices(points: number, outer: number, inner: number, rotation: number): Vec3[] {
  const vertices: Vec3[] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = rotation + (i * Math.PI) / points;
    vertices.push([Math.cos(angle) * radius, Math.sin(angle) * radius, 0]);
  }
  return vertices;
}

/** Four corners on a circle of `radius`, starting at `rotation`. */
function squareVertices(radius: number, rotation: number): Vec3[] {
  return [0, 1, 2, 3].map((i) => {
    const angle = rotation + (i * Math.PI) / 2;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius, 0] as const;
  });
}

// ── 0 · Khatam ────────────────────────────────────────────────────────────────

/**
 * The khatam — the eight-pointed star of zellige, two squares turned 45° to each
 * other — with a nested inner star, a central ring, a tilted orbit and a halo.
 * The outline is drawn on two faces, so the star has visible thickness when it
 * sways.
 */
export function khatamStar(count: number, random: Random): Float32Array {
  const out = new ShapeBuffer(count);
  const outer = 1.45;
  // Where an edge of one square crosses an edge of the other.
  const inner = (outer * Math.cos(Math.PI / 4)) / Math.cos(Math.PI / 8);

  const outline = polyline(starVertices(8, outer, inner, 0), true, random);
  const squareA = polyline(squareVertices(outer, 0), true, random);
  const squareB = polyline(squareVertices(outer, Math.PI / 4), true, random);
  const nested = polyline(starVertices(8, outer * 0.52, inner * 0.52, Math.PI / 8), true, random);

  const [nOutline, nSquares, nNested, nRing, nOrbit, nHalo] = allocate(
    count,
    [0.3, 0.16, 0.13, 0.06, 0.15, 0.2],
  );

  for (let i = 0; i < nOutline; i++) {
    const [x, y] = outline();
    const face = random() < 0.5 ? -0.14 : 0.14;
    out.push(x + gaussian(random) * 0.012, y + gaussian(random) * 0.012, face + gaussian(random) * 0.02);
  }
  for (let i = 0; i < nSquares; i++) {
    const [x, y] = (random() < 0.5 ? squareA : squareB)();
    out.push(x, y, gaussian(random) * 0.05);
  }
  for (let i = 0; i < nNested; i++) {
    const [x, y] = nested();
    out.push(x, y, gaussian(random) * 0.04);
  }
  for (let i = 0; i < nRing; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 0.3 + gaussian(random) * 0.012;
    out.push(Math.cos(angle) * radius, Math.sin(angle) * radius, gaussian(random) * 0.03);
  }
  // A planetary ring tipped ~66° towards the viewer, so it reads as an ellipse.
  const tilt = 1.15;
  for (let i = 0; i < nOrbit; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 2.05 + gaussian(random) * 0.035;
    const x = Math.cos(angle) * radius;
    const along = Math.sin(angle) * radius;
    out.push(x, along * Math.cos(tilt), along * Math.sin(tilt));
  }
  for (let i = 0; i < nHalo; i++) {
    const [dx, dy, dz] = direction(random);
    const radius = 1.65 + random() ** 2 * 2.2;
    out.push(dx * radius, dy * radius, dz * radius * 0.6);
  }
  return out.data;
}

// ── 1 · Globe ─────────────────────────────────────────────────────────────────

/** Latitude/longitude in degrees → unit vector, with longitude 0 facing the viewer. */
function fromLatLon(lat: number, lon: number): Vec3 {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  return [Math.cos(phi) * Math.sin(lambda), Math.sin(phi), Math.cos(phi) * Math.cos(lambda)];
}

/** Spherical interpolation between two unit vectors. */
function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-5) {
    return a;
  }
  const sinOmega = Math.sin(omega);
  const wa = Math.sin((1 - t) * omega) / sinOmega;
  const wb = Math.sin(t * omega) / sinOmega;
  return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
}

/** Casablanca, where every arc starts. */
const HOME: readonly [number, number] = [33.57, -7.59];

/** Arc destinations — the markets a Moroccan studio actually ships to. */
const DESTINATIONS: readonly (readonly [number, number])[] = [
  [48.86, 2.35], // Paris
  [51.51, -0.13], // London
  [40.42, -3.7], // Madrid
  [52.52, 13.4], // Berlin
  [45.5, -73.57], // Montréal
  [40.71, -74.0], // New York
  [25.2, 55.27], // Dubai
  [24.71, 46.68], // Riyadh
  [14.69, -17.44], // Dakar
  [5.35, -4.0], // Abidjan
];

/**
 * A dotted sphere with flight arcs leaving Casablanca, and a beacon standing on
 * it. No country outlines — the arcs say "from Morocco, to everywhere" without
 * drawing a single border.
 */
export function globe(count: number, random: Random): Float32Array {
  const out = new ShapeBuffer(count);
  const radius = 1.3;
  const [nSurface, nArcs, nBeacon, nShell] = allocate(count, [0.6, 0.26, 0.04, 0.1]);

  // Fibonacci lattice: an even spread of dots with no clumping at the poles.
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < nSurface; i++) {
    const y = 1 - ((i + 0.5) / nSurface) * 2;
    const ring = Math.sqrt(1 - y * y);
    const angle = golden * i;
    const r = radius * (1 + gaussian(random) * 0.004);
    out.push(Math.cos(angle) * ring * r, y * r, Math.sin(angle) * ring * r);
  }

  const home = fromLatLon(HOME[0], HOME[1]);
  for (let i = 0; i < nArcs; i++) {
    const target = DESTINATIONS[Math.floor(random() * DESTINATIONS.length)];
    const end = fromLatLon(target[0], target[1]);
    const t = random();
    const [x, y, z] = slerp(home, end, t);
    const span = Math.acos(home[0] * end[0] + home[1] * end[1] + home[2] * end[2]);
    // Longer flights arc higher, as they would on a real route map.
    const lift = 1 + Math.sin(Math.PI * t) * (0.1 + span * 0.28);
    out.push(x * radius * lift, y * radius * lift, z * radius * lift);
  }

  for (let i = 0; i < nBeacon; i++) {
    const height = 1 + random() * 0.45;
    const jitter = 0.012;
    out.push(
      home[0] * radius * height + gaussian(random) * jitter,
      home[1] * radius * height + gaussian(random) * jitter,
      home[2] * radius * height + gaussian(random) * jitter,
    );
  }

  for (let i = 0; i < nShell; i++) {
    const [dx, dy, dz] = direction(random);
    const r = radius * (1.14 + gaussian(random) * 0.03);
    out.push(dx * r, dy * r, dz * r);
  }
  return out.data;
}

// ── 2 · Terrain ───────────────────────────────────────────────────────────────

/** Rolling ground with a mountain ridge along the back — the Atlas, loosely. */
function terrainHeight(x: number, z: number, width: number): number {
  const rolling = 0.22 * Math.sin(x * 1.1 + z * 0.6) + 0.12 * Math.sin(x * 2.3 - z * 1.7);
  const ridge =
    0.75 * Math.exp(-((z + 0.9) ** 2) * 1.6) * (0.55 + 0.45 * Math.sin(x * 1.3 + 0.8));
  const falloff = 1 - (Math.abs(x) / width) * 0.8;
  return rolling + ridge * falloff;
}

/**
 * A wide field of dots lying flat (y up), with fireflies above it. The engine
 * tips it towards the camera and runs a swell through it, so it reads as a
 * landscape under the project gallery rather than as a grid.
 */
export function terrain(count: number, random: Random): Float32Array {
  const out = new ShapeBuffer(count);
  const width = 7.2;
  const depth = 4.4;
  const [nGround, nSparks] = allocate(count, [0.92, 0.08]);

  const columns = Math.max(2, Math.round(Math.sqrt((nGround * width) / depth)));
  const rows = Math.max(2, Math.ceil(nGround / columns));
  for (let i = 0; i < nGround; i++) {
    const column = i % columns;
    const row = Math.floor(i / columns);
    const x = (column / (columns - 1) - 0.5) * width + gaussian(random) * 0.01;
    const z = (row / (rows - 1) - 0.5) * depth + gaussian(random) * 0.01;
    out.push(x, terrainHeight(x, z, width) - 0.35, z);
  }
  for (let i = 0; i < nSparks; i++) {
    const x = (random() - 0.5) * width;
    const z = (random() - 0.5) * depth;
    out.push(x, terrainHeight(x, z, width) - 0.35 + 0.25 + random() * 1.1, z);
  }
  return out.data;
}

// ── 3 · Tesseract ─────────────────────────────────────────────────────────────

/**
 * A cube inside a cube, corners joined — the usual drawing of a tesseract. Six
 * disciplines, one structure: it tumbles slowly while the services scroll by.
 */
export function tesseract(count: number, random: Random): Float32Array {
  const out = new ShapeBuffer(count);
  const corners = (size: number): Vec3[] => {
    const list: Vec3[] = [];
    for (const x of [-size, size]) {
      for (const y of [-size, size]) {
        for (const z of [-size, size]) {
          list.push([x, y, z]);
        }
      }
    }
    return list;
  };
  const outer = corners(1.05);
  const inner = corners(0.52);

  // Two corners share an edge exactly when they differ in one coordinate.
  const edges = (list: Vec3[]): [Vec3, Vec3][] => {
    const pairs: [Vec3, Vec3][] = [];
    for (let a = 0; a < list.length; a++) {
      for (let b = a + 1; b < list.length; b++) {
        const differences = [0, 1, 2].filter((axis) => list[a][axis] !== list[b][axis]).length;
        if (differences === 1) {
          pairs.push([list[a], list[b]]);
        }
      }
    }
    return pairs;
  };
  const outerEdges = edges(outer);
  const innerEdges = edges(inner);
  const connectors = outer.map((corner, index): [Vec3, Vec3] => [corner, inner[index]]);

  const along = (pairs: [Vec3, Vec3][], jitter: number): void => {
    const [a, b] = pairs[Math.floor(random() * pairs.length)];
    const t = random();
    out.push(
      a[0] + (b[0] - a[0]) * t + gaussian(random) * jitter,
      a[1] + (b[1] - a[1]) * t + gaussian(random) * jitter,
      a[2] + (b[2] - a[2]) * t + gaussian(random) * jitter,
    );
  };

  const [nOuter, nInner, nConnect, nFaces, nCore, nDust] = allocate(
    count,
    [0.4, 0.22, 0.16, 0.1, 0.06, 0.06],
  );
  for (let i = 0; i < nOuter; i++) along(outerEdges, 0.012);
  for (let i = 0; i < nInner; i++) along(innerEdges, 0.01);
  for (let i = 0; i < nConnect; i++) along(connectors, 0.01);
  for (let i = 0; i < nFaces; i++) {
    const axis = Math.floor(random() * 3);
    const side = random() < 0.5 ? -1.05 : 1.05;
    const point = [(random() * 2 - 1) * 1.05, (random() * 2 - 1) * 1.05, (random() * 2 - 1) * 1.05];
    point[axis] = side;
    out.push(point[0], point[1], point[2]);
  }
  for (let i = 0; i < nCore; i++) {
    out.push(gaussian(random) * 0.1, gaussian(random) * 0.1, gaussian(random) * 0.1);
  }
  for (let i = 0; i < nDust; i++) {
    const [dx, dy, dz] = direction(random);
    const r = 1.9 + random() * 1.2;
    out.push(dx * r, dy * r, dz * r);
  }
  return out.data;
}

// ── 4 · Galaxy ────────────────────────────────────────────────────────────────

/**
 * A three-armed spiral lying flat (y up); the engine tips it so it is seen at an
 * angle. "From idea to real growth": something small at the centre, winding out.
 */
export function galaxy(count: number, random: Random): Float32Array {
  const out = new ShapeBuffer(count);
  const arms = 3;
  const reach = 2.1;
  const [nArms, nCore, nDust] = allocate(count, [0.72, 0.16, 0.12]);

  for (let i = 0; i < nArms; i++) {
    const t = random() ** 0.8;
    const radius = 0.18 + t * reach;
    const arm = Math.floor(random() * arms);
    const angle = (arm * Math.PI * 2) / arms + radius * 2.1 + gaussian(random) * 0.28 * (1.1 - t);
    out.push(
      Math.cos(angle) * radius + gaussian(random) * 0.07 * (1 + t),
      gaussian(random) * 0.06 * (1.2 - t),
      Math.sin(angle) * radius + gaussian(random) * 0.07 * (1 + t),
    );
  }
  for (let i = 0; i < nCore; i++) {
    out.push(gaussian(random) * 0.28, gaussian(random) * 0.14, gaussian(random) * 0.28);
  }
  for (let i = 0; i < nDust; i++) {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 2.6;
    out.push(Math.cos(angle) * radius, gaussian(random) * 0.15, Math.sin(angle) * radius);
  }
  return out.data;
}

// ── 5 · Arch ──────────────────────────────────────────────────────────────────

/**
 * A Moroccan horseshoe arch — a bab — in its rectangular frame (the alfiz), with
 * a small khatam in each spandrel and light spilling from the doorway. The last
 * chapter sits beside the contact form: the door is open.
 *
 * What makes it a horseshoe rather than a round arch is `overshoot`: the arc runs
 * past the half-circle on both sides, so the opening at the bottom is narrower
 * than the arch is wide.
 */
export function moroccanArch(count: number, random: Random): Float32Array {
  const out = new ShapeBuffer(count);
  const innerRadius = 0.95;
  const outerRadius = 1.22;
  const centreY = 0.55;
  const overshoot = 0.5;
  const ground = -1.45;
  const frameHalfWidth = 1.55;
  const frameTop = centreY + outerRadius + 0.28;
  // Centre the whole composition vertically on the origin.
  const shift = -(ground + frameTop) / 2;

  const contour = (radius: number, jambX: number): Vec3[] => {
    const vertices: Vec3[] = [[jambX, ground, 0]];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const angle = -overshoot + ((Math.PI + 2 * overshoot) * i) / steps;
      vertices.push([Math.cos(angle) * radius, centreY + Math.sin(angle) * radius, 0]);
    }
    vertices.push([-jambX, ground, 0]);
    return vertices;
  };
  const jamb = innerRadius * Math.cos(overshoot);
  const innerContour = polyline(contour(innerRadius, jamb), false, random);
  const outerContour = polyline(
    contour(outerRadius, jamb + (outerRadius - innerRadius)),
    false,
    random,
  );
  const frame = polyline(
    [
      [-frameHalfWidth, ground, 0],
      [-frameHalfWidth, frameTop, 0],
      [frameHalfWidth, frameTop, 0],
      [frameHalfWidth, ground, 0],
    ],
    false,
    random,
  );
  const spandrelOuter = 0.2;
  const spandrelInner = (spandrelOuter * Math.cos(Math.PI / 4)) / Math.cos(Math.PI / 8);
  const spandrel = polyline(starVertices(8, spandrelOuter, spandrelInner, 0), true, random);

  const [nInner, nOuter, nBand, nFrame, nStars, nDoor, nGround] = allocate(
    count,
    [0.24, 0.18, 0.1, 0.14, 0.06, 0.2, 0.08],
  );

  const face = (): number => (random() < 0.5 ? -0.18 : 0.18) + gaussian(random) * 0.02;
  for (let i = 0; i < nInner; i++) {
    const [x, y] = innerContour();
    out.push(x, y + shift, face());
  }
  for (let i = 0; i < nOuter; i++) {
    const [x, y] = outerContour();
    out.push(x, y + shift, face());
  }
  // Voussoirs: a sparse fill between the two arcs, so the band has body.
  for (let i = 0; i < nBand; i++) {
    const angle = -overshoot + random() * (Math.PI + 2 * overshoot);
    const radius = innerRadius + random() * (outerRadius - innerRadius);
    out.push(
      Math.cos(angle) * radius,
      centreY + Math.sin(angle) * radius + shift,
      (random() * 2 - 1) * 0.18,
    );
  }
  for (let i = 0; i < nFrame; i++) {
    const [x, y] = frame();
    out.push(x, y + shift, face() * 0.8);
  }
  for (let i = 0; i < nStars; i++) {
    const [x, y] = spandrel();
    const side = random() < 0.5 ? -1 : 1;
    out.push(side * 1.12 + x, centreY + 0.98 + y + shift, gaussian(random) * 0.03);
  }
  // Light through the doorway: recessed, and densest near the threshold.
  for (let i = 0; i < nDoor; i++) {
    const x = (random() * 2 - 1) * jamb * 0.94;
    const archAt = centreY + Math.sqrt(Math.max(0, innerRadius ** 2 - x * x));
    const y = ground + (archAt - ground) * random() ** 1.6;
    out.push(x, y + shift, -0.35 + gaussian(random) * 0.08);
  }
  for (let i = 0; i < nGround; i++) {
    out.push((random() * 2 - 1) * 2.3, ground + shift + gaussian(random) * 0.015, (random() * 2 - 1) * 0.5);
  }
  return out.data;
}

const GENERATORS: Readonly<Record<ShapeName, { build: (count: number, random: Random) => Float32Array; seed: number }>> =
  {
    star: { build: khatamStar, seed: 0x5eed01 },
    globe: { build: globe, seed: 0x5eed02 },
    terrain: { build: terrain, seed: 0x5eed03 },
    tesseract: { build: tesseract, seed: 0x5eed04 },
    galaxy: { build: galaxy, seed: 0x5eed05 },
    arch: { build: moroccanArch, seed: 0x5eed06 },
  };

/** All six chapter shapes for `count` particles, in chapter order. */
export function buildShapes(count: number): Float32Array[] {
  return SHAPE_NAMES.map((name) => {
    const { build, seed } = GENERATORS[name];
    return build(count, seededRandom(seed));
  });
}

/**
 * Per-particle constants packed as one vec4 attribute:
 * x — stagger/random (0–1), y — size multiplier, z — phase, w — 1 for an accent
 * particle. About one in eleven particles takes the accent colour: the lanterns
 * in a night-time medina.
 */
export function buildSeeds(count: number): Float32Array {
  const random = seededRandom(0x5eed99);
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    seeds[i * 4] = random();
    seeds[i * 4 + 1] = 0.55 + random() ** 2 * 1.1;
    seeds[i * 4 + 2] = random();
    seeds[i * 4 + 3] = random() < 0.09 ? 1 : 0;
  }
  return seeds;
}
