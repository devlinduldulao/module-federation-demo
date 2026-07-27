# From 5 Devs to 200: Micro-Frontends That Scale Your Team and Keep the UI Responsive

## Description

Team size is the bottleneck in frontend development. At 5 developers, a monolith is fast and fun. At 50, deploys are blocked by unrelated failures. At 200, nobody understands the full application and onboarding takes months.

This talk covers both sides of micro-frontends through a live healthcare demo built with React 19, Rspack 2 Module Federation, and client-side Suspense fallbacks:

- **Developer experience (DX):** Module Federation lets teams own, build, test, and deploy modules independently, so a broken prescription test never blocks the medical records team, and a new hire ships in their first week, not their first quarter.
- **User experience (UX):** React 19 Suspense with per-module skeleton fallbacks avoids blank screens. Users see layout feedback while remote code or simulated data becomes ready.

You'll watch a shell host compose four independent React 19 applications, kill a remote live to prove fault isolation, and see how `<Suspense>` + `<ErrorBoundary>` is all the shell needs to stay free of its children's loading internals. A running app, a real test suite, and patterns you can ship on Monday.

## Abstract

Every growing frontend team hits the same wall. The product scales, you hire more engineers, and merge conflicts become daily, CI takes 20 minutes, and "don't merge yet, we're releasing" is a Slack message you read every morning. The architecture that worked at 5 developers is destroying your development culture at 50.

Module Federation supports independent builds, deployment paths, and team ownership. Your users still don't care about your team structure. They care that the app feels fast. If navigating between federated modules means a blank screen and a spinner, you've traded DX for UX.

This talk shows you don't have to choose.

Through a healthcare demo (a shell host composing a landing page, medical records viewer, prescription orders, and clinical analytics dashboard via Rspack Module Federation), we'll build an architecture with two concerns:

**DX for your team (Module Federation):**
- Five packages, five dev servers, and focused test coverage with no direct runtime imports between remotes
- Each remote has its own `package.json`, Rspack config, and release cycle
- Cross-module communication through typed DOM events (`addPrescription`, `showNotification`, `themeChange`). No shared store or direct imports; event payloads stay explicit versioned contracts
- A new developer learns one module and contributes on day one

**UX for your users (Suspense + Skeleton Fallbacks):**
- Each remote owns its loading choreography with the `createResource` / Suspense pattern
- The shell renders `<Suspense fallback={<Skeleton />}>`. No `isLoading` props, no loading spinners passed across module boundaries
- Users see a skeleton layout the moment they navigate; the remote content replaces it when its code and simulated resource resolve
- Three load strategies: **Instant** (Home), **Eager** (Records, preloaded on mount), **Streamed** (Prescriptions, Analytics with progressive rendering)

**Live demos include:**
- A Federation Lab panel that lets you kill and restore individual remotes mid-presentation to prove fault isolation
- ErrorBoundary composition that degrades one module without taking down the application
- Hover-based prefetching for federated remotes using a simple prefetch map
- A full Vitest test suite running against federated components with mocked remote imports
- A Rspack 2 migration walkthrough covering the breaking changes teams hit: explicit `@rspack/dev-server`, explicit `@module-federation/runtime-tools`, and the updated React refresh plugin import shape

**Key takeaways:**

1. **Micro-frontends are a team-scaling strategy.** The architecture should match how your organization works. Small teams that own their module end-to-end, from local dev to production deploy, move faster and ship with more confidence than teams fighting over a shared monolith.
2. **Suspense is a micro-frontend primitive.** Each remote owns its loading state. The shell renders `<Suspense>`; the user sees a skeleton while the component becomes ready. No `isLoading` props leak across module boundaries.
3. **Skeleton fallbacks protect async modules.** When modules load at different speeds from different servers, per-module skeletons give layout stability instead of blank screens and layout shifts.
4. **Ship fault isolation on purpose.** `.catch()` wrappers on lazy imports and ErrorBoundaries per module contain a failed remote so other route views stay available. This is not process isolation: all modules still share one browser tab, so an infinite loop or memory leak can freeze the page.
5. **Events over shared state.** CustomEvents on `window` avoid direct import coupling. Keep their payloads backward-compatible when modules deploy independently.
6. **Per-module CI matches microservices practice.** Each module should have its own workflow file triggered only when its code changes. One big workflow that rebuilds everything on every push couples deploys and defeats the point of MF.
7. **Every module must run standalone with HMR.** Each package is a self-contained React app with its own devServer, build, and tsconfig. A developer can open one folder in VS Code, run `pnpm run dev`, and work with full HMR. No shell or other remotes needed. That requires an async bootstrap pattern (`index.tsx → import("./bootstrap")`) so Module Federation can negotiate shared dependencies before React code runs.

