import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Engine layout, in millimetres. Frame: +x = the engine's left (driver's side
// in a left-hand-drive car), +y = up, +z = front (timing end). The crank axis
// is the z axis. Main dimensions follow the GM LS3 (6.2 L Gen IV small block).
// ---------------------------------------------------------------------------
export const S = 111.76;          // bore spacing, 4.400 in
export const BORE = 103.25;       // 4.065 in
export const R = 46;              // crank throw (stroke 92 mm / 3.622 in)
export const L = 154.9;           // connecting-rod centre distance, 6.098 in
export const CH = 33.8;           // piston compression height
export const DECK = R + L + CH;   // 234.7 mm, 9.240 in deck height
export const BANK_Z = 10.5;       // left bank sits this far forward of the right
export const ROCKER_RATIO = 1.7;
export const VALVE_LIFT = { intake: 14.0, exhaust: 13.26 }; // 0.551 / 0.522 in at the valve
export const FIRING = [1, 8, 7, 2, 6, 5, 4, 3];
export const CAM = new THREE.Vector3(0, 118, 0);

const DEG = Math.PI / 180;
const RT = Math.SQRT1_2;
export const U_L = new THREE.Vector3(RT, RT, 0);   // left bore axis (outward)
export const W_L = new THREE.Vector3(RT, -RT, 0);  // left bank, towards the exhaust side
const ZA = new THREE.Vector3(0, 0, 1);
// Bank parts are modelled once in left-bank coordinates (x = w, y = u along
// the bore, z) and mirrored for the right bank, which sits 21 mm further back.
export const M_LEFT = new THREE.Matrix4().makeBasis(W_L, U_L, ZA);
export const M_RIGHT = new THREE.Matrix4().makeTranslation(0, 0, -2 * BANK_Z)
  .multiply(new THREE.Matrix4().makeScale(-1, 1, 1)).multiply(M_LEFT);
const CAM_U = CAM.dot(U_L), CAM_W = CAM.dot(W_L);

// Cross-plane crank: pins at 0°, 90°, 270°, 180° (front to rear), expressed as
// the angle from vertical towards +x at crank angle 0 (cylinder 1 at TDC).
const PIN_PHASE = [45, 135, -45, -135];

// Valve timing (crank degrees relative to the gas-exchange TDC). A 117° lobe
// separation with ~4° of advance, and ~280° of advertised duration.
const INTAKE_CL = 113, EXHAUST_CL = 121, HALF_CAM = 70;

export const CYLINDERS = [];
for (let n = 1; n <= 8; n++) {
  const left = n % 2 === 1;
  const k = Math.floor((n - 1) / 2);
  const localZ = (1.5 - k) * S + BANK_Z;
  const dE = k % 2 === 0 ? 22 : -22; // head pattern front-to-rear: E I I E E I I E
  CYLINDERS.push({
    n, k, bank: left ? 'left' : 'right', beta: left ? 45 : -45, phase: PIN_PHASE[k],
    z: left ? localZ : localZ - 2 * BANK_Z, localZ,
    fire: FIRING.indexOf(n) * 90,
    valves: { exhaust: localZ + dE, intake: localZ - dE },
  });
}

export function bump(d) {
  d = ((d % 360) + 540) % 360 - 180;
  if (Math.abs(d) >= HALF_CAM) return 0;
  const c = Math.cos((Math.PI * d) / (2 * HALF_CAM));
  return c * c;
}
export function peakAngle(cyl, kind) {
  return cyl.fire + 360 + (kind === 'intake' ? INTAKE_CL : -EXHAUST_CL);
}
// Lift at the lifter (mm) for crank angle theta (degrees).
export function lifterLift(cyl, kind, theta) {
  return (VALVE_LIFT[kind] / ROCKER_RATIO) * bump((theta - peakAngle(cyl, kind)) / 2);
}
// Slider-crank: crank pin and wrist pin positions (xy) for crank angle theta.
export function sliderCrank(cyl, theta, pin, wrist) {
  const psi = (cyl.phase + theta) * DEG, beta = cyl.beta * DEG;
  const a = psi - beta, sa = Math.sin(a);
  const d = R * Math.cos(a) + Math.sqrt(L * L - R * R * sa * sa);
  pin.set(R * Math.sin(psi), R * Math.cos(psi), cyl.z);
  wrist.set(d * Math.sin(beta), d * Math.cos(beta), cyl.z);
}

