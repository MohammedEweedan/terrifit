import type { AppLocale } from "@/preferences";

/**
 * The screens that were still hard-coded English after `screens.ts`.
 *
 * Fitness age, band pairing, health connections, Maps, exercises and reviews.
 * Grouped by screen rather than flattened, because a flat namespace of two
 * hundred keys is where duplicate near-identical strings come from.
 *
 * Admin screens are deliberately not here. `admin.tsx` and `admin-product.tsx`
 * are internal tooling behind a role check, not member-facing product, and
 * translating a console nobody outside the team opens is work that buys nothing.
 */
export type AppScreensCopy = {
  fitnessAge: {
    title: string;
    yourEstimate: string;
    actualAge: string;
    fitnessAge: string;
    difference: string;
    rightOnYourYears: string;
    notEnoughYet: string;
    addYourDetails: string;
    howItMoved: string;
    whatWentIntoIt: string;
    theMethod: string;
    boundNotReading: string;
    atLeast: string;
    methodVo2: string;
    methodMedian: string;
  };
  pairing: {
    meetYourV1: string;
    chooseYourV1: string;
    chooseYourArm: string;
    chooseAV1First: string;
    bringV1Close: string;
    connecting: string;
    makingItYours: string;
    connectionComplete: string;
    tryAgain: string;
    bluetoothLink: string;
    bluetoothHandshake: string;
    bluetoothPermission: string;
    moveCloser: string;
    needsAttention: string;
    noneAppeared: string;
    onlyNearby: string;
    matchSerial: string;
    leftArm: string;
    rightArm: string;
    battery: string;
    firmware: string;
    signalUnknown: string;
    veryClose: string;
    nearby: string;
  };
  health: {
    title: string;
    connected: string;
    nothingYet: string;
    addAnother: string;
    unavailable: string;
    unavailableBody: string;
    connectNotWired: string;
    connectNotWiredBody: string;
  };
  maps: {
    startThisMap: string;
    starting: string;
    leaveThisMap: string;
    leaveConfirm: string;
    leaveBody: string;
    couldNotLeave: string;
    tryAgainMoment: string;
    perWeek: string;
    sessions: string;
    thisWeek: string;
    sessionsDoneThisWeek: string;
    startSession: string;
    howItIsBuilt: string;
    equipment: string;
    yourHistoryOnThisMap: string;
    yourHistory: string;
    nothingLogged: string;
    totalVolume: string;
    bestSession: string;
  };
  exercise: {
    movement: string;
    howToDoIt: string;
    theOneCue: string;
    whatGoesWrong: string;
    howToGetBetter: string;
  };
  reviews: {
    readTheReviews: string;
    noneYet: string;
    nobodyHasWritten: string;
    writeAReview: string;
    editYourReview: string;
    yourReview: string;
    headline: string;
    headlinePlaceholder: string;
    whatYouThought: string;
    bodyPlaceholder: string;
    saving: string;
    saveFailed: string;
    verifiedPurchase: string;
  };
};

type S = AppScreensCopy;

const en: S = {
  fitnessAge: {
    title: "Fitness age", yourEstimate: "Your estimate", actualAge: "Actual age", fitnessAge: "Fitness age",
    difference: "Difference", rightOnYourYears: "Right on your years", notEnoughYet: "Not enough to say yet",
    addYourDetails: "Add your details", howItMoved: "How it has moved", whatWentIntoIt: "What went into it",
    theMethod: "The method", boundNotReading: "This is a bound, not a reading", atLeast: "At least ",
    methodVo2: "Maximum over resting gives a VO₂max — Uth, Sørensen, Overgaard and Pedersen (2004), the only estimate needing nothing but two heart rates.",
    methodMedian: "That is compared against a median person of your sex run through the same equation. Feed in the population median and the answer is your real age.",
  },
  pairing: {
    meetYourV1: "Meet your V1.", chooseYourV1: "Choose your V1.", chooseYourArm: "Choose your arm.",
    chooseAV1First: "Choose a V1 first.", bringV1Close: "Bring V1 close.", connecting: "Connecting.",
    makingItYours: "Making it yours.", connectionComplete: "Connection complete", tryAgain: "Let’s try that again.",
    bluetoothLink: "Bluetooth link", bluetoothHandshake: "Bluetooth handshake",
    bluetoothPermission: "Bluetooth permission is required to find your V1.", moveCloser: "Move closer",
    needsAttention: "Needs attention", noneAppeared: "No V1 appeared. Wake the band, hold it close and scan again.",
    onlyNearby: "Only nearby devices whose advertised serial begins with TF1 appear here.",
    matchSerial: "Match the serial below to the code printed inside your strap loop.",
    leftArm: "Left arm", rightArm: "Right arm", battery: "Battery", firmware: "Firmware", signalUnknown: "Signal unknown", veryClose: "Very close", nearby: "Nearby",
  },
  health: {
    title: "Health connections", connected: "Connected", nothingYet: "Nothing yet", addAnother: "Add another",
    unavailable: "Health is unavailable on this device",
    unavailableBody: "HealthKit is not present here — a simulator, or a device without the Health app.",
    connectNotWired: "Health Connect is not wired up yet",
    connectNotWiredBody: "Android reads from Health Connect. That integration is not in this build; import a file from the website in the meantime.",
  },
  maps: {
    startThisMap: "Start this Map", starting: "Starting…", leaveThisMap: "Leave this Map",
    leaveConfirm: "Leave this Map?", leaveBody: "Your logged sessions stay on record. You can start it again whenever you like.",
    couldNotLeave: "Couldn’t leave", tryAgainMoment: "Try again in a moment.", perWeek: "Per week",
    sessions: "Sessions", thisWeek: "This week", sessionsDoneThisWeek: "Sessions done this week",
    startSession: "Start session", howItIsBuilt: "How it is built", equipment: "Equipment",
    yourHistoryOnThisMap: "Your history on this Map", yourHistory: "Your history",
    nothingLogged: "Nothing logged yet", totalVolume: "Total volume", bestSession: "Best session",
  },
  exercise: {
    movement: "Movement", howToDoIt: "How to do it", theOneCue: "The one cue",
    whatGoesWrong: "What goes wrong", howToGetBetter: "How to get better at it",
  },
  reviews: {
    readTheReviews: "Read the reviews", noneYet: "No reviews yet", nobodyHasWritten: "Nobody has written one yet",
    writeAReview: "Write a review", editYourReview: "Edit your review", yourReview: "Your review",
    headline: "Headline", headlinePlaceholder: "Sum it up in a few words", whatYouThought: "What you thought",
    bodyPlaceholder: "How you use it, how long you’ve had it, what you’d tell someone deciding.",
    saving: "Saving…", saveFailed: "That didn’t save. Try again in a moment.", verifiedPurchase: "Verified purchase",
  },
};

