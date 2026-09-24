import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { COLORS, GROUPS, OVERVIEW, PARTS } from './parts.js';
import { partMaterial, hullMaterial, lineMaterial, clipPlane } from './materials.js';
import { buildEngine, finishGeometry, kinematicMatrix } from './engine.js';

// ---------------------------------------------------------------------------
// Scene setup (units: millimetres)
// ---------------------------------------------------------------------------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xffffff, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 20, 30000);
const HOME = { pos: new THREE.Vector3(1450, 900, 1500), target: new THREE.Vector3(0, 90, 40) };
camera.position.copy(HOME.pos);

const controls = new OrbitControls(camera, canvas);
controls.target.copy(HOME.target);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 350;
controls.maxDistance = 9000;
controls.rotateSpeed = 0.8;
controls.zoomSpeed = 0.9;

const root = new THREE.Group();
scene.add(root);

const resolution = new THREE.Vector2();
// Portrait screens need the camera further back to fit the engine's width.
const fitScale = () => Math.max(1, 0.8 / camera.aspect);
const homePos = () => HOME.target.clone().add(HOME.pos.clone().sub(HOME.target).multiplyScalar(fitScale()));
const pixelRatio = () => renderer.getPixelRatio();
const CUT_Z = 172; // section plane through cylinders 1 and 2
const RUN_SPEED = 150; // crank degrees per second (25 rpm — slow motion)

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------
const parts = [];            // one per rendered instance
const partsById = new Map(); // part id -> [instances]
const pickables = [];
const finished = new Map();  // source geometry -> { shaded, hull, edges }

function createInstance(spec) {
  const { id } = spec;
  if (!finished.has(spec.geometry)) finished.set(spec.geometry, finishGeometry(spec.geometry, spec.crease));
  const g = finished.get(spec.geometry);
  const material = partMaterial(COLORS[id] || '#dddddd');
  const mesh = new THREE.Mesh(g.shaded, material);
  const hull = new THREE.Mesh(g.hull, hullMaterial());
  hull.raycast = () => {};
  const edges = new THREE.LineSegments(g.edges, lineMaterial());
  edges.raycast = () => {};
  const body = new THREE.Group();
  body.matrixAutoUpdate = false;
  body.add(hull, mesh, edges);
  const group = new THREE.Group();
  group.add(body);
  root.add(group);

  kinematicMatrix(spec, 0, body.matrix);
  const box = g.shaded.boundingBox.clone().applyMatrix4(body.matrix);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const explode = spec.explode.clone();
  // Where the part travels when it is popped out on its own: far enough to
  // clear the engine even for parts buried deep inside it.
  const popout = explode.lengthSq() > 1 ? explode.clone() : new THREE.Vector3(0, 1, 0);
  popout.setLength(Math.max(popout.length(), 260) + 160);

  // Small, numerous parts (pushrods, valves, springs) fade further when
  // ghosted, so a crowd of them does not smudge the view.
  const ghostScale = THREE.MathUtils.clamp(size.length() / 400, 0.3, 1);
  material.uniforms.uGhostScale.value = ghostScale;

  const inst = {
    ghostScale, id, spec, info: PARTS[id], mesh, hull, edges, body, group, center, size, explode, popout,
    offset: new THREE.Vector3(), ghost: 0, hover: 0, visible: true,
  };
  mesh.userData.inst = inst;
  parts.push(inst);
  pickables.push(mesh);
  if (!partsById.has(id)) partsById.set(id, []);
  partsById.get(id).push(inst);
  return inst;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  explode: 0,
  explodeTarget: 0,
  selected: null,   // part id; every instance of the part is selected together
  hovered: null,
  running: false,
  theta: 0,         // crank angle, degrees
  cut: false,
  hiddenIds: new Set(),
  dirty: true,      // something changed that needs a new frame
  poseDirty: true,  // crank angle changed
};

// ---------------------------------------------------------------------------
// UI: index
// ---------------------------------------------------------------------------
const $ = (s) => document.querySelector(s);
const indexList = $('#index-list');
const infoPanel = $('#info');
const readout = $('#readout');
const EYE = '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><path d="M4 4l16 16"/></svg>';
const itemEls = new Map();

