import type { Locale } from "./config";

/**
 * Copy for the research page — the hardware that is being built but is not for
 * sale. Typed as a complete record so a new string fails the build until every
 * locale carries it.
 */
export type ResearchCopy = {
  eyebrow: string;
  title: string;
  lede: string;
  statusLabel: string;
  status: string;
  noSale: string;
  comingSoon: string;
  shipTarget: string;
  notifyTitle: string;
  notifyBody: string;
  notifyCta: string;
  meanwhileTitle: string;
  meanwhileBody: string;
  meanwhileCta: string;
  specsTitle: string;
};

const copy: Record<Locale, ResearchCopy> = {
  en: {
    eyebrow: "Research lab",
    title: "What we're still building",
    lede: "These are real products in development, not products you can buy. We would rather show you the work than take money for a delivery date we cannot promise yet.",
    statusLabel: "Status",
    status: "In development",
    noSale: "Not for sale", comingSoon: "Coming soon",
    shipTarget: "Target: November 2027",
    notifyTitle: "Be told when it's real",
    notifyBody: "One email when pre-orders actually open. No countdown, no deposit.",
    notifyCta: "Join the list",
    meanwhileTitle: "In the meantime",
    meanwhileBody: "Terrifuel and Terrifits ship today. That is the part of Terrifit you can actually use this week.",
    meanwhileCta: "Shop what ships",
    specsTitle: "Where the design is now",
  },
  ar: {
    eyebrow: "مختبر البحث", title: "ما نعمل على بنائه", lede: "هذه منتجات حقيقية قيد التطوير، وليست منتجات يمكنك شراؤها. نفضّل أن نعرض لك العمل بدل أن نأخذ مالك مقابل موعد تسليم لا يمكننا الوعد به بعد.",
    statusLabel: "الحالة", status: "قيد التطوير", noSale: "غير معروض للبيع", comingSoon: "قريباً", shipTarget: "الهدف: نوفمبر 2027",
    notifyTitle: "أخبرونا عندما يصبح جاهزاً", notifyBody: "رسالة واحدة عند فتح الطلبات المسبقة فعلياً. بلا عدّ تنازلي وبلا عربون.", notifyCta: "انضم للقائمة",
    meanwhileTitle: "في هذه الأثناء", meanwhileBody: "تيريفيول وتيريفيتس تُشحن اليوم. هذا هو الجزء الذي يمكنك استخدامه هذا الأسبوع.", meanwhileCta: "تسوّق المتوفر",
    specsTitle: "أين وصل التصميم",
  },
  de: {
    eyebrow: "Forschungslabor", title: "Woran wir noch bauen", lede: "Das sind echte Produkte in Entwicklung, keine Produkte zum Kaufen. Wir zeigen lieber die Arbeit, als Geld für einen Liefertermin zu nehmen, den wir noch nicht versprechen können.",
    statusLabel: "Status", status: "In Entwicklung", noSale: "Nicht im Verkauf", comingSoon: "Demnächst", shipTarget: "Ziel: November 2027",
    notifyTitle: "Erfahre es, wenn es so weit ist", notifyBody: "Eine E-Mail, sobald Vorbestellungen wirklich öffnen. Kein Countdown, keine Anzahlung.", notifyCta: "Auf die Liste",
    meanwhileTitle: "In der Zwischenzeit", meanwhileBody: "Terrifuel und Terrifits liefern heute. Das ist der Teil von Terrifit, den du diese Woche nutzen kannst.", meanwhileCta: "Verfügbares kaufen",
    specsTitle: "Stand des Designs",
  },
  es: {
    eyebrow: "Laboratorio", title: "Lo que seguimos construyendo", lede: "Son productos reales en desarrollo, no productos que puedas comprar. Preferimos enseñarte el trabajo antes que cobrarte por una fecha de entrega que aún no podemos prometer.",
    statusLabel: "Estado", status: "En desarrollo", noSale: "No está a la venta", comingSoon: "Muy pronto", shipTarget: "Objetivo: noviembre de 2027",
    notifyTitle: "Avísame cuando sea real", notifyBody: "Un correo cuando las reservas se abran de verdad. Sin cuenta atrás y sin depósito.", notifyCta: "Unirme a la lista",
    meanwhileTitle: "Mientras tanto", meanwhileBody: "Terrifuel y Terrifits se envían hoy. Esa es la parte de Terrifit que puedes usar esta semana.", meanwhileCta: "Comprar lo disponible",
    specsTitle: "Dónde está el diseño",
  },
  fr: {
    eyebrow: "Laboratoire", title: "Ce que nous construisons encore", lede: "Ce sont de vrais produits en développement, pas des produits à acheter. Nous préférons montrer le travail plutôt que prendre votre argent pour une date de livraison que nous ne pouvons pas encore promettre.",
    statusLabel: "Statut", status: "En développement", noSale: "Pas à vendre", comingSoon: "Bientôt", shipTarget: "Objectif : novembre 2027",
    notifyTitle: "Prévenez-moi quand ce sera réel", notifyBody: "Un e-mail à l'ouverture réelle des précommandes. Sans compte à rebours ni acompte.", notifyCta: "Rejoindre la liste",
    meanwhileTitle: "En attendant", meanwhileBody: "Terrifuel et Terrifits sont expédiés dès aujourd'hui. C'est la partie de Terrifit utilisable cette semaine.", meanwhileCta: "Voir ce qui est disponible",
    specsTitle: "Où en est le design",
  },
  it: {
    eyebrow: "Laboratorio", title: "Quello che stiamo ancora costruendo", lede: "Sono prodotti veri in sviluppo, non prodotti da comprare. Preferiamo mostrarti il lavoro piuttosto che prendere soldi per una data di consegna che non possiamo ancora promettere.",
    statusLabel: "Stato", status: "In sviluppo", noSale: "Non in vendita", comingSoon: "In arrivo", shipTarget: "Obiettivo: novembre 2027",
    notifyTitle: "Avvisami quando è reale", notifyBody: "Una mail quando i preordini apriranno davvero. Nessun conto alla rovescia, nessun acconto.", notifyCta: "Entra in lista",
    meanwhileTitle: "Nel frattempo", meanwhileBody: "Terrifuel e Terrifits spediscono oggi. È la parte di Terrifit che puoi usare questa settimana.", meanwhileCta: "Compra ciò che spedisce",
    specsTitle: "A che punto è il design",
  },
  nl: {
    eyebrow: "Researchlab", title: "Waar we nog aan bouwen", lede: "Dit zijn echte producten in ontwikkeling, geen producten die je kunt kopen. We laten liever het werk zien dan geld aan te nemen voor een leverdatum die we nog niet kunnen beloven.",
    statusLabel: "Status", status: "In ontwikkeling", noSale: "Niet te koop", comingSoon: "Binnenkort", shipTarget: "Doel: november 2027",
    notifyTitle: "Laat het weten als het zover is", notifyBody: "Eén mail zodra pre-orders echt opengaan. Geen aftelklok, geen aanbetaling.", notifyCta: "Op de lijst",
    meanwhileTitle: "Ondertussen", meanwhileBody: "Terrifuel en Terrifits worden vandaag verzonden. Dat is het deel van Terrifit dat je deze week kunt gebruiken.", meanwhileCta: "Shop wat er is",
    specsTitle: "Waar het ontwerp staat",
  },
  pt: {
    eyebrow: "Laboratório", title: "O que ainda estamos construindo", lede: "São produtos reais em desenvolvimento, não produtos à venda. Preferimos mostrar o trabalho a cobrar por uma data de entrega que ainda não podemos prometer.",
    statusLabel: "Status", status: "Em desenvolvimento", noSale: "Não está à venda", comingSoon: "Em breve", shipTarget: "Meta: novembro de 2027",
    notifyTitle: "Avise quando for real", notifyBody: "Um e-mail quando as pré-vendas abrirem de verdade. Sem contagem regressiva e sem depósito.", notifyCta: "Entrar na lista",
    meanwhileTitle: "Enquanto isso", meanwhileBody: "Terrifuel e Terrifits são enviados hoje. É a parte do Terrifit que você pode usar esta semana.", meanwhileCta: "Comprar o que envia",
    specsTitle: "Onde o design está",
  },
  ru: {
    eyebrow: "Исследования", title: "Что мы ещё строим", lede: "Это реальные продукты в разработке, а не то, что можно купить. Мы лучше покажем работу, чем возьмём деньги за срок доставки, который пока не можем обещать.",
    statusLabel: "Статус", status: "В разработке", noSale: "Не продаётся", comingSoon: "Скоро", shipTarget: "Цель: ноябрь 2027",
    notifyTitle: "Сообщите, когда будет готово", notifyBody: "Одно письмо, когда предзаказы действительно откроются. Без таймеров и предоплаты.", notifyCta: "В список",
    meanwhileTitle: "А пока", meanwhileBody: "Terrifuel и Terrifits отправляются уже сегодня. Это та часть Terrifit, которой можно пользоваться на этой неделе.", meanwhileCta: "Купить доступное",
    specsTitle: "Где сейчас дизайн",
  },
  tr: {
    eyebrow: "Araştırma laboratuvarı", title: "Hâlâ üzerinde çalıştıklarımız", lede: "Bunlar geliştirme aşamasındaki gerçek ürünler; satın alabileceğiniz ürünler değil. Henüz söz veremeyeceğimiz bir teslim tarihi için para almaktansa işi göstermeyi tercih ederiz.",
    statusLabel: "Durum", status: "Geliştiriliyor", noSale: "Satışta değil", comingSoon: "Çok yakında", shipTarget: "Hedef: Kasım 2027",
    notifyTitle: "Gerçek olduğunda haber verin", notifyBody: "Ön siparişler gerçekten açıldığında tek bir e-posta. Geri sayım yok, kapora yok.", notifyCta: "Listeye katıl",
    meanwhileTitle: "Bu arada", meanwhileBody: "Terrifuel ve Terrifits bugün kargolanıyor. Terrifit'in bu hafta kullanabileceğiniz kısmı bu.", meanwhileCta: "Kargolananları gör",
    specsTitle: "Tasarım şu anda nerede",
  },
};

export function researchCopy(locale: Locale): ResearchCopy {
  return copy[locale] ?? copy.en;
}
