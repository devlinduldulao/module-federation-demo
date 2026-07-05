# Live Demo Rehearsal Script

> Practice this until the clicks are muscle memory and the lines feel like your own words.
> The goal: never *search* for a button while the audience watches. You always know the next beat.

**How to use this file — the 3-pass method:**

| Pass | What to practice | Success criteria |
|------|-----------------|------------------|
| **Pass 1 — Clicks only** | Walk every ACTION below in order, silently. No talking. | You never hesitate about where to click next |
| **Pass 2 — Clicks + talking** | Same walk, speaking every SAY line out loud. | Lines feel natural; you paraphrase without losing the point |
| **Pass 3 — Full timed run** | Slides + demo, phone timer running, standing up. | You land within ±1 min of each checkpoint |

Repeat Pass 3 at least three times on different days. Then do the **failure drills** (bottom) twice — recovering smoothly from a broken demo is what makes you look like an expert, not the happy path.

---

## 0 · Pre-flight checklist (T-30 minutes before the talk)

- [ ] `pnpm run kill:ports` — clear stale dev servers
- [ ] `pnpm run dev` — all five servers up; verify each in the terminal output
- [ ] Open `http://localhost:3000` — Home renders, status strip shows **INSTANT**
- [ ] ⚠️ **Streaming delays:** `StreamingPrescriptionOrders.tsx` and `StreamingClinicalAnalytics.tsx` currently use `getResource(…, 0)` — **zero delay means no visible skeleton on stage.** For the talk, set prescriptions to `2500` and analytics to `4000` so the audience actually sees the skeletons stream in. Records is already `2500`.
- [ ] Verify **⌘K** opens the command palette (code accepts both Ctrl+K and ⌘K)
- [ ] Open the **Lab** once — all four health dots green
- [ ] DevTools docked to the side, Network tab pre-selected, throttling **off**
- [ ] Editor: pre-open these tabs in order (you will walk them left to right):
  1. `packages/records/src/index.tsx`
  2. `packages/records/src/bootstrap.tsx`
  3. `packages/records/rspack.config.ts`
  4. `packages/shell/src/App.tsx`
  5. `packages/prescriptions/src/StreamingPrescriptionOrders.tsx`
  6. `packages/records/src/types.ts`
  7. `.github/workflows/ci-records.yml`
- [ ] Second terminal ready at repo root for `pnpm test` and the real server-kill drill
- [ ] Font size: editor ≥ 18pt, terminal ≥ 16pt, browser zoom 125%
- [ ] Do Not Disturb ON, notifications OFF, dock hidden
- [ ] Screenshots folder open in Finder (the wifi-fails fallback)

---

## 1 · Timing map (30-minute talk)

```
 0:00 ─ Slides 1–3    Title · Problem · Two Pillars            (5 min)
 5:00 ─ Slides 4–6    Architecture · Stack · MF Config         (5 min)
10:00 ─ DEMO Part A   Loading strategies + events              (3 min)
13:00 ─ DEMO Part B   Federation Lab: kill + A/B + theme       (4 min)
17:00 ─ DEMO Part C   Code walkthrough                         (4 min)
21:00 ─ DEMO Part D   Tests + CI                               (2 min)
23:00 ─ Slides 17–19  Takeaways · When to apply · Thanks       (4 min)
27:00 ─ Q&A buffer                                             (3 min)
```

**Checkpoint rule:** glance at the clock when you switch apps. If you're >1 min behind at 17:00, cut Part C to just the resource pattern + App.tsx. Never cut Part B — the kill switch is the money shot.

---

## 2 · DEMO Part A — Loading strategies + cross-module events (10:00–13:00)

### Beat A1 — Instant (Home)

- **ACTION:** Switch from slides to browser, already at `localhost:3000`.
- **SAY:** *"This is the shell — and everything you see is four separate React apps composed at runtime. Watch the status strip: Home says INSTANT. It rendered the moment its chunk arrived — no artificial delay, no skeleton."*
- **WATCH FOR:** green dot + INSTANT in the status strip. Point at it physically.

### Beat A2 — Eager (Records)

- **ACTION:** Click **Records** tab.
- **SAY:** *"Records appears immediately too — but for a different reason. It was preloaded the moment the shell mounted. By the time I clicked, the chunk was already in the browser cache. Status strip says EAGER."*
- **PAUSE BEAT:** let the instant render sink in — the *absence* of a skeleton is the demo here.

### Beat A3 — Streamed (Prescriptions, then Analytics)

