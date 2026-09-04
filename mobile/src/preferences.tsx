import { I18nManager } from "react-native";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { APP_CURRENCIES, countryName, currencyForCountry, findAppCurrency, formatMoney } from "./market";
import { scheme } from "./theme";
import { reloadApp } from "./appearance";
import Storage from "expo-sqlite/kv-store";

export const locales = ["en", "es", "ar", "fr", "de", "nl", "pt", "it", "tr", "ru"] as const;
export type AppLocale = (typeof locales)[number];

/**
 * The interface is left-to-right in every language, Arabic included.
 *
 * `I18nManager.forceRTL` mirrors the entire layout: nav order, back chevrons,
 * icon positions, every `row`, every `left`/`right`. Turning it on gave Arabic
 * users a structurally different — and considerably worse — app than everyone
 * else, with affordances in places nothing else in the product puts them.
 *
 * So the layout is locked LTR and Arabic is handled where it actually belongs:
 * in the type. `components/AppText` sets the Kufi face, drops Latin tracking and
 * runs the glyphs right-to-left inside their own box. Arabic reads correctly;
 * the app stays the app.
 */
function lockLayoutDirection() {
  if (I18nManager.isRTL) {
    I18nManager.allowRTL(false);
    I18nManager.forceRTL(false);
    // Only ever true for a build that had the old behaviour applied to it.
    reloadApp();
    return;
  }
  I18nManager.allowRTL(false);
}

export const localeMeta: Record<AppLocale, { label: string; english: string; tag: string; rtl?: boolean }> = {
  en: { label: "English", english: "English", tag: "en" },
  es: { label: "Español", english: "Spanish", tag: "es" },
  ar: { label: "العربية", english: "Arabic", tag: "ar", rtl: true },
  fr: { label: "Français", english: "French", tag: "fr" },
  de: { label: "Deutsch", english: "German", tag: "de" },
  nl: { label: "Nederlands", english: "Dutch", tag: "nl" },
  pt: { label: "Português", english: "Portuguese", tag: "pt" },
  it: { label: "Italiano", english: "Italian", tag: "it" },
  tr: { label: "Türkçe", english: "Turkish", tag: "tr" },
  ru: { label: "Русский", english: "Russian", tag: "ru" },
};

const en = {
  preferences: "Preferences", preferencesHint: "How the app looks and reads. Changes apply everywhere, straight away.", chooseLanguage: "Choose language", makeItYours: "Make it yours.", preferencesIntro: "Set the look and the language now. You can change any of it later from You.",
  home: "Home", maps: "Maps", connect: "Connect", fuel: "Shop", you: "You", profile: "Profile",
  settings: "Settings", language: "Language", appearance: "Appearance", dark: "Dark", light: "Light", system: "System",
  country: "Country", currency: "Currency", market: "Market", marketTitle: "Choose your market.",
  marketBody: "Your country sets local pricing and delivery. You can still choose another checkout currency.",
  chooseCountry: "Choose country", searchCountry: "Search countries", paymentCurrency: "Terrifuel checkout currency",
  currencyNote: "Physical products are charged in this currency. You can change it whenever you like.",
  appStoreCurrencyNote: "Pro subscriptions use your App Store storefront currency, as required by Apple.",
  back: "Back", done: "Done", continue: "Continue", save: "Save", yourApp: "Your app", accent: "Accent",
  accentNote: "Buttons, badges and highlights use this colour.", privacy: "Privacy", account: "Account", signOut: "Sign out",
  orders: "Orders", addresses: "Addresses", notifications: "Notifications", all: "All",
  searchProducts: "Search protein, straps, recovery…", pickedForYou: "Picked for you",
  straps: "Straps in every colourway", showEverything: "Show everything", metric: "Metric", imperial: "Imperial",
    units: "Units", unitsHint: "Weights, heights and distances everywhere in the app. Your data is stored the same way either way.",
    report: "Report", reportLede: "Everything the app knows about you, in one place — to read, to print, or to take to a clinician.", period: "Period", include: "Include", preview: "Preview", reportEmpty: "Nothing to report yet. Connect a source and it fills in.", printReport: "Print or save as PDF", exportCsv: "Export the raw numbers",
    primed: "Primed", steady: "Steady", recover: "Recover", high: "High", optimal: "Optimal", building: "Building", restored: "Restored", good: "Good", short: "Short", noData: "No data", noReading: "No reading yet", todaysRead: "Today’s read", allInsights: "All insights", notEnough: "Not enough history to compare", inLineWith: "In line with your usual", above: "above your usual", below: "below your usual", calm: "Calm", moderate: "Moderate", elevated: "Elevated", severe: "Severe", excellent: "Excellent", fair: "Fair", poor: "Poor", customise: "Customise", holdToMove: "Press and hold a tile to move it", dropIt: "Drop it where you want it",
} as const;