const es: S = {
  fitnessAge: {
    title: "Edad física", yourEstimate: "Tu estimación", actualAge: "Edad real", fitnessAge: "Edad física",
    difference: "Diferencia", rightOnYourYears: "Justo en tus años", notEnoughYet: "Aún no hay suficiente",
    addYourDetails: "Añade tus datos", howItMoved: "Cómo ha cambiado", whatWentIntoIt: "Qué se usó",
    theMethod: "El método", boundNotReading: "Esto es un límite, no una lectura", atLeast: "Al menos ",
    methodVo2: "La máxima sobre la de reposo da un VO₂máx — Uth, Sørensen, Overgaard y Pedersen (2004), la única estimación que solo necesita dos frecuencias cardíacas.",
    methodMedian: "Se compara con una persona mediana de tu sexo pasada por la misma ecuación. Introduce la mediana poblacional y el resultado es tu edad real.",
  },
  pairing: {
    meetYourV1: "Conoce tu V1.", chooseYourV1: "Elige tu V1.", chooseYourArm: "Elige tu brazo.",
    chooseAV1First: "Elige primero una V1.", bringV1Close: "Acerca la V1.", connecting: "Conectando.",
    makingItYours: "Haciéndola tuya.", connectionComplete: "Conexión completada", tryAgain: "Vamos a intentarlo otra vez.",
    bluetoothLink: "Enlace Bluetooth", bluetoothHandshake: "Negociación Bluetooth",
    bluetoothPermission: "Se necesita permiso de Bluetooth para encontrar tu V1.", moveCloser: "Acércate más",
    needsAttention: "Requiere atención", noneAppeared: "No apareció ninguna V1. Despierta la pulsera, acércala y vuelve a buscar.",
    onlyNearby: "Solo aparecen dispositivos cercanos cuyo número de serie empieza por TF1.",
    matchSerial: "Compara el número de abajo con el código impreso dentro del lazo de la correa.",
    leftArm: "Brazo izquierdo", rightArm: "Brazo derecho", battery: "Batería", firmware: "Firmware", signalUnknown: "Señal desconocida", veryClose: "Muy cerca", nearby: "Cerca",
  },
  health: {
    title: "Conexiones de salud", connected: "Conectado", nothingYet: "Nada todavía", addAnother: "Añadir otra",
    unavailable: "Salud no está disponible en este dispositivo",
    unavailableBody: "HealthKit no está aquí — un simulador, o un dispositivo sin la app Salud.",
    connectNotWired: "Health Connect aún no está conectado",
    connectNotWiredBody: "Android lee desde Health Connect. Esa integración no está en esta versión; mientras tanto importa un archivo desde la web.",
  },
  maps: {
    startThisMap: "Empezar este plan", starting: "Empezando…", leaveThisMap: "Abandonar este plan",
    leaveConfirm: "¿Abandonar este plan?", leaveBody: "Tus sesiones registradas se conservan. Puedes empezarlo otra vez cuando quieras.",
    couldNotLeave: "No se pudo abandonar", tryAgainMoment: "Inténtalo de nuevo en un momento.", perWeek: "Por semana",
    sessions: "Sesiones", thisWeek: "Esta semana", sessionsDoneThisWeek: "Sesiones hechas esta semana",
    startSession: "Empezar sesión", howItIsBuilt: "Cómo está construido", equipment: "Equipamiento",
    yourHistoryOnThisMap: "Tu historial en este plan", yourHistory: "Tu historial",
    nothingLogged: "Nada registrado aún", totalVolume: "Volumen total", bestSession: "Mejor sesión",
  },
  exercise: {
    movement: "Movimiento", howToDoIt: "Cómo hacerlo", theOneCue: "La clave",
    whatGoesWrong: "Qué suele fallar", howToGetBetter: "Cómo mejorar en esto",
  },
  reviews: {
    readTheReviews: "Leer las opiniones", noneYet: "Aún no hay opiniones", nobodyHasWritten: "Nadie ha escrito ninguna todavía",
    writeAReview: "Escribir una opinión", editYourReview: "Editar tu opinión", yourReview: "Tu opinión",
    headline: "Titular", headlinePlaceholder: "Resúmelo en unas palabras", whatYouThought: "Qué te pareció",
    bodyPlaceholder: "Cómo lo usas, cuánto tiempo lo llevas, qué le dirías a alguien que está decidiendo.",
    saving: "Guardando…", saveFailed: "No se guardó. Inténtalo de nuevo en un momento.", verifiedPurchase: "Compra verificada",
  },
};

