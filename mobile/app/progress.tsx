import { useCallback, useState } from "react";
import { Pressable, Share, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Text } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { AppHeader } from "@/components/AppHeader";
import { TerrifitMark } from "@/components/TerrifitMark";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";
import { getCoaching } from "@/api";
import { useEndpoint } from "@/data";
import { usePreferences } from "@/preferences";
import { coachingCopy } from "@/i18n/coaching";
import { display, fonts, theme } from "@/theme";

export default function ProgressScreen() {
  const { locale } = usePreferences();
  const c = coachingCopy(locale);
  const router = useRouter();
  const state = useEndpoint(getCoaching);
  useFocusEffect(useCallback(() => { state.reload(); }, [state.reload]));
  const [error, setError] = useState("");
  const p = state.data?.progress;
  const weekEnd = state.data?.day ?? "";
  const shareText = p ? locale === "ar" ? `أسبوعي في TERRIFIT · ${weekEnd}\n${p.sessions} جلسات مكتملة · ${p.activeDays} أيام نشطة\nكل جلسة تُحسب.\nhttps://terrifit.com/ar/app?source=weekly-share` : `My TERRIFIT week · ${weekEnd}\n${p.sessions} completed sessions · ${p.activeDays} active days\nEvery session counts.\nhttps://terrifit.com/en/app?source=weekly-share` : "";
  async function share() { setError(""); try { await Share.share({message:shareText}); } catch { setError(c.error); } }
  return <Screen title={c.progress} eyebrow={c.week} header={<AppHeader/>} refreshing={state.refreshing} onRefresh={state.reload} titleAction={<Pressable accessibilityRole="button" onPress={() => router.back()} style={s.back}><Text style={s.link}>{c.back}</Text></Pressable>}>
    <Text style={s.title}>{c.weekTitle}</Text><Text style={s.body}>{c.weekBody}</Text>
    {state.loading && !p ? <TerrifitSpinner style={{marginTop:30}}/> : null}
    {state.error ? <Text accessibilityRole="alert" style={s.error}>{state.error}</Text> : null}
    {p ? <>
      <View style={s.card}><View style={s.brand}><TerrifitMark size={17}/><Text style={s.word}>TERRIFIT</Text><Text style={s.date}>{weekEnd}</Text></View><View style={s.stats}><Stat value={p.sessions} label={c.sessions}/><Stat value={p.activeDays} label={c.activeDays}/><Stat value={p.minutes} label={c.trainingTime}/></View><View style={s.days}>{p.days.map(day => <View key={day.date} style={s.day}><View accessibilityLabel={`${day.date}: ${day.sessions} ${c.sessions}`} style={[s.dot,day.sessions>0&&s.dotOn]}><Text style={[s.dotText,day.sessions>0&&{color:theme.bg}]}>{day.sessions>0?"✓":"·"}</Text></View><Text style={s.dayLabel}>{new Date(`${day.date}T12:00:00Z`).toLocaleDateString(locale,{weekday:"narrow",timeZone:"UTC"})}</Text></View>)}</View></View>
      {p.sessions === 0 ? <View style={s.empty}><Text style={s.emptyTitle}>{c.noWork}</Text><Text style={s.body}>{c.noWorkBody}</Text><Pressable accessibilityRole="button" style={s.button} onPress={() => router.push("/maps" as never)}><Text style={s.buttonText}>{c.choose}</Text></Pressable></View> : <View style={s.share}><Text style={s.label}>{c.sharePreview}</Text><Text style={s.preview}>{shareText}</Text><Text style={s.note}>{c.privacy}</Text><Pressable accessibilityRole="button" style={s.button} onPress={() => void share()}><Text style={s.buttonText}>{c.share} ↗</Text></Pressable></View>}
    </> : null}
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    <Pressable accessibilityRole="button" style={s.row} onPress={() => router.push("/(tabs)/trends" as never)}><Text style={s.link}>{c.more}</Text><Text style={s.link}>↗</Text></Pressable><Pressable accessibilityRole="button" style={s.row} onPress={() => router.push("/(tabs)/body" as never)}><Text style={s.link}>{c.body}</Text><Text style={s.link}>↗</Text></Pressable>
  </Screen>;
}
function Stat({value,label}:{value:number;label:string}) { return <View style={s.stat}><Text style={s.number}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>; }
const s = StyleSheet.create({
  title:{fontFamily:display,color:theme.ink,fontSize:31,lineHeight:38,textTransform:"uppercase",marginTop:10},body:{color:theme.ink2,fontSize:13,lineHeight:21,marginTop:10,marginBottom:22},card:{backgroundColor:theme.surface,borderColor:theme.accentLine,borderWidth:1,borderRadius:22,padding:18,marginBottom:20},brand:{flexDirection:"row",alignItems:"center",gap:7},word:{fontFamily:fonts.black,fontSize:12,letterSpacing:2,color:theme.ink},date:{marginLeft:"auto",fontSize:10,color:theme.muted},stats:{flexDirection:"row",gap:10,paddingVertical:28},stat:{flex:1},number:{fontFamily:display,color:theme.accent,fontSize:42},statLabel:{fontSize:10,color:theme.ink2,marginTop:6},days:{flexDirection:"row",justifyContent:"space-between",gap:5,paddingTop:16,borderTopWidth:1,borderTopColor:theme.line},day:{alignItems:"center",flex:1,gap:9},dot:{width:32,height:32,borderRadius:16,borderWidth:1,borderColor:theme.lineStrong,alignItems:"center",justifyContent:"center"},dotOn:{backgroundColor:theme.accent,borderColor:theme.accent},dotText:{color:theme.muted,fontSize:17},dayLabel:{fontSize:10,color:theme.ink2},share:{padding:18,borderWidth:1,borderColor:theme.line,borderRadius:22,marginBottom:24},label:{fontSize:10,fontFamily:fonts.bold,color:theme.accent,textTransform:"uppercase",letterSpacing:1},preview:{fontSize:13,color:theme.ink,lineHeight:22,marginVertical:16},note:{color:theme.muted,fontSize:11,lineHeight:18},button:{backgroundColor:theme.accent,minHeight:50,alignItems:"center",justifyContent:"center",borderRadius:25,padding:12,marginTop:18},buttonText:{fontSize:12,fontFamily:fonts.bold,color:"#fff"},empty:{marginBottom:24},emptyTitle:{fontFamily:fonts.bold,fontSize:17,color:theme.ink},row:{minHeight:58,borderTopWidth:1,borderTopColor:theme.line,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},link:{fontFamily:fonts.semibold,color:theme.ink2,fontSize:13},error:{color:theme.poor,fontSize:12,marginBottom:15},back:{minHeight:44,paddingHorizontal:12,justifyContent:"center"},
});