type Key = keyof typeof en;

const words: Record<AppLocale, Record<Key, string>> = {
  en,
  es: {
    preferences: "Preferencias", preferencesHint: "Cómo se ve y se lee la app. Los cambios se aplican en todas partes al instante.", chooseLanguage: "Elegir idioma", makeItYours: "Hazla tuya.", preferencesIntro: "Elige el aspecto y el idioma ahora. Puedes cambiarlo más tarde desde Tú.",
    home: "Inicio", maps: "Planes", connect: "Conectar", fuel: "Tienda", you: "Tú", profile: "Perfil", settings: "Ajustes",
    language: "Idioma", appearance: "Apariencia", dark: "Oscuro", light: "Claro", system: "Sistema", country: "País",
    currency: "Moneda", market: "Mercado", marketTitle: "Elige tu mercado.",
    marketBody: "Tu país define los precios locales y la entrega. Aun así, puedes elegir otra moneda de pago.",
    chooseCountry: "Elegir país", searchCountry: "Buscar países", paymentCurrency: "Moneda de pago de Terrifuel",
    currencyNote: "Los productos físicos se cobran en esta moneda. Puedes cambiarla cuando quieras.",
    appStoreCurrencyNote: "Las suscripciones Pro usan la moneda de tu tienda App Store, como exige Apple.",
    back: "Atrás", done: "Listo", continue: "Continuar", save: "Guardar", yourApp: "Tu app", accent: "Acento",
    accentNote: "Los botones, insignias y destacados usan este color.", privacy: "Privacidad", account: "Cuenta",
    signOut: "Cerrar sesión", orders: "Pedidos", addresses: "Direcciones", notifications: "Notificaciones", all: "Todo",
    searchProducts: "Buscar proteína, correas, recuperación…", pickedForYou: "Elegido para ti",
    straps: "Correas en todos los colores", showEverything: "Mostrar todo", metric: "Métrico", imperial: "Imperial",
    units: "Unidades", unitsHint: "Pesos, alturas y distancias en toda la app. Tus datos se guardan igual en ambos casos.",
    report: "Informe", reportLede: "Todo lo que la app sabe de ti, en un solo sitio: para leer, imprimir o llevar a un profesional.", period: "Periodo", include: "Incluir", preview: "Vista previa", reportEmpty: "Aún no hay nada que informar. Conecta una fuente y se rellenará.", printReport: "Imprimir o guardar en PDF", exportCsv: "Exportar los datos",
    primed: "Listo", steady: "Estable", recover: "Recupera", high: "Alto", optimal: "Óptimo", building: "Subiendo", restored: "Restaurado", good: "Bueno", short: "Corto", noData: "Sin datos", noReading: "Aún sin lectura", todaysRead: "Lectura de hoy", allInsights: "Todo el análisis", notEnough: "No hay historial suficiente", inLineWith: "En línea con tu media", above: "por encima de tu media", below: "por debajo de tu media", calm: "Calma", moderate: "Moderado", elevated: "Elevado", severe: "Severo", excellent: "Excelente", fair: "Aceptable", poor: "Bajo", customise: "Personalizar", holdToMove: "Mantén pulsada una tarjeta para moverla", dropIt: "Suéltala donde quieras",
  },
  ar: {
    preferences: "التفضيلات", preferencesHint: "شكل التطبيق وطريقة قراءته. تُطبَّق التغييرات في كل مكان فورًا.", chooseLanguage: "اختر اللغة", makeItYours: "اجعله يناسبك.", preferencesIntro: "اختر المظهر واللغة الآن. يمكنك تغيير ذلك لاحقًا من صفحة أنت.",
    home: "الرئيسية", maps: "الخطط", connect: "اتصال", fuel: "المتجر", you: "أنت", profile: "الملف", settings: "الإعدادات",
    language: "اللغة", appearance: "المظهر", dark: "داكن", light: "فاتح", system: "النظام", country: "الدولة",
    currency: "العملة", market: "السوق", marketTitle: "اختر سوقك.",
    marketBody: "تحدد دولتك الأسعار المحلية والتوصيل، ويمكنك اختيار عملة دفع أخرى.",
    chooseCountry: "اختر الدولة", searchCountry: "ابحث عن دولة", paymentCurrency: "عملة الدفع لمنتجات Terrifuel",
    currencyNote: "تُحاسب المنتجات المادية بهذه العملة ويمكن تغييرها في أي وقت.",
    appStoreCurrencyNote: "تستخدم اشتراكات Pro عملة متجر App Store وفق متطلبات Apple.",
    back: "رجوع", done: "تم", continue: "متابعة", save: "حفظ", yourApp: "تطبيقك", accent: "لون التمييز",
    accentNote: "تستخدم الأزرار والشارات والعناصر البارزة هذا اللون.", privacy: "الخصوصية", account: "الحساب",
    signOut: "تسجيل الخروج", orders: "الطلبات", addresses: "العناوين", notifications: "الإشعارات", all: "الكل",
    searchProducts: "ابحث عن البروتين أو الأحزمة أو الاستشفاء…", pickedForYou: "مختار لك",
    straps: "أحزمة بكل الألوان", showEverything: "عرض الكل", metric: "متري", imperial: "إمبراطوري",
    units: "الوحدات", unitsHint: "الأوزان والأطوال والمسافات في كل أنحاء التطبيق. بياناتك تُخزَّن بالطريقة نفسها في الحالتين.",
    report: "التقرير", reportLede: "كل ما يعرفه التطبيق عنك في مكان واحد — لتقرأه أو تطبعه أو تأخذه إلى طبيبك.", period: "الفترة", include: "المحتويات", preview: "معاينة", reportEmpty: "لا شيء لعرضه بعد. اربط مصدرًا وسيمتلئ التقرير.", printReport: "اطبع أو احفظ PDF", exportCsv: "تصدير البيانات",
    primed: "جاهز", steady: "ثابت", recover: "استرِح", high: "مرتفع", optimal: "مثالي", building: "يتصاعد", restored: "متعافٍ", good: "جيد", short: "قصير", noData: "لا توجد بيانات", noReading: "لا قراءة بعد", todaysRead: "قراءة اليوم", allInsights: "كل الرؤى", notEnough: "لا يوجد سجل كافٍ", inLineWith: "متوافق مع معدلك", above: "فوق معدلك", below: "دون معدلك", calm: "هادئ", moderate: "معتدل", elevated: "مرتفع", severe: "شديد", excellent: "ممتاز", fair: "مقبول", poor: "ضعيف", customise: "تخصيص", holdToMove: "اضغط مطولاً على بطاقة لتحريكها", dropIt: "أفلتها حيث تريد",
  },
  fr: {
    preferences: "Préférences", preferencesHint: "L’apparence et la langue de l’app. Les changements s’appliquent partout, immédiatement.", chooseLanguage: "Choisir la langue", makeItYours: "Personnalisez-la.", preferencesIntro: "Choisissez l’apparence et la langue maintenant. Vous pourrez tout modifier depuis Vous.",
    home: "Accueil", maps: "Plans", connect: "Connecter", fuel: "Boutique", you: "Vous", profile: "Profil", settings: "Réglages",
    language: "Langue", appearance: "Apparence", dark: "Sombre", light: "Clair", system: "Système", country: "Pays",
    currency: "Devise", market: "Marché", marketTitle: "Choisissez votre marché.",
    marketBody: "Votre pays définit les prix locaux et la livraison. Vous pouvez choisir une autre devise de paiement.",
    chooseCountry: "Choisir le pays", searchCountry: "Rechercher un pays", paymentCurrency: "Devise de paiement Terrifuel",
    currencyNote: "Les produits physiques sont facturés dans cette devise. Modifiez-la à tout moment.",
    appStoreCurrencyNote: "Les abonnements Pro utilisent la devise de votre App Store, comme l’exige Apple.",
    back: "Retour", done: "Terminé", continue: "Continuer", save: "Enregistrer", yourApp: "Votre app", accent: "Accent",
    accentNote: "Les boutons, badges et éléments clés utilisent cette couleur.", privacy: "Confidentialité", account: "Compte",
    signOut: "Se déconnecter", orders: "Commandes", addresses: "Adresses", notifications: "Notifications", all: "Tout",
    searchProducts: "Rechercher protéines, bracelets, récupération…", pickedForYou: "Choisi pour vous",
    straps: "Bracelets dans tous les coloris", showEverything: "Tout afficher", metric: "Métrique", imperial: "Impérial",
    units: "Unités", unitsHint: "Poids, tailles et distances dans toute l’app. Vos données sont stockées de la même façon dans les deux cas.",
    report: "Rapport", reportLede: "Tout ce que l’app sait de vous, au même endroit — à lire, à imprimer ou à montrer à un médecin.", period: "Période", include: "Inclure", preview: "Aperçu", reportEmpty: "Rien à signaler pour l’instant. Connectez une source et il se remplira.", printReport: "Imprimer ou enregistrer en PDF", exportCsv: "Exporter les données",
    primed: "Prêt", steady: "Stable", recover: "Récupérez", high: "Élevé", optimal: "Optimal", building: "En hausse", restored: "Récupéré", good: "Bon", short: "Court", noData: "Aucune donnée", noReading: "Pas encore de mesure", todaysRead: "Lecture du jour", allInsights: "Toutes les analyses", notEnough: "Historique insuffisant", inLineWith: "Conforme à votre habitude", above: "au-dessus de votre habitude", below: "en dessous de votre habitude", calm: "Calme", moderate: "Modéré", elevated: "Élevé", severe: "Sévère", excellent: "Excellent", fair: "Correct", poor: "Faible", customise: "Personnaliser", holdToMove: "Appuyez longuement sur une tuile pour la déplacer", dropIt: "Déposez-la où vous voulez",
  },
  de: {
    preferences: "Voreinstellungen", preferencesHint: "Wie die App aussieht und liest. Änderungen gelten sofort überall.", chooseLanguage: "Sprache wählen", makeItYours: "Mach sie zu deiner.", preferencesIntro: "Lege Aussehen und Sprache jetzt fest. Du kannst alles später unter Du ändern.",
    home: "Heute", maps: "Pläne", connect: "Verbinden", fuel: "Shop", you: "Du", profile: "Profil", settings: "Einstellungen",
    language: "Sprache", appearance: "Darstellung", dark: "Dunkel", light: "Hell", system: "System", country: "Land",
    currency: "Währung", market: "Markt", marketTitle: "Wähle deinen Markt.",
    marketBody: "Dein Land bestimmt lokale Preise und Lieferung. Du kannst eine andere Zahlungswährung wählen.",
    chooseCountry: "Land wählen", searchCountry: "Länder suchen", paymentCurrency: "Terrifuel-Zahlungswährung",
    currencyNote: "Physische Produkte werden in dieser Währung berechnet. Du kannst sie jederzeit ändern.",
    appStoreCurrencyNote: "Pro-Abos verwenden gemäß Apple die Währung deines App-Store-Landes.",
    back: "Zurück", done: "Fertig", continue: "Weiter", save: "Speichern", yourApp: "Deine App", accent: "Akzent",
    accentNote: "Buttons, Badges und Hervorhebungen verwenden diese Farbe.", privacy: "Datenschutz", account: "Konto",
    signOut: "Abmelden", orders: "Bestellungen", addresses: "Adressen", notifications: "Mitteilungen", all: "Alle",
    searchProducts: "Protein, Bänder, Erholung suchen…", pickedForYou: "Für dich ausgewählt",
    straps: "Bänder in jeder Farbkombination", showEverything: "Alles anzeigen", metric: "Metrisch", imperial: "Imperial",
    units: "Einheiten", unitsHint: "Gewichte, Größen und Entfernungen in der ganzen App. Deine Daten werden so oder so gleich gespeichert.",
    report: "Bericht", reportLede: "Alles, was die App über dich weiß, an einem Ort — zum Lesen, Drucken oder für die Ärztin.", period: "Zeitraum", include: "Enthalten", preview: "Vorschau", reportEmpty: "Noch nichts zu berichten. Verbinde eine Quelle und er füllt sich.", printReport: "Drucken oder als PDF sichern", exportCsv: "Rohdaten exportieren",
    primed: "Bereit", steady: "Stabil", recover: "Erholen", high: "Hoch", optimal: "Optimal", building: "Steigend", restored: "Erholt", good: "Gut", short: "Kurz", noData: "Keine Daten", noReading: "Noch kein Wert", todaysRead: "Heutige Einschätzung", allInsights: "Alle Erkenntnisse", notEnough: "Zu wenig Verlauf", inLineWith: "Wie sonst auch", above: "über deinem Schnitt", below: "unter deinem Schnitt", calm: "Ruhig", moderate: "Mäßig", elevated: "Erhöht", severe: "Stark", excellent: "Ausgezeichnet", fair: "Passabel", poor: "Schwach", customise: "Anpassen", holdToMove: "Kachel gedrückt halten zum Verschieben", dropIt: "Dort ablegen, wo du sie willst",
  },
  nl: {
    preferences: "Voorkeuren", preferencesHint: "Hoe de app eruitziet en leest. Wijzigingen gelden meteen overal.", chooseLanguage: "Kies taal", makeItYours: "Maak hem van jou.", preferencesIntro: "Kies nu het uiterlijk en de taal. Je past alles later aan bij Jij.",
    home: "Vandaag", maps: "Plannen", connect: "Verbinden", fuel: "Winkel", you: "Jij", profile: "Profiel", settings: "Instellingen",
    language: "Taal", appearance: "Weergave", dark: "Donker", light: "Licht", system: "Systeem", country: "Land",
    currency: "Valuta", market: "Markt", marketTitle: "Kies je markt.",
    marketBody: "Je land bepaalt lokale prijzen en bezorging. Je kunt een andere betaalvaluta kiezen.",
    chooseCountry: "Land kiezen", searchCountry: "Landen zoeken", paymentCurrency: "Terrifuel-betaalvaluta",
    currencyNote: "Fysieke producten worden in deze valuta afgerekend. Je kunt dit altijd wijzigen.",
    appStoreCurrencyNote: "Pro-abonnementen gebruiken volgens Apple de valuta van je App Store.",
    back: "Terug", done: "Klaar", continue: "Doorgaan", save: "Opslaan", yourApp: "Jouw app", accent: "Accent",
    accentNote: "Knoppen, badges en highlights gebruiken deze kleur.", privacy: "Privacy", account: "Account",
    signOut: "Uitloggen", orders: "Bestellingen", addresses: "Adressen", notifications: "Meldingen", all: "Alles",
    searchProducts: "Zoek eiwit, bandjes, herstel…", pickedForYou: "Voor jou gekozen",
    straps: "Bandjes in elke kleur", showEverything: "Alles tonen", metric: "Metrisch", imperial: "Imperiaal",
    units: "Eenheden", unitsHint: "Gewichten, lengtes en afstanden in de hele app. Je gegevens worden hoe dan ook hetzelfde opgeslagen.",
    report: "Rapport", reportLede: "Alles wat de app over je weet, op één plek — om te lezen, te printen of mee te nemen naar de dokter.", period: "Periode", include: "Opnemen", preview: "Voorbeeld", reportEmpty: "Nog niets te melden. Koppel een bron en het vult zich.", printReport: "Printen of opslaan als PDF", exportCsv: "Ruwe cijfers exporteren",
    primed: "Klaar", steady: "Stabiel", recover: "Herstel", high: "Hoog", optimal: "Optimaal", building: "Stijgend", restored: "Hersteld", good: "Goed", short: "Kort", noData: "Geen data", noReading: "Nog geen meting", todaysRead: "Vandaag", allInsights: "Alle inzichten", notEnough: "Te weinig historie", inLineWith: "In lijn met je gemiddelde", above: "boven je gemiddelde", below: "onder je gemiddelde", calm: "Rustig", moderate: "Matig", elevated: "Verhoogd", severe: "Zwaar", excellent: "Uitstekend", fair: "Redelijk", poor: "Zwak", customise: "Aanpassen", holdToMove: "Houd een tegel ingedrukt om te verplaatsen", dropIt: "Laat los waar je wilt",
  },
  pt: {
    preferences: "Preferências", preferencesHint: "Como a app aparece e se lê. As alterações aplicam-se em todo o lado, de imediato.", chooseLanguage: "Escolher idioma", makeItYours: "Torne-a sua.", preferencesIntro: "Escolha o aspeto e o idioma agora. Pode mudar tudo depois em Tu.",
    home: "Início", maps: "Planos", connect: "Ligar", fuel: "Loja", you: "Tu", profile: "Perfil", settings: "Definições",
    language: "Idioma", appearance: "Aparência", dark: "Escuro", light: "Claro", system: "Sistema", country: "País",
    currency: "Moeda", market: "Mercado", marketTitle: "Escolhe o teu mercado.",
    marketBody: "O teu país define preços locais e entrega. Podes escolher outra moeda de pagamento.",
    chooseCountry: "Escolher país", searchCountry: "Pesquisar países", paymentCurrency: "Moeda de pagamento Terrifuel",
    currencyNote: "Os produtos físicos são cobrados nesta moeda. Podes alterá-la a qualquer momento.",
    appStoreCurrencyNote: "As subscrições Pro usam a moeda da tua App Store, como exigido pela Apple.",
    back: "Voltar", done: "Concluído", continue: "Continuar", save: "Guardar", yourApp: "A tua app", accent: "Destaque",
    accentNote: "Botões, emblemas e destaques usam esta cor.", privacy: "Privacidade", account: "Conta",
    signOut: "Terminar sessão", orders: "Encomendas", addresses: "Moradas", notifications: "Notificações", all: "Tudo",
    searchProducts: "Pesquisar proteína, pulseiras, recuperação…", pickedForYou: "Escolhido para ti",
    straps: "Pulseiras em todas as cores", showEverything: "Mostrar tudo", metric: "Métrico", imperial: "Imperial",
    units: "Unidades", unitsHint: "Pesos, alturas e distâncias em toda a app. Os teus dados são guardados da mesma forma em qualquer caso.",
    report: "Relatório", reportLede: "Tudo o que a app sabe sobre ti, num só sítio — para ler, imprimir ou levar ao médico.", period: "Período", include: "Incluir", preview: "Pré-visualização", reportEmpty: "Ainda não há nada a relatar. Liga uma fonte e preenche-se.", printReport: "Imprimir ou guardar em PDF", exportCsv: "Exportar os dados",
    primed: "Pronto", steady: "Estável", recover: "Recupera", high: "Alto", optimal: "Ótimo", building: "A subir", restored: "Recuperado", good: "Bom", short: "Curto", noData: "Sem dados", noReading: "Ainda sem leitura", todaysRead: "Leitura de hoje", allInsights: "Todas as análises", notEnough: "Histórico insuficiente", inLineWith: "Em linha com a tua média", above: "acima da tua média", below: "abaixo da tua média", calm: "Calmo", moderate: "Moderado", elevated: "Elevado", severe: "Severo", excellent: "Excelente", fair: "Razoável", poor: "Fraco", customise: "Personalizar", holdToMove: "Mantém premido um cartão para o mover", dropIt: "Larga onde quiseres",
  },
  it: {
    preferences: "Preferenze", preferencesHint: "Come appare e si legge l’app. Le modifiche valgono ovunque, subito.", chooseLanguage: "Scegli la lingua", makeItYours: "Rendila tua.", preferencesIntro: "Scegli aspetto e lingua ora. Puoi cambiare tutto più tardi da Tu.",
    home: "Oggi", maps: "Piani", connect: "Collega", fuel: "Negozio", you: "Tu", profile: "Profilo", settings: "Impostazioni",
    language: "Lingua", appearance: "Aspetto", dark: "Scuro", light: "Chiaro", system: "Sistema", country: "Paese",
    currency: "Valuta", market: "Mercato", marketTitle: "Scegli il tuo mercato.",
    marketBody: "Il paese imposta prezzi locali e consegna. Puoi scegliere un’altra valuta di pagamento.",
    chooseCountry: "Scegli paese", searchCountry: "Cerca paesi", paymentCurrency: "Valuta di pagamento Terrifuel",
    currencyNote: "I prodotti fisici vengono addebitati in questa valuta. Puoi cambiarla in ogni momento.",
    appStoreCurrencyNote: "Gli abbonamenti Pro usano la valuta del tuo App Store, come richiesto da Apple.",
    back: "Indietro", done: "Fatto", continue: "Continua", save: "Salva", yourApp: "La tua app", accent: "Accento",
    accentNote: "Pulsanti, badge ed elementi in evidenza usano questo colore.", privacy: "Privacy", account: "Account",
    signOut: "Esci", orders: "Ordini", addresses: "Indirizzi", notifications: "Notifiche", all: "Tutto",
    searchProducts: "Cerca proteine, cinturini, recupero…", pickedForYou: "Scelto per te",
    straps: "Cinturini in ogni colore", showEverything: "Mostra tutto", metric: "Metrico", imperial: "Imperiale",
    units: "Unità", unitsHint: "Pesi, altezze e distanze in tutta l’app. I tuoi dati vengono salvati allo stesso modo in entrambi i casi.",
    report: "Report", reportLede: "Tutto quello che l’app sa di te, in un posto solo — da leggere, stampare o portare dal medico.", period: "Periodo", include: "Includi", preview: "Anteprima", reportEmpty: "Ancora niente da riportare. Collega una fonte e si riempie.", printReport: "Stampa o salva in PDF", exportCsv: "Esporta i dati",
    primed: "Pronto", steady: "Stabile", recover: "Recupera", high: "Alto", optimal: "Ottimale", building: "In crescita", restored: "Recuperato", good: "Buono", short: "Corto", noData: "Nessun dato", noReading: "Ancora nessuna lettura", todaysRead: "Lettura di oggi", allInsights: "Tutte le analisi", notEnough: "Storico insufficiente", inLineWith: "In linea con la tua media", above: "sopra la tua media", below: "sotto la tua media", calm: "Calmo", moderate: "Moderato", elevated: "Elevato", severe: "Severo", excellent: "Eccellente", fair: "Discreto", poor: "Scarso", customise: "Personalizza", holdToMove: "Tieni premuta una scheda per spostarla", dropIt: "Lasciala dove vuoi",
  },
  tr: {
    preferences: "Tercihler", preferencesHint: "Uygulamanın görünüşü ve okunuşu. Değişiklikler her yerde anında geçerli olur.", chooseLanguage: "Dil seç", makeItYours: "Sana göre yap.", preferencesIntro: "Görünümü ve dili şimdi seç. Hepsini sonra Sen sayfasından değiştirebilirsin.",
    home: "Bugün", maps: "Planlar", connect: "Bağlan", fuel: "Mağaza", you: "Sen", profile: "Profil", settings: "Ayarlar",
    language: "Dil", appearance: "Görünüm", dark: "Koyu", light: "Açık", system: "Sistem", country: "Ülke",
    currency: "Para birimi", market: "Pazar", marketTitle: "Pazarını seç.",
    marketBody: "Ülken yerel fiyatları ve teslimatı belirler. Başka bir ödeme para birimi seçebilirsin.",
    chooseCountry: "Ülke seç", searchCountry: "Ülke ara", paymentCurrency: "Terrifuel ödeme para birimi",
    currencyNote: "Fiziksel ürünler bu para biriminde ücretlendirilir. İstediğin zaman değiştirebilirsin.",
    appStoreCurrencyNote: "Pro abonelikleri Apple gereği App Store bölgenizin para birimini kullanır.",
    back: "Geri", done: "Bitti", continue: "Devam", save: "Kaydet", yourApp: "Uygulaman", accent: "Vurgu",
    accentNote: "Düğmeler, rozetler ve vurgular bu rengi kullanır.", privacy: "Gizlilik", account: "Hesap",
    signOut: "Çıkış yap", orders: "Siparişler", addresses: "Adresler", notifications: "Bildirimler", all: "Tümü",
    searchProducts: "Protein, kayış, toparlanma ara…", pickedForYou: "Senin için seçildi",
    straps: "Her renkte kayış", showEverything: "Tümünü göster", metric: "Metrik", imperial: "İngiliz ölçüsü",
    units: "Birimler", unitsHint: "Uygulamanın her yerinde ağırlık, boy ve mesafeler. Verileriniz her iki durumda da aynı şekilde saklanır.",
    report: "Rapor", reportLede: "Uygulamanın sizin hakkınızda bildiği her şey tek yerde — okumak, yazdırmak ya da doktora götürmek için.", period: "Dönem", include: "Dahil et", preview: "Önizleme", reportEmpty: "Henüz raporlanacak bir şey yok. Bir kaynak bağlayın, dolsun.", printReport: "Yazdır veya PDF kaydet", exportCsv: "Ham verileri dışa aktar",
    primed: "Hazır", steady: "Dengeli", recover: "Toparlan", high: "Yüksek", optimal: "İdeal", building: "Yükseliyor", restored: "Toparlanmış", good: "İyi", short: "Kısa", noData: "Veri yok", noReading: "Henüz ölçüm yok", todaysRead: "Bugünün okuması", allInsights: "Tüm içgörüler", notEnough: "Karşılaştırmak için yeterli geçmiş yok", inLineWith: "Her zamanki gibi", above: "ortalamanın üzerinde", below: "ortalamanın altında", calm: "Sakin", moderate: "Orta", elevated: "Yüksek", severe: "Şiddetli", excellent: "Mükemmel", fair: "İdare eder", poor: "Zayıf", customise: "Özelleştir", holdToMove: "Taşımak için bir kartı basılı tutun", dropIt: "İstediğin yere bırak",
  },
  ru: {
    preferences: "Предпочтения", preferencesHint: "Как приложение выглядит и читается. Изменения применяются везде и сразу.", chooseLanguage: "Выбрать язык", makeItYours: "Настройте под себя.", preferencesIntro: "Выберите оформление и язык сейчас. Всё это можно изменить позже в разделе «Вы».",
    home: "Сегодня", maps: "Планы", connect: "Подключить", fuel: "Магазин", you: "Вы", profile: "Профиль", settings: "Настройки",
    language: "Язык", appearance: "Тема", dark: "Тёмная", light: "Светлая", system: "Система", country: "Страна",
    currency: "Валюта", market: "Рынок", marketTitle: "Выберите свой рынок.",
    marketBody: "Страна определяет местные цены и доставку. Валюту оплаты можно изменить.",
    chooseCountry: "Выбрать страну", searchCountry: "Поиск страны", paymentCurrency: "Валюта оплаты Terrifuel",
    currencyNote: "Физические товары оплачиваются в этой валюте. Её можно изменить в любое время.",
    appStoreCurrencyNote: "Подписка Pro использует валюту вашего App Store согласно правилам Apple.",
    back: "Назад", done: "Готово", continue: "Продолжить", save: "Сохранить", yourApp: "Ваше приложение", accent: "Акцент",
    accentNote: "Кнопки, значки и выделения используют этот цвет.", privacy: "Конфиденциальность", account: "Аккаунт",
    signOut: "Выйти", orders: "Заказы", addresses: "Адреса", notifications: "Уведомления", all: "Все",
    searchProducts: "Поиск белка, ремешков, восстановления…", pickedForYou: "Подобрано для вас",
    straps: "Ремешки во всех цветах", showEverything: "Показать всё", metric: "Метрическая", imperial: "Имперская",
    units: "Единицы", unitsHint: "Вес, рост и расстояния по всему приложению. Данные в любом случае хранятся одинаково.",
    report: "Отчёт", reportLede: "Всё, что приложение знает о вас, в одном месте — прочитать, распечатать или показать врачу.", period: "Период", include: "Включить", preview: "Предпросмотр", reportEmpty: "Пока не о чем отчитываться. Подключите источник — и он заполнится.", printReport: "Печать или PDF", exportCsv: "Выгрузить данные",
    primed: "Готов", steady: "Стабильно", recover: "Отдых", high: "Высоко", optimal: "Оптимально", building: "Растёт", restored: "Восстановлен", good: "Хорошо", short: "Коротко", noData: "Нет данных", noReading: "Замеров пока нет", todaysRead: "Чтение дня", allInsights: "Все выводы", notEnough: "Мало истории", inLineWith: "Как обычно", above: "выше обычного", below: "ниже обычного", calm: "Спокойно", moderate: "Умеренно", elevated: "Повышено", severe: "Сильно", excellent: "Отлично", fair: "Средне", poor: "Слабо", customise: "Настроить", holdToMove: "Зажмите карточку, чтобы переместить", dropIt: "Отпустите где нужно",
  },
};

