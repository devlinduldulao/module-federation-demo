/**
 * Generates presentation/SLIDES.pptx from the conference talk outline
 * (presentation/SLIDES.md), styled with the demo's "Noir Editorial"
 * design system (dark noir canvas, citrine accent, mono labels).
 *
 * Usage: node presentation/generate-pptx.mjs
 * Fonts: Instrument Serif · DM Sans · IBM Plex Mono (free Google Fonts).
 * PowerPoint substitutes system fonts if they are not installed.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import Pptxgen from "pptxgenjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Design tokens (mirrors packages/shell/src/index.css) ────────────────────
const C = {
  noir: "0C0C0C",
  surface: "141414",
  elevated: "1C1C1C",
  edge: "2E2E2E",
  cream: "FAFAF9",
  stone: "A8A29E",
  dim: "6B6560",
  citrine: "D4FF00",
  mint: "34D399",
  ice: "60A5FA",
  burnt: "FF6B35",
  rose: "F87171",
};
const SERIF = "Instrument Serif";
const BODY = "DM Sans";
const MONO = "IBM Plex Mono";

const pptx = new Pptxgen();
pptx.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "Module Federation Demo";
pptx.title = "From 5 Devs to 200 — Micro-Frontends That Scale Your Team and Keep the UI Responsive";

let slideNo = 0;

// ── Helpers ──────────────────────────────────────────────────────────────────
function newSlide({ kicker, title, notes } = {}) {
  const s = pptx.addSlide();
  slideNo += 1;
  s.background = { color: C.noir };
  if (kicker) {
    s.addShape(pptx.ShapeType.rect, {
      x: 0.6, y: 0.56, w: 0.45, h: 0.05, fill: { color: C.citrine },
    });
    s.addText(kicker.toUpperCase(), {
      x: 1.2, y: 0.38, w: 11.5, h: 0.4,
      fontFace: MONO, fontSize: 10.5, color: C.stone, charSpacing: 4,
    });
  }
  if (title) {
    s.addText(title, {
      x: 0.58, y: 0.78, w: 12.15, h: 0.85,
      fontFace: SERIF, italic: true, fontSize: 33, color: C.cream,
    });
  }
  s.addText("From 5 Devs to 200 · Micro-Frontends", {
    x: 0.6, y: 7.05, w: 7, h: 0.3,
    fontFace: MONO, fontSize: 8.5, color: C.dim, charSpacing: 2,
  });
  s.addText(String(slideNo).padStart(2, "0"), {
    x: 12.35, y: 7.05, w: 0.6, h: 0.3, align: "right",
    fontFace: MONO, fontSize: 8.5, color: C.dim,
  });
  if (notes) s.addNotes(notes);
  return s;
}

function code(s, text, { x, y, w, h, fontSize = 10.5, color = C.cream } = {}) {
  s.addText(text, {
    x, y, w, h,
    fontFace: MONO, fontSize, color,
    fill: { color: C.surface }, line: { color: C.edge, width: 0.75 },
    align: "left", valign: "top", margin: 10, lineSpacing: fontSize * 1.35,
  });
}

function mono(s, text, { x, y, w, h, fontSize = 11, color = C.stone } = {}) {
  s.addText(text, {
    x, y, w, h,
    fontFace: MONO, fontSize, color,
    align: "left", valign: "top", lineSpacing: fontSize * 1.4,
  });
}

function table(s, header, rows, { x, y, w, colW, fontSize = 11, rowH = 0.34 } = {}) {
  const headerRow = header.map((t) => ({
    text: t.toUpperCase(),
    options: {
      fontFace: MONO, fontSize: fontSize - 2, bold: true, color: C.citrine,
      fill: { color: C.elevated }, charSpacing: 2,
    },
  }));
  const bodyRows = rows.map((r) =>
    r.map((cell) => ({
      text: cell,
      options: { fontFace: BODY, fontSize, color: C.cream, fill: { color: C.surface } },
    }))
  );
  s.addTable([headerRow, ...bodyRows], {
    x, y, w, colW, rowH,
    border: { type: "solid", pt: 0.75, color: C.edge },
    margin: 6, valign: "middle",
  });
}

function bullets(s, items, { x, y, w, h, fontSize = 13, color = C.cream } = {}) {
  s.addText(
    items.map((t) => ({
      text: t,
      options: { bullet: { code: "2022", indent: 14 }, breakLine: true },
    })),
    { x, y, w, h, fontFace: BODY, fontSize, color, lineSpacing: fontSize * 1.6, valign: "top" }
  );
}

function quote(s, text, { x = 0.6, y, w = 12.1, h = 0.7, fontSize = 15 } = {}) {
  s.addShape(pptx.ShapeType.rect, { x, y: y + 0.06, w: 0.035, h: h - 0.12, fill: { color: C.citrine } });
  s.addText(text, {
    x: x + 0.2, y, w: w - 0.2, h,
    fontFace: SERIF, italic: true, fontSize, color: C.stone, valign: "middle",
  });
}

// ── 1 · Title ────────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  slideNo += 1;
  s.background = { color: C.noir };
  s.addText("REACT CONFERENCE · 30-MINUTE TALK · LIVE DEMO", {
    x: 0.7, y: 1.0, w: 12, h: 0.4,
    fontFace: MONO, fontSize: 12, color: C.stone, charSpacing: 5,
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.72, y: 1.55, w: 0.9, h: 0.06, fill: { color: C.citrine } });
  s.addText("From 5 Devs to 200", {
    x: 0.6, y: 1.75, w: 12.1, h: 1.5,
    fontFace: SERIF, italic: true, fontSize: 66, color: C.cream,
  });
  s.addText("Micro-Frontends That Scale Your Team and Keep the UI Responsive", {
    x: 0.7, y: 3.3, w: 12, h: 0.6,
    fontFace: BODY, fontSize: 22, color: C.stone,
  });
  mono(s, [
    "Shell (host)      :3000",
    "├── Home          :3004   INSTANT",
    "├── Records       :3001   EAGER",
    "├── Prescriptions :3002   STREAMED",
    "└── Analytics     :3003   STREAMED",
  ].join("\n"), { x: 0.7, y: 4.15, w: 6.5, h: 1.7, fontSize: 12, color: C.stone });
  s.addText("React 19 · Rspack 2.1 · Module Federation · TypeScript 6 · Tailwind CSS v4", {
    x: 0.7, y: 6.0, w: 12, h: 0.4,
    fontFace: MONO, fontSize: 11, color: C.citrine, charSpacing: 2,
  });
  quote(s, "\u201CWhat happens when you stop treating Suspense and Module Federation as separate ideas?\u201D", { y: 6.5, fontSize: 14 });
  s.addNotes("Hook: this talk is about both sides of the micro-frontend equation — DX for teams and UX for users. Everything shown is a running app the audience can clone.");
}

// ── 2 · The Problem ──────────────────────────────────────────────────────────
{
  const s = newSlide({
    kicker: "The Problem",
    title: "The real bottleneck isn't your framework — it's your team size",
    notes: "Most architecture talks start with bundle sizes. The actual pain that drives companies to micro-frontends is developer experience at scale. Walk the ladder slowly — the audience will recognize where they are.",
  });
  mono(s, [
    "  5 devs → everyone knows the codebase → fast, fun, productive",
    " 15 devs → merge conflicts daily, CI takes 20 min",
    " 50 devs → deploys blocked by unrelated failures",
    "100 devs → teams waiting on other teams to release",
    "200 devs → nobody understands the full app",
  ].join("\n"), { x: 0.6, y: 1.85, w: 12.1, h: 1.55, fontSize: 13, color: C.cream });
  table(s,
    ["Monolith pain (DX)", "MF solution"],
    [
      ["Teams blocked by shared release cycles", "Independent deployment per module"],
      ["One broken test blocks everyone's pipeline", "Each team owns their own test suite"],
      ["Onboarding means learning the entire app", "New devs learn one module, ship day one"],
      ["Shared package.json — upgrade together or never", "Each remote pins its own dependencies"],
    ],
    { x: 0.6, y: 3.55, w: 12.1, colW: [6.05, 6.05], fontSize: 12 });
  quote(s, "Solving DX isn't enough — visitors don't care about your team structure. They care that the app feels fast.", { y: 6.25, fontSize: 14 });
}

// ── 3 · The Insight ──────────────────────────────────────────────────────────
{
  const s = newSlide({
    kicker: "The Insight",
    title: "Two pillars: DX for your team, UX for your users",
    notes: "This is the thesis slide. Module Federation and Suspense are usually presented separately — combined, each remote owns its own loading choreography while the shell stays ignorant.",
  });
  table(s,
    ["Pillar", "Who benefits", "What it solves"],
    [
      ["Module Federation", "Developers & teams", "Independent builds, deploys, onboarding — DX at scale"],
      ["Suspense + skeletons", "End users & visitors", "Instant perceived load, no blank screens — UX at runtime"],
    ],
    { x: 0.6, y: 1.9, w: 12.1, colW: [3.1, 3.0, 6.0], fontSize: 13, rowH: 0.45 });
  mono(s, [
    "Without Suspense:  click tab → blank screen → spinner → content",
    "                   (terrible UX, even with great DX)",
    "",
    "With Suspense:     click tab → skeleton instantly → content resolves",
    "                   (each remote owns its loading choreography)",
  ].join("\n"), { x: 0.6, y: 3.6, w: 12.1, h: 1.8, fontSize: 12.5, color: C.cream });
  quote(s, "The shell doesn't know or care how long a remote takes to load. It renders <Suspense> and moves on.", { y: 5.9, fontSize: 15 });
}

// ── 4 · Architecture Overview ────────────────────────────────────────────────
{
  const s = newSlide({
    kicker: "Architecture",
    title: "One shell, four remotes, three loading strategies",
    notes: "Point at the status strip in the live demo — it shows INSTANT / EAGER / STREAMING per module. Not every module should load the same way; the shell decides by content priority.",
  });
  mono(s, [
    "┌───────────────────────── SHELL :3000 ─────────────────────────┐",
    "│  Nav · Router · Theme · Status strip (INSTANT|EAGER|STREAMING)│",
    "│                                                               │",
    "│    <ErrorBoundary>                                            │",
    "│      <Suspense fallback={<Skeleton />}>                       │",
    "│        <RemoteModule />                                       │",
    "│      </Suspense>                                              │",
    "│    </ErrorBoundary>                                           │",
    "└───────┬───────────┬────────────────┬──────────────┬───────────┘",
    "     Home :3004  Records :3001  Prescriptions :3002  Analytics :3003",
    "     INSTANT     EAGER          STREAMED             STREAMED",
  ].join("\n"), { x: 0.6, y: 1.8, w: 12.1, h: 3.1, fontSize: 11.5, color: C.stone });
  table(s,
    ["Strategy", "Module", "Behavior"],
    [
      ["Instant", "Home", "Lazy for code splitting, no artificial resource delay — renders when the chunk arrives"],
      ["Eager", "Records", "Standalone component, preloaded on shell mount — cached before the click"],
      ["Streamed", "Prescriptions, Analytics", "On demand, per-module skeletons + error isolation"],
    ],
    { x: 0.6, y: 5.05, w: 12.1, colW: [1.7, 3.0, 7.4], fontSize: 11.5 });
}

// ── 5 · Tech Stack ───────────────────────────────────────────────────────────
{
  const s = newSlide({
    kicker: "Tech Stack",
    title: "Every module is a standalone app",
    notes: "cd into any package, pnpm run dev, full HMR — no shell needed. The async bootstrap pattern is what makes standalone mode possible with shared React (eager: false).",
  });
  table(s,
    ["Technology", "Version", "Why"],
    [
      ["React", "19.2", "Suspense fallbacks and lazy loading as first-class primitives"],
      ["Rspack", "2.1", "Native Module Federation, Rust React Compiler, sub-second HMR"],
      ["TypeScript", "6.0", "Strict mode, type-safe event contracts"],
      ["Tailwind CSS", "v4", "@theme tokens for the design system"],
      ["Vitest", "4.1", "Fast component tests with jsdom"],
    ],
    { x: 0.6, y: 1.85, w: 12.1, colW: [2.4, 1.5, 8.2], fontSize: 12 });
  code(s, [
    "// index.tsx — the ENTIRE file (async boundary for MF)",
    'import("./bootstrap");',
    "",
    "// bootstrap.tsx — actual React rendering",
    'import ReactDOM from "react-dom/client";',
    'import MedicalRecords from "./MedicalRecords";',
    'ReactDOM.createRoot(document.getElementById("root")!)',
    "  .render(<MedicalRecords />);",
  ].join("\n"), { x: 0.6, y: 4.35, w: 7.4, h: 2.3 });
  bullets(s, [
    "Async boundary lets MF negotiate shared deps first",
    "Without it: white screen + loadShareSync error",
    "All 5 packages use this pattern",
  ], { x: 8.25, y: 4.45, w: 4.5, h: 2.2, fontSize: 12.5 });
}

// ── 6 · Module Federation Config ─────────────────────────────────────────────
{
  const s = newSlide({
    kicker: "Module Federation",
    title: "The one plugin that makes it federated",
    notes: "Everything else in rspack.config.ts is a normal bundler config. Remove ModuleFederationPlugin and you have five unrelated apps. exposes = the contract, remotes = runtime discovery, shared = deduplication.",
  });
  table(s,
    ["Property", "Where", "Purpose"],
    [
      ["exposes", "Remotes", "\u201CWhat components do I share?\u201D — the team's public API"],
      ["remotes", "Host", "\u201CWhere do I find each remote at runtime?\u201D — scope@URL discovery"],
      ["shared", "Both", "\u201CWhat do we deduplicate?\u201D — singleton: true = one React for all"],
    ],
    { x: 0.6, y: 1.85, w: 12.1, colW: [1.7, 1.5, 8.9], fontSize: 12 });
  code(s, [
    "// records (remote)",
    "new rspack.container.ModuleFederationPlugin({",
    '  name: "records",',
    '  filename: "remoteEntry.js",',
    "  exposes: {",
    '    "./MedicalRecords": "./src/MedicalRecords.tsx",',
    "  },",
    "  shared: {",
    "    react: { singleton: true },",
    "  },",
    "});",
  ].join("\n"), { x: 0.6, y: 3.7, w: 6.0, h: 3.0, fontSize: 10 });
  code(s, [
    "// shell (host)",
    "new rspack.container.ModuleFederationPlugin({",
    '  name: "shell",',
    "  remotes: {",
    '    records: "records@http://localhost:3001/remoteEntry.js",',
    "    // home, prescriptions, analytics …",
    "  },",
    "  shared: {",
    "    react: { singleton: true },",
    "  },",
    "});",
  ].join("\n"), { x: 6.75, y: 3.7, w: 6.0, h: 3.0, fontSize: 10 });
}

// ── 7 · The Resource Pattern ─────────────────────────────────────────────────
{
  const s = newSlide({
    kicker: "UX Pillar",
    title: "The resource pattern — a client-side Suspense fallback",
    notes: "The wrapper's ONLY job is to trigger Suspense. The actual UI lives in the standalone component. read() throws the promise while pending — Suspense in the shell catches it. This demo delays a client-side promise; it does not use streaming SSR.",
  });
  code(s, [
    "function createResource<T>(asyncFn: () => Promise<T>): Resource<T> {",
    '  let status = "pending"; let result: T;',
    "  const suspender = asyncFn().then(",
    '    (data)  => { status = "success"; result = data;  },',
    '    (error) => { status = "error";   result = error; },',
    "  );",
    "  return {",
    "    read() {",
    '      if (status === "pending") throw suspender; // ← Suspense catches this',
    '      if (status === "error")   throw result;',
    "      return result;",
    "    },",
    "  };",
    "}",
    "",
    "const StreamingMedicalRecords = () => {",
    '  const resource = getResource("records-initial", 2500); // module-level cache',
    "  resource.read(); // throws while pending → triggers <Suspense> in the shell",
    "  return <MedicalRecords />;",
    "};",
  ].join("\n"), { x: 0.6, y: 1.85, w: 8.6, h: 4.9, fontSize: 10 });
  bullets(s, [
    "Wrapper only triggers Suspense",
    "UI lives in the standalone component",
    "Cache prevents re-fetch on re-render",
    "use() hook is the React 19 successor — migration optional",
  ], { x: 9.45, y: 2.0, w: 3.3, h: 4.5, fontSize: 12.5 });
}

// ── 8 · Shell Composition ────────────────────────────────────────────────────
{
  const s = newSlide({
    kicker: "Shell Composition",
    title: "Three strategies, three layers of resilience",
    notes: "Anticipate the question: why lazy() for eager modules? MF remotes are separate builds resolved at runtime via import() — you can't use a static import. Eager import() at shell init warms the cache; lazy() resolves instantly from it.",
  });
  code(s, [
    "// INSTANT — renders the moment the chunk arrives",
    'const Home = lazy(() => import("home/Home").catch(() => ({',
    '  default: () => <ModuleFallback title="Home Unavailable" /> })));',
    "",
    "// EAGER — preloaded at shell init",
    'const MedicalRecords = lazy(() => import("records/MedicalRecords")',
    "  .catch(/* fallback */));",
    'const EAGER = MODULES.filter((m) => m.loadStrategy === "eager");',
    "for (const m of EAGER) PREFETCHERS[m.id]();",
    "",
    "// STREAMED — on demand with skeletons",
    "const StreamingPrescriptionOrders =",
    '  lazy(() => import("prescriptions/StreamingPrescriptionOrders")',
    "  .catch(/* fallback */));",
  ].join("\n"), { x: 0.6, y: 1.85, w: 8.2, h: 3.6, fontSize: 10 });
  bullets(s, [
    "Layer 1 — lazy() + .catch(): fallback if remote is unreachable",
    "Layer 2 — <Suspense>: skeleton while loading",
    "Layer 3 — <ErrorBoundary>: catches runtime errors",
  ], { x: 9.0, y: 2.0, w: 3.75, h: 2.6, fontSize: 12 });
  quote(s, "Why lazy() for eager modules? Remotes are separate builds resolved at runtime — the eager import() warms the cache, lazy() resolves from it instantly.", { y: 5.75, fontSize: 13.5 });
}