const ar: S = {
  fitnessAge: {
    title: "العمر البدني", yourEstimate: "تقديرك", actualAge: "العمر الحقيقي", fitnessAge: "العمر البدني",
    difference: "الفرق", rightOnYourYears: "مطابق لسنواتك", notEnoughYet: "لا توجد بيانات كافية بعد",
    addYourDetails: "أضف بياناتك", howItMoved: "كيف تغيّر", whatWentIntoIt: "ما الذي دخل في الحساب",
    theMethod: "الطريقة", boundNotReading: "هذا حدّ أدنى، وليس قراءة", atLeast: "على الأقل ",
    methodVo2: "قسمة النبض الأقصى على نبض الراحة تعطي VO₂max — أوث وسورنسن وأوفرغارد وبيدرسن (2004)، التقدير الوحيد الذي لا يحتاج سوى قراءتين للنبض.",
    methodMedian: "تُقارن النتيجة بشخص متوسط من جنسك مرّ بالمعادلة نفسها. أدخل الوسيط السكاني وتكون الإجابة عمرك الحقيقي.",
  },
  pairing: {
    meetYourV1: "تعرّف على V1.", chooseYourV1: "اختر V1 الخاص بك.", chooseYourArm: "اختر ذراعك.",
    chooseAV1First: "اختر V1 أولًا.", bringV1Close: "قرّب V1.", connecting: "جارٍ الاتصال.",
    makingItYours: "نجعله خاصًا بك.", connectionComplete: "اكتمل الاتصال", tryAgain: "لنجرّب مرة أخرى.",
    bluetoothLink: "اتصال بلوتوث", bluetoothHandshake: "مصافحة بلوتوث",
    bluetoothPermission: "يلزم إذن بلوتوث للعثور على V1.", moveCloser: "اقترب أكثر",
    needsAttention: "يحتاج انتباهًا", noneAppeared: "لم يظهر أي V1. أيقظ السوار، قرّبه وأعد البحث.",
    onlyNearby: "تظهر هنا الأجهزة القريبة فقط التي يبدأ رقمها التسلسلي بـ TF1.",
    matchSerial: "طابق الرقم أدناه مع الرمز المطبوع داخل حلقة السوار.",
    leftArm: "الذراع اليسرى", rightArm: "الذراع اليمنى", battery: "البطارية", firmware: "البرنامج الثابت", signalUnknown: "إشارة غير معروفة", veryClose: "قريب جدًا", nearby: "قريب",
  },
  health: {
    title: "اتصالات الصحة", connected: "متصل", nothingYet: "لا شيء بعد", addAnother: "أضف اتصالًا آخر",
    unavailable: "تطبيق الصحة غير متاح على هذا الجهاز",
    unavailableBody: "HealthKit غير موجود هنا — محاكٍ، أو جهاز بلا تطبيق الصحة.",
    connectNotWired: "لم يتم ربط Health Connect بعد",
    connectNotWiredBody: "يقرأ أندرويد من Health Connect. هذا التكامل غير متوفر في هذه النسخة؛ استورد ملفًا من الموقع في هذه الأثناء.",
  },
  maps: {
    startThisMap: "ابدأ هذه الخطة", starting: "جارٍ البدء…", leaveThisMap: "غادر هذه الخطة",
    leaveConfirm: "مغادرة هذه الخطة؟", leaveBody: "تبقى حصصك المسجّلة محفوظة. يمكنك البدء من جديد وقتما تشاء.",
    couldNotLeave: "تعذّرت المغادرة", tryAgainMoment: "حاول مرة أخرى بعد قليل.", perWeek: "أسبوعيًا",
    sessions: "الحصص", thisWeek: "هذا الأسبوع", sessionsDoneThisWeek: "حصص أُنجزت هذا الأسبوع",
    startSession: "ابدأ الحصة", howItIsBuilt: "كيف بُنيت", equipment: "المعدات",
    yourHistoryOnThisMap: "سجلك في هذه الخطة", yourHistory: "سجلك",
    nothingLogged: "لم يُسجَّل شيء بعد", totalVolume: "الحجم الإجمالي", bestSession: "أفضل حصة",
  },
  exercise: {
    movement: "الحركة", howToDoIt: "كيف تؤديها", theOneCue: "الإرشاد الأهم",
    whatGoesWrong: "الأخطاء الشائعة", howToGetBetter: "كيف تتحسّن فيها",
  },
  reviews: {
    readTheReviews: "اقرأ التقييمات", noneYet: "لا توجد تقييمات بعد", nobodyHasWritten: "لم يكتب أحد تقييمًا بعد",
    writeAReview: "اكتب تقييمًا", editYourReview: "عدّل تقييمك", yourReview: "تقييمك",
    headline: "العنوان", headlinePlaceholder: "لخّصه في بضع كلمات", whatYouThought: "ما رأيك",
    bodyPlaceholder: "كيف تستخدمه، منذ متى، وما الذي ستقوله لمن يفكّر في شرائه.",
    saving: "جارٍ الحفظ…", saveFailed: "لم يُحفظ. حاول مرة أخرى بعد قليل.", verifiedPurchase: "شراء موثّق",
  },
};