type Preferences = {
  ready: boolean;
  locale: AppLocale;
  scheme: "light" | "dark";
  countryCode: string | null;
  currencyCode: string;
  currencies: typeof APP_CURRENCIES;
  setLocale: (locale: AppLocale) => Promise<void>;
  setMarket: (countryCode: string) => Promise<void>;
  setCurrency: (currencyCode: string) => Promise<void>;
  countryName: (countryCode?: string | null) => string;
  money: (minorUnits: number, currencyCode?: string) => string;
  t: (key: Key) => string;
};

const Context = createContext<Preferences | null>(null);
const LOCALE_KEY = "terrifit.locale";

/**
 * The locale, mirrored into a synchronously readable store.
 *
 * `theme.ts` has to know at module load whether to load Arabic cuts — every
 * StyleSheet is built when its file is imported, long before any async read
 * could return. SecureStore stays the record; this is a shadow copy that exists
 * only so the font can be resolved in time.
 */
async function mirrorLocale(next: string): Promise<void> {
  await Storage.setItem(LOCALE_KEY, next).catch(() => {});
}
const COUNTRY_KEY = "terrifit.country";
const CURRENCY_KEY = "terrifit.currency";

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [locale, setLocaleState] = useState<AppLocale>("en");
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [currencyCode, setCurrencyCode] = useState("USD");

  useEffect(() => {
    void Promise.all([
      SecureStore.getItemAsync(LOCALE_KEY),
      SecureStore.getItemAsync(COUNTRY_KEY),
      SecureStore.getItemAsync(CURRENCY_KEY),
    ]).then(([storedLocale, storedCountry, storedCurrency]) => {
      const nextLocale = locales.includes(storedLocale as AppLocale) ? storedLocale as AppLocale : "en";
      const nextCountry = storedCountry?.length === 2 ? storedCountry.toUpperCase() : null;
      const nextCurrency = storedCurrency ? findAppCurrency(storedCurrency).code : nextCountry ? currencyForCountry(nextCountry) : "USD";
      setLocaleState(nextLocale);
      void mirrorLocale(nextLocale);
      setCountryCode(nextCountry);
      setCurrencyCode(nextCurrency);
      // Layout direction never changes. See `lockLayoutDirection`.
      lockLayoutDirection();
    }).finally(() => setReady(true));
  }, []);

  const setLocale = useCallback(async (next: AppLocale) => {
    setLocaleState(next);
    await SecureStore.setItemAsync(LOCALE_KEY, next);
    await mirrorLocale(next);
    // No reload: switching to Arabic no longer rebuilds the layout, so the
    // change is instant and the user does not lose where they were.
    lockLayoutDirection();
  }, []);

  const setMarket = useCallback(async (nextCountry: string) => {
    const country = nextCountry.toUpperCase();
    const currency = currencyForCountry(country);
    setCountryCode(country);
    setCurrencyCode(currency);
    await Promise.all([
      SecureStore.setItemAsync(COUNTRY_KEY, country),
      SecureStore.setItemAsync(CURRENCY_KEY, currency),
    ]);
  }, []);

  const setCurrency = useCallback(async (nextCurrency: string) => {
    const currency = findAppCurrency(nextCurrency).code;
    setCurrencyCode(currency);
    await SecureStore.setItemAsync(CURRENCY_KEY, currency);
  }, []);

  const value = useMemo<Preferences>(() => ({
    ready,
    locale,
    scheme,
    countryCode,
    currencyCode,
    currencies: APP_CURRENCIES,
    setLocale,
    setMarket,
    setCurrency,
    countryName: (code = countryCode) => code ? countryName(code, localeMeta[locale].tag) : words[locale].chooseCountry,
    money: (amount, code = currencyCode) => formatMoney(amount, code, localeMeta[locale].tag),
    t: (key) => words[locale][key],
  }), [ready, locale, countryCode, currencyCode, setLocale, setMarket, setCurrency]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("usePreferences must be inside PreferencesProvider");
  return value;
}
