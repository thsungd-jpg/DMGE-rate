// html2pdf is heavy (html2canvas + jsPDF): load it only when a PDF is actually made
const loadHtml2pdf = () => import('html2pdf.js').then((m) => m.default || m);
import { buildInvoiceFigures } from './pricing';
import { buildInvoiceItems } from './invoiceItems';
import markUrl from '../assets/brand/mark-256.png';

// The DMGE mark as a data URI so the PDF renderer never depends on a network or cache fetch.
async function markDataUrl() {
  try {
    const blob = await (await fetch(markUrl)).blob();
    return await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
  } catch { return null; }
}

// ──────────────────────────────────────────────────────────────────────────
// "Sorbet Ink" invoice — pastel candy-ink on warm cream.
// html2canvas can't paint pseudo-elements, so everything is a real element
// with inline styles. The invoice is paginated by hand (see paginate()) so
// long item lists never get sliced through a row.
// ──────────────────────────────────────────────────────────────────────────

const C = {
  cream: '#FFF6E8', paper: '#FFFBF4',
  ink: '#2B2140', ink2: '#5B5170',
  pink: '#FF9EC7', pinkDeep: '#C2326F',
  blue: '#8EC5FF', blueDeep: '#2F6FD0',
  mint: '#9BF0C8', mintDeep: '#167A55',
  butter: '#FFE98A', butterDeep: '#8A6300',
};

const F = {
  display: "'Instrument Serif','Iowan Old Style','Times New Roman',Georgia,serif",
  body: "'DM Sans',system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif",
  mono: "'DM Mono',ui-monospace,'SF Mono',Menlo,Consolas,monospace",
};

// Every face the template uses; each is loaded explicitly before capture.
const FONT_FACES = [
  '400 32px "Instrument Serif"', 'italic 400 32px "Instrument Serif"',
  '400 14px "DM Sans"', '500 14px "DM Sans"', '600 14px "DM Sans"', '700 14px "DM Sans"',
  '400 14px "DM Mono"', '500 14px "DM Mono"',
];
const FONT_FAMILIES = ['Instrument Serif', 'DM Sans', 'DM Mono'];
const FONT_CSS_URL = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap';

// ── Page geometry ─────────────────────────────────────────────────────────
// html2pdf lays the clone out in a 210mm-wide box, html2canvas rounds that to
// whole canvas pixels, and html2pdf then cuts the canvas into floor(width*297/210)
// tall slices. A page exactly one slice tall means every slice lines up with
// one of our pages: no cut rows, no trailing blank page, no white strip.
const SCALE = 2;
const CANVAS_W = Math.floor(Math.ceil(210 * 96 / 25.4) * SCALE);
const PAGE_H = Math.floor(CANVAS_W * 297 / 210) / SCALE;
const SIDE = 56;           // left/right page padding
// Items and totals stop 90px above the bottom (~273mm of the 297mm A4 page), so nothing
// that matters is cut if the PDF is printed 1:1 on Letter (279.4mm); only the footer strip sits lower.
const FOOT_RESERVE = 90;
const COLS = '1fr 56px 108px 124px';
const FIRST_HEAD_GAP = 26;  // space above the item table on page 1
const CONT_HEAD_GAP = 12;   // ...and on continuation pages

