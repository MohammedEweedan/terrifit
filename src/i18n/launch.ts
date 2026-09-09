import type { Locale } from "./config";

const labels = {
  en: ["Coming later", "Explore membership", "Explore the app", "Hardware comes next. Start with the app today.", "Join the waitlist"],
  ar: ["قريباً", "استكشف العضوية", "استكشف التطبيق", "الأجهزة تأتي لاحقاً. ابدأ بالتطبيق اليوم.", "انضم لقائمة الانتظار"],
  de: ["Demnächst", "Mitgliedschaft entdecken", "App entdecken", "Die Hardware folgt. Starte heute mit der App.", "Auf die Warteliste"],
  es: ["Próximamente", "Ver membresía", "Explorar la app", "El hardware llegará después. Empieza con la app.", "Únete a la lista"],
  fr: ["À venir", "Découvrir l’abonnement", "Découvrir l’app", "Le matériel viendra ensuite. Commencez avec l’app.", "Rejoindre la liste"],
  it: ["In arrivo", "Scopri l’abbonamento", "Scopri l’app", "L’hardware arriverà dopo. Inizia con l’app.", "Entra in lista"],
  nl: ["Binnenkort", "Bekijk lidmaatschap", "Ontdek de app", "Hardware volgt later. Begin vandaag met de app.", "Op de wachtlijst"],
  pt: ["Em breve", "Ver assinatura", "Explorar o app", "O hardware vem depois. Comece com o app.", "Entrar na lista"],
  ru: ["Скоро", "Посмотреть подписку", "Открыть приложение", "Устройства появятся позже. Начните с приложения.", "В список ожидания"],
  tr: ["Yakında", "Üyeliği keşfet", "Uygulamayı keşfet", "Donanım daha sonra. Bugün uygulamayla başlayın.", "Listeye katıl"],
} satisfies Record<Locale, string[]>;

export function launchCopy(locale: Locale) {
  const [upcoming, membership, app, hardwareNote, joinWaitlist] = labels[locale];
  return { upcoming, membership, app, hardwareNote, joinWaitlist };
}
