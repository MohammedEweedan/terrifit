import { I18nManager } from "react-native";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { scheme } from "./theme";

export const locales=["en","es","ar","fr","de","nl","pt","it","tr","ru"] as const;
export type AppLocale=typeof locales[number];
export const localeMeta:Record<AppLocale,{label:string;english:string;tag:string;rtl?:boolean}>={
  en:{label:"English",english:"English",tag:"en"},es:{label:"Español",english:"Spanish",tag:"es"},ar:{label:"العربية",english:"Arabic",tag:"ar",rtl:true},fr:{label:"Français",english:"French",tag:"fr"},de:{label:"Deutsch",english:"German",tag:"de"},nl:{label:"Nederlands",english:"Dutch",tag:"nl"},pt:{label:"Português",english:"Portuguese",tag:"pt"},it:{label:"Italiano",english:"Italian",tag:"it"},tr:{label:"Türkçe",english:"Turkish",tag:"tr"},ru:{label:"Русский",english:"Russian",tag:"ru"},
};

type Key="home"|"maps"|"fuel"|"you"|"settings"|"language"|"appearance"|"dark"|"light"|"system";
const words:Record<AppLocale,Record<Key,string>>={
  en:{home:"Home",maps:"Maps",fuel:"Fuel",you:"You",settings:"Settings",language:"Language",appearance:"Appearance",dark:"Dark",light:"Light",system:"System"},
  es:{home:"Inicio",maps:"Planes",fuel:"Fuel",you:"Perfil",settings:"Ajustes",language:"Idioma",appearance:"Apariencia",dark:"Oscuro",light:"Claro",system:"Sistema"},
  ar:{home:"الرئيسية",maps:"الخطط",fuel:"المتجر",you:"حسابي",settings:"الإعدادات",language:"اللغة",appearance:"المظهر",dark:"داكن",light:"فاتح",system:"النظام"},
  fr:{home:"Accueil",maps:"Plans",fuel:"Fuel",you:"Profil",settings:"Réglages",language:"Langue",appearance:"Apparence",dark:"Sombre",light:"Clair",system:"Système"},
  de:{home:"Heute",maps:"Pläne",fuel:"Fuel",you:"Profil",settings:"Einstellungen",language:"Sprache",appearance:"Darstellung",dark:"Dunkel",light:"Hell",system:"System"},
  nl:{home:"Vandaag",maps:"Plannen",fuel:"Fuel",you:"Profiel",settings:"Instellingen",language:"Taal",appearance:"Weergave",dark:"Donker",light:"Licht",system:"Systeem"},
  pt:{home:"Início",maps:"Planos",fuel:"Fuel",you:"Perfil",settings:"Definições",language:"Idioma",appearance:"Aparência",dark:"Escuro",light:"Claro",system:"Sistema"},
  it:{home:"Oggi",maps:"Piani",fuel:"Fuel",you:"Profilo",settings:"Impostazioni",language:"Lingua",appearance:"Aspetto",dark:"Scuro",light:"Chiaro",system:"Sistema"},
  tr:{home:"Bugün",maps:"Planlar",fuel:"Fuel",you:"Profil",settings:"Ayarlar",language:"Dil",appearance:"Görünüm",dark:"Koyu",light:"Açık",system:"Sistem"},
  ru:{home:"Сегодня",maps:"Планы",fuel:"Fuel",you:"Профиль",settings:"Настройки",language:"Язык",appearance:"Тема",dark:"Тёмная",light:"Светлая",system:"Система"},
};

/** Appearance lives in theme.ts — it has to resolve before any StyleSheet is built. */
type Preferences={ready:boolean;locale:AppLocale;scheme:"light"|"dark";setLocale:(locale:AppLocale)=>Promise<void>;t:(key:Key)=>string};
const Context=createContext<Preferences|null>(null);const LOCALE_KEY="terrifit.locale";

export function PreferencesProvider({children}:{children:ReactNode}){
  const [ready,setReady]=useState(false);const [locale,setLocaleState]=useState<AppLocale>("en");
  useEffect(()=>{void SecureStore.getItemAsync(LOCALE_KEY).then(stored=>{const next=locales.includes(stored as AppLocale)?stored as AppLocale:"en";setLocaleState(next);I18nManager.allowRTL(localeMeta[next].rtl===true)}).finally(()=>setReady(true))},[]);
  const setLocale=useCallback(async(next:AppLocale)=>{setLocaleState(next);I18nManager.allowRTL(localeMeta[next].rtl===true);await SecureStore.setItemAsync(LOCALE_KEY,next)},[]);
  const value=useMemo<Preferences>(()=>({ready,locale,scheme,setLocale,t:(key)=>words[locale][key]}),[ready,locale,setLocale]);
  return <Context.Provider value={value}>{children}</Context.Provider>}
export function usePreferences(){const value=useContext(Context);if(!value)throw new Error("usePreferences must be inside PreferencesProvider");return value}