// ---------------------------------------------------------------------------
// Geometry helpers. Everything is reduced to plain position arrays, merged, and
// then given creased normals, so hard edges stay crisp and curves stay smooth.
// ---------------------------------------------------------------------------
function positions(g) {
  const ng = g.index ? g.toNonIndexed() : g;
  return ng.attributes.position.array;
}
function flipWinding(arr) {
  for (let i = 0; i < arr.length; i += 9) {
    for (let j = 0; j < 3; j++) { const t = arr[i + 3 + j]; arr[i + 3 + j] = arr[i + 6 + j]; arr[i + 6 + j] = t; }
  }
  return arr;
}
function signedVolume(arr) {
  let v = 0;
  for (let i = 0; i < arr.length; i += 9) {
    const ax = arr[i], ay = arr[i + 1], az = arr[i + 2], bx = arr[i + 3], by = arr[i + 4], bz = arr[i + 5], cx = arr[i + 6], cy = arr[i + 7], cz = arr[i + 8];
    v += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
  }
  return v;
}
// Make a closed solid face outward.
function orient(g) {
  const arr = Float32Array.from(positions(g));
  if (signedVolume(arr) < 0) flipWinding(arr);
  return geo(arr);
}
function geo(arr) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  return g;
}
function merge(list) {
  const arrs = list.filter(Boolean).map(positions);
  const out = new Float32Array(arrs.reduce((s, a) => s + a.length, 0));
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return geo(out);
}
function xf(g, m) { g.applyMatrix4(m); return g; }
function mirrorX(g, dz = 0) {
  const arr = Float32Array.from(positions(g));
  for (let i = 0; i < arr.length; i += 3) { arr[i] = -arr[i]; arr[i + 2] += dz; }
  return geo(flipWinding(arr));
}
const toLeft = (g) => xf(g.clone(), M_LEFT);
const toRight = (g) => mirrorX(xf(g.clone(), M_LEFT), -2 * BANK_Z);

function box(x0, x1, y0, y1, z0, z1) {
  return new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
}
// Cylinder along z.
function cylZ(r, z0, z1, x = 0, y = 0, seg = 28) {
  return new THREE.CylinderGeometry(r, r, z1 - z0, seg).rotateX(Math.PI / 2).translate(x, y, (z0 + z1) / 2);
}
// Cylinder along y.
function cylY(r, y0, y1, x = 0, z = 0, seg = 24) {
  return new THREE.CylinderGeometry(r, r, y1 - y0, seg).translate(x, (y0 + y1) / 2, z);
}
const UP = new THREE.Vector3(0, 1, 0);
function between(a, b, r, seg = 12, r2 = r) {
  const d = b.clone().sub(a);
  const g = new THREE.CylinderGeometry(r2, r, d.length(), seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()));
  return g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
}
// Revolve an (r, axial) profile around y.
function lathe(pts, seg = 36) {
  return orient(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg));
}
// Revolve around the z axis, centred at (x, y).
function latheZ(pts, x = 0, y = 0, seg = 40) {
  return lathe(pts, seg).rotateX(Math.PI / 2).translate(x, y, 0);
}
function shapeFrom(pts, holes = []) {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) s.holes.push(h);
  return s;
}
function circleHole(x, y, r) {
  const p = new THREE.Path();
  p.absarc(x, y, r, 0, Math.PI * 2, true);
  return p;
}
// Extrude a 2D outline in the xy plane between z0 and z1.
function extrude(shape, z0, z1, curveSegments = 20) {
  return new THREE.ExtrudeGeometry(shape, { depth: z1 - z0, bevelEnabled: false, curveSegments }).translate(0, 0, z0);
}
function arc(cx, cy, r, a0, a1, n = 16) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + ((a1 - a0) * i) / n) * DEG;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}
function circlePts(cx, cy, r, n = 40) {
  return arc(cx, cy, r, 0, 360 - 360 / n, n - 1);
}
function hull2d(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}
function hullOfCircles(circles, grow = 0, n = 48) {
  return hull2d(circles.flatMap(([x, y, r]) => circlePts(x, y, r + grow, n)));
}
// Gear / sprocket outline.
function gearPts(r, teeth, depth) {
  const out = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const rr = i % 4 === 1 || i % 4 === 2 ? r : r - depth;
    out.push([rr * Math.cos(a), rr * Math.sin(a)]);
  }
  return out;
}
class Helix extends THREE.Curve {
  constructor(r, h, turns) { super(); this.r = r; this.h = h; this.turns = turns; }
  getPoint(t, target = new THREE.Vector3()) {
    const a = t * this.turns * Math.PI * 2;
    return target.set(this.r * Math.cos(a), this.h * t, this.r * Math.sin(a));
  }
}
function tube(points, r, seg = 40, radial = 12) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  return new THREE.TubeGeometry(curve, seg, r, radial, false);
}

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------
function cylinderBlock() {
  // Crankcase: cross-section extruded along the crank, open at the pan rail.
  const outline = [[-118, -105], [-100, -105], ...arc(0, 0, 102, 191.3, -11.3, 28), [100, -105], [118, -105], [122, -30],
    [114.5, 26.9], [62.4, 150], [-62.4, 150], [-114.5, 26.9], [-122, -30]];
  const crankcase = extrude(shapeFrom(outline), -245, 245, 4);

  // Cylinder barrels (deck) with open bores for the liners.
  const zs = [0, 1, 2, 3].map((k) => (1.5 - k) * S + BANK_Z);
  const deck = extrude(shapeFrom([[-62, 219.5], [62, 219.5], [62, -240.5], [-62, -240.5]], zs.map((z) => circleHole(0, -z, 55.5))), 0, DECK - 100, 40)
    .rotateX(-Math.PI / 2).translate(0, 100, 0);
  const plugs = zs.slice(0, 3).map((z) => new THREE.CylinderGeometry(15, 15, 4, 20).rotateZ(Math.PI / 2).translate(64, 165, z - S / 2));
  const bank = merge([deck, ...plugs]);
  const mounts = [1, -1].flatMap((s) => [60, -60].map((z) => box(s > 0 ? 118 : -134, s > 0 ? 134 : -118, -45, 15, z - 30, z + 30)));
  return merge([crankcase, toLeft(bank), toRight(bank), ...mounts]);
}