const fr: S = {
  fitnessAge: {
    title: "Âge physique", yourEstimate: "Votre estimation", actualAge: "Âge réel", fitnessAge: "Âge physique",
    difference: "Différence", rightOnYourYears: "Pile sur vos années", notEnoughYet: "Pas encore assez de données",
    addYourDetails: "Ajoutez vos informations", howItMoved: "Comment il a évolué", whatWentIntoIt: "Ce qui a servi au calcul",
    theMethod: "La méthode", boundNotReading: "C’est une borne, pas une mesure", atLeast: "Au moins ",
    methodVo2: "La maximale divisée par celle au repos donne une VO₂max — Uth, Sørensen, Overgaard et Pedersen (2004), la seule estimation qui ne demande que deux fréquences cardiaques.",
    methodMedian: "Le résultat est comparé à une personne médiane de votre sexe passée dans la même équation. Entrez la médiane de la population et la réponse est votre âge réel.",
  },
  pairing: {
    meetYourV1: "Voici votre V1.", chooseYourV1: "Choisissez votre V1.", chooseYourArm: "Choisissez votre bras.",
    chooseAV1First: "Choisissez d’abord une V1.", bringV1Close: "Approchez la V1.", connecting: "Connexion.",
    makingItYours: "On la met à votre nom.", connectionComplete: "Connexion terminée", tryAgain: "On réessaie.",
    bluetoothLink: "Liaison Bluetooth", bluetoothHandshake: "Établissement Bluetooth",
    bluetoothPermission: "L’autorisation Bluetooth est nécessaire pour trouver votre V1.", moveCloser: "Rapprochez-vous",
    needsAttention: "À vérifier", noneAppeared: "Aucune V1 trouvée. Réveillez le bracelet, tenez-le près et relancez la recherche.",
    onlyNearby: "Seuls les appareils proches dont le numéro de série commence par TF1 apparaissent ici.",
    matchSerial: "Comparez le numéro ci-dessous au code imprimé à l’intérieur de la boucle du bracelet.",
    leftArm: "Bras gauche", rightArm: "Bras droit", battery: "Batterie", firmware: "Micrologiciel", signalUnknown: "Signal inconnu", veryClose: "Très proche", nearby: "À proximité",
  },
  health: {
    title: "Connexions santé", connected: "Connecté", nothingYet: "Rien pour l’instant", addAnother: "En ajouter une",
    unavailable: "Santé n’est pas disponible sur cet appareil",
    unavailableBody: "HealthKit n’est pas présent ici — un simulateur, ou un appareil sans l’app Santé.",
    connectNotWired: "Health Connect n’est pas encore branché",
    connectNotWiredBody: "Android lit depuis Health Connect. Cette intégration n’est pas dans cette version ; importez un fichier depuis le site en attendant.",
  },
  maps: {
    startThisMap: "Commencer ce programme", starting: "Démarrage…", leaveThisMap: "Quitter ce programme",
    leaveConfirm: "Quitter ce programme ?", leaveBody: "Vos séances enregistrées sont conservées. Vous pouvez le reprendre quand vous voulez.",
    couldNotLeave: "Impossible de quitter", tryAgainMoment: "Réessayez dans un instant.", perWeek: "Par semaine",
    sessions: "Séances", thisWeek: "Cette semaine", sessionsDoneThisWeek: "Séances faites cette semaine",
    startSession: "Commencer la séance", howItIsBuilt: "Comment il est construit", equipment: "Matériel",
    yourHistoryOnThisMap: "Votre historique sur ce programme", yourHistory: "Votre historique",
    nothingLogged: "Rien d’enregistré", totalVolume: "Volume total", bestSession: "Meilleure séance",
  },
  exercise: {
    movement: "Mouvement", howToDoIt: "Comment le faire", theOneCue: "La consigne essentielle",
    whatGoesWrong: "Les erreurs courantes", howToGetBetter: "Comment progresser",
  },
  reviews: {
    readTheReviews: "Lire les avis", noneYet: "Aucun avis pour l’instant", nobodyHasWritten: "Personne n’en a encore écrit",
    writeAReview: "Écrire un avis", editYourReview: "Modifier votre avis", yourReview: "Votre avis",
    headline: "Titre", headlinePlaceholder: "Résumez en quelques mots", whatYouThought: "Ce que vous en avez pensé",
    bodyPlaceholder: "Comment vous l’utilisez, depuis combien de temps, ce que vous diriez à quelqu’un qui hésite.",
    saving: "Enregistrement…", saveFailed: "Cela n’a pas été enregistré. Réessayez dans un instant.", verifiedPurchase: "Achat vérifié",
  },
};

const de: S = {
  fitnessAge: {
    title: "Fitnessalter", yourEstimate: "Deine Schätzung", actualAge: "Tatsächliches Alter", fitnessAge: "Fitnessalter",
    difference: "Differenz", rightOnYourYears: "Genau auf deinen Jahren", notEnoughYet: "Noch zu wenig für eine Aussage",
    addYourDetails: "Deine Angaben ergänzen", howItMoved: "Wie es sich verändert hat", whatWentIntoIt: "Was eingeflossen ist",
    theMethod: "Die Methode", boundNotReading: "Das ist eine Untergrenze, kein Messwert", atLeast: "Mindestens ",
    methodVo2: "Maximalpuls geteilt durch Ruhepuls ergibt eine VO₂max — Uth, Sørensen, Overgaard und Pedersen (2004), die einzige Schätzung, die nur zwei Herzfrequenzen braucht.",
    methodMedian: "Das wird mit einer Median-Person deines Geschlechts verglichen, durch dieselbe Gleichung geschickt. Setz den Bevölkerungsmedian ein und heraus kommt dein echtes Alter.",
  },
  pairing: {
    meetYourV1: "Das ist dein V1.", chooseYourV1: "Wähle dein V1.", chooseYourArm: "Wähle deinen Arm.",
    chooseAV1First: "Wähle zuerst ein V1.", bringV1Close: "Halte das V1 nah heran.", connecting: "Verbinde.",
    makingItYours: "Wir machen es zu deinem.", connectionComplete: "Verbindung hergestellt", tryAgain: "Versuchen wir das noch einmal.",
    bluetoothLink: "Bluetooth-Verbindung", bluetoothHandshake: "Bluetooth-Handshake",
    bluetoothPermission: "Für die Suche nach deinem V1 wird die Bluetooth-Berechtigung gebraucht.", moveCloser: "Näher herangehen",
    needsAttention: "Braucht Aufmerksamkeit", noneAppeared: "Kein V1 gefunden. Weck das Band, halte es nah und suche erneut.",
    onlyNearby: "Hier erscheinen nur Geräte in der Nähe, deren Seriennummer mit TF1 beginnt.",
    matchSerial: "Vergleiche die Nummer unten mit dem Code innen in der Armbandschlaufe.",
    leftArm: "Linker Arm", rightArm: "Rechter Arm", battery: "Akku", firmware: "Firmware", signalUnknown: "Signal unbekannt", veryClose: "Sehr nah", nearby: "In der Nähe",
  },
  health: {
    title: "Gesundheitsverbindungen", connected: "Verbunden", nothingYet: "Noch nichts", addAnother: "Weitere hinzufügen",
    unavailable: "Health ist auf diesem Gerät nicht verfügbar",
    unavailableBody: "HealthKit ist hier nicht vorhanden — ein Simulator oder ein Gerät ohne die Health-App.",
    connectNotWired: "Health Connect ist noch nicht angebunden",
    connectNotWiredBody: "Android liest aus Health Connect. Diese Anbindung ist in diesem Build nicht enthalten; importiere solange eine Datei über die Website.",
  },
  maps: {
    startThisMap: "Diesen Plan starten", starting: "Wird gestartet…", leaveThisMap: "Plan verlassen",
    leaveConfirm: "Diesen Plan verlassen?", leaveBody: "Deine protokollierten Einheiten bleiben erhalten. Du kannst jederzeit neu starten.",
    couldNotLeave: "Verlassen fehlgeschlagen", tryAgainMoment: "Versuch es gleich noch einmal.", perWeek: "Pro Woche",
    sessions: "Einheiten", thisWeek: "Diese Woche", sessionsDoneThisWeek: "Einheiten diese Woche geschafft",
    startSession: "Einheit starten", howItIsBuilt: "Wie er aufgebaut ist", equipment: "Ausrüstung",
    yourHistoryOnThisMap: "Dein Verlauf in diesem Plan", yourHistory: "Dein Verlauf",
    nothingLogged: "Noch nichts protokolliert", totalVolume: "Gesamtvolumen", bestSession: "Beste Einheit",
  },
  exercise: {
    movement: "Bewegung", howToDoIt: "So geht sie", theOneCue: "Der eine Hinweis",
    whatGoesWrong: "Was schiefgeht", howToGetBetter: "Wie du besser wirst",
  },
  reviews: {
    readTheReviews: "Bewertungen lesen", noneYet: "Noch keine Bewertungen", nobodyHasWritten: "Noch hat niemand eine geschrieben",
    writeAReview: "Bewertung schreiben", editYourReview: "Bewertung bearbeiten", yourReview: "Deine Bewertung",
    headline: "Überschrift", headlinePlaceholder: "Fass es in ein paar Worten zusammen", whatYouThought: "Was du davon hältst",
    bodyPlaceholder: "Wie du es benutzt, wie lange du es hast, was du jemandem sagen würdest, der überlegt.",
    saving: "Wird gespeichert…", saveFailed: "Das wurde nicht gespeichert. Versuch es gleich noch einmal.", verifiedPurchase: "Verifizierter Kauf",
  },
};

