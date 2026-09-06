import {useEffect, useRef, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError, type ProfilePatch } from "@/api";
import { useSession } from "@/session";
import { useAppState } from "@/app-state";
import { TerrifitMark } from "@/components/TerrifitMark";
import { CountryPicker, CurrencyPicker } from "@/components/MarketPicker";
import { usePreferences } from "@/preferences";
import { arabicBlack, display, theme } from "@/theme";
import { Preferences } from "@/components/Preferences";

const GOALS=[
  ["strength","Get stronger","Build force, technique and confidence under load."],
  ["fat-loss","Lose body fat","Use training, recovery and nutrition as one system."],
  ["endurance","Build endurance","Go longer, recover faster and pace the work."],
  ["recomposition","Recompose","Add lean mass while bringing body fat down."],
  ["health","Feel better","More energy, better sleep and a body that lasts."],
] as const;
const ACTIVITIES=["Strength training","Running","Cycling","Swimming","HIIT","Walking","Team sports","Combat sports","Yoga / Pilates","CrossFit"];
const CONDITIONS=["None","Asthma","Diabetes","High blood pressure","Heart condition","Joint or back pain","Pregnancy / postpartum","Recent surgery","Other"];
const LEVELS=[
  ["sedentary","Starting fresh","Little structured activity right now."],
  ["light","Lightly active","One or two sessions most weeks."],
  ["moderate","Consistent","Three or four purposeful sessions."],
  ["high","Highly active","Five or six demanding sessions."],
  ["athlete","Athlete","Training is part of the job or identity."],
] as const;

/** Goal, schedule, health constraints, then a review. Appearance and baseline
 * details remain optional, using the existing screens and controls. */
const STEPS = [0, 3, 4, 7];
const FIRST_STEP = 0;
const LAST_STEP = 7;

type Form={goal:string;age:string;sex:string;units:"metric"|"imperial";height:string;weight:string;activities:string[];activityLevel:string;trainingDays:number;experience:string;conditions:string[];share:boolean;v1Mode:"real"|"demo"|"later"|null};