// ── 9 · Shell Controls ───────────────────────────────────────────────────────
{
  const s = newSlide({
    kicker: "Live Demo Controls",
    title: "Settings · Commands · Federation Lab",
    notes: "The command palette (Ctrl+K) is the speaker's secret weapon — kill a remote, switch themes, navigate modules without leaving the keyboard.",
  });
  table(s,
    ["Button", "Opens", "Answers the question"],
    [
      ["Settings", "Right slide-over drawer", "\u201CHow does the shell share UI state across independent remotes?\u201D"],
      ["Commands (Ctrl+K)", "Searchable palette", "\u201CHow do you control an MF demo without fumbling with a mouse?\u201D"],
      ["Lab", "Federation Lab panel", "\u201CWhat happens when things break?\u201D"],
    ],
    { x: 0.6, y: 1.9, w: 12.1, colW: [2.4, 3.0, 6.7], fontSize: 12, rowH: 0.5 });
  bullets(s, [
    "Health Monitor — polls each remoteEntry.js every 5s, shows latency",
    "Kill Switches — simulate remote failure; the rest keeps running",
    "A/B Deployment — toggle Stable ↔ Canary ring, per-module versions",
    "Theme — CSS variables + localStorage + themeChange event, zero shared imports",
  ], { x: 0.6, y: 4.15, w: 12.1, h: 2.5, fontSize: 13 });
}

