# Streaming Micro-Frontends: React 19 Suspense Meets Module Federation

## Description

Micro-frontends let teams ship independently. React 19 Suspense lets components stream. This talk shows what happens when you stop treating them as separate ideas and start treating Suspense as a first-class micro-frontend primitive. Through a live-coded healthcare demo — a shell host composing four federated React 19 remotes via Rspack Module Federation — we'll explore how each remote can own its entire loading choreography with the `createResource` pattern, how a host shell can stay completely ignorant of its children's internals using nothing but `<Suspense>` and `<ErrorBoundary>`, and how custom DOM events replace shared state for cross-module communication that survives independent deployments. You'll see real streaming, real fault isolation with a live kill-switch demo panel, and a real test suite — no slides-only architecture diagrams.

## Abstract

Module Federation promised us independently deployed micro-frontends. React 19 promised us streaming Suspense. What happens when you combine them?

In this talk, we'll build a production-grade healthcare shell that composes four independent React 19 applications — a landing page, medical records viewer, prescription orders, and clinical analytics dashboard — into a single cohesive experience using Rspack Module Federation. But we won't stop at lazy loading remote components. We'll push further into **streaming micro-frontends**: remote modules that leverage React's Suspense resource pattern to progressively render content with skeleton fallbacks, all orchestrated by a host shell that has zero knowledge of its children's internals.

**You'll learn how to:**

- Architect a Module Federation monorepo with Rspack that supports independent deployment, hot reload, and fault isolation across teams
- Implement the `createResource` / Suspense streaming pattern inside federated remotes so each micro-frontend controls its own loading choreography
- Build a resilient host shell with ErrorBoundary + Suspense composition that gracefully degrades when a remote is unavailable
- Wire cross-module communication through custom DOM events (`addPrescription`, `showNotification`, `moduleChange`) without coupling any two modules together
- Coordinate shell-owned theming across remotes with shared CSS variables, `localStorage`, and a typed `themeChange` event
- Add hover-based prefetching for federated remotes using a simple prefetch map — no router library required
- Test federated components in isolation with Vitest and React Testing Library, including strategies for mocking remote imports and handling Suspense boundaries in test environments
- Demonstrate fault isolation live with a Federation Lab panel that lets you kill/restore individual remotes and toggle A/B deployment rings during the presentation

**Key takeaways:**

1. **Suspense is a micro-frontend primitive.** Each remote owns its loading state. The shell just renders `<Suspense>` — no loading spinners, no `isLoading` props passed across module boundaries.
2. **Events > shared state.** CustomEvents on `window` give you decoupled inter-module communication that survives independent deployments and version mismatches.
3. **Fault isolation is a feature, not a side effect.** With `.catch()` wrappers on lazy imports and ErrorBoundaries per module, one team's broken deploy doesn't take down the entire application.
4. **Rspack makes this fast.** Module Federation on Rspack gives you sub-second HMR in a monorepo with 5 applications and zero Webpack configuration headaches.

This is not a theoretical architecture talk. Every pattern will be demonstrated in a live, running application with a dark editorial design system, real component streaming, a Federation Lab panel for live fault isolation demos, and a test suite that proves it all works. Whether you're splitting a monolith or starting fresh with micro-frontends, you'll leave with a blueprint you can ship on Monday.

## Talk Details

- **Format:** 30-minute talk with live demo
- **Level:** Intermediate to Advanced
- **Audience:** React developers evaluating or implementing micro-frontend architectures, teams migrating from monolithic SPAs, and engineers interested in React 19 Suspense patterns beyond basic code splitting
- **Prerequisites:** Familiarity with React lazy/Suspense, basic understanding of module bundlers

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