function buildIndex() {
  let n = 0;
  for (const g of GROUPS) {
    const ids = Object.keys(PARTS).filter((id) => PARTS[id].group === g.id && partsById.has(id));
    if (!ids.length) continue;
    const section = document.createElement('section');
    section.dataset.group = g.id;
    const title = document.createElement('div');
    title.className = 'group-title';
    title.innerHTML = `<span>${g.name}</span>`;
    section.appendChild(title);
    for (const id of ids) {
      n++;
      const row = document.createElement('div');
      row.className = 'item';
      row.dataset.id = id;
      row.innerHTML = `<button class="item-name" type="button"><span class="num">${String(n).padStart(2, '0')}</span><span class="swatch" style="background:${COLORS[id] || '#ddd'}"></span><span class="label">${PARTS[id].name}</span></button>` +
        `<button class="eye" type="button" aria-label="Hide ${PARTS[id].name}" title="Show / hide">${EYE}</button>`;
      row.querySelector('.item-name').addEventListener('click', () => select(state.selected === id ? null : id));
      row.querySelector('.item-name').addEventListener('mouseenter', () => setHover(id));
      row.querySelector('.item-name').addEventListener('mouseleave', () => setHover(null));
      row.querySelector('.eye').addEventListener('click', () => toggleHidden(id));
      section.appendChild(row);
      itemEls.set(id, row);
      PARTS[id].number = n;
    }
    indexList.appendChild(section);
  }
  $('#search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    for (const [id, el] of itemEls) {
      const s = PARTS[id];
      const hit = !q || s.name.toLowerCase().includes(q) || s.latin.toLowerCase().includes(q) ||
        GROUPS.find((g) => g.id === s.group).name.toLowerCase().includes(q);
      el.style.display = hit ? '' : 'none';
    }
    for (const sec of indexList.querySelectorAll('section')) {
      sec.style.display = [...sec.querySelectorAll('.item')].some((el) => el.style.display !== 'none') ? '' : 'none';
    }
  });
}

function toggleHidden(id) {
  if (state.hiddenIds.has(id)) state.hiddenIds.delete(id); else state.hiddenIds.add(id);
  const row = itemEls.get(id);
  const hidden = state.hiddenIds.has(id);
  row.classList.toggle('hidden', hidden);
  row.querySelector('.eye').innerHTML = hidden ? EYE_OFF : EYE;
  row.querySelector('.eye').setAttribute('aria-label', `${hidden ? 'Show' : 'Hide'} ${PARTS[id].name}`);
  if (hidden && state.selected === id) select(null);
  applyVisibility();
}

function applyVisibility() {
  for (const p of parts) {
    p.visible = !state.hiddenIds.has(p.id);
    p.group.visible = p.visible;
  }
  state.dirty = true;
}

