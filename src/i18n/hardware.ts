import type { Locale } from "./config";

/**
 * The hardware page.
 *
 * Written out per locale rather than an `ar ? … : …` ternary, which is what
 * left eight languages reading English on the other newer pages.
 *
 * Claim discipline carried over from the rest of the site: the Scale reports
 * a bioelectrical-impedance *estimate*, not a clinical measurement, and it is
 * never compared to a named medical device. The Band reads heart rate,
 * movement and sleep — it does not count reps.
 */
export type HardwareCopy = {
  eyebrow: string;
  title: string;
  lede: string;
  preorder: string;
  band: { name: string; tagline: string; body: string; points: [string, string, string] };
  scale: { name: string; tagline: string; body: string; points: [string, string, string] };
  together: { eyebrow: string; title: string; body: string; points: [string, string, string] };
  plan: {
    eyebrow: string;
    title: string;
    freeTitle: string;
    freeBody: string;
    proTitle: string;
    proBody: string;
    cta: string;
  };
  note: string;
  seeApp: string;
};

const copy: Record<Locale, HardwareCopy> = {
  en: {
    eyebrow: "Terrifit hardware",
    title: "Two devices. One picture of you.",
    lede: "The Band reads you while you live. The Scale reads what that living built. Both write into the same app, and the app is free.",
    preorder: "Pre-order",
    band: {
      name: "Terrifit Band",
      tagline: "On you, around the clock.",
      body: "No session to start and nothing to charge overnight for a fortnight. It reads continuously from the moment you fasten it, which is the only way a baseline that means anything gets built.",
      points: [
        "Heart rate, HRV, breathing and blood oxygen, awake and asleep",
        "Recovery each morning, strain through the day",
        "Fifteen days a charge, so it is never off your wrist",
      ],
    },
    scale: {
      name: "Terrifit Scale",
      tagline: "What the training actually changed.",
      body: "Weight on its own cannot tell you whether a hard month added muscle or cost you it. A bioelectrical-impedance reading separates the two, so the number on the floor stops being the whole story.",
      points: [
        "Weight, body fat, muscle mass and body water",
        "Every reading charted against the last, not just today's figure",
        "Steps on, syncs, done — no app to open first",
      ],
    },
    together: {
      eyebrow: "One ecosystem",
      title: "Neither number means much alone.",
      body: "A wearable tells you how hard the month was. A scale tells you what the month did. Terrifit is the only place they sit on one timeline, under one account, read by the same app.",
      points: [
        "Weight down 0.8 kg — and fat mass down 0.6 kg, so it was not muscle",
        "Recovery up 7% while training volume rose 4%, so the load is landing",
        "A plateau on the scale, explained by three weeks of poor sleep",
      ],
    },
    plan: {
      eyebrow: "What it costs to use",
      title: "The app is free. It stays free.",
      freeTitle: "Free, forever",
      freeBody: "Both devices, every daily reading, your training and your logged workouts. Buying the hardware does not sign you up to anything.",
      proTitle: "Terrifit Pro",
      proBody: "For the work that needs weeks of history behind it: body-composition trends, sleep quality, stress and body battery, and the longer record they are read against.",
      cta: "Compare membership",
    },
    note: "Body-composition figures are bioelectrical-impedance estimates for fitness and wellness use. They are not clinical measurements and cannot diagnose anything. Pre-orders are refundable in full until your device ships.",
    seeApp: "See the app",
  },
  ar: {
    eyebrow: "أجهزة تيريفت",
    title: "جهازان. صورة واحدة عنك.",
    lede: "السوار يقرأك وأنت تعيش. والميزان يقرأ ما بنته هذه الحياة. كلاهما يكتب في التطبيق نفسه، والتطبيق مجاني.",
    preorder: "احجز مسبقاً",
    band: {
      name: "سوار تيريفت",
      tagline: "معك، على مدار الساعة.",
      body: "لا جلسة تبدؤها ولا شحن ليليّ لأسبوعين. يقرأ باستمرار منذ لحظة إغلاقه على معصمك، وهي الطريقة الوحيدة لبناء خطّ أساس له معنى.",
      points: [
        "النبض وتغيّره والتنفّس وأكسجين الدم، في اليقظة والنوم",
        "التعافي كل صباح، والجهد عبر اليوم",
        "خمسة عشر يوماً بشحنة واحدة، فلا يفارق معصمك",
      ],
    },
    scale: {
      name: "ميزان تيريفت",
      tagline: "ما الذي غيّره تدريبك فعلاً.",
      body: "الوزن وحده لا يخبرك إن كان شهر شاقّ قد أضاف عضلاً أم كلّفك إيّاه. قياس المعاوقة الكهربائية الحيوية يفصل بينهما، فيتوقّف الرقم على الأرض عن كونه القصة كلها.",
      points: [
        "الوزن ونسبة الدهون وكتلة العضل وماء الجسم",
        "كل قراءة مرسومة مقابل سابقتها، لا رقم اليوم وحده",
        "قِف عليه فيتزامن — دون فتح تطبيق أولاً",
      ],
    },
    together: {
      eyebrow: "منظومة واحدة",
      title: "لا رقم منهما يعني الكثير وحده.",
      body: "الجهاز القابل للارتداء يخبرك كم كان الشهر شاقاً. والميزان يخبرك بما فعله الشهر. وتيريفت هو المكان الوحيد الذي يجتمعان فيه على خط زمني واحد، وحساب واحد، ويقرؤهما التطبيق نفسه.",
      points: [
        "الوزن أقل بـ 0.8 كجم — وكتلة الدهون أقل بـ 0.6 كجم، إذن لم يكن عضلاً",
        "التعافي أعلى 7% مع ارتفاع حجم التدريب 4%، إذن الحمل يؤتي ثماره",
        "ثبات على الميزان، يفسّره ثلاثة أسابيع من النوم السيئ",
      ],
    },
    plan: {
      eyebrow: "تكلفة الاستخدام",
      title: "التطبيق مجاني. وسيبقى كذلك.",
      freeTitle: "مجاني، إلى الأبد",
      freeBody: "الجهازان، وكل قراءة يومية، وتدريبك وتماريـنك المسجّلة. شراء الجهاز لا يلزمك بأي اشتراك.",
      proTitle: "Terrifit Pro",
      proBody: "لما يحتاج أسابيع من السجل خلفه: اتجاهات تركيب الجسم، وجودة النوم، والتوتر وطاقة الجسم، والسجل الأطول الذي تُقرأ مقابله.",
      cta: "قارن العضويات",
    },
    note: "أرقام تركيب الجسم تقديرات بالمعاوقة الكهربائية الحيوية لأغراض اللياقة والعافية. ليست قياسات سريرية ولا تشخّص أي شيء. الحجوزات قابلة للاسترداد بالكامل حتى شحن جهازك.",
    seeApp: "شاهد التطبيق",
  },
  es: {
    eyebrow: "Hardware Terrifit",
    title: "Dos dispositivos. Una imagen de ti.",
    lede: "La pulsera te lee mientras vives. La báscula lee lo que esa vida construyó. Ambos escriben en la misma app, y la app es gratis.",
    preorder: "Reservar",
    band: {
      name: "Pulsera Terrifit",
      tagline: "Contigo, las veinticuatro horas.",
      body: "Ninguna sesión que iniciar y nada que cargar por la noche durante quince días. Lee de forma continua desde que te la abrochas, que es la única manera de construir una línea base que signifique algo.",
      points: [
        "Pulso, VFC, respiración y oxígeno en sangre, despierto y dormido",
        "Recuperación cada mañana, esfuerzo a lo largo del día",
        "Quince días por carga, así que nunca sale de tu muñeca",
      ],
    },
    scale: {
      name: "Báscula Terrifit",
      tagline: "Lo que el entrenamiento cambió de verdad.",
      body: "El peso por sí solo no dice si un mes duro añadió músculo o te lo costó. Una lectura por impedancia bioeléctrica separa las dos cosas, y el número del suelo deja de ser toda la historia.",
      points: [
        "Peso, grasa corporal, masa muscular y agua corporal",
        "Cada lectura trazada frente a la anterior, no solo la cifra de hoy",
        "Te subes, sincroniza, listo — sin abrir la app antes",
      ],
    },
    together: {
      eyebrow: "Un ecosistema",
      title: "Ninguno de los dos números dice mucho solo.",
      body: "Un wearable te dice lo duro que fue el mes. Una báscula te dice qué hizo el mes. Terrifit es el único sitio donde conviven en una línea de tiempo, bajo una cuenta, leídos por la misma app.",
      points: [
        "Peso −0,8 kg, y grasa −0,6 kg: no fue músculo",
        "Recuperación +7% con el volumen subiendo un 4%: la carga está cuajando",
        "Un estancamiento en la báscula, explicado por tres semanas durmiendo mal",
      ],
    },
    plan: {
      eyebrow: "Lo que cuesta usarlo",
      title: "La app es gratis. Y sigue siéndolo.",
      freeTitle: "Gratis, para siempre",
      freeBody: "Ambos dispositivos, cada lectura diaria, tu entrenamiento y tus sesiones registradas. Comprar el hardware no te suscribe a nada.",
      proTitle: "Terrifit Pro",
      proBody: "Para lo que necesita semanas de historial detrás: tendencias de composición corporal, calidad del sueño, estrés y batería corporal, y el registro más largo con el que se leen.",
      cta: "Comparar membresía",
    },
    note: "Las cifras de composición corporal son estimaciones por impedancia bioeléctrica para uso deportivo y de bienestar. No son mediciones clínicas y no diagnostican nada. Las reservas son totalmente reembolsables hasta que se envíe tu dispositivo.",
    seeApp: "Ver la app",
  },
  fr: {
    eyebrow: "Matériel Terrifit",
    title: "Deux appareils. Une seule image de vous.",
    lede: "Le bracelet vous lit pendant que vous vivez. La balance lit ce que cette vie a construit. Les deux écrivent dans la même app, et l’app est gratuite.",
    preorder: "Précommander",
    band: {
      name: "Bracelet Terrifit",
      tagline: "Sur vous, en permanence.",
      body: "Aucune séance à lancer et rien à recharger la nuit pendant quinze jours. Il mesure en continu dès que vous le fermez, seule façon de construire une base de référence qui veuille dire quelque chose.",
      points: [
        "Fréquence cardiaque, VFC, respiration et oxygène sanguin, éveillé et endormi",
        "Récupération chaque matin, charge tout au long de la journée",
        "Quinze jours par charge : il ne quitte jamais votre poignet",
      ],
    },
    scale: {
      name: "Balance Terrifit",
      tagline: "Ce que l’entraînement a réellement changé.",
      body: "Le poids seul ne dit pas si un mois difficile a ajouté du muscle ou vous en a coûté. Une mesure par impédance bioélectrique sépare les deux, et le chiffre au sol cesse d’être toute l’histoire.",
      points: [
        "Poids, masse grasse, masse musculaire et eau corporelle",
        "Chaque relevé tracé face au précédent, pas seulement le chiffre du jour",
        "Vous montez, ça se synchronise, c’est fait — sans ouvrir l’app d’abord",
      ],
    },
    together: {
      eyebrow: "Un écosystème",
      title: "Aucun des deux chiffres ne dit grand-chose seul.",
      body: "Un bracelet vous dit à quel point le mois a été dur. Une balance vous dit ce que le mois a fait. Terrifit est le seul endroit où les deux tiennent sur une même chronologie, sous un même compte, lus par la même app.",
      points: [
        "Poids −0,8 kg, masse grasse −0,6 kg : ce n’était pas du muscle",
        "Récupération +7 % pendant que le volume montait de 4 % : la charge passe",
        "Un plateau sur la balance, expliqué par trois semaines de mauvais sommeil",
      ],
    },
    plan: {
      eyebrow: "Ce que coûte l’usage",
      title: "L’app est gratuite. Elle le reste.",
      freeTitle: "Gratuit, pour toujours",
      freeBody: "Les deux appareils, chaque relevé quotidien, votre entraînement et vos séances enregistrées. Acheter le matériel ne vous engage à rien.",
      proTitle: "Terrifit Pro",
      proBody: "Pour ce qui demande des semaines d’historique : tendances de composition corporelle, qualité du sommeil, stress et réserve d’énergie, et le relevé plus long qui leur donne du sens.",
      cta: "Comparer les abonnements",
    },
    note: "Les chiffres de composition corporelle sont des estimations par impédance bioélectrique, à usage de forme et de bien-être. Ce ne sont pas des mesures cliniques et elles ne diagnostiquent rien. Les précommandes sont intégralement remboursables jusqu’à l’expédition de votre appareil.",
    seeApp: "Voir l’app",
  },
  de: {
    eyebrow: "Terrifit Hardware",
    title: "Zwei Geräte. Ein Bild von dir.",
    lede: "Das Band liest dich, während du lebst. Die Waage liest, was dieses Leben gebaut hat. Beide schreiben in dieselbe App, und die App ist kostenlos.",
    preorder: "Vorbestellen",
    band: {
      name: "Terrifit Band",
      tagline: "An dir, rund um die Uhr.",
      body: "Keine Sitzung zu starten und zwei Wochen lang nichts über Nacht zu laden. Es misst durchgehend ab dem Moment, in dem du es schließt — anders entsteht keine Basislinie, die etwas bedeutet.",
      points: [
        "Herzfrequenz, HRV, Atmung und Blutsauerstoff, wach und im Schlaf",
        "Erholung jeden Morgen, Belastung über den Tag",
        "Fünfzehn Tage pro Ladung, also verlässt es dein Handgelenk nie",
      ],
    },
    scale: {
      name: "Terrifit Waage",
      tagline: "Was das Training wirklich verändert hat.",
      body: "Das Gewicht allein sagt nicht, ob ein harter Monat Muskeln gebracht oder gekostet hat. Eine bioelektrische Impedanzmessung trennt beides, und die Zahl auf dem Boden ist nicht mehr die ganze Geschichte.",
      points: [
        "Gewicht, Körperfett, Muskelmasse und Körperwasser",
        "Jede Messung gegen die vorherige aufgetragen, nicht nur der heutige Wert",
        "Drauf stellen, synchronisiert, fertig — ohne vorher eine App zu öffnen",
      ],
    },
    together: {
      eyebrow: "Ein Ökosystem",
      title: "Keine der beiden Zahlen sagt allein viel.",
      body: "Ein Wearable sagt dir, wie hart der Monat war. Eine Waage sagt dir, was der Monat bewirkt hat. Terrifit ist der einzige Ort, an dem beide auf einer Zeitleiste liegen, unter einem Konto, gelesen von derselben App.",
      points: [
        "Gewicht −0,8 kg, Fettmasse −0,6 kg: es war kein Muskel",
        "Erholung +7 %, während das Volumen um 4 % stieg: die Last kommt an",
        "Ein Plateau auf der Waage, erklärt durch drei Wochen schlechten Schlaf",
      ],
    },
    plan: {
      eyebrow: "Was die Nutzung kostet",
      title: "Die App ist kostenlos. Sie bleibt es.",
      freeTitle: "Kostenlos, für immer",
      freeBody: "Beide Geräte, jede tägliche Messung, dein Training und deine protokollierten Einheiten. Der Kauf der Hardware verpflichtet dich zu nichts.",
      proTitle: "Terrifit Pro",
      proBody: "Für das, was Wochen an Verlauf braucht: Trends der Körperzusammensetzung, Schlafqualität, Stress und Körperbatterie, und der längere Verlauf, gegen den sie gelesen werden.",
      cta: "Mitgliedschaft vergleichen",
    },
    note: "Werte zur Körperzusammensetzung sind bioelektrische Impedanzschätzungen für Fitness und Wohlbefinden. Sie sind keine klinischen Messungen und können nichts diagnostizieren. Vorbestellungen sind bis zum Versand deines Geräts voll erstattungsfähig.",
    seeApp: "Die App ansehen",
  },
  nl: {
    eyebrow: "Terrifit hardware",
    title: "Twee apparaten. Eén beeld van jou.",
    lede: "De band leest je terwijl je leeft. De weegschaal leest wat dat leven heeft opgebouwd. Beide schrijven naar dezelfde app, en de app is gratis.",
    preorder: "Pre-order",
    band: {
      name: "Terrifit Band",
      tagline: "Om je pols, de klok rond.",
      body: "Geen sessie om te starten en veertien dagen niets om 's nachts op te laden. Hij meet continu vanaf het moment dat je hem sluit — de enige manier waarop een basislijn ontstaat die iets betekent.",
      points: [
        "Hartslag, HRV, ademhaling en zuurstof in het bloed, wakker en slapend",
        "Herstel elke ochtend, belasting door de dag heen",
        "Vijftien dagen per lading, dus hij hoeft nooit af",
      ],
    },
    scale: {
      name: "Terrifit Weegschaal",
      tagline: "Wat de training echt veranderde.",
      body: "Gewicht alleen zegt niet of een zware maand spiermassa opleverde of juist kostte. Een bio-elektrische impedantiemeting scheidt die twee, en het getal op de vloer is niet langer het hele verhaal.",
      points: [
        "Gewicht, lichaamsvet, spiermassa en lichaamsvocht",
        "Elke meting uitgezet tegen de vorige, niet alleen het cijfer van vandaag",
        "Erop stappen, synchroniseert, klaar — zonder eerst een app te openen",
      ],
    },
    together: {
      eyebrow: "Eén ecosysteem",
      title: "Geen van beide getallen zegt in zijn eentje veel.",
      body: "Een wearable vertelt hoe zwaar de maand was. Een weegschaal vertelt wat de maand deed. Terrifit is de enige plek waar ze op één tijdlijn staan, onder één account, gelezen door dezelfde app.",
      points: [
        "Gewicht −0,8 kg, vetmassa −0,6 kg: het was geen spier",
        "Herstel +7% terwijl het volume 4% steeg: de belasting landt",
        "Een plateau op de weegschaal, verklaard door drie weken slecht slapen",
      ],
    },
    plan: {
      eyebrow: "Wat het kost om te gebruiken",
      title: "De app is gratis. En dat blijft zo.",
      freeTitle: "Gratis, voor altijd",
      freeBody: "Beide apparaten, elke dagelijkse meting, je training en je gelogde workouts. Hardware kopen verplicht je tot niets.",
      proTitle: "Terrifit Pro",
      proBody: "Voor het werk dat weken geschiedenis nodig heeft: trends in lichaamssamenstelling, slaapkwaliteit, stress en lichaamsbatterij, en de langere reeks waartegen ze gelezen worden.",
      cta: "Lidmaatschap vergelijken",
    },
    note: "Cijfers over lichaamssamenstelling zijn bio-elektrische impedantieschattingen voor fitheid en welzijn. Het zijn geen klinische metingen en ze kunnen niets diagnosticeren. Pre-orders zijn volledig terugbetaalbaar tot je apparaat verzonden is.",
    seeApp: "Bekijk de app",
  },
  pt: {
    eyebrow: "Hardware Terrifit",
    title: "Dois aparelhos. Uma imagem de si.",
    lede: "A pulseira lê-o enquanto vive. A balança lê o que essa vida construiu. Ambos escrevem na mesma app, e a app é grátis.",
    preorder: "Reservar",
    band: {
      name: "Pulseira Terrifit",
      tagline: "Consigo, 24 horas por dia.",
      body: "Nenhuma sessão para iniciar e nada para carregar de noite durante quinze dias. Mede continuamente a partir do momento em que a aperta, que é a única forma de construir uma linha de base com significado.",
      points: [
        "Frequência cardíaca, VFC, respiração e oxigénio no sangue, acordado e a dormir",
        "Recuperação todas as manhãs, esforço ao longo do dia",
        "Quinze dias por carga, por isso nunca sai do pulso",
      ],
    },
    scale: {
      name: "Balança Terrifit",
      tagline: "O que o treino mudou de facto.",
      body: "O peso por si só não diz se um mês duro acrescentou músculo ou lho custou. Uma leitura por impedância bioelétrica separa os dois, e o número no chão deixa de ser a história toda.",
      points: [
        "Peso, gordura corporal, massa muscular e água corporal",
        "Cada leitura traçada contra a anterior, não só o número de hoje",
        "Sobe, sincroniza, pronto — sem abrir a app primeiro",
      ],
    },
    together: {
      eyebrow: "Um ecossistema",
      title: "Nenhum dos números diz muito sozinho.",
      body: "Um wearable diz-lhe quão duro foi o mês. Uma balança diz-lhe o que o mês fez. A Terrifit é o único sítio onde os dois ficam na mesma linha temporal, sob a mesma conta, lidos pela mesma app.",
      points: [
        "Peso −0,8 kg, massa gorda −0,6 kg: não foi músculo",
        "Recuperação +7% com o volume a subir 4%: a carga está a resultar",
        "Um patamar na balança, explicado por três semanas a dormir mal",
      ],
    },
    plan: {
      eyebrow: "O que custa usar",
      title: "A app é grátis. E continua a ser.",
      freeTitle: "Grátis, para sempre",
      freeBody: "Os dois aparelhos, cada leitura diária, o seu treino e as sessões registadas. Comprar o hardware não o inscreve em nada.",
      proTitle: "Terrifit Pro",
      proBody: "Para o que precisa de semanas de histórico: tendências de composição corporal, qualidade do sono, stress e bateria corporal, e o registo mais longo com que são lidos.",
      cta: "Comparar subscrições",
    },
    note: "Os valores de composição corporal são estimativas por impedância bioelétrica para uso desportivo e de bem-estar. Não são medições clínicas e não diagnosticam nada. As reservas são totalmente reembolsáveis até o seu aparelho ser enviado.",
    seeApp: "Ver a app",
  },
  it: {
    eyebrow: "Hardware Terrifit",
    title: "Due dispositivi. Una sola immagine di te.",
    lede: "Il braccialetto ti legge mentre vivi. La bilancia legge ciò che quel vivere ha costruito. Entrambi scrivono nella stessa app, e l’app è gratuita.",
    preorder: "Preordina",
    band: {
      name: "Braccialetto Terrifit",
      tagline: "Addosso, ventiquattr’ore su ventiquattro.",
      body: "Nessuna sessione da avviare e niente da ricaricare la notte per due settimane. Misura di continuo dal momento in cui lo allacci: è l’unico modo per costruire una linea di base che significhi qualcosa.",
      points: [
        "Frequenza cardiaca, HRV, respiro e ossigeno nel sangue, da sveglio e nel sonno",
        "Recupero ogni mattina, sforzo lungo la giornata",
        "Quindici giorni per carica, così non lascia mai il polso",
      ],
    },
    scale: {
      name: "Bilancia Terrifit",
      tagline: "Cosa ha cambiato davvero l’allenamento.",
      body: "Il peso da solo non dice se un mese duro ha aggiunto muscolo o te l’ha tolto. Una lettura a impedenza bioelettrica separa le due cose, e il numero sul pavimento smette di essere tutta la storia.",
      points: [
        "Peso, massa grassa, massa muscolare e acqua corporea",
        "Ogni lettura tracciata rispetto alla precedente, non solo il dato di oggi",
        "Ci sali, sincronizza, fatto — senza aprire prima un’app",
      ],
    },
    together: {
      eyebrow: "Un ecosistema",
      title: "Nessuno dei due numeri dice molto da solo.",
      body: "Un indossabile ti dice quanto è stato duro il mese. Una bilancia ti dice cosa ha fatto il mese. Terrifit è l’unico posto in cui stanno su una sola linea temporale, sotto un solo account, letti dalla stessa app.",
      points: [
        "Peso −0,8 kg, massa grassa −0,6 kg: non era muscolo",
        "Recupero +7% mentre il volume saliva del 4%: il carico sta attecchendo",
        "Un plateau sulla bilancia, spiegato da tre settimane di sonno scarso",
      ],
    },
    plan: {
      eyebrow: "Quanto costa usarlo",
      title: "L’app è gratuita. E resta così.",
      freeTitle: "Gratis, per sempre",
      freeBody: "Entrambi i dispositivi, ogni lettura quotidiana, il tuo allenamento e le sedute registrate. Comprare l’hardware non ti iscrive a nulla.",
      proTitle: "Terrifit Pro",
      proBody: "Per ciò che richiede settimane di storico: andamento della composizione corporea, qualità del sonno, stress e batteria corporea, e il registro più lungo con cui vengono letti.",
      cta: "Confronta gli abbonamenti",
    },
    note: "I valori di composizione corporea sono stime a impedenza bioelettrica per uso sportivo e di benessere. Non sono misurazioni cliniche e non diagnosticano nulla. I preordini sono interamente rimborsabili fino alla spedizione del tuo dispositivo.",
    seeApp: "Guarda l’app",
  },
  tr: {
    eyebrow: "Terrifit donanım",
    title: "İki cihaz. Senin tek bir resmin.",
    lede: "Bileklik sen yaşarken seni okur. Tartı ise o yaşamın ne inşa ettiğini okur. İkisi de aynı uygulamaya yazar ve uygulama ücretsiz.",
    preorder: "Ön sipariş ver",
    band: {
      name: "Terrifit Bileklik",
      tagline: "Üzerinde, günün her saati.",
      body: "Başlatılacak seans yok ve iki hafta boyunca gece şarj edilecek bir şey yok. Taktığın andan itibaren kesintisiz ölçer — anlamlı bir taban çizgisi ancak böyle oluşur.",
      points: [
        "Nabız, HRV, solunum ve kandaki oksijen; uyanıkken ve uykuda",
        "Her sabah toparlanma, gün boyunca zorlanma",
        "Şarj başına on beş gün; bileğinden hiç çıkmaz",
      ],
    },
    scale: {
      name: "Terrifit Tartı",
      tagline: "Antrenmanın gerçekte neyi değiştirdiği.",
      body: "Kilo tek başına, zor bir ayın kas mı kazandırdığını yoksa kas mı götürdüğünü söyleyemez. Biyoelektrik impedans ölçümü ikisini ayırır ve yerdeki sayı hikâyenin tamamı olmaktan çıkar.",
      points: [
        "Kilo, vücut yağı, kas kütlesi ve vücut suyu",
        "Her ölçüm bir öncekiyle birlikte grafikte; sadece bugünün rakamı değil",
        "Üstüne çık, senkronize olsun, bitti — önce uygulama açmadan",
      ],
    },
    together: {
      eyebrow: "Tek bir ekosistem",
      title: "İki sayı da tek başına pek bir şey söylemez.",
      body: "Giyilebilir cihaz ayın ne kadar zor geçtiğini söyler. Tartı ise ayın ne yaptığını. Terrifit, ikisinin tek bir zaman çizelgesinde, tek bir hesap altında, aynı uygulamayla okunduğu tek yer.",
      points: [
        "Kilo −0,8 kg, yağ kütlesi −0,6 kg: demek ki kas değildi",
        "Antrenman hacmi %4 artarken toparlanma %7 arttı: yük tutuyor",
        "Tartıda duraklama; üç haftalık kötü uykuyla açıklanıyor",
      ],
    },
    plan: {
      eyebrow: "Kullanmanın maliyeti",
      title: "Uygulama ücretsiz. Öyle de kalıyor.",
      freeTitle: "Ücretsiz, sonsuza dek",
      freeBody: "Her iki cihaz, her günlük ölçüm, antrenmanın ve kaydettiğin seanslar. Donanımı almak seni hiçbir şeye abone etmez.",
      proTitle: "Terrifit Pro",
      proBody: "Arkasında haftalarca geçmiş isteyen işler için: vücut kompozisyonu eğilimleri, uyku kalitesi, stres ve vücut bataryası ve bunların karşılaştırıldığı daha uzun kayıt.",
      cta: "Üyelikleri karşılaştır",
    },
    note: "Vücut kompozisyonu değerleri, form ve sağlıklı yaşam amaçlı biyoelektrik impedans tahminleridir. Klinik ölçüm değildir ve hiçbir şeyi teşhis edemez. Ön siparişler, cihazın gönderilene kadar tamamen iade edilebilir.",
    seeApp: "Uygulamayı gör",
  },
  ru: {
    eyebrow: "Устройства Terrifit",
    title: "Два устройства. Одна картина о вас.",
    lede: "Браслет читает вас, пока вы живёте. Весы читают то, что эта жизнь построила. Оба пишут в одно приложение, и приложение бесплатное.",
    preorder: "Предзаказ",
    band: {
      name: "Браслет Terrifit",
      tagline: "На вас, круглые сутки.",
      body: "Не нужно запускать тренировку и две недели нечего заряжать на ночь. Он измеряет непрерывно с момента, как вы его застегнули, — иначе базовая линия, которая что-то значит, просто не наберётся.",
      points: [
        "Пульс, ВСР, дыхание и кислород в крови — во сне и наяву",
        "Восстановление каждое утро, нагрузка в течение дня",
        "Пятнадцать дней на заряде, поэтому он не покидает запястье",
      ],
    },
    scale: {
      name: "Весы Terrifit",
      tagline: "Что тренировки изменили на самом деле.",
      body: "Один вес не скажет, добавил ли тяжёлый месяц мышц или отнял их. Измерение биоэлектрического импеданса разделяет одно и другое, и число на полу перестаёт быть всей историей.",
      points: [
        "Вес, процент жира, мышечная масса и вода в организме",
        "Каждое измерение на графике рядом с предыдущим, а не только сегодняшняя цифра",
        "Встали, синхронизировалось, готово — без открывания приложения",
      ],
    },
    together: {
      eyebrow: "Одна экосистема",
      title: "Ни одно из чисел само по себе мало что значит.",
      body: "Носимое устройство говорит, насколько тяжёлым был месяц. Весы говорят, что месяц сделал. Terrifit — единственное место, где они лежат на одной временной шкале, под одним аккаунтом, прочитанные одним приложением.",
      points: [
        "Вес −0,8 кг, жировая масса −0,6 кг: значит, это была не мышца",
        "Восстановление +7% при росте объёма на 4%: нагрузка ложится верно",
        "Плато на весах, объяснённое тремя неделями плохого сна",
      ],
    },
    plan: {
      eyebrow: "Сколько стоит пользоваться",
      title: "Приложение бесплатное. И останется таким.",
      freeTitle: "Бесплатно, навсегда",
      freeBody: "Оба устройства, каждое ежедневное измерение, ваши тренировки и записанные занятия. Покупка устройства ни на что вас не подписывает.",
      proTitle: "Terrifit Pro",
      proBody: "Для того, чему нужны недели истории: тренды состава тела, качество сна, стресс и запас сил — и более длинная запись, относительно которой они читаются.",
      cta: "Сравнить подписки",
    },
    note: "Показатели состава тела — оценки по биоэлектрическому импедансу для фитнеса и здорового образа жизни. Это не клинические измерения, и они не могут ничего диагностировать. Предзаказ возвращается полностью до момента отправки вашего устройства.",
    seeApp: "Посмотреть приложение",
  },
};

export function hardwareCopy(locale: Locale): HardwareCopy {
  return copy[locale] ?? copy.en;
}
