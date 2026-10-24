// Liquid shader: up to 6 rounded-box SDF shapes smooth-unioned, shaded as glossy candy resin.
// All shape coordinates arrive in DEVICE pixels, origin bottom-left (gl_FragCoord space).
export const MAX_SHAPES = 6;

export const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAG = `
precision highp float;

uniform vec2  uRes;        // canvas size, device px
uniform float uTime;
uniform float uUnit;       // 0.5 * min(res) — scale for noise
uniform vec4  uA[${MAX_SHAPES}];     // cx, cy, hw, hh      (device px)
uniform vec4  uB[${MAX_SHAPES}];     // radius, r, g, b     (solid color of the shape)
uniform vec3  uPal[4];     // marble palette
uniform float uK;          // smooth-union radius (px)
uniform float uMarble;     // 0 = shape solid colors, 1 = marbled palette
uniform float uLines;      // 0..1 embossed ruled lines (invoice sheet)
uniform float uBevel;      // dome / bevel size (px)
uniform float uWob;        // idle wobble amplitude (px)
uniform float uShadow;     // soft contact shadow strength
uniform vec2  uMouse;      // device px
uniform sampler2D uTex0;   // marble textures (Higgsfield renders)
uniform sampler2D uTex1;
uniform sampler2D uTex2;
uniform vec3  uTexMix;     // per-chapter texture weights (sum ~1)
uniform float uTexOn;      // 0 until textures finish loading
uniform vec2  uSeed;       // per-craft texture offset

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float sdRBox(vec2 p, vec2 c, vec2 h, float r) {
  r = min(r, min(h.x, h.y));
  vec2 q = abs(p - c) - (h - r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float smin(float a, float b, float k) {
  if (k < 0.5) return min(a, b);
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}
vec2 wob(float i) {
  return vec2(sin(uTime * 0.6 + i * 1.7), cos(uTime * 0.5 + i * 2.3)) * uWob;
}

// smooth union of every active shape
float scene(vec2 p) {
  float d = 1e5;
  for (int i = 0; i < ${MAX_SHAPES}; i++) {
    vec4 a = uA[i];
    if (a.z < 0.5) continue;
    d = smin(d, sdRBox(p, a.xy + wob(float(i)), a.zw, uB[i].x), uK);
  }
  return d;
}

// dome height (px): a hemisphere of radius s rising from the shape edge; flat once deeper than s
float dome(float d, float s) {
  float u = clamp(-d, 0.0, s);
  return sqrt(max(u * (2.0 * s - u), 0.0));
}

// height field = union silhouette bevel, raised by each shape's own dome
float height(vec2 p) {
  float h = dome(scene(p), uBevel * 0.55);
  for (int i = 0; i < ${MAX_SHAPES}; i++) {
    vec4 a = uA[i];
    if (a.z < 0.5) continue;
    float s = min(min(a.z, a.w) * 0.95, uBevel);
    h = max(h, dome(sdRBox(p, a.xy + wob(float(i)), a.zw, uB[i].x), s));
  }
  return h;
}

// smooth, hash-free marbling: iterated sine domain warp
float marbleField(vec2 q, float t) {
  vec2 w = q * 2.1;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    w += 0.55 * vec2(sin(w.y * 1.9 + t * 4.0 + fi * 1.7), cos(w.x * 1.6 - t * 3.2 + fi * 2.3));
  }
  return 0.5 + 0.5 * sin(w.x * 1.35 + w.y * 0.95 + 1.3 * sin(w.x * 0.7 - w.y * 1.2 + t));
}

// marble color from the generated textures, drifting slowly so the surface flows like liquid
vec3 texMarble(vec2 q, float t) {
  vec2 uv = q * 0.36 + 0.5 + uSeed;
  uv += 0.05 * vec2(sin(q.y * 2.3 + t * 5.0), cos(q.x * 2.1 - t * 4.0));
  uv += vec2(t * 0.9, -t * 0.6);
  return texture2D(uTex0, uv).rgb * uTexMix.x + texture2D(uTex1, uv).rgb * uTexMix.y + texture2D(uTex2, uv).rgb * uTexMix.z;
}

vec3 ramp(float x) {
  float a = x * 4.0;
  vec3 c = vec3(0.0);
  float ws = 0.0;
  for (int i = 0; i < 4; i++) {
    float d = abs(mod(a - float(i) + 2.0, 4.0) - 2.0);
    float w = exp(-d * d * 9.0);
    c += uPal[i] * w;
    ws += w;
  }
  return c / ws;
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 q = (p - 0.5 * uRes) / uUnit;
  float t = uTime * 0.06;

  // ── paper background with soft pastel atmosphere ──
  vec3 bg = vec3(1.0, 0.965, 0.91);
  bg = mix(bg, vec3(1.0, 0.83, 0.90), 0.38 * smoothstep(1.7, 0.0, length(q - vec2(-1.5, 0.95))));
  bg = mix(bg, vec3(0.82, 0.91, 1.0), 0.34 * smoothstep(1.8, 0.0, length(q - vec2(1.6, -1.0))));
  bg = mix(bg, vec3(1.0, 0.96, 0.77), 0.30 * smoothstep(1.4, 0.0, length(q - vec2(0.2, 1.2))));

  float d = scene(p);

  // soft contact shadow, cast down-left
  float sh = smoothstep(0.24 * uUnit, -0.05 * uUnit, scene(p + vec2(0.03, 0.11) * uUnit));
  bg = mix(bg, bg * vec3(0.80, 0.64, 0.80), sh * 0.40 * uShadow);

  vec3 col = bg;
  float mask = 1.0 - smoothstep(-1.5, 1.5, d);

  if (mask > 0.001) {
    float inner = clamp(-d / max(uBevel, 1.0), 0.0, 1.0);

    // normal from the dome height field
    float e = 1.5;
    vec2 g = vec2(height(p + vec2(e, 0.0)) - height(p - vec2(e, 0.0)),
                  height(p + vec2(0.0, e)) - height(p - vec2(0.0, e))) / (2.0 * e);
    vec3 n = normalize(vec3(-g, 1.0));

    // base color: marbled palette vs per-shape solid color
    float v = marbleField(q, t);
    vec3 marble = ramp(v * 1.7);
    if (uTexOn > 0.001) marble = mix(marble, texMarble(q, t), uTexOn);

    vec3 solid = vec3(0.0);
    float ws = 0.0;
    for (int i = 0; i < ${MAX_SHAPES}; i++) {
      vec4 a = uA[i];
      if (a.z < 0.5) continue;
      float di = sdRBox(p, a.xy + wob(float(i)), a.zw, uB[i].x);
      float w = exp(-max(di, 0.0) / (0.012 * uUnit)) + 1e-4;
      solid += uB[i].yzw * w;
      ws += w;
    }
    solid = ws > 0.0 ? solid / ws : marble;
    // subtle swirl inside solid shapes too
    solid = mix(solid, marble, 0.14);

    vec3 base = mix(solid, marble, uMarble);

    // embossed ruled lines (invoice sheet)
    if (uLines > 0.001) {
      float row = abs(fract(p.y / (0.075 * uUnit)) - 0.5);
      float line = smoothstep(0.46, 0.5, row) * smoothstep(0.0, 0.3, inner);
      n = normalize(n + vec3(0.0, line * 0.5 * uLines, 0.0));
      base = mix(base, base * 0.94, line * uLines);
    }

    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 L1 = normalize(vec3(-0.45, 0.75, 0.55));
    vec3 L2 = normalize(vec3(0.7, 0.15, 0.7));

    // high-key lighting: keep pastels luminous
    float dif = 0.76 + 0.24 * dot(n, L1);
    vec3 lit = base * dif;

    // studio softboxes reflected on the glossy surface
    vec3 r = reflect(-V, n);
    float gloss = 1.0 - 0.45 * uTexOn;   // the textures already carry baked highlights
    float win1 = smoothstep(0.93, 0.985, dot(r, L1)) * 0.55 * gloss;
    float win2 = smoothstep(0.95, 0.99, dot(r, L2)) * 0.3 * gloss;
    float spec = pow(max(dot(reflect(-L1, n), V), 0.0), 90.0) * 0.35 * gloss;

    float fres = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.4);
    // pastel thin-film tint (kept light so the base colors stay clean)
    vec3 iri = mix(vec3(1.0), 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + n.x * 0.5 + n.y * 0.4 + t * 0.8)), 0.55);

    lit += (win1 + win2 + spec) * vec3(1.0, 0.99, 0.97);
    lit = mix(lit, iri, 0.05 * fres);
    lit = mix(lit, vec3(1.0), 0.16 * fres);
    lit += (1.0 - inner) * 0.05 * vec3(1.0, 0.55, 0.75);
    lit = lit * 1.05 + 0.025;

    col = mix(bg, clamp(lit, 0.0, 1.0), mask);
  }

  // faint paper grain
  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.016;
  gl_FragColor = vec4(col, 1.0);
}
`;
