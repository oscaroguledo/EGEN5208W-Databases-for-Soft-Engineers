import React, { useEffect, useState, createContext, useContext } from 'react';
type Theme = 'light' | 'dark';
interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {}
});
export function useTheme() {
  return useContext(ThemeContext);
}
interface ThemeProviderProps {
  children: React.ReactNode;
}
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem('fitclub-theme') as Theme || 'light';
    } catch {
      return 'light';
    }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('fitclub-theme', theme);
    } catch {}
  }, [theme]);
  const toggleTheme = () => setTheme((t) => t === 'light' ? 'dark' : 'light');
  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme
      }}>

      {children}
    </ThemeContext.Provider>);

}