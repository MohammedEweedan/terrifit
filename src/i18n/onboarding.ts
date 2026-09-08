import type { Locale } from "./config";

/**
 * Copy for the guided sign-up funnel.
 *
 * Typed as a full record rather than a partial merge, so adding a string here
 * fails the build until all ten locales carry it. The funnel is the first thing
 * a new member sees; a half-translated one is worse than an English one.
 */
export type OnboardingCopy = {
  eyebrow: string;
  back: string;
  next: string;
  skip: string;
  stepOf: string;
  steps: {
    persona: { title: string; sub: string; options: Array<{ id: string; label: string; note: string }> };
    goals: { title: string; sub: string; options: Array<{ id: string; label: string }> };
    cadence: { title: string; sub: string; options: Array<{ id: string; label: string; note: string }> };
    details: { title: string; sub: string; name: string; email: string; country: string; submit: string };
  };
  done: { title: string; sub: string; cta: string };
  errors: { required: string; email: string; generic: string };
};

const en: OnboardingCopy = {
  eyebrow: "Get started",
  back: "Back",
  next: "Continue",
  skip: "Skip",
  stepOf: "Step {n} of {total}",
  steps: {
    persona: {
      title: "What brings you to Terrifit?",
      sub: "This decides what we show you first. You can change it later.",
      options: [
        { id: "athlete", label: "I train for myself", note: "Readiness, recovery and a plan that fits your week" },
        { id: "coach", label: "I coach people", note: "Build Maps, take clients, get paid" },
        { id: "creator", label: "I have an audience", note: "Publish Maps and earn 60% of every sale" },
        { id: "brand", label: "I represent a brand", note: "Reach members through the shop" },
      ],
    },
    goals: {
      title: "What do you want to change?",
      sub: "Pick as many as apply.",
      options: [
        { id: "maps", label: "Train with a real plan" },
        { id: "health", label: "Understand my numbers" },
        { id: "checkins", label: "Stay consistent" },
        { id: "coaching", label: "Work with a coach" },
        { id: "communities", label: "Train with other people" },
        { id: "marketplace", label: "Get the right kit" },
      ],
    },
    cadence: {
      title: "How often do you train?",
      sub: "We use this to size your first week, not to judge it.",
      options: [
        { id: "starting", label: "I'm starting out", note: "Once or twice a week" },
        { id: "regular", label: "Regularly", note: "Three or four times a week" },
        { id: "most-days", label: "Most days", note: "Five or six times a week" },
        { id: "daily", label: "Every day", note: "Training is the schedule" },
      ],
    },
    details: {
      title: "Where should we send your place?",
      sub: "One email when your place opens. Nothing else.",
      name: "Your name",
      email: "Email",
      country: "Where are you?",
      submit: "Claim my place",
    },
  },
  done: {
    title: "You're on the list",
    sub: "We'll email you the moment your place opens. Share your link and you move up.",
    cta: "See what's coming",
  },
  errors: {
    required: "This one's needed.",
    email: "That email doesn't look right.",
    generic: "That didn't go through. Try again.",
  },
};
const ar: OnboardingCopy = {
  eyebrow: "ابدأ", back: "رجوع", next: "متابعة", skip: "تخطٍ", stepOf: "الخطوة {n} من {total}",
  steps: {
    persona: { title: "ما الذي جاء بك إلى تيريفيت؟", sub: "هذا يحدّد ما نعرضه لك أولاً. يمكنك تغييره لاحقاً.", options: [{ id: "athlete", label: "أتدرّب لنفسي", note: "الجاهزية والتعافي وخطة تناسب أسبوعك" }, { id: "coach", label: "أدرّب أشخاصاً", note: "أنشئ الخرائط، استقبل العملاء، واحصل على أجرك" }, { id: "creator", label: "لديّ جمهور", note: "انشر الخرائط واربح 60% من كل عملية بيع" }, { id: "brand", label: "أمثّل علامة تجارية", note: "تواصل مع الأعضاء عبر المتجر" }] },
    goals: { title: "ما الذي تريد تغييره؟", sub: "اختر ما ينطبق عليك.", options: [{ id: "maps", label: "التدرّب بخطة حقيقية" }, { id: "health", label: "فهم أرقامي" }, { id: "checkins", label: "الاستمرارية" }, { id: "coaching", label: "العمل مع مدرّب" }, { id: "communities", label: "التدرّب مع آخرين" }, { id: "marketplace", label: "الحصول على المعدّات المناسبة" }] },
    cadence: { title: "كم مرة تتدرّب؟", sub: "نستخدم هذا لتحديد حجم أسبوعك الأول، لا للحكم عليه.", options: [{ id: "starting", label: "أنا في البداية", note: "مرة أو مرتين أسبوعياً" }, { id: "regular", label: "بانتظام", note: "ثلاث أو أربع مرات أسبوعياً" }, { id: "most-days", label: "معظم الأيام", note: "خمس أو ست مرات أسبوعياً" }, { id: "daily", label: "كل يوم", note: "التدريب هو الجدول" }] },
    details: { title: "أين نرسل مقعدك؟", sub: "رسالة واحدة عند فتح مقعدك. لا شيء غير ذلك.", name: "اسمك", email: "البريد الإلكتروني", country: "أين أنت؟", submit: "احجز مقعدي" },
  },
  done: { title: "أنت على القائمة", sub: "سنراسلك فور فتح مقعدك. شارك رابطك لتتقدّم.", cta: "اطّلع على ما هو قادم" },
  errors: { required: "هذا الحقل مطلوب.", email: "البريد الإلكتروني غير صحيح.", generic: "لم تتم العملية. حاول مجدداً." },
};
const de: OnboardingCopy = {
  eyebrow: "Loslegen", back: "Zurück", next: "Weiter", skip: "Überspringen", stepOf: "Schritt {n} von {total}",
  steps: {
    persona: { title: "Was führt dich zu Terrifit?", sub: "Das bestimmt, was wir dir zuerst zeigen. Später änderbar.", options: [{ id: "athlete", label: "Ich trainiere für mich", note: "Bereitschaft, Erholung und ein Plan für deine Woche" }, { id: "coach", label: "Ich coache Menschen", note: "Maps bauen, Kunden gewinnen, bezahlt werden" }, { id: "creator", label: "Ich habe ein Publikum", note: "Maps veröffentlichen und 60% je Verkauf verdienen" }, { id: "brand", label: "Ich vertrete eine Marke", note: "Mitglieder über den Shop erreichen" }] },
    goals: { title: "Was willst du verändern?", sub: "Mehrfachauswahl möglich.", options: [{ id: "maps", label: "Mit einem echten Plan trainieren" }, { id: "health", label: "Meine Werte verstehen" }, { id: "checkins", label: "Dranbleiben" }, { id: "coaching", label: "Mit einem Coach arbeiten" }, { id: "communities", label: "Mit anderen trainieren" }, { id: "marketplace", label: "Die richtige Ausrüstung finden" }] },
    cadence: { title: "Wie oft trainierst du?", sub: "Damit dimensionieren wir deine erste Woche — kein Urteil.", options: [{ id: "starting", label: "Ich fange an", note: "Ein- bis zweimal pro Woche" }, { id: "regular", label: "Regelmäßig", note: "Drei- bis viermal pro Woche" }, { id: "most-days", label: "Fast täglich", note: "Fünf- bis sechsmal pro Woche" }, { id: "daily", label: "Jeden Tag", note: "Training ist der Terminplan" }] },
    details: { title: "Wohin schicken wir deinen Platz?", sub: "Eine E-Mail, sobald dein Platz frei wird. Sonst nichts.", name: "Dein Name", email: "E-Mail", country: "Wo bist du?", submit: "Platz sichern" },
  },
  done: { title: "Du stehst auf der Liste", sub: "Wir melden uns, sobald dein Platz frei wird. Teile deinen Link und rücke auf.", cta: "Sieh, was kommt" },
  errors: { required: "Das wird benötigt.", email: "Diese E-Mail sieht nicht richtig aus.", generic: "Das hat nicht geklappt. Versuch es erneut." },
};
const es: OnboardingCopy = {
  eyebrow: "Empezar", back: "Atrás", next: "Continuar", skip: "Omitir", stepOf: "Paso {n} de {total}",
  steps: {
    persona: { title: "¿Qué te trae a Terrifit?", sub: "Esto decide qué te mostramos primero. Puedes cambiarlo después.", options: [{ id: "athlete", label: "Entreno para mí", note: "Preparación, recuperación y un plan que encaja en tu semana" }, { id: "coach", label: "Entreno a otras personas", note: "Crea Maps, consigue clientes, cobra" }, { id: "creator", label: "Tengo audiencia", note: "Publica Maps y gana el 60% de cada venta" }, { id: "brand", label: "Represento una marca", note: "Llega a los miembros desde la tienda" }] },
    goals: { title: "¿Qué quieres cambiar?", sub: "Elige las que quieras.", options: [{ id: "maps", label: "Entrenar con un plan de verdad" }, { id: "health", label: "Entender mis números" }, { id: "checkins", label: "Ser constante" }, { id: "coaching", label: "Trabajar con un coach" }, { id: "communities", label: "Entrenar con otras personas" }, { id: "marketplace", label: "Conseguir el equipo adecuado" }] },
    cadence: { title: "¿Con qué frecuencia entrenas?", sub: "Lo usamos para dimensionar tu primera semana, no para juzgarla.", options: [{ id: "starting", label: "Estoy empezando", note: "Una o dos veces por semana" }, { id: "regular", label: "Con regularidad", note: "Tres o cuatro veces por semana" }, { id: "most-days", label: "Casi todos los días", note: "Cinco o seis veces por semana" }, { id: "daily", label: "Todos los días", note: "Entrenar es la agenda" }] },
    details: { title: "¿Dónde te enviamos tu plaza?", sub: "Un correo cuando se abra tu plaza. Nada más.", name: "Tu nombre", email: "Correo", country: "¿Dónde estás?", submit: "Reservar mi plaza" },
  },
  done: { title: "Ya estás en la lista", sub: "Te escribiremos en cuanto se abra tu plaza. Comparte tu enlace y subirás.", cta: "Mira lo que viene" },
  errors: { required: "Esto hace falta.", email: "Ese correo no parece correcto.", generic: "No se ha podido enviar. Inténtalo otra vez." },
};
const fr: OnboardingCopy = {
  eyebrow: "Commencer", back: "Retour", next: "Continuer", skip: "Passer", stepOf: "Étape {n} sur {total}",
  steps: {
    persona: { title: "Qu'est-ce qui vous amène chez Terrifit ?", sub: "Cela détermine ce que nous affichons en premier. Modifiable plus tard.", options: [{ id: "athlete", label: "Je m'entraîne pour moi", note: "Forme, récupération et un plan adapté à votre semaine" }, { id: "coach", label: "J'entraîne des gens", note: "Créez des Maps, trouvez des clients, soyez payé" }, { id: "creator", label: "J'ai une audience", note: "Publiez des Maps et gagnez 60% sur chaque vente" }, { id: "brand", label: "Je représente une marque", note: "Touchez les membres via la boutique" }] },
    goals: { title: "Que voulez-vous changer ?", sub: "Sélectionnez-en autant que nécessaire.", options: [{ id: "maps", label: "M'entraîner avec un vrai plan" }, { id: "health", label: "Comprendre mes chiffres" }, { id: "checkins", label: "Rester régulier" }, { id: "coaching", label: "Travailler avec un coach" }, { id: "communities", label: "M'entraîner avec d'autres" }, { id: "marketplace", label: "Trouver le bon matériel" }] },
    cadence: { title: "À quelle fréquence vous entraînez-vous ?", sub: "Pour calibrer votre première semaine, pas pour la juger.", options: [{ id: "starting", label: "Je débute", note: "Une ou deux fois par semaine" }, { id: "regular", label: "Régulièrement", note: "Trois ou quatre fois par semaine" }, { id: "most-days", label: "Presque tous les jours", note: "Cinq ou six fois par semaine" }, { id: "daily", label: "Tous les jours", note: "L'entraînement rythme la semaine" }] },
    details: { title: "Où envoyer votre place ?", sub: "Un e-mail dès que votre place se libère. Rien d'autre.", name: "Votre nom", email: "E-mail", country: "Où êtes-vous ?", submit: "Réserver ma place" },
  },
  done: { title: "Vous êtes sur la liste", sub: "Nous vous écrirons dès l'ouverture de votre place. Partagez votre lien pour avancer.", cta: "Voir la suite" },
  errors: { required: "Ce champ est requis.", email: "Cet e-mail semble incorrect.", generic: "L'envoi a échoué. Réessayez." },
};
const it: OnboardingCopy = {
  eyebrow: "Inizia", back: "Indietro", next: "Continua", skip: "Salta", stepOf: "Passo {n} di {total}",
  steps: {
    persona: { title: "Cosa ti porta su Terrifit?", sub: "Decide cosa ti mostriamo per primo. Puoi cambiarlo dopo.", options: [{ id: "athlete", label: "Mi alleno per me", note: "Prontezza, recupero e un piano adatto alla tua settimana" }, { id: "coach", label: "Alleno altre persone", note: "Crea Maps, trova clienti, fatti pagare" }, { id: "creator", label: "Ho un pubblico", note: "Pubblica Maps e guadagna il 60% su ogni vendita" }, { id: "brand", label: "Rappresento un brand", note: "Raggiungi i membri dallo shop" }] },
    goals: { title: "Cosa vuoi cambiare?", sub: "Scegline quante vuoi.", options: [{ id: "maps", label: "Allenarmi con un piano vero" }, { id: "health", label: "Capire i miei numeri" }, { id: "checkins", label: "Essere costante" }, { id: "coaching", label: "Lavorare con un coach" }, { id: "communities", label: "Allenarmi con altri" }, { id: "marketplace", label: "Trovare l'attrezzatura giusta" }] },
    cadence: { title: "Quanto spesso ti alleni?", sub: "Serve a dimensionare la prima settimana, non a giudicarla.", options: [{ id: "starting", label: "Sto iniziando", note: "Una o due volte a settimana" }, { id: "regular", label: "Regolarmente", note: "Tre o quattro volte a settimana" }, { id: "most-days", label: "Quasi ogni giorno", note: "Cinque o sei volte a settimana" }, { id: "daily", label: "Tutti i giorni", note: "L'allenamento è l'agenda" }] },
    details: { title: "Dove mandiamo il tuo posto?", sub: "Una mail quando si libera il posto. Nient'altro.", name: "Il tuo nome", email: "Email", country: "Dove sei?", submit: "Prenota il posto" },
  },
  done: { title: "Sei in lista", sub: "Ti scriviamo appena si apre il tuo posto. Condividi il link e sali.", cta: "Guarda cosa arriva" },
  errors: { required: "Questo serve.", email: "L'email non sembra corretta.", generic: "Non è andata. Riprova." },
};
const nl: OnboardingCopy = {
  eyebrow: "Beginnen", back: "Terug", next: "Doorgaan", skip: "Overslaan", stepOf: "Stap {n} van {total}",
  steps: {
    persona: { title: "Wat brengt je naar Terrifit?", sub: "Dit bepaalt wat we je eerst laten zien. Later te wijzigen.", options: [{ id: "athlete", label: "Ik train voor mezelf", note: "Readiness, herstel en een plan dat in je week past" }, { id: "coach", label: "Ik coach mensen", note: "Maak Maps, krijg klanten, word betaald" }, { id: "creator", label: "Ik heb een publiek", note: "Publiceer Maps en verdien 60% per verkoop" }, { id: "brand", label: "Ik vertegenwoordig een merk", note: "Bereik leden via de shop" }] },
    goals: { title: "Wat wil je veranderen?", sub: "Kies er zoveel als van toepassing.", options: [{ id: "maps", label: "Trainen met een echt plan" }, { id: "health", label: "Mijn cijfers begrijpen" }, { id: "checkins", label: "Consistent blijven" }, { id: "coaching", label: "Met een coach werken" }, { id: "communities", label: "Met anderen trainen" }, { id: "marketplace", label: "De juiste spullen vinden" }] },
    cadence: { title: "Hoe vaak train je?", sub: "Hiermee bepalen we je eerste week, niet ons oordeel.", options: [{ id: "starting", label: "Ik begin net", note: "Eén of twee keer per week" }, { id: "regular", label: "Regelmatig", note: "Drie of vier keer per week" }, { id: "most-days", label: "Bijna elke dag", note: "Vijf of zes keer per week" }, { id: "daily", label: "Elke dag", note: "Training is de agenda" }] },
    details: { title: "Waar sturen we je plek heen?", sub: "Eén mail zodra je plek vrijkomt. Verder niets.", name: "Je naam", email: "E-mail", country: "Waar zit je?", submit: "Mijn plek claimen" },
  },
  done: { title: "Je staat op de lijst", sub: "We mailen zodra je plek vrijkomt. Deel je link en schuif op.", cta: "Bekijk wat eraan komt" },
  errors: { required: "Dit is nodig.", email: "Dat e-mailadres klopt niet.", generic: "Dat ging mis. Probeer opnieuw." },
};
const pt: OnboardingCopy = {
  eyebrow: "Começar", back: "Voltar", next: "Continuar", skip: "Pular", stepOf: "Passo {n} de {total}",
  steps: {
    persona: { title: "O que te traz ao Terrifit?", sub: "Isso define o que mostramos primeiro. Dá para mudar depois.", options: [{ id: "athlete", label: "Treino para mim", note: "Prontidão, recuperação e um plano que cabe na sua semana" }, { id: "coach", label: "Eu treino pessoas", note: "Crie Maps, receba clientes, seja pago" }, { id: "creator", label: "Tenho público", note: "Publique Maps e ganhe 60% de cada venda" }, { id: "brand", label: "Represento uma marca", note: "Alcance membros pela loja" }] },
    goals: { title: "O que você quer mudar?", sub: "Escolha quantas quiser.", options: [{ id: "maps", label: "Treinar com um plano de verdade" }, { id: "health", label: "Entender meus números" }, { id: "checkins", label: "Manter a constância" }, { id: "coaching", label: "Trabalhar com um treinador" }, { id: "communities", label: "Treinar com outras pessoas" }, { id: "marketplace", label: "Ter o equipamento certo" }] },
    cadence: { title: "Com que frequência você treina?", sub: "Usamos para dimensionar sua primeira semana, não para julgar.", options: [{ id: "starting", label: "Estou começando", note: "Uma ou duas vezes por semana" }, { id: "regular", label: "Regularmente", note: "Três ou quatro vezes por semana" }, { id: "most-days", label: "Quase todo dia", note: "Cinco ou seis vezes por semana" }, { id: "daily", label: "Todo dia", note: "Treinar é a agenda" }] },
    details: { title: "Para onde enviamos sua vaga?", sub: "Um e-mail quando sua vaga abrir. Nada além disso.", name: "Seu nome", email: "E-mail", country: "Onde você está?", submit: "Garantir minha vaga" },
  },
  done: { title: "Você está na lista", sub: "Avisamos assim que sua vaga abrir. Compartilhe seu link e suba.", cta: "Veja o que vem aí" },
  errors: { required: "Isto é necessário.", email: "Esse e-mail não parece certo.", generic: "Não deu certo. Tente de novo." },
};
const ru: OnboardingCopy = {
  eyebrow: "Начать", back: "Назад", next: "Продолжить", skip: "Пропустить", stepOf: "Шаг {n} из {total}",
  steps: {
    persona: { title: "Что привело вас в Terrifit?", sub: "От этого зависит, что вы увидите первым. Можно изменить позже.", options: [{ id: "athlete", label: "Тренируюсь для себя", note: "Готовность, восстановление и план под вашу неделю" }, { id: "coach", label: "Тренирую других", note: "Создавайте Maps, набирайте клиентов, получайте оплату" }, { id: "creator", label: "У меня есть аудитория", note: "Публикуйте Maps и получайте 60% с каждой продажи" }, { id: "brand", label: "Я представляю бренд", note: "Выходите к участникам через магазин" }] },
    goals: { title: "Что вы хотите изменить?", sub: "Выберите всё подходящее.", options: [{ id: "maps", label: "Тренироваться по настоящему плану" }, { id: "health", label: "Понимать свои показатели" }, { id: "checkins", label: "Не бросать" }, { id: "coaching", label: "Работать с тренером" }, { id: "communities", label: "Тренироваться с другими" }, { id: "marketplace", label: "Подобрать снаряжение" }] },
    cadence: { title: "Как часто вы тренируетесь?", sub: "Это нужно, чтобы рассчитать первую неделю, а не оценить вас.", options: [{ id: "starting", label: "Только начинаю", note: "Один-два раза в неделю" }, { id: "regular", label: "Регулярно", note: "Три-четыре раза в неделю" }, { id: "most-days", label: "Почти каждый день", note: "Пять-шесть раз в неделю" }, { id: "daily", label: "Каждый день", note: "Тренировки и есть расписание" }] },
    details: { title: "Куда отправить ваше место?", sub: "Одно письмо, когда место откроется. Больше ничего.", name: "Ваше имя", email: "Эл. почта", country: "Где вы находитесь?", submit: "Занять место" },
  },
  done: { title: "Вы в списке", sub: "Напишем, как только место откроется. Поделитесь ссылкой и поднимитесь выше.", cta: "Посмотреть, что дальше" },
  errors: { required: "Это поле обязательно.", email: "Похоже, адрес неверный.", generic: "Не отправилось. Попробуйте ещё раз." },
};
const tr: OnboardingCopy = {
  eyebrow: "Başla", back: "Geri", next: "Devam", skip: "Atla", stepOf: "Adım {n} / {total}",
  steps: {
    persona: { title: "Terrifit'e seni ne getirdi?", sub: "Bu, ilk neyi göstereceğimizi belirler. Sonra değiştirebilirsin.", options: [{ id: "athlete", label: "Kendim için çalışıyorum", note: "Hazırlık, toparlanma ve haftana uyan bir plan" }, { id: "coach", label: "İnsanlara antrenman veriyorum", note: "Maps oluştur, danışan al, ödemeni al" }, { id: "creator", label: "Bir kitlem var", note: "Maps yayınla, her satıştan %60 kazan" }, { id: "brand", label: "Bir markayı temsil ediyorum", note: "Mağaza üzerinden üyelere ulaş" }] },
    goals: { title: "Neyi değiştirmek istiyorsun?", sub: "Uyan hepsini seç.", options: [{ id: "maps", label: "Gerçek bir planla çalışmak" }, { id: "health", label: "Sayılarımı anlamak" }, { id: "checkins", label: "İstikrarlı olmak" }, { id: "coaching", label: "Bir koçla çalışmak" }, { id: "communities", label: "Başkalarıyla çalışmak" }, { id: "marketplace", label: "Doğru ekipmanı bulmak" }] },
    cadence: { title: "Ne sıklıkla antrenman yapıyorsun?", sub: "İlk haftanı ölçeklemek için; yargılamak için değil.", options: [{ id: "starting", label: "Yeni başlıyorum", note: "Haftada bir veya iki kez" }, { id: "regular", label: "Düzenli olarak", note: "Haftada üç veya dört kez" }, { id: "most-days", label: "Çoğu gün", note: "Haftada beş veya altı kez" }, { id: "daily", label: "Her gün", note: "Antrenman zaten program" }] },
    details: { title: "Yerini nereye gönderelim?", sub: "Yerin açıldığında tek bir e-posta. Başka bir şey yok.", name: "Adın", email: "E-posta", country: "Neredesin?", submit: "Yerimi ayır" },
  },
  done: { title: "Listedesin", sub: "Yerin açılır açılmaz yazacağız. Bağlantını paylaş, sırada yüksel.", cta: "Sırada ne var gör" },
  errors: { required: "Bu alan gerekli.", email: "Bu e-posta doğru görünmüyor.", generic: "Gönderilemedi. Tekrar dene." },
};

const copy: Record<Locale, OnboardingCopy> = { en, ar, de, es, fr, it, nl, pt, ru, tr };

export function onboardingCopy(locale: Locale): OnboardingCopy {
  return copy[locale] ?? en;
}
