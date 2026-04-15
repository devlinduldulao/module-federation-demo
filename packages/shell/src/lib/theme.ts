export type ThemeName = "dark" | "dim" | "light";

type ThemeColorScheme = "dark" | "light";

interface ThemeDefinition {
  readonly label: string;
  readonly description: string;
  readonly colorScheme: ThemeColorScheme;
  readonly variables: Readonly<Record<string, string>>;
}

export const THEME_STORAGE_KEY = "mf-demo-theme";
export const DEFAULT_THEME: ThemeName = "dark";

export const THEME_DEFINITIONS: Readonly<Record<ThemeName, ThemeDefinition>> = {
  dark: {
    label: "Dark",
    description: "High-contrast editorial dark mode.",
    colorScheme: "dark",
    variables: {
      "--color-ink": "#0C0C0C",
      "--color-noir": "#0C0C0C",
      "--color-surface": "#141414",
      "--color-elevated": "#1C1C1C",
      "--color-muted": "#252525",
      "--color-edge": "#2E2E2E",
      "--color-edge-bright": "#444444",
      "--color-cream": "#FAFAF9",
      "--color-stone": "#A8A29E",
      "--color-dim": "#6B6560",
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
  dim: {
    label: "Dim",
    description: "Softer dark mode with reduced glare.",
    colorScheme: "dark",
    variables: {
      "--color-ink": "#120F0D",
      "--color-noir": "#181412",
      "--color-surface": "#221C19",
      "--color-elevated": "#2B2420",
      "--color-muted": "#342C27",
      "--color-edge": "#433934",
      "--color-edge-bright": "#5E5149",
      "--color-cream": "#F1EBE3",
      "--color-stone": "#C2B5A6",
      "--color-dim": "#8D7F73",
      "--color-citrine": "#C8E55B",
      "--color-citrine-dim": "#9DAF49",
      "--color-burnt": "#F08A5B",
      "--color-ice": "#7DAFF5",
      "--color-mint": "#58C9A3",
      "--color-rose": "#F28A8A",
      "--theme-grid-dot": "rgba(241, 235, 227, 0.34)",
      "--theme-grain-opacity": "0.02",
    },
  },
  light: {
    label: "Light",
    description: "Warm paper light theme with dark editorial text.",
    colorScheme: "light",
    variables: {
      "--color-ink": "#11100D",
      "--color-noir": "#F3EEE3",
      "--color-surface": "#E8DFD1",
      "--color-elevated": "#DDD0BE",
      "--color-muted": "#D2C1AA",
      "--color-edge": "#C5B39A",
      "--color-edge-bright": "#9F8B70",
      "--color-cream": "#1F1B16",
      "--color-stone": "#5F5447",
      "--color-dim": "#7C6E5C",
      "--color-citrine": "#B9D133",
      "--color-citrine-dim": "#95A81F",
      "--color-burnt": "#C76333",
      "--color-ice": "#2F70C9",
      "--color-mint": "#197C66",
      "--color-rose": "#C15C5C",
      "--theme-grid-dot": "rgba(31, 27, 22, 0.16)",
      "--theme-grain-opacity": "0.012",
    },
  },
} as const;

function canUseDom(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function isThemeName(value: unknown): value is ThemeName {
  return value === "dark" || value === "dim" || value === "light";
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