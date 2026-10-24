// Liquid shader v2: smooth-unioned rounded-box SDF shapes rendered as an iridescent glass bubble.
//  - shapes 0..5  : main liquid (chapter layouts)         - shapes 6..11 : tiny floating blobs
//  - day: pastel cream backdrop, soft pink/blue aura      - night: black starfield + nebula, neon cosmic palette
// All shape coordinates arrive in DEVICE pixels, origin bottom-left (gl_FragCoord space).
export const MAIN_SHAPES = 6;
export const MAX_SHAPES = 12;

export const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAG = `
precision highp float;

uniform vec2  uRes;        // canvas size, device px
uniform float uTime;
uniform float uUnit;       // 0.5 * min(res)
uniform float uDpr;
uniform float uScroll;     // page scroll, device px (star parallax)
uniform float uNight;      // 0 day .. 1 night
uniform vec4  uA[${MAX_SHAPES}];     // cx, cy, hw, hh      (device px)
uniform vec4  uB[${MAX_SHAPES}];     // radius, r, g, b     (solid color of the shape)
uniform vec3  uPal[4];     // day marble palette
uniform float uK;          // smooth-union radius, main liquid (px)
uniform float uKt;         // smooth-union radius, tiny blobs (px)
uniform float uMarble;     // 0 = shape solid colors, 1 = marbled palette
uniform float uGlass;      // 0 opaque slab .. 1 translucent bubble
uniform float uWarp;       // silhouette warp (fraction of uUnit)
uniform float uLines;      // embossed ruled lines (invoice sheet)
uniform float uBevel;      // dome / bevel size (px)
uniform float uWob;        // idle wobble amplitude (px)
uniform float uShadow;     // contact shadow / aura strength
uniform float uSmoke;      // ethereal smoke glow around the liquid (0 none .. 1 full)
uniform float uSun;        // radiance: bloom + rays that melt the silhouette into light (0 crisp .. 1 sun)
uniform sampler2D uTex0;   // day marble textures
uniform sampler2D uTex1;
uniform sampler2D uTex2;
uniform sampler2D uTexN0;  // night (cosmic) marble textures
uniform sampler2D uTexN1;
uniform sampler2D uTexN2;
uniform vec3  uTexMix;     // per-chapter texture weights (sum ~1)
uniform float uTexOn;      // 0 until day textures finish loading
uniform float uTexNOn;     // 0 until night textures finish loading (or none exist)
uniform vec2  uSeed;       // per-craft texture offset
uniform vec2  uCenter;     // centroid of the main liquid (device px): textures are anchored here

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
float smax(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0);
  return max(a, b) + h * h * 0.25 / k;
}
vec2 wob(float i) {
  if (i > 5.5) return vec2(0.0);          // tiny blobs move on their own
  return vec2(sin(uTime * 0.6 + i * 1.7), cos(uTime * 0.5 + i * 2.3)) * uWob;
}

// ripples the whole silhouette so the liquid breathes and warps
vec2 warpP(vec2 p) {
  if (uWarp < 0.0005) return p;
  vec2 w = p / uUnit;
  return p + uWarp * uUnit * vec2(
    sin(w.y * 2.3 + uTime * 0.7) + 0.5 * sin(w.y * 4.3 - uTime * 1.1),
    cos(w.x * 2.1 - uTime * 0.6) + 0.5 * cos(w.x * 3.9 + uTime * 1.2));
}

float sceneRaw(vec2 p) {
  float dm = 1e5, dt = 1e5;
  for (int i = 0; i < ${MAX_SHAPES}; i++) {
    vec4 a = uA[i];
    if (a.z < 0.5) continue;
    float di = sdRBox(p, a.xy + wob(float(i)), a.zw, uB[i].x);
    if (i < ${MAIN_SHAPES}) dm = smin(dm, di, uK); else dt = smin(dt, di, uKt);
  }
  return smin(dm, dt, uKt * 1.4);
}
float scene(vec2 p) { return sceneRaw(warpP(p)); }

// dome height (px): a hemisphere of radius s rising from the shape edge; flat once deeper than s
float dome(float d, float s) {
  float u = clamp(-d, 0.0, s);
  return sqrt(max(u * (2.0 * s - u), 0.0));
}
float height(vec2 p) {
  vec2 wp = warpP(p);
  float h = dome(sceneRaw(wp), uBevel * 0.55);
  for (int i = 0; i < ${MAX_SHAPES}; i++) {
    vec4 a = uA[i];
    if (a.z < 0.5) continue;
    float s = min(min(a.z, a.w) * 0.95, uBevel);
    h = smax(h, dome(sdRBox(wp, a.xy + wob(float(i)), a.zw, uB[i].x), s), max(uBevel * 0.5, 4.0));
  }
  return h;
}

// ── marbling ──
float marbleField(vec2 q, float t) {
  vec2 w = q * 2.1;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    w += 0.55 * vec2(sin(w.y * 1.9 + t * 4.0 + fi * 1.7), cos(w.x * 1.6 - t * 3.2 + fi * 2.3));
  }
  return 0.5 + 0.5 * sin(w.x * 1.35 + w.y * 0.95 + 1.3 * sin(w.x * 0.7 - w.y * 1.2 + t));
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
// cosmic palette: hot pink, violet, electric blue, cyan
vec3 rampN(float x) {
  float a = x * 4.0;
  vec3 c = vec3(0.0);
  float ws = 0.0;
  for (int i = 0; i < 4; i++) {
    float d = abs(mod(a - float(i) + 2.0, 4.0) - 2.0);
    float w = exp(-d * d * 7.0);
    vec3 col = i == 0 ? vec3(1.0, 0.34, 0.74) : (i == 1 ? vec3(0.62, 0.36, 1.0) : (i == 2 ? vec3(0.34, 0.58, 1.0) : vec3(1.0, 0.80, 0.52)));
    c += col * w;
    ws += w;
  }
  return c / ws;
}
// far-field smoke palette: pink, violet, blue only, so dim light never turns muddy
vec3 rampCool(float x) {
  float a = x * 3.0;
  vec3 c = vec3(0.0);
  float ws = 0.0;
  for (int i = 0; i < 3; i++) {
    float d = abs(mod(a - float(i) + 1.5, 3.0) - 1.5);
    float w = exp(-d * d * 5.0);
    vec3 col = i == 0 ? vec3(1.0, 0.34, 0.74) : (i == 1 ? vec3(0.62, 0.36, 1.0) : vec3(0.34, 0.58, 1.0));
    c += col * w;
    ws += w;
  }
  return c / ws;
}
vec3 texMarble(vec2 q, float t) {
  vec2 uv = q * 0.36 + 0.5 + uSeed;
  uv += 0.05 * vec2(sin(q.y * 2.3 + t * 5.0), cos(q.x * 2.1 - t * 4.0));
  uv += 0.08 * vec2(sin(t * 6.0), cos(t * 4.6));
  return texture2D(uTex0, uv).rgb * uTexMix.x + texture2D(uTex1, uv).rgb * uTexMix.y + texture2D(uTex2, uv).rgb * uTexMix.z;
}
vec3 texMarbleN(vec2 q, float t) {
  vec2 uv = q * 0.36 + 0.5 + uSeed * 0.8;
  uv += 0.05 * vec2(sin(q.y * 2.3 + t * 5.0), cos(q.x * 2.1 - t * 4.0));
  uv += 0.08 * vec2(sin(t * 6.0), cos(t * 4.6));
  return texture2D(uTexN0, uv).rgb * uTexMix.x + texture2D(uTexN1, uv).rgb * uTexMix.y + texture2D(uTexN2, uv).rgb * uTexMix.z;
}

// ── night sky ──
float starLayer(vec2 p, float cell, float seed, float speed) {
  vec2 pp = p + vec2(0.0, uScroll * speed);       // slower than the page: depth
  vec2 g = floor(pp / cell);
  vec2 f = fract(pp / cell) - 0.5;
  float h = hash(g + seed);
  if (h < 0.80) return 0.0;
  vec2 o = (vec2(hash(g + seed + 7.1), hash(g + seed + 13.3)) - 0.5) * 0.62;
  float d = length(f - o) * cell;
  float size = mix(0.55, 1.5, hash(g + seed + 3.7)) * uDpr;
  float tw = 0.62 + 0.38 * sin(uTime * (0.7 + hash(g + seed + 9.1) * 2.2) + h * 40.0);
  return smoothstep(size, 0.0, d) * tw * (0.35 + 0.65 * hash(g + seed + 5.3));
}
vec3 nightSky(vec2 p) {
  vec2 q = (p - 0.5 * uRes) / uUnit;
  float t = uTime * 0.05;
  vec3 col = vec3(0.012, 0.008, 0.045);
  float neb = marbleField(q * 0.55 + vec2(0.0, uScroll * 0.00012 / max(uDpr, 1.0)), t * 0.6);
  neb = neb * neb;
  vec3 nebCol = mix(vec3(0.34, 0.07, 0.40), vec3(0.10, 0.20, 0.62), smoothstep(-0.7, 0.9, q.x + 0.4 * sin(q.y * 1.6 + t * 6.0)));
  col += nebCol * neb * 0.08;
  // pink glow upper-left, blue glow lower-right, like the reference
  col += vec3(0.50, 0.08, 0.38) * 0.06 * smoothstep(1.6, 0.0, length(q - vec2(-1.5, 0.9)));
  col += vec3(0.08, 0.18, 0.62) * 0.07 * smoothstep(1.7, 0.0, length(q - vec2(1.6, -0.9)));
  float s = starLayer(p, 64.0 * uDpr, 1.0, 0.06) + starLayer(p, 110.0 * uDpr, 17.0, 0.12) * 1.3 + starLayer(p, 190.0 * uDpr, 41.0, 0.24) * 1.8;
  vec3 starTint = mix(vec3(0.85, 0.92, 1.0), vec3(1.0, 0.78, 0.95), hash(floor(p / (90.0 * uDpr))));
  col += starTint * s * 1.1;
  return col;
}
vec3 daySky(vec2 p) {
  vec2 q = (p - 0.5 * uRes) / uUnit;
  vec3 bg = vec3(1.0, 0.965, 0.91);
  bg = mix(bg, vec3(1.0, 0.83, 0.90), 0.38 * smoothstep(1.7, 0.0, length(q - vec2(-1.5, 0.95))));
  bg = mix(bg, vec3(0.82, 0.91, 1.0), 0.34 * smoothstep(1.8, 0.0, length(q - vec2(1.6, -1.0))));
  bg = mix(bg, vec3(1.0, 0.96, 0.77), 0.30 * smoothstep(1.4, 0.0, length(q - vec2(0.2, 1.2))));
  return bg;
}
vec3 backdrop(vec2 p) {
  return mix(daySky(p), nightSky(p), uNight);
}

// ── ethereal smoke: thin curling filaments that spiral around the liquid ──
float wisps(vec2 sp, float t) {
  vec2 w = sp;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    w += 0.42 * vec2(sin(w.y * 2.1 + t * 3.0 + fi * 2.0), cos(w.x * 1.8 - t * 2.4 + fi * 1.3));
  }
  float f = sin(w.x * 2.2 + sin(w.y * 1.7 + t * 2.0) * 1.6);
  return pow(1.0 - abs(f), mix(2.2, 3.1, uNight));   // 1 along the filament centre, 0 between (night: finer threads)
}
// returns (alpha, hue phase) of the smoke at p; d = distance to the liquid there
vec2 smokeAt(vec2 p, float d, float t) {
  vec2 qc = (p - uCenter) / uUnit;
  float r = length(qc);
  float ang = atan(qc.y, qc.x) + 0.9 / (0.45 + r) + t * 2.5;   // spiral twist, tighter near the liquid
  vec2 sp = vec2(cos(ang), sin(ang)) * r * 1.5;
  float w1 = wisps(sp, t);
  float w2 = wisps(sp * 1.9 + 3.7, t * 1.3);
  float fall = exp(-max(d, 0.0) / (mix(0.52, 0.27, uNight) * uUnit));
  float a = (0.55 * w1 + 0.45 * w2) * fall + 0.20 * fall * fall;
  return vec2(clamp(a * uSmoke, 0.0, 1.0), fract(ang * 0.159 + r * 0.45 + t * 1.2));
}
vec3 smokeColor(float phase, float warm) {
  vec3 day = mix(ramp(phase), vec3(1.0), 0.06);
  vec3 night = mix(rampCool(phase), vec3(1.0, 0.82, 0.55), clamp(warm, 0.0, 1.0) * 0.55);   // gold only near the core
  return mix(day, night, uNight);
}
// composite smoke + sparkles over a backdrop color
vec3 withSmoke(vec3 base, vec2 p, float d, float t) {
  if (uSmoke < 0.005) return base;
  vec2 sm = smokeAt(p, d, t);
  vec3 sc = smokeColor(sm.y, exp(-max(d, 0.0) / (0.12 * uUnit)));
  vec3 outc = mix(base, sc, clamp(sm.x * 1.15, 0.0, 0.92) * (1.0 - uNight));   // day: pastel cloud over cream
  outc += sc * sm.x * 0.62 * uNight;                                  // night: additive glow
  outc += vec3(1.0, 0.97, 1.0) * pow(sm.x, 3.0) * 0.07 * (1.0 - uNight);   // soft highlights on dense wisps
  // sparkles drifting inside the smoke
  float sp = starLayer(p, 72.0 * uDpr, 29.0, 0.0) + starLayer(p, 131.0 * uDpr, 53.0, 0.0) * 0.8;
  outc += mix(vec3(1.0, 0.95, 0.98), vec3(1.0, 0.88, 0.58), uNight) * sp * smoothstep(0.04, 0.40, sm.x) * 1.7;
  return outc;
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 q = (p - 0.5 * uRes) / uUnit;
  float t = uTime * 0.06;

  vec3 bg = backdrop(p);
  float d = scene(p);

  // ethereal smoke glow + soft aura around the liquid
  bg = withSmoke(bg, p, d, t);
  float glow = exp(-max(d, 0.0) / (0.17 * uUnit));
  vec3 auraDay = mix(vec3(1.0, 0.62, 0.82), vec3(0.62, 0.78, 1.0), smoothstep(-0.6, 0.7, q.x));
  vec3 auraNight = mix(vec3(1.0, 0.26, 0.70), vec3(0.28, 0.50, 1.0), smoothstep(-0.6, 0.7, q.x));
  bg += mix(auraDay, auraNight, uNight) * glow * mix(0.12, 0.45, uNight) * uShadow;

  // faint contact shadow (day only)
  float sh = smoothstep(0.26 * uUnit, -0.05 * uUnit, scene(p + vec2(0.03, 0.12) * uUnit));
  vec3 caustic = ramp(fract(q.x * 0.42 + q.y * 0.18 + uTime * 0.01 + 0.15));
  bg = mix(bg, bg * mix(vec3(0.88, 0.78, 0.88), caustic * 1.04, 0.6), sh * 0.38 * uShadow * (1.0 - uNight));

  vec3 col = bg;
  float feather = mix(1.5, 0.03 * uUnit, uSun);
  float mask = 1.0 - smoothstep(-feather, feather, d);

  if (mask > 0.001) {
    float inner = clamp(-d / max(uBevel, 1.0), 0.0, 1.0);

    // normal from the dome height field
    float e = 1.5;
    vec2 g = vec2(height(p + vec2(e, 0.0)) - height(p - vec2(e, 0.0)),
                  height(p + vec2(0.0, e)) - height(p - vec2(0.0, e))) / (2.0 * e);
    vec3 n = normalize(vec3(-g, 1.0));

    // body color: texture (when loaded) or procedural palette
    float v = marbleField(q, t);
    vec3 marbleDay = ramp(v * 1.7);
    if (uTexOn > 0.001) marbleDay = mix(marbleDay, texMarble((p - uCenter) / uUnit, t), uTexOn);
    vec3 marbleNight = rampN(v * 1.7);
    if (uTexNOn > 0.001) marbleNight = mix(marbleNight, texMarbleN((p - uCenter) / uUnit, t), uTexNOn);
    vec3 marble = mix(marbleDay, mix(marbleNight, marbleDay * 1.10, 0.62), uNight);

    // per-shape solid colors (cards, orbs, tiny blobs)
    vec3 sMain = vec3(0.0), sTiny = vec3(0.0);
    float wMain = 0.0, wTiny = 0.0;
    for (int i = 0; i < ${MAX_SHAPES}; i++) {
      vec4 a = uA[i];
      if (a.z < 0.5) continue;
      float di = sdRBox(warpP(p), a.xy + wob(float(i)), a.zw, uB[i].x);
      float w = exp(-max(di, 0.0) / (0.012 * uUnit)) + 1e-4;
      if (i < ${MAIN_SHAPES}) { sMain += uB[i].yzw * w; wMain += w; } else { sTiny += uB[i].yzw * w; wTiny += w; }
    }
    vec3 solidMain = wMain > 0.0 ? sMain / wMain : marble;
    solidMain = mix(solidMain, marble, 0.14);
    vec3 body = mix(solidMain, marble, uMarble);
    if (wTiny > 0.0) {
      vec3 solidTiny = mix(sTiny / wTiny, marble, 0.22);
      body = mix(body, solidTiny, clamp(wTiny / (wTiny + wMain + 1e-4) * 1.25, 0.0, 1.0));
    }

    // embossed ruled lines (invoice sheet)
    if (uLines > 0.001) {
      float row = abs(fract(p.y / (0.075 * uUnit)) - 0.5);
      float line = smoothstep(0.46, 0.5, row) * smoothstep(0.0, 0.3, inner);
      n = normalize(n + vec3(0.0, line * 0.5 * uLines, 0.0));
      body = mix(body, body * 0.94, line * uLines);
    }

    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 L1 = normalize(vec3(-0.45, 0.75, 0.55));
    vec3 L2 = normalize(vec3(0.7, 0.15, 0.7));
    float fres = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.2);

    // translucency: refract the backdrop through the bubble; swirls are denser than clear areas
    vec3 behind = withSmoke(backdrop(p + n.xy * (0.06 * uUnit)), p + n.xy * (0.06 * uUnit), d, t);
    float dif = mix(0.80 + 0.20 * dot(n, L1), 0.58 + 0.42 * dot(n, L1), uNight);
    vec3 tinted = body * dif + body * 0.30 * uNight;   // night: the liquid emits its own light
    float sat = max(body.r, max(body.g, body.b)) - min(body.r, min(body.g, body.b));
    float dens = clamp(0.42 + 0.85 * sat, 0.0, 1.0) * mix(0.55, 1.0, smoothstep(0.0, 0.4, inner));
    dens = mix(1.0, dens * mix(1.0, 0.92, uNight), uGlass);
    float tinyMask = clamp(wTiny / (wTiny + wMain + 1e-4) * 1.25, 0.0, 1.0);
    dens = mix(dens, 0.94, tinyMask);
    vec3 lit = mix(behind, tinted, dens);

    // thin-film rainbow band that sweeps diagonally and gathers toward the rim
    float ph = dot(q, vec2(0.55, 0.83)) * 2.2 + v * 1.4 + t * 4.0;
    vec3 rainbow = 0.5 + 0.5 * cos(6.2831 * (ph + vec3(0.0, 0.33, 0.67)));
    float bandMask = (0.10 + 0.55 * fres) * uGlass * (0.6 + 0.4 * smoothstep(0.1, 0.5, inner));
    lit = mix(lit, rainbow, bandMask * mix(0.50, 0.75, uNight));

    // studio highlights, crisp edge line, rim light
    float win1 = smoothstep(0.945, 0.985, dot(reflect(-V, n), L1)) * 0.55;
    float win2 = smoothstep(0.965, 0.992, dot(reflect(-V, n), L2)) * 0.30;
    float spec = pow(max(dot(reflect(-L1, n), V), 0.0), 90.0) * 0.40;
    lit += (win1 + win2 + spec) * vec3(1.0, 0.99, 0.97) * (1.0 - 0.9 * tinyMask);
    float edgeLine = smoothstep(2.6 * uDpr, 0.0, abs(d + 1.4 * uDpr)) * 0.55 * uGlass * (1.0 - uSun);
    lit += vec3(1.0, 0.97, 1.0) * (edgeLine + 0.32 * pow(fres, 1.5) * uGlass * (1.0 - 0.75 * uSun));
    lit = mix(lit, vec3(1.0), 0.10 * fres * (1.0 - uGlass));

    // candy saturation lift (day) / neon lift (night)
    float lum = dot(lit, vec3(0.299, 0.587, 0.114));
    lit = mix(vec3(lum), lit, mix(1.18, 1.25, uNight));
    lit = lit * 1.03 + 0.02;

    col = mix(bg, clamp(lit, 0.0, 1.0), mask);
  }

  // sun-like radiance: the rim melts into a palette-tinted corona and slow rays fan outward (outside only)
  if (uSun > 0.005) {
    vec2 qcs = (p - uCenter) / uUnit;
    float aa = atan(qcs.y, qcs.x);
    float outD = max(d, 0.0) / uUnit;
    float inD = max(-d, 0.0) / uUnit;
    float core = exp(-outD / 0.07) * 0.62 + exp(-inD / 0.035) * 0.42 + exp(-outD / 0.38) * 0.26 * (1.0 - 0.55 * uNight);
    float rays = pow(0.5 + 0.5 * sin(aa * 9.0 + t * 5.0 + 2.0 * sin(aa * 4.0 - t * 3.0)), 5.0)
               * exp(-outD / 0.85) * 0.20 * smoothstep(0.0, 0.07, outD);
    float ph = fract(aa * 0.159 + t * 0.8 + outD * 0.6);
    vec3 halo = mix(mix(vec3(1.0, 0.96, 0.86), vec3(1.0, 0.90, 0.66), uNight), smokeColor(ph, exp(-outD / 0.15)), clamp(0.40 + outD * 2.0, 0.40, 0.88));
    float k = (core + rays) * uSun * mix(0.50, 0.52, uNight);
    col = 1.0 - (1.0 - col) * (1.0 - clamp(halo * k, 0.0, 0.92));   // screen blend: never overshoots
  }

  // faint grain
  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.016;
  gl_FragColor = vec4(col, 1.0);
}
`;