- **ACTION:** Click **Prescriptions** tab. Don't talk over the skeleton — let it play.
- **SAY (as skeleton shows):** *"And this is the third strategy. Prescriptions loads on demand — the skeleton renders instantly, content streams in when the remote resolves. The shell doesn't know or care how long this takes. It rendered a Suspense boundary and moved on."*
- **ACTION:** Click **Analytics** — second skeleton, same story, no extra words needed.
- **SAY:** *"Three strategies, three content priorities. The landing page is instant, high-value content is eager, secondary content streams. And the part you can't see: each of these is a separate app on a separate dev server, owned by a separate team."*

### Beat A4 — Cross-module event

- **ACTION:** Navigate to **Records** → click **Add →** on *Sarah Chen prescription* → toast appears → navigate to **Prescriptions** → the item is there.
- **SAY:** *"Records just talked to Prescriptions — but Records has never imported a single line from Prescriptions. That was a typed CustomEvent on window. Zero coupling. It survives independent deploys, version mismatches, even a remote being rewritten in another framework."*
- **ACTION:** Remove the items → click **Browse Records →**.
- **SAY:** *"And navigation works the same way — the remote *asked* the shell to navigate. Only the shell owns the router."*

---

## 3 · DEMO Part B — Federation Lab (13:00–17:00)

### Beat B1 — Health monitor

- **ACTION:** Press **⌘K** → type `lab` → Enter. (Keyboard, not mouse — it looks expert.)
- **SAY:** *"This is the Federation Lab. Four remotes, four health dots — each one polls that module's remoteEntry.js every five seconds."*

### Beat B2 — Kill switch 💥 (the money shot)

- **ACTION:** Toggle the **Kill Switch** for Records. Navigate to **Records**.
- **SAY:** *"The Records team just shipped a broken deploy. Their module is down…"*
- **ACTION:** Click **Prescriptions**. Click **Analytics**. Both work.
- **SAY:** *"…and nobody else noticed. This is where DX and UX meet: independent deploys are the DX win — contained failures are the UX win. One ErrorBoundary per module, a `.catch()` on every lazy import. Just like a microservice going down."*
- **ANTICIPATE (someone will ask "so it's microservices?"):** *"Yes — for the 99% case. Crashes, network failures, bad deploys: fully contained. The 1% gap: all modules share one browser tab, so a true infinite loop freezes everything. That's the cost of a shared runtime, and virtually every MF architecture accepts it."*
- **ACTION:** **Restore All** in the Lab.

### Beat B3 — A/B deployment

- **ACTION:** In the Lab, toggle **Stable → Canary**.
- **SAY:** *"Each remote can run a different version. In production, this toggle is a routing decision on remoteEntry URLs — canary one team's module while everything else stays stable."*
- **ACTION:** Toggle back to Stable. Close the Lab.

### Beat B4 — Theme (30 seconds, keep it brisk)

- **ACTION:** ⌘K → type `light` → Enter. Then ⌘K → `dark` → Enter.
- **SAY:** *"One more cross-cutting concern: theming. The shell rewrites CSS variables, persists to localStorage, broadcasts a typed event — every remote reacts with zero shared imports."*
- **OPTIONAL (if ahead of schedule):** refresh the page to show persistence.

---

## 4 · DEMO Part C — Code walkthrough (17:00–21:00)

Walk your pre-opened editor tabs **left to right**. Never use the file explorer live.

### Beat C1 — `index.tsx` + `bootstrap.tsx` (tabs 1–2)

- **SAY:** *"The entire entry file of every module is one line: `import('./bootstrap')`. That dynamic import is an async boundary — Module Federation needs it to negotiate the shared React copy before any React code runs. Remove it and you get a white screen and a loadShareSync error."*

### Beat C2 — `records/rspack.config.ts` (tab 3)

- **ACTION:** Scroll slowly through the config once.
- **SAY:** *"Everything here is a normal Rspack config — entry, rules, dev server. The ONE thing that makes this a micro-frontend is the ModuleFederationPlugin. `exposes` is the team's public API. `shared` with `singleton: true` means one React for everyone — remove that and hooks break."*
- **BONUS (if asked about the build):** *"Rspack 2.1, with the Rust port of React Compiler enabled in the SWC loader and persistent caching — sub-second HMR across five apps."*

### Beat C3 — `shell/src/App.tsx` (tab 4)