// ── 10 · Fault Isolation ─────────────────────────────────────────────────────
{
  const s = newSlide({
    kicker: "Fault Isolation",
    title: "Microservices for the frontend — the 99% case",
    notes: "Kill the records remote live here. The one honest caveat: all modules share a browser tab, so an infinite loop freezes everything — the inherent cost of a shared runtime, and virtually every MF architecture accepts it.",
  });
  table(s,
    ["", "Microservices", "Micro-frontends (this demo)"],
    [
      ["Isolation", "OS-level (separate processes)", "React-level (ErrorBoundary per module)"],
      ["If one crashes", "Other services keep running", "Other modules keep rendering"],
      ["Blast radius", "Network call fails → caller handles", "import() fails → fallback + Retry"],
      ["Shared risk", "None (own memory/CPU)", "Shared browser tab"],
    ],
    { x: 0.6, y: 1.85, w: 12.1, colW: [2.2, 4.6, 5.3], fontSize: 12 });
  code(s, [
    "// lazy() with .catch() — the secret sauce",
    "const MedicalRecords = lazy(() =>",
    '  import("records/MedicalRecords").catch(() => ({',
    '    default: () => <ModuleFallback title="Records Unavailable" />,',
    "  })));",
  ].join("\n"), { x: 0.6, y: 4.35, w: 7.6, h: 1.6, fontSize: 10.5 });
  quote(s, "Module-level crashes, network failures, and bad deploys are isolated at the boundary. Tab-level resource exhaustion remains a shared-runtime risk.", { y: 6.2, fontSize: 13.5 });
}

