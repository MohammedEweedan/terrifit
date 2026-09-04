import type { AppLocale } from "./preferences";

/**
 * The names of the numbers, in every language the app ships.
 *
 * Kept apart from the general UI dictionary because these are the labels that
 * appear on the dashboard, in the metric charts, in the customise list and in
 * the headline picker — one set of names used in four places, so they cannot
 * be allowed to drift.
 *
 * Brand and unit names stay as they are everywhere: HRV, VO₂max and T Score
 * are read as names, not translated phrases, and every market uses them.
 */
export type MetricKey =
  | "tScore" | "hrv" | "restingHr" | "heartRate" | "sleep" | "steps"
  | "active" | "consistency" | "weight" | "readiness"
  | "fitnessAge" | "recovery" | "bodyBattery" | "sleepQuality" | "vo2max" | "strain" | "load";

type Table = Record<MetricKey, string>;

const en: Table = {
  tScore: "T Score", hrv: "HRV", restingHr: "Resting HR", heartRate: "Heart rate",
  sleep: "Sleep", steps: "Steps", active: "Active", consistency: "Consistency",
  weight: "Weight", readiness: "Readiness", fitnessAge: "Fitness age",
  recovery: "Recovery", bodyBattery: "Body battery", sleepQuality: "Sleep quality",
  vo2max: "VO₂max", strain: "Strain", load: "Load",
};

const tables: Record<AppLocale, Table> = {
  en,
  es: {
    ...en, restingHr: "FC en reposo", heartRate: "Frecuencia cardiaca", sleep: "Sueño",
    steps: "Pasos", active: "Actividad", consistency: "Constancia", weight: "Peso",
    readiness: "Preparación", fitnessAge: "Edad física", recovery: "Recuperación",
    bodyBattery: "Batería corporal", sleepQuality: "Calidad del sueño", strain: "Esfuerzo", load: "Carga",
  },
  ar: {
    ...en, restingHr: "نبض الراحة", heartRate: "معدل النبض", sleep: "النوم",
    steps: "الخطوات", active: "النشاط", consistency: "الانتظام", weight: "الوزن",
    readiness: "الجاهزية", fitnessAge: "العمر البدني", recovery: "التعافي",
    bodyBattery: "بطارية الجسم", sleepQuality: "جودة النوم", strain: "الجهد", load: "الحِمل",
  },
  fr: {
    ...en, restingHr: "FC au repos", heartRate: "Fréquence cardiaque", sleep: "Sommeil",
    steps: "Pas", active: "Activité", consistency: "Régularité", weight: "Poids",
    readiness: "Disponibilité", fitnessAge: "Âge physique", recovery: "Récupération",
    bodyBattery: "Batterie corporelle", sleepQuality: "Qualité du sommeil", strain: "Charge d’effort", load: "Charge",
  },
  de: {
    ...en, restingHr: "Ruhepuls", heartRate: "Herzfrequenz", sleep: "Schlaf",
    steps: "Schritte", active: "Aktivität", consistency: "Beständigkeit", weight: "Gewicht",
    readiness: "Bereitschaft", fitnessAge: "Fitnessalter", recovery: "Erholung",
    bodyBattery: "Körperakku", sleepQuality: "Schlafqualität", strain: "Belastung", load: "Last",
  },
  nl: {
    ...en, restingHr: "Rusthartslag", heartRate: "Hartslag", sleep: "Slaap",
    steps: "Stappen", active: "Activiteit", consistency: "Regelmaat", weight: "Gewicht",
    readiness: "Gereedheid", fitnessAge: "Fitleeftijd", recovery: "Herstel",
    bodyBattery: "Lichaamsbatterij", sleepQuality: "Slaapkwaliteit", strain: "Inspanning", load: "Belasting",
  },
  pt: {
    ...en, restingHr: "FC em repouso", heartRate: "Frequência cardíaca", sleep: "Sono",
    steps: "Passos", active: "Atividade", consistency: "Consistência", weight: "Peso",
    readiness: "Prontidão", fitnessAge: "Idade física", recovery: "Recuperação",
    bodyBattery: "Bateria corporal", sleepQuality: "Qualidade do sono", strain: "Esforço", load: "Carga",
  },
  it: {
    ...en, restingHr: "FC a riposo", heartRate: "Frequenza cardiaca", sleep: "Sonno",
    steps: "Passi", active: "Attività", consistency: "Costanza", weight: "Peso",
    readiness: "Prontezza", fitnessAge: "Età fisica", recovery: "Recupero",
    bodyBattery: "Batteria corporea", sleepQuality: "Qualità del sonno", strain: "Sforzo", load: "Carico",
  },
  tr: {
    ...en, restingHr: "Dinlenme nabzı", heartRate: "Nabız", sleep: "Uyku",
    steps: "Adım", active: "Aktivite", consistency: "Süreklilik", weight: "Kilo",
    readiness: "Hazırlık", fitnessAge: "Form yaşı", recovery: "Toparlanma",
    bodyBattery: "Vücut bataryası", sleepQuality: "Uyku kalitesi", strain: "Zorlanma", load: "Yük",
  },
  ru: {
    ...en, restingHr: "Пульс покоя", heartRate: "Пульс", sleep: "Сон",
    steps: "Шаги", active: "Активность", consistency: "Регулярность", weight: "Вес",
    readiness: "Готовность", fitnessAge: "Фитнес-возраст", recovery: "Восстановление",
    bodyBattery: "Заряд тела", sleepQuality: "Качество сна", strain: "Нагрузка", load: "Нагрузка",
  },
};

/** The name of a metric in the member's language, falling back to English. */
export function metricLabel(key: MetricKey, locale: AppLocale): string {
  return (tables[locale] ?? en)[key] ?? en[key];
}
