export type Language = "ro" | "en" | "ru";

export interface Translations {
  common: {
    dashboard: string;
    map: string;
    analysis: string;
    aiConsultant: string;
    downloadReport: string;
    report: string;
    updateData: string;
    analyzing: string;
    currency: string;
    perHectare: string;
    totalParcel: string;
    area: string;
    hectares: string;
    bonitate: string;
    profit: string;
    recommendedProfit: string;
    countryBadge: string;
    tagline: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    selectOnMap: string;
    parcelSummary: string;
    currentRecommendation: string;
    chooseCrop: string;
  };
  mapSection: {
    eyebrow: string;
    title: string;
    subtitle: string;
    interactiveTitle: string;
    interactiveHint: string;
    satellite: string;
    streets: string;
    soilsWms: string;
    searchPlaceholder: string;
    searchButton: string;
    surface: string;
    draw: string;
    analyzeParcel: string;
    finishDrawing: string;
    cancelDrawing: string;
    activePolygon: string;
    noParcelSelected: string;
    clickOrSearchPrompt: string;
    soilsOn: string;
    selectedParcel: string;
    mapMoldova: string;
    activeParcelTitle: string;
    selectParcelPrompt: string;
    analyzingSoil: string;
    waitingSelection: string;
  };
  context: {
    eyebrow: string;
    title: string;
    subtitle: string;
    soilBonitate: string;
    moisture: string;
    moistureDetail: string;
    weatherTelemetry: string;
    weatherDetail: string;
    profitLabel: string;
    optimalCrop: string;
  };
  recommendations: {
    eyebrow: string;
    title: string;
    subtitle: string;
    parcelRecommendations: string;
    comparisonDesc: string;
    sort: string;
    sortSuitability: string;
    sortProfit: string;
    suitabilityScore: string;
    estimatedYield: string;
    estimatedRevenue: string;
    estimatedCosts: string;
    netProfit: string;
    viewDetails: string;
    hideDetails: string;
    costStructure: string;
    breakEven: string;
    marketPrice: string;
    riskMargin: string;
  };
  financial: {
    eyebrow: string;
    title: string;
    subtitle: string;
    chartTitle: string;
    chartSubtitlePerHa: string;
    chartSubtitleTotal: string;
    legendCost: string;
    legendProfit: string;
    profitBadge: string;
  };
  parcelCard: {
    soilTitle: string;
    climateTitle: string;
    aiTitle: string;
    soilType: string;
    humus: string;
    ph: string;
    erosion: string;
    soilCatalog: string;
    temp: string;
    leafWetness: string;
    precipitations: string;
    eto: string;
    station: string;
    keyRisks: string;
    actionSteps: string;
  };
  chat: {
    title: string;
    online: string;
    placeholder: string;
    send: string;
    attach: string;
    disclaimer: string;
    initGreeting: string;
  };
  report: {
    title: string;
    print: string;
    headerTitle: string;
    headerSub: string;
    parcelId: string;
    surfaceLabel: string;
    pedologicProfile: string;
    bonitatePoints: string;
    telemetry: string;
    recommendationsTable: string;
    cropHeader: string;
    suitabilityHeader: string;
    yieldHeader: string;
    profitHeader: string;
    risksSection: string;
    signature: string;
  };
  footer: {
    tagline: string;
    rights: string;
  };
}