// ── 11 · Cross-Module Communication ─────────────────────────────────────────
{
  const s = newSlide({
    kicker: "DX Pillar",
    title: "Events > shared state",
    notes: "No direct imports between modules. Events are framework-agnostic, but the event payload is still a versioned contract. The shell stays the only router owner.",
  });
  code(s, [
    "// Records dispatches",
    'window.dispatchEvent(new CustomEvent("addPrescription", {',
    "  detail: { id: 1, name: \"Sarah Chen prescription\",",
    "            price: 2499.99, quantity: 1 },",
    "}));",
    "",
    "// Prescriptions listens",
    "useEffect(() => {",
    "  const handler = (e: AddPrescriptionEvent) =>",
    "    setPrescriptionItems((prev) => [...prev, e.detail]);",
    '  window.addEventListener("addPrescription", handler);',
    '  return () => window.removeEventListener("addPrescription", handler);',
    "}, []);",
  ].join("\n"), { x: 0.6, y: 1.85, w: 8.2, h: 3.7, fontSize: 10 });
  bullets(s, [
    "No direct cross-module imports",
    "Shell stays the only router owner",
    "Works across deployments when the event contract stays compatible",
    "Framework-agnostic (React, Vue, Svelte)",
    "Typed via WindowEventMap augmentation",
  ], { x: 9.0, y: 2.0, w: 3.75, h: 3.6, fontSize: 12 });
  code(s, [
    "declare global {",
    "  interface WindowEventMap {",
    "    addPrescription: AddPrescriptionEvent;",
    '    navigateToModule: CustomEvent<{ module: "home" | "records" | … }>;',
    "    themeChange: ThemeChangeEvent;",
    "  }",
    "}",
  ].join("\n"), { x: 0.6, y: 5.75, w: 8.2, h: 1.15, fontSize: 9 });
}