function liners() {
  const ring = lathe([[51.6, 104], [55, 104], [55, DECK], [51.6, DECK], [51.6, 104]], 40);
  return merge([0, 1, 2, 3].map((k) => ring.clone().translate(0, 0, (1.5 - k) * S + BANK_Z)));
}

function mainCaps() {
  const cap = [[-75, 0], [-36, 0], ...arc(0, 0, 36, 180, 360, 16), [36, 0], [75, 0], [75, -45], [60, -62], [-60, -62], [-75, -45]];
  const list = [];
  for (let i = -2; i <= 2; i++) {
    const z = i * S;
    list.push(extrude(shapeFrom(cap), z - 12, z + 12, 16));
    for (const x of [-64, -45, 45, 64]) list.push(cylY(6.5, -70, -62, x, z, 6));
    for (const s of [-1, 1]) list.push(new THREE.CylinderGeometry(6, 6, 30, 6).rotateZ(Math.PI / 2).translate(s * 108, -25, z));
  }
  return merge(list);
}

function oilPan() {
  const u = [[-124, -105], [-108, -105], [-104, -205], [104, -205], [108, -105], [124, -105], [124, -113], [116, -113], [112, -215], [-112, -215], [-116, -113], [-124, -113]];
  const list = [extrude(shapeFrom(u), -245, 245, 4)];
  for (const z of [-245, 239]) list.push(box(-112, 112, -215, -105, z, z + 6));
  for (let i = -3; i <= 3; i++) list.push(box(-100, 100, -221, -215, i * 60 - 3, i * 60 + 3));
  list.push(cylY(10, -229, -215, 0, -150, 6));
  return merge(list);
}

function crankshaft() {
  const list = [];
  for (let i = -2; i <= 2; i++) list.push(cylZ(32.5, i * S - 12.5, i * S + 12.5));
  const web = shapeFrom([...arc(0, R, 34, 0, 180, 18), ...arc(0, 0, 74, 200, 340, 18)]);
  for (let k = 0; k < 4; k++) {
    const z = (1.5 - k) * S, ph = PIN_PHASE[k] * DEG;
    const px = R * Math.sin(ph), py = R * Math.cos(ph);
    list.push(cylZ(26.7, z - 22, z + 22, px, py));
    for (const s of [-1, 1]) {
      const z0 = z + s * 22, z1 = z + s * 40;
      list.push(extrude(web, Math.min(z0, z1), Math.max(z0, z1), 18).rotateZ(-ph));
    }
  }
  list.push(cylZ(20, 2 * S + 12, 418));
  list.push(cylZ(46, -262, -2 * S - 12));
  return merge(list);
}

function connectingRod() {
  const pts = [...arc(0, 0, 38, 60, -240, 30), ...arc(0, L, 17, 190, -10, 16)];
  const g = extrude(shapeFrom(pts, [circleHole(0, 0, 27.5), circleHole(0, L, 12)]), -10.5, 10.5, 28);
  const ribs = [-1, 1].map((s) => box(-9, 9, 40, L - 20, s * 10.5 - 1.5, s * 10.5 + 1.5));
  const bolts = [-31, 31].map((x) => cylY(5.5, -44, -30, x, 0, 6));
  return merge([g, ...ribs, ...bolts]);
}

function piston() {
  const g = lathe([
    [0, CH], [51.4, CH], [51.4, 30.5], [50.1, 30.5], [50.1, 29], [51.4, 29], [51.4, 26], [50.1, 26], [50.1, 24.5], [51.4, 24.5],
    [51.4, 21], [50.1, 21], [50.1, 17], [51.4, 17], [51.4, 8], [50.8, 6], [50.8, -32], [45, -32], [45, 16], [0, 20],
  ], 48);
  return merge([g, cylZ(12, -30, 30, 0, 0, 20)]);
}

function cylinderHead() {
  const prof = [[-64, 236.3], [72, 236.3], [72, 300], [62, 318], [-54, 318], [-64, 300]];
  const list = [extrude(shapeFrom(prof), -224, 244, 4)];
  list.push(box(-33, -18, 318, 368, -224, 244));
  for (const c of CYLINDERS.filter((q) => q.bank === 'left')) {
    list.push(box(-70, -64, 252, 300, c.valves.intake - 19, c.valves.intake + 19));
    list.push(box(72, 78, 256, 290, c.valves.exhaust - 16, c.valves.exhaust + 16));
    const zp = plugZ(c);
    list.push(between(new THREE.Vector3(25 + 0.8 * 45, 248 + 0.6 * 45, zp), new THREE.Vector3(25 + 0.8 * 66, 248 + 0.6 * 66, zp), 13, 16));
  }
  return merge(list);
}
const plugZ = (c) => c.localZ - Math.sign(c.valves.exhaust - c.localZ) * 8;