// ── Small helpers ─────────────────────────────────────────────────────────
const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const nl2br = (v) => esc(v).replace(/\r?\n/g, '<br>');
const textLines = (v) => String(v ?? '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);

const fmt = (val) => (Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtQty = (val) => (Number(val) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const money = (val) => `$${fmt(val)}`;

const hexToRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgbToHex = (rgb) => '#' + rgb.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = hexToRgb(a); const B = hexToRgb(b); return rgbToHex(A.map((v, i) => v + (B[i] - v) * t)); };
const rgba = (h, a) => `rgba(${hexToRgb(h).join(',')},${a})`;
const luminance = (h) => {
  const [r, g, b] = hexToRgb(h).map(v => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
// Nudge `fg` toward `toward` until it reaches `min` contrast against `bg`.
const ensureContrast = (fg, bg, min, toward) => {
  let c = fg;
  for (let i = 0; i < 24 && contrast(c, bg) < min; i++) c = mix(c, toward, 0.12);
  return c;
};

// ── Theme: Sorbet Ink defaults, overridden by company white-label colors ──
// Saved profiles carry the old 8-bit palette as "defaults"; those count as unset.
const LEGACY_BRAND_COLORS = new Set(['#0a0a0a', '#1a1a1a', '#ffb347', '#e91e63']);
const brandHex = (v) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(v ?? '').trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map(c => c + c).join('') : m[1];
  const hex = `#${h.toLowerCase()}`;
  return LEGACY_BRAND_COLORS.has(hex) ? null : hex;
};

function buildTheme(branding = {}) {
  const t = {
    page: C.cream, paper: C.paper, ink: C.ink, ink2: C.ink2,
    labelText: C.pinkDeep,
    band: [C.pink, C.blue, C.mint, C.butter],
    card: [C.butter, C.pink, C.blue, C.mint],
    dots: [C.pink, C.blue, C.mint, C.butter],
  };
  // Light-paper invoice: custom page/surface/text colors only apply as a set
  // that is light-on-dark-ink and still reads at 7:1, otherwise the defaults stay.
  const page = brandHex(branding.bgColor) || t.page;
  const paper = brandHex(branding.surfaceColor) || t.paper;
  const ink = brandHex(branding.textColor) || t.ink;
  if (luminance(page) >= 0.55 && luminance(paper) >= 0.55 && contrast(ink, page) >= 7 && contrast(ink, paper) >= 7) {
    t.page = page; t.paper = paper; t.ink = ink;
    if (ink !== C.ink) t.ink2 = ensureContrast(mix(ink, page, 0.32), page, 4.5, ink);
  }
  const accent = brandHex(branding.accentColor);
  if (accent) {
    const base = ensureContrast(accent, t.ink, 4.5, '#ffffff');   // keep ink text readable on the band
    const tints = [base, mix(base, '#ffffff', 0.4), mix(base, '#ffffff', 0.62), mix(base, '#ffffff', 0.8)];
    t.band = tints;
    t.card = [tints[3], tints[0], tints[2], tints[1]];
    t.dots = tints;
    t.labelText = ensureContrast(accent, t.page, 4.5, t.ink);
  }
  return t;
}

// Soft marbled wash — stacked radial gradients only (no images, no filters).
const marble = (c, variant = 0) => {
  const blob = (shape, col, stop = 68) => `radial-gradient(${shape}, ${col} 0%, ${rgba(col, 0)} ${stop}%)`;
  const veil = (shape, a) => `radial-gradient(${shape}, rgba(255,255,255,${a}) 0%, rgba(255,255,255,0) 60%)`;
  if (variant === 0) {
    return [
      blob('ellipse 46% 150% at 4% 8%', c[0]),
      blob('ellipse 40% 140% at 96% 0%', c[1]),
      blob('ellipse 52% 160% at 58% 118%', c[2]),
      blob('ellipse 34% 120% at 14% 112%', c[3]),
      veil('ellipse 26% 70% at 44% 36%', 0.5),
      veil('ellipse 20% 60% at 78% 70%', 0.35),
      `linear-gradient(115deg, ${c[3]} 0%, ${mix(c[0], '#ffffff', 0.35)} 100%)`,
    ].join(',');
  }
  return [
    blob('ellipse 60% 170% at 0% 0%', c[0]),
    blob('ellipse 50% 160% at 100% 10%', c[1]),
    blob('ellipse 55% 160% at 70% 120%', c[2]),
    veil('ellipse 30% 90% at 40% 30%', 0.45),
    `linear-gradient(110deg, ${c[3]} 0%, ${mix(c[0], '#ffffff', 0.4)} 100%)`,
  ].join(',');
};

function statusTone(status) {
  const s = String(status || '').toLowerCase();
  if (/overdue|late/.test(s)) return { bg: C.pink, dot: C.pinkDeep };
  if (/draft|void|cancel/.test(s)) return { bg: C.blue, dot: C.blueDeep };
  if (/paid/.test(s) && !/un/.test(s)) return { bg: C.mint, dot: C.mintDeep };
  return { bg: C.butter, dot: C.butterDeep };
}

// ── Font + image loading ──────────────────────────────────────────────────
const withTimeout = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]);

// index.html normally links the Google Fonts CSS; add it only if it's missing.
function ensureFontStylesheet() {
  try {
    const declared = new Set([...document.fonts].map(f => f.family.replace(/["']/g, '')));
    if (FONT_FAMILIES.every(f => declared.has(f)) || document.getElementById('dmge-invoice-fonts')) return Promise.resolve();
    return withTimeout(new Promise((resolve) => {
      const link = document.createElement('link');
      link.id = 'dmge-invoice-fonts';
      link.rel = 'stylesheet';
      link.href = FONT_CSS_URL;
      link.onload = resolve;
      link.onerror = resolve;
      document.head.appendChild(link);
    }), 5000);
  } catch { return Promise.resolve(); }   // fall back to system fonts
}

async function loadFonts(sampleText) {
  try {
    await ensureFontStylesheet();
    // Pass the real text so the right unicode-range subsets are fetched too.
    const text = String(sampleText || '').slice(0, 4000) || ' ';
    await withTimeout(Promise.all(FONT_FACES.map(f => document.fonts.load(f, text))), 6000);
    await withTimeout(document.fonts.ready, 3000);
  } catch { /* fall back to system fonts */ }
}

function loadLogo(src) {
  if (!src || !/^(data:image\/|https?:\/\/)/i.test(src)) return Promise.resolve(null);
  return withTimeout(new Promise((resolve) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img.naturalWidth && img.naturalHeight ? { src, w: img.naturalWidth, h: img.naturalHeight } : null);
    img.onerror = () => resolve(null);
    img.src = src;
  }), 5000).then(r => r || null);
}

// ── Template pieces (each returns an HTML string) ─────────────────────────
const label = (txt, color, extra = '') =>
  `<div style="font-family:${F.body};font-weight:700;font-size:10.5px;line-height:1.2;letter-spacing:0.14em;text-transform:uppercase;color:${color};${extra}">${esc(txt)}</div>`;

function brandLockup(brand, t, size = 'lg') {
  const lg = size === 'lg';
  if (brand.logo) {
    const h = lg ? 40 : 26;
    const w = Math.min(lg ? 190 : 120, Math.round(h * brand.logo.w / brand.logo.h));
    const hh = Math.round(w * brand.logo.h / brand.logo.w);
    const cors = brand.logo.src.startsWith('data:') ? '' : ' crossorigin="anonymous"';
    const img = `<img src="${esc(brand.logo.src)}"${cors} alt="${esc(brand.name || 'Logo')}" style="display:block;width:${w}px;height:${hh}px;object-fit:contain;" />`;
    return lg
      // (not inline-block: html2canvas paints an inline-block's background over its <img>)
      ? `<div style="width:fit-content;background:${t.paper};border-radius:16px;padding:9px 14px;">${img}</div>`
      : img;
  }
  if (brand.name) {
    return `<div style="font-family:${F.display};font-weight:400;font-size:${lg ? 36 : 21}px;line-height:1.05;letter-spacing:-0.01em;color:${t.ink};">${esc(brand.name)}</div>`;
  }
  const markImg = brand.mark ? `<img src="${esc(brand.mark.src)}" alt="" style="display:block;width:${lg ? 46 : 28}px;height:${lg ? 46 : 28}px;object-fit:contain;" />` : '';
  return `<div style="display:flex;align-items:center;gap:${lg ? 12 : 8}px;">
    ${markImg}
    <div style="font-family:${F.display};font-weight:400;font-size:${lg ? 40 : 23}px;line-height:1;letter-spacing:0.03em;color:${t.ink};">DMGE</div>
    <div style="font-family:${F.body};font-weight:700;font-size:${lg ? 9.5 : 8.5}px;letter-spacing:0.16em;text-transform:uppercase;color:${t.ink};background:${t.paper};border-radius:999px;padding:${lg ? '5px 10px' : '4px 8px'};">Rate System</div>
  </div>`;
}

// Big, centered logo at the top of page 1 (no banner behind it).
function heroLogo(brand, t) {
  const MAX_W = 300, MAX_H = 130;
  if (brand.logo) {
    const k = Math.min(MAX_W / brand.logo.w, MAX_H / brand.logo.h);
    const w = Math.round(brand.logo.w * k), h = Math.round(brand.logo.h * k);
    const cors = brand.logo.src.startsWith('data:') ? '' : ' crossorigin="anonymous"';
    return `<img src="${esc(brand.logo.src)}"${cors} alt="${esc(brand.name || 'Logo')}" style="display:block;width:${w}px;height:${h}px;object-fit:contain;" />`;
  }
  if (brand.name) {
    return `<div style="font-family:${F.display};font-weight:400;font-size:52px;line-height:1.05;letter-spacing:-0.01em;text-align:center;color:${t.ink};">${esc(brand.name)}</div>`;
  }
  const mark = brand.mark ? `<img src="${esc(brand.mark.src)}" alt="" style="display:block;width:120px;height:120px;object-fit:contain;margin:0 auto;" />` : '';
  return `<div style="text-align:center;">${mark}<div style="margin-top:${mark ? 8 : 0}px;font-family:${F.display};font-weight:400;font-size:34px;line-height:1;letter-spacing:0.04em;color:${t.ink};">DMGE</div></div>`;
}

function heroHTML(d, t) {
  const pill = d.status ? (() => {
    const tone = statusTone(d.status);
    return `<div style="display:flex;align-items:center;gap:8px;background:${tone.bg};border-radius:999px;padding:7px 14px 7px 11px;">
      <div style="width:8px;height:8px;border-radius:50%;background:${tone.dot};"></div>
      <div style="font-family:${F.body};font-weight:700;font-size:11px;line-height:1;letter-spacing:0.12em;text-transform:uppercase;color:${t.ink};">${esc(d.status)}</div>
    </div>`;
  })() : '';
  return `<div style="padding:46px ${SIDE}px 0;">
    <div style="display:flex;justify-content:center;">${heroLogo(d.brand, t)}</div>
    <div style="margin-top:34px;display:flex;align-items:flex-end;justify-content:space-between;">
      <div style="font-family:${F.display};font-weight:400;font-size:62px;line-height:0.86;letter-spacing:-0.03em;font-style:italic;color:${t.ink};">Invoice</div>
      <div style="text-align:right;max-width:300px;">
        <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">${pill}</div>
        ${label('Invoice no.', t.labelText, 'margin-bottom:6px;')}
        <div style="font-family:${F.mono};font-weight:500;font-size:17px;line-height:1.2;color:${t.ink};word-break:break-all;">${esc(d.invoiceNumber)}</div>
      </div>
    </div>
  </div>`;
}

function metaHTML(d, t) {
  const cells = [['Issued', esc(d.issuedDate)]];
  if (d.dueDate) cells.push(['Due', esc(d.dueDate)]);
  cells.push(['Amount due', money(d.totalDue)]);
  const cell = ([k, v], i) => `<div style="flex:1;min-width:0;padding:12px 0 13px ${i ? 20 : 0}px;${i ? `border-left:1px solid ${rgba(t.ink, 0.12)};margin-left:20px;` : ''}">
      ${label(k, t.labelText, 'margin-bottom:7px;')}
      <div style="font-family:${F.mono};font-weight:500;font-size:${k === 'Amount due' ? 17 : 14}px;line-height:1.25;color:${t.ink};">${v}</div>
    </div>`;
  return `<div style="padding:22px ${SIDE}px 0;">
    <div style="display:flex;border-top:1px solid ${rgba(t.ink, 0.12)};border-bottom:1px solid ${rgba(t.ink, 0.12)};">${cells.map(cell).join('')}</div>
  </div>`;
}

function partiesHTML(d, t) {
  const col = (title, name, addr) => `<div style="flex:1;min-width:0;overflow-wrap:anywhere;">
      ${label(title, t.labelText, 'margin-bottom:11px;')}
      <div style="font-family:${F.display};font-weight:400;font-size:25px;line-height:1.15;letter-spacing:-0.005em;color:${t.ink};margin-bottom:7px;">${esc(name)}</div>
      <div style="font-family:${F.body};font-weight:400;font-size:13px;line-height:1.6;color:${t.ink2};">${addr}</div>
    </div>`;
  return `<div style="padding:24px ${SIDE}px 0;display:flex;gap:44px;">
    ${col('From', d.fromName, textLines(d.fromAddress).map(esc).join('<br>'))}
    ${col('Billed to', d.toName, textLines(d.toAddress).map(esc).join('<br>'))}
  </div>`;
}

function tableHeadHTML(t, topGap) {
  const th = (txt, right) => label(txt, t.ink2, right ? 'text-align:right;' : '');
  return `<div style="padding:${topGap}px ${SIDE}px 0;">
    <div style="display:grid;grid-template-columns:${COLS};column-gap:16px;padding:0 0 11px;border-bottom:1.5px solid ${t.ink};">
      ${th('Description')}${th('Qty', true)}${th('Rate', true)}${th('Amount', true)}
    </div>
  </div>`;
}

function rowHTML(item, t) {
  const note = String(item.note ?? '').replace(/^\/\/\s*/, '').trim();
  const num = (v, color, weight) => `<div style="font-family:${F.mono};font-weight:${weight};font-size:13px;line-height:20px;color:${color};text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;">${v}</div>`;
  return `<div style="padding:0 ${SIDE}px;">
    <div style="display:grid;grid-template-columns:${COLS};column-gap:16px;align-items:start;padding:13px 0 12px;border-bottom:1px solid ${rgba(t.ink, 0.12)};">
      <div style="min-width:0;overflow-wrap:anywhere;">
        <div style="font-family:${F.body};font-weight:600;font-size:14.5px;line-height:20px;color:${t.ink};">${esc(item.desc)}</div>
        ${note ? `<div style="font-family:${F.body};font-weight:400;font-size:12px;line-height:1.5;color:${t.ink2};margin-top:3px;">${esc(note)}</div>` : ''}
      </div>
      ${num(fmtQty(item.qty), t.ink2, 400)}${num(money(item.rate), t.ink2, 400)}${num(money(item.amount), t.ink, 500)}
    </div>
  </div>`;
}

function totalsHTML(d, t) {
  const line = (k, v, last) => `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:7px 0;${last ? '' : `border-bottom:1px solid ${rgba(t.ink, 0.12)};`}">
      <div style="font-family:${F.body};font-weight:500;font-size:13px;color:${t.ink2};">${k}</div>
      <div style="font-family:${F.mono};font-weight:400;font-size:14px;color:${t.ink};font-variant-numeric:tabular-nums;">${v}</div>
    </div>`;
  const rows = d.breakdown ? [
    line('Subtotal', money(d.subtotal)),
    line('Discount', `\u2212${money(d.discount)}`),
    line(`Tax (${esc(d.taxRate)}%)`, money(d.taxAmount), true),
  ].join('') : '';
  const amount = money(d.totalDue);
  return `${rows}
    <div style="margin-top:${rows ? 14 : 0}px;border-radius:22px;padding:15px 22px 17px;background:${marble(t.card, 1)};">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        ${label('Total due', t.ink)}
        ${d.dueDate ? `<div style="font-family:${F.body};font-weight:500;font-size:12px;color:${t.ink};">Due ${esc(d.dueDate)}</div>` : ''}
      </div>
      <div style="margin-top:10px;text-align:right;font-family:${F.mono};font-weight:500;font-size:${amount.length > 12 ? 26 : 32}px;line-height:1.05;letter-spacing:-0.02em;color:${t.ink};white-space:nowrap;font-variant-numeric:tabular-nums;">${amount}</div>
    </div>`;
}

// Closing block: notes + payment details on the left, totals on the right.
function closingHTML(d, t) {
  const payments = (d.paymentDetails || []).filter(p => p && (p.key || p.val));
  const notes = String(d.notes || '').trim();
  const payRows = payments.map(p => `<div style="display:flex;gap:14px;align-items:baseline;margin-bottom:7px;">
      <div style="min-width:70px;font-family:${F.body};font-weight:700;font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:${t.ink2};">${esc(p.key)}</div>
      <div style="min-width:0;overflow-wrap:anywhere;font-family:${F.mono};font-weight:400;font-size:12.5px;line-height:1.45;color:${t.ink};">${esc(p.val)}</div>
    </div>`).join('');
  const left = [
    notes ? `<div style="margin-bottom:${payments.length ? 22 : 0}px;">${label('Notes', t.labelText, 'margin-bottom:10px;')}
      <div style="font-family:${F.body};font-weight:400;font-size:13px;line-height:1.65;color:${t.ink2};">${nl2br(notes)}</div></div>` : '',
    payments.length ? `<div>${label('Payment details', t.labelText, 'margin-bottom:10px;')}${payRows}</div>` : '',
    d.payUrl ? `<div style="margin-top:${payments.length || notes ? 22 : 0}px;">${label('Pay online by card', t.labelText, 'margin-bottom:10px;')}
      <a href="${esc(d.payUrl)}" style="display:inline-block;font-family:${F.body};font-weight:700;font-size:13px;line-height:1;color:${t.ink};background:${t.paper};border-radius:999px;padding:11px 20px;text-decoration:none;">Pay this invoice online &rarr;</a>
      <div style="margin-top:8px;font-family:${F.body};font-size:11px;line-height:1.4;color:${t.ink2};">Tap the button (or the link in the email) to pay by card.</div></div>` : '',
  ].join('');
  return `<div style="padding:20px ${SIDE}px 0;display:flex;gap:36px;align-items:flex-start;">
    <div style="flex:1;min-width:0;overflow-wrap:anywhere;">${left}</div>
    <div style="width:320px;flex:none;">${totalsHTML(d, t)}</div>
  </div>`;
}

function contHeaderHTML(d, t) {
  return `<div style="padding:44px ${SIDE}px 0;">
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;border-bottom:1px solid ${rgba(t.ink, 0.12)};">
      <div>${brandLockup(d.brand, t, 'sm')}</div>
      <div style="font-family:${F.body};font-weight:500;font-size:12px;color:${t.ink2};">Invoice <span style="font-family:${F.mono};color:${t.ink};">${esc(d.invoiceNumber)}</span> · continued</div>
    </div>
  </div>`;
}

function footerHTML(d, t, n, total) {
  return `<div style="position:absolute;left:${SIDE}px;right:${SIDE}px;bottom:30px;border-top:1px solid ${rgba(t.ink, 0.12)};padding-top:14px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:6px;">
      ${t.dots.map(c => `<div style="width:8px;height:8px;border-radius:50%;background:${c};"></div>`).join('')}
      <div style="margin-left:6px;font-family:${F.body};font-weight:500;font-size:11px;line-height:1;color:${t.ink2};">${esc(d.brand.name || 'DMGE Rate System')}</div>
    </div>
    ${total > 1 ? `<div style="font-family:${F.body};font-weight:500;font-size:11px;line-height:1;color:${t.ink2};">Page ${n} of ${total}</div>` : ''}
  </div>`;
}

// ── Pagination ────────────────────────────────────────────────────────────
// Units are measured in a hidden 210mm host (fonts already loaded), then laid
// onto fixed-height pages greedily. The closing block (totals, notes, payment
// details) never lands on a page without at least one item row above it.
function paginate(units, rowUnits, closingH, limit) {
  const pages = [];
  const open = (first) => ({ first, rows: [], closing: false });
  let cur = open(true);
  let y = units.first + units.firstHead;
  const fresh = (carry) => {
    pages.push(cur);
    cur = open(false);
    y = units.cont + units.head;
    if (carry) { cur.rows.push(carry); y += carry.h; }
  };
  rowUnits.forEach((row) => {
    if (y + row.h > limit && cur.rows.length) fresh();
    cur.rows.push(row);
    y += row.h;
  });
  if (y + closingH > limit) {
    if (cur.rows.length > 1) fresh(cur.rows.pop());
    else { pages.push(cur); cur = open(false); }
  }
  cur.closing = true;
  pages.push(cur);
  return pages;
}

export async function generateInvoicePDF(job, profile, clients = [], catData = null, returnBase64 = false, editorData = null, payUrl = null) {
  profile = profile || {};
  const client = clients.find(c => c.id === job.clientId) || { name: 'Valued Client', email: '', phone: '' };
  const theme = buildTheme(profile.branding || {});

  // ── Normalise both code paths into one data shape ───────────────────────
  const logo = await loadLogo(profile.branding?.logoBase64 || profile.logoUrl);
  const name = (profile.branding?.companyName || '').trim();
  // No custom logo and no brand name: show the DMGE mark instead of bare text.
  const mark = !logo && !name ? await loadLogo(await markDataUrl()) : null;
  const brand = { logo, name, mark };
  let d;
  let items;

  if (editorData) {
    items = (editorData.items || []).map(i => ({ desc: i.desc, note: i.note, qty: i.qty, rate: i.rate, amount: i.amount }));
    d = {
      brand,
      invoiceNumber: editorData.invoiceNumber,
      issuedDate: editorData.issuedDate,
      dueDate: editorData.dueDate,
      status: editorData.status,
      fromName: editorData.fromName, fromAddress: editorData.fromAddress,
      toName: editorData.toName, toAddress: editorData.toAddress,
      breakdown: true,
      subtotal: editorData.subtotal, discount: editorData.discount,
      taxRate: editorData.taxRate, taxAmount: editorData.taxAmount,
      totalDue: editorData.totalDue,
      notes: editorData.notes, paymentDetails: editorData.paymentDetails,
      payUrl,
    };
  } else {
    const clientMultiplier = client.rateMultiplier || 1.0;
    const fig = buildInvoiceFigures(job, clientMultiplier);
    const companyName = profile.branding?.companyName || profile.companyName || profile.name || 'Freelancer';
    items = buildInvoiceItems(job).map((i) => ({ desc: i.desc, note: i.note, qty: i.qty, rate: i.rate, amount: i.amount }));
    d = {
      brand,
      invoiceNumber: job.invoiceNumber || '1001',
      issuedDate: new Date().toLocaleDateString(),
      dueDate: '',
      status: '',
      fromName: companyName, fromAddress: profile.companyAddress || '',
      toName: client.name, toAddress: [client.address, client.city].filter(Boolean).join('\n'),
      breakdown: false,
      totalDue: job.price,
      notes: '', paymentDetails: [],
      payUrl,
    };
  }

  // ── Measure, then paginate ──────────────────────────────────────────────
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;z-index:-1;pointer-events:none;';
  document.body.appendChild(host);

  try {
    const measure = (html) => {
      const el = document.createElement('div');
      el.innerHTML = html;
      host.appendChild(el);
      return el;
    };
    const parts = {
      hero: heroHTML(d, theme), meta: metaHTML(d, theme), parties: partiesHTML(d, theme),
      cont: contHeaderHTML(d, theme),
      closing: closingHTML(d, theme),
      head: tableHeadHTML(theme, FIRST_HEAD_GAP),
    };
    const rowHtml = items.map(i => rowHTML(i, theme));

    await loadFonts([
      d.invoiceNumber, d.issuedDate, d.dueDate, d.status, d.fromName, d.fromAddress, d.toName, d.toAddress,
      d.notes, brand.name, ...(d.paymentDetails || []).flatMap(p => [p.key, p.val]),
      ...items.flatMap(i => [i.desc, i.note]), 'Invoice no. 0123456789 $,.%− ·',
    ].filter(Boolean).join(' '));

    const els = Object.fromEntries(Object.entries(parts).map(([k, html]) => [k, measure(html)]));
    const rowEls = rowHtml.map(measure);
    const firstHead = els.head.getBoundingClientRect().height;
    const units = {
      first: els.hero.getBoundingClientRect().height + els.meta.getBoundingClientRect().height + els.parties.getBoundingClientRect().height,
      cont: els.cont.getBoundingClientRect().height,
      firstHead,
      head: firstHead - FIRST_HEAD_GAP + CONT_HEAD_GAP,
    };
    const rowUnits = rowEls.map((el, i) => ({ html: rowHtml[i], h: el.getBoundingClientRect().height }));
    const closingH = els.closing.getBoundingClientRect().height;

    const pages = paginate(units, rowUnits, closingH, PAGE_H - FOOT_RESERVE);

    const pageHtml = pages.map((p, idx) => {
      const body = [
        p.first ? parts.hero + parts.meta + parts.parties : parts.cont,
        p.rows.length ? tableHeadHTML(theme, p.first ? FIRST_HEAD_GAP : CONT_HEAD_GAP) : '',
        p.rows.map(r => r.html).join(''),
        p.closing ? parts.closing : '',
      ].join('');
      return `<div style="position:relative;width:100%;height:${PAGE_H}px;overflow:hidden;box-sizing:border-box;background:${theme.page};color:${theme.ink};font-family:${F.body};">
        ${body}
        ${footerHTML(d, theme, idx + 1, pages.length)}
      </div>`;
    }).join('');

    host.innerHTML = `<div style="width:100%;background:${theme.page};">${pageHtml}</div>`;
    const root = host.firstElementChild;
    await Promise.all([...root.querySelectorAll('img')].map(img => img.complete ? null
      : withTimeout(new Promise((r) => { img.onload = r; img.onerror = r; }), 3000)));
    await withTimeout(document.fonts.ready, 3000);
    await new Promise(r => setTimeout(r, 60));   // let layout settle (rAF is paused in background tabs)

    const options = {
      margin: [0, 0, 0, 0],
      filename: `${job.invoiceNumber || 'INV'}_${String(job.role || 'invoice').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      enableLinks: true,
      html2canvas: {
        scale: SCALE,
        useCORS: true,
        letterRendering: true,
        backgroundColor: theme.page,
        windowWidth: 794,
        height: pages.length * PAGE_H,
        scrollX: 0,
        scrollY: 0,
        logging: false,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    if (returnBase64) {
      const html2pdf = await loadHtml2pdf();
      const pdf = await html2pdf().set(options).from(root).toPdf().get('pdf');
      return pdf.output('datauristring');
    }
    const html2pdf = await loadHtml2pdf();
    await html2pdf().set(options).from(root).save();
  } finally {
    if (host.parentNode) host.parentNode.removeChild(host);
  }
}
