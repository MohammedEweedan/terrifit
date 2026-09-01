import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError } from "@/api";
import { useAppState } from "@/app-state";
import { display, theme } from "@/theme";

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile } = useAppState();
  const [name, setName] = useState(profile?.user.name ?? "");
  const [handle, setHandle] = useState(profile?.user.handle ?? "");
  const [bio, setBio] = useState(profile?.profile?.bio ?? "");
  const [goal, setGoal] = useState(profile?.profile?.goal ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    if (!name.trim()) { setMessage("Your name cannot be empty."); return; }
    setSaving(true); setMessage("");
    try {
      const result = await saveProfile({ name: name.trim(), handle: handle.trim() || null, bio: bio.trim() || null, goal: goal.trim() || null });
      if (!result.synced) setMessage("Saved securely. Terrifit will sync it when you reconnect.");
      else router.back();
    } catch (caught) {
      setMessage(caught instanceof ApiError ? caught.detail ?? caught.message : "We could not save those changes.");
    } finally { setSaving(false); }
  }

  return <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 30 }]}>
      <View style={s.top}><Pressable onPress={() => router.back()}><Text style={s.cancel}>Cancel</Text></Pressable><Text style={s.topTitle}>PROFILE</Text><Pressable disabled={saving} onPress={() => void save()}><Text style={[s.save, saving && s.disabled]}>{saving ? "Saving" : "Save"}</Text></Pressable></View>
      <Text style={s.eyebrow}>Make it yours</Text>
      <View style={s.avatar}><Text style={s.avatarText}>{(name || "T").slice(0, 1).toUpperCase()}</Text></View>
      <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
      <Field label="Handle" value={handle} onChangeText={value => setHandle(value.replace(/[^a-zA-Z0-9_.]/g, "").toLowerCase())} autoCapitalize="none" prefix="@" />
      <Field label="Bio" value={bio} onChangeText={setBio} multiline maxLength={180} />
      <Field label="Primary goal" value={goal} onChangeText={setGoal} />
      {message ? <Text style={s.message}>{message}</Text> : null}
      <Pressable disabled={saving} onPress={() => void save()} style={s.button}><Text style={s.buttonText}>{saving ? "Saving…" : "Save profile"}</Text></Pressable>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Field({ label, prefix, ...props }: React.ComponentProps<typeof TextInput> & { label: string; prefix?: string }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><View style={s.inputRow}>{prefix ? <Text style={s.prefix}>{prefix}</Text> : null}<TextInput placeholderTextColor={theme.muted} style={[s.input, props.multiline && s.multiline]} {...props} /></View></View>;
}

const s = StyleSheet.create({page:{flex:1,backgroundColor:theme.bg},content:{paddingHorizontal:20},top:{height:46,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},cancel:{color:theme.ink2,fontSize:13,fontWeight:"700"},topTitle:{color:theme.ink,fontSize:10,fontWeight:"900",letterSpacing:2},save:{color:theme.accent,fontSize:13,fontWeight:"900"},disabled:{opacity:.45},eyebrow:{color:theme.accent,fontSize:10,fontWeight:"900",letterSpacing:2,textTransform:"uppercase",marginTop:22},avatar:{width:88,height:88,borderRadius:44,backgroundColor:theme.accentSoft,borderWidth:2,borderColor:theme.accent,alignItems:"center",justifyContent:"center",alignSelf:"center",marginVertical:24},avatarText:{color:theme.accent,fontFamily:display,fontSize:42},field:{marginBottom:14},label:{color:theme.muted,fontSize:10,fontWeight:"900",letterSpacing:1.2,textTransform:"uppercase",marginBottom:7},inputRow:{minHeight:54,borderRadius:17,borderWidth:1,borderColor:theme.lineStrong,backgroundColor:theme.surface,flexDirection:"row",alignItems:"center",paddingHorizontal:15},prefix:{color:theme.muted,fontSize:15},input:{flex:1,color:theme.ink,fontSize:15,paddingVertical:14},multiline:{minHeight:92,textAlignVertical:"top"},message:{color:theme.accent,fontSize:12,lineHeight:18,textAlign:"center",marginTop:4},button:{height:54,borderRadius:27,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center",marginTop:18},buttonText:{color:"#fff",fontSize:11,fontWeight:"900",letterSpacing:1.2,textTransform:"uppercase"}});
