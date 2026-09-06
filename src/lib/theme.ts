export const THEME_KEY = "ryvn.theme";
export type Theme = "light" | "dark";
const CHANGE_EVENT = "terrifit:theme";

/** Resolve the full palette before paint, including an OS-selected theme. */
export const themeScript = `(function(){var d=document.documentElement;d.classList.add("js");var t;try{t=localStorage.getItem("${THEME_KEY}")}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}d.setAttribute("data-theme",t);d.style.colorScheme=t})();`;

export function getTheme(): Theme { return document.documentElement.dataset.theme === "light" ? "light" : "dark"; }
export function getServerTheme(): Theme { return "dark"; }
export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* The in-memory choice still works. */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
export function subscribeTheme(listener: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: light)");
  function applyExternal() {
    let choice: string | null = null;
    try { choice = localStorage.getItem(THEME_KEY); } catch { /* Respect the OS when storage is unavailable. */ }
    const theme = choice === "dark" || choice === "light" ? choice : media.matches ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    listener();
  }
  const storage = (event: StorageEvent) => { if (event.key === THEME_KEY || event.key === null) applyExternal(); };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", storage);
  media.addEventListener("change", applyExternal);
  return () => { window.removeEventListener(CHANGE_EVENT, listener); window.removeEventListener("storage", storage); media.removeEventListener("change", applyExternal); };
}
