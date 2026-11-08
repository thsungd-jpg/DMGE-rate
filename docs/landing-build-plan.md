# Landing build plan: the Scrapbook World (night-first, cut-paper, scroll journey)

Decisions: controls = style B (cut-paper pieces); lead look = board B (night collage universe) with a day version of the
same world; vector (Lottie/Rive) plus sprite sheets; art generated with Higgsfield and animated in code; accessibility
and reduced motion required; effects may simplify on weak devices, layout and numbers never do.

## 1. How the scene works
One continuous scene made of **layers**, not boxes:

| Layer | Content | Tech | Moves with |
|---|---|---|---|
| Sky / space | starfield, nebula smears | pre-rendered WebP/AVIF, very slow drift | scroll (slow parallax) |
| Far paper | planets, arcs, ribbons, torn clouds | transparent WebP cut-outs, CSS transforms | scroll (parallax), idle breathing |
| Mid objects | the 13 category objects | transparent cut-outs, hover micro-animations via Lottie/Rive or CSS | scroll, cursor lean, hover/tap |
| Hero object | the jelly blob (sun) | **sprite sequence** (about 90 frames, WebP atlas) scrubbed by scroll | scroll progress |
| Ink and paint | splats, brush strokes, drips | Lottie one-shots, CSS masks | click/tap, scroll reveals |
| Content | headline, copy, calculator controls | real HTML text and controls (style B pieces) | scroll, always readable |

Everything except content is `aria-hidden` and decorative.

## 2. Scroll choreography (chapters)
Reuses the existing GSAP, ScrollTrigger and Lenis setup. One pinned stage; chapters are scroll ranges, not sections that
slide in.
1. **Open:** the headline writes itself in (line by line); the scene is dark with slow stars; the jelly rises. (b-egg, MANET)
   At the very top (000%) the jelly turns backwards by itself; scrolling turns it forwards from wherever it is, and scrolling
   back up reverses it.
2. **Threshold:** scrolling dims the scene to near-black while a calm pair of lines lights up word by word (scroll-scrubbed): a
   familiar saying about money, then an original turn that lands it on pricing. Both lines rest on screen together, then
   dissolve into the black the film fades in from. The pair is one of a hand-matched pool (`src/proto/sayings.js`): random on
   load, and a different one each time you come back to the top after reading. (MANET)
3. **Reveal (decided 2026-10-28, replaces "Pick your craft" in the prototype):** once the message has faded out, the logo blob
   fades in from pure black and bursts into the galaxy as you scroll (scrolling back up plays the burst in reverse). The page
   ends where the burst does; at the very bottom (100%) the galaxy loop plays by itself, so the call to action never sits over
   a still picture. Scrolling up from there fades the film to black, and the scroll takes the frames back. The craft
   constellation (the camera drifts across the objects; hovering or tapping one lifts and animates it and sets the craft,
   Choo-Choo World hover feel) returns later as its own chapter.
4. **Say who it's for / usage:** pieces rearrange in place into the next set of controls (style B pieces); the jelly morphs
   through its sprite frames.
5. **Three prices:** three paper tiers unfold; the price counts up in large serif; numbers never sit on busy art
   (a soft paper patch behind digits if needed).
6. **Invoice:** a paper invoice folds out; the pay-link button is a stamp.
7. **Plans, then sign-up:** the camera settles; the jelly becomes the call-to-action.

The knock-out headline (b-egg): big type uses `mask-image`/`background-clip: text` so the paper art shows through the
letters as you scroll; a drip layer rises and tucks part of the title behind it.

## 3. Interaction layer
- **Cursor and touch:** rAF-throttled pointer parallax (pieces lean 2 to 6 degrees); touch uses gentle device tilt only if
  permitted, otherwise drag-parallax.
- **Click and tap:** ink splat or stamp (Lottie one-shot, 300 to 600 ms) at the pointer; optional paper/ink sounds behind
  the existing mute toggle.
- **Idle life:** slow drifting and breathing on far layers via CSS transforms; paused when the tab is hidden or off-screen.

