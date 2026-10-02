"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "theme";

export const THEME_OPTIONS = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

/**
 * Runs before paint (inlined in <head>) so the stored preference or OS theme
 * resolves without a flash. ThemeProvider keeps it in sync after hydration.
 */
export const THEME_INIT_SCRIPT = `(function(){var p='system';try{var s=localStorage.getItem('${STORAGE_KEY}');if(s==='light'||s==='dark')p=s;}catch(e){}try{document.documentElement.dataset.theme=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

const ThemeContext = createContext<{
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (p: ThemePreference) => void;
}>({ preference: "system", resolved: "dark", setPreference: () => {} });

function resolve(p: ThemePreference): "light" | "dark" {
  if (p !== "system") return p;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPref] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  useEffect(() => {
    let stored: ThemePreference = "system";
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s === "light" || s === "dark") stored = s;
    } catch {
      // storage unavailable: follow the OS
    }
    setPref(stored);
  }, []);

  useEffect(() => {
    const apply = () => {
      const r = resolve(preference);
      document.documentElement.dataset.theme = r;
      setResolved(r);
    };
    apply();
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [preference]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPref(p);
    try {
      if (p === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, p);
    } catch {
      // non-persistent is fine
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