// ---------------------------------------------------------------------------
// UI: info panel
// ---------------------------------------------------------------------------
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function renderInfo() {
  const id = state.selected;
  if (!id) {
    const o = OVERVIEW;
    infoPanel.innerHTML = `<div class="kicker"><span>Overview</span><span>${partsById.size} parts · ${parts.length} pieces</span></div>
      <h2>${o.name}</h2><p class="latin">${o.latin}</p><p class="summary">${esc(o.summary)}</p>
      ${o.sections.map(([h, items]) => `<h3>${h}</h3><ul>${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`).join('')}
      <p class="note">${esc(o.note)}</p>`;
    return;
  }
  const s = PARTS[id];
  const group = GROUPS.find((g) => g.id === s.group);
  const list = partsById.get(id);
  const banks = new Set(list.map((p) => p.spec.bank).filter(Boolean));
  const count = list.filter((p) => !(id === 'timing_set' && p !== list[0])).length;
  const sideText = id === 'timing_set' ? 'Chain + 2 sprockets' : `${count > 1 ? `×${count}` : 'Single'}${banks.size === 2 ? ' · both banks' : ''}`;
  infoPanel.innerHTML = `<div class="kicker"><span>${String(s.number).padStart(2, '0')} · ${group.name}</span><span>${sideText}</span></div>
    <h2>${s.name}</h2><p class="latin">${esc(s.latin)}</p>
    <div class="actions"><button class="chip-btn" data-act="back" type="button">← Overview</button>
    <button class="chip-btn" data-act="isolate" type="button">${isIsolated(id) ? 'Show all' : 'Isolate'}</button></div>
    <p class="summary">${esc(s.summary)}</p>
    ${s.sections.map(([h, items]) => `<h3>${h}</h3><ul>${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`).join('')}`;
  infoPanel.querySelector('[data-act="back"]').addEventListener('click', () => select(null));
  infoPanel.querySelector('[data-act="isolate"]').addEventListener('click', () => isolate(id));
  infoPanel.scrollTop = 0;
}

function isIsolated(id) {
  return [...partsById.keys()].every((k) => k === id || state.hiddenIds.has(k));
}
function isolate(id) {
  const isolated = isIsolated(id);
  for (const k of partsById.keys()) {
    const hide = !isolated && k !== id;
    if (hide !== state.hiddenIds.has(k)) toggleHidden(k);
  }
  renderInfo();
  focusOn(id);
}

// ---------------------------------------------------------------------------
// Selection / hover
// ---------------------------------------------------------------------------
// Selecting focuses on a part and fades the rest to outlines; it pops out
// when the explode slider (or the "Pop out" button) is used while selected.
function select(id) {
  if (id !== state.selected) setExplode(0, true, false);
  state.selected = id;
  state.dirty = true;
  explodeLabel.textContent = id ? 'Pop out' : 'Explode';
  explodeBtn.title = id ? 'Slide the selected part out of the engine (E)' : 'Pull every part away from the block (E)';
  for (const [k, el] of itemEls) el.classList.toggle('active', k === id);
  if (id) {
    itemEls.get(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    focusOn(id);
  } else {
    zoomForExplode(state.explodeTarget);
  }
  renderInfo();
  infoPanel.classList.remove('collapsed');
}

function setHover(id, inst = null) {
  const key = id ? `${id}|${inst ? parts.indexOf(inst) : ''}` : null;
  if (key === state.hoverKey) return;
  state.hoverKey = key;
  state.hovered = id ? { id, inst } : null;
  state.dirty = true;
  for (const [k, el] of itemEls) el.classList.toggle('hover', k === id);
  if (inst) {
    const cyl = inst.spec.kin?.cyl;
    const side = cyl ? `cylinder ${cyl.n}` : inst.spec.bank ? `${inst.spec.bank} bank` : '';
    readout.innerHTML = `${esc(inst.info.name)}${side ? `<span class="side">${side}</span>` : ''}`;
    readout.classList.add('show');
  } else readout.classList.remove('show');
}

// ---------------------------------------------------------------------------
// Camera animation
// ---------------------------------------------------------------------------
let fly = null;
function flyTo(pos, target, duration = 0.9) {
  fly = { t: 0, duration, fromPos: camera.position.clone(), toPos: pos ? pos.clone() : null, fromTarget: controls.target.clone(), toTarget: target.clone() };
  state.dirty = true;
}
function focusOn(id) {
  const list = (partsById.get(id) || []).filter((p) => p.visible);
  if (!list.length) return;
  // Frame every visible instance of the part.
  const box = new THREE.Box3();
  for (const p of list) {
    const c = p.center.clone().add(targetOffset(p));
    box.expandByPoint(c.clone().addScaledVector(p.size, 0.5)).expandByPoint(c.clone().addScaledVector(p.size, -0.5));
  }
  const target = box.getCenter(new THREE.Vector3());
  const radius = Math.max(box.getSize(new THREE.Vector3()).length() * 0.5, 60);
  const dir = (fly && fly.toPos ? fly.toPos.clone().sub(fly.toTarget) : camera.position.clone().sub(controls.target)).normalize();
  // Lean towards the side the part pops out of, so it is not hidden behind the block.
  const pop = list.reduce((v, p) => v.add(p.popout), new THREE.Vector3());
  if (pop.lengthSq() > 1) dir.lerp(pop.normalize(), 0.3).normalize();
  const dist = THREE.MathUtils.clamp(radius * 3.8, 650, 2600) * fitScale();
  flyTo(target.clone().add(dir.multiplyScalar(dist)), target);
}

const VIEWS = {
  left: [1, 0.05, 0], right: [-1, 0.05, 0], front: [0, 0.08, 1], back: [0, 0.08, -1], top: [0, 1, 0.0001], bottom: [0, -1, 0.0001],
};
function setView(name) {
  const d = new THREE.Vector3(...VIEWS[name]).normalize();
  const target = controls.target.clone();
  const dist = camera.position.distanceTo(controls.target);
  flyTo(target.clone().add(d.multiplyScalar(dist)), target);
}

// ---------------------------------------------------------------------------
// Picking
// ---------------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function pick(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  let hits = raycaster.intersectObjects(pickables.filter((m) => m.userData.inst.visible), false);
  if (state.cut) hits = hits.filter((h) => h.point.z <= CUT_Z);
  if (!hits.length) return null;
  // While something is selected, the solid (selected) part wins over the ghosts in front of it.
  if (state.selected) {
    const solid = hits.find((h) => h.object.userData.inst.id === state.selected);
    if (solid) return solid.object.userData.inst;
  }
  return hits[0].object.userData.inst;
}

let down = null;
let lastHoverPick = 0;
canvas.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY };
  canvas.classList.add('dragging');
});
window.addEventListener('pointerup', (e) => {
  canvas.classList.remove('dragging');
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  const wasCanvas = e.target === canvas;
  down = null;
  if (!wasCanvas || moved > 6) return;
  const inst = pick(e.clientX, e.clientY);
  if (!inst) { if (state.selected) select(null); return; }
  select(state.selected === inst.id ? null : inst.id);
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  const now = performance.now();
  if (down || now - lastHoverPick < 60) return;
  lastHoverPick = now;
  const inst = pick(e.clientX, e.clientY);
  setHover(inst?.id || null, inst);
  canvas.classList.toggle('pointing', !!inst);
});
canvas.addEventListener('pointerleave', () => setHover(null));

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------
const explodeBtn = $('#explode-btn');
const explodeRange = $('#explode-range');
const explodeLabel = explodeBtn.querySelector('span');
function setExplode(v, animate = true, reframe = true) {
  state.explodeTarget = v;
  if (!animate) state.explode = v;
  state.dirty = true;
  explodeBtn.setAttribute('aria-pressed', String(v > 0.5));
  explodeRange.value = v;
  if (!reframe) return;
  if (state.selected) focusOn(state.selected);
  else zoomForExplode(v);
}
// Pull the camera back far enough to frame the exploded (or assembled) engine.
function zoomForExplode(v) {
  const from = fly && fly.toPos ? fly.toPos : camera.position;
  const dir = from.clone().sub(fly ? fly.toTarget : controls.target).normalize();
  const d0 = HOME.pos.distanceTo(HOME.target);
  const dist = THREE.MathUtils.lerp(d0, d0 * 1.85, v) * fitScale();
  const target = HOME.target.clone().add(new THREE.Vector3(0, 60 * v, 40 * v));
  flyTo(target.clone().add(dir.multiplyScalar(dist)), target);
}
explodeBtn.addEventListener('click', () => setExplode(state.explodeTarget > 0.5 ? 0 : 1));
explodeRange.addEventListener('input', () => {
  state.explodeTarget = Number(explodeRange.value);
  state.explode = state.explodeTarget;
  state.dirty = true;
  explodeBtn.setAttribute('aria-pressed', String(state.explodeTarget > 0.5));
});
explodeRange.addEventListener('change', () => {
  if (state.selected) focusOn(state.selected);
  else zoomForExplode(state.explodeTarget);
});
for (const b of document.querySelectorAll('[data-view]')) b.addEventListener('click', () => setView(b.dataset.view));
$('#reset-btn').addEventListener('click', resetAll);

