import type { AppLocale } from "@/preferences";

/** Complete copy for the You tab. No user-facing sentence lives in the screen. */
export type ProfileCopy = {
  chooseHandle: string;
  fallbackBio: string;
  editProfile: string;
  becomePro: string;
  proPitch: string;
  trialRunning: string;
  proName: string;
  managePlan: string;
  console: string;
  consoleDetail: string;
  yourData: string;
  yourPerformance: string;
  trends: string;
  trendsDetail: string;
  body: string;
  bodyDetail: string;
  connectV1: string;
  v1Detail: string;
  pairV1: string;
  healthConnections: string;
  healthConnectionsDetail: string;
  profileDetails: string;
  goal: string;
  activity: string;
  training: string;
  units: string;
  notSet: string;
  daysPerWeek: (days: number) => string;
  appPreferences: string;
  appPreferencesDetail: string;
  notificationsDetail: string;
  ordersDetail: string;
  addressesDetail: string;
};

export const profileCopy: Record<AppLocale, ProfileCopy> = {
  en: {
    appPreferencesDetail: "Units, market, privacy and account",
    chooseHandle: "Choose your @handle", fallbackBio: "Your training, recovery and progress in one place.", editProfile: "Edit profile",
    becomePro: "Become a Pro", proPitch: "Sleep quality, load, body battery and insights across your whole history. 14 days free.",
    trialRunning: "Pro trial running", proName: "Terrifit Pro", managePlan: "Manage your plan", console: "Console",
    consoleDetail: "Members, orders, products and inventory", yourData: "Your data", yourPerformance: "Your performance",
    trends: "Trends", trendsDetail: "Recovery, sleep and movement", body: "Body", bodyDetail: "Weight and composition history",
    connectV1: "Connect a V1", v1Detail: "Terrifit V1", pairV1: "Pair your performance band", healthConnections: "Health connections",
    healthConnectionsDetail: "Apple Health, Health Connect and InBody", profileDetails: "Profile details", goal: "Goal", activity: "Activity",
    training: "Training", units: "Units", notSet: "Not set", daysPerWeek: (days) => `${days} days / week`, appPreferences: "App preferences",
    notificationsDetail: "Training, social and V1 alerts", ordersDetail: "Track what is on its way", addressesDetail: "Where your orders go",
  },
  es: {
    appPreferencesDetail: "Unidades, mercado, privacidad y cuenta",
    chooseHandle: "Elige tu @usuario", fallbackBio: "Tu entrenamiento, recuperación y progreso en un solo lugar.", editProfile: "Editar perfil",
    becomePro: "Hazte Pro", proPitch: "Calidad del sueño, carga, batería corporal y análisis de todo tu historial. 14 días gratis.",
    trialRunning: "Prueba Pro activa", proName: "Terrifit Pro", managePlan: "Gestionar tu plan", console: "Consola",
    consoleDetail: "Miembros, pedidos, productos e inventario", yourData: "Tus datos", yourPerformance: "Tu rendimiento",
    trends: "Tendencias", trendsDetail: "Recuperación, sueño y movimiento", body: "Cuerpo", bodyDetail: "Historial de peso y composición",
    connectV1: "Conectar una V1", v1Detail: "Terrifit V1", pairV1: "Vincula tu pulsera de rendimiento", healthConnections: "Conexiones de salud",
    healthConnectionsDetail: "Apple Health, Health Connect e InBody", profileDetails: "Datos del perfil", goal: "Objetivo", activity: "Actividad",
    training: "Entrenamiento", units: "Unidades", notSet: "Sin definir", daysPerWeek: (days) => `${days} días / semana`, appPreferences: "Preferencias de la app",
    notificationsDetail: "Alertas de entrenamiento, sociales y V1", ordersDetail: "Sigue lo que está en camino", addressesDetail: "Dónde se entregan tus pedidos",
  },
  ar: {
    appPreferencesDetail: "الوحدات والسوق والخصوصية والحساب",
    chooseHandle: "اختر اسم @المستخدم", fallbackBio: "تدريبك واستشفاؤك وتقدمك في مكان واحد.", editProfile: "تعديل الملف",
    becomePro: "الترقية إلى Pro", proPitch: "جودة النوم والحمل وبطارية الجسم والرؤى عبر سجلك الكامل. 14 يوماً مجاناً.",
    trialRunning: "تجربة Pro فعّالة", proName: "Terrifit Pro", managePlan: "إدارة الخطة", console: "لوحة التحكم",
    consoleDetail: "الأعضاء والطلبات والمنتجات والمخزون", yourData: "بياناتك", yourPerformance: "أداؤك",
    trends: "الاتجاهات", trendsDetail: "الاستشفاء والنوم والحركة", body: "الجسم", bodyDetail: "سجل الوزن وتركيب الجسم",
    connectV1: "ربط V1", v1Detail: "Terrifit V1", pairV1: "اربط سوار الأداء", healthConnections: "اتصالات الصحة",
    healthConnectionsDetail: "Apple Health وHealth Connect وInBody", profileDetails: "تفاصيل الملف", goal: "الهدف", activity: "النشاط",
    training: "التدريب", units: "الوحدات", notSet: "غير محدد", daysPerWeek: (days) => `${days} أيام / أسبوع`, appPreferences: "تفضيلات التطبيق",
    notificationsDetail: "تنبيهات التدريب والتواصل وV1", ordersDetail: "تتبّع ما هو في الطريق", addressesDetail: "عناوين توصيل طلباتك",
  },
  fr: {
    appPreferencesDetail: "Unités, marché, confidentialité et compte",
    chooseHandle: "Choisissez votre @identifiant", fallbackBio: "Votre entraînement, votre récupération et vos progrès au même endroit.", editProfile: "Modifier le profil",
    becomePro: "Passer à Pro", proPitch: "Qualité du sommeil, charge, batterie corporelle et analyses sur tout votre historique. 14 jours offerts.",
    trialRunning: "Essai Pro en cours", proName: "Terrifit Pro", managePlan: "Gérer votre abonnement", console: "Console",
    consoleDetail: "Membres, commandes, produits et stock", yourData: "Vos données", yourPerformance: "Vos performances",
    trends: "Tendances", trendsDetail: "Récupération, sommeil et mouvement", body: "Corps", bodyDetail: "Historique du poids et de la composition",
    connectV1: "Connecter une V1", v1Detail: "Terrifit V1", pairV1: "Associez votre bracelet de performance", healthConnections: "Connexions santé",
    healthConnectionsDetail: "Apple Health, Health Connect et InBody", profileDetails: "Détails du profil", goal: "Objectif", activity: "Activité",
    training: "Entraînement", units: "Unités", notSet: "Non défini", daysPerWeek: (days) => `${days} jours / semaine`, appPreferences: "Préférences de l’app",
    notificationsDetail: "Alertes d’entraînement, sociales et V1", ordersDetail: "Suivez ce qui arrive", addressesDetail: "Adresses de livraison de vos commandes",
  },
  de: {
    appPreferencesDetail: "Einheiten, Markt, Datenschutz und Konto",
    chooseHandle: "Wähle deinen @Namen", fallbackBio: "Training, Erholung und Fortschritt an einem Ort.", editProfile: "Profil bearbeiten",
    becomePro: "Pro werden", proPitch: "Schlafqualität, Belastung, Body Battery und Einblicke über deinen gesamten Verlauf. 14 Tage kostenlos.",
    trialRunning: "Pro-Testphase läuft", proName: "Terrifit Pro", managePlan: "Abo verwalten", console: "Konsole",
    consoleDetail: "Mitglieder, Bestellungen, Produkte und Bestand", yourData: "Deine Daten", yourPerformance: "Deine Leistung",
    trends: "Trends", trendsDetail: "Erholung, Schlaf und Bewegung", body: "Körper", bodyDetail: "Gewichts- und Körperzusammensetzungsverlauf",
    connectV1: "V1 verbinden", v1Detail: "Terrifit V1", pairV1: "Verbinde dein Performance-Band", healthConnections: "Gesundheitsverbindungen",
    healthConnectionsDetail: "Apple Health, Health Connect und InBody", profileDetails: "Profildetails", goal: "Ziel", activity: "Aktivität",
    training: "Training", units: "Einheiten", notSet: "Nicht festgelegt", daysPerWeek: (days) => `${days} Tage / Woche`, appPreferences: "App-Einstellungen",
    notificationsDetail: "Training-, soziale und V1-Hinweise", ordersDetail: "Verfolge deine Lieferung", addressesDetail: "Lieferadressen deiner Bestellungen",
  },
  nl: {
    appPreferencesDetail: "Eenheden, markt, privacy en account",
    chooseHandle: "Kies je @gebruikersnaam", fallbackBio: "Je training, herstel en voortgang op één plek.", editProfile: "Profiel bewerken",
    becomePro: "Word Pro", proPitch: "Slaapkwaliteit, belasting, body battery en inzichten over je hele geschiedenis. 14 dagen gratis.",
    trialRunning: "Proefperiode Pro actief", proName: "Terrifit Pro", managePlan: "Abonnement beheren", console: "Console",
    consoleDetail: "Leden, bestellingen, producten en voorraad", yourData: "Jouw gegevens", yourPerformance: "Jouw prestaties",
    trends: "Trends", trendsDetail: "Herstel, slaap en beweging", body: "Lichaam", bodyDetail: "Gewichts- en lichaamssamenstellingsgeschiedenis",
    connectV1: "Een V1 verbinden", v1Detail: "Terrifit V1", pairV1: "Koppel je prestatieband", healthConnections: "Gezondheidskoppelingen",
    healthConnectionsDetail: "Apple Health, Health Connect en InBody", profileDetails: "Profielgegevens", goal: "Doel", activity: "Activiteit",
    training: "Training", units: "Eenheden", notSet: "Niet ingesteld", daysPerWeek: (days) => `${days} dagen / week`, appPreferences: "App-voorkeuren",
    notificationsDetail: "Training-, sociale en V1-meldingen", ordersDetail: "Volg wat onderweg is", addressesDetail: "Bezorgadressen voor je bestellingen",
  },
  pt: {
    appPreferencesDetail: "Unidades, mercado, privacidade e conta",
    chooseHandle: "Escolhe o teu @utilizador", fallbackBio: "Treino, recuperação e progresso num só lugar.", editProfile: "Editar perfil",
    becomePro: "Tornar-me Pro", proPitch: "Qualidade do sono, carga, bateria corporal e análises de todo o teu histórico. 14 dias grátis.",
    trialRunning: "Teste Pro ativo", proName: "Terrifit Pro", managePlan: "Gerir plano", console: "Consola",
    consoleDetail: "Membros, encomendas, produtos e stock", yourData: "Os teus dados", yourPerformance: "O teu desempenho",
    trends: "Tendências", trendsDetail: "Recuperação, sono e movimento", body: "Corpo", bodyDetail: "Histórico de peso e composição",
    connectV1: "Ligar uma V1", v1Detail: "Terrifit V1", pairV1: "Emparelha a tua pulseira de desempenho", healthConnections: "Ligações de saúde",
    healthConnectionsDetail: "Apple Health, Health Connect e InBody", profileDetails: "Detalhes do perfil", goal: "Objetivo", activity: "Atividade",
    training: "Treino", units: "Unidades", notSet: "Não definido", daysPerWeek: (days) => `${days} dias / semana`, appPreferences: "Preferências da app",
    notificationsDetail: "Alertas de treino, sociais e V1", ordersDetail: "Acompanha o que está a caminho", addressesDetail: "Moradas de entrega das encomendas",
  },
  it: {
    appPreferencesDetail: "Unità, mercato, privacy e account",
    chooseHandle: "Scegli il tuo @nome", fallbackBio: "Allenamento, recupero e progressi in un unico posto.", editProfile: "Modifica profilo",
    becomePro: "Passa a Pro", proPitch: "Qualità del sonno, carico, body battery e analisi di tutto il tuo storico. 14 giorni gratis.",
    trialRunning: "Prova Pro attiva", proName: "Terrifit Pro", managePlan: "Gestisci il piano", console: "Console",
    consoleDetail: "Membri, ordini, prodotti e scorte", yourData: "I tuoi dati", yourPerformance: "Le tue prestazioni",
    trends: "Andamento", trendsDetail: "Recupero, sonno e movimento", body: "Corpo", bodyDetail: "Storico di peso e composizione",
    connectV1: "Collega una V1", v1Detail: "Terrifit V1", pairV1: "Associa la tua fascia performance", healthConnections: "Connessioni salute",
    healthConnectionsDetail: "Apple Health, Health Connect e InBody", profileDetails: "Dettagli del profilo", goal: "Obiettivo", activity: "Attività",
    training: "Allenamento", units: "Unità", notSet: "Non impostato", daysPerWeek: (days) => `${days} giorni / settimana`, appPreferences: "Preferenze dell’app",
    notificationsDetail: "Avvisi di allenamento, social e V1", ordersDetail: "Segui ciò che è in arrivo", addressesDetail: "Indirizzi di consegna degli ordini",
  },
  tr: {
    appPreferencesDetail: "Birimler, pazar, gizlilik ve hesap",
    chooseHandle: "@kullanıcı adını seç", fallbackBio: "Antrenmanın, toparlanman ve ilerlemen tek yerde.", editProfile: "Profili düzenle",
    becomePro: "Pro’ya geç", proPitch: "Tüm geçmişinde uyku kalitesi, yük, vücut pili ve içgörüler. 14 gün ücretsiz.",
    trialRunning: "Pro denemesi sürüyor", proName: "Terrifit Pro", managePlan: "Planını yönet", console: "Konsol",
    consoleDetail: "Üyeler, siparişler, ürünler ve stok", yourData: "Verilerin", yourPerformance: "Performansın",
    trends: "Eğilimler", trendsDetail: "Toparlanma, uyku ve hareket", body: "Vücut", bodyDetail: "Kilo ve vücut bileşimi geçmişi",
    connectV1: "V1 bağla", v1Detail: "Terrifit V1", pairV1: "Performans bandını eşleştir", healthConnections: "Sağlık bağlantıları",
    healthConnectionsDetail: "Apple Health, Health Connect ve InBody", profileDetails: "Profil ayrıntıları", goal: "Hedef", activity: "Aktivite",
    training: "Antrenman", units: "Birimler", notSet: "Ayarlanmadı", daysPerWeek: (days) => `Haftada ${days} gün`, appPreferences: "Uygulama tercihleri",
    notificationsDetail: "Antrenman, sosyal ve V1 uyarıları", ordersDetail: "Yoldaki siparişini izle", addressesDetail: "Sipariş teslimat adreslerin",
  },
  ru: {
    appPreferencesDetail: "Единицы, регион, приватность и аккаунт",
    chooseHandle: "Выберите @имя", fallbackBio: "Тренировки, восстановление и прогресс в одном месте.", editProfile: "Изменить профиль",
    becomePro: "Перейти на Pro", proPitch: "Качество сна, нагрузка, батарея тела и аналитика за всю историю. 14 дней бесплатно.",
    trialRunning: "Пробный Pro активен", proName: "Terrifit Pro", managePlan: "Управление подпиской", console: "Консоль",
    consoleDetail: "Участники, заказы, товары и остатки", yourData: "Ваши данные", yourPerformance: "Ваши показатели",
    trends: "Тренды", trendsDetail: "Восстановление, сон и движение", body: "Тело", bodyDetail: "История веса и состава тела",
    connectV1: "Подключить V1", v1Detail: "Terrifit V1", pairV1: "Подключите фитнес-браслет", healthConnections: "Подключения здоровья",
    healthConnectionsDetail: "Apple Health, Health Connect и InBody", profileDetails: "Данные профиля", goal: "Цель", activity: "Активность",
    training: "Тренировки", units: "Единицы", notSet: "Не задано", daysPerWeek: (days) => `${days} дн. / неделю`, appPreferences: "Настройки приложения",
    notificationsDetail: "Уведомления о тренировках, общении и V1", ordersDetail: "Отслеживайте доставку", addressesDetail: "Адреса доставки заказов",
  },
};
