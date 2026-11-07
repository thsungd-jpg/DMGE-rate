#!/usr/bin/env node
// Turns a video into a numbered WebP frame sequence for the scroll-scrubbed landing animations (src/world/framePlayer.js).
//
//   node scripts/video-to-frames.mjs <video> <out-dir> [options]
//
//   --size 1280x720     frame size of the picture (default: the video's own size)
//   --quality 0.8       WebP quality, 0 to 1
//   --every 1           keep every Nth frame (2 halves the frame rate)
//   --skip 0            frames to leave out at the start
//   --start 1           number of the first file written (f-001.webp), so two clips can share one folder
//   --pad 0.12          margin added around the picture, as a fraction of its size, for the glow to spill into
//   --feather 0.05      eased fade of the picture's own edge, so a subject that touches the frame edge dissolves instead of being sliced
//   --glow 0.5          soft bloom: a blurred copy of the picture laid under it at this strength, so it shows as a halo around the silhouette (0 = none)
//   --blur 0.034        the bloom's radius, as a fraction of the picture's width
//   --glow-fade 34:60   frame numbers (counted in the video) over which the bloom fades from full strength to nothing
//   --rate 0.12         playback speed used to read the frames. Frames are processed while the video plays, so if that takes longer than a frame
//                       lasts, Chrome skips some: the script counts them and warns. Slower is safer, but Chrome refuses anything below 0.0625.
//                       (If the script dies with an error, it leaves its headless Chrome running: quit the "video-to-frames-" ones by hand.)
//
// How it works: there is no ffmpeg here, so the video is played through once in a headless Chrome and every presented frame is drawn to a canvas
// (seeking a paused video in headless Chrome returns stale frames, playing does not). Chrome is found at the usual macOS path, or set CHROME.
// Nothing to install. A 10 s clip takes about 90 s at the default rate. Black stays exactly black: the glow only ever adds light, and fades out
// before the edge of the margin.
//
// The sets used by the landing prototype (the source videos are kept outside the repo, in Downloads):
//   hero jelly   node scripts/video-to-frames.mjs <hero loop>.mp4 src/proto/assets/jelly-seq --size 940x940 --quality 0.65 --pad 0.12 --feather 0.02 --glow 0.55 --blur 0.03
//   burst        node scripts/video-to-frames.mjs <blob to galaxy>.mp4 src/proto/assets/reveal-seq --size 1280x720 --glow 0.55 --blur 0.015 --glow-fade 30:56
//   galaxy loop  node scripts/video-to-frames.mjs <galaxy loop>.mp4 src/proto/assets/reveal-seq --size 1280x720 --every 2 --skip 2 --start 121
// (the burst is 120 frames and the loop continues the numbering from f-121; CLIP_FRAMES in Scrapbook.jsx is the burst's length)
//   dive         node scripts/video-to-frames.mjs <dive into the blob>.mp4 src/proto/assets/dive-seq --size 1280x720 --quality 0.7 --rate 0.07
// (the clip played by "Start pricing": 120 frames, 4.9 MB; the source video, 13.6 MB, is not in the repo: it is Higgsfield job 77d7e4a2-cd6d-4459-bf50-1c43727a1f81, Kling 4.0, 5 s, 1080p)
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createReadStream, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf("--" + name); return i < 0 ? fallback : args[i + 1]; };
const [video, outDir] = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
if (!video || !outDir) { console.error("usage: node scripts/video-to-frames.mjs <video> <out-dir> [--size WxH] [--quality q] [--every n] [--skip n] [--start n] [--pad f] [--feather f] [--glow g] [--blur f] [--glow-fade a:b] [--rate r]"); process.exit(1); }

const opt = {
  size: flag("size", ""), quality: +flag("quality", 0.8), every: +flag("every", 1), skip: +flag("skip", 0), start: +flag("start", 1),
  pad: +flag("pad", 0), feather: +flag("feather", 0), glow: +flag("glow", 0), blur: +flag("blur", 0.034), rate: +flag("rate", 0.12),
  fade: flag("glow-fade", "").split(":").map(Number),
};
const file = resolve(video);
const chromePath = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(outDir, { recursive: true });