function headGasket() {
  const holes = [0, 1, 2, 3].map((k) => circleHole(0, -((1.5 - k) * S + BANK_Z), 52.6));
  return extrude(shapeFrom([[-64, 224], [72, 224], [72, -244], [-64, -244]], holes), 0, 1.6, 40)
    .rotateX(-Math.PI / 2).translate(0, DECK, 0);
}

function valveCover() {
  const prof = [[-52, 318], [58, 318], [58, 378], [42, 410], [-36, 410], [-52, 382]];
  const list = [extrude(shapeFrom(prof), -222, 243, 4), box(-58, 64, 318, 324, -226, 247)];
  list.push(cylY(22, 405, 424, 10, 140, 28));
  for (let i = 0; i < 4; i++) list.push(box(-20, 30, 409, 412, 180 - i * 120, 186 - i * 120));
  return merge(list);
}

function sparkPlugs() {
  const plug = merge([
    cylY(1.2, -3, 0, 0, 0, 6), cylY(7, 0, 19), cylY(10.5, 19, 30, 0, 0, 6), cylY(6.5, 30, 38), cylY(5.5, 38, 70, 0, 0, 16), cylY(3, 70, 80, 0, 0, 10),
  ]);
  const rot = new THREE.Matrix4().makeRotationZ(Math.atan2(-0.8, 0.6));
  return merge(CYLINDERS.filter((c) => c.bank === 'left').map((c) =>
    xf(plug.clone(), new THREE.Matrix4().makeTranslation(25, 248, plugZ(c)).multiply(rot))));
}

function ignitionCoils() {
  const list = [box(56, 62, 345, 405, -210, 232)];
  for (const c of CYLINDERS.filter((q) => q.bank === 'left')) {
    const z = plugZ(c);
    list.push(box(62, 88, 352, 404, z - 24, z + 24), box(66, 84, 404, 414, z - 12, z + 4), cylY(6, 340, 352, 75, z, 12));
    // Short lead and boot down to the plug.
    const end = new THREE.Vector3(25 + 0.8 * 80, 248 + 0.6 * 80, z);
    list.push(tube([[75, 340, z], [86, 326, z], [end.x + 4, end.y + 10, z], [end.x, end.y, z]], 4.5, 16, 8));
    list.push(between(end, new THREE.Vector3(25 + 0.8 * 104, 248 + 0.6 * 104, z), 9, 12));
  }
  return merge(list);
}

function camshaft() {
  const list = [cylZ(19, -236, 270)];
  for (let i = -2; i <= 2; i++) list.push(cylZ(27.5, i * S - 10, i * S + 10));
  for (const c of CYLINDERS) {
    for (const kind of ['intake', 'exhaust']) {
      const nose = c.beta - peakAngle(c, kind) / 2;
      const lift = VALVE_LIFT[kind] / ROCKER_RATIO;
      const pts = [];
      for (let i = 0; i < 72; i++) {
        const a = i * 5, r = 22 + lift * bump(a - nose);
        pts.push([r * Math.sin(a * DEG), r * Math.cos(a * DEG)]);
      }
      const z = c.bank === 'left' ? c.valves[kind] : c.valves[kind] - 2 * BANK_Z;
      list.push(extrude(shapeFrom(pts.reverse()), z - 8, z + 8, 4));
    }
  }
  return merge(list);
}

function crankSprocket() {
  return merge([extrude(shapeFrom(gearPts(29, 24, 4), [circleHole(0, 0, 20)]), 251, 261, 2), cylZ(24, 244, 251)]);
}
function camSprocket() {
  const holes = [0, 120, 240].map((a) => circleHole(34 * Math.cos(a * DEG), 34 * Math.sin(a * DEG), 11));
  holes.push(circleHole(0, 0, 10));
  return merge([extrude(shapeFrom(gearPts(58, 48, 4), holes), 251, 261, 2), cylZ(18, 261, 270)]);
}
function timingChain() {
  const outer = hullOfCircles([[0, 0, 29], [0, CAM.y, 58]], 5);
  const inner = hullOfCircles([[0, 0, 29], [0, CAM.y, 58]], -2).reverse();
  const hole = new THREE.Path(inner.map(([x, y]) => new THREE.Vector2(x, y)));
  const links = [];
  const g = extrude(shapeFrom(outer, [hole]), 250, 262, 2);
  links.push(g, box(-40, -34, 20, 100, 248, 264), box(-38, 38, 36, 44, 262, 266));
  return merge(links);
}