const nl: S = {
  fitnessAge: {
    title: "Fitheidsleeftijd", yourEstimate: "Jouw schatting", actualAge: "Werkelijke leeftijd", fitnessAge: "Fitheidsleeftijd",
    difference: "Verschil", rightOnYourYears: "Precies op je jaren", notEnoughYet: "Nog te weinig om iets te zeggen",
    addYourDetails: "Vul je gegevens aan", howItMoved: "Hoe het veranderd is", whatWentIntoIt: "Wat erin is gegaan",
    theMethod: "De methode", boundNotReading: "Dit is een ondergrens, geen meting", atLeast: "Minstens ",
    methodVo2: "Maximale hartslag gedeeld door rusthartslag geeft een VO₂max — Uth, Sørensen, Overgaard en Pedersen (2004), de enige schatting die niets meer nodig heeft dan twee hartslagen.",
    methodMedian: "Dat wordt vergeleken met een mediaan persoon van jouw geslacht door dezelfde vergelijking. Vul de populatiemediaan in en het antwoord is je echte leeftijd.",
  },
  pairing: {
    meetYourV1: "Dit is je V1.", chooseYourV1: "Kies je V1.", chooseYourArm: "Kies je arm.",
    chooseAV1First: "Kies eerst een V1.", bringV1Close: "Houd de V1 dichtbij.", connecting: "Verbinden.",
    makingItYours: "We maken hem van jou.", connectionComplete: "Verbinding gemaakt", tryAgain: "Laten we het opnieuw proberen.",
    bluetoothLink: "Bluetooth-verbinding", bluetoothHandshake: "Bluetooth-handshake",
    bluetoothPermission: "Bluetooth-toestemming is nodig om je V1 te vinden.", moveCloser: "Kom dichterbij",
    needsAttention: "Vraagt aandacht", noneAppeared: "Geen V1 gevonden. Wek het bandje, houd het dichtbij en scan opnieuw.",
    onlyNearby: "Alleen apparaten in de buurt waarvan het serienummer met TF1 begint verschijnen hier.",
    matchSerial: "Vergelijk het nummer hieronder met de code aan de binnenkant van de bandlus.",
    leftArm: "Linkerarm", rightArm: "Rechterarm", battery: "Batterij", firmware: "Firmware", signalUnknown: "Signaal onbekend", veryClose: "Heel dichtbij", nearby: "Dichtbij",
  },
  health: {
    title: "Gezondheidskoppelingen", connected: "Verbonden", nothingYet: "Nog niets", addAnother: "Nog een toevoegen",
    unavailable: "Gezondheid is niet beschikbaar op dit apparaat",
    unavailableBody: "HealthKit is hier niet aanwezig — een simulator, of een apparaat zonder de Gezondheid-app.",
    connectNotWired: "Health Connect is nog niet aangesloten",
    connectNotWiredBody: "Android leest uit Health Connect. Die koppeling zit niet in deze build; importeer ondertussen een bestand via de website.",
  },
  maps: {
    startThisMap: "Dit programma starten", starting: "Starten…", leaveThisMap: "Programma verlaten",
    leaveConfirm: "Dit programma verlaten?", leaveBody: "Je vastgelegde sessies blijven bewaard. Je kunt altijd opnieuw beginnen.",
    couldNotLeave: "Verlaten mislukt", tryAgainMoment: "Probeer het zo nog eens.", perWeek: "Per week",
    sessions: "Sessies", thisWeek: "Deze week", sessionsDoneThisWeek: "Sessies deze week gedaan",
    startSession: "Sessie starten", howItIsBuilt: "Hoe het is opgebouwd", equipment: "Materiaal",
    yourHistoryOnThisMap: "Je geschiedenis in dit programma", yourHistory: "Je geschiedenis",
    nothingLogged: "Nog niets vastgelegd", totalVolume: "Totaal volume", bestSession: "Beste sessie",
  },
  exercise: {
    movement: "Beweging", howToDoIt: "Hoe je het doet", theOneCue: "De ene aanwijzing",
    whatGoesWrong: "Wat er misgaat", howToGetBetter: "Hoe je er beter in wordt",
  },
  reviews: {
    readTheReviews: "Beoordelingen lezen", noneYet: "Nog geen beoordelingen", nobodyHasWritten: "Niemand heeft er nog een geschreven",
    writeAReview: "Beoordeling schrijven", editYourReview: "Je beoordeling bewerken", yourReview: "Jouw beoordeling",
    headline: "Kop", headlinePlaceholder: "Vat het in een paar woorden samen", whatYouThought: "Wat je ervan vond",
    bodyPlaceholder: "Hoe je het gebruikt, hoe lang je het hebt, wat je zou zeggen tegen iemand die twijfelt.",
    saving: "Opslaan…", saveFailed: "Dat is niet opgeslagen. Probeer het zo nog eens.", verifiedPurchase: "Geverifieerde aankoop",
  },
};