// a tiny server for the one video (with Range support, which video playback expects) and an empty page to play it in
const server = createServer((req, res) => {
  if (req.url !== "/video") { res.writeHead(200, { "content-type": "text/html" }); return res.end('<!doctype html><body style="margin:0;background:#000">'); }
  const size = statSync(file).size, m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
  const a = m && m[1] ? +m[1] : 0, b = m && m[2] ? +m[2] : size - 1;
  res.writeHead(m ? 206 : 200, { "content-type": "video/mp4", "accept-ranges": "bytes", "content-length": b - a + 1, ...(m ? { "content-range": `bytes ${a}-${b}/${size}` } : {}) });
  createReadStream(file, { start: a, end: b }).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const profile = mkdtempSync(join(tmpdir(), "video-to-frames-"));
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(chromePath, ["--headless=new", `--remote-debugging-port=${port}`, "--autoplay-policy=no-user-gesture-required", "--no-first-run", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
const done = (code) => { try { chrome.kill(); server.close(); rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(code); };
process.on("SIGINT", () => done(130));

let targets;
for (let i = 0; i < 60 && !targets?.length; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(500); } }
if (!targets?.length) { console.error("could not start Chrome at " + chromePath + " (set CHROME to its path)"); done(1); }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const run = async (expression) => { const r = (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result; if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
await send("Page.navigate", { url: `http://127.0.0.1:${server.address().port}/` }); await sleep(800);

const info = JSON.parse(await run(`(async () => {
  const opt = ${JSON.stringify(opt)};
  const v = document.createElement("video"); v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = "/video"; v.style.cssText = "position:fixed;left:0;top:0;width:320px;height:180px"; document.body.appendChild(v);
  await new Promise((r, j) => { v.onloadeddata = r; v.onerror = () => j(new Error("the video would not load")); });
  const [W, H] = opt.size ? opt.size.split("x").map(Number) : [v.videoWidth, v.videoHeight];
  const P = Math.round(W * opt.pad), CW = W + 2 * P, CH = H + 2 * P;
  const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
  const [out, ox] = canvas(CW, CH), [pic, px] = canvas(W, H), [soft, sx] = canvas(W, H);
  // the feather: an eased ramp (smoothstep) along each edge, multiplied together. A linear ramp shows a seam where it starts.
  let mask = null;
  if (opt.feather > 0) {
    const ramp = (horizontal) => {
      const [r, rx] = canvas(W, H), g = horizontal ? rx.createLinearGradient(0, 0, W, 0) : rx.createLinearGradient(0, 0, 0, H);
      for (let i = 0; i <= 12; i++) { const u = i / 12, s = u * u * (3 - 2 * u); g.addColorStop(u * opt.feather, "rgba(0,0,0," + s + ")"); g.addColorStop(1 - u * opt.feather, "rgba(0,0,0," + s + ")"); }
      rx.fillStyle = g; rx.fillRect(0, 0, W, H); return r;
    };
    const [m, mx] = canvas(W, H); mx.drawImage(ramp(true), 0, 0); mx.globalCompositeOperation = "destination-in"; mx.drawImage(ramp(false), 0, 0); mask = m;
  }
  const glowAt = (n) => { if (!opt.glow) return 0; const [a, b] = opt.fade; if (!(b > a)) return opt.glow; return opt.glow * Math.min(1, Math.max(0, (b - n) / (b - a))); };
  window.__frames = []; let last = -1, seen = 0, lastPresented = -1, missed = 0;
  v.loop = false; v.playbackRate = opt.rate; await v.play();
  await new Promise((res) => {
    v.onended = res;
    const cb = (now, meta) => {
      if (meta.mediaTime !== last) {
        last = meta.mediaTime;
        if (lastPresented >= 0) missed += Math.max(0, meta.presentedFrames - lastPresented - 1);
        lastPresented = meta.presentedFrames;
        if (seen >= opt.skip && (seen - opt.skip) % opt.every === 0) {
          px.globalCompositeOperation = "source-over"; px.drawImage(v, 0, 0, W, H);
          ox.globalCompositeOperation = "source-over"; ox.filter = "none"; ox.globalAlpha = 1; ox.fillStyle = "#000"; ox.fillRect(0, 0, CW, CH);
          const g = glowAt(seen);
          if (g > 0) { ox.globalCompositeOperation = "screen"; ox.filter = "blur(" + (W * opt.blur) + "px)"; ox.globalAlpha = g; ox.drawImage(pic, P, P); ox.filter = "none"; ox.globalAlpha = 1; }
          let sharp = pic;
          if (mask) { sx.globalCompositeOperation = "source-over"; sx.clearRect(0, 0, W, H); sx.drawImage(pic, 0, 0); sx.globalCompositeOperation = "destination-in"; sx.drawImage(mask, 0, 0); sharp = soft; }
          ox.globalCompositeOperation = g > 0 ? "lighten" : "source-over"; ox.drawImage(sharp, P, P); // lighten: the picture wins where it is brighter, so the bloom is a halo, not a wash
          window.__frames.push(out.toDataURL("image/webp", opt.quality));
        }
        seen++;
      }
      if (!v.ended) v.requestVideoFrameCallback(cb);
    };
    v.requestVideoFrameCallback(cb);
  });
  return JSON.stringify({ seen, missed, kept: window.__frames.length, duration: v.duration, picture: [W, H], frame: [CW, CH] });
})()`));

let total = 0;
for (let i = 0; i < info.kept; i++) {
  const data = Buffer.from((await run(`window.__frames[${i}]`)).split(",")[1], "base64");
  total += data.length;
  writeFileSync(join(outDir, `f-${String(opt.start + i).padStart(3, "0")}.webp`), data);
}
console.log(`${info.kept} of ${info.seen} frames, ${info.picture.join("x")} picture in a ${info.frame.join("x")} frame, ${(total / 1e6).toFixed(1)} MB -> ${outDir}`);
if (info.missed) console.warn(`warning: Chrome skipped ${info.missed} frame(s) while they were being processed; run again with a lower --rate (now ${opt.rate}).`);
done(0);
