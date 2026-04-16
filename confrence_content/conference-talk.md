# From 5 Devs to 200: Micro-Frontends That Scale Your Team and Stream Your UI

## Description

The real bottleneck in frontend development isn't your framework — it's what happens when your team outgrows your architecture. At 5 developers, a monolith is fast and fun. At 50, deploys are blocked by unrelated failures. At 200, nobody understands the full application and onboarding takes months.

This talk tackles **both sides of the micro-frontend equation** through a live-coded healthcare demo built with React 19, Rspack Module Federation, and streaming Suspense:

- **Developer experience (DX):** How Module Federation lets teams own, build, test, and deploy their modules independently — so a broken prescription test never blocks the medical records team, and a new hire ships to production in their first week, not their first quarter.
- **User experience (UX):** How React 19 Suspense with per-module skeleton streaming eliminates the blank-screen problem — users see instant layout feedback the moment they navigate, even when remote chunks are still in flight.

You'll watch a shell host compose four independent React 19 applications into one seamless experience, kill a remote live to prove fault isolation works, and see how `<Suspense>` + `<ErrorBoundary>` is all the shell needs to stay completely ignorant of its children's loading internals. No slides-only architecture diagrams — a running app, a real test suite, and patterns you can ship on Monday.

## Abstract

Every growing frontend team hits the same wall. The product scales, you hire more engineers, and suddenly merge conflicts are daily, CI takes 20 minutes, and "don't merge yet, we're releasing" is a Slack message you read every morning. The architecture that worked at 5 developers is destroying your development culture at 50.

Module Federation solves the DX side: independent builds, independent deploys, independent test suites. Each team owns their module end-to-end. But here's what most micro-frontend talks ignore — **your users don't care about your team structure.** They care that the app feels fast. If navigating between federated modules means a blank screen and a spinner, you've traded DX for UX.

This talk shows you don't have to choose.

Through a production-grade healthcare demo — a shell host composing a landing page, medical records viewer, prescription orders, and clinical analytics dashboard via Rspack Module Federation — we'll build an architecture with **two pillars**:

**Pillar 1 — DX for your team (Module Federation):**
- Five packages, five dev servers, five test suites — zero coupling between them
- Each remote has its own `package.json`, Rspack config, and release cycle
- Cross-module communication through typed DOM events (`addPrescription`, `showNotification`, `themeChange`) — no shared state, no version coupling
- A new developer learns one module and contributes on day one

**Pillar 2 — UX for your users (Suspense + Skeleton Streaming):**
- Each remote owns its loading choreography with the `createResource` / Suspense pattern
- The shell renders `<Suspense fallback={<Skeleton />}>` — no `isLoading` props, no loading spinners passed across module boundaries
- Users see an instant skeleton layout the moment they navigate; content streams in as remote chunks resolve
- Three deliberate loading strategies — **Instant** (Home), **Eager** (Records, preloaded on mount), **Streamed** (Prescriptions, Analytics with progressive rendering)

**Live demos include:**
- A Federation Lab panel that lets you kill and restore individual remotes mid-presentation to prove fault isolation
- ErrorBoundary composition that gracefully degrades one module without taking down the application
- Hover-based prefetching for federated remotes using a simple prefetch map
- A full Vitest test suite running against federated components with mocked remote imports

**Key takeaways:**

1. **Micro-frontends are a team-scaling strategy, not a code-splitting technique.** The architecture should match how your organization works. Small, autonomous teams that own their module end-to-end — from local dev to production deploy — move faster and ship with more confidence than any team fighting over a shared monolith.
2. **Suspense is a micro-frontend primitive.** Each remote owns its loading state. The shell just renders `<Suspense>` — the user sees a skeleton instantly while content streams in. No loading spinners, no `isLoading` props leaking across module boundaries.
3. **Skeleton streaming is the UX answer to independent deployment.** When modules load at different speeds from different servers, per-module skeletons give users immediate layout stability instead of blank screens and jarring layout shifts.
4. **Fault isolation is a feature, not a side effect — and yes, it's like microservices.** With `.catch()` wrappers on lazy imports and ErrorBoundaries per module, one team's broken deploy doesn't take down the entire application. You can prove this works by killing a remote live — and the rest of the app keeps running. The isolation model mirrors microservices: separate boundaries, independent failure handling, graceful degradation. The one difference is that all modules share a browser tab — so a true infinite loop or memory leak freezes everything. That's the inherent cost of a shared runtime, but the 99% case (crashes, network failures, bad deploys) is fully contained.
5. **Events over shared state.** CustomEvents on `window` give you decoupled cross-module communication that survives independent deployments, version mismatches, and team reorganizations.
6. **Per-module CI is the CI/CD best practice for micro-frontends.** Each module should have its own workflow file triggered only when its code changes — mirroring how microservices each have their own pipeline. One big workflow that rebuilds everything on every push is an anti-pattern that couples your deploys and defeats the point of MF.

