# DMGE vision: the Scrapbook World

Captured from the owner's answers, 2026-10-25. This is the brief for the visual revamp that follows the current
"Sorbet Ink" redesign. Where the owner's words are known they are quoted; anything I inferred is marked *(inferred)*.

## One-line summary
A single, continuous, hand-made world, a giant sketchbook / scrapbook mixed with an abstract collage space, led by
**cut paper and collage** with ink and paint on top. You travel through it as you scroll. Content lives *inside* the
scene, not in boxes that get pushed or swiped out of the way. It is playful, very artsy, and also *collected*: a
collection of objects, each piece distinct. The experience must be smooth and seamless everywhere.

## What changes and what stays
| Stays | Changes |
|---|---|
| Quote, three tiers, invoice (the familiar functionality order) | Boxed cards as the layout unit |
| Sorbet Ink pastels (pink, blue, mint, butter on warm cream) | Cards sliding in and out as page transitions |
| Instrument Serif / DM Sans / DM Mono *(inferred, unchanged)* | A live GPU shader doing all the decorative work |
| Starfield night mode | Forms and controls styled as generic boxes |
| The jelly logo mark | |

## Art direction
- **Lead style:** cut paper and collage (torn, layered, tactile shapes), with ink, brush and splatter as an accent
  layer. *Not* a pure watercolor or pure brush look.
- **Vibe reference:** experimental portfolio sites (large type, scroll-driven scenes, surprising interactions).
  Specific links still to come.
- **"Collected":** a collection of objects. Each piece is distinct and gathered like items on a shelf or in a
  scrapbook, held together by consistent rules so it never feels random *(inferred)*.
- **Palette:** keep Sorbet Ink pastels.
- **Night mode:** keep the starfield (black space), with the cut-paper pieces glowing against it *(inferred)*.

## The world
- One continuous scene: a scrapbook that is also an abstract collage space. Pages, stickers, tape, torn edges and
  doodles blend with floating cut shapes and brush marks.
- No literal "location"; the scene is a space you move through, with regions that become the site's pages.

## Layout: no boxes
- Content sits **directly in the scene**: type and controls on the art, no card containers by default.
- Page structure is spatial: each screen is a region of one big canvas, not a separate card stack.
- Data-heavy screens (jobs, charts, invoice, forms) get the same treatment. **Art is free; we verify contrast** and fix
  problems rather than pre-limiting the art.

## Navigation and transitions
- A **mix of camera pans across the collage and pieces that morph and rearrange in place**.
- Nothing "leaves" and re-enters as a panel; shapes reshape into the next page, and the camera moves between regions.
- The dock and top bar persist; the world moves behind them *(inferred)*.

## Motion system
All four triggers are wanted:
1. **Scroll:** moves you through the scene and transforms elements in place.
2. **Cursor and touch:** pieces lean, ink follows the pointer, things react to movement.
3. **Click / tap feedback:** splats, stamps and paper flips on actions.
4. **Idle ambient life:** things breathe and drift slowly when nothing is happening.

## Controls (open)
The owner wants to **see options first** before choosing how inputs and buttons look. Mockups to produce:
(a) hand-drawn underlines and tags, (b) paper cut-outs with soft shadows, (c) mostly clean controls with painted
accents. Decision follows the mockups.

## Characters and objects
No mascot. Instead: **hands and tools** (brushes, scissors, glue) that appear to make things as you scroll, and
**little objects that represent each role category**. Approved starting set:

| Category | Object |
|---|---|
| Featured Crafts | gem |
| Performance and Talent | stage mask |
| Music | vinyl record |
| Film and TV | clapperboard |
| Visual and Graphic Arts | paint tube and brush |
| Fashion and Styling | scissors and thread |
| Live Events and Production | spotlight and ticket |
| Writing and Content | pencil and typewriter key |
| Business and Management | stamp and paperclip |
| Tech and Digital | floppy disk and cursor |
| Education and Coaching | book |
| Cosmetology | comb and lipstick |
| Culinary Arts | whisk and chili |

The objects double as navigation cues, for example the category picker in the calculator, and as the "collection"
the world is built from.

## Production pipeline
- **Animation tech:** vector animation (Lottie/Rive) **plus sprite sheets**. No live shader for decoration.
- **Art creation:** I generate the cut-paper and ink pieces with Higgsfield (using your chosen models and always an
  explicit aspect ratio) and animate them in code. The existing logo jelly stays as a hero object.
- **Why:** pre-made frames and vectors play at a steady frame rate on almost any device, which serves the
  "same experience everywhere" requirement.
- Keep a small live layer only for what must react (cursor follow, scroll position).

## Performance and devices
- Target: **the same experience everywhere**, optimised until it holds up rather than splitting into tiers.
- *(inferred)* Budgets to set in the build: first paint under a few seconds on mid-range phones, assets lazy-loaded
  per region, sprite sheets compressed (WebP/AVIF), animation capped to what holds 60fps, and graceful degradation of
  the *effects* (never of the numbers) if frames drop.