const pt: S = {
  fitnessAge: {
    title: "Idade física", yourEstimate: "A tua estimativa", actualAge: "Idade real", fitnessAge: "Idade física",
    difference: "Diferença", rightOnYourYears: "Certinho nos teus anos", notEnoughYet: "Ainda não há dados suficientes",
    addYourDetails: "Acrescenta os teus dados", howItMoved: "Como se moveu", whatWentIntoIt: "O que entrou no cálculo",
    theMethod: "O método", boundNotReading: "Isto é um limite, não uma leitura", atLeast: "Pelo menos ",
    methodVo2: "A máxima sobre a de repouso dá um VO₂máx — Uth, Sørensen, Overgaard e Pedersen (2004), a única estimativa que só precisa de duas frequências cardíacas.",
    methodMedian: "Isso é comparado com uma pessoa mediana do teu sexo passada pela mesma equação. Introduz a mediana da população e a resposta é a tua idade real.",
  },
  pairing: {
    meetYourV1: "Conhece a tua V1.", chooseYourV1: "Escolhe a tua V1.", chooseYourArm: "Escolhe o teu braço.",
    chooseAV1First: "Escolhe primeiro uma V1.", bringV1Close: "Aproxima a V1.", connecting: "A ligar.",
    makingItYours: "A torná-la tua.", connectionComplete: "Ligação concluída", tryAgain: "Vamos tentar outra vez.",
    bluetoothLink: "Ligação Bluetooth", bluetoothHandshake: "Handshake Bluetooth",
    bluetoothPermission: "É preciso permissão de Bluetooth para encontrar a tua V1.", moveCloser: "Aproxima-te mais",
    needsAttention: "Precisa de atenção", noneAppeared: "Não apareceu nenhuma V1. Acorda a pulseira, aproxima-a e procura de novo.",
    onlyNearby: "Só aparecem aqui dispositivos próximos cujo número de série começa por TF1.",
    matchSerial: "Compara o número abaixo com o código impresso dentro da argola da bracelete.",
    leftArm: "Braço esquerdo", rightArm: "Braço direito", battery: "Bateria", firmware: "Firmware", signalUnknown: "Sinal desconhecido", veryClose: "Muito perto", nearby: "Perto",
  },
  health: {
    title: "Ligações de saúde", connected: "Ligado", nothingYet: "Nada ainda", addAnother: "Adicionar outra",
    unavailable: "A Saúde não está disponível neste dispositivo",
    unavailableBody: "O HealthKit não está presente aqui — um simulador, ou um dispositivo sem a app Saúde.",
    connectNotWired: "O Health Connect ainda não está ligado",
    connectNotWiredBody: "O Android lê do Health Connect. Essa integração não está nesta versão; entretanto importa um ficheiro a partir do site.",
  },
  maps: {
    startThisMap: "Começar este plano", starting: "A começar…", leaveThisMap: "Sair deste plano",
    leaveConfirm: "Sair deste plano?", leaveBody: "As tuas sessões registadas ficam guardadas. Podes recomeçar quando quiseres.",
    couldNotLeave: "Não foi possível sair", tryAgainMoment: "Tenta de novo daqui a pouco.", perWeek: "Por semana",
    sessions: "Sessões", thisWeek: "Esta semana", sessionsDoneThisWeek: "Sessões feitas esta semana",
    startSession: "Começar sessão", howItIsBuilt: "Como está construído", equipment: "Equipamento",
    yourHistoryOnThisMap: "O teu histórico neste plano", yourHistory: "O teu histórico",
    nothingLogged: "Nada registado ainda", totalVolume: "Volume total", bestSession: "Melhor sessão",
  },
  exercise: {
    movement: "Movimento", howToDoIt: "Como se faz", theOneCue: "A dica principal",
    whatGoesWrong: "O que costuma correr mal", howToGetBetter: "Como melhorar nisto",
  },
  reviews: {
    readTheReviews: "Ler as avaliações", noneYet: "Ainda sem avaliações", nobodyHasWritten: "Ainda ninguém escreveu uma",
    writeAReview: "Escrever uma avaliação", editYourReview: "Editar a tua avaliação", yourReview: "A tua avaliação",
    headline: "Título", headlinePlaceholder: "Resume em poucas palavras", whatYouThought: "O que achaste",
    bodyPlaceholder: "Como o usas, há quanto tempo o tens, o que dirias a alguém que está a decidir.",
    saving: "A guardar…", saveFailed: "Não foi guardado. Tenta de novo daqui a pouco.", verifiedPurchase: "Compra verificada",
  },
};

