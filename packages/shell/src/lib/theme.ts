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
 * Theming is shadcn's: every colour comes from the semantic tokens defined in
 * `index.css` (`--background`, `--foreground`, `--primary`, `--muted`, …), and
 * switching theme is nothing more than toggling the `.dark` class on <html>,
 * which is what the `.dark { … }` block in that stylesheet keys off.
 *
 * `variables` therefore must NOT contain colour tokens. Anything named
 * `--color-*`, `--background`, `--primary`, etc. would shadow shadcn's own
 * definitions and desynchronise the palette from the components. The only
 * entries here are non-shadcn decorative values that have no semantic token.
 */
export const THEME_DEFINITIONS: Readonly<Record<ThemeName, ThemeDefinition>> = {
  dark: {
    label: "Dark",
    description: "shadcn neutral dark.",
    colorScheme: "dark",
    variables: {
      // Dot colour for the decorative background grid in App.tsx. Not a
      // shadcn token — there is no semantic token for a decorative pattern.
      "--theme-grid-dot": "rgba(250, 250, 249, 0.5)",
    },
  },
  light: {
    label: "Light",
    description: "shadcn neutral light.",
    colorScheme: "light",
    variables: {
      "--theme-grid-dot": "rgba(28, 27, 23, 0.1)",
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