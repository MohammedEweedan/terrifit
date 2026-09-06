import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "@/app-state";
import { usePreferences, locales, localeMeta, type AppLocale } from "@/preferences";
import { setAccent, setAppearance } from "@/appearance";
import { SwapCover } from "@/components/ThemeTransition";
import { useSession } from "@/session";
import { ACCENTS, accentKey, appearanceMode, backgroundFor, display, scheme, theme, type AppearanceMode } from "@/theme";
import { CountryPicker, CurrencyPicker } from "@/components/MarketPicker";
import { settingsCopy } from "@/i18n/settings";

export default function SettingsScreen() {
  // Runs the setter and covers the screen while it reloads behind the cover.
  // Without the cover the palette change reads as the app crashing and coming
  // back; the setter is called directly rather than from the cover's animation
  // so that a problem with the cover can never stop the theme from changing.
  const [swapping, setSwapping] = useState<null | string>(null);

  function swap(run: () => Promise<void>, background?: string) {
    if (swapping) return;
    setSwapping(background ?? theme.bg);
    void run();
  }

  const router=useRouter();const insets=useSafeAreaInsets();const {profile,saveProfile,units}=useAppState();const {signOut}=useSession();const preferences=usePreferences();const sharing=profile?.profile?.shareWithCreators??false;
  const [countryOpen,setCountryOpen]=useState(false);const [currencyOpen,setCurrencyOpen]=useState(false);
  const copy=settingsCopy[preferences.locale];
  return <><ScrollView style={s.page} contentContainerStyle={[s.content,{paddingTop:insets.top+10,paddingBottom:insets.bottom+34}]}>
    <View style={s.top}><Pressable onPress={()=>router.back()}><Text style={s.back}>‹ {preferences.t("back")}</Text></Pressable><Text style={s.brand}>TERRIFIT</Text><View style={{width:50}}/></View>
    <Text style={s.eyebrow}>{preferences.t("yourApp")}</Text><Text style={s.title}>{preferences.t("settings").toUpperCase()}.</Text>
    <Text style={s.section}>{preferences.t("appearance")}</Text><View style={s.segment}>{(["dark","light","system"] as AppearanceMode[]).map(mode=><Pressable key={mode} onPress={()=>swap(()=>setAppearance(mode), backgroundFor(mode))} style={[s.segmentItem,appearanceMode===mode&&s.segmentOn]}><Text style={s.modeIcon}>{mode==="dark"?"●":mode==="light"?"○":"◐"}</Text><Text style={[s.segmentText,appearanceMode===mode&&s.segmentTextOn]}>{preferences.t(mode)}</Text></Pressable>)}</View>
    <Text style={s.hint}>{copy.systemHint}</Text>

    <Text style={s.section}>{preferences.t("units")}</Text>
    <View style={s.segment}>
      {(["metric", "imperial"] as const).map((system) => {
        const on = units === system;
        return (
          <Pressable key={system} onPress={() => void saveProfile({ units: system })} style={[s.segmentItem, on && s.segmentOn]}>
            <Text style={s.modeIcon}>{system === "metric" ? "kg" : "lb"}</Text>
            <Text style={[s.segmentText, on && s.segmentTextOn]}>{preferences.t(system)}</Text>
          </Pressable>
        );
      })}
    </View>
    <Text style={s.hint}>{preferences.t("unitsHint")}</Text>

    <Text style={s.section}>{preferences.t("accent")}</Text>
    <Text style={s.accentNote}>
      {preferences.t("accentNote")}
    </Text>
    <View style={s.accents}>
      {ACCENTS.map((item) => {
        const colour = scheme === "light" ? item.light : item.dark;
        const on = accentKey === item.key;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            accessibilityState={{ selected: on }}
            onPress={() => swap(() => setAccent(item.key))}
            style={[s.accentChip, on && { borderColor: colour }]}
          >
            <View style={[s.accentDot, { backgroundColor: colour }]} />
            <Text style={[s.accentName, on && { color: colour }]}>{item.name}</Text>
          </Pressable>
        );
      })}
    </View>
    <Text style={s.section}>{preferences.t("language")}</Text><View style={s.languages}>{locales.map(item=><Language key={item} locale={item} active={preferences.locale===item} onPress={()=>void preferences.setLocale(item)}/>)}</View>
    <Text style={s.hint}>{copy.languageHint}</Text>
    <Text style={s.section}>{preferences.t("market")}</Text><View style={s.card}><Pressable onPress={()=>setCountryOpen(true)} style={s.row}><View style={{flex:1}}><Text style={s.rowTitle}>{preferences.t("country")}</Text><Text style={s.rowDetail}>{preferences.countryName()}</Text></View><Text style={s.arrow}>›</Text></Pressable><Pressable onPress={()=>setCurrencyOpen(true)} style={s.row}><View style={{flex:1}}><Text style={s.rowTitle}>{preferences.t("paymentCurrency")}</Text><Text style={s.rowDetail}>{preferences.currencyCode} · {preferences.money(4999)}</Text></View><Text style={s.arrow}>›</Text></Pressable></View><Text style={s.hint}>{preferences.t("appStoreCurrencyNote")}</Text>
    <Text style={s.section}>{preferences.t("privacy")}</Text><View style={s.card}><Setting title={copy.shareTitle} detail={copy.shareDetail} value={sharing} onValueChange={value=>void saveProfile({shareWithCreators:value})}/></View>
    <Text style={s.section}>{preferences.t("account")}</Text><View style={s.card}><Info title={copy.signedInAs} detail={profile?.user.email??copy.member}/><Pressable onPress={()=>router.push("/edit-profile" as never)} style={s.row}><View style={{flex:1}}><Text style={s.rowTitle}>{copy.profileDetails}</Text><Text style={s.rowDetail}>{copy.profileDetail}</Text></View><Text style={s.arrow}>›</Text></Pressable></View>
    <Pressable onPress={()=>void signOut()} style={s.signout}><Text style={s.signoutText}>{preferences.t("signOut")}</Text></Pressable>
    <CountryPicker open={countryOpen} onClose={()=>setCountryOpen(false)}/><CurrencyPicker open={currencyOpen} onClose={()=>setCurrencyOpen(false)}/>
  </ScrollView>{swapping ? <SwapCover background={swapping} /> : null}</>;
}
function Language({locale,active,onPress}:{locale:AppLocale;active:boolean;onPress:()=>void}){const item=localeMeta[locale];return <Pressable onPress={onPress} style={[s.language,active&&s.languageOn]}><View style={{flex:1}}><Text style={[s.languageNative,active&&s.languageNativeOn]}>{item.label}</Text><Text style={s.languageEnglish}>{item.english}</Text></View>{active?<View style={s.check}><Text style={s.checkText}>✓</Text></View>:null}</Pressable>}
function Setting({title,detail,value,onValueChange}:{title:string;detail:string;value:boolean;onValueChange?:(value:boolean)=>void}){return <View style={s.row}><View style={{flex:1,paddingRight:12}}><Text style={s.rowTitle}>{title}</Text><Text style={s.rowDetail}>{detail}</Text></View><Switch value={value} onValueChange={onValueChange} trackColor={{false:theme.lineStrong,true:theme.accentSoft}} thumbColor={value?theme.accent:theme.muted}/></View>}
function Info({title,detail}:{title:string;detail:string}){return <View style={s.row}><View style={{flex:1}}><Text style={s.rowTitle}>{title}</Text><Text style={s.rowDetail}>{detail}</Text></View></View>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:theme.bg},content:{paddingHorizontal:20},top:{height:46,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{color:theme.ink2,fontSize:13,fontWeight:"700",width:50},brand:{color:theme.ink,fontSize:10,fontWeight:"900",letterSpacing:2},eyebrow:{color:theme.accent,fontSize:10,fontWeight:"900",letterSpacing:2,textTransform:"uppercase",marginTop:25},title:{color:theme.ink,fontFamily:display,fontSize:44,marginTop:7},section:{color:theme.accent,fontSize:10,fontWeight:"900",letterSpacing:1.5,textTransform:"uppercase",marginTop:26,marginBottom:10},accentNote:{color:theme.muted,fontSize:12,lineHeight:17,marginBottom:14,marginTop:-4},accents:{flexDirection:"row",flexWrap:"wrap",gap:9},accentChip:{flexDirection:"row",alignItems:"center",gap:8,paddingHorizontal:13,paddingVertical:10,borderRadius:16,borderWidth:1,borderColor:theme.line,backgroundColor:theme.surface},accentDot:{width:16,height:16,borderRadius:8},accentName:{color:theme.ink2,fontSize:12,fontWeight:"800"},segment:{flexDirection:"row",gap:8},segmentItem:{flex:1,height:72,borderRadius:19,borderWidth:1,borderColor:theme.lineStrong,backgroundColor:theme.surface,alignItems:"center",justifyContent:"center",gap:6},segmentOn:{borderColor:theme.accent,backgroundColor:theme.accentSoft},modeIcon:{color:theme.ink,fontSize:19},segmentText:{color:theme.muted,fontSize:10,fontWeight:"900",textTransform:"uppercase",letterSpacing:.8},segmentTextOn:{color:theme.ink},hint:{color:theme.muted,fontSize:10,lineHeight:14,marginTop:9},languages:{flexDirection:"row",flexWrap:"wrap",gap:8},language:{width:"48.5%",minHeight:61,borderRadius:17,borderWidth:1,borderColor:theme.line,backgroundColor:theme.surface,flexDirection:"row",alignItems:"center",paddingHorizontal:13},languageOn:{borderColor:theme.accent,backgroundColor:theme.accentSoft},languageNative:{color:theme.ink,fontSize:12,fontWeight:"800"},languageNativeOn:{color:theme.accent},languageEnglish:{color:theme.muted,fontSize:10,marginTop:3},check:{width:20,height:20,borderRadius:10,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center"},checkText:{color:"#fff",fontSize:10,fontWeight:"900"},card:{borderRadius:21,borderWidth:1,borderColor:theme.line,backgroundColor:theme.surface,overflow:"hidden"},row:{minHeight:76,flexDirection:"row",alignItems:"center",paddingHorizontal:16,paddingVertical:13,borderBottomWidth:1,borderBottomColor:theme.line},rowTitle:{color:theme.ink,fontSize:13,fontWeight:"800"},rowDetail:{color:theme.muted,fontSize:10,lineHeight:15,marginTop:4},arrow:{color:theme.muted,fontSize:24},signout:{height:50,borderRadius:25,borderWidth:1,borderColor:theme.lineStrong,alignItems:"center",justifyContent:"center",marginTop:28},signoutText:{color:theme.poor,fontSize:10,fontWeight:"900",letterSpacing:1,textTransform:"uppercase"}});