export default function OnboardingScreen(){
  const insets=useSafeAreaInsets(); const router=useRouter(); const {name}=useSession(); const {completeOnboarding}=useAppState();const preferences=usePreferences();
  const enter=useRef(new Animated.Value(1)).current;
  const [step,setStep]=useState(FIRST_STEP); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  const [countryOpen,setCountryOpen]=useState(false);const [currencyOpen,setCurrencyOpen]=useState(false);
  const [form,setForm]=useState<Form>({goal:"",age:"",sex:"undisclosed",units:"metric",height:"",weight:"",activities:[],activityLevel:"",trainingDays:3,experience:"new",conditions:[],share:false,v1Mode:null});
  const total=STEPS.length;
  const heightCm=form.units==="metric"?Number(form.height):Number(form.height)*2.54;
  const weightKg=form.units==="metric"?Number(form.weight):Number(form.weight)*0.453592;
  const basicsValid=Number(form.age)>=13&&Number(form.age)<=100&&heightCm>=80&&heightCm<=260&&weightKg>=25&&weightKg<=400;
  useEffect(()=>{enter.setValue(0);Animated.timing(enter,{toValue:1,duration:420,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start()},[step,enter]);
  const valid=useMemo(()=>{
    if(step===-2)return true;
    if(step===-1)return Boolean(preferences.countryCode);
    if(step===0)return Boolean(form.goal);
    if(step===1)return basicsValid;
    if(step===2)return form.activities.length>0;
    if(step===3)return Boolean(form.activityLevel);
    if(step===4)return form.conditions.length>0;
    if(step===6)return form.v1Mode!==null;
    return true;
  },[step,form,preferences.countryCode,basicsValid]);

  function toggle(key:"activities"|"conditions",value:string){setForm(current=>{let next=current[key].includes(value)?current[key].filter(x=>x!==value):[...current[key],value];if(key==="conditions"&&value==="None"&&!current[key].includes(value))next=["None"];else if(key==="conditions"&&value!=="None")next=next.filter(x=>x!=="None");return{...current,[key]:next};});}
  async function next(){if(!valid||busy)return;setError("");if(step<LAST_STEP){const index=STEPS.indexOf(step);setStep(index<0?LAST_STEP:STEPS[index+1]??LAST_STEP);return;}if((form.age||form.height||form.weight)&&!basicsValid){setStep(1);setError("Review your measurements, or skip them for now.");return;}setBusy(true);try{const age=Number(form.age);const birth=new Date(Date.UTC(new Date().getUTCFullYear()-age,0,1)).toISOString();const heightCm=form.units==="metric"?Number(form.height):Number(form.height)*2.54;const weightKg=form.units==="metric"?Number(form.weight):Number(form.weight)*0.453592;const patch:ProfilePatch={...(form.age?{dateOfBirth:birth}:{}),sex:form.sex,...(form.height?{heightCm:Math.round(heightCm*10)/10}:{}),...(form.weight?{weightKg:Math.round(weightKg*10)/10}:{}),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,units:form.units,goal:form.goal,activityLevel:form.activityLevel,trainingDays:form.trainingDays,experience:form.experience,activities:form.activities,healthConditions:form.conditions.filter(x=>x!=="None"),shareWithCreators:form.share,finishOnboarding:true};await completeOnboarding(patch);router.replace(form.v1Mode==="real"?"/pair-band" as never:"/" as never);}catch(caught){const detail=caught instanceof ApiError?caught.detail:null;setError(detail?`Check ${detail}.`:"We couldn’t save those details. Review the highlighted answers and try again.");setBusy(false);}}

  return <KeyboardAvoidingView style={s.flex} behavior={Platform.OS==="ios"?"padding":undefined}><View style={[s.shell,{paddingTop:insets.top+12,paddingBottom:Math.max(insets.bottom,16)}]}>
    <View style={s.top}><Pressable disabled={step===FIRST_STEP} onPress={()=>setStep(v=>STEPS.includes(v)?STEPS[Math.max(0,STEPS.indexOf(v)-1)]:LAST_STEP)}><Text style={[s.back,step===FIRST_STEP&&s.hidden]}>{preferences.t("back")}</Text></Pressable><TerrifitMark size={20}/><View style={s.topSpacer}/></View>
    <View style={s.track}>{Array.from({length:total},(_,i)=><View key={i} style={[s.tick,i<=Math.max(0,STEPS.indexOf(step))&&s.tickOn]}/>)}</View>
    <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Animated.View style={{opacity:enter,transform:[{translateY:enter.interpolate({inputRange:[0,1],outputRange:[16,0]})}]}}>
      {step===-2?<Step eyebrow={preferences.t("yourApp")} title={preferences.t("makeItYours")} body={preferences.t("preferencesIntro")}>
        <Preferences heading={false}/>
      </Step>:null}
      {step===-1?<Step eyebrow={preferences.t("market")} title={preferences.t("marketTitle")} body={preferences.t("marketBody")}>
        <Pressable onPress={()=>setCountryOpen(true)} style={s.marketChoice}><View><Text style={s.marketLabel}>{preferences.t("country")}</Text><Text style={s.marketValue}>{preferences.countryName()}</Text></View><Text style={s.marketArrow}>›</Text></Pressable>
        <Pressable disabled={!preferences.countryCode} onPress={()=>setCurrencyOpen(true)} style={[s.marketChoice,!preferences.countryCode&&s.marketChoiceOff]}><View><Text style={s.marketLabel}>{preferences.t("paymentCurrency")}</Text><Text style={s.marketValue}>{preferences.currencyCode}</Text></View><Text style={s.marketArrow}>›</Text></Pressable>
        <Text style={s.marketNote}>{preferences.t("appStoreCurrencyNote")}</Text>
      </Step>:null}
      {step===0?<Step eyebrow="Your direction" title={`What should Terrifit help ${name?.split(" ")[0]??"you"} do first?`} body="This sets your recommendations. You can change it any time."><View style={s.options}>{GOALS.map(([id,title,body])=><Choice key={id} active={form.goal===id} title={title} body={body} onPress={()=>setForm({...form,goal:id})}/>)}</View></Step>:null}
      {step===1?<Step eyebrow="The basics" title="Build your baseline." body="We use this to scale recovery, movement and nutrition targets to you—not to everybody else.">
        <View style={s.segment}><Pressable onPress={()=>setForm({...form,units:"metric"})} style={[s.segmentItem,form.units==="metric"&&s.segmentOn]}><Text style={[s.segmentText,form.units==="metric"&&s.segmentTextOn]}>Metric</Text></Pressable><Pressable onPress={()=>setForm({...form,units:"imperial"})} style={[s.segmentItem,form.units==="imperial"&&s.segmentOn]}><Text style={[s.segmentText,form.units==="imperial"&&s.segmentTextOn]}>Imperial</Text></Pressable></View>
        <View style={s.measureRow}><Measure label="Age" unit="years" value={form.age} onChange={age=>setForm({...form,age})}/><Measure label="Height" unit={form.units==="metric"?"cm":"in"} value={form.height} onChange={height=>setForm({...form,height})}/><Measure label="Weight" unit={form.units==="metric"?"kg":"lb"} value={form.weight} onChange={weight=>setForm({...form,weight})}/></View>
        <Text style={s.miniLabel}>Sex used for health calculations</Text><View style={s.chips}>{[["female","Female"],["male","Male"],["other","Other"],["undisclosed","Prefer not to say"]].map(([id,label])=><Chip key={id} active={form.sex===id} label={label} onPress={()=>setForm({...form,sex:id})}/>)}</View>
      </Step>:null}
      {step===2?<Step eyebrow="Your movement" title="What do you actually do?" body="Choose everything that belongs in your week. Terrifit will learn the difference between a run, a lift and a long day on your feet."><View style={s.chips}>{ACTIVITIES.map(x=><Chip key={x} active={form.activities.includes(x)} label={x} onPress={()=>toggle("activities",x)}/>)}</View></Step>:null}
      {step===3?<Step eyebrow="Training load" title="Meet your real week." body="Choose a week you can repeat. Coach can help you review changes when your available time changes."><View style={s.options}>{LEVELS.map(([id,title,body])=><Choice key={id} active={form.activityLevel===id} title={title} body={body} onPress={()=>setForm({...form,activityLevel:id})}/>)}</View><Text style={s.miniLabel}>Training days per week</Text><View style={s.dayRow}>{[0,1,2,3,4,5,6,7].map(day=><Pressable key={day} onPress={()=>setForm({...form,trainingDays:day})} style={[s.day,form.trainingDays===day&&s.dayOn]}><Text style={[s.dayText,form.trainingDays===day&&s.dayTextOn]}>{day}</Text></Pressable>)}</View></Step>:null}
      {step===4?<Step eyebrow="Health context" title="Anything we should respect?" body="This improves safety prompts and recommendations. It never appears on your public profile."><View style={s.chips}>{CONDITIONS.map(x=><Chip key={x} active={form.conditions.includes(x)} label={x} onPress={()=>toggle("conditions",x)}/>)}</View><View style={s.private}><Text style={s.privateTitle}>Private by default</Text><Text style={s.privateBody}>Health conditions stay private in your account. Guided coaching pauses recommendations when a constraint needs professional review.</Text></View></Step>:null}
      {step===5?<Step eyebrow="Your data" title="You decide who sees what." body="Creators can coach better with recovery and adherence trends. They never see raw medical imports or conditions."><Choice active={form.share} title="Share performance trends with my chosen creators" body="Only creators you actively work with. Revoke access whenever you want." onPress={()=>setForm({...form,share:!form.share})}/><View style={s.private}><Text style={s.privateTitle}>Your body. Your permission.</Text><Text style={s.privateBody}>Progress photos are private unless you post them. Check-ins are private unless you share them. Export or delete your data at any time.</Text></View></Step>:null}
      {step===6?<Step eyebrow="Terrifit V1" title="Bring your body online." body="Pair your band now, or connect it later from the V1 tab."><View style={s.bandArt}><View style={s.bandLoop}><View style={s.bandCore}><Text style={s.bandTime}>09:41</Text><View style={s.bandDots}>{[0,1,2,3].map(dot=><View key={dot} style={[s.bandDot,dot===3&&s.bandDotOff]}/>)}</View></View></View></View><View style={s.options}><Choice active={form.v1Mode==="real"} title="Pair my physical V1" body="We’ll find it over Bluetooth, choose your wearing arm and verify the fit." onPress={()=>setForm({...form,v1Mode:"real"})}/><Choice active={form.v1Mode==="later"} title="Connect later" body="The app still works with health integrations and manual check-ins." onPress={()=>setForm({...form,v1Mode:"later"})}/></View></Step>:null}
      {step===7?<Step eyebrow="Ready" title="Your Terrifit starts now." body="Your goal and training schedule are ready. Add optional details now. You can change your app’s theme, colour and language from your profile."><View style={s.summary}><Summary label={preferences.t("market")} value={`${preferences.countryName()} · ${preferences.currencyCode}`}/><Summary label="Goal" value={GOALS.find(x=>x[0]===form.goal)?.[1]??"Set later"}/><Summary label="Weekly training" value={`${form.trainingDays} days`}/><Summary label="Activities" value={form.activities.slice(0,3).join(" · ")||"Set later"}/><Summary label="V1" value={form.v1Mode==="real"?"Pair physical band":"Connect later"}/></View><View style={[s.chips,{marginTop:20}]}><Chip active={false} label="Add body measurements" onPress={()=>setStep(1)}/><Chip active={false} label="Choose activities" onPress={()=>setStep(2)}/><Chip active={false} label="Country & currency" onPress={()=>setStep(-1)}/><Chip active={false} label="Connect V1" onPress={()=>setStep(6)}/></View><Text style={s.disclaimer}>Terrifit provides wellness guidance, not medical diagnosis. If a condition changes how you can safely train, work with a qualified clinician.</Text></Step>:null}
    </Animated.View>
    </ScrollView>
    {!STEPS.includes(step)?<Pressable onPress={()=>{if(step===1)setForm(current=>({...current,age:"",height:"",weight:""}));setError("");setStep(LAST_STEP);}} style={{minHeight:44,justifyContent:"center",alignItems:"center"}}><Text style={s.skip}>Skip for now</Text></Pressable>:null}
    {error?<Text style={s.error}>{error}</Text>:null}<Pressable disabled={!valid||busy} onPress={()=>void next()} style={[s.next,(!valid||busy)&&s.nextOff]}><Text style={s.nextText}>{busy?"Saving…":step===7?form.v1Mode==="real"?"Save & pair V1":"Enter Terrifit":preferences.t("continue")}</Text></Pressable>
    <CountryPicker open={countryOpen} onClose={()=>setCountryOpen(false)}/><CurrencyPicker open={currencyOpen} onClose={()=>setCurrencyOpen(false)}/>
  </View></KeyboardAvoidingView>;
}

function Step({eyebrow,title,body,children}:{eyebrow:string;title:string;body:string;children:React.ReactNode}){const {locale}=usePreferences();return <View><Text style={s.eyebrow}>{eyebrow}</Text><Text style={[s.title,{fontFamily:locale==="ar"?arabicBlack:display,letterSpacing:locale==="ar"?0:-1.1}]}>{title}</Text><Text style={s.body}>{body}</Text><View style={s.stepBody}>{children}</View></View>}
function Choice({active,title,body,onPress}:{active:boolean;title:string;body:string;onPress:()=>void}){return <Pressable onPress={onPress} style={[s.choice,active&&s.choiceOn]}><View style={[s.radio,active&&s.radioOn]}>{active?<View style={s.radioDot}/>:null}</View><View style={{flex:1}}><Text style={s.choiceTitle}>{title}</Text><Text style={s.choiceBody}>{body}</Text></View></Pressable>}
function Chip({active,label,onPress}:{active:boolean;label:string;onPress:()=>void}){return <Pressable onPress={onPress} style={[s.chip,active&&s.chipOn]}><Text style={[s.chipText,active&&s.chipTextOn]}>{active?"✓ ":""}{label}</Text></Pressable>}
function Measure({label,unit,value,onChange}:{label:string;unit:string;value:string;onChange:(v:string)=>void}){return <View style={s.measure}><Text style={s.measureLabel}>{label}</Text><TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="—" placeholderTextColor={theme.muted} style={s.measureInput}/><Text style={s.measureUnit}>{unit}</Text></View>}
function Summary({label,value}:{label:string;value:string}){return <View style={s.summaryRow}><Text style={s.summaryLabel}>{label}</Text><Text style={s.summaryValue}>{value}</Text></View>}

const s=StyleSheet.create({
  flex:{flex:1,backgroundColor:theme.bg},shell:{flex:1,paddingHorizontal:20},top:{height:44,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{color:theme.ink2,fontSize:13,fontWeight:"700",minWidth:54},topSpacer:{width:54},skip:{color:theme.muted,fontSize:12,fontWeight:"700"},hidden:{opacity:0},track:{flexDirection:"row",gap:4,height:3,backgroundColor:theme.line,borderRadius:2,overflow:"hidden",marginTop:8},tick:{flex:1,height:3,borderRadius:2,backgroundColor:theme.line},tickOn:{backgroundColor:theme.accent},scroll:{flex:1},content:{paddingTop:34,paddingBottom:30},eyebrow:{color:theme.accent,fontSize:10,fontWeight:"900",letterSpacing:2,textTransform:"uppercase"},title:{color:theme.ink,fontSize:34,lineHeight:39,fontWeight:"800",marginTop:12},body:{color:theme.ink2,fontSize:15,lineHeight:22,marginTop:12,maxWidth:500},stepBody:{marginTop:30},marketChoice:{minHeight:72,borderRadius:18,borderWidth:1,borderColor:theme.lineStrong,backgroundColor:theme.surface,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:17,marginBottom:10},marketChoiceOff:{opacity:.38},marketLabel:{color:theme.muted,fontSize:10,fontWeight:"900",letterSpacing:1,textTransform:"uppercase"},marketValue:{color:theme.ink,fontSize:15,fontWeight:"800",marginTop:6},marketArrow:{color:theme.accent,fontSize:25},marketNote:{color:theme.muted,fontSize:10,lineHeight:15,marginTop:10},options:{gap:10},choice:{flexDirection:"row",gap:14,alignItems:"flex-start",padding:17,borderRadius:18,borderWidth:1,borderColor:theme.line,backgroundColor:theme.surface},choiceOn:{borderColor:theme.accent,backgroundColor:theme.accentSoft},radio:{width:22,height:22,borderRadius:11,borderWidth:1.5,borderColor:theme.lineStrong,alignItems:"center",justifyContent:"center",marginTop:1},radioOn:{borderColor:theme.accent},radioDot:{width:10,height:10,borderRadius:5,backgroundColor:theme.accent},choiceTitle:{color:theme.ink,fontSize:15,fontWeight:"800"},choiceBody:{color:theme.ink2,fontSize:12,lineHeight:18,marginTop:5},segment:{flexDirection:"row",backgroundColor:theme.surface,borderRadius:14,padding:4,borderWidth:1,borderColor:theme.line,marginBottom:14},segmentItem:{flex:1,height:38,borderRadius:10,alignItems:"center",justifyContent:"center"},segmentOn:{backgroundColor:theme.ink},segmentText:{color:theme.ink2,fontWeight:"800",fontSize:12},segmentTextOn:{color:theme.bg},measureRow:{flexDirection:"row",gap:8},measure:{flex:1,minWidth:0,borderWidth:1,borderColor:theme.line,borderRadius:16,padding:13,backgroundColor:theme.surface},measureLabel:{color:theme.muted,fontSize:10,fontWeight:"900",letterSpacing:1.2,textTransform:"uppercase"},measureInput:{color:theme.ink,fontSize:25,fontWeight:"800",padding:0,marginTop:10},measureUnit:{color:theme.ink2,fontSize:10,marginTop:2},miniLabel:{color:theme.ink2,fontSize:10,fontWeight:"900",letterSpacing:1.4,textTransform:"uppercase",marginTop:26,marginBottom:12},chips:{flexDirection:"row",flexWrap:"wrap",gap:9},chip:{minHeight:44,justifyContent:"center",paddingHorizontal:15,borderRadius:22,borderWidth:1,borderColor:theme.lineStrong,backgroundColor:theme.surface},chipOn:{borderColor:theme.accent,backgroundColor:theme.accentSoft},chipText:{color:theme.ink2,fontSize:13,fontWeight:"700"},chipTextOn:{color:theme.ink},dayRow:{flexDirection:"row",gap:6},day:{flex:1,aspectRatio:1,borderRadius:12,borderWidth:1,borderColor:theme.line,alignItems:"center",justifyContent:"center",backgroundColor:theme.surface},dayOn:{backgroundColor:theme.accent,borderColor:theme.accent},dayText:{color:theme.ink2,fontWeight:"800"},dayTextOn:{color:"#fff"},private:{marginTop:24,padding:18,borderRadius:18,backgroundColor:theme.surface,borderWidth:1,borderColor:theme.lineStrong},privateTitle:{color:theme.good,fontSize:13,fontWeight:"800"},privateBody:{color:theme.ink2,fontSize:12,lineHeight:18,marginTop:6},bandArt:{height:205,alignItems:"center",justifyContent:"center",marginBottom:24},bandLoop:{width:126,height:190,borderRadius:63,borderWidth:18,borderColor:"#25282a",transform:[{rotate:"-16deg"}],alignItems:"center",justifyContent:"center",shadowColor:theme.accent,shadowOpacity:.22,shadowRadius:22},bandCore:{width:43,height:116,borderRadius:17,backgroundColor:"#0b0c0d",borderWidth:2,borderColor:"#3a3d40",alignItems:"center",paddingTop:14},bandTime:{color:"#fff",fontSize:10,transform:[{rotate:"90deg"}]},bandDots:{marginTop:36,gap:5},bandDot:{width:5,height:5,borderRadius:2.5,backgroundColor:theme.accent},bandDotOff:{backgroundColor:theme.lineStrong},summary:{borderRadius:20,borderWidth:1,borderColor:theme.line,backgroundColor:theme.surface,overflow:"hidden"},summaryRow:{padding:17,borderBottomWidth:1,borderBottomColor:theme.line},summaryLabel:{color:theme.muted,fontSize:10,fontWeight:"900",letterSpacing:1.2,textTransform:"uppercase"},summaryValue:{color:theme.ink,fontSize:15,fontWeight:"700",marginTop:5},disclaimer:{color:theme.muted,fontSize:11,lineHeight:17,marginTop:18},error:{color:theme.poor,fontSize:12,lineHeight:18,marginBottom:8},next:{height:56,borderRadius:28,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center"},nextOff:{opacity:.35},nextText:{color:"#fff",fontSize:13,fontWeight:"900",letterSpacing:.8,textTransform:"uppercase"},
});