### Leaving the landing: the dive into the orb (prototype, 2026-10-30)
"Start pricing" does not just navigate. In `src/proto/Scrapbook.jsx` the click plays the **dive** (`dive-seq`, 120 frames, a Kling 4.0 image-to-video clip
whose first frame is the galaxy picture). It plays **full screen and at the speed it was made at** (`DIVE_FPS` 24, 4.96 s): the camera falls into the blob
while the paper objects fly past, until the light is the whole picture. (A first version played it in the film's dark, vignetted 16:9 box and 30% faster, and
the owner "hardly saw the animation".) Pieces that fit together:
- **Placement** (`place()` in Scrapbook.jsx): the 1280x720 picture (`.sb-dive-pic`) starts exactly where the film's box is, so the film is replaced without a
  seam, then opens out over `OPEN_SECS` (0.9 s) until it fills the screen whatever its shape. When it has to be cropped (a phone held upright, 26% of the
  width shows) the crop follows the blob (`TRACK`, measured from the frames), so the blob stays in the middle. A soft dark rim (`.sb-dive-edge`) hides the
  picture's straight edges while it is still smaller than the screen, and fades as it fills it.
- **The end**: for the last `BLOOM_SECS` (0.45 s) the clip's last light is crossfaded into `.sb-bloom`, a full-screen radial glow. The next page (production
  `index.html` + `src/App.jsx`) opens from that same glow with an iris (a radial mask on `html::before`) centred where the light ended (`END`: 0.513, 0.47 of the
  picture, mapped to screen pixels by `place()` and stored in the flag).
