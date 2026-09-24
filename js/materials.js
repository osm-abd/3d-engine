import * as THREE from 'three';

// Section plane (world space). A fragment is cut away when dot(p, xyz) + w > 0.
export const clipPlane = new THREE.Vector4(0, 0, 0, -1);

const partVertex = /* glsl */ `
  varying vec3 vN;
  varying vec3 vP;
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vec4 mv = viewMatrix * w;
    vP = mv.xyz;
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

const partFragment = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uTint;
  uniform float uGhost;
  uniform float uHover;
  uniform float uGhostScale;
  uniform float uPixelRatio;
  uniform vec4 uClip;
  varying vec3 vN;
  varying vec3 vP;
  varying vec3 vW;

  // Screen-space hatching (distance to the nearest stroke, in CSS pixels).
  float hatch(vec2 fc, vec2 dir, float spacing, float width) {
    float t = dot(fc, dir) / spacing;
    float d = abs(fract(t) - 0.5) * spacing;
    return 1.0 - smoothstep(width * 0.5, width * 0.5 + 0.8, d);
  }

  void main() {
    if (dot(vW, uClip.xyz) + uClip.w > 0.0) discard;
    vec3 n = normalize(vN);
    bool cut = !gl_FrontFacing;
    if (cut) n = -n;
    vec3 v = normalize(-vP);
    vec2 fc = gl_FragCoord.xy / uPixelRatio;

    // Soft key light from the upper left of the viewer, plus a faint sheen.
    vec3 l = normalize(vec3(-0.45, 0.7, 0.55));
    float ndl = dot(n, l);
    float shade = 1.0 - smoothstep(-0.2, 0.35, ndl);
    float sheen = pow(max(dot(n, normalize(l + v)), 0.0), 28.0);

    // Light shadow hatching (single, then cross-hatch in the darkest areas).
    float h = hatch(fc, normalize(vec2(1.0, 1.0)), 5.0, 0.9) * smoothstep(0.35, 0.75, shade) * 0.2;
    h = max(h, hatch(fc, normalize(vec2(1.0, -1.0)), 5.0, 0.9) * smoothstep(0.8, 1.0, shade) * 0.14);

    // Watercolour wash in the part's colour, darker in shadow.
    vec3 paper = mix(uTint, vec3(1.0), 0.18) * (1.0 - 0.22 * shade) + sheen * 0.22;
    float ink = h;
    if (cut) {
      // Inside faces are only seen through the section plane: draw them as
      // a hatched cut surface, like a sectioned engineering drawing.
      paper = mix(uTint, vec3(1.0), 0.35);
      ink = hatch(fc, normalize(vec2(1.0, -1.0)), 4.0, 0.9) * 0.45;
    }
    paper = mix(paper, paper * vec3(0.88, 0.88, 0.86), uHover * 0.7);
    vec3 col = mix(paper, uInk, ink);

    // Ghost mode: only a thin silhouette remains (edges are drawn separately).
    float facing = abs(dot(n, v));
    float rimLine = 1.0 - smoothstep(0.6 * uPixelRatio, 1.6 * uPixelRatio, facing / max(fwidth(facing), 1e-4));
    float ghostAlpha = rimLine * 0.14 * uGhostScale * (0.5 + 0.5 * uHover);
    gl_FragColor = vec4(mix(col, uInk, uGhost), mix(1.0, ghostAlpha, uGhost));
  }
`;

export function partMaterial(tint) {
  return new THREE.ShaderMaterial({
    vertexShader: partVertex,
    fragmentShader: partFragment,
    uniforms: {
      uInk: { value: new THREE.Color(0x111111) },
      uTint: { value: new THREE.Color().setStyle(tint, THREE.LinearSRGBColorSpace) }, // shader outputs sRGB directly
      uGhost: { value: 0 },
      uHover: { value: 0 },
      uGhostScale: { value: 1 },
      uPixelRatio: { value: 1 },
      uClip: { value: clipPlane },
    },
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
}

// Inverted hull: back faces pushed outward by a constant number of pixels
// draw the silhouette.
const hullVertex = /* glsl */ `
  uniform vec2 uResolution;
  uniform float uWidth;
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vec4 clip = projectionMatrix * viewMatrix * w;
    vec3 nv = normalize(normalMatrix * normal);
    vec2 dir = nv.xy;
    float l = length(dir);
    dir = l > 1e-4 ? dir / l : vec2(0.0);
    clip.xy += dir * uWidth / uResolution * 2.0 * clip.w;
    gl_Position = clip;
  }
`;
const hullFragment = /* glsl */ `
  uniform vec3 uInk;
  uniform vec4 uClip;
  varying vec3 vW;
  void main() {
    if (dot(vW, uClip.xyz) + uClip.w > 0.0) discard;
    gl_FragColor = vec4(uInk, 1.0);
  }
`;

export function hullMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: hullVertex,
    fragmentShader: hullFragment,
    uniforms: {
      uInk: { value: new THREE.Color(0x111111) },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uWidth: { value: 1.5 },
      uClip: { value: clipPlane },
    },
    side: THREE.BackSide,
  });
}

// Crease lines (hard edges of the castings and machined faces).
const lineVertex = /* glsl */ `
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const lineFragment = /* glsl */ `
  uniform vec3 uInk;
  uniform float uAlpha;
  uniform vec4 uClip;
  varying vec3 vW;
  void main() {
    if (dot(vW, uClip.xyz) + uClip.w > 0.0) discard;
    gl_FragColor = vec4(uInk, uAlpha);
  }
`;

export function lineMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: lineVertex,
    fragmentShader: lineFragment,
    uniforms: {
      uInk: { value: new THREE.Color(0x111111) },
      uAlpha: { value: 0.85 },
      uClip: { value: clipPlane },
    },
    transparent: true,
  });
}
