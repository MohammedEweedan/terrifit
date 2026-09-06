import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "./AppText";
import { useRouter } from "expo-router";
import { TerrifitMark } from "./TerrifitMark";
import { usePreferences } from "@/preferences";
import { coachingCopy } from "@/i18n/coaching";
import { display, fonts, theme } from "@/theme";
import type { CoachingDashboard } from "@/api";

export function CoachingCard({ data }: { data: CoachingDashboard }) {
  const router = useRouter();
  const c = coachingCopy(usePreferences().locale);
  const next = data.next;
  const session = data.applied?.session ?? next?.session;
  const paused = data.applied?.kind === "rest";
  return <View style={s.card}>
    <View style={s.top}><Text style={s.kicker}>{c.next}</Text><View style={s.coach}><TerrifitMark size={12}/><Text style={s.coachText}>{c.coach}</Text></View></View>
    <Text style={s.title}>{paused ? c.paused : session?.name ?? c.empty}</Text>
    <Text style={s.meta}>{next && session ? `${next.mapName} · ${c.weekLabel} ${next.week} · ${session.minutes} ${c.minutes}` : c.emptyBody}</Text>
    {data.applied ? <Text style={s.saved}>{c.applied}</Text> : null}
    <View style={s.actions}>
      <Pressable accessibilityRole="button" onPress={() => router.push((!next ? "/maps" : paused ? "/coach" : `/session/${next.mapId}/${next.session.id}`) as never)} style={s.primary}><Text style={s.primaryText}>{!next ? c.choose : paused ? c.review : c.start}</Text><Text style={s.arrow}>↗</Text></Pressable>
      {next && !paused ? <Pressable accessibilityRole="button" onPress={() => router.push("/coach" as never)} style={s.secondary}><Text style={s.secondaryText}>{c.adjust}</Text></Pressable> : null}
    </View>
  </View>;
}
const s = StyleSheet.create({
  card:{borderWidth:1,borderColor:theme.accentLine,backgroundColor:theme.surface,borderRadius:22,padding:18,marginBottom:14,overflow:"hidden"},
  top:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},kicker:{fontFamily:fonts.bold,color:theme.accent,fontSize:10,letterSpacing:1.2,textTransform:"uppercase"},
  coach:{flexDirection:"row",gap:5,alignItems:"center"},coachText:{color:theme.ink2,fontSize:11,fontFamily:fonts.medium},
  title:{fontFamily:display,fontSize:29,lineHeight:36,color:theme.ink,textTransform:"uppercase",marginTop:14},meta:{color:theme.ink2,fontSize:12,lineHeight:19,marginTop:5},
  saved:{color:theme.good,fontSize:12,marginTop:8},actions:{gap:7,marginTop:17},primary:{minHeight:48,backgroundColor:theme.accent,borderRadius:24,paddingHorizontal:18,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},primaryText:{fontFamily:fonts.bold,color:"#fff",fontSize:12},arrow:{color:"#fff",fontSize:19},secondary:{minHeight:40,alignItems:"center",justifyContent:"center"},secondaryText:{fontFamily:fonts.semibold,color:theme.ink2,fontSize:12},
});