// ── 12 · Theme System ────────────────────────────────────────────────────────
{
  const s = newSlide({
    kicker: "Theme System",
    title: "Shell-owned theming across the federation",
    notes: "The shell rewrites CSS variables on :root, persists to localStorage, exposes window.__MF_THEME__, and broadcasts themeChange. Remotes react via a hook — no shared imports, no prop drilling.",
  });
  mono(s, [
    "Shell (owns theme)",
    "  ├── Persists to localStorage (\"mf-demo-theme\")",
    "  ├── Applies CSS variables to document.documentElement",
    "  ├── Exposes window.__MF_THEME__ bridge",
    "  └── Broadcasts \"themeChange\" event",
    "        ├── Records       → useActiveTheme()",
    "        ├── Prescriptions → useActiveTheme()",
    "        └── Analytics     → useActiveTheme()",
  ].join("\n"), { x: 0.6, y: 1.85, w: 6.6, h: 2.9, fontSize: 12, color: C.cream });
  code(s, [
    "export function useActiveTheme() {",
    "  const [theme, setTheme] = useState(() =>",
    '    window.__MF_THEME__?.getTheme() ?? "dark");',
    "",
    "  useEffect(() => {",
    '    const handler = (e) => setTheme(e.detail.theme);',
    '    window.addEventListener("themeChange", handler);',
    "    return () =>",
    '      window.removeEventListener("themeChange", handler);',
    "  }, []);",
    "",
    "  return { theme, label: THEME_LABELS[theme] };",
    "}",
  ].join("\n"), { x: 7.45, y: 1.85, w: 5.25, h: 3.6, fontSize: 9.5 });
  quote(s, "Every remote reacts immediately — no shared imports, no prop drilling, no re-deploys.", { y: 5.9, fontSize: 15 });
}