export const translations: Record<Language, Translations> = {
  ro: {
    common: {
      dashboard: "Dashboard",
      map: "Harta",
      analysis: "Analiză",
      aiConsultant: "Consultant AI",
      downloadReport: "Descarcă raport",
      report: "Raport",
      updateData: "Actualizează datele",
      analyzing: "Se analizează...",
      currency: "MDL",
      perHectare: "per hectar",
      totalParcel: "total parcelă",
      area: "Suprafață",
      hectares: "ha",
      bonitate: "Bonitate",
      profit: "Profit",
      recommendedProfit: "Profit recomandat",
      countryBadge: "Moldova 🇲🇩",
      tagline: "Agricultură ghidată de date",
    },
    hero: {
      badge: "Ghid agronomic inteligent",
      title: "Transformă datele parcelei în decizii agricole mai bune.",
      subtitle:
        "Selectează o parcelă, analizează solul și descoperă culturile recomandate pentru un sezon mai predictibil și mai profitabil.",
      selectOnMap: "Selectează parcela pe hartă",
      parcelSummary: "Rezumat parcelă",
      currentRecommendation: "este recomandarea curentă",
      chooseCrop: "Alege o cultură",
    },
    mapSection: {
      eyebrow: "01 / Localizare",
      title: "Harta parcelei",
      subtitle:
        "Caută un număr cadastral, selectează direct pe hartă sau desenează conturul parcelei.",
      interactiveTitle: "Harta Cadastrală Interactivă",
      interactiveHint: "• Atingeți sau faceți clic oriunde pe hartă pentru a selecta o parcelă",
      satellite: "Satelit",
      streets: "Străzi",
      soilsWms: "Soluri WMS",
      searchPlaceholder: "Introduceți numărul cadastral (ex: 0300987654)...",
      searchButton: "Caută",
      surface: "Suprafață",
      draw: "Desenează",
      analyzeParcel: "Analizează parcela",
      finishDrawing: "Finalizează",
      cancelDrawing: "Anulează",
      activePolygon: "Poligon activ",
      noParcelSelected: "Nicio parcelă selectată",
      clickOrSearchPrompt: "(apasă pe teren sau caută cod)",
      soilsOn: "• Soluri WMS ON",
      selectedParcel: "Parcelă selectată",
      mapMoldova: "Hartă Moldova",
      activeParcelTitle: "Parcela activă",
      selectParcelPrompt: "Selectează parcelă",
      analyzingSoil: "Se analizează solul...",
      waitingSelection: "Așteptare selecție teren",
    },
    context: {
      eyebrow: "02 / Context",
      title: "Înțelege terenul înainte de decizie",
      subtitle: "Profilul solului, telemetria și recomandarea AI într-o singură privire.",
      soilBonitate: "Bonitate sol",
      moisture: "Umiditate",
      moistureDetail: "Rezervă utilă de apă",
      weatherTelemetry: "Telemetrie meteo",
      weatherDetail: "ETo / zi",
      profitLabel: "Profit recomandat",
      optimalCrop: "Cultura optimă",
    },
    recommendations: {
      eyebrow: "03 / Recomandări",
      title: "Culturile potrivite pentru parcela ta",
      subtitle: "Compară rapid potrivirea, randamentul și profitul net estimat.",
      parcelRecommendations: "Recomandări pentru parcelă",
      comparisonDesc: "Comparație agronomică și rentabilitate financiară transparentă.",
      sort: "Sortează",
      sortSuitability: "Potrivire",
      sortProfit: "Profit",
      suitabilityScore: "Scor de potrivire",
      estimatedYield: "Randament estimat",
      estimatedRevenue: "Venit brut estimat",
      estimatedCosts: "Costuri totale",
      netProfit: "Profit Net",
      viewDetails: "Vezi detalii economice",
      hideDetails: "Ascunde detalii",
      costStructure: "Structura cheltuielilor tehnologice",
      breakEven: "Randament prag de rentabilitate",
      marketPrice: "Preț estimat pe piață",
      riskMargin: "Interval profit & marjă comercială",
    },
    financial: {
      eyebrow: "04 / Financiar",
      title: "Profitabilitate transparentă",
      subtitle: "Vezi cum se raportează investiția la profitul net pentru fiecare cultură.",
      chartTitle: "Investiție vs. profit net",
      chartSubtitlePerHa: "Comparație economică pe hectar (1 ha), în MDL.",
      chartSubtitleTotal: "Comparație economică pe toată suprafața parcelei ({area} ha), în MDL.",
      legendCost: "Investiție (Cost)",
      legendProfit: "Profit Net",
      profitBadge: "Profit net",
    },
    parcelCard: {
      soilTitle: "Profilul Pedologic & Sol",
      climateTitle: "Telemetrie Agrometeorologică",
      aiTitle: "Recomandarea asistentului AI",
      soilType: "Tip sol",
      humus: "Humus",
      ph: "pH sol",
      erosion: "Grad eroziune",
      soilCatalog: "Ghid Soluri Moldova (Institutul N. Dimo)",
      temp: "Temperatură",
      leafWetness: "Umiditate frunză",
      precipitations: "Precipitații (30 zile)",
      eto: "Evapotranspirație ETo",
      station: "Stație meteo",
      keyRisks: "Riscuri & Avertismente",
      actionSteps: "Pași agronomici recomandați",
    },
    chat: {
      title: "Consultant Agronomic AI (Dr. Agro)",
      online: "Online • Conectat la baza agrochimică a Moldovei",
      placeholder: "Scrie o întrebare despre cultură, fertilizare sau tratamente...",
      send: "Trimite",
      attach: "Atașează foto sau analiză sol",
      disclaimer: "AI poate face erori. Verificați recomandările înainte de aplicare în câmp.",
      initGreeting:
        "Salut! Sunt Dr. Agro, consultantul tău agronomic AI. Am analizat parcela ta. Îmi poți pune întrebări despre culturi și fertilizare, sau îmi poți trimite o fotografie cu frunza ori un buletin de analiză de laborator 📎.",
    },
    report: {
      title: "Raport Executiv Agronomic",
      print: "Printează / PDF",
      headerTitle: "🌱 AgriTech AI Guidance Moldova",
      headerSub: "Fișă Tehnică de Recomandare a Culturilor Agricole • Republica Moldova",
      parcelId: "ID Parcelă / Cadastru",
      surfaceLabel: "Suprafață",
      pedologicProfile: "Profil Pedologic",
      bonitatePoints: "puncte bonitate",
      telemetry: "Telemetrie Agrometeo",
      recommendationsTable: "Clasamentul Culturilor Recomandate",
      cropHeader: "Cultură",
      suitabilityHeader: "Scor",
      yieldHeader: "Randament (t/ha)",
      profitHeader: "Profit Net (MDL)",
      risksSection: "Evaluarea Riscurilor & Recomandări AI",
      signature: "Generat automat prin AgriTech AI Moldova",
    },
    footer: {
      tagline: "Decizii agronomice inteligente, susținute de date locale și calcule transparente.",
      rights: "AgriTech AI Guidance Moldova • 2026",
    },
  },
  en: {
    common: {
      dashboard: "Dashboard",
      map: "Map",
      analysis: "Analysis",
      aiConsultant: "AI Advisor",
      downloadReport: "Download Report",
      report: "Report",
      updateData: "Update Data",
      analyzing: "Analyzing...",
      currency: "MDL",
      perHectare: "per hectare",
      totalParcel: "total parcel",
      area: "Area",
      hectares: "ha",
      bonitate: "Soil Score",
      profit: "Profit",
      recommendedProfit: "Recommended Profit",
      countryBadge: "Moldova 🇲🇩",
      tagline: "Data-driven Agriculture",
    },
    hero: {
      badge: "Intelligent Agronomic Guide",
      title: "Turn parcel data into superior agricultural decisions.",
      subtitle:
        "Select a parcel, inspect soil quality and discover recommended crops for a predictable and high-yield season.",
      selectOnMap: "Select parcel on map",
      parcelSummary: "Parcel Summary",
      currentRecommendation: "is the current top recommendation",
      chooseCrop: "Select a crop",
    },
    mapSection: {
      eyebrow: "01 / Location",
      title: "Parcel Map",
      subtitle:
        "Search by cadastral number, click directly on the map, or draw the parcel outline.",
      interactiveTitle: "Interactive Cadastral Map",
      interactiveHint: "• Click or tap anywhere on the map to select a parcel",
      satellite: "Satellite",
      streets: "Streets",
      soilsWms: "Soils WMS",
      searchPlaceholder: "Enter cadastral number (e.g., 0300987654)...",
      searchButton: "Search",
      surface: "Area",
      draw: "Draw",
      analyzeParcel: "Analyze parcel",
      finishDrawing: "Finish",
      cancelDrawing: "Cancel",
      activePolygon: "Active polygon",
      noParcelSelected: "No parcel selected",
      clickOrSearchPrompt: "(click on land or search code)",
      soilsOn: "• Soils WMS ON",
      selectedParcel: "Selected Parcel",
      mapMoldova: "Moldova Map",
      activeParcelTitle: "Active Parcel",
      selectParcelPrompt: "Select parcel",
      analyzingSoil: "Analyzing soil profile...",
      waitingSelection: "Awaiting parcel selection",
    },
    context: {
      eyebrow: "02 / Context",
      title: "Understand the land before deciding",
      subtitle: "Soil profile, field telemetry and AI recommendation at a glance.",
      soilBonitate: "Soil Quality Score",
      moisture: "Moisture",
      moistureDetail: "Available soil water",
      weatherTelemetry: "Weather Telemetry",
      weatherDetail: "ETo / day",
      profitLabel: "Recommended Profit",
      optimalCrop: "Optimal crop",
    },
    recommendations: {
      eyebrow: "03 / Recommendations",
      title: "Best suited crops for your parcel",
      subtitle: "Quickly compare suitability score, expected yield and net profit.",
      parcelRecommendations: "Parcel Crop Recommendations",
      comparisonDesc: "Agronomic suitability and transparent financial returns.",
      sort: "Sort by",
      sortSuitability: "Suitability",
      sortProfit: "Profit",
      suitabilityScore: "Suitability Score",
      estimatedYield: "Estimated Yield",
      estimatedRevenue: "Gross Revenue",
      estimatedCosts: "Total Costs",
      netProfit: "Net Profit",
      viewDetails: "View economic breakdown",
      hideDetails: "Hide details",
      costStructure: "Technological input costs",
      breakEven: "Break-even yield threshold",
      marketPrice: "Estimated market price",
      riskMargin: "Profit range & commercial margin",
    },
    financial: {
      eyebrow: "04 / Financials",
      title: "Transparent Profitability",
      subtitle: "See how total investments compare to net profit across each crop.",
      chartTitle: "Investment vs. Net Profit",
      chartSubtitlePerHa: "Economic comparison per hectare (1 ha), in MDL.",
      chartSubtitleTotal: "Economic comparison across entire parcel ({area} ha), in MDL.",
      legendCost: "Investment (Cost)",
      legendProfit: "Net Profit",
      profitBadge: "Net profit",
    },
    parcelCard: {
      soilTitle: "Pedological Profile & Soil",
      climateTitle: "Agrometeorological Telemetry",
      aiTitle: "AI Advisor Recommendation",
      soilType: "Soil Type",
      humus: "Humus content",
      ph: "Soil pH",
      erosion: "Erosion level",
      soilCatalog: "Moldova Soil Guide (N. Dimo Institute)",
      temp: "Temperature",
      leafWetness: "Leaf wetness",
      precipitations: "Precipitation (last 30d)",
      eto: "Evapotranspiration ETo",
      station: "Weather station",
      keyRisks: "Risks & Warnings",
      actionSteps: "Recommended agronomic actions",
    },
    chat: {
      title: "AI Agronomic Advisor (Dr. Agro)",
      online: "Online • Connected to Moldova agro-database",
      placeholder: "Ask about crops, fertilization, pests or treatments...",
      send: "Send",
      attach: "Attach photo or lab soil test",
      disclaimer: "AI can make mistakes. Always verify recommendations before field application.",
      initGreeting:
        "Hello! I am Dr. Agro, your AI agronomy consultant. I have analyzed your parcel. You can ask me questions about crop selection and fertilization, or attach a leaf photo or soil lab report 📎.",
    },
    report: {
      title: "Agronomic Executive Report",
      print: "Print / PDF",
      headerTitle: "🌱 AgriTech AI Guidance Moldova",
      headerSub: "Technical Agronomic Crop Recommendation Sheet • Republic of Moldova",
      parcelId: "Parcel ID / Cadastre",
      surfaceLabel: "Area",
      pedologicProfile: "Pedological Profile",
      bonitatePoints: "soil points",
      telemetry: "Agrometeorological Telemetry",
      recommendationsTable: "Recommended Crops Ranking",
      cropHeader: "Crop",
      suitabilityHeader: "Score",
      yieldHeader: "Yield (t/ha)",
      profitHeader: "Net Profit (MDL)",
      risksSection: "Risk Evaluation & AI Guidance",
      signature: "Generated automatically via AgriTech AI Moldova",
    },
    footer: {
      tagline: "Smart agronomic decisions, powered by localized data and transparent modeling.",
      rights: "AgriTech AI Guidance Moldova • 2026",
    },
  },
  ru: {
    common: {
      dashboard: "Панель",
      map: "Карта",
      analysis: "Анализ",
      aiConsultant: "AI-Консультант",
      downloadReport: "Скачать отчет",
      report: "Отчет",
      updateData: "Обновить данные",
      analyzing: "Анализируется...",
      currency: "MDL",
      perHectare: "за гектар",
      totalParcel: "вся площадь",
      area: "Площадь",
      hectares: "га",
      bonitate: "Бонитет",
      profit: "Прибыль",
      recommendedProfit: "Ожидаемая прибыль",
      countryBadge: "Молдова 🇲🇩",
      tagline: "Агрономия на основе данных",
    },
    hero: {
      badge: "Умный агрономический гид",
      title: "Превратите данные участка в точные аграрные решения.",
      subtitle:
        "Выберите участок, проверьте профиль почвы и узнайте оптимальные культуры для стабильного и прибыльного сезона.",
      selectOnMap: "Выбрать участок на карте",
      parcelSummary: "Сводка по участку",
      currentRecommendation: "текущая лучшая рекомендация",
      chooseCrop: "Выберите культуру",
    },
    mapSection: {
      eyebrow: "01 / Локация",
      title: "Карта участка",
      subtitle:
        "Ищите по кадастровому номеру, кликайте прямо по карте или рисуйте контур участка.",
      interactiveTitle: "Интерактивная кадастровая карта",
      interactiveHint: "• Нажмите в любой точке карты, чтобы выбрать участок",
      satellite: "Спутник",
      streets: "Улицы",
      soilsWms: "Карта почв WMS",
      searchPlaceholder: "Введите кадастровый номер (напр. 0300987654)...",
      searchButton: "Поиск",
      surface: "Площадь",
      draw: "Рисовать",
      analyzeParcel: "Анализировать участок",
      finishDrawing: "Завершить",
      cancelDrawing: "Отмена",
      activePolygon: "Активный контур",
      noParcelSelected: "Участок не выбран",
      clickOrSearchPrompt: "(кликните по полю или введите код)",
      soilsOn: "• Почвы WMS ВКЛ",
      selectedParcel: "Выбранный участок",
      mapMoldova: "Карта Молдовы",
      activeParcelTitle: "Активный участок",
      selectParcelPrompt: "Выберите участок",
      analyzingSoil: "Анализируется почвенный профиль...",
      waitingSelection: "Ожидание выбора участка",
    },
    context: {
      eyebrow: "02 / Контекст",
      title: "Оцените землю до принятия решения",
      subtitle: "Почвенный профиль, телеметрия поля и рекомендации AI в одном окне.",
      soilBonitate: "Бонитет почвы",
      moisture: "Влажность",
      moistureDetail: "Полезный запас влаги",
      weatherTelemetry: "Метеотелеметрия",
      weatherDetail: "ETo / день",
      profitLabel: "Ожидаемая прибыль",
      optimalCrop: "Оптимальная культура",
    },
    recommendations: {
      eyebrow: "03 / Рекомендации",
      title: "Культуры, подходящие для вашего участка",
      subtitle: "Быстро сравните совместимость, урожайность и расчетную чистую прибыль.",
      parcelRecommendations: "Рекомендации для участка",
      comparisonDesc: "Агрономическая пригодность и прозрачная финансовая рентабельность.",
      sort: "Сортировка",
      sortSuitability: "Пригодность",
      sortProfit: "Прибыль",
      suitabilityScore: "Балл пригодности",
      estimatedYield: "Прогноз урожайности",
      estimatedRevenue: "Валовой доход",
      estimatedCosts: "Общие затраты",
      netProfit: "Чистая прибыль",
      viewDetails: "Экономические детали",
      hideDetails: "Скрыть детали",
      costStructure: "Структура технологических затрат",
      breakEven: "Точка безубыточности (порог)",
      marketPrice: "Рыночная цена (прогноз)",
      riskMargin: "Диапазон прибыли и маржинальность",
    },
    financial: {
      eyebrow: "04 / Финансы",
      title: "Прозрачная рентабельность",
      subtitle: "Сопоставление затрат и чистой прибыли по каждой культуре.",
      chartTitle: "Инвестиции vs. Чистая прибыль",
      chartSubtitlePerHa: "Экономическое сравнение на гектар (1 га), в MDL.",
      chartSubtitleTotal: "Экономическое сравнение на всю площадь ({area} га), в MDL.",
      legendCost: "Затраты (Инвестиции)",
      legendProfit: "Чистая прибыль",
      profitBadge: "Чистая прибыль",
    },
    parcelCard: {
      soilTitle: "Почвенный профиль",
      climateTitle: "Агрометеорологическая телеметрия",
      aiTitle: "Рекомендации AI-консультанта",
      soilType: "Тип почвы",
      humus: "Гумус",
      ph: "pH почвы",
      erosion: "Эрозия",
      soilCatalog: "Каталог почв Молдовы (Институт Н. Димо)",
      temp: "Температура",
      leafWetness: "Влажность листа",
      precipitations: "Осадки (за 30 дней)",
      eto: "Эвапотранспирация ETo",
      station: "Метеостанция",
      keyRisks: "Риски и предостережения",
      actionSteps: "Рекомендуемые агрономические шаги",
    },
    chat: {
      title: "AI-Агроном (Д-р Агро)",
      online: "Онлайн • Подключен к агрохимической базе Молдовы",
      placeholder: "Задайте вопрос о культурах, удобрениях или защите...",
      send: "Отправить",
      attach: "Прикрепить фото или анализ почвы",
      disclaimer: "AI может ошибаться. Проверяйте рекомендации перед применением в поле.",
      initGreeting:
        "Здравствуйте! Я Dr. Agro, ваш AI-консультант по агрономии. Я проанализировал ваш участок. Вы можете задать мне любые вопросы по севообороту и удобрениям или прикрепить фото листа/анализ почвы 📎.",
    },
    report: {
      title: "Агрономический исполнительный отчет",
      print: "Печать / PDF",
      headerTitle: "🌱 AgriTech AI Guidance Moldova",
      headerSub: "Технический паспорт агрономических рекомендаций • Республика Молдова",
      parcelId: "ID Участка / Кадастр",
      surfaceLabel: "Площадь",
      pedologicProfile: "Почвенный профиль",
      bonitatePoints: "баллов бонитета",
      telemetry: "Агрометео телеметрия",
      recommendationsTable: "Рейтинг рекомендованных культур",
      cropHeader: "Культура",
      suitabilityHeader: "Балл",
      yieldHeader: "Урожай (т/га)",
      profitHeader: "Чистая прибыль (MDL)",
      risksSection: "Оценка рисков и рекомендации AI",
      signature: "Сгенерировано автоматически через AgriTech AI Moldova",
    },
    footer: {
      tagline: "Умные агрономические решения на основе локальных данных и прозрачных расчетов.",
      rights: "AgriTech AI Guidance Moldova • 2026",
    },
  },
};
