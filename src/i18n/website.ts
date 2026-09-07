import type { Locale } from "./config";

/**
 * The strings that live in components rather than in a page dictionary.
 *
 * These accumulated as `locale === "ar" ? "…" : "…"` ternaries written inline
 * while a section was being built. That shape is invisible in review and quietly
 * ships English to the eight locales that are neither English nor Arabic, so
 * every one of them is written out here instead. `Record<Locale, …>` is the
 * enforcement: adding a locale, or a key, fails the build until all ten agree.
 */
type Copy = {
  /** Header and dashboard navigation. */
  coaching: string;
  hardware: string;
  membership: string;
  coach: string;
  /** The app showcase page. */
  insideApp: string;
  getApp: string;
  appAvailability: string;
  /** The waitlist success state and its referral link. */
  inviteLabel: string;
  copyLink: string;
  copied: string;
  linkReady: string;
  /** The coaching card on the web dashboard. */
  nextSession: string;
  sessionPaused: string;
  startWithMap: string;
  joinProgramme: string;
  reviewWithCoach: string;
};

const copy: Record<Locale, Copy> = {
  en: {
    coaching: "Coaching", hardware: "Hardware", membership: "Membership", coach: "Coach",
    insideApp: "Inside the app", getApp: "Get the app",
    appAvailability: "Free to start · Band purchase optional",
    inviteLabel: "Your invitation link", copyLink: "Copy invite link",
    copied: "Copied", linkReady: "Your link is ready to share.",
    nextSession: "Your next session", sessionPaused: "Session paused",
    startWithMap: "Start with a Map",
    joinProgramme: "Join a programme in the native app to bring your plan here.",
    reviewWithCoach: "Review with Coach",
  },
  ar: {
    coaching: "التوجيه", hardware: "الأجهزة", membership: "العضوية", coach: "المدرب",
    insideApp: "داخل التطبيق", getApp: "احصل عليه",
    appAvailability: "مجاني للبدء · شراء السوار اختياري",
    inviteLabel: "رابط دعوتك", copyLink: "انسخ الرابط",
    copied: "تم النسخ", linkReady: "الرابط جاهز للمشاركة.",
    nextSession: "جلستك التالية", sessionPaused: "الجلسة متوقفة",
    startWithMap: "ابدأ ببرنامج",
    joinProgramme: "اشترك في برنامج داخل التطبيق لتظهر خطتك هنا.",
    reviewWithCoach: "افتح المدرب",
  },
  es: {
    coaching: "Coaching", hardware: "Dispositivos", membership: "Membresía", coach: "Entrenador",
    insideApp: "Dentro de la app", getApp: "Consigue la app",
    appAvailability: "Gratis para empezar · La pulsera es opcional",
    inviteLabel: "Tu enlace de invitación", copyLink: "Copiar enlace",
    copied: "Copiado", linkReady: "Tu enlace está listo para compartir.",
    nextSession: "Tu próxima sesión", sessionPaused: "Sesión en pausa",
    startWithMap: "Empieza con un Map",
    joinProgramme: "Únete a un programa en la app para ver aquí tu plan.",
    reviewWithCoach: "Abrir el entrenador",
  },
  fr: {
    coaching: "Coaching", hardware: "Matériel", membership: "Abonnement", coach: "Coach",
    insideApp: "Dans l’app", getApp: "Obtenir l’app",
    appAvailability: "Gratuit au départ · Bracelet optionnel",
    inviteLabel: "Votre lien d’invitation", copyLink: "Copier le lien",
    copied: "Copié", linkReady: "Votre lien est prêt à être partagé.",
    nextSession: "Votre prochaine séance", sessionPaused: "Séance en pause",
    startWithMap: "Commencer avec une Map",
    joinProgramme: "Rejoignez un programme dans l’app pour retrouver votre plan ici.",
    reviewWithCoach: "Ouvrir le coach",
  },
  de: {
    coaching: "Coaching", hardware: "Hardware", membership: "Mitgliedschaft", coach: "Coach",
    insideApp: "In der App", getApp: "App holen",
    appAvailability: "Kostenlos starten · Band optional",
    inviteLabel: "Dein Einladungslink", copyLink: "Link kopieren",
    copied: "Kopiert", linkReady: "Dein Link ist bereit zum Teilen.",
    nextSession: "Deine nächste Einheit", sessionPaused: "Einheit pausiert",
    startWithMap: "Mit einer Map starten",
    joinProgramme: "Tritt in der App einem Programm bei, damit dein Plan hier erscheint.",
    reviewWithCoach: "Coach öffnen",
  },
  nl: {
    coaching: "Coaching", hardware: "Hardware", membership: "Lidmaatschap", coach: "Coach",
    insideApp: "In de app", getApp: "Download de app",
    appAvailability: "Gratis om te beginnen · Band optioneel",
    inviteLabel: "Je uitnodigingslink", copyLink: "Link kopiëren",
    copied: "Gekopieerd", linkReady: "Je link is klaar om te delen.",
    nextSession: "Je volgende sessie", sessionPaused: "Sessie gepauzeerd",
    startWithMap: "Begin met een Map",
    joinProgramme: "Doe mee aan een programma in de app om je plan hier te zien.",
    reviewWithCoach: "Coach openen",
  },
  pt: {
    coaching: "Coaching", hardware: "Dispositivos", membership: "Assinatura", coach: "Treinador",
    insideApp: "Dentro da app", getApp: "Obter a app",
    appAvailability: "Grátis para começar · Pulseira opcional",
    inviteLabel: "O seu link de convite", copyLink: "Copiar link",
    copied: "Copiado", linkReady: "O seu link está pronto para partilhar.",
    nextSession: "A sua próxima sessão", sessionPaused: "Sessão em pausa",
    startWithMap: "Comece com um Map",
    joinProgramme: "Entre num programa na app para ver o seu plano aqui.",
    reviewWithCoach: "Abrir o treinador",
  },
  it: {
    coaching: "Coaching", hardware: "Dispositivi", membership: "Abbonamento", coach: "Coach",
    insideApp: "Dentro l’app", getApp: "Scarica l’app",
    appAvailability: "Gratis per iniziare · Braccialetto opzionale",
    inviteLabel: "Il tuo link di invito", copyLink: "Copia il link",
    copied: "Copiato", linkReady: "Il tuo link è pronto da condividere.",
    nextSession: "La tua prossima sessione", sessionPaused: "Sessione in pausa",
    startWithMap: "Inizia con una Map",
    joinProgramme: "Iscriviti a un programma nell’app per vedere qui il tuo piano.",
    reviewWithCoach: "Apri il coach",
  },
  tr: {
    coaching: "Koçluk", hardware: "Cihazlar", membership: "Üyelik", coach: "Koç",
    insideApp: "Uygulamanın içinde", getApp: "Uygulamayı al",
    appAvailability: "Başlaması ücretsiz · Bileklik isteğe bağlı",
    inviteLabel: "Davet bağlantın", copyLink: "Bağlantıyı kopyala",
    copied: "Kopyalandı", linkReady: "Bağlantın paylaşmaya hazır.",
    nextSession: "Sıradaki seansın", sessionPaused: "Seans duraklatıldı",
    startWithMap: "Bir Map ile başla",
    joinProgramme: "Planının burada görünmesi için uygulamada bir programa katıl.",
    reviewWithCoach: "Koçu aç",
  },
  ru: {
    coaching: "Тренер", hardware: "Устройства", membership: "Подписка", coach: "Тренер",
    insideApp: "Внутри приложения", getApp: "Установить приложение",
    appAvailability: "Начать бесплатно · Браслет по желанию",
    inviteLabel: "Ваша ссылка-приглашение", copyLink: "Скопировать ссылку",
    copied: "Скопировано", linkReady: "Ссылка готова к отправке.",
    nextSession: "Ваша следующая тренировка", sessionPaused: "Тренировка на паузе",
    startWithMap: "Начните с Map",
    joinProgramme: "Присоединитесь к программе в приложении, чтобы план появился здесь.",
    reviewWithCoach: "Открыть тренера",
  },
};

export function websiteCopy(locale: Locale): Copy { return copy[locale] ?? copy.en; }
