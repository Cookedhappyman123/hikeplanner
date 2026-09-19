# Hike Planner — Phase 2 (real source files)

This is the Phase 2 port of the Phase 1 mock-data prototype (five artifacts, hopping between separately-hosted pages via an encoded URL) into one real, buildable Vite + React app. Same five screens, same visual design, same mock data and computations — now sharing state directly in-app instead of round-tripping it through URL fragments.

## Running it

Requires Node 18+.

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

Other scripts:

```bash
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

> **Note on how this was built:** this project was hand-written in a cloud sandbox whose network policy blocks `registry.npmjs.org`, so `npm install` could not be run there. Every file was written by hand and syntax-checked with a locally-cached copy of esbuild (bundled cleanly, zero errors), but `npm install` / `npm run dev` / `npm run build` have not actually been executed end-to-end anywhere yet. Please run `npm install && npm run dev` as your first step and report back anything that doesn't come up cleanly — this is the first real chance to catch anything a bundler-only check couldn't.

## Screens & routes

| Route | Screen | Was artifact # |
|---|---|---|
| `/` | Trip setup | 1 |
| `/trip` | Trip overview / day list | 2 |
| `/trip/day/:dayIndex` | Day view | 3 |
| `/trip/day/:dayIndex/accommodation` | Accommodation entry | 4 |
| `/trip/review` | Trip review | 5 |

Routing uses `HashRouter` (URLs look like `/#/trip/day/0`) so this works unmodified on a static host with no server-side rewrite rules — GitHub Pages in particular. Switch to `BrowserRouter` later if you deploy somewhere with SPA-fallback configured (Netlify/Vercel both support it).

## Project layout

```
src/
  lib/hikePlanner.js       mock data + pure functions (Naismith formula, daylight-status
                            logic, leg-duration tables, trip/day generators) — no React,
                            no side effects, unit-testable as-is
  state/TripContext.jsx    the one shared trip object, persisted to localStorage
  screens/                 one component per screen, ported ~1:1 from the artifacts
  styles/global.css        the whole design system (tokens, dark mode, every
                            component class) — one stylesheet, no CSS modules
  App.jsx                  route table
  main.jsx                 entry point: HashRouter + TripProvider + App
```

## What changed vs. the Phase 1 artifacts (and why)

- **State passing.** The prototype encoded the trip object as base64 JSON in the URL hash to hand it from one separately-published artifact to the next (`shared.js`'s `encodeState`/`decodeState`/`buildLink`). That trick is gone — it only existed because each artifact was its own origin with no shared backend. Now all five screens are routes in one app, so trip state just lives in `TripContext` (React context + `useState`, persisted to `localStorage` so a refresh doesn't lose it). Navigation between screens is now a plain `<Link to="...">` — no state, no encoding.
- **Day view's toggles now persist.** In the prototype, changing a day's transport mode/direction/start time was local to that screen and lost the moment you navigated away (noted as a known limitation in the Phase 1 write-up). Since there's a real shared store now, `DayView` writes every toggle straight back into `TripContext` via `updateDay()`, so it sticks.
- **`shared.js` → `lib/hikePlanner.js`.** Same functions and mock dataset, minus the URL-encoding helpers that no longer apply, converted to ES module exports. `buildTrip()` (trip-setup's "what to generate" logic) and `genericDays()` moved here from the setup screen's own script, since they're pure data-generation logic, not UI.
- **One shared stylesheet instead of five near-duplicates.** The prototype's five HTML files each carried their own copy of the same `:root` tokens and component CSS (with small drift risk between copies, which is exactly what caused a bug during Phase 1 — see the project doc). Now it's `src/styles/global.css`, imported once.

Nothing about what the screens *look like* or *do* changed — the goal was porting behavior unchanged, not redesigning.

## Known limitations carried over from Phase 1

These are pre-existing, not introduced by the port — see `phase-1-prototype.md` in the project for the full list:

- Accommodation's "booking link" mode is a stand-in (stores the URL, shows the domain) — Phase 4 replaces it with a real affiliate-API lookup.
- Region search on the setup screen is free text only — Phase 3 wires it to OS Names.
- Sunrise/sunset are hardcoded November constants — Phase 3 replaces them with a real sunrise-sunset.org lookup.
- Hike distance/ascent/descent are still hand-entered mock numbers — Phase 3 replaces them with parsed GPX data.
- "← Trip setup" from the overview starts a fresh form rather than pre-filling the current trip for editing.

## Next: Phase 3

Per the plan, Phase 3 replaces one mock data source at a time with the real thing (OS Data Hub, GPX import, Google Routes/Geocoding, sunrise-sunset.org), each isolated behind `lib/hikePlanner.js`'s existing function signatures where possible so the screens themselves shouldn't need to change much.