function lifter() {
  return merge([cylZ(9, -7, 7, 0, 9, 20), cylY(10.7, 6, 60, 0, 0, 24), cylY(7, 60, 62)]);
}
const PUSH_LO = new THREE.Vector3(CAM_W, CAM_U + 22 + 62, 0);
const PUSH_HI = new THREE.Vector3(-44, 372, 0);
export const ROCKER_PIVOT = new THREE.Vector3(-25.5, 376, 0);
export const LIFTER_BASE = new THREE.Vector3(CAM_W, CAM_U + 22, 0);
function pushrod() {
  return merge([between(PUSH_LO, PUSH_HI, 4, 10), new THREE.SphereGeometry(5, 10, 8).translate(PUSH_LO.x, PUSH_LO.y, 0), new THREE.SphereGeometry(5, 10, 8).translate(PUSH_HI.x, PUSH_HI.y, 0)]);
}
function rockerArm() {
  const prof = [[-26, -4], [-12, -8], [20, -8], [36, -6], [36, 1], [20, 8], [-12, 9], [-26, 4]];
  return merge([extrude(shapeFrom(prof), -7, 7, 2), cylZ(9, -11, 11, 0, 0, 18), cylZ(5, -5, 5, 31.5, -5, 12), cylY(4, -10, -4, -18.5, 0, 10)]);
}
function valve(r) {
  return lathe([[0, 0], [r, 0], [r, 1.6], [r - 3, 4], [10, 12], [4.2, 22], [4, 118], [12, 118], [12, 123], [4, 123], [4, 125], [0, 125]], 28);
}
function valveSpring() {
  return merge([new THREE.TubeGeometry(new Helix(15, 46, 6.5), 160, 2.3, 7), cylY(17, -1.5, 0.5, 0, 0, 24)]);
}

function exhaustManifold() {
  const list = [box(78, 84, 250, 296, -212, 236)];
  const zs = CYLINDERS.filter((c) => c.bank === 'left').map((c) => c.valves.exhaust);
  for (const z of zs) {
    list.push(tube([[80, 273, z], [98, 270, z], [112, 252, z * 0.9 - 10], [116, 238, z * 0.9 - 14]], 17, 20, 12));
  }
  const zLo = Math.min(...zs) * 0.9 - 30, zHi = Math.max(...zs) * 0.9 + 4;
  list.push(cylZ(24, zLo, zHi, 116, 238, 22), new THREE.SphereGeometry(24, 16, 12).translate(116, 238, zHi));
  list.push(tube([[116, 238, zLo + 10], [130, 222, zLo - 10], [170, 182, zLo - 16], [200, 152, zLo - 16]], 24, 24, 16));
  list.push(between(new THREE.Vector3(197, 155, zLo - 16), new THREE.Vector3(211, 141, zLo - 16), 38, 24));
  return merge(list);
}

function intakeManifold() {
  const rr = (x0, x1, y0, y1, r) => [...arc(x1 - r, y1 - r, r, 0, 90, 8), ...arc(x0 + r, y1 - r, r, 90, 180, 8), ...arc(x0 + r, y0 + r, r, 180, 270, 8), ...arc(x1 - r, y0 + r, r, 270, 360, 8)];
  const list = [extrude(shapeFrom(rr(-58, 58, 288, 374, 28)), -200, 205, 6)];
  for (let i = -3; i <= 3; i++) list.push(box(-40, 40, 373, 377, i * 55 - 2, i * 55 + 2));
  const flange = box(-72, -64, 252, 300, -219, 240);
  list.push(toLeft(flange), toRight(flange));
  for (const c of CYLINDERS) {
    const s = c.bank === 'left' ? 1 : -1, z = c.valves.intake - (c.bank === 'left' ? 0 : 2 * BANK_Z);
    const port = W_L.clone().multiplyScalar(-66).add(U_L.clone().multiplyScalar(276));
    const pre = port.clone().addScaledVector(W_L, -34);
    list.push(tube([[s * 30, 344, z], [s * 92, 350, z], [s * pre.x, pre.y, z], [s * port.x, port.y, z]], 20, 28, 12));
  }
  return merge(list);
}

function throttleBody() {
  const ring = latheZ([[44, 205], [54, 205], [54, 262], [44, 262], [44, 205]], 0, 332, 40);
  const plate = new THREE.CylinderGeometry(43.5, 43.5, 2, 32).rotateX(Math.PI / 2 - 0.35).translate(0, 332, 234);
  return merge([ring, plate, box(-60, 60, 272, 392, 199, 207), box(52, 86, 300, 362, 212, 254), cylZ(8, 228, 240, 54, 332)]);
}

function fuelRails() {
  const list = [];
  const port = W_L.clone().multiplyScalar(-66).add(U_L.clone().multiplyScalar(276));
  for (const s of [1, -1]) {
    const dz = s > 0 ? 0 : -2 * BANK_Z;
    list.push(cylZ(9, -218 + dz, 238 + dz, s * 122, 304, 16));
    for (const c of CYLINDERS.filter((q) => q.bank === 'left')) {
      const z = c.valves.intake + dz;
      const top = new THREE.Vector3(s * 122, 298, z), tip = new THREE.Vector3(s * (port.x - 18), port.y + 30, z);
      list.push(between(top, top.clone().lerp(tip, 0.55), 9, 14), between(top.clone().lerp(tip, 0.55), tip, 5, 10));
    }
  }
  list.push(tube([[122, 304, -218], [70, 392, -226], [-70, 392, -236], [-122, 304, -239]], 5, 30, 8));
  list.push(cylZ(6, 238, 262, 122, 304, 12));
  return merge(list);
}