// ── 13 · Prefetching + Eager Loading ─────────────────────────────────────────
{
  const s = newSlide({
    kicker: "Performance",
    title: "Two-tier preloading: eager on mount, hover on demand",
    notes: "Records is already cached by the time the user clicks. Prescriptions and Analytics start loading when the cursor touches the tab.",
  });
  code(s, [
    "const PREFETCHERS: Record<ModuleType, () => Promise<unknown>> = {",
    '  home:          () => import("home/Home").catch(() => undefined),',
    '  records:       () => import("records/MedicalRecords").catch(() => undefined),',
    '  prescriptions: () => import("prescriptions/StreamingPrescriptionOrders").catch(() => undefined),',
    '  analytics:     () => import("analytics/StreamingClinicalAnalytics").catch(() => undefined),',
    "};",
    "",
    "// EAGER — preload on shell mount",
    'for (const m of MODULES.filter((m) => m.loadStrategy === "eager")) PREFETCHERS[m.id]();',
    "",
    "// HOVER — prefetch on tab hover",
    "<NavLink onMouseEnter={() => PREFETCHERS[module.id]()} />",
  ].join("\n"), { x: 0.6, y: 1.85, w: 12.1, h: 3.1, fontSize: 10 });
  table(s,
    ["Strategy", "When it loads", "Example"],
    [
      ["Instant", "Chunk fetched lazily, no streaming delay", "Home"],
      ["Eager", "Preloaded the moment the shell mounts", "Records"],
      ["Hover", "Prefetched when the user hovers a tab", "Prescriptions, Analytics"],
    ],
    { x: 0.6, y: 5.2, w: 12.1, colW: [1.8, 6.3, 4.0], fontSize: 11.5 });
}

