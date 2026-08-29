export type ThemeName = "dark" | "light";

type ThemeColorScheme = "dark" | "light";

interface ThemeDefinition {
  readonly label: string;
  readonly description: string;
  readonly colorScheme: ThemeColorScheme;
  readonly variables: Readonly<Record<string, string>>;
}

export const THEME_STORAGE_KEY = "mf-demo-theme";
export const DEFAULT_THEME: ThemeName = "dark";

/**
 * Theme switcher only toggles `.dark` for shadcn semantic tokens
 * (`--background`, `--primary`, etc. live in index.css).
 *
 * These variables are optional legacy brand utilities used by existing
 * screens (bg-background, text-primary, …). They must NOT redefine shadcn names
 * like --color-muted / --color-primary — those map to Lyra defaults in CSS.
 */
export const THEME_DEFINITIONS: Readonly<Record<ThemeName, ThemeDefinition>> = {
  dark: {
    label: "Dark",
    description: "shadcn Lyra dark (neutral).",
    colorScheme: "dark",
    variables: {
      "--color-ink": "#0C0C0C",
      "--color-noir": "#0C0C0C",
      "--color-surface": "#141414",
      "--color-elevated": "#1C1C1C",
      "--color-edge": "#2E2E2E",
      "--color-edge-bright": "#444444",
      "--color-cream": "#FAFAF9",
      "--color-stone": "#A8A29E",
      "--color-dim": "#8C857D",
      "--color-citrine": "#D4FF00",
      "--color-citrine-dim": "#A8CC00",
      "--color-burnt": "#FF6B35",
      "--color-ice": "#60A5FA",
      "--color-mint": "#34D399",
      "--color-rose": "#F87171",
      "--theme-grid-dot": "rgba(250, 250, 249, 0.5)",
      "--theme-grain-opacity": "0.025",
    },
  },
  light: {
    label: "Light",
    description: "shadcn Lyra light (neutral).",
    colorScheme: "light",
    variables: {
      "--color-ink": "#000000",
      "--color-noir": "#FBFAF6",
      "--color-surface": "#F2F0E9",
      "--color-elevated": "#EAE7DD",
      "--color-edge": "#DCD9CE",
      "--color-edge-bright": "#C6C2B4",
      "--color-cream": "#1C1B17",
      "--color-stone": "#57534A",
      "--color-dim": "#6E6A5F",
      "--color-citrine": "#4D7C0F",
      "--color-citrine-dim": "#3F6211",
      "--color-burnt": "#C2410C",
      "--color-ice": "#2563EB",
      "--color-mint": "#059669",
      "--color-rose": "#DC2626",
      "--theme-grid-dot": "rgba(28, 27, 23, 0.1)",
      "--theme-grain-opacity": "0.012",
    },
  },
} as const;

function canUseDom(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function isThemeName(value: unknown): value is ThemeName {
  return value === "dark" || value === "light";
}

export function getStoredTheme(): ThemeName | null {
  if (!canUseDom()) {
    return null;
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeName(storedTheme) ? storedTheme : null;
  } catch {
    return null;
  }
}

export function getInitialTheme(): ThemeName {
  return getStoredTheme() ?? DEFAULT_THEME;
}

export function applyTheme(
  theme: ThemeName,
  options: {
    readonly persist?: boolean;
    readonly broadcast?: boolean;
  } = {}
): void {
  if (!canUseDom()) {
    return;
  }

  const { persist = true, broadcast = true } = options;
  const definition = THEME_DEFINITIONS[theme];
  const root = document.documentElement;

  root.dataset.theme = theme;
  root.style.colorScheme = definition.colorScheme;
  root.classList.toggle("dark", definition.colorScheme === "dark");

  for (const [variable, value] of Object.entries(definition.variables)) {
    root.style.setProperty(variable, value);
  }

  window.__MF_THEME__ = {
    getTheme: () => theme,
    setTheme: (nextTheme) => applyTheme(nextTheme),
  };

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures so theme changes still work in memory.
    }
  }

  if (broadcast) {
    window.dispatchEvent(
      new CustomEvent("themeChange", {
        detail: {
          theme,
          colorScheme: definition.colorScheme,
        },
      })
    );
  }
}

export function initializeTheme(): ThemeName {
  const theme = getInitialTheme();
  applyTheme(theme, { persist: false, broadcast: false });
  return theme;
}