function frontCover() {
  const outline = hullOfCircles([[0, -12, 86], [0, 128, 70]], 0, 40);
  return merge([extrude(shapeFrom(outline, [circleHole(0, 0, 26)]), 298, 310, 20), cylZ(14, 310, 322, 38, 150, 16)]);
}
function oilPump() {
  const outline = hullOfCircles([[-44, -34, 38], [44, -34, 38], [0, 10, 42]], 0, 36);
  return merge([extrude(shapeFrom(outline, [circleHole(0, 0, 24)]), 266, 294, 20), cylZ(12, 280, 300, 55, -40, 12)]);
}
function oilPickup() {
  return merge([
    tube([[40, -66, 280], [42, -130, 272], [36, -172, 226], [24, -192, 170], [20, -194, 150]], 10, 30, 12),
    cylY(40, -202, -190, 20, 140, 32), box(28, 52, -76, -62, 268, 292),
  ]);
}
function oilFilter() {
  const can = lathe([[0, 0], [40, 0], [46, -6], [46, -96], [40, -104], [0, -104]], 40);
  return merge([can.translate(-60, -225, 175), cylY(38, -225, -214, -60, 175, 32)]);
}
function harmonicBalancer() {
  const grooves = [];
  for (let z = 376; z < 404; z += 4) grooves.push([84, z], [80, z + 2]);
  return latheZ([[20, 312], [42, 312], [42, 322], [70, 322], [70, 316], [92, 316], [92, 352], [70, 352], [70, 346], [48, 346], [48, 372], [84, 372],
    ...grooves, [84, 408], [32, 408], [32, 416], [20, 416], [20, 312]], 0, 0, 56);
}
function flywheel() {
  const holes = [circleHole(0, 0, 40)];
  for (let i = 0; i < 6; i++) holes.push(circleHole(58 * Math.cos(i * 60 * DEG), 58 * Math.sin(i * 60 * DEG), 5));
  for (let i = 0; i < 4; i++) holes.push(circleHole(108 * Math.cos((i * 90 + 45) * DEG), 108 * Math.sin((i * 90 + 45) * DEG), 17));
  return merge([extrude(shapeFrom(gearPts(155, 168, 5), holes), -290, -265, 16), latheZ([[40, -265], [120, -265], [120, -262], [40, -262], [40, -265]], 0, 0, 48)]);
}
const PUMP = [0, 165], ALT = [-175, 185], IDLER = [135, 175];
function waterPump() {
  const body = extrude(shapeFrom(hullOfCircles([[PUMP[0], PUMP[1], 62], [118, 200, 26], [-118, 200, 26]], 0, 32)), 312, 352, 12);
  const pulley = [];
  for (let z = 376; z < 404; z += 4) pulley.push([58, z], [55, z + 2]);
  const p = latheZ([[12, 352], [30, 352], [30, 366], [58, 366], [58, 372], ...pulley, [58, 408], [12, 408], [12, 352]], PUMP[0], PUMP[1], 48);
  const outlets = [1, -1].map((s) => cylZ(18, 296, 316, s * 118, 200, 16));
  return merge([body, p, ...outlets]);
}
function alternator() {
  const fins = [];
  for (let z = 296; z < 364; z += 8) fins.push([62, z], [58, z + 4]);
  const body = latheZ([[0, 290], [56, 290], [62, 296], ...fins, [62, 364], [56, 370], [0, 370]], ALT[0], ALT[1], 40);
  const pulley = latheZ([[10, 370], [32, 372], [32, 408], [10, 408], [10, 370]], ALT[0], ALT[1], 28);
  return merge([body, pulley, box(ALT[0] + 40, ALT[0] + 96, ALT[1] - 12, ALT[1] + 12, 300, 320), box(ALT[0] - 12, ALT[0] + 12, ALT[1] - 96, ALT[1] - 40, 330, 350)]);
}
function driveBelt() {
  const circles = [[0, 0, 84], [PUMP[0], PUMP[1], 58], [ALT[0], ALT[1], 32], [IDLER[0], IDLER[1], 36]];
  const hole = new THREE.Path(hullOfCircles(circles, 0, 64).reverse().map(([x, y]) => new THREE.Vector2(x, y)));
  const belt = extrude(shapeFrom(hullOfCircles(circles, 5, 64), [hole]), 377, 403, 2);
  const idler = latheZ([[8, 372], [36, 372], [36, 408], [8, 408], [8, 372]], IDLER[0], IDLER[1], 32);
  return merge([belt, idler, box(IDLER[0] - 10, IDLER[0] + 10, 60, IDLER[1], 350, 372)]);
}
function starter() {
  return merge([cylZ(42, -250, -110, -140, -132, 32), cylZ(22, -236, -130, -104, -88, 20), cylZ(20, -268, -250, -140, -132, 16), box(-160, -120, -100, -84, -250, -236)]);
}