const it: S = {
  fitnessAge: {
    title: "Età fisica", yourEstimate: "La tua stima", actualAge: "Età reale", fitnessAge: "Età fisica",
    difference: "Differenza", rightOnYourYears: "Esattamente sui tuoi anni", notEnoughYet: "Non c’è ancora abbastanza",
    addYourDetails: "Aggiungi i tuoi dati", howItMoved: "Come si è mossa", whatWentIntoIt: "Cosa è entrato nel calcolo",
    theMethod: "Il metodo", boundNotReading: "Questo è un limite, non una misura", atLeast: "Almeno ",
    methodVo2: "La massima sulla frequenza a riposo dà un VO₂max — Uth, Sørensen, Overgaard e Pedersen (2004), l’unica stima che richiede solo due frequenze cardiache.",
    methodMedian: "Il risultato viene confrontato con una persona mediana del tuo sesso passata nella stessa equazione. Inserisci la mediana della popolazione e la risposta è la tua età reale.",
  },
  pairing: {
    meetYourV1: "Ecco il tuo V1.", chooseYourV1: "Scegli il tuo V1.", chooseYourArm: "Scegli il braccio.",
    chooseAV1First: "Scegli prima un V1.", bringV1Close: "Avvicina il V1.", connecting: "Connessione.",
    makingItYours: "Lo stiamo rendendo tuo.", connectionComplete: "Connessione completata", tryAgain: "Riproviamo.",
    bluetoothLink: "Collegamento Bluetooth", bluetoothHandshake: "Handshake Bluetooth",
    bluetoothPermission: "Serve il permesso Bluetooth per trovare il tuo V1.", moveCloser: "Avvicinati",
    needsAttention: "Richiede attenzione", noneAppeared: "Nessun V1 trovato. Sveglia il bracciale, tienilo vicino e cerca di nuovo.",
    onlyNearby: "Qui compaiono solo i dispositivi vicini il cui numero di serie inizia con TF1.",
    matchSerial: "Confronta il numero qui sotto con il codice stampato dentro l’asola del cinturino.",
    leftArm: "Braccio sinistro", rightArm: "Braccio destro", battery: "Batteria", firmware: "Firmware", signalUnknown: "Segnale sconosciuto", veryClose: "Molto vicino", nearby: "Vicino",
  },
  health: {
    title: "Connessioni salute", connected: "Connesso", nothingYet: "Ancora niente", addAnother: "Aggiungine un’altra",
    unavailable: "Salute non è disponibile su questo dispositivo",
    unavailableBody: "HealthKit non è presente qui — un simulatore, o un dispositivo senza l’app Salute.",
    connectNotWired: "Health Connect non è ancora collegato",
    connectNotWiredBody: "Android legge da Health Connect. Quell’integrazione non è in questa build; intanto importa un file dal sito.",
  },
  maps: {
    startThisMap: "Inizia questo programma", starting: "Avvio…", leaveThisMap: "Abbandona il programma",
    leaveConfirm: "Abbandonare questo programma?", leaveBody: "Le sessioni registrate restano. Puoi ricominciarlo quando vuoi.",
    couldNotLeave: "Impossibile abbandonare", tryAgainMoment: "Riprova tra un momento.", perWeek: "A settimana",
    sessions: "Sessioni", thisWeek: "Questa settimana", sessionsDoneThisWeek: "Sessioni fatte questa settimana",
    startSession: "Inizia la sessione", howItIsBuilt: "Com’è costruito", equipment: "Attrezzatura",
    yourHistoryOnThisMap: "Il tuo storico su questo programma", yourHistory: "Il tuo storico",
    nothingLogged: "Ancora niente registrato", totalVolume: "Volume totale", bestSession: "Sessione migliore",
  },
  exercise: {
    movement: "Movimento", howToDoIt: "Come si esegue", theOneCue: "L’indicazione chiave",
    whatGoesWrong: "Cosa va storto", howToGetBetter: "Come migliorare",
  },
  reviews: {
    readTheReviews: "Leggi le recensioni", noneYet: "Ancora nessuna recensione", nobodyHasWritten: "Nessuno ne ha ancora scritta una",
    writeAReview: "Scrivi una recensione", editYourReview: "Modifica la tua recensione", yourReview: "La tua recensione",
    headline: "Titolo", headlinePlaceholder: "Riassumilo in poche parole", whatYouThought: "Cosa ne pensi",
    bodyPlaceholder: "Come lo usi, da quanto ce l’hai, cosa diresti a chi sta decidendo.",
    saving: "Salvataggio…", saveFailed: "Non è stato salvato. Riprova tra un momento.", verifiedPurchase: "Acquisto verificato",
  },
};

const tr: S = {
  fitnessAge: {
    title: "Fitness yaşı", yourEstimate: "Tahminin", actualAge: "Gerçek yaş", fitnessAge: "Fitness yaşı",
    difference: "Fark", rightOnYourYears: "Tam yaşında", notEnoughYet: "Söylemek için henüz yeterli veri yok",
    addYourDetails: "Bilgilerini ekle", howItMoved: "Nasıl değişti", whatWentIntoIt: "Hesaba ne girdi",
    theMethod: "Yöntem", boundNotReading: "Bu bir alt sınır, ölçüm değil", atLeast: "En az ",
    methodVo2: "Maksimum nabzın dinlenme nabzına oranı VO₂max verir — Uth, Sørensen, Overgaard ve Pedersen (2004); yalnızca iki nabız değeri isteyen tek tahmin.",
    methodMedian: "Bu, aynı denklemden geçirilen kendi cinsiyetindeki ortanca bir kişiyle karşılaştırılır. Nüfus ortancasını girersen sonuç gerçek yaşın olur.",
  },
  pairing: {
    meetYourV1: "V1’inle tanış.", chooseYourV1: "V1’ini seç.", chooseYourArm: "Kolunu seç.",
    chooseAV1First: "Önce bir V1 seç.", bringV1Close: "V1’i yaklaştır.", connecting: "Bağlanıyor.",
    makingItYours: "Seninkine dönüştürülüyor.", connectionComplete: "Bağlantı tamamlandı", tryAgain: "Tekrar deneyelim.",
    bluetoothLink: "Bluetooth bağlantısı", bluetoothHandshake: "Bluetooth el sıkışması",
    bluetoothPermission: "V1’ini bulmak için Bluetooth izni gerekiyor.", moveCloser: "Daha da yaklaş",
    needsAttention: "İlgi gerekiyor", noneAppeared: "Hiçbir V1 görünmedi. Bilekliği uyandır, yakın tut ve yeniden tara.",
    onlyNearby: "Burada yalnızca seri numarası TF1 ile başlayan yakındaki cihazlar görünür.",
    matchSerial: "Aşağıdaki seri numarasını kordon ilmeğinin içindeki kodla karşılaştır.",
    leftArm: "Sol kol", rightArm: "Sağ kol", battery: "Pil", firmware: "Yazılım", signalUnknown: "Sinyal bilinmiyor", veryClose: "Çok yakın", nearby: "Yakında",
  },
  health: {
    title: "Sağlık bağlantıları", connected: "Bağlı", nothingYet: "Henüz yok", addAnother: "Bir tane daha ekle",
    unavailable: "Sağlık bu cihazda kullanılamıyor",
    unavailableBody: "HealthKit burada yok — bir simülatör ya da Sağlık uygulaması olmayan bir cihaz.",
    connectNotWired: "Health Connect henüz bağlanmadı",
    connectNotWiredBody: "Android, Health Connect'ten okur. Bu entegrasyon bu sürümde yok; bu arada siteden dosya içe aktarabilirsin.",
  },
  maps: {
    startThisMap: "Bu programı başlat", starting: "Başlatılıyor…", leaveThisMap: "Programdan ayrıl",
    leaveConfirm: "Bu programdan ayrılınsın mı?", leaveBody: "Kaydettiğin antrenmanlar kayıtta kalır. İstediğin zaman yeniden başlayabilirsin.",
    couldNotLeave: "Ayrılınamadı", tryAgainMoment: "Birazdan tekrar dene.", perWeek: "Haftada",
    sessions: "Antrenmanlar", thisWeek: "Bu hafta", sessionsDoneThisWeek: "Bu hafta tamamlanan antrenman",
    startSession: "Antrenmanı başlat", howItIsBuilt: "Nasıl kurgulandı", equipment: "Ekipman",
    yourHistoryOnThisMap: "Bu programdaki geçmişin", yourHistory: "Geçmişin",
    nothingLogged: "Henüz kayıt yok", totalVolume: "Toplam hacim", bestSession: "En iyi antrenman",
  },
  exercise: {
    movement: "Hareket", howToDoIt: "Nasıl yapılır", theOneCue: "Tek kritik ipucu",
    whatGoesWrong: "Nerede hata yapılır", howToGetBetter: "Nasıl geliştirilir",
  },
  reviews: {
    readTheReviews: "Yorumları oku", noneYet: "Henüz yorum yok", nobodyHasWritten: "Henüz kimse yazmadı",
    writeAReview: "Yorum yaz", editYourReview: "Yorumunu düzenle", yourReview: "Yorumun",
    headline: "Başlık", headlinePlaceholder: "Birkaç kelimeyle özetle", whatYouThought: "Ne düşündün",
    bodyPlaceholder: "Nasıl kullanıyorsun, ne zamandır sende, karar vermeye çalışan birine ne söylerdin.",
    saving: "Kaydediliyor…", saveFailed: "Kaydedilemedi. Birazdan tekrar dene.", verifiedPurchase: "Doğrulanmış satın alma",
  },
};

