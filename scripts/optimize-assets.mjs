#!/usr/bin/env node
// Optimizes the DMGE "Sorbet Ink" art set.
//
//   node scripts/optimize-assets.mjs <source-dir> [--only <name-prefix>] [--og <name>]
//
// <source-dir> holds the full-resolution PNG/JPG masters named exactly like the
// final asset (hero.png -> src/assets/art/hero-3840.webp, ...).
// For every still it writes:
//   src/assets/art/<name>-<w>.webp   (quality 82, widths 3840 / 1920 / 960, never upscaled;
//                                     marble-* and cosmic-* are WebGL textures and get 2048 / 1024,
//                                     space-bg gets 3840 / 1920 at quality 90, logo-b-* 1920 / 960)
// and merges an entry into src/assets/art/manifest.json: name, widths, size, aspect ratio,
// dominant + accent colors and a 24px blurred LQIP as a data URI.
// --only limits the run to masters whose name starts with the prefix (other manifest
// entries are kept). With --og <name> it also writes public/og.jpg (1200x630 crop).
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ART_DIR = path.join(ROOT, 'src/assets/art')
const OG_PATH = path.join(ROOT, 'public/og.jpg')
const WIDTHS = [3840, 1920, 960]
const WEBP_QUALITY = 82
const LQIP_WIDTH = 24

// textures sampled by WebGL want power-of-two sizes
const WIDTH_OVERRIDES = [
  [/^marble-/, [2048, 1024]],
  [/^cosmic-/, [2048, 1024]],
  [/^space-bg/, [3840, 1920]],
  [/^logo-b-/, [1920, 960]],
]

// dark star/nebula gradients band badly at the default quality
const QUALITY_OVERRIDES = [[/^space-bg/, 90]]
const FLATTEN_BG = '#FFF6E8' // transparent masters (logo-b-*) are sampled over cream

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? { value: args[i + 1], idx: [i, i + 1] } : null
}
const og = flag('--og')
const only = flag('--only')
const used = new Set([...(og?.idx ?? []), ...(only?.idx ?? [])])
const ogName = og?.value ?? null
const onlyPrefix = only?.value ?? null
const srcDir = args.find((a, i) => !a.startsWith('--') && !used.has(i))

if (!srcDir) {
  console.error('usage: node scripts/optimize-assets.mjs <source-dir> [--only <name-prefix>] [--og <name>]')
  process.exit(1)
}

const toHex = ({ r, g, b }) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

const gcd = (a, b) => (b ? gcd(b, a % b) : a)

// dominant: average of the most populated 4-bit-per-channel color bucket (usually the cream ground).
// accent:   same, but only over clearly chromatic pixels, so it lands on one of the candy hues.
async function colorsOf(input) {
  const { data, info } = await sharp(input)
    .resize(64, 64, { fit: 'inside' })
    .flatten({ background: FLATTEN_BG })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const all = new Map()
  const chroma = new Map()
  const add = (map, key, r, g, b) => {
    const bucket = map.get(key) || { n: 0, r: 0, g: 0, b: 0 }
    bucket.n += 1
    bucket.r += r
    bucket.g += g
    bucket.b += b
    map.set(key, bucket)
  }
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    add(all, key, r, g, b)
    const max = Math.max(r, g, b)
    if (max && (max - Math.min(r, g, b)) / max >= 0.2) add(chroma, key, r, g, b)
  }
  const modeHex = (map) => {
    const top = [...map.values()].sort((x, y) => y.n - x.n)[0]
    return top ? toHex({ r: top.r / top.n, g: top.g / top.n, b: top.b / top.n }) : null
  }
  const dominant = modeHex(all)
  return { dominant, accent: modeHex(chroma) || dominant }
}

const widthsFor = (name, srcW) => {
  const override = WIDTH_OVERRIDES.find(([re]) => re.test(name))
  if (override) return override[1].filter((w) => w <= srcW)
  const ws = WIDTHS.filter((w) => w <= srcW)
  // a master narrower than 3840 (e.g. 9:16 at 2160) keeps its native width as the top tier
  if (srcW > WIDTHS[1] && !ws.includes(srcW)) ws.unshift(srcW)
  return ws
}

async function processStill(file) {
  const name = path.parse(file).name
  const input = path.join(srcDir, file)
  const meta = await sharp(input).metadata()
  const { width, height } = meta
  const widths = widthsFor(name, width)

  const quality = QUALITY_OVERRIDES.find(([re]) => re.test(name))?.[1] ?? WEBP_QUALITY
  for (const w of widths) {
    await sharp(input)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality, alphaQuality: 100, effort: 5 })
      .toFile(path.join(ART_DIR, `${name}-${w}.webp`))
  }

  const lqipBuf = await sharp(input)
    .resize({ width: LQIP_WIDTH })
    .blur(1)
    .webp({ quality: 40 })
    .toBuffer()
  const { dominant, accent } = await colorsOf(input)
  const d = gcd(width, height)

  return {
    name,
    widths,
    width,
    height,
    aspect: Number((width / height).toFixed(4)),
    ratio: `${width / d}:${height / d}`,
    dominant,
    accent,
    lqip: `data:image/webp;base64,${lqipBuf.toString('base64')}`,
  }
}

const files = (await readdir(srcDir))
  .filter((f) => /\.(png|jpe?g)$/i.test(f))
  .filter((f) => !onlyPrefix || f.startsWith(onlyPrefix))
  .sort()

if (!files.length) {
  console.error(`no matching PNG/JPG files in ${srcDir}`)
  process.exit(1)
}

await mkdir(ART_DIR, { recursive: true })

const manifestPath = path.join(ART_DIR, 'manifest.json')
let manifest = {}
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
} catch {
  // first run: start empty
}
for (const file of files) {
  const entry = await processStill(file)
  manifest[entry.name] = entry
  console.log(
    `${entry.name.padEnd(22)} ${entry.ratio.padEnd(6)} ${entry.widths.join('/').padEnd(14)} ${entry.dominant} ${entry.accent}`,
  )
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)))
await writeFile(manifestPath, JSON.stringify(sorted, null, 2) + '\n')
console.log(`manifest.json: ${files.length} processed, ${Object.keys(sorted).length} total`)

if (ogName) {
  const ogSrc = files.find((f) => path.parse(f).name === ogName)
  if (!ogSrc) {
    console.error(`--og: no still named ${ogName}`)
    process.exit(1)
  }
  await sharp(path.join(srcDir, ogSrc))
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(OG_PATH)
  console.log(`og: ${path.relative(ROOT, OG_PATH)} (1200x630 from ${ogSrc})`)
}