## Sound
Silent by default. Optional tactile sounds (paper, ink, stamp) behind the existing mute toggle.

## Scope and phasing
- Scope: **everything, forms included**, eventually.
- **Build order: landing page first.** It is the strongest showcase and sets the rules the rest will follow.
- Later phases *(inferred)*: shell and transitions, then calculator, then the data screens.

## Non-negotiables
- **Numbers always readable:** prices, totals and invoice amounts are never obscured by art or motion.
- **Keyboard and screen-reader support: required** (confirmed 2026-10-25).
- **A calm reduced-motion version: required** (confirmed 2026-10-25), a still or near-still collage.
- **Quote, tiers, invoice flow stays unchanged** (confirmed).

## Decisions since the first draft (2026-10-25)
1. Accessibility and reduced motion: **keep both**.
2. Weak devices: **effects may simplify automatically**; layout, text and numbers never change.
3. The quote, tiers, invoice flow is **unchanged**.

## Still open
4. **References:** five received (above). More welcome, especially anything with cut-paper texture.
5. **Control style:** pick after the three mockups.
6. **Category objects:** the list is approved as a start; flag any to swap.
7. **Landing vs app consistency:** how different the landing may be from the app while the app is still boxed.

## References from the owner (2026-10-27)
| # | Site | What the owner loves | What it means for DMGE |
|---|---|---|---|
| 1 | manet.agency | The hero. Scrolling fades the page to darkness, a message appears as you keep scrolling, then you arrive at the main site. (Seen: a full-bleed painterly film hero with a centered wordmark; on scroll it cuts to black, and statement text lights up word by word as you scroll, then the site proper.) | A **threshold sequence**: light, then dark intermission with a message scrubbed by scroll, then arrival. Good opener for the landing and for first entry into the app. |
| 2 | b-egg.farm | On load the text animates in; scrolling reveals an image **behind cut-out text**. | Headline as a **window**: text knocks out of a layer so art shows through, plus an animated text entrance. |
| 3 | choochooworld.com | Highly interactive: hover over icons and buttons and they do little animations. | **Playful hover micro-animations** on every icon and object, the category objects especially. |
| 4 | client-zero-tech.lusion.co | Loves the scroll transitions, but they are **choppy**. | Same ambition, but **smoothness is the rule**: pre-rendered or sprite motion, capped effects, tested on weak devices. Choppy fails the brief. |
| 5 | everswap.com | The setup is "really accurate" to how the **calculator page** should move, with more animation. (Seen: a painterly 3D mountain scene, a huge thin serif title, "Scroll to start" and a percent counter; scrolling travels the camera up the scene.) | The calculator as a **guided journey through a painted scene**: scroll (or step) moves the camera between stations (work, who it is for, usage, extras, result), with a visible progress indicator. |

Seen in the browser on 2026-10-27:
- **b-egg.farm:** big condensed headline revealed line by line over a photographic hero; a drip-shaped layer rises from
  the bottom and tucks part of the headline behind it; a hand-brushed script line sits on top.
- **choochooworld.com:** a miniature toy world; chunky glossy buttons float directly on the scene with no panels.
- **client-zero-tech.lusion.co:** one persistent glowing 3D object that transforms as you scroll, with glass HUD panels
  and a "01 Intro" section indicator. (It stuttered in a software-rendered browser, which matches your "choppy" note.)

Patterns to carry over: scroll-scrubbed text, camera travel through one scene, a dark intermission, text knock-out
windows, and hover micro-animations. Design rule from #4: never trade smoothness for spectacle.

## Mockups produced (2026-10-27)
- Controls: `docs/mockups/controls.html` (interactive; screenshot `controls.png`). A hand-drawn ink, B cut-paper pieces
  (toy-like, Choo-Choo World feel), C clean with painted accents.
- Landing concept boards (Higgsfield, GPT Image 2.5, 4K, 16:9; 21 credits): A scrapbook desk
  (`landing-board-A-scrapbook-desk.png`), B night collage universe (`landing-board-B-night-collage.png`), C paper
  landscape journey (`landing-board-C-paper-landscape.png`).

## Reference material
Full-page captures of the current site (1440px wide, light and dark), for planning where art and motion go, are in
`docs/page-snapshots/`:
- `app-*`: Quote (empty and with a result), Jobs, Invoice editor, Templates, Clients, Insights, Profile, Tutorial, Plans.
- `landing-*`: each landing chapter (top, pick, context, price, invoice, plans, start) as a 1440x900 still.

## Proposed next steps
1. Confirm the open questions above.
2. Produce 3 control-style mockups and 3 landing "scene" concept boards (Higgsfield, explicit aspect ratios).
3. Pick one, then build the landing as a vertical scroll through the scrapbook world: scene components, sprite and
   vector animation pipeline, scroll choreography, cursor and click feedback, ambient loops.
4. Measure frame rate on a low-end phone before extending to the app.