const ru: S = {
  fitnessAge: {
    title: "Фитнес-возраст", yourEstimate: "Ваша оценка", actualAge: "Реальный возраст", fitnessAge: "Фитнес-возраст",
    difference: "Разница", rightOnYourYears: "Ровно по вашим годам", notEnoughYet: "Пока недостаточно данных",
    addYourDetails: "Добавьте свои данные", howItMoved: "Как он менялся", whatWentIntoIt: "Что вошло в расчёт",
    theMethod: "Метод", boundNotReading: "Это нижняя граница, а не измерение", atLeast: "Не менее ",
    methodVo2: "Максимальный пульс, делённый на пульс покоя, даёт VO₂max — Uth, Sørensen, Overgaard и Pedersen (2004), единственная оценка, которой нужны только два значения пульса.",
    methodMedian: "Результат сравнивается с медианным человеком вашего пола, пропущенным через то же уравнение. Подставьте популяционную медиану — и получите свой реальный возраст.",
  },
  pairing: {
    meetYourV1: "Знакомьтесь, ваш V1.", chooseYourV1: "Выберите свой V1.", chooseYourArm: "Выберите руку.",
    chooseAV1First: "Сначала выберите V1.", bringV1Close: "Поднесите V1 ближе.", connecting: "Подключение.",
    makingItYours: "Делаем его вашим.", connectionComplete: "Подключение завершено", tryAgain: "Попробуем ещё раз.",
    bluetoothLink: "Связь по Bluetooth", bluetoothHandshake: "Рукопожатие Bluetooth",
    bluetoothPermission: "Чтобы найти ваш V1, нужно разрешение на Bluetooth.", moveCloser: "Подойдите ближе",
    needsAttention: "Требует внимания", noneAppeared: "V1 не найден. Разбудите браслет, поднесите ближе и повторите поиск.",
    onlyNearby: "Здесь показаны только ближайшие устройства, серийный номер которых начинается с TF1.",
    matchSerial: "Сверьте номер ниже с кодом, напечатанным внутри петли ремешка.",
    leftArm: "Левая рука", rightArm: "Правая рука", battery: "Батарея", firmware: "Прошивка", signalUnknown: "Сигнал неизвестен", veryClose: "Очень близко", nearby: "Рядом",
  },
  health: {
    title: "Подключения здоровья", connected: "Подключено", nothingYet: "Пока ничего", addAnother: "Добавить ещё",
    unavailable: "«Здоровье» недоступно на этом устройстве",
    unavailableBody: "HealthKit здесь отсутствует — симулятор или устройство без приложения «Здоровье».",
    connectNotWired: "Health Connect ещё не подключён",
    connectNotWiredBody: "Android читает из Health Connect. Этой интеграции нет в текущей сборке; пока импортируйте файл с сайта.",
  },
  maps: {
    startThisMap: "Начать этот план", starting: "Запуск…", leaveThisMap: "Покинуть план",
    leaveConfirm: "Покинуть этот план?", leaveBody: "Записанные тренировки сохранятся. Вы можете начать заново в любой момент.",
    couldNotLeave: "Не удалось выйти", tryAgainMoment: "Попробуйте через мгновение.", perWeek: "В неделю",
    sessions: "Тренировки", thisWeek: "На этой неделе", sessionsDoneThisWeek: "Тренировок за эту неделю",
    startSession: "Начать тренировку", howItIsBuilt: "Как он устроен", equipment: "Оборудование",
    yourHistoryOnThisMap: "Ваша история в этом плане", yourHistory: "Ваша история",
    nothingLogged: "Пока ничего не записано", totalVolume: "Общий объём", bestSession: "Лучшая тренировка",
  },
  exercise: {
    movement: "Движение", howToDoIt: "Как выполнять", theOneCue: "Главная подсказка",
    whatGoesWrong: "Что идёт не так", howToGetBetter: "Как стать лучше",
  },
  reviews: {
    readTheReviews: "Читать отзывы", noneYet: "Отзывов пока нет", nobodyHasWritten: "Ещё никто не написал",
    writeAReview: "Написать отзыв", editYourReview: "Изменить отзыв", yourReview: "Ваш отзыв",
    headline: "Заголовок", headlinePlaceholder: "Опишите в двух словах", whatYouThought: "Что вы думаете",
    bodyPlaceholder: "Как вы им пользуетесь, как долго он у вас, что бы вы сказали тому, кто выбирает.",
    saving: "Сохранение…", saveFailed: "Не сохранилось. Попробуйте через мгновение.", verifiedPurchase: "Подтверждённая покупка",
  },
};

export const appScreens: Record<AppLocale, AppScreensCopy> = { en, es, ar, fr, de, nl, pt, it, tr, ru };
