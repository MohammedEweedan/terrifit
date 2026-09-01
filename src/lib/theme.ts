export const THEME_KEY = "ryvn.theme";

/**
 * Runs before first paint. Two jobs:
 *  - applies a stored theme, so a dark-first site never flashes light;
 *  - marks the document as JS-capable, which is what arms the scroll reveals.
 *    Without it the reveals stay inert and every section renders immediately.
 */
export const themeScript = `(function(){var d=document.documentElement;d.classList.add("js");try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark"){d.setAttribute("data-theme",t)}}catch(e){}})();`;
