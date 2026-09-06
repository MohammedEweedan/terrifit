import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { useAppState } from "@/app-state";
import { HealthSync } from "@/components/HealthSync";
import { ProBadge } from "@/components/ProBadge";
import { useNotifications } from "@/data";
import { useSession } from "@/session";
import { theme } from "@/theme";
import { usePreferences } from "@/preferences";
import { Avatar } from "@/components/Avatar";
import { Preferences } from "@/components/Preferences";
import { profileCopy } from "@/i18n/profile";

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, band, refresh } = useAppState();
  const { name, signOut } = useSession();
  const preferences = usePreferences();
  const copy = profileCopy[preferences.locale];
  const notices = useNotifications();
  const user = profile?.user;
  const details = profile?.profile;
  const isPro = user?.plan === "pro" || user?.plan === "trial";

  return (
    <Screen title="" onRefresh={refresh} header={<AppHeader unread={notices.data?.unread ?? 0} />}>
      <View style={s.identity}>
        <Avatar image={details?.avatarImage} emoji={details?.avatarEmoji} name={user?.name ?? name} />
        <View style={s.handleRow}>
          <Text style={s.handle}>{user?.handle ? `@${user.handle}` : copy.chooseHandle}</Text>
          {isPro ? <ProBadge /> : null}
        </View>
        <Text style={s.bio}>{details?.bio ?? copy.fallbackBio}</Text>
        <Pressable onPress={() => router.push("/edit-profile" as never)} style={s.edit}>
          <Text style={s.editText}>{copy.editProfile}</Text>
        </Pressable>
      </View>

      <Preferences />

      {!isPro ? (
        <Pressable onPress={() => router.push("/pro" as never)} style={s.proCta}>
          <View style={{ flex: 1 }}><Text style={s.proCtaTitle}>{copy.becomePro}</Text><Text style={s.proCtaBody}>{copy.proPitch}</Text></View>
          <Text style={s.proCtaArrow}>›</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => router.push("/pro" as never)} style={s.proActive}>
          <ProBadge />
          <View style={{ flex: 1 }}><Text style={s.proActiveTitle}>{user?.plan === "trial" ? copy.trialRunning : copy.proName}</Text><Text style={s.proActiveBody}>{copy.managePlan}</Text></View>
          <Text style={s.proCtaArrow}>›</Text>
        </Pressable>
      )}

      {user?.isAdmin ? (
        <Pressable onPress={() => router.push("/admin" as never)} style={s.adminRow}>
          <View style={{ flex: 1 }}><Text style={s.adminTitle}>{copy.console}</Text><Text style={s.adminBody}>{copy.consoleDetail}</Text></View>
          <Text style={s.adminArrow}>›</Text>
        </Pressable>
      ) : null}

      <Text style={s.section}>{copy.yourData}</Text>
      <HealthSync onDone={refresh} />

      <Text style={s.section}>{copy.yourPerformance}</Text>
      <View style={s.menu}>
        <Row title={preferences.locale === "ar" ? "المدرب" : "Coach"} detail={preferences.locale === "ar" ? "راجع تعديل جلستك التالية" : "Review an adjustment to your next session"} onPress={() => router.push("/coach" as never)} />
        <Row title={preferences.locale === "ar" ? "أسبوعك" : "Your week"} detail={preferences.locale === "ar" ? "تقدمك من الجلسات المكتملة" : "Progress from completed sessions"} onPress={() => router.push("/progress" as never)} />
        <Row title={copy.trends} detail={copy.trendsDetail} onPress={() => router.push("/(tabs)/trends" as never)} />
        <Row title={copy.body} detail={copy.bodyDetail} onPress={() => router.push("/(tabs)/body" as never)} />
        <Row title={band?.band ? copy.v1Detail : copy.connectV1} detail={band?.band?.serial ?? copy.pairV1} onPress={() => router.push(band?.band ? "/(tabs)/band" as never : "/pair-band" as never)} />
        <Row title={copy.healthConnections} detail={copy.healthConnectionsDetail} onPress={() => router.push("/health-connections" as never)} />
      </View>

      <Text style={s.section}>{copy.profileDetails}</Text>
      <View style={s.details}>
        <Detail label={copy.goal} value={details?.goal ?? copy.notSet} />
        <Detail label={copy.activity} value={details?.activityLevel ?? copy.notSet} />
        <Detail label={copy.training} value={details?.trainingDays == null ? copy.notSet : copy.daysPerWeek(details.trainingDays)} />
        <Detail label={copy.units} value={details?.units ?? preferences.t("metric")} />
      </View>

      <Text style={s.section}>{preferences.t("settings")}</Text>
      <View style={s.menu}>
        <Row title={copy.appPreferences} detail={copy.appPreferencesDetail} onPress={() => router.push("/settings" as never)} />
        <Row title={preferences.t("notifications")} detail={copy.notificationsDetail} onPress={() => router.push("/notifications" as never)} />
        <Row title={preferences.t("orders")} detail={copy.ordersDetail} onPress={() => router.push("/orders" as never)} />
        <Row title={preferences.t("addresses")} detail={copy.addressesDetail} onPress={() => router.push("/addresses" as never)} />
      </View>

      <Pressable onPress={() => void signOut()} style={s.signout}><Text style={s.signoutText}>{preferences.t("signOut")}</Text></Pressable>
    </Screen>
  );
}
function Row({title,detail,onPress}:{title:string;detail:string;onPress?:()=>void}){return <Pressable disabled={!onPress} onPress={onPress} style={s.row}><View style={{flex:1}}><Text style={s.rowTitle}>{title}</Text><Text style={s.rowDetail}>{detail}</Text></View>{onPress?<Text style={s.arrow}>›</Text>:null}</Pressable>}
function Detail({label,value}:{label:string;value:string}){return <View style={s.detail}><Text style={s.detailLabel}>{label}</Text><Text style={s.detailValue}>{value}</Text></View>}
const s=StyleSheet.create({
  proCta:{flexDirection:"row",alignItems:"center",gap:12,marginTop:20,padding:16,borderRadius:20,borderWidth:1,borderColor:theme.accent,backgroundColor:theme.accentSoft},
  proCtaTitle:{color:theme.accent,fontSize:16,fontWeight:"900"},
  proCtaBody:{color:theme.ink2,fontSize:12,lineHeight:17,marginTop:5},
  proCtaArrow:{color:theme.accent,fontSize:24},
  proActive:{flexDirection:"row",alignItems:"center",gap:12,marginTop:20,padding:16,borderRadius:20,borderWidth:1,borderColor:theme.lineStrong,backgroundColor:theme.surface},
  proActiveTitle:{color:theme.ink,fontSize:15,fontWeight:"900"},
  proActiveBody:{color:theme.muted,fontSize:11,marginTop:4},
  adminRow:{flexDirection:"row",alignItems:"center",gap:12,marginTop:20,padding:15,borderRadius:18,borderWidth:1,borderColor:theme.accent,backgroundColor:theme.accentSoft},adminTitle:{color:theme.accent,fontSize:14,fontWeight:"900"},adminBody:{color:theme.ink2,fontSize:11,marginTop:4},adminArrow:{color:theme.accent,fontSize:24},identity:{alignItems:"center",padding:22,borderRadius:26,borderWidth:1,borderColor:theme.line,backgroundColor:theme.surface},handleRow:{flexDirection:"row",alignItems:"center",gap:8,marginTop:13},handle:{color:theme.ink,fontSize:13,fontWeight:"800"},bio:{color:theme.ink2,fontSize:12,lineHeight:18,textAlign:"center",maxWidth:300,marginTop:7},edit:{height:42,borderRadius:21,borderWidth:1,borderColor:theme.lineStrong,alignSelf:"stretch",alignItems:"center",justifyContent:"center",marginTop:18},editText:{color:theme.ink,fontSize:10,fontWeight:"900",textTransform:"uppercase",letterSpacing:1},section:{color:theme.accent,fontSize:10,fontWeight:"900",letterSpacing:1.5,textTransform:"uppercase",marginTop:26,marginBottom:10},menu:{borderRadius:20,borderWidth:1,borderColor:theme.line,backgroundColor:theme.surface,overflow:"hidden"},row:{minHeight:64,flexDirection:"row",alignItems:"center",paddingHorizontal:16,borderBottomWidth:1,borderBottomColor:theme.line},rowTitle:{color:theme.ink,fontSize:13,fontWeight:"800"},rowDetail:{color:theme.muted,fontSize:10,marginTop:4},arrow:{color:theme.muted,fontSize:24},details:{flexDirection:"row",flexWrap:"wrap",borderRadius:20,borderWidth:1,borderColor:theme.line,backgroundColor:theme.surface,overflow:"hidden"},detail:{width:"50%",padding:16,borderBottomWidth:1,borderRightWidth:1,borderColor:theme.line},detailLabel:{color:theme.muted,fontSize:10,fontWeight:"900",textTransform:"uppercase",letterSpacing:1},detailValue:{color:theme.ink,fontSize:13,fontWeight:"800",marginTop:6,textTransform:"capitalize"},signout:{height:50,borderRadius:25,borderWidth:1,borderColor:theme.lineStrong,alignItems:"center",justifyContent:"center",marginTop:26},signoutText:{color:theme.poor,fontSize:11,fontWeight:"900",textTransform:"uppercase",letterSpacing:1}});
