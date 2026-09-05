export const THEME_KEY = "ryvn.theme";

/**
 * Runs before first paint. Two jobs:
 *  - applies a stored theme, so a dark-first site never flashes light;
 *  - marks the document as JS-capable, which is what arms the scroll reveals.
 *    Without it the reveals stay inert and every section renders immediately.
 *
 * It deliberately does *not* touch the accent. The colour picker on the app
 * page changes which app screenshot is shown and nothing else — the site keeps
 * Terrifit orange whatever somebody picks. An earlier version repainted the
 * site's own tokens too, which meant choosing Mint recoloured one section of
 * the landing page and left the rest orange: a picker that half-works reads as
 * a bug, and a brand that follows a preference is not a brand.
 */
export const themeScript = `(function(){var d=document.documentElement;d.classList.add("js");try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark"){d.setAttribute("data-theme",t)}}catch(e){}})();`;
