# DMGE app redesign: guide for restyling a screen

Identity "Sorbet Ink": pastel candy-marbled liquid on warm cream (day) / black starfield (night). Editorial and calm,
never retro/pixel. This guide is the contract for rebuilding any in-app screen.

## How screens are wired
- `src/App.jsx` holds all state and handlers. Each tab is a file in `src/screens/*` that receives ONE prop,
  `ctx` (a bag of everything it needs: state, setters, handlers, helpers). Pull what you need with
  `const { jobs, setTab, ... } = ctx;`. **Do not edit `App.jsx`.** If you need a value that is not in `ctx`, tell the
  main session in your final report (do not work around it by editing App.jsx).
- The shell (top bar, floating dock, ambient liquid behind the page, page enter animation) is already built
  (`src/app/*`). Your screen renders inside it.
- Screens currently wrap their old markup in `<div className="legacy-page">`. Replace that wrapper with the kit's
  `<Screen>` (it provides the correct top/bottom padding for the fixed top bar and the dock). Keep ALL behavior:
  every handler, every state change, every tier/limit check, every `setTab`/modal call must keep working.

## Building blocks (use these first)
- `src/components/kit.jsx`: `Screen`, `Card` (tones: paper, glass, pink, blue, mint, butter, lilac), `SectionTitle`,
  `Stat`, `Pill`, `Field`, `EmptyState`, `Segmented`, `Row`, `IconBtn`, `Grid`. Styles in `src/styles/kit.css`.
- `src/components/ui.jsx`: `PBtn`, `PBox`, `PInput`, `PStepper`, `PSelect`, `PCollapsible`, `PModal`, `PLbl`,
  `MatChip`, `OptionGrid` (same props as before; already restyled).
- `src/icons.jsx`: line icons (`IconCalc`, `IconJobs`, `IconClients`, `IconPlus`, `IconSearch`, `IconSend`,
  `IconDownload`, `IconEdit`, `IconDelete`, `IconCheck`, `IconLock`, ...). `size` and `color` props; color defaults to
  `currentColor`.
- Pastel button colors: `PBtn color="var(--butter)" | "var(--pink)" | "var(--blue)" | "var(--mint)" | "var(--lilac)" | "var(--paper)"`.
  Add `className="lq-btn--neutral"` for paper-filled buttons (dark text in both themes).

## Rules
1. **Tokens, no hex.** Use CSS variables from `src/styles/tokens.css` (`--ink`, `--ink-2`, `--paper`, `--cream`,
   `--pink`, `--pink-deep`, `--blue`, ... `--line`, `--on-fill`, `--glass`). They flip automatically for night mode.
   Colored TEXT uses the `-deep` variants. Text that sits ON a pastel fill uses `--on-fill`.
2. **Type.** Headings: `var(--font-display)` (Instrument Serif, weight 400, with an italic `<em>` accent word).
   Body/UI: `var(--font-body)` (DM Sans). Numbers and money: serif (`font-variant-numeric: lining-nums tabular-nums`)
   or `var(--font-mono)` for dense tables. Never use `Press Start 2P`.
3. **Units.** Use `px` and `clamp()`. NEVER `rem`: the legacy global root font-size is ~8-14px and will shrink it.
4. **Responsive.** Must work from 375px to 1440px: single column on phones, cards reflow with `Grid`/flex-wrap, tap
   targets at least 44px, no horizontal page scroll. Content must clear the fixed top bar (about 64px) and the dock
   (about 90px); `Screen` already does.
5. **Dark mode.** Check every screen in both themes. Contrast WCAG AA. No white/black literals.
6. **A11y.** Real `<button>`/`<label>`, visible focus (global `:focus-visible` already), `aria-label` on icon-only
   buttons, `role="alert"`/`status` for messages, no color-only meaning.
7. **Motion.** Subtle and fast (200-400ms, `var(--ease-out)`), always respect `prefers-reduced-motion`.
8. **Copy.** Plain, friendly sentence case. Replace arcade shouting ("INSERT COIN", "PLAYER1", ALL CAPS abbreviations
   like JBS/TMP/CLI) with real words. Keep every functional label users rely on.
9. **Files.** Put new components/CSS next to your screen (e.g. `src/screens/history/*`, `src/screens/history.css`).
   Do NOT edit shared files: `src/App.jsx`, `src/components/ui.jsx`, `src/components/kit.jsx`, `src/icons.jsx`,
   `src/styles/*`, `src/landing/*`, `src/app/*`. If a shared primitive is missing something, build a local variant.
   Do not commit, switch branches, or push.

## Testing without a login (dev-only mock session)
`src/dev/mock.js` fakes a logged-in user and seeds sample jobs, clients and templates (localStorage only; dead code in
production). With the dev server running (default `http://localhost:5173`; if it is not reachable, start one on a free
port with `node node_modules/vite/bin/vite.js --port 5180` in the background):

- `/?mock=1&tab=history&tier=agency&theme=light`   (`tab`: calc, history, templates, clients, analytics, profile,
  tutorial, pricing; `tier`: free | pro | agency; `theme`: light | dark)
- `/?mock=empty&tab=clients` shows empty states; `/?mock=reset` re-seeds the sample data.
- The invoice editor opens from a job in Jobs (the "invoice" action on a job card).
- Verify at 375px and 1440px wide, light and dark. In the Browser pane, wait ~3 seconds after load (the liquid and
  page animations). Headless fallback for screenshots: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --window-size=1440,900
  --run-all-compositor-stages-before-draw --timeout=30000 --screenshot=out.png "http://localhost:5173/?mock=1&tab=history"`.
- Run builds into a scratch folder so parallel sessions do not clobber each other:
  `npx vite build --outDir <scratchpad>/dist-<name> --emptyOutDir`.
- Exercise real flows (add/edit/delete, filters, modals, validation, empty and locked states) and check the console
  for errors. Never type real credentials anywhere.