// ── 14 · Testing ─────────────────────────────────────────────────────────────
{
  const s = newSlide({
    kicker: "Testing",
    title: "Test federated components in isolation — no servers",
    notes: "The vitest alias trick resolves MF imports to source files. 210 tests across 21 files, all green — run pnpm test live if time allows.",
  });
  code(s, [
    "// vitest.config.ts — resolve MF imports to source files",
    "resolve: {",
    "  alias: {",
    '    "records/MedicalRecords":',
    '      path.resolve(__dirname, "packages/records/src/MedicalRecords.tsx"),',
    "    // home/Home, prescriptions/…, analytics/… same pattern",
    "  },",
    "},",
  ].join("\n"), { x: 0.6, y: 1.85, w: 12.1, h: 2.15, fontSize: 10 });
  code(s, [
    'it("dispatches addPrescription event on Add click", async () => {',
    "  const handler = vi.fn();",
    '  window.addEventListener("addPrescription", handler);',
    "  render(<MedicalRecords />);",
    '  await user.click(screen.getByRole("button", { name: /create prescription/i }));',
    "  expect(handler).toHaveBeenCalledTimes(1);",
    "});",
  ].join("\n"), { x: 0.6, y: 4.2, w: 12.1, h: 1.9, fontSize: 10 });
  s.addText("210 tests across 21 files — all passing.", {
    x: 0.6, y: 6.3, w: 12.1, h: 0.5,
    fontFace: SERIF, italic: true, fontSize: 20, color: C.citrine,
  });
}

// ── 15 · Design System ───────────────────────────────────────────────────────
{
  const s = newSlide({
    kicker: "Design System",
    title: "Noir Editorial — not another pastel AI dashboard",
    notes: "Typography: Instrument Serif for display, DM Sans body, IBM Plex Mono labels. 1px grid gaps, citrine accent, staggered fadeInUp animations, SVG grain overlay.",
  });
  table(s,
    ["Element", "Treatment"],
    [
      ["Typography", "Instrument Serif (display) · DM Sans (body) · IBM Plex Mono (labels)"],
      ["Grid", "gap-[1px] bg-edge — sharp 1px editorial grid lines"],
      ["Animations", "fadeInUp with staggered delays, shimmer on skeletons"],
      ["Grain", "SVG noise overlay at 2.5% opacity"],
    ],
    { x: 0.6, y: 1.85, w: 12.1, colW: [2.4, 9.7], fontSize: 12 });
  const chips = [
    ["noir", C.noir], ["cream", C.cream], ["stone", C.stone],
    ["citrine", C.citrine], ["mint", C.mint], ["ice", C.ice],
    ["burnt", C.burnt], ["rose", C.rose],
  ];
  chips.forEach(([name, hex], i) => {
    const x = 0.6 + i * 1.55;
    s.addShape(pptx.ShapeType.rect, {
      x, y: 4.6, w: 1.35, h: 0.9, fill: { color: hex },
      line: { color: C.edge, width: 1 },
    });
    s.addText(`${name}\n#${hex}`, {
      x, y: 5.55, w: 1.35, h: 0.6, align: "center",
      fontFace: MONO, fontSize: 8.5, color: C.stone,
    });
  });
}