const runBtn = $('#run-btn');
function toggleRun() {
  state.running = !state.running;
  runBtn.setAttribute('aria-pressed', String(state.running));
  runBtn.querySelector('span').textContent = state.running ? 'Stop' : 'Run';
  state.dirty = true;
}
runBtn.addEventListener('click', toggleRun);

const cutBtn = $('#cut-btn');
function toggleCut() {
  state.cut = !state.cut;
  cutBtn.setAttribute('aria-pressed', String(state.cut));
  clipPlane.set(0, 0, state.cut ? 1 : 0, state.cut ? -CUT_Z : -1);
  state.dirty = true;
  if (state.cut && !state.selected) {
    const d = HOME.pos.distanceTo(HOME.target) * (1 + state.explodeTarget * 0.8) * fitScale();
    flyTo(HOME.target.clone().add(new THREE.Vector3(0.28, 0.2, 1).normalize().multiplyScalar(d)), HOME.target);
  }
}
cutBtn.addEventListener('click', toggleCut);

function resetAll() {
  for (const id of [...state.hiddenIds]) toggleHidden(id);
  if (state.cut) toggleCut();
  if (state.running) toggleRun();
  setExplode(0);
  select(null);
  flyTo(homePos(), HOME.target, 1.1);
}
const indexToggle = $('#index-toggle');
indexToggle.addEventListener('click', () => {
  const open = !$('#index').classList.contains('open');
  $('#index').classList.toggle('open', open);
  indexToggle.setAttribute('aria-expanded', String(open));
});
infoPanel.addEventListener('click', (e) => {
  if (window.innerWidth <= 900 && infoPanel.classList.contains('collapsed') && !e.target.closest('button')) infoPanel.classList.remove('collapsed');
});

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (e.key === 'Escape') select(null);
  else if (k === 'e') setExplode(state.explodeTarget > 0.5 ? 0 : 1);
  else if (k === 'c') toggleCut();
  else if (k === 'r') resetAll();
  else if (e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); toggleRun(); }
});
controls.addEventListener('change', () => { state.dirty = true; });

