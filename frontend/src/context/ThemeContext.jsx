import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('trackyourwork_theme') || 'system';
  });

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('trackyourwork_theme') || 'system';
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme() {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const effectiveDark =
        theme === 'dark' ||
        ((theme === 'system' || theme === 'auto') && prefersDark);

      if (effectiveDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
        setIsDark(true);
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
        setIsDark(false);
      }
    }

    applyTheme();
    try {
      localStorage.setItem('trackyourwork_theme', theme);
    } catch (e) {
      console.warn('Failed to save theme in localStorage', e);
    }

    if (theme === 'system' || theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
