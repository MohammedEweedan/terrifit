import type { Locale } from "./config";

const labels = {
  en: ["Coming later", "Explore membership", "Explore the app", "Hardware comes next. Start with the app today."],
  ar: ["قريباً", "استكشف العضوية", "استكشف التطبيق", "الأجهزة تأتي لاحقاً. ابدأ بالتطبيق اليوم."],
  de: ["Demnächst", "Mitgliedschaft entdecken", "App entdecken", "Die Hardware folgt. Starte heute mit der App."],
  es: ["Próximamente", "Ver membresía", "Explorar la app", "El hardware llegará después. Empieza con la app."],
  fr: ["À venir", "Découvrir l’abonnement", "Découvrir l’app", "Le matériel viendra ensuite. Commencez avec l’app."],
  it: ["In arrivo", "Scopri l’abbonamento", "Scopri l’app", "L’hardware arriverà dopo. Inizia con l’app."],
  nl: ["Binnenkort", "Bekijk lidmaatschap", "Ontdek de app", "Hardware volgt later. Begin vandaag met de app."],
  pt: ["Em breve", "Ver assinatura", "Explorar o app", "O hardware vem depois. Comece com o app."],
  ru: ["Скоро", "Посмотреть подписку", "Открыть приложение", "Устройства появятся позже. Начните с приложения."],
  tr: ["Yakında", "Üyeliği keşfet", "Uygulamayı keşfet", "Donanım daha sonra. Bugün uygulamayla başlayın."],
} satisfies Record<Locale, string[]>;

export function launchCopy(locale: Locale) {
  const [upcoming, membership, app, hardwareNote] = labels[locale];
  return { upcoming, membership, app, hardwareNote };
}
