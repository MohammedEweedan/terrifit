import Svg, { Circle, Path, Rect } from "react-native-svg";

export type TabName = "home" | "maps" | "band" | "shop" | "profile";

/**
 * Hand-drawn tab glyphs rather than an icon pack: three shapes, one stroke
 * weight, and nothing that looks like it came from someone else's app.
 */
export function TabIcon({ name, colour }: { name: TabName; colour: string }) {
  const props = { stroke: colour, strokeWidth: 1.8, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (name === "home") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path d="M3.5 10.5 12 3l8.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5Z" {...props}/>
        <Path d="M9 21v-6.5h6V21" {...props}/>
      </Svg>
    );
  }

  if (name === "maps") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z" {...props}/>
        <Circle cx={12} cy={9} r={2.3} {...props}/>
      </Svg>
    );
  }

  if (name === "band") return <Svg width={22} height={22} viewBox="0 0 24 24"><Rect x={7} y={2.5} width={10} height={19} rx={5} {...props}/><Rect x={9.5} y={7} width={5} height={10} rx={2.5} {...props}/><Circle cx={12} cy={14} r={.8} fill={colour}/></Svg>;
  if (name === "shop") return <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M5 8h14l-1 13H6L5 8Z" {...props}/><Path d="M9 9V6a3 3 0 0 1 6 0v3" {...props}/></Svg>;
  return <Svg width={22} height={22} viewBox="0 0 24 24"><Circle cx={12} cy={8} r={4} {...props}/><Path d="M4.5 21c.7-4.2 3.2-6.3 7.5-6.3s6.8 2.1 7.5 6.3" {...props}/></Svg>;
}