// ---------------------------------------------------------------------------
// Orientation compass
// ---------------------------------------------------------------------------
const compass = $('#compass');
const AXES = [
  { v: new THREE.Vector3(0, 0, 1), pos: 'F', neg: 'B' },
  { v: new THREE.Vector3(0, 1, 0), pos: 'T', neg: 'U' },
  { v: new THREE.Vector3(1, 0, 0), pos: 'L', neg: 'R' },
];
function updateCompass() {
  const q = camera.quaternion.clone().invert();
  let html = '<circle r="46" fill="none" stroke="#e4e4e0" />';
  const items = [];
  for (const a of AXES) {
    const d = a.v.clone().applyQuaternion(q);
    items.push({ d, label: a.pos, strong: true }, { d: d.clone().negate(), label: a.neg, strong: false });
  }
  items.sort((a, b) => a.d.z - b.d.z);
  for (const it of items) {
    const x = it.d.x * 30, y = -it.d.y * 30;
    const op = it.d.z < 0 ? 0.35 : 1;
    html += `<line x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#111" stroke-opacity="${op * (it.strong ? 1 : 0.4)}" ${it.strong ? '' : 'stroke-dasharray="2 2"'}/>`;
    html += `<text x="${(x * 1.33).toFixed(1)}" y="${(y * 1.33).toFixed(1)}" fill="#111" fill-opacity="${op * (it.strong ? 1 : 0.55)}">${it.label}</text>`;
  }
  compass.innerHTML = html;
}

// ---------------------------------------------------------------------------
// Frame loop
// ---------------------------------------------------------------------------
// With nothing selected the slider explodes every part. With a selection it
// pops out only the selected part (all its instances); the rest stay put.
function offsetFor(p, amount, out = new THREE.Vector3()) {
  if (!state.selected) return out.copy(p.explode).multiplyScalar(amount);
  if (state.selected !== p.id) return out.set(0, 0, 0);
  return out.copy(p.popout).multiplyScalar(amount);
}
function targetOffset(p) {
  return offsetFor(p, state.explodeTarget);
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  renderer.getDrawingBufferSize(resolution);
  camera.aspect = w / h;
  // Keep the engine clear of the side panels on wide screens.
  const shift = w > 900 ? ((240 - 340) / 2) : 0;
  camera.setViewOffset(w, h, -shift, w > 900 ? 0 : h * 0.06, w, h);
  camera.updateProjectionMatrix();
  for (const p of parts) p.hull.material.uniforms.uResolution.value.copy(resolution);
  state.dirty = true;
}
window.addEventListener('resize', resize);

