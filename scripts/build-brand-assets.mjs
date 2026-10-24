#!/usr/bin/env node
// Builds the DMGE logo mark + app icon set from one transparent master.
//
//   node scripts/build-brand-assets.mjs <logo-master.png>
//
// <logo-master.png> is the full-resolution glossy jelly mark on a transparent background
// (the chosen logo-b-* candidate; masters are not kept in the repo).
// Writes:
//   src/assets/brand/mark-512.png   transparent, trimmed, ~8% padding
//   src/assets/brand/mark-128.webp  transparent (lossless)
//   src/assets/brand/mark-64.webp   transparent (lossless)
//   public/icon-192.png, icon-512.png            "any" icons, mark on opaque cream
//   public/icon-maskable-512.png                 whole mark inside the maskable safe circle (80% diameter)
//   public/apple-touch-icon.png                  180x180, opaque cream
//   public/favicon-32.png                        transparent, tight padding
//   public/favicon.ico                           16/32/48, PNG-compressed entries, transparent
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BRAND_DIR = path.join(ROOT, 'src/assets/brand')
const PUBLIC_DIR = path.join(ROOT, 'public')
const CREAM = '#FFF6E8'
const ALPHA_EDGE = 8 // alpha above this counts as "mark" when measuring bounds

const src = process.argv[2]
if (!src) {
  console.error('usage: node scripts/build-brand-assets.mjs <logo-master.png>')
  process.exit(1)
}

// 1. trim the master to the alpha bounding box
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
let x0 = info.width
let y0 = info.height
let x1 = -1
let y1 = -1
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > ALPHA_EDGE) {
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
}
if (x1 < 0) throw new Error('master has no visible pixels')
const bw = x1 - x0 + 1
const bh = y1 - y0 + 1
const trimmed = await sharp(src)
  .ensureAlpha()
  .extract({ left: x0, top: y0, width: bw, height: bh })
  .png()
  .toBuffer()

// farthest visible pixel from the bbox centre, in trimmed-mark pixels (for the maskable circle)
let rMax = 0
{
  const cx = (bw - 1) / 2
  const cy = (bh - 1) / 2
  for (let y = y0; y <= y1; y += 2) {
    for (let x = x0; x <= x1; x += 2) {
      if (data[(y * info.width + x) * 4 + 3] > ALPHA_EDGE) {
        const d = Math.hypot(x - x0 - cx, y - y0 - cy)
        if (d > rMax) rMax = d
      }
    }
  }
}

// 2. compose the mark onto a square canvas.
//    `box` is the target size in px of the mark's larger side.
async function compose(size, box, background) {
  const scale = box / Math.max(bw, bh)
  const w = Math.max(1, Math.round(bw * scale))
  const h = Math.max(1, Math.round(bh * scale))
  const mark = await sharp(trimmed).resize(w, h, { kernel: 'lanczos3' }).png().toBuffer()
  return sharp({
    create: { width: size, height: size, channels: 4, background: background ?? { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: mark, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .png()
}

const smallSharpen = (img) => img.sharpen({ sigma: 0.5 })

await mkdir(BRAND_DIR, { recursive: true })

// brand marks: ~8% padding each side, rendered at 2x then downsampled for crisp small sizes
const markFrac = 0.84
const mark1024 = await (await compose(1024, 1024 * markFrac)).toBuffer()
await sharp(mark1024).resize(512, 512, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(path.join(BRAND_DIR, 'mark-512.png'))
await smallSharpen(sharp(mark1024).resize(128, 128, { kernel: 'lanczos3' })).webp({ lossless: true }).toFile(path.join(BRAND_DIR, 'mark-128.webp'))
await smallSharpen(sharp(mark1024).resize(64, 64, { kernel: 'lanczos3' })).webp({ lossless: true }).toFile(path.join(BRAND_DIR, 'mark-64.webp'))

// "any" icons and apple touch icon: opaque cream, mark ~76% of the canvas
const anyFrac = 0.76
for (const size of [192, 512]) {
  const big = await (await compose(size * 2, size * 2 * anyFrac, CREAM)).toBuffer()
  await sharp(big).resize(size, size, { kernel: 'lanczos3' }).flatten({ background: CREAM }).png({ compressionLevel: 9 }).toFile(path.join(PUBLIC_DIR, `icon-${size}.png`))
}
{
  const big = await (await compose(360, 360 * 0.74, CREAM)).toBuffer()
  await sharp(big).resize(180, 180, { kernel: 'lanczos3' }).flatten({ background: CREAM }).png({ compressionLevel: 9 }).toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'))
}

// maskable: every visible pixel inside the central circle of 80% of the canvas width
const maskableBox = ((0.4 * 1024) / rMax) * Math.max(bw, bh)
{
  const big = await (await compose(1024, maskableBox, CREAM)).toBuffer()
  await sharp(big).resize(512, 512, { kernel: 'lanczos3' }).flatten({ background: CREAM }).png({ compressionLevel: 9 }).toFile(path.join(PUBLIC_DIR, 'icon-maskable-512.png'))
}

// favicons: transparent, ~3% padding so the mark holds up at 16px
const favFrac = 0.94
const favPngs = {}
for (const size of [16, 32, 48]) {
  const big = await (await compose(size * 8, size * 8 * favFrac)).toBuffer()
  favPngs[size] = await smallSharpen(sharp(big).resize(size, size, { kernel: 'lanczos3' })).png({ compressionLevel: 9 }).toBuffer()
}
await writeFile(path.join(PUBLIC_DIR, 'favicon-32.png'), favPngs[32])

// .ico container with PNG-compressed entries (supported by every current browser)
{
  const sizes = [16, 32, 48]
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(sizes.length, 4)
  const dir = Buffer.alloc(16 * sizes.length)
  let offset = header.length + dir.length
  sizes.forEach((size, i) => {
    const png = favPngs[size]
    const o = i * 16
    dir.writeUInt8(size, o) // width
    dir.writeUInt8(size, o + 1) // height
    dir.writeUInt8(0, o + 2) // palette
    dir.writeUInt8(0, o + 3) // reserved
    dir.writeUInt16LE(1, o + 4) // colour planes
    dir.writeUInt16LE(32, o + 6) // bits per pixel
    dir.writeUInt32LE(png.length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += png.length
  })
  await writeFile(path.join(PUBLIC_DIR, 'favicon.ico'), Buffer.concat([header, dir, ...sizes.map((s) => favPngs[s])]))
}

const pct = (n) => `${(n * 100).toFixed(1)}%`
console.log(`master bbox ${bw}x${bh}, farthest-pixel radius ${rMax.toFixed(0)}px`)
console.log(`mark-512 fills ${pct(markFrac)} | any icons ${pct(anyFrac)} | maskable ${pct(maskableBox / 1024)} of canvas (circle-fitted) | favicon ${pct(favFrac)}`)