- **SAY:** *"The host mirror: `remotes` maps a scope to a remoteEntry URL, resolved at runtime. And here are the three strategies as data — `loadStrategy: instant | eager | streamed` — plus three layers of resilience: `.catch()` on the import, Suspense for the skeleton, ErrorBoundary for runtime errors."*
- **ANTICIPATE ("why lazy() if it's eager?"):** *"Because a remote is a separate build on a separate server — a static import can't exist at build time. The eager `import()` fires at shell init to warm the cache; `lazy()` resolves from that cache instantly. There's a test that proves Records renders with no skeleton."*

### Beat C4 — `StreamingPrescriptionOrders.tsx` (tab 5)

- **SAY:** *"The entire streaming pattern is ~40 lines. `read()` throws the promise while pending — Suspense catches it. The wrapper's only job is to trigger Suspense; the real UI lives in the standalone component. In React 19 you could swap this for the `use()` hook — same architecture."*

### Beat C5 — `types.ts` (tab 6, 20 seconds)

- **SAY:** *"The event contract: augment `WindowEventMap` and every `addEventListener` is fully typed. No shared npm package needed."*

---

## 5 · DEMO Part D — Tests + CI (21:00–23:00)

### Beat D1 — Tests

- **ACTION:** Second terminal → `pnpm test` (starts while you talk).
- **SAY:** *"Every module is tested in isolation — no dev servers running. The trick is a Vitest alias that resolves federated imports like `records/MedicalRecords` to the source file."*
- **WATCH FOR:** `210 passed (210)` — point at it: *"210 tests, 21 files, all green."*

### Beat D2 — CI (tab 7)

- **ACTION:** Show `ci-records.yml`, highlight the `paths:` filter.
- **SAY:** *"One workflow per module. When the Records team pushes, only Records CI runs. One big workflow that rebuilds everything on every push couples your deploys — and defeats the entire point of micro-frontends."*

**TRANSITION back to slides:** *"So what should you remember tomorrow morning?"* → Takeaways slide.

---

## 6 · Q&A drills — rehearse these answers out loud

| Question you WILL get | Your rehearsed answer (short form) |
|---|---|
| "Doesn't React 19 break Suspense for MF?" | "Only if siblings share a boundary. We're route-based — one module, one boundary, no waterfall. React 19 actually helps: Suspense batching + the compiler." |
| "Why not iframes for real isolation?" | "Iframes give you OS-level isolation but break shared context, theming, and routing. The ErrorBoundary model covers 99% of failures at a fraction of the cost." |
| "Why CustomEvents and not a shared store?" | "A shared store is a shared dependency — version coupling between teams. Events survive independent deploys and even framework diversity." |
| "How do you keep UI consistent across teams?" | "The shell owns design tokens as CSS variables; remotes inherit. Theme changes broadcast as events — no shared component library required to start." |
| "What about shared dependency version conflicts?" | "`shared` with `singleton: true` negotiates one React at runtime; `requiredVersion` warns on mismatch. Teams can still pin everything non-shared independently." |
| "Is Module Federation production-ready?" | "It runs healthcare platforms, SaaS dashboards, enterprise portals today. Rspack ships it natively, and the runtime is a stable, separate package." |

---

## 7 · Failure recovery drills (practice each TWICE)

**Drill 1 — A dev server dies mid-demo.**
Simulate: Ctrl+C the records process during Pass 3.
Recovery: *stay calm, this IS the demo.* Say: *"Perfect — unplanned fault isolation."* Show the ModuleFallback, show other modules working, then restart the server and click Retry. You just turned a failure into the strongest moment of the talk.

**Drill 2 — Ports busy at start.**
Recovery: `pnpm run kill:ports` then `pnpm run dev`. Rehearse typing it without looking it up.

**Drill 3 — Wifi/localhost totally broken.**
Recovery: screenshots folder (pre-flight item). Narrate the flow over static images — you rehearsed the SAY lines, they work without the live app.

**Drill 4 — You blank on a line.**
Recovery rule: describe what the audience can SEE ("status strip says EAGER — preloaded at mount"). The UI is your teleprompter; every label on screen is a cue.

---

## 8 · Practice log

| # | Date | Pass type | Time at 17:00 checkpoint | Total time | Stumbles (what/where) |
|---|------|-----------|--------------------------|-----------|------------------------|
| 1 |      | Clicks    |                          |           |                        |
| 2 |      | Clicks+talk |                        |           |                        |
| 3 |      | Full timed |                         |           |                        |
| 4 |      | Full timed |                         |           |                        |
| 5 |      | Failure drills |                     |           |                        |

**You're ready when:** two consecutive full runs land 23:00 ±1 min, and Drill 1 feels *fun* instead of scary.
