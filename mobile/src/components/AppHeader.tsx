import { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { TerrifitMark } from "./TerrifitMark";
import { useScrollY } from "@/scroll";
import { useAppState } from "@/app-state";
import { theme } from "@/theme";
import { OrderTrackButton } from "./OrderTrackButton";
import { CoachButton } from "./CoachButton";
import { useOrders } from "@/data";

/** Scroll distance at which the wordmark has finished fading and comes out. */
const COLLAPSE_AT = 56;

export function AppHeader({ unread = 0 }: { unread?: number }) {
  const router=useRouter();
  const scrollY=useScrollY();
  const {isPro}=useAppState();
  // Drives whether the Coach shows its label or just its mark.
  const activeOrders=useOrders().data?.active??0;
  function openSignal(){router.push("/signal" as never)}
  // Past a screen's worth of thumb travel the wordmark has served its purpose:
  // it collapses to nothing and the mark alone holds the position under the
  // camera housing, which is where the eye already expects a brand to sit.
  // The word fades on the native driver, then unmounts. Opacity alone is not
  // enough: an invisible child still occupies layout, so the button kept the
  // full lockup's width and lit up an empty rectangle where the text had been.
  // Unmounting also re-centres the mark for free, because the container that
  // holds it is already centred.
  const [collapsed,setCollapsed]=useState(false);
  useEffect(()=>{
    if(!scrollY)return;
    const id=scrollY.addListener(({value})=>setCollapsed(value>COLLAPSE_AT));
    return ()=>scrollY.removeListener(id);
  },[scrollY]);
  const wordOpacity=scrollY?scrollY.interpolate({inputRange:[0,24,COLLAPSE_AT],outputRange:[1,1,0],extrapolate:"clamp"}):1;
  return <View style={s.row}>
    {/* The left slot holds the things you might want to jump straight to:
        an order in flight, and the Coach. When both are present the Coach
        drops to its icon so the pair still fits beside the wordmark. */}
    <View style={[s.spacer, s.leftSlot]}>
      <OrderTrackButton />
      <CoachButton compact={activeOrders > 0} />
    </View>
    <View pointerEvents="box-none" style={s.centre}>
      <Pressable accessibilityRole="button" accessibilityLabel="Your daily signal" onPress={openSignal} style={s.brand}><TerrifitMark size={17} colour={isPro?theme.ink:undefined}/>{isPro?<Text style={s.pro}>PRO</Text>:collapsed?null:<Animated.View style={{opacity:wordOpacity}}><Text numberOfLines={1} style={s.word}>TERRIFIT</Text></Animated.View>}</Pressable>
    </View>
    <View style={s.rightIcons}>
    <Pressable accessibilityLabel="Notifications" style={s.icon} onPress={()=>router.push("/notifications" as never)}><Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M6.5 10a5.5 5.5 0 0 1 11 0v4l2 3H4.5l2-3v-4ZM10 20h4" stroke={theme.ink} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round"/></Svg>{unread>0?<View style={s.badge}><Text style={s.badgeText}>{unread>9?"9+":unread}</Text></View>:null}</Pressable>
    </View>
  </View>;
}

const s=StyleSheet.create({
  centre:{position:"absolute",left:0,right:0,top:0,bottom:0,alignItems:"center",justifyContent:"center"},
  spacer:{width:40,alignItems:"flex-start",justifyContent:"center"},
  leftSlot:{width:"auto",flexDirection:"row",alignItems:"center",gap:7},
  orders:{width:36,height:36,borderRadius:18,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:theme.accent,backgroundColor:theme.accentSoft},
  orderCount:{position:"absolute",top:-2,right:-2,minWidth:16,height:16,borderRadius:8,paddingHorizontal:4,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center",borderWidth:1.5,borderColor:theme.bg},
  orderCountText:{color:"#fff",fontSize:9,fontWeight:"900"},
  pro:{color:theme.accent,fontSize:13,fontWeight:"900",letterSpacing:4},
  rightIcons:{flexDirection:"row",alignItems:"center",gap:8},
  row:{height:48,flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:12},
  icon:{width:40,height:40,borderRadius:20,borderWidth:1,borderColor:theme.line,backgroundColor:theme.surface,alignItems:"center",justifyContent:"center"},
  brand:{height:36,flexDirection:"row",alignItems:"center",gap:7,paddingHorizontal:10},word:{color:theme.ink,fontSize:13,fontWeight:"900",letterSpacing:2.4},
  badge:{position:"absolute",top:-2,right:-2,minWidth:16,height:16,borderRadius:8,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center",paddingHorizontal:3,borderWidth:2,borderColor:theme.bg},badgeText:{color:"#fff",fontSize:10,fontWeight:"900"},
});