// ---------------------------------------------------------------------------
// Assembly: every rendered instance, its resting transform, explode vector
// (mm) and how it moves while the engine turns.
// ---------------------------------------------------------------------------
export function buildEngine() {
  const specs = [];
  const add = (id, geometry, o = {}) => specs.push({
    id, geometry, crease: o.crease || 34, base: o.base || new THREE.Matrix4(), explode: new THREE.Vector3(...(o.explode || [0, 0, 0])), kin: o.kin || null, bank: o.bank || null,
  });
  const bankVec = (bank, w, u, z = 0) => {
    const v = W_L.clone().multiplyScalar(w).addScaledVector(U_L, u).add(new THREE.Vector3(0, 0, z));
    if (bank === 'right') v.x = -v.x;
    return v.toArray();
  };

  add('cylinder_block', cylinderBlock());
  add('main_caps', mainCaps(), { explode: [0, -300, 0] });
  add('oil_pan', oilPan(), { explode: [0, -470, 0] });
  add('crankshaft', crankshaft(), { explode: [0, -170, 0], kin: { type: 'rotate', ratio: 1 } });
  add('flywheel', flywheel(), { explode: [0, -170, -190], kin: { type: 'rotate', ratio: 1 } });
  add('harmonic_balancer', harmonicBalancer(), { explode: [0, 0, 420], kin: { type: 'rotate', ratio: 1 } });

  const rod = connectingRod(), pis = piston();
  for (const c of CYLINDERS) {
    add('pistons', pis, { explode: bankVec(c.bank, 0, 150), kin: { type: 'piston', cyl: c }, bank: c.bank });
    add('connecting_rods', rod, { explode: bankVec(c.bank, 0, 70), kin: { type: 'rod', cyl: c }, bank: c.bank });
  }

  const bankParts = {
    cylinder_liners: [liners(), [0, 60]],
    head_gaskets: [headGasket(), [0, 95]],
    cylinder_heads: [cylinderHead(), [0, 170]],
    valve_covers: [valveCover(), [0, 430]],
    spark_plugs: [sparkPlugs(), [110, 170]],
    ignition_coils: [ignitionCoils(), [70, 430]],
    exhaust_manifolds: [exhaustManifold(), [190, 170]],
  };
  for (const bank of ['left', 'right']) {
    const base = bank === 'left' ? M_LEFT : M_RIGHT;
    for (const [id, [g, [w, u]]] of Object.entries(bankParts)) add(id, g, { base, explode: bankVec(bank, w, u), bank });
  }

  const lif = lifter(), pr = pushrod(), rk = rockerArm(), vi = valve(27.5), ve = valve(20.2), sp = valveSpring();
  for (const c of CYLINDERS) {
    const base = c.bank === 'left' ? M_LEFT : M_RIGHT;
    for (const kind of ['intake', 'exhaust']) {
      const z = c.valves[kind];
      const k = { cyl: c, kind, z };
      add('lifters', lif, { base, explode: bankVec(c.bank, 0, 120), kin: { type: 'lifter', ...k }, bank: c.bank });
      add('pushrods', pr, { base, explode: bankVec(c.bank, 0, 230), kin: { type: 'pushrod', ...k }, bank: c.bank });
      add('rocker_arms', rk, { base, explode: bankVec(c.bank, 0, 330), kin: { type: 'rocker', ...k }, bank: c.bank });
      add(kind === 'intake' ? 'intake_valves' : 'exhaust_valves', kind === 'intake' ? vi : ve, { base, explode: bankVec(c.bank, 0, 262), kin: { type: 'valve', ...k }, bank: c.bank });
      add('valve_springs', sp, { crease: 70, base, explode: bankVec(c.bank, 0, 300), kin: { type: 'spring', ...k }, bank: c.bank });
    }
  }

  add('camshaft', camshaft(), { base: new THREE.Matrix4().makeTranslation(CAM.x, CAM.y, 0), explode: [0, 200, 0], kin: { type: 'rotate', ratio: 0.5 } });
  add('timing_set', crankSprocket(), { explode: [0, 0, 130], kin: { type: 'rotate', ratio: 1 } });
  add('timing_set', camSprocket(), { base: new THREE.Matrix4().makeTranslation(CAM.x, CAM.y, 0), explode: [0, 0, 130], kin: { type: 'rotate', ratio: 0.5 } });
  add('timing_set', timingChain(), { explode: [0, 0, 130] });

  add('intake_manifold', intakeManifold(), { explode: [0, 330, 0] });
  add('throttle_body', throttleBody(), { explode: [0, 330, 170] });
  add('fuel_rails', fuelRails(), { explode: [0, 240, 0] });

  add('oil_pump', oilPump(), { explode: [0, 0, 210] });
  add('oil_pickup', oilPickup(), { explode: [0, -380, 40] });
  add('oil_filter', oilFilter(), { explode: [0, -520, 90] });
  add('front_cover', frontCover(), { explode: [0, 0, 290] });
  add('water_pump', waterPump(), { explode: [0, 150, 300] });
  add('alternator', alternator(), { explode: [-150, 60, 280] });
  add('drive_belt', driveBelt(), { explode: [0, 0, 560] });
  add('starter', starter(), { explode: [-130, -40, -60] });
  return specs;
}

