import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabIcon, type TabName } from "./TabIcon";
import { theme } from "@/theme";
import { usePreferences } from "@/preferences";

const visible:Record<string,{label:"home"|"maps"|"fuel"|"you"|"v1";icon:TabName}>={index:{label:"home",icon:"home"},maps:{label:"maps",icon:"maps"},band:{label:"v1",icon:"band"},shop:{label:"fuel",icon:"shop"},profile:{label:"you",icon:"profile"}};

type TabRoute={key:string;name:string;params?:object};
type TabBarProps={
  state:{routes:TabRoute[];index:number};
  descriptors:Record<string,{options:{tabBarAccessibilityLabel?:string}}>;
  navigation:{emit:(event:{type:string;target:string;canPreventDefault?:boolean})=>{defaultPrevented?:boolean};navigate:(name:string,params?:object)=>void};
};

export function PremiumTabBar(props:object){
  const {state,descriptors,navigation}=props as TabBarProps;
  const {t}=usePreferences();
  const insets=useSafeAreaInsets();const routes=state.routes.filter(route=>visible[route.name]);
  return <View pointerEvents="box-none" style={[s.frame,{paddingBottom:Math.max(insets.bottom,8)}]}><View style={s.bar}>{routes.map(route=>{const index=state.routes.findIndex(item=>item.key===route.key);const focused=state.index===index;const isBand=route.name==="band";const item=visible[route.name];const options=descriptors[route.key].options;const label=item.label==="v1"?"V1":t(item.label);function go(){const event=navigation.emit({type:"tabPress",target:route.key,canPreventDefault:true});if(!focused&&!event.defaultPrevented)navigation.navigate(route.name,route.params)}return <Pressable key={route.key} accessibilityRole="button" accessibilityState={focused?{selected:true}:{}} accessibilityLabel={options.tabBarAccessibilityLabel??label} onPress={go} onLongPress={()=>navigation.emit({type:"tabLongPress",target:route.key})} style={s.item}><View style={[s.iconBox,focused&&s.iconBoxOn,isBand&&s.bandBox]}><TabIcon name={item.icon} colour={focused||isBand?theme.accent:theme.muted}/></View><Text numberOfLines={1} style={[s.label,(focused||isBand)&&s.labelOn]}>{label}</Text>{focused?<View style={s.dot}/>:null}</Pressable>})}</View></View>;
}
const s=StyleSheet.create({
  frame:{position:"absolute",left:12,right:12,bottom:0},bar:{height:72,borderRadius:28,borderWidth:1,borderColor:"rgba(255,90,31,0.42)",backgroundColor:theme.surface,flexDirection:"row",alignItems:"center",paddingHorizontal:7,shadowColor:"#000",shadowOpacity:.25,shadowRadius:24,shadowOffset:{width:0,height:12},elevation:18},item:{flex:1,height:64,alignItems:"center",justifyContent:"center",gap:3},iconBox:{width:38,height:34,borderRadius:13,alignItems:"center",justifyContent:"center"},iconBoxOn:{backgroundColor:theme.accentSoft},bandBox:{borderWidth:1,borderColor:theme.accent},label:{color:theme.muted,fontSize:10,fontWeight:"900",letterSpacing:.5,textTransform:"uppercase"},labelOn:{color:theme.accent},dot:{position:"absolute",bottom:2,width:3,height:3,borderRadius:2,backgroundColor:theme.accent},
});
