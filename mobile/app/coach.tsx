import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { AppHeader } from "@/components/AppHeader";
import { TerrifitSpinner } from "@/components/TerrifitSpinner";
import { TerrifitMark } from "@/components/TerrifitMark";
import { ApiError, getCoaching, updateCoaching, type CoachingProposal } from "@/api";
import { useEndpoint } from "@/data";
import { useSession } from "@/session";
import { usePreferences } from "@/preferences";
import { coachingCopy } from "@/i18n/coaching";
import { fonts, display, theme } from "@/theme";

export default function CoachScreen() {
  const c = coachingCopy(usePreferences().locale);
  const router = useRouter();
  const { token } = useSession();
  const state = useEndpoint(getCoaching);
  useFocusEffect(useCallback(() => { state.reload(); }, [state.reload]));
  const [minutes, setMinutes] = useState(35);
  const [feeling, setFeeling] = useState<CoachingProposal["checkIn"]["feeling"]>("ready");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const data = state.data;
  async function change(action: "propose" | "apply" | "undo") {
    if (!token || !data || busy) return;
    setBusy(true); setError("");
    try { state.set(await updateCoaching(token, data, action, action === "propose" ? { minutes, feeling } : undefined)); }
    catch (e) { setError(e instanceof ApiError ? e.detail || c.error : c.error); if (e instanceof ApiError && e.status === 409) state.reload(); }
    finally { setBusy(false); }
  }
  const draft = data?.draft;
  return <Screen title={c.coach} eyebrow={c.guided} header={<AppHeader/>} refreshing={state.refreshing} onRefresh={state.reload} titleAction={<Pressable accessibilityRole="button" onPress={() => router.back()} style={s.back}><Text style={s.backText}>{c.back}</Text></Pressable>}>
    <View style={s.intro}><TerrifitMark size={24}/><Text style={s.headline}>{c.title}</Text><Text style={s.body}>{c.intro}</Text></View>
    {state.loading && !data ? <TerrifitSpinner/> : null}
    {state.error ? <Text accessibilityRole="alert" style={s.error}>{state.error}</Text> : null}
    {data && !data.next ? <View style={s.card}><Text style={s.heading}>{c.empty}</Text><Text style={s.body}>{c.emptyBody}</Text><Action label={c.choose} onPress={() => router.push("/maps" as never)}/></View> : null}
    {data?.next ? <>
      <View style={s.session}><Text style={s.label}>{c.next}</Text><Text style={s.heading}>{data.next.session.name}</Text><Text style={s.body}>{data.next.mapName} · {data.next.session.minutes} {c.minutes}</Text></View>
      {data.applied ? <View style={[s.card, {borderColor:theme.good}]}><Text style={[s.heading,{color:theme.good}]}>{c.applied}</Text><Text style={s.body}>{data.applied.kind === "rest" ? c.restBody : c.savedBody}</Text><Action label={c.undo} secondary disabled={busy} onPress={() => void change("undo")}/></View> : null}
      <View style={s.card}><Text style={s.label}>{c.time}</Text><View style={s.chips}>{[20,35,50,75].map(value => <Choice key={value} label={`${value} ${c.minutes}`} selected={minutes === value} disabled={busy} onPress={() => setMinutes(value)}/>)}</View><Text style={[s.label,{marginTop:24}]}>{c.feeling}</Text><View style={s.chips}>{([['ready',c.ready],['tired',c.tired],['pain',c.pain]] as const).map(([value,label]) => <Choice key={value} label={label} selected={feeling === value} disabled={busy} onPress={() => setFeeling(value)}/>)}</View><Action label={busy ? c.working : c.propose} disabled={busy} onPress={() => void change("propose")}/></View>
      {draft ? <View style={[s.card,{borderColor:theme.accentLine}]} accessibilityLiveRegion="polite"><Text style={s.label}>{c.review}</Text><Text style={s.headline}>{draft.title}</Text><View style={s.compare}><View style={s.compareItem}><Text style={s.label}>{c.original}</Text><Text style={s.number}>{draft.originalMinutes}<Text style={s.unit}> {c.minutes}</Text></Text><Text style={s.body}>{data.next.session.exercises.length} {c.exercises}</Text></View><Text style={s.compareArrow}>→</Text><View style={s.compareItem}><Text style={s.label}>{c.proposed}</Text><Text style={[s.number,{color:theme.accent}]}>{draft.session ? draft.session.minutes : "—"}<Text style={s.unit}>{draft.session ? ` ${c.minutes}` : ""}</Text></Text><Text style={s.body}>{draft.session ? `${draft.session.exercises.length} ${c.exercises}` : c.paused}</Text></View></View><Text style={s.label}>{c.explain}</Text><Text style={s.body}>{draft.reason}</Text><Text style={[s.label,{marginTop:20}]}>{c.keeps}</Text>{draft.changes.map(line => <Text key={line} style={s.body}>• {line}</Text>)}<Action label={busy ? c.working : c.apply} disabled={busy} onPress={() => void change("apply")}/></View> : null}
    </> : null}
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    <Text style={s.note}>{c.method}</Text>
  </Screen>;
}
function Choice({label,selected,disabled,onPress}:{label:string;selected:boolean;disabled:boolean;onPress:()=>void}) { return <Pressable accessibilityRole="button" accessibilityState={{selected,disabled}} disabled={disabled} onPress={onPress} style={[s.chip,selected&&s.chipOn]}><Text style={[s.chipText,selected&&{color:theme.accent}]}>{label}</Text></Pressable>; }
function Action({label,onPress,disabled,secondary}:{label:string;onPress:()=>void;disabled?:boolean;secondary?:boolean}) { return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.action,secondary&&s.actionSecondary,disabled&&{opacity:.5}]}><Text style={[s.actionText,secondary&&{color:theme.ink}]}>{label}</Text></Pressable>; }
const s = StyleSheet.create({
  intro:{paddingTop:8,paddingBottom:26},headline:{fontFamily:display,fontSize:30,lineHeight:38,textTransform:"uppercase",color:theme.ink,marginTop:12},body:{color:theme.ink2,fontSize:13,lineHeight:21,marginTop:7},
  card:{borderRadius:22,borderWidth:1,borderColor:theme.line,backgroundColor:theme.surface,padding:18,marginBottom:16},session:{padding:18,marginBottom:16,borderLeftWidth:3,borderLeftColor:theme.accent},label:{color:theme.accent,fontFamily:fonts.bold,fontSize:10,letterSpacing:1.2,textTransform:"uppercase"},heading:{fontFamily:fonts.bold,fontSize:17,lineHeight:24,color:theme.ink,marginTop:7},
  chips:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:12},chip:{minHeight:44,paddingHorizontal:13,justifyContent:"center",borderWidth:1,borderColor:theme.lineStrong,borderRadius:22},chipOn:{borderColor:theme.accent,backgroundColor:theme.accentSoft},chipText:{fontFamily:fonts.semibold,color:theme.ink2,fontSize:12},action:{minHeight:50,padding:12,backgroundColor:theme.accent,borderRadius:25,alignItems:"center",justifyContent:"center",marginTop:22},actionSecondary:{backgroundColor:theme.raised,borderColor:theme.lineStrong,borderWidth:1},actionText:{color:"#fff",fontFamily:fonts.bold,fontSize:12},compare:{flexDirection:"row",alignItems:"center",paddingVertical:24,gap:12},compareItem:{flex:1},compareArrow:{color:theme.muted,fontSize:24},number:{fontFamily:display,color:theme.ink,fontSize:42,marginTop:8},unit:{fontFamily:fonts.medium,fontSize:12,color:theme.ink2},note:{fontSize:11,lineHeight:18,color:theme.muted,marginTop:5},error:{color:theme.poor,fontSize:13,lineHeight:20,marginBottom:15},back:{minHeight:44,paddingHorizontal:12,justifyContent:"center"},backText:{color:theme.ink2,fontSize:12},
});