// ---------------------------------------------------------------------------
// Normals: creased for shading, fully welded for the silhouette hull.
// ---------------------------------------------------------------------------
const keyOf = (a, i) => `${Math.round(a[i] * 20)}_${Math.round(a[i + 1] * 20)}_${Math.round(a[i + 2] * 20)}`;
export function finishGeometry(g, creaseDeg = 34) {
  const pos = positions(g);
  const nTri = pos.length / 9;
  const fn = new Float32Array(nTri * 3); // area-weighted face normals
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let t = 0; t < nTri; t++) {
    a.fromArray(pos, t * 9); b.fromArray(pos, t * 9 + 3); c.fromArray(pos, t * 9 + 6);
    c.sub(b); b.sub(a); b.cross(c);
    fn[t * 3] = b.x; fn[t * 3 + 1] = b.y; fn[t * 3 + 2] = b.z;
  }
  const keys = new Array(nTri * 3);
  const groups = new Map();
  for (let v = 0; v < nTri * 3; v++) {
    const k = keyOf(pos, v * 3);
    keys[v] = k;
    let list = groups.get(k);
    if (!list) groups.set(k, (list = []));
    list.push(Math.floor(v / 3));
  }
  const cosT = Math.cos(creaseDeg * DEG);
  const normal = new Float32Array(pos.length);
  const smooth = new Float32Array(pos.length);
  const len = (t) => Math.hypot(fn[t * 3], fn[t * 3 + 1], fn[t * 3 + 2]) || 1;
  for (let v = 0; v < nTri * 3; v++) {
    const t = Math.floor(v / 3), lt = len(t);
    let nx = 0, ny = 0, nz = 0, sx = 0, sy = 0, sz = 0;
    for (const f of groups.get(keys[v])) {
      const fx = fn[f * 3], fy = fn[f * 3 + 1], fz = fn[f * 3 + 2];
      sx += fx; sy += fy; sz += fz;
      if ((fx * fn[t * 3] + fy * fn[t * 3 + 1] + fz * fn[t * 3 + 2]) / (len(f) * lt) > cosT) { nx += fx; ny += fy; nz += fz; }
    }
    let l = Math.hypot(nx, ny, nz) || 1;
    normal[v * 3] = nx / l; normal[v * 3 + 1] = ny / l; normal[v * 3 + 2] = nz / l;
    l = Math.hypot(sx, sy, sz) || 1;
    smooth[v * 3] = sx / l; smooth[v * 3 + 1] = sy / l; smooth[v * 3 + 2] = sz / l;
  }
  const posAttr = new THREE.BufferAttribute(pos instanceof Float32Array ? pos : Float32Array.from(pos), 3);
  const shaded = new THREE.BufferGeometry();
  shaded.setAttribute('position', posAttr);
  shaded.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  shaded.computeBoundingBox();
  shaded.computeBoundingSphere();
  const hull = new THREE.BufferGeometry();
  hull.setAttribute('position', posAttr);
  hull.setAttribute('normal', new THREE.BufferAttribute(smooth, 3));
  hull.boundingSphere = shaded.boundingSphere;
  const edges = new THREE.EdgesGeometry(shaded, creaseDeg);
  return { shaded, hull, edges };
}

// Transforms of the moving parts for crank angle theta (degrees).
const _pin = new THREE.Vector3(), _wr = new THREE.Vector3(), _m = new THREE.Matrix4(), _s = new THREE.Matrix4();
export function kinematicMatrix(spec, theta, out) {
  const k = spec.kin;
  out.copy(spec.base);
  if (!k) return out;
  switch (k.type) {
    case 'rotate': return out.multiply(_m.makeRotationZ(-theta * k.ratio * DEG));
    case 'piston':
      sliderCrank(k.cyl, theta, _pin, _wr);
      return out.makeRotationZ(-k.cyl.beta * DEG).setPosition(_wr);
    case 'rod': {
      sliderCrank(k.cyl, theta, _pin, _wr);
      return out.makeRotationZ(Math.atan2(-(_wr.x - _pin.x), _wr.y - _pin.y)).setPosition(_pin);
    }
    default: {
      const lift = lifterLift(k.cyl, k.kind, theta);
      if (k.type === 'lifter') return out.multiply(_m.makeTranslation(LIFTER_BASE.x, LIFTER_BASE.y + lift, k.z));
      if (k.type === 'pushrod') return out.multiply(_m.makeTranslation(0, lift, k.z));
      if (k.type === 'rocker') return out.multiply(_m.makeTranslation(ROCKER_PIVOT.x, ROCKER_PIVOT.y, k.z)).multiply(_s.makeRotationZ(-lift / 18.5));
      const vl = lift * ROCKER_RATIO;
      if (k.type === 'valve') return out.multiply(_m.makeTranslation(6, 246 - vl, k.z));
      if (k.type === 'spring') return out.multiply(_m.makeTranslation(6, 318, k.z)).multiply(_s.makeScale(1, (46 - vl) / 46, 1));
      return out;
    }
  }
}