## Why React 19, Not 18?

React 19 introduced a behavioral change that concerns many developers: sibling components inside the same `<Suspense>` boundary now render sequentially instead of in parallel, creating potential "waterfall" effects. This talk addresses this directly.

**This architecture is immune** because it follows three patterns that eliminate the concern:
1. **Route-based rendering** — only one module renders at a time (no sibling contention)
2. **Separate `<Suspense>` boundaries** — each module has its own boundary (parallel behavior preserved)
3. **Pre-fetching** — eager preload + hover prefetch = chunks cached before render

**React 19 actively benefits the architecture:**
- **Suspense batching (19.2+)** — smoother skeleton → content transitions, no "popping in" effect
- **Compiler optimizations** — shell re-renders (theme, palette, kill switches) skip unchanged paths
- **Render-as-you-fetch alignment** — the `createResource` pattern already hoists data outside components, exactly as React 19 recommends
- **`use()` hook readiness** — the throw-promise pattern still works, and migration to the first-class `use()` API is straightforward

This is a question the audience **will** ask: "Doesn't React 19 break Suspense for micro-frontends?" This talk shows the answer is no — if you design your boundaries correctly.

## Talk Details

- **Format:** 30-minute talk with live demo
- **Level:** Intermediate to Advanced
- **Audience:** React developers evaluating or implementing micro-frontend architectures, teams migrating from monolithic SPAs, and engineers interested in React 19 Suspense patterns beyond basic code splitting
- **Prerequisites:** Familiarity with React lazy/Suspense, basic understanding of module bundlers

## Why This Talk?

Most micro-frontend talks fall into one of two traps. They either focus entirely on the infrastructure — how to wire up Module Federation, how to share dependencies — and leave the audience with a technically correct architecture that delivers a terrible user experience. Or they focus on React patterns in isolation — Suspense, streaming, skeletons — without addressing the organizational pain that makes micro-frontends necessary in the first place.

This talk bridges both.

**Your audience is living this problem right now.** The majority of React teams at conferences are either working inside a monolith that's slowing down as the team grows, or they've already adopted micro-frontends and are struggling with the UX tradeoffs — blank screens between navigations, inconsistent loading states, spinners everywhere. They've heard "micro-frontends" pitched as a solution but haven't seen one that addresses *both* the team-scaling DX problem and the end-user UX problem in the same architecture.

**What makes this different from other MF talks:**

- **It's not theoretical.** Every claim is demonstrated in a running application with 5 independent packages, 136 passing tests, and a CI/CD pipeline that deploys to production. The audience can clone the repo and run it after the talk.
- **It names the real motivation.** Most talks justify micro-frontends with "independent deployment" or "technology diversity." This talk starts with the human problem — what happens to your development culture when 50 engineers share one `package.json` — and shows how the architecture solves it.
- **It doesn't ignore UX.** The live demo shows three distinct loading strategies (Instant, Eager, Streamed) with per-module skeleton fallbacks. The audience sees the difference between a naively federated app (blank screens, spinners) and one where each remote owns its loading choreography through Suspense.
- **It proves fault isolation live.** The Federation Lab panel lets the speaker kill a remote mid-demo and show the audience that the rest of the app keeps running. This is the moment that makes micro-frontends click for skeptics.
- **It's current.** React 19.2, TypeScript 6, Rspack 1.7, Tailwind v4 — this is the stack teams are adopting right now, not a legacy Webpack 4 setup with outdated patterns.

**The audience will leave with:**
1. A mental model for when micro-frontends are worth the complexity (team size, not app size)
2. A concrete pattern for streaming UX inside federated modules (createResource + Suspense + skeletons)
3. A production-tested blueprint they can adapt — the demo repo is open source with CI/CD, tests, and documentation

## Speaker Bio

_[Your name and bio here]_

## Technical Stack

| Technology | Version | Role |
|---|---|---|
| React | 19.2 | UI framework with streaming Suspense |
| Rspack | 1.7 | Bundler with native Module Federation |
| TypeScript | 6.0 | Strict mode across all packages |
| Tailwind CSS | 4.2 | Utility-first styling (Noir Editorial design system) |
| Vitest | 4.1 | Unit + component testing |
| React Testing Library | 16.x | Component test utilities |