## Why React 19, Not 18?

React 19 changed how Suspense commits a fallback: when a component suspends, React can commit the nearest fallback immediately, then pre-warm lazy requests in the suspended sibling tree. This talk addresses the practical implication directly.

**This demo keeps the behavior easy to reason about:**
1. **Route-based rendering** — one remote is the primary route view at a time
2. **A focused `<Suspense>` boundary** — the route view owns one purposeful fallback
3. **Pre-fetching** — eager preload + hover prefetch often warms code before render

**React 19 fits this architecture:**
- **Faster fallback commits and lazy-request pre-warming** — the shell can show its purpose-built fallback promptly.
- **React Compiler is enabled in the Rspack configuration** — profile the real app before claiming a performance gain.
- **Cached resources** — this demo keeps its delayed promise outside component render; production code should use a Suspense-compatible data layer with caching.
- **`use()` is available** — it can read a cached promise inside render when a supported data source provides one.

Audience question: "What changed in React 19 Suspense?" Fallbacks commit sooner and React pre-warms suspended siblings; boundary design and data caching still matter.

## Talk Details

- **Format:** 30-minute talk with live demo
- **Level:** Intermediate to Advanced
- **Audience:** React developers evaluating or implementing micro-frontend architectures, teams migrating from monolithic SPAs, and engineers interested in React 19 Suspense patterns beyond basic code splitting
- **Prerequisites:** Familiarity with React lazy/Suspense, basic understanding of module bundlers

## Why This Talk?

Most micro-frontend talks fall into one of two traps. They either focus entirely on infrastructure (how to wire Module Federation, how to share dependencies) and leave the audience with a technically correct architecture that delivers a poor user experience. Or they focus on React patterns in isolation (Suspense and skeletons) without the organizational pain that makes micro-frontends necessary.

This talk bridges both.

**Your audience is living this problem.** Many React teams at conferences are either working inside a monolith that's slowing down as the team grows, or they've already adopted micro-frontends and struggle with blank screens between navigations, inconsistent loading states, and spinners everywhere. They've heard "micro-frontends" pitched as a solution but haven't seen one that addresses team-scaling DX and end-user UX in the same architecture.

**What makes this different from other MF talks:**

- **Running app, not slides-only.** Every claim is demonstrated with 5 independent packages, 210 passing tests, and a CI/CD pipeline. The audience can clone the repo and run it after the talk.
- **Starts with the human problem.** What happens to development culture when 50 engineers share one `package.json`, and how the architecture solves it.
- **UX is in the live demo.** Three load strategies (Instant, Eager, Streamed) with per-module skeleton fallbacks. The audience sees the difference between a naively federated app (blank screens, spinners) and one where each remote owns its loading choreography through Suspense.
- **Fault isolation live.** The Federation Lab panel lets the speaker kill a remote mid-demo and show that the rest of the app keeps running.
- **Current stack.** React 19.2, TypeScript 6, Rspack 2.1, Tailwind v4. The demo enables Rspack 2.1's Rust port of React Compiler for build-time auto-memoization.

**The audience will leave with:**
1. A mental model for when micro-frontends are worth the complexity (team size, not app size)
2. A concrete pattern for responsive loading UX inside federated modules (cached resource + Suspense + skeletons)
3. A production-tested blueprint they can adapt: the demo repo is open source with CI/CD, tests, and documentation

## Speaker Bio

_[Your name and bio here]_

## Technical Stack

| Technology | Version | Role |
|---|---|---|
| React | 19.2 | UI framework with Suspense fallbacks |
| Rspack | 2.1 | Bundler with native Module Federation |
| TypeScript | 6.0 | Strict mode across all packages |
| Tailwind CSS | 4.2 | Utility-first styling (Noir Editorial design system) |
| Vitest | 4.1 | Unit + component testing |
| React Testing Library | 16.x | Component test utilities |
