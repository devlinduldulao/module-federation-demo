import { useEffect, useState } from "react";

export type ThemeName = "dark" | "light";

const THEME_STORAGE_KEY = "mf-demo-theme";

const THEME_LABELS: Record<ThemeName, string> = {
  dark: "Dark",
  light: "Light",
};

function isThemeName(value: unknown): value is ThemeName {
  return value === "dark" || value === "light";
}

function getThemeFromHost(): ThemeName {
  try {
    const hostTheme = window.__MF_THEME__?.getTheme();
    if (isThemeName(hostTheme)) {
      return hostTheme;
    }

    const storedTheme = window.localStorage?.getItem(THEME_STORAGE_KEY);
    return isThemeName(storedTheme) ? storedTheme : "dark";
  } catch {
    return "dark";
  }
}

export function useActiveTheme() {
  const [theme, setTheme] = useState<ThemeName>(() => getThemeFromHost());

  useEffect(() => {
    const handleThemeChange = (event: WindowEventMap["themeChange"]) => {
      setTheme(event.detail.theme);
    };

    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  return {
    theme,
    label: THEME_LABELS[theme],
  };
}