// ── 16 · Live Demo Script ────────────────────────────────────────────────────
{
  const s = newSlide({
    kicker: "Live Demo",
    title: "Six segments, ~10 minutes",
    notes: "Keep this slide up while switching to the browser, or skip it entirely — it's the safety net if the demo machine fails.",
  });
  table(s,
    ["#", "Segment", "Time", "Money shot"],
    [
      ["1", "Federation + DX story", "2 min", "Status strip flips INSTANT → EAGER → STREAMING as you navigate"],
      ["2", "Federation Lab — fault isolation", "2 min", "Kill records; prescriptions & analytics keep running"],
      ["3", "A/B deployment", "1 min", "Stable ↔ Canary ring, per-module versions"],
      ["4", "Theme switching", "30 s", "CSS variables update across all remotes, persists on refresh"],
      ["5", "Code walkthrough", "3 min", "Resource pattern · lazy+catch+Suspense · event flow"],
      ["6", "Testing", "1 min", "pnpm test — 210 green, vitest alias trick"],
    ],
    { x: 0.6, y: 1.9, w: 12.1, colW: [0.5, 3.4, 0.9, 7.3], fontSize: 11.5 });
}

// ── 17 · Key Takeaways ───────────────────────────────────────────────────────
{
  const s = newSlide({
    kicker: "Takeaways",
    title: "Seven things to remember",
    notes: "Land takeaway #1 hardest: micro-frontends solve a people problem. Team size, not app size, is the signal.",
  });
  bullets(s, [
    "1 · Micro-frontends solve a people problem, not just a code problem",
    "2 · Suspense fallbacks solve the UX side — two separate pillars, one architecture",
    "3 · Events > shared state — CustomEvents survive independent deploys",
    "4 · Host owns routing — remotes request navigation, only the shell mutates it",
    "5 · Fault isolation is a feature: .catch() + ErrorBoundary per module",
    "6 · Rspack makes this fast — sub-second HMR, Rust React Compiler, persistent cache",
    "7 · Not every module should load the same way: instant / eager / streamed",
  ], { x: 0.6, y: 1.95, w: 12.1, h: 4.8, fontSize: 15 });
}

// ── 18 · When to Apply This ──────────────────────────────────────────────────
{
  const s = newSlide({
    kicker: "Decision Guide",
    title: "You're ready for this architecture when…",
    notes: "Close with production examples: healthcare platforms, SaaS dashboards, enterprise portals, media platforms — each domain as a federated remote.",
  });
  table(s,
    ["Signal", "Pattern to adopt"],
    [
      ["Teams ship the same SPA and block each other on releases", "Module Federation — independent builds; deployment topology can follow"],
      ["Users wait for a full bundle before seeing anything", "Suspense fallback — skeletons render instantly"],
      ["One broken feature takes down the whole page", "ErrorBoundary + lazy().catch() per module"],
      ["Shared state libraries create invisible coupling", "CustomEvents on window — no direct imports, explicit contracts"],
      ["You need canary releases at the feature level", "Independent versioning per remote"],
      ["Testing one feature requires the full app running", "Vitest alias trick — isolation, no servers"],
    ],
    { x: 0.6, y: 1.9, w: 12.1, colW: [6.3, 5.8], fontSize: 11.5 });
  s.addText("In production today: healthcare platforms · SaaS dashboards · enterprise portals · media platforms", {
    x: 0.6, y: 6.35, w: 12.1, h: 0.4,
    fontFace: MONO, fontSize: 10.5, color: C.stone, charSpacing: 1,
  });
}

// ── 19 · Thank You ───────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  slideNo += 1;
  s.background = { color: C.noir };
  s.addShape(pptx.ShapeType.rect, { x: 0.72, y: 2.35, w: 0.9, h: 0.06, fill: { color: C.citrine } });
  s.addText("Thank you.", {
    x: 0.6, y: 2.55, w: 12.1, h: 1.4,
    fontFace: SERIF, italic: true, fontSize: 60, color: C.cream,
  });
  s.addText("Clone it, kill a remote, watch the rest keep running.", {
    x: 0.7, y: 4.05, w: 12, h: 0.5,
    fontFace: BODY, fontSize: 20, color: C.stone,
  });
  s.addText("Repository link in the session materials", {
    x: 0.7, y: 4.85, w: 12, h: 0.4,
    fontFace: MONO, fontSize: 13, color: C.citrine, charSpacing: 1,
  });
  s.addNotes("Share the verified repository URL in the conference materials. Invite questions about React 19 Suspense: the nearest fallback can commit sooner, then React pre-warms suspended siblings.");
}

// ── Write file ───────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, "SLIDES.pptx");
await pptx.writeFile({ fileName: outPath });
console.log(`✔ Wrote ${outPath} (${slideNo} slides)`);
