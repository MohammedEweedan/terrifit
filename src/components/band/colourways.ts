/** Shared by the interactive model, render gallery and catalogue seeds. */
export const BAND_FINISHES = [
  { id: "ember", label: "Ember", yarn: "#f66b2b", weave: "#23201e", accent: "#ff6a2a" },
  { id: "midnight", label: "Midnight", yarn: "#283d63", weave: "#111923", accent: "#829ac3" },
  { id: "graphite", label: "Graphite", yarn: "#858990", weave: "#43474d", accent: "#a6abb2" },
  { id: "black", label: "Black", yarn: "#252629", weave: "#101113", accent: "#b8babd" },
  { id: "bubblegum", label: "Bubblegum", yarn: "#f573b0", weave: "#efe7e6", accent: "#ff7ab8" },
  { id: "olive", label: "Olive", yarn: "#777b54", weave: "#393e2a", accent: "#929b70" },
  { id: "sandstone", label: "Sandstone", yarn: "#c7b69b", weave: "#e6ddce", accent: "#c8b99d" },
] as const;

export type BandFinish = (typeof BAND_FINISHES)[number];
export const bandFinish = (id: string) => BAND_FINISHES.find(finish => finish.id === id) ?? BAND_FINISHES[0];
export const bandRender = (id: string) => `/media/band/colourways-v2/${bandFinish(id).id}.png`;