- The glow gradient (cream-yellow, peach, pink, measured from the clip's last frame) exists in two places and must match stop for stop at `--s: 170vmax`:
  `.sb-bloom` in `scrapbook.css` and `html.dmge-arriving::before` in `index.html`.
- Landing to app hand-off is a one-shot `sessionStorage` flag `dmge-arrive` (`{x, y, t}`), read and removed by the inline script in `index.html`; it
  expires after 20 s and is ignored under reduced motion. `App.jsx` adds `dmge-ready` (the iris starts) only after the app's own liquid background has
  painted its first frame, because a heavy first paint eats the run of a main-thread animation. A transform on `#root` was dropped for the same reason
  (it would pin the fixed top bar and dock to `#root`).
- **Loading**: the dive frames load right after the burst and before the galaxy loop, and the first frame is decoded near the bottom of the page. If the button
  is pressed before all of them are in, it waits up to 2.5 s for them (`whenDive`) and then plays the clip; only if they still have not arrived does the older
  plain dive play (film zoom plus a growing bloom, 1.8 s). Reduced motion: the link just navigates, nothing is fetched.
- **Hurrying**: after the first 0.8 s a tap, Escape, Enter or Space plays the rest four times faster (a double-click on the button must not skip it), and a
  second press of the button never starts a second dive.
- Re-making the clip: `node scripts/video-to-frames.mjs <clip>.mp4 src/proto/assets/dive-seq --size 1280x720 --quality 0.7 --rate 0.07`; if the glow's
  colours or the blob's path change, re-measure the frames and update `END`, `TRACK` and both gradients.
- Checked in the in-app browser (1440x900 and a 375x812 phone size): stills through the whole dive, ~54 fps with no gap over 100 ms, the early-press wait, the
  plain-dive fallback, hurrying. Not yet checked: a real phone, a real GPU, and the Back button after the dive (the landing reloads itself if it comes back from
  the page cache). Frames are 1280 px wide, so on a large or high-density screen they are upscaled and soft; 1920 px frames would be about 2.2x the weight.

### The Quote page as the first app screen in the world (2026-11-06)
The app's Quote tab is now a **journey of seven stations** (Craft, Job, Rate, Who, Rights, Extras, Price; six until the Rate step was added, see below) over the same night scene as the landing, in place of the stack of
boxed cards. Nothing about pricing, saving or tiers changed: `src/screens/QuoteJourney.jsx` takes the same `ctx` from `App.jsx` as `CalcScreen.jsx` did and only
decides what is shown when. `?classic=1` still shows the earlier boxed screen (it is the fallback while this is under review).
- **Shared world kit, `src/world/`:** `world.css` (tokens, the stage, the paper-piece controls, the step bar; all scoped to `.qw-stage`, `.qw` and `.qw-bar`, so no other
  screen changes), `Stage.jsx` (sky, pieces, jelly orb), `controls.jsx` (`Chip`, `Group`, `Row`, `Stepper`, `Go`, `Tag`), `framePlayer.js` (moved here from `src/proto`),
  and `assets/` (the landing's sky, pieces and Showtoon font, plus seven jelly poses made as transparent WebP from the landing's jelly turn with `scripts/make-jelly-poses.mjs`, 290 KB in all).
- **The stage is a camera:** each station has a camera position (pan, zoom, spin; `CAMERA` in `Stage.jsx`). Moving between stations tweens it, so every piece slides by a
  different amount (its depth), the jelly crossfades into the next pose, and at the price the cream glow of the arrival returns behind the note. Phones have their own
  piece positions (`ph` on each piece) and keep the top of the screen clear for text. The stage is a portal to `body` and the ambient liquid sits this tab out.
- **Controls are the approved style B** (cream paper pieces with a lip and a soft shadow, a tilt that straightens on hover, filled with a tone and ticked when chosen), the
  toy button is the landing's, and the paper notes (extras, the total) have torn edges and tape. They are ordinary buttons and inputs underneath. Type: Titan One for
  the station titles only, Nunito for labels and buttons, Instrument Serif for numbers.
- **Day mode** is the same world on cream: a pastel wash instead of the starfield, deep-pink accent word, white paper. **Reduced motion:** no floating, no springs, instant
  station changes. **Keyboard:** natural Tab order (controls, then the step rail and Next, then the dock); the station title takes focus on every change and a live region
  says "Step 2 of 7: Job"; the chosen state never relies on colour alone (a tick sits on every chosen piece).
- **Hand-offs that must stay in step:** `App.jsx` waits for `.qw-stage[data-live]` (the first picture is up) before the arrival iris opens, and skips the ambient liquid
  and the old page-enter transform on this screen (a transform on the page would turn the fixed bar into a child of it). `warmAudio()` in `sfx.js` creates the audio context on
  the first tap so the first Calculate does not hitch.
- **Checked** (headless Chrome, scripts kept outside the repo): every craft x every station at 320, 390, 820 and 1280 px wide (no sideways overflow, nothing under the bar),
  the pricing maths through licensing, term, exclusivity, rush and buffer, save to log and back, keyboard order and Enter, reduced motion, the arrival from the landing,
  60 fps through every station change, and a production build. **Not checked:** a real phone and a real GPU.
- **Next for this page:** the 13 craft objects (gem, mask, vinyl, clapperboard, ...) as cut-paper stickers in place of the line icons on the Craft station; they need art
  (see the Higgsfield notes in the memory file: the unlimited allowance is not available through the connected account). Then the same treatment for Jobs, Templates,
  Clients, Insights, Profile, Plans and Tutorial. `PRODUCT.md` still says "Instrument Serif headings"; the Quote page and the other screens use Titan One for titles, so update it once
  that is confirmed.

### The Quote page for almost any creator: Craft search, a Rate step, My crafts (2026-11-06)
The owner wanted "almost any kind of creator" to come here and work out the best rate to charge or get paid. The Craft and Job steps grew, and a new **Rate** step sits between
Job and Who. Pricing itself (`calcPrice`, `buildInvoiceFigures`, tiers, the invoice maths) is untouched: everything new ends in a base rate and a number of units.
- **Data, now 26 fields / 182 roles / 734 pricing models (13 / 61 before this work; 23 / 137 / 537 when this section was first written):** `src/data/` holds `featuredCrafts.js` (the old inline block, same first models), `creatorRoles.js`
  (10 new fields and roles added to three existing ones), `roleKeywords.js` (search words for the existing roles), `wageAnchors.js` (BLS wages) and `allRoles.js` (merges them
  with `src/processed_roles.json`). **Append-only:** saved jobs and templates find a role and model by *name*, so nothing is renamed or removed; the cleanup of the JSON changed
  only `unit` text and `base` values (about 20 models: a talent agent's "commission" was a $50 placeholder, now 10 "% of gross"; three salary models are "per year"). Starter rates
  are labelled starting points. `node scripts/check-roles.mjs` validates names, units, rates and anchors (it warns where a time-based starter is under the BLS employee median);
  `node scripts/check-rates.mjs` checks the rate maths. `docs/starter-rates.md` lists every starting rate for review (316 new, 221 the owner's; regenerate with `--table`).
- **Craft:** a search over every role (name, then keywords, then field; whole-keyword beats a word inside one), Popular, Recent (from saved jobs), browse by field (collapsed on a
  phone), and an inline "My craft isn't listed" note (name, how you charge, usual rate). `src/utils/craftSearch.js`, `src/screens/quote/CraftStation.jsx`.
- **My crafts:** a craft you add is a real role under a "My crafts" field, kept on `profile.customCrafts` (so it syncs with the profile on cloud tiers), and a copy rides inside
  every job and template that uses it (`customCraft`), so those reopen on another device or after the craft is removed. `src/utils/customCrafts.js`.
- **Job:** models grouped by how they charge (time, deliverable, share of a deal), the quantity asked in the unit's words ("How many days?", "How many thousand views?") with a
  sensible start (the old default of 2 hours for everything is gone), and share-of-a-deal models ask "your cut" and "of what amount" and become one flat fee.
- **Rate:** three ways to start, each showing its number: *Typical start* (the model's rate times experience: x0.75, x1, x1.35, x1.8), *From my goal* (your goal hourly rate,
  from your default rate or Rate finder, times the hours one unit takes; an inline note works a goal rate out if you have none) and *My own number*. The base rate is **derived**
  from the form (`rateFor` in `src/utils/rateModels.js`), so choosing a role or model no longer overwrites a rate you chose. Reopened jobs and templates use their saved rate.
- **Quick check (the old "market-range band"):** only for roles with an honest BLS match (about 85): US employee wages for the matching occupation (25th, median, 75th
  percentile, May 2025), what you would bill per hour to take home the same using your own rate-finder settings, where your base rate sits, the source link and "for
  orientation only". Employee wages say nothing about freelance rates by themselves, so the app never presents them as one.
- **Checked** (headless Chrome, scripts kept outside the repo): every role at 320 and 390 px wide with every one of its 537 pricing models on the Job and Rate steps, and the first
  and last models at 820 and 1280 px (1,397 and 733 views): no sideways overflow, nothing under the bar, no console errors. The pricing numbers come out identical through
  licensing, term, exclusivity, rush and buffer; search; 10% of $20,000 is a $2,000 fair price; all three ways to start and every experience level; custom crafts end to end
  (create, quote, save, reopen, restore after removing the craft from the profile); jobs and templates saved before this change reopen on their own numbers; keyboard (Tab order,
  arrows and Enter in the results, Escape, focus after the note opens and closes); reduced motion; 60 fps through every station change; a production build; the design detector
  (advisories only: the approved spring easing and toy-button shadow). **Not checked:** a real phone, a real GPU. **Found on the way:** `calcPrice` never quotes under $50, so a
  tiny job (one $25 sound effect) shows $50; the Price step now says it is the minimum instead of leaving the number unexplained.
- **Open:** the starter rates are judgment calls; skim them. BLS has no entry for several modern roles (UGC, streaming, tattoo), which simply get no check. Phone layout of the new
  steps needs a real phone.

### Choice descriptions, the price ledger, a turning blob, and the other pages (2026-11-07)
- **Descriptions:** every choice on the Quote page says what it means (`src/screens/quote/describe.js`): complexity, client, usage, licence term, exclusivity, experience, the three ways to start, every pricing model (written from its unit, so all 537 have one) and each craft. Pointing at or tabbing to a chip previews its description; the picked one is always shown and read out. `useDescribe`/`Desc` in `src/world/controls.jsx`.
- **Price ledger:** after the price, "How we got your fair price" lists each step from rate x quantity through every multiplier and add-on with a running total, then how Budget (80%) and Premium (130%) come from it. It is built from `buildInvoiceFigures` (the invoice maths) and is hidden rather than shown if it ever disagreed with the price. Small jobs show the $50 minimum.
- **The blob:** one turn and a soft dip in opacity on every move to a new station or page (forward or back); none with reduced motion. `Stage.jsx`.
- **The other pages (Jobs, Templates, Clients, Insights, Profile, Plans, How it works):** same scene, kept logic. The scene now lives in `App.jsx` (one `Stage` for all of them; the camera moves between pages: `PAGE_SCENE`), and `src/world/pages.css` (scoped to `.wp`) dresses what the kit renders: Showtoon titles, cream paper cards with tape, toy buttons, paper filter chips. Inside a card the colour tokens are flipped to the light set at night, so forms and pills keep working; Insights keeps night glass cards because its charts read the theme colours from `:root`. Checked: no sideways overflow at 320 and 820 px on every page, contrast scan clean after fixing placeholders and loose pills, phone and day mode looked at. **Not done:** the invoice editor (a document view), per-page bespoke touches, a real phone.

### Type, proportion, white-label, print jobs, bulk invoices (2026-11-07)
- **Type (all SIL OFL 1.1, self-hosted in `src/world/assets/fonts/` with their licence texts):** Modak for the big titles (the closest open-licence match to the cartoon face first
  used, whose licence was never verified: at x1.22 it has the same letter height and the same width; its files are gone from the repo), Titan One for figures and card headings, Nunito
  for text. `--font-display` and `--font-mono` are overridden only inside the scene (`.qw*`, `.wp`) and the top bar's rate pill, so the DMGE wordmark, the landing, sign-in, invoices and
  PDFs are unchanged. Titles spring in and the glowing word pops then drifts; the blob turns once and dips in opacity on every move; planets and stars each get a random behaviour
  per visit (still, bob, sway, slow spin, wander, spin and wander; the arc and wave never spin; at least one still, three moving). Reduced motion stops all of it.
- **Golden ratio:** `world.css` tokens. Space is Fibonacci (5, 8, 13, 21, 34, 55). Type steps by the 4th root of 1.618 from 16px (12.6, 14.2, 16, 18.1, 20.4, 26 ... titles 68px = 16 x
  1.618^3). The content column is 38.2% of the screen (the scene the other 61.8%), the blob sits at the middle of the scene and the camera may carry it only 3% left (never behind the
  column); on the other screens it is smaller and tucked into the lower right. Body line-height is about 1.6. Repeated text was removed: each choice set had a hint plus the description,
  the craft step said the field twice.
- **White-label (Agency):** `src/utils/brandTheme.js` turns the Branding card's colours into `--brand-*` variables on `<html>` (background -> scene, text -> titles, surface -> paper and
  cards, accent -> the glowing word and primary buttons), checking WCAG contrast and replacing any colour that would not read (the card says so). The brand name and logo replace the DMGE
  wordmark in the top bar and the browser tab. `brandProfile` (App.jsx) blanks the branding for plans that are not Agency, and is what invoices, PDFs and emails use. The invoice sheet no
  longer carries DMGE's own addresses as defaults, and an Agency invoice has no "Made with DMGE" line. The old `--pixel-*` colour variables nothing read are gone.
- **Jobs:** a Graphic Design & Visual Communication field (20 roles: logo, brand guidelines, art and creative director, editorial layout, book covers, social graphics, thumbnails, posters,
  infographics, ad creative, signage, exhibits, motion, icons and merch, patterns, stationery, menus, mascots, prepress), seven advertising roles in Marketing & Advertising (media buying, ad
  copy, funnel copy, naming, video ads, customer research, account management), and a Print Services field (flyer printing, poster printing, art print seller, flyer and poster distribution).
- **Sizes:** a model can carry `sizes` (`src/data/printSizes.js`): its rate is for the base size (A4 / Letter flyer, 18 x 24 in poster) and a larger or smaller size scales it, in every way
  of starting. The multiplier lives in `rateFor` (the price engine is untouched), is saved on the job as `sizeMult`, so a job reopens on the same rate, and shows as its own ledger step and
  on the invoice line. `qty` sets how many a quote starts with (250 flyers). The designer's poster and flyer models gained sizes at their old rate (the base size).
- **Send several invoices (Jobs):** "Send several" ticks unpaid jobs, "Review & send" lists who gets what (clients without an email are held back with the reason), and sends them one after
  another with progress, Stop, and Try again for failures. Each invoice is the same PDF, subject and function as a single send, marks the job Sent, and counts against the plan's daily PDF
  allowance (up to 25 a run). `src/screens/history/BulkSend.jsx`, `bulkInvoices.js`. In the dev mock session nothing is ever emailed.
- **Fixed on the way:** the page-enter animation left a transform on the page after it played, which turned every `position: fixed` thing inside a screen into a page-sized box (a dialog
  opened from Jobs landed off screen); it now leaves nothing behind (`styles/kit.css`).
- **Final pass, found on phone and light renders and with real pointer input:** a mouse click on a dock item left it focused and the dock never tucked away again (only keyboard focus,
  `:focus-visible`, holds it open now); dialogs opened inside a page were under the fixed top bar and dock (they hide while any dialog is open, `styles/base.css`), and the send-several
  dialog keeps its Send bar in view on phones and short screens; the check badge on a selected chip covered the last letter of long labels (moved out, chips padded, and the stress run now
  measures badge-to-text clearance on every role and model); on phones the blob sat behind the end of titles (now tucked into the top corner and measured clear of every title on every step
  and page at 320 to 430 px wide). The design detector reports advisory notes only across eight pages, two themes and two viewport sizes. A stress run over every role and pricing model at
  320 and 390 px (and the first and last model of each role at 390, 820 and 1280) found two more: the three price tiles side by side left about 70 px per figure on a phone, so a price over
  $999 ran off the screen (now full-width rows, and long figures scale down, tested from $196 to $2.4 million at seven widths), and a long field name crowded the check badge at 320 px (one
  column of fields below 360 px). The price ledger now ends on the same whole-dollar figure as the tiles and says so when it rounded cents.

## 4. Asset pipeline
1. **Generate** pieces in Higgsfield (GPT Image 2.5 sunburst xhigh 4K, explicit aspect ratios), one object per image on a
   plain contrasting background for clean cut-outs.
2. **Cut out:** background removal, trim, add paper-edge alpha; export WebP/AVIF at 1x and 2x.
3. **Frame sequences (as built in the prototype):** each clip is turned into numbered WebP frames with
   `scripts/video-to-frames.mjs` (no ffmpeg needed; it bakes in a soft glow so edges are never harsh). The scroll timeline
   scrubs them on a canvas (`src/world/framePlayer.js`, shared with the app): compressed frames stay in memory, only about 15 around the playhead
   are decoded, so memory stays small however long a clip is. Swap a clip by re-running the script (its header lists the
   exact commands).
4. **Vector bits:** ink splats and stamps authored as Lottie (or Rive for interactive state machines like hover).
5. **Texture kit:** 4 to 6 seamless paper and torn-edge textures; reuse everywhere to stay light.
6. **Day version:** same layers, recoloured by regenerating the background layers on cream paper (the objects can be shared).

Budget estimate: 13 objects at 7 credits, about 8 environment pieces at 7, 1 hero clip at 5 plus retakes: roughly
150 to 250 credits (you have about 491).

## 5. Performance and fallbacks ("same experience everywhere")
- Frame budget: 60 fps target on mid phones; one `requestAnimationFrame` loop owns all motion; no live shader for
  decoration (the current WebGL liquid is retired from the landing).
- Weight: first view under about 1.5 MB, the rest lazy-loaded per chapter; AVIF/WebP atlases; Lottie JSON under 100 KB each.
- Adaptive: measure frame time; if it drops, simplify effects only (drop idle loops, reduce sprite frame rate, skip
  parallax); layout, copy and numbers are identical.
- **Reduced motion:** a still, composed collage (a poster of the scene) with simple fades; scroll scrubbing off.
- **Accessibility:** all text and controls are real HTML; decorative art is `aria-hidden`; keyboard order and focus rings
  for every piece; sufficient contrast checked on night and day.
- Test on a low-end Android and an older iPhone before calling it done.

## 6. Milestones
1. **Prototype (about 3 sessions):** open + threshold + jelly sprite scrub + 4 objects with hover, on one machine, to
   judge smoothness and look. Decision gate.
2. **Full landing:** all chapters, cursor/click layer, sound, day/night, reduced-motion poster, performance pass.
3. **Calculator journey:** the Everswap-style camera path through the quote stations, style B controls.
4. **App shell and data screens:** transitions between pages (camera pans plus morphs), then Jobs, Clients and so on.

## 7. Risks
- Many layers and large images can still stutter on weak phones: mitigate with the budgets above and early device tests.
- AI-generated cut-outs need cleanup (edges, consistent light direction): plan a review pass.
- "Same experience everywhere" is bounded by what mid-range phones can render at 60 fps; effects will simplify there.
- The pay-link and other app work is paused while the landing is built; the redesign branch stack stays unmerged.

## 8. What I need from you
- A go for the Milestone 1 prototype (and about 100 credits for its assets).
- Which 4 objects to feature first (suggested: clapperboard, vinyl, paint tube and brush, gem).
- Any further references, especially cut-paper textures.

### Type and marketing jobs (2026-11-07)
- **Fonts, both licensed (SIL Open Font License 1.1), self-hosted in `src/world/assets/fonts/` with their licence texts:** Titan One for titles (it replaced Showtoon, whose licence was never confirmed; the closest licensed match to its weight and rounded shapes, not identical) and Nunito as the app's body font (`--font-body` in `src/styles/tokens.css`; the invoice sheet and the PDF stay on DM Sans so the preview matches the PDF). Showtoon files are deleted from the working tree; they remain in git history. Titles now spring in and the glowing word pops and drifts slightly (CSS, off with reduced motion).
- **Marketing And Advertising (new field, 14 roles):** strategist, fractional CMO, brand strategist, SEO, paid ads (fee as a share of ad spend), email, content, influencer, PR, growth/CRO, analytics, automation/CRM, product marketing and affiliate. Starting rates are judgment calls like the others (see `docs/starter-rates.md`); nine have a BLS Quick check (Market Research Analysts and Marketing Specialists, or Marketing Managers for the CMO). The landing's "roles · fields" line now counts the real data.
