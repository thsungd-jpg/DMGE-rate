#!/usr/bin/env node
// Makes the jelly's poses for the Quote page's scene (src/world/assets/jelly-N.webp): one per station, evenly spaced along the landing's jelly turn
// (src/proto/assets/jelly-seq, black-background frames), as transparent WebP: alpha = the brightest channel, colour = what is left, so it looks the same over
// black and also works on cream.
//
//   node scripts/make-jelly-poses.mjs [stations]      stations defaults to 7 (Craft, Job, Rate, Who, Rights, Extras, Price)
//
// Keep `stations` equal to the number of entries in CAMERA in src/world/Stage.jsx (and the POSES list there).
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("..", import.meta.url));
const SRC = root + "src/proto/assets/jelly-seq/";
const OUT = root + "src/world/assets/";
const FIRST = 1, LAST = 161; // the turn runs from frame 1 to frame 161 (the later frames are the settle)
const n = Math.max(2, Number(process.argv[2]) || 7);
const frames = Array.from({ length: n }, (_, i) => Math.round(FIRST + (i * (LAST - FIRST)) / (n - 1)));

let total = 0;
for (let i = 0; i < frames.length; i++) {
  const { data, info } = await sharp(SRC + "f-" + String(frames[i]).padStart(3, "0") + ".webp").removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let p = 0, q = 0; p < data.length; p += 3, q += 4) {
    const r = data[p], g = data[p + 1], b = data[p + 2], a = Math.max(r, g, b);
    if (a < 6) { out[q + 3] = 0; continue; } // the black around it, and compression noise in it
    out[q] = Math.min(255, Math.round((r * 255) / a)); out[q + 1] = Math.min(255, Math.round((g * 255) / a)); out[q + 2] = Math.min(255, Math.round((b * 255) / a)); out[q + 3] = a;
  }
  const file = OUT + "jelly-" + i + ".webp";
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).resize(704, 704).webp({ quality: 70, alphaQuality: 60, effort: 6, smartSubsample: true }).toFile(file);
  const { size } = statSync(file); total += size;
  console.log("jelly-" + i + ".webp", (size / 1024).toFixed(0) + " KB  (frame " + frames[i] + ")");
}
console.log("total", (total / 1024).toFixed(0) + " KB");