const clock = new THREE.Clock();
const tmpOffset = new THREE.Vector3();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const k = 1 - Math.exp(-dt * 5.5);
  let moving = false;

  if (state.running) { state.theta = (state.theta + dt * RUN_SPEED) % 720; state.poseDirty = true; }

  const de = state.explodeTarget - state.explode;
  state.explode = Math.abs(de) < 1e-4 ? state.explodeTarget : state.explode + de * k;

  if (fly) {
    fly.t += dt / fly.duration;
    const t = Math.min(fly.t, 1);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    controls.target.lerpVectors(fly.fromTarget, fly.toTarget, e);
    if (fly.toPos) camera.position.lerpVectors(fly.fromPos, fly.toPos, e);
    if (t >= 1) fly = null;
    moving = true;
  }
  if (controls.update()) moving = true;

  const sel = state.selected;
  const pr = pixelRatio();
  for (const p of parts) {
    if (state.poseDirty && p.spec.kin) {
      kinematicMatrix(p.spec, state.theta, p.body.matrix);
      p.body.matrixWorldNeedsUpdate = true;
    }
    offsetFor(p, state.explode, tmpOffset);
    if (p.offset.distanceToSquared(tmpOffset) > 0.01) { p.offset.lerp(tmpOffset, k); moving = true; } else p.offset.copy(tmpOffset);
    p.group.position.copy(p.offset);

    const ghostTarget = sel && sel !== p.id ? 1 : 0;
    p.ghost += (ghostTarget - p.ghost) * k;
    if (Math.abs(p.ghost - ghostTarget) < 0.002) p.ghost = ghostTarget; else moving = true;
    const hov = state.hovered && state.hovered.id === p.id ? 1 : 0;
    p.hover += (hov - p.hover) * Math.min(1, k * 2);
    if (Math.abs(p.hover - hov) < 0.002) p.hover = hov; else moving = true;

    const u = p.mesh.material.uniforms;
    u.uGhost.value = p.ghost;
    u.uHover.value = p.hover;
    u.uPixelRatio.value = pr;
    const transparent = p.ghost > 0.001;
    if (p.mesh.material.transparent !== transparent) {
      p.mesh.material.transparent = transparent;
      p.mesh.material.depthWrite = !transparent;
      p.mesh.material.needsUpdate = true;
    }
    p.mesh.renderOrder = transparent ? 2 : 0;
    p.edges.renderOrder = transparent ? 3 : 1;
    p.edges.material.uniforms.uAlpha.value = THREE.MathUtils.lerp(0.8, (0.04 + 0.25 * p.hover) * p.ghostScale, p.ghost);
    p.edges.material.depthWrite = !transparent;
    p.hull.visible = p.ghost < 0.5;
    p.hull.material.uniforms.uWidth.value = (sel === p.id ? 2.1 : 1.3) * pr;
  }

  if (!(moving || state.dirty || state.poseDirty)) return; // idle: nothing to redraw
  state.dirty = false;
  state.poseDirty = false;
  if (sel) {
    // The rest of the engine first, as faint outlines; then the selected part
    // on a cleared depth buffer so nothing in front can hide it.
    const chosen = partsById.get(sel);
    for (const p of chosen) p.group.visible = false;
    renderer.render(scene, camera);
    for (const p of parts) p.group.visible = false;
    for (const p of chosen) p.group.visible = p.visible;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(scene, camera);
    renderer.autoClear = true;
    for (const p of parts) p.group.visible = p.visible;
  } else renderer.render(scene, camera);
  updateCompass();
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
async function boot() {
  const loaderText = $('#loader-text');
  try {
    if (!renderer.getContext()) throw new Error('WebGL unavailable');
    await new Promise((r) => setTimeout(r, 30)); // let the loader paint
    for (const spec of buildEngine()) if (PARTS[spec.id]) createInstance(spec);
    buildIndex();
    renderInfo();
    resize();
    camera.position.copy(homePos());
    if (window.innerWidth <= 900) infoPanel.classList.add('collapsed');
    requestAnimationFrame(frame);
    $('#loader').classList.add('done');
    window.__engine = { state, parts, select, setExplode, setView, camera, controls, toggleRun, toggleCut };
  } catch (err) {
    console.error(err);
    loaderText.textContent = 'Sorry — this viewer needs a browser with WebGL. (' + err.message + ')';
  }
}
boot();
