import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type FontSize = "sm" | "md" | "lg";

type ThemeValue = {
  theme: Theme;
  fontSize: FontSize;
  setTheme: (t: Theme) => void;
  setFontSize: (f: FontSize) => void;
};

const ThemeContext = createContext<ThemeValue>({
  theme: "dark",
  fontSize: "md",
  setTheme: () => {},
  setFontSize: () => {},
});

function apply(theme: Theme, fontSize: FontSize) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  root.classList.remove("fs-sm", "fs-md", "fs-lg");
  root.classList.add(`fs-${fontSize}`);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [fontSize, setFontSizeState] = useState<FontSize>("md");

  useEffect(() => {
    apply(theme, fontSize);
  }, [theme, fontSize]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const setFontSize = useCallback((f: FontSize) => setFontSizeState(f), []);

  return (
    <ThemeContext.Provider value={{ theme, fontSize, setTheme, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
