/**
 * ArthSaarthi / FinMate Multilingual i18n Localization Engine
 * Supported Languages: English (en), Hindi (hi), Marathi (mr), Bengali (bn), Punjabi (pa)
 */

export const LANGUAGES = [
  {
    code: 'en',
    label: 'English',
    native: 'English',
    sttLocale: 'en-IN',
    ttsLocale: 'en-IN',
  },
  {
    code: 'hi',
    label: 'Hindi',
    native: 'हिंदी',
    sttLocale: 'hi-IN',
    ttsLocale: 'hi-IN',
  },
  {
    code: 'mr',
    label: 'Marathi',
    native: 'मराठी',
    sttLocale: 'mr-IN',
    ttsLocale: 'mr-IN',
  },
  {
    code: 'bn',
    label: 'Bengali',
    native: 'বাংলা',
    sttLocale: 'bn-IN',
    ttsLocale: 'bn-IN',
  },
  {
    code: 'pa',
    label: 'Punjabi',
    native: 'ਪੰਜਾਬੀ',
    sttLocale: 'pa-IN',
    ttsLocale: 'pa-IN',
  },
]

export const DEFAULT_LANGUAGE = 'en'

export function getLanguageConfig(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0]
}

export function detectScriptLanguage(text) {
  if (!text || typeof text !== 'string') return null
  // Gurmukhi (Punjabi): \u0A00-\u0A7F
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa'
  // Bengali: \u0980-\u09FF
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'
  // Devanagari (Hindi / Marathi): \u0900-\u097F
  if (/[\u0900-\u097F]/.test(text)) {
    // Check for distinct Marathi words / characters (ळ: \u0933, आहे, नाही, करू, मला, तुम्ही)
    if (/[\u0933]|मी|गाडी|घेऊ|शकतो|शकेल|आहे|नाही|कसे|माझे|माझा|माझी|मला|तुम्ही|करावे|सांगा|होईल|काय|पाहिजे|नको|किती/.test(text)) {
      return 'mr'
    }
    return 'hi'
  }
  return null
}

export const DICTIONARY = {
  en: {
    // Topbar
    appTitle: 'FinMate',
    appSubtitle: 'Financial Advisor',
    agentsLive: 'Agents live',
    agentsOffline: 'Agents offline',
    connecting: 'Connecting…',
    demoMode: 'Demo mode',
    liveAnalysis: 'Live analysis',
    switchMode: 'Toggle Demo / Live mode',
    selectLanguage: 'Language',

    // Welcome Hero
    welcomeBadge: 'AI Financial Intelligence for India',
    welcomeHeading: 'Master Your Money with AI-Powered Guidance',
    welcomeSubheading:
      'Grounded in your real income, expenses, and debts. FinMate analyzes risk, matches welfare schemes, models future net worth, and guards against scams.',
    startOverview: 'Explore Overview',
    startDebtRisk: 'Assess Debt & Risk',
    startSchemes: 'Check Welfare Schemes',
    startSimulation: 'Simulate 36M Wealth',

    // Value Pillars
    pillar1Title: '9 Intelligent Agents',
    pillar1Desc: 'LangGraph pipeline evaluating affordability, DTI ratio, and emergency runway.',
    pillar2Title: 'Government Schemes',
    pillar2Desc: 'Automatic matching for PMJJBY, PMSBY, APY, PMAY, and state benefits.',
    pillar3Title: 'Scam & Fraud Shield',
    pillar3Desc: 'Vector-matched protection against fake KYC, digital arrest, and Ponzi schemes.',
    pillar4Title: 'Monte Carlo Projections',
    pillar4Desc: 'Data-driven 3-year forecasting across status quo, balanced, and optimal paths.',

    // Onboarding Form
    formTitle: 'Financial Profile Assessment',
    formSubtitle: 'Enter your household numbers. No bank logins required — confidential and secure.',
    stepFinancials: 'Financials',
    stepDemographics: 'Demographics',
    stepGoals: 'Goals & Safety',
    nextStep: 'Continue',
    prevStep: 'Back',
    submitAnalyze: 'Analyze My Finances',
    analyzingNow: 'Running 9-Agent Analysis…',

    monthlyIncome: 'Monthly Take-Home Income',
    monthlyIncomeHelp: 'Total net earnings entering household each month',
    monthlyExpenses: 'Monthly Living Expenses',
    monthlyExpensesHelp: 'Rent, groceries, utilities, school fees, essentials',
    monthlyEmi: 'Existing Monthly EMIs',
    monthlyEmiHelp: 'Total monthly loan, credit card, or chit fund payments',
    existingSavings: 'Current Liquid Savings',
    existingSavingsHelp: 'Cash, bank balance, liquid funds, fixed deposits',
    existingDebt: 'Total Outstanding Debt',
    existingDebtHelp: 'Total principal owed across all loans and borrowings',
    dependents: 'Family Dependents',

    age: 'Age',
    gender: 'Gender',
    genderSelect: 'Select gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    employmentType: 'Employment Type',
    salaried: 'Salaried Employee',
    selfEmployed: 'Self-Employed / Business',
    gigWorker: 'Gig Worker / Freelancer',
    farmer: 'Farmer / Agriculture',
    dailyWage: 'Daily Wage Earner',
    unemployed: 'Currently Seeking Work',
    state: 'State / Union Territory',
    isRural: 'Reside in a rural area',
    hasBankAccount: 'Active bank account',
    hasInsurance: 'Life insurance cover',
    hasHealthInsurance: 'Health insurance cover',
    riskAppetite: 'Investment Risk Appetite',
    conservative: 'Conservative (Safety first)',
    moderate: 'Moderate (Balanced growth)',
    aggressive: 'Aggressive (High growth)',

    goalsTitle: 'What are your top financial priorities?',
    goalEmergency: 'Build 6-Month Emergency Cushion',
    goalHome: 'Buy or Construct a Home',
    goalVehicle: 'Purchase a Vehicle',
    goalEducation: 'Children Higher Education',
    goalBusiness: 'Start or Expand Business',
    goalRetirement: 'Retirement Security (PPF/NPS)',

    scamInputLabel: 'Suspicious Offer or Scheme Verification (Optional)',
    scamInputPlaceholder: 'Paste any WhatsApp loan offer, guaranteed return scheme, or suspicious message to check for scam patterns…',

    // Loading Screen
    loadingTitle: 'Synthesizing Your Financial Roadmap',
    loadingSubtitle: 'LangGraph agents are calculating risk scores, checking FAISS scheme vectorstores, and running Monte Carlo simulations.',

    // Dashboard
    dashboardTitle: 'Financial Intelligence Dashboard',
    startNew: 'New Profile',
    talkWithVoice: 'Voice Assistant',
    tabOverview: 'Overview',
    tabRisk: 'Risk & Health',
    tabSimulation: '36M Simulation',
    tabScams: 'Scam Shield',
    tabSchemes: 'Welfare Schemes',
    tabGoals: 'Goals',
    tabCoach: 'Financial Coach',
    tabActions: 'Action Plan',

    // Key Metrics
    metricSurplus: 'Net Monthly Surplus',
    metricRunway: 'Emergency Runway',
    metricDti: 'Debt-to-Income (DTI)',
    metricHealth: 'Financial Health Score',
    metricDebt: 'Total Outstanding Debt',
    metricSavings: 'Current Savings',
    months: 'months',
    healthyRange: 'Healthy: < 35%',
    surplusReady: 'Ready for saving & SIP',

    // Risk Tiers
    riskLow: 'Low Risk',
    riskModerate: 'Moderate Risk',
    riskHigh: 'High Risk',
    riskTierLabel: 'Risk Tier',

    // Schemes
    eligibleBadge: 'Eligible',
    potentialBadge: 'Potentially Eligible',
    annualBenefit: 'Annual Benefit',
    howToApply: 'How to apply',

    // Simulation
    simStatusQuo: 'Status Quo',
    simModerate: 'Balanced Growth',
    simOptimal: 'Optimized Strategy',
    simMonthsHorizon: '36-Month Wealth Horizon',
    projectedSavings: 'Projected Savings',
    projectedNetWorth: 'Projected Net Worth',
    successProbability: 'Success Probability',

    // Chatbot Panel
    chatHeader: 'Ask FinMate',
    chatSubheader: 'Multilingual financial advice with voice & speech',
    chatPlaceholder: 'Ask anything in your language (e.g. Can I afford a car EMI?)…',
    chatSend: 'Send',
    chatListening: 'Listening to your voice…',
    chatStopAudio: 'Stop audio',
    chatListenTTS: 'Listen out loud (TTS)',
    chatLangPrompt: 'Language:',
    quickPrompts: [
      'Can I afford a new car EMI?',
      'Where should I invest my monthly surplus?',
      'What government schemes am I eligible for?',
      'How do I build my 6-month emergency buffer?',
    ],

    // Dedicated Voice Assistant
    voiceTitle: 'FinMate Voice Assistant',
    voiceSubtitle: 'Speak naturally in any Indian language. FinMate will listen and speak back with tailored guidance.',
    voiceReady: 'Ready — Click the microphone to speak',
    voiceListening: 'Listening… speak now',
    voiceProcessing: 'Analyzing your query with FinMate agents…',
    voiceSpeaking: 'FinMate is speaking…',
    voiceTranscriptLabel: 'You Said:',
    voiceResponseLabel: 'FinMate Replied:',
    voiceStartBtn: 'Start Speaking',
    voiceStopBtn: 'Stop Audio',
    voiceReListenBtn: 'Listen Again',
    voiceCloseBtn: 'Back to Dashboard',
  },

  hi: {
    // Topbar
    appTitle: 'FinMate',
    appSubtitle: 'वित्तीय सलाहकार',
    agentsLive: 'एजेंट सक्रिय',
    agentsOffline: 'एजेंट ऑफलाइन',
    connecting: 'कनेक्ट हो रहा है…',
    demoMode: 'डेमो मोड',
    liveAnalysis: 'लाइव विश्लेषण',
    switchMode: 'डेमो / लाइव मोड बदलें',
    selectLanguage: 'भाषा',

    // Welcome Hero
    welcomeBadge: 'भारत के परिवारों के लिए एआई वित्तीय साथी',
    welcomeHeading: 'एआई-संचालित मार्गदर्शन के साथ अपने पैसों पर नियंत्रण पाएं',
    welcomeSubheading:
      'आपकी वास्तविक आय, खर्च और ऋण पर आधारित। FinMate जोखिम का विश्लेषण करता है, सरकारी योजनाओं से जोड़ता है, भविष्य की संपत्ति का मॉडल बनाता है और धोखाधड़ी से बचाता है।',
    startOverview: 'अवलोकन देखें',
    startDebtRisk: 'ऋण व जोखिम जांचें',
    startSchemes: 'कल्याणकारी योजनाएं देखें',
    startSimulation: '36 माह का धन सिमुलेशन',

    // Value Pillars
    pillar1Title: '9 बुद्धिमान एजेंट',
    pillar1Desc: 'लैंगग्राफ पाइपलाइन जो आपकी वहन क्षमता, डीटीआई और आपातकालीन फंड का मूल्यांकन करती है।',
    pillar2Title: 'सरकारी योजनाएं',
    pillar2Desc: 'PMJJBY, PMSBY, APY, PMAY और राज्य की कल्याणकारी योजनाओं का स्वचालित मिलान।',
    pillar3Title: 'धोखाधड़ी से सुरक्षा',
    pillar3Desc: 'फर्जी केवाईसी, डिजिटल अरेस्ट और पोंजी योजनाओं से सुरक्षित रखने वाली ढाल।',
    pillar4Title: 'मोंटे कार्लो भविष्यवाणियां',
    pillar4Desc: 'यथास्थिति, संतुलित और इष्टतम बचत मार्गों का 3-वर्षीय सटीक पूर्वानुमान।',

    // Onboarding Form
    formTitle: 'वित्तीय प्रोफ़ाइल मूल्यांकन',
    formSubtitle: 'अपने घरेलू आंकड़े दर्ज करें। बैंक लॉगिन की आवश्यकता नहीं — पूरी तरह सुरक्षित और गोपनीय।',
    stepFinancials: 'वित्तीय विवरण',
    stepDemographics: 'व्यक्तिगत जानकारी',
    stepGoals: 'लक्ष्य व सुरक्षा',
    nextStep: 'आगे बढ़ें',
    prevStep: 'पीछे जाएं',
    submitAnalyze: 'मेरे वित्त का विश्लेषण करें',
    analyzingNow: '9-एजेंट विश्लेषण चल रहा है…',

    monthlyIncome: 'मासिक शुद्ध आय (इन-हैंड)',
    monthlyIncomeHelp: 'प्रत्येक माह परिवार में आने वाली कुल शुद्ध कमाई',
    monthlyExpenses: 'मासिक घरेलू खर्च',
    monthlyExpensesHelp: 'किराया, राशन, बिजली-पानी, स्कूल फीस और जरूरी खर्च',
    monthlyEmi: 'वर्तमान मासिक किस्तें (EMI)',
    monthlyEmiHelp: 'सभी ऋण, क्रेडिट कार्ड या चिट फंड की कुल मासिक किस्त',
    existingSavings: 'मौजूदा कुल बचत',
    existingSavingsHelp: 'नकद, बैंक बैलेंस, एफडी या तरल फंड',
    existingDebt: 'कुल बकाया ऋण',
    existingDebtHelp: 'सभी ऋणों पर शेष कुल मूलधन राशि',
    dependents: 'परिवार के आश्रित सदस्य',

    age: 'आयु',
    gender: 'लिंग',
    genderSelect: 'लिंग चुनें',
    male: 'पुरुष',
    female: 'महिला',
    other: 'अन्य',
    employmentType: 'रोजगार का प्रकार',
    salaried: 'वेतनभोगी कर्मचारी',
    selfEmployed: 'स्व-नियोजित / व्यवसाय',
    gigWorker: 'गिग वर्कर / फ्रीलांसर',
    farmer: 'किसान / कृषि',
    dailyWage: 'दैनिक वेतनभोगी',
    unemployed: 'वर्तमान में कार्य तलाश रहे',
    state: 'राज्य / केंद्र शासित प्रदेश',
    isRural: 'ग्रामीण क्षेत्र में निवास',
    hasBankAccount: 'सक्रिय बैंक खाता है',
    hasInsurance: 'जीवन बीमा सुरक्षा है',
    hasHealthInsurance: 'स्वास्थ्य बीमा सुरक्षा है',
    riskAppetite: 'निवेश जोखिम क्षमता',
    conservative: 'रूढ़िवादी (सुरक्षा पहले)',
    moderate: 'मध्यम (संतुलित वृद्धि)',
    aggressive: 'आक्रामक (अधिक वृद्धि)',

    goalsTitle: 'आपकी शीर्ष वित्तीय प्राथमिकताएं क्या हैं?',
    goalEmergency: '6 महीने का आपातकालीन फंड बनाएं',
    goalHome: 'घर खरीदना या बनवाना',
    goalVehicle: 'वाहन खरीदना',
    goalEducation: 'बच्चों की उच्च शिक्षा',
    goalBusiness: 'व्यवसाय शुरू या विस्तार करना',
    goalRetirement: 'सुरक्षित सेवानिवृत्ति (PPF/NPS)',

    scamInputLabel: 'संदिग्ध ऑफर या योजना की जांच (वैकल्पिक)',
    scamInputPlaceholder: 'व्हाट्सएप लोन ऑफर, भारी रिटर्न योजना या किसी संदिग्ध संदेश को यहां पेस्ट करें…',

    // Loading Screen
    loadingTitle: 'आपका वित्तीय रोडमैप तैयार हो रहा है',
    loadingSubtitle: 'एजेंट जोखिम स्कोर की गणना कर रहे हैं, योजना डेटाबेस की जांच कर रहे हैं और मोंटे कार्लो सिमुलेशन चला रहे हैं।',

    // Dashboard
    dashboardTitle: 'वित्तीय बुद्धिमत्ता डैशबोर्ड',
    startNew: 'नई प्रोफ़ाइल',
    talkWithVoice: 'आवाज़ सहायक',
    tabOverview: 'अवलोकन',
    tabRisk: 'जोखिम व स्वास्थ्य',
    tabSimulation: '36 माह का सिमुलेशन',
    tabScams: 'धोखाधड़ी ढाल',
    tabSchemes: 'सरकारी योजनाएं',
    tabGoals: 'वित्तीय लक्ष्य',
    tabCoach: 'फाइनेंशियल कोच',
    tabActions: 'कार्य योजना',

    // Key Metrics
    metricSurplus: 'शुद्ध मासिक अधिशेष (सरप्लस)',
    metricRunway: 'आपातकालीन रनवे',
    metricDti: 'ऋण-से-आय अनुपात (DTI)',
    metricHealth: 'वित्तीय स्वास्थ्य स्कोर',
    metricDebt: 'कुल बकाया ऋण',
    metricSavings: 'मौजूदा बचत',
    months: 'महीने',
    healthyRange: 'सुरक्षित सीमा: < 35%',
    surplusReady: 'बचत व SIP के लिए तैयार',

    // Risk Tiers
    riskLow: 'कम जोखिम',
    riskModerate: 'मध्यम जोखिम',
    riskHigh: 'उच्च जोखिम',
    riskTierLabel: 'जोखिम श्रेणी',

    // Schemes
    eligibleBadge: 'पात्र',
    potentialBadge: 'संभावित पात्र',
    annualBenefit: 'वार्षिक लाभ',
    howToApply: 'आवेदन कैसे करें',

    // Simulation
    simStatusQuo: 'वर्तमान स्थिति',
    simModerate: 'संतुलित विकास',
    simOptimal: 'अनुकूलित रणनीति',
    simMonthsHorizon: '36-महीने का संपत्ति क्षितिज',
    projectedSavings: 'अनुमानित बचत',
    projectedNetWorth: 'अनुमानित कुल संपत्ति',
    successProbability: 'सफलता की संभावना',

    // Chatbot Panel
    chatHeader: 'FinMate से पूछें',
    chatSubheader: 'आवाज़ व टेक्स्ट के साथ बहुभाषी वित्तीय सलाह',
    chatPlaceholder: 'अपनी भाषा में कोई भी सवाल पूछें (उदा. क्या मैं कार लोन ले सकता हूँ?)…',
    chatSend: 'भेजें',
    chatListening: 'आपकी आवाज़ सुन रहे हैं…',
    chatStopAudio: 'ऑडियो रोकें',
    chatListenTTS: 'बोलकर सुनें (TTS)',
    chatLangPrompt: 'भाषा:',
    quickPrompts: [
      'क्या मैं नई कार की EMI ले सकता हूँ?',
      'मुझे अपने मासिक सरप्लस का निवेश कहाँ करना चाहिए?',
      'मैं किन सरकारी योजनाओं के लिए पात्र हूँ?',
      'मैं अपना 6 महीने का इमरजेंसी फंड कैसे बनाऊं?',
    ],

    // Dedicated Voice Assistant
    voiceTitle: 'FinMate वॉइस असिस्टेंट',
    voiceSubtitle: 'किसी भी भारतीय भाषा में स्वाभाविक रूप से बोलें। FinMate आपकी बात सुनकर सटीक मार्गदर्शन देगा।',
    voiceReady: 'तैयार — बोलने के लिए माइक्रोफ़ोन पर क्लिक करें',
    voiceListening: 'सुन रहे हैं… अब बोलें',
    voiceProcessing: 'FinMate एजेंट आपके प्रश्न का विश्लेषण कर रहे हैं…',
    voiceSpeaking: 'FinMate उत्तर दे रहा है…',
    voiceTranscriptLabel: 'आपने कहा:',
    voiceResponseLabel: 'FinMate का उत्तर:',
    voiceStartBtn: 'बोलना शुरू करें',
    voiceStopBtn: 'ऑडियो रोकें',
    voiceReListenBtn: 'दोबारा सुनें',
    voiceCloseBtn: 'डैशबोर्ड पर वापस जाएं',
  },

  mr: {
    // Topbar
    appTitle: 'FinMate',
    appSubtitle: 'आर्थिक सल्लागार',
    agentsLive: 'एजंट्स सक्रिय',
    agentsOffline: 'एजंट्स ऑफलाइन',
    connecting: 'कनेक्ट करत आहे…',
    demoMode: 'डेमो मोड',
    liveAnalysis: 'थेट विश्लेषण',
    switchMode: 'डेमो / थेट मोड बदला',
    selectLanguage: 'भाषा',

    // Welcome Hero
    welcomeBadge: 'भारतीय कुटुंबांसाठी एआय आर्थिक साथी',
    welcomeHeading: 'एआय-सक्षम मार्गदर्शनासह आपल्या पैशांवर नियंत्रण मिळवा',
    welcomeSubheading:
      'तुमच्या प्रत्यक्ष उत्पन्न, खर्च आणि कर्जावर आधारित. FinMate जोखमीचे विश्लेषण करते, शासकीय योजनांशी जोडते, भविष्यातील संपत्तीचे मॉडेल तयार करते आणि फसवणुकीपासून रक्षण करते.',
    startOverview: 'आढावा पहा',
    startDebtRisk: 'कर्ज व धोका तपासा',
    startSchemes: 'कल्याणकारी योजना पहा',
    startSimulation: '३६ महिन्यांचे संपत्ती मॉडेल',

    // Value Pillars
    pillar1Title: '९ बुद्धिमान एजंट्स',
    pillar1Desc: 'तुमची आर्थिक क्षमता, डीटीआय प्रमाण आणि आपत्कालीन निधी तपासणारी अत्याधुनिक प्रणाली.',
    pillar2Title: 'शासकीय योजना',
    pillar2Desc: 'PMJJBY, PMSBY, APY, PMAY आणि राज्य योजनांची थेट माहिती.',
    pillar3Title: 'फसवणुकीपासून सुरक्षा',
    pillar3Desc: 'बनावट केवायसी, डिजिटल अटक आणि फसव्या योजनांपासून सुरक्षित ठेवणारी ढाल.',
    pillar4Title: 'मोंटे कार्लो अंदाज',
    pillar4Desc: '३ वर्षांतील आर्थिक वाढीचा सद्यस्थिती आणि संतुलित मार्गावरील अचूक अंदाज.',

    // Onboarding Form
    formTitle: 'आर्थिक प्रोफाइल मूल्यांकन',
    formSubtitle: 'तुमचे घरगुती आकडे भरा. बँक लॉगिनची गरज नाही — पूर्णपणे सुरक्षित आणि गोपनीय.',
    stepFinancials: 'आर्थिक माहिती',
    stepDemographics: 'वैयक्तिक माहिती',
    stepGoals: 'ध्येये आणि सुरक्षा',
    nextStep: 'पुढे जा',
    prevStep: 'मागे या',
    submitAnalyze: 'माझ्या वित्ताचे विश्लेषण करा',
    analyzingNow: '९-एजंट विश्लेषण सुरू आहे…',

    monthlyIncome: 'मासिक निव्वळ उत्पन्न (हातात येणारे)',
    monthlyIncomeHelp: 'प्रत्येक महिन्याला कुटुंबात येणारी एकूण कमाई',
    monthlyExpenses: 'मासिक घरखर्च',
    monthlyExpensesHelp: 'घरभाडे, किराणा, वीज-पाणी, मुलांचे शिक्षण आणि अत्यावश्यक खर्च',
    monthlyEmi: 'सध्याचे मासिक हप्ते (EMI)',
    monthlyEmiHelp: 'सर्व कर्जे किंवा क्रेडिट कार्डचे एकूण मासिक हप्ते',
    existingSavings: 'सध्याची एकूण बचत',
    existingSavingsHelp: 'रोकड, बँक शिल्लक, एफडी किंवा सुरक्षित बचत',
    existingDebt: 'एकूण बाकी कर्ज',
    existingDebtHelp: 'सर्व कर्जांची एकूण बाकी मुद्दल रक्कम',
    dependents: 'कुटुंबातील अवलंबून सदस्य',

    age: 'वय',
    gender: 'लिंग',
    genderSelect: 'लिंग निवडा',
    male: 'पुरुष',
    female: 'महिला',
    other: 'इतर',
    employmentType: 'रोजगाराचा प्रकार',
    salaried: 'पगारदार नोकरदार',
    selfEmployed: 'स्वयंरोजगार / व्यवसाय',
    gigWorker: 'गिग वर्कर / फ्रीलान्सर',
    farmer: 'शेतकरी / कृषी',
    dailyWage: 'दैनिक मजुरी',
    unemployed: 'सध्या काम शोधत आहे',
    state: 'राज्य / केंद्रशासित प्रदेश',
    isRural: 'ग्रामीण भागात वास्तव्य',
    hasBankAccount: 'सक्रिय बँक खाते आहे',
    hasInsurance: 'जीवन विमा संरक्षण आहे',
    hasHealthInsurance: 'आरोग्य विमा संरक्षण आहे',
    riskAppetite: 'गुंतवणूक जोखीम क्षमता',
    conservative: 'पारंपरिक (सुरक्षा प्रथम)',
    moderate: 'मध्यम (संतुलित वाढ)',
    aggressive: 'आक्रमक (अधिक परतावा)',

    goalsTitle: 'तुमची प्रमुख आर्थिक उद्दिष्टे कोणती आहेत?',
    goalEmergency: '६ महिन्यांचा आपत्कालीन निधी तयार करणे',
    goalHome: 'घर खरेदी करणे किंवा बांधणे',
    goalVehicle: 'वाहन खरेदी करणे',
    goalEducation: 'मुलांचे उच्च शिक्षण',
    goalBusiness: 'नवीन व्यवसाय सुरू किंवा वाढवणे',
    goalRetirement: 'सुरक्षित सेवानिवृत्ती (PPF/NPS)',

    scamInputLabel: 'संशयास्पद योजना किंवा संदेशाची तपासणी (पर्यायी)',
    scamInputPlaceholder: 'व्हॉट्सॲपवरील लोन ऑफर, जास्त परताव्याची योजना किंवा संशयास्पद संदेश येथे पेस्ट करा…',

    // Loading Screen
    loadingTitle: 'तुमचा आर्थिक आराखडा तयार होत आहे',
    loadingSubtitle: 'एजंट्स जोखीम गुण मोजत आहेत, शासकीय योजना तपासत आहेत आणि मोंटे कार्लो सिम्युलेशन चालवत आहेत.',

    // Dashboard
    dashboardTitle: 'आर्थिक बुद्धिमत्ता डॅशबोर्ड',
    startNew: 'नवीन प्रोफाइल',
    talkWithVoice: 'व्हॉइस असिस्टंट',
    tabOverview: 'आढावा',
    tabRisk: 'धोका व आरोग्य',
    tabSimulation: '३६ महिने मॉडेल',
    tabScams: 'फसवणूक सुरक्षा',
    tabSchemes: 'शासकीय योजना',
    tabGoals: 'आर्थिक ध्येये',
    tabCoach: 'आर्थिक मार्गदर्शक',
    tabActions: 'कृती योजना',

    // Key Metrics
    metricSurplus: 'निव्वळ मासिक शिल्लक (सरप्लस)',
    metricRunway: 'आपत्कालीन रनवे',
    metricDti: 'कर्ज-ते-उत्पन्न प्रमाण (DTI)',
    metricHealth: 'आर्थिक आरोग्य स्कोअर',
    metricDebt: 'एकूण बाकी कर्ज',
    metricSavings: 'सध्याची बचत',
    months: 'महिने',
    healthyRange: 'सुरक्षित मर्यादा: < ३५%',
    surplusReady: 'बचत व SIP साठी तयार',

    // Risk Tiers
    riskLow: 'कमी धोका',
    riskModerate: 'मध्यम धोका',
    riskHigh: 'जास्त धोका',
    riskTierLabel: 'धोका पातळी',

    // Schemes
    eligibleBadge: 'पात्र',
    potentialBadge: 'संभाव्य पात्र',
    annualBenefit: 'वार्षिक लाभ',
    howToApply: 'अर्ज कसा करावा',

    // Simulation
    simStatusQuo: 'सद्यस्थिती',
    simModerate: 'संतुलित वाढ',
    simOptimal: 'इष्टतम धोरण',
    simMonthsHorizon: '३६ महिन्यांचे संपत्ती क्षितिज',
    projectedSavings: 'अंदाजित बचत',
    projectedNetWorth: 'अंदाजित एकूण संपत्ती',
    successProbability: 'यशस्वी होण्याची शक्यता',

    // Chatbot Panel
    chatHeader: 'FinMate ला विचारा',
    chatSubheader: 'आवाज आणि मजकुरासह बहुभाषिक आर्थिक सल्ला',
    chatPlaceholder: 'मराठीत कोणताही प्रश्न विचारा (उदा. मी कार लोन घेऊ शकतो का?)…',
    chatSend: 'पाठवा',
    chatListening: 'तुमचा आवाज ऐकत आहे…',
    chatStopAudio: 'ऑडिओ थांबवा',
    chatListenTTS: 'ऐका (TTS)',
    chatLangPrompt: 'भाषा:',
    quickPrompts: [
      'मी नवीन कारचा EMI घेऊ शकतो का?',
      'माझ्या मासिक शिलकीची गुंतवणूक कुठे करावी?',
      'मी कोणत्या शासकीय योजनांसाठी पात्र आहे?',
      '६ महिन्यांचा आपत्कालीन निधी कसा तयार करावा?',
    ],

    // Dedicated Voice Assistant
    voiceTitle: 'FinMate व्हॉइस असिस्टंट',
    voiceSubtitle: 'मराठी किंवा कोणत्याही भारतीय भाषेत सहज बोला. FinMate ऐकून लगेच सविस्तर उत्तर देईल.',
    voiceReady: 'तयार — बोलण्यासाठी मायक्रोफोनवर क्लिक करा',
    voiceListening: 'ऐकत आहे… आता बोला',
    voiceProcessing: 'FinMate एजंट्स तुमच्या प्रश्नाचे विश्लेषण करत आहेत…',
    voiceSpeaking: 'FinMate उत्तर देत आहे…',
    voiceTranscriptLabel: 'तुम्ही म्हणालात:',
    voiceResponseLabel: 'FinMate चे उत्तर:',
    voiceStartBtn: 'बोलणे सुरू करा',
    voiceStopBtn: 'ऑडिओ थांबवा',
    voiceReListenBtn: 'पुन्हा ऐका',
    voiceCloseBtn: 'डॅशबोर्डवर परत जा',
  },

  bn: {
    // Topbar
    appTitle: 'FinMate',
    appSubtitle: 'আর্থিক উপদেষ্টা',
    agentsLive: 'এজেন্ট সক্রিয়',
    agentsOffline: 'এজেন্ট অফলাইন',
    connecting: 'সংযুক্ত হচ্ছে…',
    demoMode: 'ডেমো মোড',
    liveAnalysis: 'লাইভ বিশ্লেষণ',
    switchMode: 'ডেমো / লাইভ মোড পরিবর্তন করুন',
    selectLanguage: 'ভাষা',

    // Welcome Hero
    welcomeBadge: 'ভারতীয় পরিবারের জন্য এআই আর্থিক সহায়ক',
    welcomeHeading: 'এআই নির্দেশনার সাথে নিজের আর্থিক ভবিষ্যৎ সুরক্ষিত করুন',
    welcomeSubheading:
      'আপনার আসল আয়, ব্যয় এবং ঋণের ভিত্তিতে তৈরি। FinMate ঝুঁকি বিশ্লেষণ করে, সরকারি যোজনা খুঁজে দেয়, ভবিষ্যতের সম্পদের রূপরেখা তৈরি করে এবং জালিয়াতি থেকে রক্ষা করে।',
    startOverview: 'সারসংক্ষেপ দেখুন',
    startDebtRisk: 'ঋণ ও ঝুঁকি পরীক্ষা',
    startSchemes: 'সরকারি যোজনা দেখুন',
    startSimulation: '৩৬ মাসের সম্পদ সিমুলেশন',

    // Value Pillars
    pillar1Title: '৯টি বুদ্ধিমান এজেন্ট',
    pillar1Desc: 'ল্যাংগ্রাফ পাইপলাইন যা আপনার সাশ্রয় ক্ষমতা, ডিটিআই অনুপাত এবং জরুরি তহবিল বিশ্লেষণ করে।',
    pillar2Title: 'সরকারি যোজনা',
    pillar2Desc: 'PMJJBY, PMSBY, APY, PMAY সহ কেন্দ্র ও রাজ্যের কল্যাণমূলক প্রকল্পের সন্ধান।',
    pillar3Title: 'প্রতারণা প্রতিরোধ',
    pillar3Desc: 'ভুয়ো কেওয়াইসি, ডিজিটাল গ্রেপ্তার এবং ভুয়ো বিনিয়োগ প্রকল্প থেকে সুরক্ষা।',
    pillar4Title: 'মন্টে কার্লো পূর্বাভাস',
    pillar4Desc: 'বর্তমান ও ভারসাম্যপূর্ণ পথে ৩ বছরের সম্পদের সঠিক অনুমান।',

    // Onboarding Form
    formTitle: 'আর্থিক প্রোফাইল মূল্যায়ন',
    formSubtitle: 'আপনার তথ্য লিখুন। ব্যাংক লগইনের প্রয়োজন নেই — সম্পূর্ণ সুরক্ষিত ও গোপনীয়।',
    stepFinancials: 'আর্থিক তথ্য',
    stepDemographics: 'ব্যক্তিগত তথ্য',
    stepGoals: 'লক্ষ্য ও সুরক্ষা',
    nextStep: 'পরবর্তী',
    prevStep: 'পূর্ববর্তী',
    submitAnalyze: 'আমার আর্থিক বিশ্লেষণ করুন',
    analyzingNow: '৯-এজেন্ট বিশ্লেষণ চলছে…',

    monthlyIncome: 'মাসিক নিট আয় (হাতে পাওয়া টাকা)',
    monthlyIncomeHelp: 'প্রতি মাসে পরিবারে আসা মোট নিট উপার্জন',
    monthlyExpenses: 'মাসিক পারিবারিক ব্যয়',
    monthlyExpensesHelp: 'বাড়ি ভাড়া, বাজার, বিদ্যুৎ বিল, স্কুলের বেতন ও নিত্যপ্রয়োজনীয় খরচ',
    monthlyEmi: 'বর্তমান মাসিক কিস্তি (EMI)',
    monthlyEmiHelp: 'সমস্ত ঋণ বা ক্রেডিট কার্ডের মোট মাসিক কিস্তির পরিমাণ',
    existingSavings: 'বর্তমান মোট সঞ্চয়',
    existingSavingsHelp: 'নগদ, ব্যাংক ব্যালেন্স, এফডি বা তরল সঞ্চয়',
    existingDebt: 'মোট বকেয়া ঋণ',
    existingDebtHelp: 'সব ঋণের মোট আসল বকেয়া টাকা',
    dependents: 'পরিবারে নির্ভরশীল সদস্য',

    age: 'বয়স',
    gender: 'লিঙ্গ',
    genderSelect: 'লিঙ্গ নির্বাচন করুন',
    male: 'পুরুষ',
    female: 'মহিলা',
    other: 'অন্যান্য',
    employmentType: 'পেশার ধরন',
    salaried: 'চাকরিজীবী',
    selfEmployed: 'স্বনিযুক্ত / ব্যবসায়ী',
    gigWorker: 'গিগ ওয়ার্কার / ফ্রিল্যান্সার',
    farmer: 'কৃষক / কৃষিভিত্তিক',
    dailyWage: 'দৈনিক মজুরি',
    unemployed: 'বর্তমানে কর্মহীন',
    state: 'রাজ্য / কেন্দ্রশাসিত অঞ্চল',
    isRural: 'গ্রামীণ এলাকায় বসবাস',
    hasBankAccount: 'সক্রিয় ব্যাংক অ্যাকাউন্ট আছে',
    hasInsurance: 'জীবন বীমা কভারেজ আছে',
    hasHealthInsurance: 'স্বাস্থ্য বীমা কভারেজ আছে',
    riskAppetite: 'বিনিয়োগে ঝুঁকির আগ্রহ',
    conservative: 'রক্ষণশীল (সুরক্ষা অগ্রাধিকার)',
    moderate: 'মাঝারি (ভারসাম্যপূর্ণ বৃদ্ধি)',
    aggressive: 'উচ্চাকাঙ্ক্ষী (বেশি বৃদ্ধি)',

    goalsTitle: 'আপনার প্রধান আর্থিক লক্ষ্যগুলি কী কী?',
    goalEmergency: '৬ মাসের জরুরি তহবিল তৈরি করা',
    goalHome: 'বাড়ি কেনা বা নির্মাণ করা',
    goalVehicle: 'গাড়ি বা বাইক কেনা',
    goalEducation: 'সন্তানদের উচ্চশিক্ষা',
    goalBusiness: 'নতুন ব্যবসা শুরু বা সম্প্রসারণ',
    goalRetirement: 'অবসর জীবনের নিরাপত্তা (PPF/NPS)',

    scamInputLabel: 'সন্দেহজনক অফার বা বার্তার যাচাইকরণ (ঐচ্ছিক)',
    scamInputPlaceholder: 'হোয়াটসঅ্যাপ লোন অফার বা নিশ্চিত রিটার্নের কোনো সন্দেহজনক বার্তা এখানে পেস্ট করুন…',

    // Loading Screen
    loadingTitle: 'আপনার আর্থিক রোডম্যাপ তৈরি হচ্ছে',
    loadingSubtitle: 'এজেন্টরা ঝুঁকির মান নির্ধারণ করছে, সরকারি প্রকল্পের তথ্য মেলাচ্ছে এবং সিমুলেশন পরিচালনা করছে।',

    // Dashboard
    dashboardTitle: 'আর্থিক বুদ্ধিমত্তা ড্যাশবোর্ড',
    startNew: 'নতুন প্রোফাইল',
    talkWithVoice: 'ভয়েস সহকারী',
    tabOverview: 'সারসংক্ষেপ',
    tabRisk: 'ঝুঁকি ও স্বাস্থ্য',
    tabSimulation: '৩৬ মাসের সিমুলেশন',
    tabScams: 'প্রতারণা প্রতিরোধ',
    tabSchemes: 'সরকারি যোজনা',
    tabGoals: 'আর্থিক লক্ষ্য',
    tabCoach: 'আর্থিক পরামর্শক',
    tabActions: 'কর্মপরিকল্পনা',

    // Key Metrics
    metricSurplus: 'মাসিক অতিরিক্ত সঞ্চয় (সারপ্লাস)',
    metricRunway: 'জরুরি ব্যাকআপ (রানওয়ে)',
    metricDti: 'ঋণ ও আয়ের অনুপাত (DTI)',
    metricHealth: 'আর্থিক স্বাস্থ্য স্কোর',
    metricDebt: 'মোট বকেয়া ঋণ',
    metricSavings: 'বর্তমান সঞ্চয়',
    months: 'মাস',
    healthyRange: 'নিরাপদ মাত্রা: < ৩৫%',
    surplusReady: 'সঞ্চয় ও SIP-র জন্য প্রস্তুত',

    // Risk Tiers
    riskLow: 'কম ঝুঁকি',
    riskModerate: 'মাঝারি ঝুঁকি',
    riskHigh: 'উচ্চ ঝুঁকি',
    riskTierLabel: 'ঝুঁকির স্তর',

    // Schemes
    eligibleBadge: 'যোগ্য',
    potentialBadge: 'সম্ভাব্য যোগ্য',
    annualBenefit: 'বার্ষিক সুবিধা',
    howToApply: 'আবেদন পদ্ধতি',

    // Simulation
    simStatusQuo: 'বর্তমান অবস্থা',
    simModerate: 'ভারসাম্যপূর্ণ বৃদ্ধি',
    simOptimal: 'অনুকূলিত কৌশল',
    simMonthsHorizon: '৩৬ মাসের সম্পদ দিগন্ত',
    projectedSavings: 'প্রত্যাশিত সঞ্চয়',
    projectedNetWorth: 'প্রত্যাশিত মোট সম্পদ',
    successProbability: 'সাফল্যের সম্ভাবনা',

    // Chatbot Panel
    chatHeader: 'FinMate-কে জিজ্ঞাসা করুন',
    chatSubheader: 'ভয়েস ও টেক্সট সহ বহুভাষিক আর্থিক পরামর্শ',
    chatPlaceholder: 'বাংলায় যেকোনো আর্থিক প্রশ্ন লিখুন (যেমন: আমি কি গাড়ি লোন নিতে পারি?)…',
    chatSend: 'পাঠান',
    chatListening: 'আপনার কথা শুনছি…',
    chatStopAudio: 'অডিও বন্ধ করুন',
    chatListenTTS: 'শুনে নিন (TTS)',
    chatLangPrompt: 'ভাষা:',
    quickPrompts: [
      'আমি কি নতুন গাড়ির ইএমআই নিতে পারব?',
      'আমার মাসিক উদ্বৃত্ত টাকা কোথায় বিনিয়োগ করব?',
      'আমি কোন কোন সরকারি যোজনার জন্য যোগ্য?',
      '৬ মাসের জরুরি তহবিল কীভাবে তৈরি করব?',
    ],

    // Dedicated Voice Assistant
    voiceTitle: 'FinMate ভয়েস সহকারী',
    voiceSubtitle: 'বাংলায় বা যেকোনো ভারতীয় ভাষায় স্বাভাবিকভাবে কথা বলুন। FinMate শুনে আপনাকে সঠিক পরামর্শ দেবে।',
    voiceReady: 'প্রস্তুত — কথা বলতে মাইক্রোফোনে ক্লিক করুন',
    voiceListening: 'শুনছি… এখন বলুন',
    voiceProcessing: 'FinMate এজেন্টরা আপনার প্রশ্নের বিশ্লেষণ করছে…',
    voiceSpeaking: 'FinMate উত্তর দিচ্ছে…',
    voiceTranscriptLabel: 'আপনি বলেছেন:',
    voiceResponseLabel: 'FinMate-এর উত্তর:',
    voiceStartBtn: 'কথা বলা শুরু করুন',
    voiceStopBtn: 'অডিও থামান',
    voiceReListenBtn: 'পুনরায় শুনুন',
    voiceCloseBtn: 'ড্যাশবোর্ডে ফিরে যান',
  },

  pa: {
    // Topbar
    appTitle: 'FinMate',
    appSubtitle: 'ਵਿੱਤੀ ਸਲਾਹਕਾਰ',
    agentsLive: 'ਏਜੰਟ ਸਰਗਰਮ',
    agentsOffline: 'ਏਜੰਟ ਆਫ਼ਲਾਈਨ',
    connecting: 'ਕਨੈਕਟ ਹੋ ਰਿਹਾ ਹੈ…',
    demoMode: 'ਡੈਮੋ ਮੋਡ',
    liveAnalysis: 'ਲਾਈਵ ਵਿਸ਼ਲੇਸ਼ਣ',
    switchMode: 'ਡੈਮੋ / ਲਾਈਵ ਮੋਡ ਬਦਲੋ',
    selectLanguage: 'ਭਾਸ਼ਾ',

    // Welcome Hero
    welcomeBadge: 'ਭਾਰਤੀ ਪਰਿਵਾਰਾਂ ਲਈ ਏਆਈ ਵਿੱਤੀ ਸਾਥੀ',
    welcomeHeading: 'ਏਆਈ ਮਾਰਗਦਰਸ਼ਨ ਨਾਲ ਆਪਣੇ ਪੈਸੇ ਦਾ ਸਹੀ ਪ੍ਰਬੰਧਨ ਕਰੋ',
    welcomeSubheading:
      'ਤੁਹਾਡੀ ਅਸਲ ਆਮਦਨ, ਖਰਚਿਆਂ ਅਤੇ ਕਰਜ਼ਿਆਂ ਉੱਤੇ ਆਧਾਰਿਤ। FinMate ਜੋਖਮ ਦੀ ਜਾਂਚ ਕਰਦਾ ਹੈ, ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਨਾਲ ਜੋੜਦਾ ਹੈ, ਭਵਿੱਖ ਦੀ ਦੌਲਤ ਦਾ ਮਾਡਲ ਤਿਆਰ ਕਰਦਾ ਹੈ ਅਤੇ ਧੋਖਾਧੜੀ ਤੋਂ ਬਚਾਉਂਦਾ ਹੈ।',
    startOverview: 'ਸੰਖੇਪ ਵੇਖੋ',
    startDebtRisk: 'ਕਰਜ਼ਾ ਅਤੇ ਜੋਖਮ ਜਾਂਚੋ',
    startSchemes: 'ਭਲਾਈ ਸਕੀਮਾਂ ਵੇਖੋ',
    startSimulation: '੩੬ ਮਹੀਨਿਆਂ ਦਾ ਦੌਲਤ ਸਿਮੂਲੇਸ਼ਨ',

    // Value Pillars
    pillar1Title: '੯ ਬੁੱਧੀਮਾਨ ਏਜੰਟ',
    pillar1Desc: 'ਲੈਂਗਗ੍ਰਾਫ ਪਾਈਪਲਾਈਨ ਜੋ ਤੁਹਾਡੇ ਬਜਟ, ਡੀਟੀਆਈ ਅਨੁਪਾਤ ਅਤੇ ਐਮਰਜੈਂਸੀ ਫੰਡ ਦੀ ਜਾਂਚ ਕਰਦੀ ਹੈ।',
    pillar2Title: 'ਸਰਕਾਰੀ ਸਕੀਮਾਂ',
    pillar2Desc: 'PMJJBY, PMSBY, APY, PMAY ਅਤੇ ਰਾਜ ਦੀਆਂ ਭਲਾਈ ਸਕੀਮਾਂ ਦਾ ਆਟੋਮੈਟਿਕ ਮੇਲ।',
    pillar3Title: 'ਧੋਖਾਧੜੀ ਤੋਂ ਬਚਾਅ',
    pillar3Desc: 'ਨਕਲੀ ਕੇਵਾਈਸੀ, ਡਿਜੀਟਲ ਅਰੈਸਟ ਅਤੇ ਧੋਖਾਧੜੀ ਵਾਲੇ ਸੁਨੇਹਿਆਂ ਤੋਂ ਸੁਰੱਖਿਆ ਕਵਚ।',
    pillar4Title: 'ਮੋਂਟੇ ਕਾਰਲੋ ਭਵਿੱਖਬਾਣੀ',
    pillar4Desc: 'ਮੌਜੂਦਾ ਅਤੇ ਸੰਤੁਲਿਤ ਬੱਚਤ ਯੋਜਨਾ ਤਹਿਤ ੩ ਸਾਲਾਂ ਦੀ ਸੰਪਤੀ ਦਾ ਸਹੀ ਅੰਦਾਜ਼ਾ।',

    // Onboarding Form
    formTitle: 'ਵਿੱਤੀ ਪ੍ਰੋਫਾਈਲ ਮੁਲਾਂਕਣ',
    formSubtitle: 'ਆਪਣੇ ਅੰਕੜੇ ਦਰਜ ਕਰੋ। ਕਿਸੇ ਬੈਂਕ ਲੌਗਇਨ ਦੀ ਲੋੜ ਨਹੀਂ — ਪੂਰੀ ਤਰ੍ਹਾਂ ਸੁਰੱਖਿਅਤ ਅਤੇ ਗੁਪਤ।',
    stepFinancials: 'ਵਿੱਤੀ ਜਾਣਕਾਰੀ',
    stepDemographics: 'ਨਿੱਜੀ ਜਾਣਕਾਰੀ',
    stepGoals: 'ਟੀਚੇ ਅਤੇ ਸੁਰੱਖਿਆ',
    nextStep: 'ਅੱਗੇ ਵਧੋ',
    prevStep: 'ਪਿੱਛੇ ਜਾਓ',
    submitAnalyze: 'ਮੇਰੇ ਵਿੱਤ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ',
    analyzingNow: '੯-ਏਜੰਟ ਵਿਸ਼ਲੇਸ਼ਣ ਚੱਲ ਰਿਹਾ ਹੈ…',

    monthlyIncome: 'ਮਾਸਿਕ ਸ਼ੁੱਧ ਆਮਦਨ (ਹੱਥ ਵਿਚ ਆਉਣ ਵਾਲੀ)',
    monthlyIncomeHelp: 'ਹਰ ਮਹੀਨੇ ਘਰ ਆਉਣ ਵਾਲੀ ਕੁੱਲ ਸ਼ੁੱਧ ਕਮਾਈ',
    monthlyExpenses: 'ਮਾਸਿਕ ਘਰੇਲੂ ਖਰਚੇ',
    monthlyExpensesHelp: 'ਕਿਰਾਇਆ, ਰਾਸ਼ਨ, ਬਿਜਲੀ-ਪਾਣੀ, ਸਕੂਲ ਫੀਸ ਅਤੇ ਜ਼ਰੂਰੀ ਖਰਚੇ',
    monthlyEmi: 'ਮੌਜੂਦਾ ਮਹੀਨਾਵਾਰ ਕਿਸ਼ਤਾਂ (EMI)',
    monthlyEmiHelp: 'ਸਾਰੇ ਕਰਜ਼ਿਆਂ ਜਾਂ ਕ੍ਰੈਡਿਟ ਕਾਰਡਾਂ ਦੀ ਕੁੱਲ ਮਹੀਨਾਵਾਰ ਕਿਸ਼ਤ',
    existingSavings: 'ਮੌਜੂਦਾ ਕੁੱਲ ਬੱਚਤ',
    existingSavingsHelp: 'ਨਕਦ, ਬੈਂਕ ਬੈਲੇਂਸ, ਐਫਡੀ ਜਾਂ ਤਰਲ ਬੱਚਤ',
    existingDebt: 'ਕੁੱਲ ਬਕਾਇਆ ਕਰਜ਼ਾ',
    existingDebtHelp: 'ਸਾਰੇ ਕਰਜ਼ਿਆਂ ਉੱਤੇ ਬਾਕੀ ਕੁੱਲ ਮੂਲ ਰਕਮ',
    dependents: 'ਪਰਿਵਾਰ ਵਿਚ ਨਿਰਭਰ ਜੀਅ',

    age: 'ਉਮਰ',
    gender: 'ਲਿੰਗ',
    genderSelect: 'ਲਿੰਗ ਚੁਣੋ',
    male: 'ਪੁਰਸ਼',
    female: 'ਔਰਤ',
    other: 'ਹੋਰ',
    employmentType: 'ਕੰਮ ਦੀ ਕਿਸਮ',
    salaried: 'ਤਨਖਾਹਦਾਰ ਮੁਲਾਜ਼ਮ',
    selfEmployed: 'ਸਵੈ-ਰੁਜ਼ਗਾਰ / ਵਪਾਰੀ',
    gigWorker: 'ਗਿਗ ਵਰਕਰ / ਫ੍ਰੀਲਾਂਸਰ',
    farmer: 'ਕਿਸਾਨ / ਖੇਤੀਬਾੜੀ',
    dailyWage: 'ਦਿਹਾੜੀਦਾਰ ਕਾਮਾ',
    unemployed: 'ਵਰਤਮਾਨ ਵਿੱਚ ਕੰਮ ਦੀ ਭਾਲ ਵਿੱਚ',
    state: 'ਰਾਜ / ਕੇਂਦਰ ਸ਼ਾਸਿਤ ਪ੍ਰਦੇਸ਼',
    isRural: 'ਪੇਂਡੂ ਖੇਤਰ ਵਿੱਚ ਰਿਹਾਇਸ਼',
    hasBankAccount: 'ਸਰਗਰਮ ਬੈਂਕ ਖਾਤਾ ਹੈ',
    hasInsurance: 'ਜੀਵਨ ਬੀਮਾ ਕਵਰੇਜ ਹੈ',
    hasHealthInsurance: 'ਸਿਹਤ ਬੀਮਾ ਕਵਰੇਜ ਹੈ',
    riskAppetite: 'ਨਿਵੇਸ਼ ਜੋਖਮ ਸਮਰੱਥਾ',
    conservative: 'ਰਵਾਇਤੀ (ਸੁਰੱਖਿਆ ਪਹਿਲਾਂ)',
    moderate: 'ਦਰਮਿਆਨਾ (ਸੰਤੁਲਿਤ ਵਾਧਾ)',
    aggressive: 'ਹਮਲਾਵਰ (ਵੱਧ ਮੁਨਾਫ਼ਾ)',

    goalsTitle: 'ਤੁਹਾਡੀਆਂ ਮੁੱਖ ਵਿੱਤੀ ਤਰਜੀਹਾਂ ਕੀ ਹਨ?',
    goalEmergency: '੬ ਮਹੀਨਿਆਂ ਦਾ ਐਮਰਜੈਂਸੀ ਫੰਡ ਬਣਾਉਣਾ',
    goalHome: 'ਘਰ ਖਰੀਦਣਾ ਜਾਂ ਬਣਾਉਣਾ',
    goalVehicle: 'ਗੱਡੀ ਖਰੀਦਣਾ',
    goalEducation: 'ਬੱਚਿਆਂ ਦੀ ਉੱਚ ਸਿੱਖਿਆ',
    goalBusiness: 'ਨਵਾਂ ਕਾਰੋਬਾਰ ਸ਼ੁਰੂ ਜਾਂ ਵਧਾਉਣਾ',
    goalRetirement: 'ਸੁਰੱਖਿਅਤ ਸੇਵਾਮੁਕਤੀ (PPF/NPS)',

    scamInputLabel: 'ਸ਼ੱਕੀ ਪੇਸ਼ਕਸ਼ ਜਾਂ ਸੁਨੇਹੇ ਦੀ ਜਾਂਚ (ਵਿਕਲਪਿਕ)',
    scamInputPlaceholder: 'ਵ੍ਹਟਸਐਪ ਲੋਨ ਆਫ਼ਰ, ਭਾਰੀ ਮੁਨਾਫ਼ੇ ਵਾਲੀ ਸਕੀਮ ਜਾਂ ਸ਼ੱਕੀ ਸੁਨੇਹਾ ਇੱਥੇ ਪੇਸਟ ਕਰੋ…',

    // Loading Screen
    loadingTitle: 'ਤੁਹਾਡਾ ਵਿੱਤੀ ਰੋਡਮੈਪ ਤਿਆਰ ਹੋ ਰਿਹਾ ਹੈ',
    loadingSubtitle: 'ਏਜੰਟ ਜੋਖਮ ਸਕੋਰ ਦੀ ਗਣਨਾ ਕਰ ਰਹੇ ਹਨ, ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਦੀ ਜਾਂਚ ਕਰ ਰਹੇ ਹਨ ਅਤੇ ਸਿਮੂਲੇਸ਼ਨ ਚਲਾ ਰਹੇ ਹਨ।',

    // Dashboard
    dashboardTitle: 'ਵਿੱਤੀ ਬੁੱਧੀਮੱਤਾ ਡੈਸ਼ਬੋਰਡ',
    startNew: 'ਨਵੀਂ ਪ੍ਰੋਫਾਈਲ',
    talkWithVoice: 'ਆਵਾਜ਼ ਸਹਾਇਕ',
    tabOverview: 'ਸੰਖੇਪ',
    tabRisk: 'ਜੋਖਮ ਅਤੇ ਸਿਹਤ',
    tabSimulation: '੩੬ ਮਹੀਨੇ ਸਿਮੂਲੇਸ਼ਨ',
    tabScams: 'ਧੋਖਾਧੜੀ ਢਾਲ',
    tabSchemes: 'ਸਰਕਾਰੀ ਸਕੀਮਾਂ',
    tabGoals: 'ਵਿੱਤੀ ਟੀਚੇ',
    tabCoach: 'ਵਿੱਤੀ ਕੋਚ',
    tabActions: 'ਕਾਰਜ ਯੋਜਨਾ',

    // Key Metrics
    metricSurplus: 'ਸ਼ੁੱਧ ਮਹੀਨਾਵਾਰ ਬੱਚਤ (ਸਰਪਲੱਸ)',
    metricRunway: 'ਐਮਰਜੈਂਸੀ ਰਨਵੇ',
    metricDti: 'ਕਰਜ਼ਾ-ਤੋਂ-ਆਮਦਨ ਅਨੁਪਾਤ (DTI)',
    metricHealth: 'ਵਿੱਤੀ ਸਿਹਤ ਸਕੋਰ',
    metricDebt: 'ਕੁੱਲ ਬਕਾਇਆ ਕਰਜ਼ਾ',
    metricSavings: 'ਮੌਜੂਦਾ ਬੱਚਤ',
    months: 'ਮਹੀਨੇ',
    healthyRange: 'ਸੁਰੱਖਿਅਤ ਸੀਮਾ: < ੩੫%',
    surplusReady: 'ਬੱਚਤ ਅਤੇ SIP ਲਈ ਤਿਆਰ',

    // Risk Tiers
    riskLow: 'ਘੱਟ ਜੋਖਮ',
    riskModerate: 'ਦਰਮਿਆਨਾ ਜੋਖਮ',
    riskHigh: 'ਉੱਚ ਜੋਖਮ',
    riskTierLabel: 'ਜੋਖਮ ਪੱਧਰ',

    // Schemes
    eligibleBadge: 'ਯੋਗ',
    potentialBadge: 'ਸੰਭਾਵੀ ਯੋਗ',
    annualBenefit: 'ਸਾਲਾਨਾ ਲਾਭ',
    howToApply: 'ਅਰਜ਼ੀ ਕਿਵੇਂ ਦੇਣੀ ਹੈ',

    // Simulation
    simStatusQuo: 'ਮੌਜੂਦਾ ਸਥਿਤੀ',
    simModerate: 'ਸੰਤੁਲਿਤ ਵਿਕਾਸ',
    simOptimal: 'ਅਨੁਕੂਲਿਤ ਰਣਨੀਤੀ',
    simMonthsHorizon: '੩੬-ਮਹੀਨੇ ਦਾ ਸੰਪਤੀ ਖਿਤਿਜ',
    projectedSavings: 'ਅਨੁਮਾਨਿਤ ਬੱਚਤ',
    projectedNetWorth: 'ਅਨੁਮਾਨਿਤ ਕੁੱਲ ਦੌਲਤ',
    successProbability: 'ਸਫ਼ਲਤਾ ਦੀ ਸੰਭਾਵਨਾ',

    // Chatbot Panel
    chatHeader: 'FinMate ਨੂੰ ਪੁੱਛੋ',
    chatSubheader: 'ਆਵਾਜ਼ ਅਤੇ ਲਿਖਤ ਰਾਹੀਂ ਬਹੁ-ਭਾਸ਼ਾਈ ਵਿੱਤੀ ਸਲਾਹ',
    chatPlaceholder: 'ਪੰਜਾਬੀ ਵਿੱਚ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ (ਜਿਵੇਂ: ਕੀ ਮੈਂ ਕਾਰ ਲੋਨ ਲੈ ਸਕਦਾ ਹਾਂ?)…',
    chatSend: 'ਭੇਜੋ',
    chatListening: 'ਤੁਹਾਡੀ ਆਵਾਜ਼ ਸੁਣ ਰਿਹਾ ਹੈ…',
    chatStopAudio: 'ਆਡੀਓ ਰੋਕੋ',
    chatListenTTS: 'ਸੁਣੋ (TTS)',
    chatLangPrompt: 'ਭਾਸ਼ਾ:',
    quickPrompts: [
      'ਕੀ ਮੈਂ ਨਵੀਂ ਕਾਰ ਦੀ ਕਿਸ਼ਤ (EMI) ਭਰ ਸਕਦਾ ਹਾਂ?',
      'ਮੈਨੂੰ ਆਪਣੀ ਮਹੀਨਾਵਾਰ ਵਾਧੂ ਬੱਚਤ ਕਿੱਥੇ ਨਿਵੇਸ਼ ਕਰਨੀ ਚਾਹੀਦੀ ਹੈ?',
      'ਮੈਂ ਕਿਹੜੀਆਂ ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਲਈ ਯੋਗ ਹਾਂ?',
      '੬ ਮਹੀਨਿਆਂ ਦਾ ਐਮਰਜੈਂਸੀ ਫੰਡ ਕਿਵੇਂ ਬਣਾਈਏ?',
    ],

    // Dedicated Voice Assistant
    voiceTitle: 'FinMate ਵੌਇਸ ਅਸਿਸਟੈਂਟ',
    voiceSubtitle: 'ਪੰਜਾਬੀ ਜਾਂ ਕਿਸੇ ਵੀ ਭਾਰਤੀ ਭਾਸ਼ਾ ਵਿੱਚ ਸਹਿਜ ਬੋਲੋ। FinMate ਸੁਣ ਕੇ ਸਹੀ ਤੇ ਵਿਸਥਾਰਪੂਰਵਕ ਸਲਾਹ ਦੇਵੇਗਾ।',
    voiceReady: 'ਤਿਆਰ — ਬੋਲਣ ਲਈ ਮਾਈਕ੍ਰੋਫੋਨ ਉੱਤੇ ਕਲਿੱਕ ਕਰੋ',
    voiceListening: 'ਸੁਣ ਰਿਹਾ ਹਾਂ… ਹੁਣ ਬੋਲੋ',
    voiceProcessing: 'FinMate ਏਜੰਟ ਤੁਹਾਡੇ ਸਵਾਲ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰ ਰਹੇ ਹਨ…',
    voiceSpeaking: 'FinMate ਜਵਾਬ ਦੇ ਰਿਹਾ ਹੈ…',
    voiceTranscriptLabel: 'ਤੁਸੀਂ ਕਿਹਾ:',
    voiceResponseLabel: 'FinMate ਦਾ ਜਵਾਬ:',
    voiceStartBtn: 'ਬੋਲਣਾ ਸ਼ੁਰੂ ਕਰੋ',
    voiceStopBtn: 'ਆਡੀਓ ਰੋਕੋ',
    voiceReListenBtn: 'ਦੁਬਾਰਾ ਸੁਣੋ',
    voiceCloseBtn: 'ਡੈਸ਼ਬੋਰਡ ਉੱਤੇ ਵਾਪਸ ਜਾਓ',
  },
}

export const DASHBOARD_LABELS = {
  en: {
    credibilityCheck: 'Data Credibility Check:',
    credibilityPlausible: 'Input metrics look consistent and plausible.',
    credibilityWarning: 'Potential inconsistencies detected in input data.',
    assessmentTitle: "FinMate's Personalized Assessment",
    overviewEyebrow: 'Financial overview',
    overviewTitle: 'The month at a glance',
    metricAnnualIncome: 'Annual income',
    metricVolatility: 'Income volatility',
    volatilityVolatile: 'Volatile (gig/farmer)',
    volatilityStable: 'Stable',
    healthEyebrow: 'Financial health',
    healthTitle: 'Risk, in context',
    compositeScoreDesc: 'Composite score from debt, surplus, runway, stability, and savings.',
    scoreDebt: 'Debt Score',
    scoreEmergency: 'Emergency Score',
    scoreIncome: 'Income Score',
    scoreSurplus: 'Surplus Score',
    scoreInvestment: 'Investment Score',
    scamEyebrow: 'Scam detection',
    scamTitle: 'Stay one step ahead',
    noScamMatch: 'No relevant scam match was returned.',
    notSafetyGuarantee: 'That is not a guarantee of safety.',
    explainabilityEyebrow: 'Explainability',
    explainabilityTitle: 'The story in the numbers',
    schemesEyebrow: 'Government schemes',
    schemesTitle: 'Worth a closer look',
    coachEyebrow: 'Coach plan',
    coachTitle: 'Your next few moves',
    actionsCount: 'actions',
    simEyebrow: 'Future simulation',
    simTitle: 'Three ways the next 36 months could unfold',
    simNote: 'Modeled via 1,000 Monte Carlo iterations. Scenarios to plan around, not guaranteed predictions.',
    netWorth: 'Net worth',
    goalChance: 'goal chance',
    atMonth: 'at month',
    goalsEyebrow: 'Financial goals',
    goalsTitle: 'What matters to you',
    targetNotSet: 'Target not set',
  },
  hi: {
    credibilityCheck: 'डेटा विश्वसनीयता जांच:',
    credibilityPlausible: 'दर्ज किए गए आंकड़े सुसंगत और सटीक प्रतीत होते हैं।',
    credibilityWarning: 'दर्ज आंकड़ों में संभावित विसंगतियां पाई गईं।',
    assessmentTitle: "फिनमेट का व्यक्तिगत वित्तीय मूल्यांकन",
    overviewEyebrow: 'वित्तीय अवलोकन',
    overviewTitle: 'माह की मुख्य वित्तीय झलक',
    metricAnnualIncome: 'वार्षिक आय',
    metricVolatility: 'आय की स्थिरता',
    volatilityVolatile: 'परिवर्तनशील (गिग/किसान/दैनिक)',
    volatilityStable: 'स्थिर',
    healthEyebrow: 'वित्तीय स्वास्थ्य',
    healthTitle: 'जोखिम का समग्र विश्लेषण',
    compositeScoreDesc: 'ऋण, सरप्लस, आपातकालीन रनवे, स्थिरता और बचत का समग्र स्कोर।',
    scoreDebt: 'ऋण स्कोर',
    scoreEmergency: 'आपातकालीन स्कोर',
    scoreIncome: 'आय स्थिरता स्कोर',
    scoreSurplus: 'सरप्लस स्कोर',
    scoreInvestment: 'निवेश तत्परता स्कोर',
    scamEyebrow: 'धोखाधड़ी पहचान व सुरक्षा',
    scamTitle: 'हमेशा एक कदम आगे और सुरक्षित रहें',
    noScamMatch: 'प्रोफ़ाइल में कोई धोखाधड़ी या संदिग्ध पैटर्न नहीं मिला।',
    notSafetyGuarantee: 'यह पूर्ण सुरक्षा की गारंटी नहीं है, हमेशा सतर्क रहें।',
    explainabilityEyebrow: 'स्पष्टीकरण',
    explainabilityTitle: 'संख्याओं के पीछे की वास्तविक कहानी',
    schemesEyebrow: 'सरकारी जनकल्याणकारी योजनाएं',
    schemesTitle: 'आपके लिए अनुशंसित व योग्य योजनाएं',
    coachEyebrow: 'वित्तीय कोच योजना',
    coachTitle: 'वित्तीय मजबूती के लिए अगले आवश्यक कदम',
    actionsCount: 'कदम',
    simEyebrow: 'भविष्य का सिमुलेशन',
    simTitle: 'अगले 36 महीनों के 3 संभावित वित्तीय परिदृश्य',
    simNote: '1,000 मोंटे कार्लो पुनरावृत्तियों द्वारा तैयार। योजना बनाने के लिए परिदृश्य, निश्चित भविष्यवाणी नहीं।',
    netWorth: 'कुल संपत्ति (Net worth)',
    goalChance: 'लक्ष्य प्राप्ति संभावना',
    atMonth: 'माह',
    goalsEyebrow: 'वित्तीय लक्ष्य',
    goalsTitle: 'आपकी सर्वोच्च प्राथमिकताएं',
    targetNotSet: 'लक्ष्य राशि निर्धारित नहीं',
  },
  mr: {
    credibilityCheck: 'डेटा विश्वासार्हता पडताळणी:',
    credibilityPlausible: 'नोंदवलेली आकडेवारी सुसंगत आणि अचूक वाटते.',
    credibilityWarning: 'नोंदवलेल्या माहितीत काही त्रुटी आढळल्या आहेत.',
    assessmentTitle: "फिनमेटचे वैयक्तिक आर्थिक मूल्यांकन",
    overviewEyebrow: 'आर्थिक आढावा',
    overviewTitle: 'महिन्याची मुख्य आर्थिक झलक',
    metricAnnualIncome: 'वार्षिक उत्पन्न',
    metricVolatility: 'उत्पन्नाची स्थिरता',
    volatilityVolatile: 'बदलणारे (गिग/शेतकरी/दैनिक)',
    volatilityStable: 'स्थिर',
    healthEyebrow: 'आर्थिक आरोग्य',
    healthTitle: 'जोखीम विश्लेषण',
    compositeScoreDesc: 'कर्ज, सरप्लस, आपत्कालीन निधी, स्थिरता आणि बचतीचा एकत्रित स्कोर.',
    scoreDebt: 'कर्ज स्कोर',
    scoreEmergency: 'आपत्कालीन स्कोर',
    scoreIncome: 'उत्पन्न स्थिरता स्कोर',
    scoreSurplus: 'सरप्लस स्कोर',
    scoreInvestment: 'गुंतवणूक तयारी स्कोर',
    scamEyebrow: 'फसवणूक ओळख व सुरक्षा',
    scamTitle: 'नेहमी एक पाऊल पुढे आणि सुरक्षित राहा',
    noScamMatch: 'कोणताही संशयास्पद किंवा फसवणुकीचा धोका आढळला नाही.',
    notSafetyGuarantee: 'ही संपूर्ण सुरक्षेची हमी नाही, नेहमी सावध राहा.',
    explainabilityEyebrow: 'स्पष्टीकरण',
    explainabilityTitle: 'तुमच्या आकड्यांमागील खरी गोष्ट',
    schemesEyebrow: 'शासकीय कल्याणकारी योजना',
    schemesTitle: 'तुमच्यासाठी योग्य आणि फायदेशीर योजना',
    coachEyebrow: 'आर्थिक मार्गदर्शक योजना',
    coachTitle: 'पुढील आवश्यक आणि महत्त्वाची पावले',
    actionsCount: 'पावले',
    simEyebrow: 'भविष्यातील अंदाज (सिम्युलेशन)',
    simTitle: 'पुढील 36 महिन्यांचे 3 संभाव्य आर्थिक मार्ग',
    simNote: '1,000 मॉन्टे कार्लो सिमुलेशनवर आधारित. नियोजन करण्यासाठी परिदृश्य, निश्चित भाकीत नाही.',
    netWorth: 'एकूण संपत्ती (Net worth)',
    goalChance: 'ध्येय साध्य शक्यता',
    atMonth: 'महिना',
    goalsEyebrow: 'आर्थिक उद्दिष्टे',
    goalsTitle: 'तुमच्या सर्वोच्च गरजा आणि उद्दिष्टे',
    targetNotSet: 'ध्येय रक्कम ठरलेली नाही',
  },
  bn: {
    credibilityCheck: 'তথ্য নির্ভরযোগ্যতা যাচাই:',
    credibilityPlausible: 'প্রদত্ত তথ্য সামঞ্জস্যপূর্ণ ও নির্ভুল প্রতীয়মান হয়।',
    credibilityWarning: 'প্রদত্ত তথ্যে সম্ভাব্য অসঙ্গতি চিহ্নিত হয়েছে।',
    assessmentTitle: "ফিনমেটের ব্যক্তিগত আর্থিক মূল্যায়ন",
    overviewEyebrow: 'আর্থিক বিবরণ',
    overviewTitle: 'এক নজরে চলতি মাস',
    metricAnnualIncome: 'বার্ষিক আয়',
    metricVolatility: 'আয়ের স্থিতিশীলতা',
    volatilityVolatile: 'পরিবর্তনশীল (গিগ/কৃষক)',
    volatilityStable: 'স্থিতিশীল',
    healthEyebrow: 'আর্থিক স্বাস্থ্য',
    healthTitle: 'ঝুঁকি বিশ্লেষণ',
    compositeScoreDesc: 'ঋণ, উদ্বৃত্ত, জরুরি তহবিল, স্থিতিশীলতা ও সঞ্চয়ের সমন্বিত স্কোর।',
    scoreDebt: 'ঋণ স্কোর',
    scoreEmergency: 'জরুরি তহবিল স্কোর',
    scoreIncome: 'আয় স্থিতিশীলতা স্কোর',
    scoreSurplus: 'উদ্বৃত্ত স্কোর',
    scoreInvestment: 'বিনিয়োগ প্রস্তুতি স্কোর',
    scamEyebrow: 'জালিয়াতি শনাক্তকরণ',
    scamTitle: 'সচেতন ও সুরক্ষিত থাকুন',
    noScamMatch: 'কোনো সন্দেহভাজন বা জালিয়াতির লক্ষণ পাওয়া যায়নি।',
    notSafetyGuarantee: 'এটি সম্পূর্ণ নিরাপত্তার নিশ্চয়তা নয়, সর্বদা সতর্ক থাকুন।',
    explainabilityEyebrow: 'বিশ্লেষণ ও ব্যাখ্যা',
    explainabilityTitle: 'সংখ্যার পেছনের আসল চিত্র',
    schemesEyebrow: 'সরকারি কল্যাণমূলক প্রকল্প',
    schemesTitle: 'আপনার জন্য উপযোগী প্রকল্পসমূহ',
    coachEyebrow: 'আর্থিক পরামর্শক পরিকল্পনা',
    coachTitle: 'আপনার পরবর্তী প্রয়োজনীয় পদক্ষেপ',
    actionsCount: 'পদক্ষেপ',
    simEyebrow: 'ভবিষ্যতের সিমুলেশন',
    simTitle: 'আগামী ৩৬ মাসের ৩টি সম্ভাব্য আর্থিক গতিপথ',
    simNote: '১,০০০ মন্টে কার্লো সিমুলেশনের ওপর ভিত্তি করে তৈরি। পরিকল্পনার জন্য পূর্বাভাস, কোনো নিশ্চিত দাবি নয়।',
    netWorth: 'মোট সম্পদ (Net worth)',
    goalChance: 'লক্ষ্য অর্জনের সম্ভাবনা',
    atMonth: 'মাসে',
    goalsEyebrow: 'আর্থিক লক্ষ্য',
    goalsTitle: 'আপনার প্রধান অগ্রাধিকার',
    targetNotSet: 'লক্ষ্য নির্ধারিত হয়নি',
  },
  pa: {
    credibilityCheck: 'ਡੇਟਾ ਭਰੋਸੇਯੋਗਤਾ ਜਾਂਚ:',
    credibilityPlausible: 'ਦਰਜ ਕੀਤੇ ਅੰਕੜੇ ਇਕਸਾਰ ਅਤੇ ਸਹੀ ਜਾਪਦੇ ਹਨ।',
    credibilityWarning: 'ਦਰਜ ਡੇਟਾ ਵਿੱਚ ਸੰਭਾਵੀ ਅਸੰਗਤਤਾਵਾਂ ਮਿਲੀਆਂ ਹਨ।',
    assessmentTitle: "ਫਿਨਮੇਟ ਦਾ ਨਿੱਜੀ ਵਿੱਤੀ ਮੁਲਾਂਕਣ",
    overviewEyebrow: 'ਵਿੱਤੀ ਝਲਕ',
    overviewTitle: 'ਇੱਕ ਨਜ਼ਰ ਵਿੱਚ ਮਹੀਨਾ',
    metricAnnualIncome: 'ਸਾਲਾਨਾ ਆਮਦਨ',
    metricVolatility: 'ਆਮਦਨ ਦੀ ਸਥਿਰਤਾ',
    volatilityVolatile: 'ਅਸਥਿਰ (ਗਿਗ/ਕਿਸਾਨ)',
    volatilityStable: 'ਸਥਿਰ',
    healthEyebrow: 'ਵਿੱਤੀ ਸਿਹਤ',
    healthTitle: 'ਜੋਖਮ ਵਿਸ਼ਲੇਸ਼ਣ',
    compositeScoreDesc: 'ਕਰਜ਼ਾ, ਵਾਧੂ ਬਚਤ, ਐਮਰਜੈਂਸੀ ਫੰਡ, ਸਥਿਰਤਾ ਅਤੇ ਬਚਤ ਦਾ ਸਮੁੱਚਾ ਸਕੋਰ।',
    scoreDebt: 'ਕਰਜ਼ਾ ਸਕੋਰ',
    scoreEmergency: 'ਐਮਰਜੈਂਸੀ ਸਕੋਰ',
    scoreIncome: 'ਆਮਦਨ ਸਥਿਰਤਾ ਸਕੋਰ',
    scoreSurplus: 'ਵਾਧੂ ਬਚਤ ਸਕੋਰ',
    scoreInvestment: 'ਨਿਵੇਸ਼ ਤਿਆਰੀ ਸਕੋਰ',
    scamEyebrow: 'ਧੋਖਾਧੜੀ ਪਛਾਣ',
    scamTitle: 'ਹਮੇਸ਼ਾ ਇੱਕ ਕਦਮ ਅੱਗੇ ਤੇ ਸੁਰੱਖਿਅਤ ਰਹੋ',
    noScamMatch: 'ਕੋਈ ਸ਼ੱਕੀ ਜਾਂ ਧੋਖਾਧੜੀ ਵਾਲਾ ਪੈਟਰਨ ਨਹੀਂ ਮਿਲਿਆ।',
    notSafetyGuarantee: 'ਇਹ ਪੂਰੀ ਸੁਰੱਖਿਆ ਦੀ ਗਰੰਟੀ ਨਹੀਂ ਹੈ, ਹਮੇਸ਼ਾ ਸੁਚੇਤ ਰਹੋ।',
    explainabilityEyebrow: 'ਸੰਖਿਆਵਾਂ ਦੀ ਵਿਆਖਿਆ',
    explainabilityTitle: 'ਅੰਕੜਿਆਂ ਦੇ ਪਿੱਛੇ ਦੀ ਅਸਲ ਕਹਾਣੀ',
    schemesEyebrow: 'ਸਰਕਾਰੀ ਭਲਾਈ ਸਕੀਮਾਂ',
    schemesTitle: 'ਤੁਹਾਡੇ ਲਈ ਯੋਗ ਅਤੇ ਲਾਹੇਵੰਦ ਸਕੀਮਾਂ',
    coachEyebrow: 'ਵਿੱਤੀ ਕੋਚ ਯੋਜਨਾ',
    coachTitle: 'ਤੁਹਾਡੇ ਅਗਲੇ ਜ਼ਰੂਰੀ ਕਦਮ',
    actionsCount: 'ਕਦਮ',
    simEyebrow: 'ਭਵਿੱਖ ਦਾ ਸਿਮੂਲੇਸ਼ਨ',
    simTitle: 'ਅਗਲੇ 36 ਮਹੀਨਿਆਂ ਦੇ 3 ਸੰਭਾਵੀ ਰਸਤੇ',
    simNote: '1,000 ਮੋਂਟੇ ਕਾਰਲੋ ਸਿਮੂਲੇਸ਼ਨਾਂ ਤੇ ਆਧਾਰਿਤ। ਯੋਜਨਾਬੰਦੀ ਲਈ ਦ੍ਰਿਸ਼, ਪੱਕੀ ਭਵਿੱਖਬਾਣੀ ਨਹੀਂ।',
    netWorth: 'ਕੁੱਲ ਜਾਇਦਾਦ (Net worth)',
    goalChance: 'ਟੀਚਾ ਹਾਸਲ ਸੰਭਾਵਨਾ',
    atMonth: 'ਮਹੀਨੇ ਤੇ',
    goalsEyebrow: 'ਵਿੱਤੀ ਟੀਚੇ',
    goalsTitle: 'ਤੁਹਾਡੀਆਂ ਮੁੱਖ ਤਰਜੀਹਾਂ',
    targetNotSet: 'ਟੀਚਾ ਨਿਰਧਾਰਿਤ ਨਹੀਂ',
  },
}

// Merge dashboard labels into DICTIONARY
Object.keys(DASHBOARD_LABELS).forEach((langCode) => {
  if (DICTIONARY[langCode]) {
    Object.assign(DICTIONARY[langCode], DASHBOARD_LABELS[langCode])
  }
})

/**
 * Helper to fetch translation with fallback to English
 */
export function t(lang = 'en', key = '', fallback = '') {
  const currentLang = DICTIONARY[lang] ? lang : DEFAULT_LANGUAGE
  const val = DICTIONARY[currentLang]?.[key]
  if (val !== undefined && val !== null) return val

  const enVal = DICTIONARY.en?.[key]
  if (enVal !== undefined && enVal !== null) return enVal

  return fallback || key
}

/**
 * Returns localized risk category label
 */
export function getLocalizedRiskCategory(category = 'unknown', lang = 'en') {
  const cat = String(category).toLowerCase()
  if (cat === 'low') return t(lang, 'riskLow', 'Low Risk')
  if (cat === 'moderate' || cat === 'medium') return t(lang, 'riskModerate', 'Moderate Risk')
  if (cat === 'high') return t(lang, 'riskHigh', 'High Risk')
  return category
}

/**
 * Returns localized simulation scenario title
 */
export function getLocalizedScenarioName(name = '', lang = 'en') {
  if (name === 'status_quo') return t(lang, 'simStatusQuo', 'Status Quo')
  if (name === 'moderate') return t(lang, 'simModerate', 'Balanced Growth')
  if (name === 'optimal') return t(lang, 'simOptimal', 'Optimized Strategy')
  return name
}

/**
 * Returns localized assessment narrative in user-selected language
 */
export function getLocalizedAssessment(analysis, lang = 'en') {
  if (!analysis) return ''
  const orig = analysis.finalResponse || ''
  const detected = detectScriptLanguage(orig)

  // If already in target language script, return it
  if (lang === 'en' && (!detected || detected === 'en')) return orig
  if (detected === lang) return orig

  // Synthesize dynamically in selected target language using real user numbers
  const m = analysis.financialMetrics || {}
  const surplus = Math.round(Number(m.monthly_surplus || 0))
  const runway = Number(m.emergency_months || 0).toFixed(1)
  const score = analysis.riskScore ?? 0
  const cat = (analysis.riskCategory || 'moderate').toLowerCase()
  const topCard = analysis.decisionCards?.[0]?.action || 'Build emergency fund'
  const schemes = (analysis.eligibleSchemes || [])
    .filter((s) => s.eligible)
    .map((s) => s.name)
    .slice(0, 2)
  const schemesText = schemes.length ? schemes.join(', ') : ''

  if (lang === 'hi') {
    const riskLabel = cat === 'low' ? 'कम' : cat === 'high' ? 'उच्च' : 'मध्यम'
    return `नमस्ते! आपके वित्तीय प्रोफाइल की समीक्षा के अनुसार, आपका समग्र जोखिम स्तर ${riskLabel} है (स्वास्थ्य स्कोर ${score}/100)। आपके पास ₹${surplus.toLocaleString('en-IN')} का शुद्ध मासिक अधिशेष (सरप्लस) है, और आपका आपातकालीन फंड ${runway} महीनों के खर्च को कवर करता है। सुरक्षा को प्राथमिकता देते हुए, हमारा मुख्य सुझाव है: "${topCard}"। ${schemesText ? `आप ${schemesText} जैसी कल्याणकारी योजनाओं के भी पात्र हैं। ` : ''}आपकी प्रोफाइल पर कोई संदिग्ध धोखाधड़ी नहीं पाई गई है। इन किफायती कदमों के साथ अपने भविष्य को सुरक्षित बनाएं!`
  }

  if (lang === 'mr') {
    const riskLabel = cat === 'low' ? 'कमी' : cat === 'high' ? 'जास्त' : 'मध्यम'
    return `नमस्कार! तुमच्या आर्थिक स्थितीच्या विश्लेषणानुसार, तुमची एकूण जोखीम पातळी ${riskLabel} आहे (आरोग्य स्कोर ${score}/100). तुमच्याकडे दरमहा ₹${surplus.toLocaleString('en-IN')} इतका मासिक सरप्लस शिल्लक राहतो आणि तुमचा आपत्कालीन निधी ${runway} महिन्यांच्या खर्चासाठी पुरेसा आहे. तुमची पहिली प्राथमिकता असावी: "${topCard}". ${schemesText ? `तुम्ही ${schemesText} यांसारख्या शासकीय योजनांसाठी पात्र आहात. ` : ''}कोणताही फसवणुकीचा धोका आढळलेला नाही. सातत्यपूर्ण बचतीसह सुरक्षित आर्थिक भविष्य घडवा!`
  }

  if (lang === 'bn') {
    const riskLabel = cat === 'low' ? 'কম' : cat === 'high' ? 'উচ্চ' : 'মাঝারি'
    return `নমস্কার! আপনার আর্থিক প্রোফাইল পর্যালোচনা অনুযায়ী, আপনার সার্বিক ঝুঁকির স্তর ${riskLabel} (স্বাস্থ্য স্কোর ${score}/100)। আপনার প্রতি মাসে ₹${surplus.toLocaleString('en-IN')} উদ্বৃত্ত অর্থ জমা হয় এবং আপনার জরুরি তহবিল ${runway} মাসের খরচ মেটাতে পারে। আপনার প্রধান অগ্রাধিকার হওয়া উচিত: "${topCard}"। ${schemesText ? `আপনি ${schemesText} প্রকল্পের জন্য যোগ্য। ` : ''}কোনো জালিয়াতি বা প্রতারণার সংকেত পাওয়া যায়নি। নিয়মিত সঞ্চয় করে ভবিষ্যৎ সুরক্ষিত রাখুন!`
  }

  if (lang === 'pa') {
    const riskLabel = cat === 'low' ? 'ਘੱਟ' : cat === 'high' ? 'ਵੱਧ' : 'ਦਰਮਿਆਨਾ'
    return `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਹਾਡੀ ਵਿੱਤੀ ਪ੍ਰੋਫਾਈਲ ਅਨੁਸਾਰ, ਤੁਹਾਡਾ ਸਮੁੱਚਾ ਜੋਖਮ ਪੱਧਰ ${riskLabel} ਹੈ (ਸਿਹਤ ਸਕੋਰ ${score}/100)। ਤੁਹਾਡੇ ਕੋਲ ਹਰ ਮਹੀਨੇ ₹${surplus.toLocaleString('en-IN')} ਦੀ ਵਾਧੂ ਬਚਤ ਬਚਦੀ ਹੈ ਅਤੇ ਤੁਹਾਡਾ ਐਮਰਜੈਂਸੀ ਫੰਡ ${runway} ਮਹੀਨਿਆਂ ਦੇ ਖਰਚੇ ਲਈ ਸਮਰੱਥ ਹੈ। ਤੁਹਾਡੀ ਸਭ ਤੋਂ ਵੱਡੀ ਤਰਜੀਹ ਹੋਣੀ ਚਾਹੀਦੀ ਹੈ: "${topCard}"। ${schemesText ? `ਤੁਸੀਂ ${schemesText} ਸਕੀਮਾਂ ਲਈ ਯੋਗ ਹੋ। ` : ''}ਕੋਈ ਧੋਖਾਧੜੀ ਵਾਲਾ ਪੈਟਰਨ ਨਹੀਂ ਮਿਲਿਆ। ਛੋਟੇ ਅਤੇ ਸਮਝਦਾਰੀ ਭਰੇ ਕਦਮਾਂ ਨਾਲ ਆਪਣਾ ਭਵਿੱਖ ਸੁਰੱਖਿਅਤ ਕਰੋ!`
  }

  return orig
}

/**
 * Returns localized scheme title and application guide
 */
export function getLocalizedScheme(scheme, lang = 'en') {
  if (!scheme) return { name: '', guide: '' }
  const rawName = scheme.name || ''
  const rawGuide = scheme.gap || scheme.how_to_apply || ''

  if (lang === 'en') {
    return { name: rawName, guide: rawGuide }
  }

  const sLower = rawName.toLowerCase()
  if (sLower.includes('suraksha') || sLower.includes('pmsby')) {
    const names = {
      hi: 'पीएम सुरक्षा बीमा योजना (PMSBY)',
      mr: 'पीएम सुरक्षा विमा योजना (PMSBY)',
      bn: 'পিএম সুরক্ষা বীমা যোজনা (PMSBY)',
      pa: 'ਪੀਐਮ ਸੁਰੱਖਿਆ ਬੀਮਾ ਯੋਜਨਾ (PMSBY)',
    }
    const guides = {
      hi: 'बैंक से संपर्क कर ₹20/वर्ष जन धन या बचत खाते से ऑटो-डेबिट करवाएं। ₹2,00,000 का दुर्घटना बीमा।',
      mr: 'बँकेशी संपर्क साधून जन धन किंवा बचत खात्यातून दरवर्षी ₹20 ऑटो-डेबिट करा. ₹2,00,000 चा अपघात विमा.',
      bn: 'ব্যাঙ্কের সাথে যোগাযোগ করে সেভিংস অ্যাকাউন্ট থেকে প্রতি বছর ₹২০ অটো-ডেবিট শুরু করুন। ₹২,০০,০০০ দুর্ঘটনা বীমা।',
      pa: 'ਬੈਂਕ ਨਾਲ ਸੰਪਰਕ ਕਰਕੇ ਬਚਤ ਖਾਤੇ ਵਿੱਚੋਂ ਸਲਾਨਾ ₹20 ਆਟੋ-ਡੈਬਿਟ ਸ਼ੁਰੂ ਕਰੋ। ₹2,00,000 ਦਾ ਹਾਦਸਾ ਬੀਮਾ।',
    }
    return { name: names[lang] || rawName, guide: guides[lang] || rawGuide }
  }

  if (sLower.includes('jeevan jyoti') || sLower.includes('pmjjby')) {
    const names = {
      hi: 'पीएम जीवन ज्योति बीमा योजना (PMJJBY)',
      mr: 'पीएम जीवन ज्योती विमा योजना (PMJJBY)',
      bn: 'পিএম জীবন জ্যোতি বীমা যোজনা (PMJJBY)',
      pa: 'ਪੀਐਮ ਜੀਵਨ ਜਯੋਤੀ ਬੀਮਾ ਯੋਜਨਾ (PMJJBY)',
    }
    const guides = {
      hi: 'बैंक शाखा या नेट बैंकिंग से नामांकन करें। ₹436/वर्ष प्रीमियम। ₹2,00,000 का जीवन बीमा।',
      mr: 'बँक शाखा किंवा नेट बँकिंगद्वारे नोंदणी करा. ₹436/वर्ष प्रीमियम. ₹2,00,000 चे जीवन विमा संरक्षण.',
      bn: 'ব্যাঙ্ক বা নেট ব্যাঙ্কিংয়ের মাধ্যমে নথিভুক্ত করুন। বার্ষিক ₹৪৩৬ প্রিমিয়াম। ₹২,০০,০০০ জীবন বীমা।',
      pa: 'ਬੈਂਕ ਸ਼ਾਖਾ ਜਾਂ ਨੈੱਟ ਬੈਂਕਿੰਗ ਰਾਹੀਂ ਨਾਮ ਦਰਜ ਕਰੋ। ਸਲਾਨਾ ₹436 ਪ੍ਰੀਮੀਅਮ। ₹2,00,000 ਦਾ ਜੀਵਨ ਬੀਮਾ।',
    }
    return { name: names[lang] || rawName, guide: guides[lang] || rawGuide }
  }

  if (sLower.includes('kisan')) {
    const names = {
      hi: 'पीएम किसान सम्मान निधि',
      mr: 'पीएम किसान सन्मान निधी',
      bn: 'পিএম কিষাণ সম্মান নিধি',
      pa: 'ਪੀਐਮ ਕਿਸਾਨ ਸੰਮਾਨ ਨਿਧੀ',
    }
    const guides = {
      hi: 'pmkisan.gov.in या नजदीकी सीएससी केंद्र पर जमीन के दस्तावेजों और आधार से पंजीकरण करें। ₹6,000 वार्षिक सहायता।',
      mr: 'pmkisan.gov.in किंवा जवळच्या सीएससी केंद्रावर जमिनीच्या नोंदी व आधारद्वारे नोंदणी करा. वार्षिक ₹६,००० मदत.',
      bn: 'pmkisan.gov.in বা নিকটস্থ CSC-তে জমির নথি ও আধার দিয়ে নাম নথিভুক্ত করুন। বার্ষিক ₹৬,০০০ সহায়তা।',
      pa: 'pmkisan.gov.in ਜਾਂ ਨੇੜਲੇ CSC ਵਿਖੇ ਜ਼ਮੀਨ ਦੇ ਰਿਕਾਰਡ ਅਤੇ ਆਧਾਰ ਨਾਲ ਰਜਿਸਟਰ ਕਰੋ। ₹6,000 ਸਲਾਨਾ ਸਹਾਇਤਾ।',
    }
    return { name: names[lang] || rawName, guide: guides[lang] || rawGuide }
  }

  if (sLower.includes('pmay') || sLower.includes('awas') || sLower.includes('housing')) {
    const names = {
      hi: 'पीएम आवास योजना (PMAY)',
      mr: 'पीएम आवास योजना (PMAY)',
      bn: 'পিএম আবাস যোজনা (PMAY)',
      pa: 'ਪੀਐਮ ਆਵਾਸ ਯੋਜਨਾ (PMAY)',
    }
    const guides = {
      hi: 'pmaymis.gov.in या नजदीकी बैंक/सीएससी पर आवेदन करें। पहली बार पक्के घर के निर्माण हेतु सब्सिडी।',
      mr: 'pmaymis.gov.in किंवा बँकेत अर्ज करा. पहिल्यांदा पक्के घर बांधण्यासाठी आर्थिक अनुदान.',
      bn: 'pmaymis.gov.in বা নিকটস্থ ব্যাঙ্কে আবেদন করুন। প্রথমবার বাড়ি তৈরির জন্য সরকারি অনুদান।',
      pa: 'pmaymis.gov.in ਜਾਂ ਨਜ਼ਦੀਕੀ ਬੈਂਕ ਵਿੱਚ ਅਰਜ਼ੀ ਦਿਓ। ਪੱਕੇ ਮਕਾਨ ਲਈ ਸਰਕਾਰੀ ਸਬਸਿਡੀ।',
    }
    return { name: names[lang] || rawName, guide: guides[lang] || rawGuide }
  }

  if (sLower.includes('atal') || sLower.includes('apy') || sLower.includes('pension')) {
    const names = {
      hi: 'अटल पेंशन योजना (APY)',
      mr: 'अटल पेन्शन योजना (APY)',
      bn: 'অটল পেনশন যোজনা (APY)',
      pa: 'ਅਟਲ ਪੈਨਸ਼ਨ ਯੋਜਨਾ (APY)',
    }
    const guides = {
      hi: 'अपनी बैंक शाखा से संपर्क करें। 60 वर्ष की आयु के बाद ₹1,000 से ₹5,000 मासिक गारंटीड पेंशन।',
      mr: 'आपल्या बँक शाखेशी संपर्क साधा. वयाच्या ६० वर्षानंतर दरमहा ₹१,००० ते ₹५,००० हमी पेन्शन.',
      bn: 'ব্যাঙ্ক শাখায় যোগাযোগ করুন। ৬০ বছর বয়সের পর মাসিক ₹১,০০০ থেকে ₹৫,০০০ নিশ্চিত পেনশন।',
      pa: 'ਆਪਣੀ ਬੈਂਕ ਸ਼ਾਖਾ ਨਾਲ ਸੰਪਰਕ ਕਰੋ। 60 ਸਾਲ ਦੀ ਉਮਰ ਤੋਂ ਬਾਅਦ ₹1,000 ਤੋਂ ₹5,000 ਮਹੀਨਾਵਾਰ ਪੈਨਸ਼ਨ।',
    }
    return { name: names[lang] || rawName, guide: guides[lang] || rawGuide }
  }

  return { name: rawName, guide: rawGuide }
}

/**
 * Returns localized coach action item
 */
export function getLocalizedAction(item, lang = 'en') {
  if (!item) return { task: '', deadline: '' }
  const rawTask = item.task || ''
  const rawDeadline = item.deadline || ''

  if (lang === 'en') {
    return { task: rawTask, deadline: rawDeadline }
  }

  // Localize deadlines
  const dLower = rawDeadline.toLowerCase()
  let localizedDeadline = rawDeadline
  if (dLower.includes('today')) {
    localizedDeadline = { hi: 'आज ही', mr: 'आजच', bn: 'আজই', pa: 'ਅੱਜ ਹੀ' }[lang] || rawDeadline
  } else if (dLower.includes('this week')) {
    localizedDeadline = { hi: 'इस सप्ताह', mr: 'या आठवड्यात', bn: 'এই সপ্তাহে', pa: 'ਇਸ ਹਫ਼ਤੇ' }[lang] || rawDeadline
  } else if (dLower.includes('3 days') || dLower.includes('3 d')) {
    localizedDeadline = { hi: '3 दिनों के भीतर', mr: '३ दिवसांत', bn: '৩ দিনের মধ্যে', pa: '3 ਦਿਨਾਂ ਦੇ ਅੰਦਰ' }[lang] || rawDeadline
  } else if (dLower.includes('7 days') || dLower.includes('7 d')) {
    localizedDeadline = { hi: '7 दिनों के भीतर', mr: '७ दिवसांत', bn: '৭ দিনের মধ্যে', pa: '7 ਦਿਨਾਂ ਦੇ ਅੰਦਰ' }[lang] || rawDeadline
  } else if (dLower.includes('14 days')) {
    localizedDeadline = { hi: '14 दिनों के भीतर', mr: '१४ दिवसांत', bn: '১৪ দিনের মধ্যে', pa: '14 ਦਿਨਾਂ ਦੇ ਅੰਦਰ' }[lang] || rawDeadline
  } else if (dLower.includes('30 days')) {
    localizedDeadline = { hi: '30 दिनों के भीतर', mr: '३० दिवसांत', bn: '৩০ দিনের মধ্যে', pa: '30 ਦਿਨਾਂ ਦੇ ਅੰਦਰ' }[lang] || rawDeadline
  }

  // If already in target Indian script, keep it
  if (detectScriptLanguage(rawTask) === lang) {
    return { task: rawTask, deadline: localizedDeadline }
  }

  const tLower = rawTask.toLowerCase()
  let localizedTask = rawTask

  if (tLower.includes('suraksha') || tLower.includes('pmsby')) {
    localizedTask = {
      hi: 'बैंक ऐप या यूपीआई से पीएम सुरक्षा बीमा योजना (PMSBY) में दुर्घटना कवर हेतु नामांकन करें',
      mr: 'बँक ॲप किंवा यूपीआयद्वारे पीएम सुरक्षा विमा योजना (PMSBY) अपघात विम्यासाठी नावनोंदणी करा',
      bn: 'ব্যাঙ্ক অ্যাপ বা ইউপিআই দিয়ে পিএম সুরক্ষা বীমা যোজনায় (PMSBY) দুর্ঘটনা কভারেজের জন্য নথিভুক্ত করুন',
      pa: 'ਬੈਂਕ ਐਪ ਜਾਂ ਯੂਪੀਆਈ ਰਾਹੀਂ ਪੀਐਮ ਸੁਰੱਖਿਆ ਬੀਮਾ ਯੋਜਨਾ (PMSBY) ਵਿੱਚ ਹਾਦਸਾ ਕਵਰ ਲਈ ਸ਼ਾਮਲ ਹੋਵੋ',
    }[lang] || rawTask
  } else if (tLower.includes('jeevan jyoti') || tLower.includes('pmjjby')) {
    localizedTask = {
      hi: 'पीएम जीवन ज्योति बीमा योजना (PMJJBY) के तहत ₹2 लाख के जीवन बीमा के लिए नामांकन करें',
      mr: 'पीएम जीवन ज्योती विमा योजना (PMJJBY) अंतर्गत मुदत जीवन विम्यासाठी नावनोंदणी करा',
      bn: 'পিএম জীবন জ্যোতি বীমা যোজনার (PMJJBY) অধীনে টার্ম লাইফ ইন্স্যুরেন্সের জন্য নাম নথিভুক্ত করুন',
      pa: 'ਪੀਐਮ ਜੀਵਨ ਜਯੋਤੀ ਬੀਮਾ ਯੋਜਨਾ (PMJJBY) ਤਹਿਤ ਟਰਮ ਲਾਈਫ ਬੀਮੇ ਲਈ ਨਾਮ ਦਰਜ ਕਰਵਾਓ',
    }[lang] || rawTask
  } else if (tLower.includes('auto-debit') || tLower.includes('emergency fund') || tLower.includes('save ₹')) {
    localizedTask = {
      hi: 'आपातकालीन फंड खाते में मासिक अधिशेष से नियमित बचत हेतु ऑटो-डेबिट सेट करें',
      mr: 'आपत्कालीन निधी खात्यात दररोज/दरमहा नियमित बचतीसाठी ऑटो-डेबिट सुरू करा',
      bn: 'জরুরি তহবিল গঠনের জন্য সঞ্চয়ী অ্যাকাউন্ট থেকে নিয়মিত অটো-ডেবিট সেট করুন',
      pa: 'ਐਮਰਜੈਂਸੀ ਫੰਡ ਖਾਤੇ ਵਿੱਚ ਨਿਯਮਿਤ ਬਚਤ ਲਈ ਆਟੋ-ਡੈਬਿਟ ਸੈੱਟ ਕਰੋ',
    }[lang] || rawTask
  } else if (tLower.includes('subscription') || tLower.includes('cancel')) {
    localizedTask = {
      hi: 'अनावश्यक सब्सक्रिप्शन और फिजूल खर्चों की समीक्षा कर बचत में अतिरिक्त वृद्धि करें',
      mr: 'न वापरलेले वर्गणी/खर्च तपासून आपत्कालीन निधीसाठी अतिरिक्त बचत मोकळी करा',
      bn: 'অপ্রয়োজনীয় সাবস্ক্রিপশন বাতিল করে জরুরি তহবিলের জন্য বাড়তি টাকা বাঁচান',
      pa: 'ਬੇਲੋੜੇ ਖਰਚਿਆਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ ਅਤੇ ਐਮਰਜੈਂਸੀ ਫੰਡ ਲਈ ਵਾਧੂ ਰਕਮ ਬਚਾਓ',
    }[lang] || rawTask
  } else if (tLower.includes('loan') || tLower.includes('debt') || tLower.includes('interest')) {
    localizedTask = {
      hi: 'मौजूदा कर्ज और ब्याज दरों की समीक्षा कर उच्च ब्याज वाले ऋण को प्राथमिकता से चुकाएं',
      mr: 'सर्व कर्जे आणि व्याजदरांचे पुनरावलोकन करून जास्त व्याजाचे कर्ज आधी फेडा',
      bn: 'বর্তমান ঋণ ও সুদের হার পর্যালোচনা করে উচ্চ সুদের ঋণ আগে পরিশোধ করুন',
      pa: 'ਮੌਜੂਦਾ ਕਰਜ਼ਿਆਂ ਅਤੇ ਵਿਆਜ ਦਰਾਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ ਅਤੇ ਸਭ ਤੋਂ ਵੱਧ ਵਿਆਜ ਵਾਲੇ ਕਰਜ਼ੇ ਨੂੰ ਪਹਿਲਾਂ ਚੁਕਾਓ',
    }[lang] || rawTask
  }

  return { task: localizedTask, deadline: localizedDeadline }
}

/**
 * Returns localized goal display title
 */
export function getLocalizedGoalTitle(title = '', lang = 'en') {
  if (lang === 'en') return title
  const tLower = title.toLowerCase()

  if (tLower.includes('emergency')) {
    return {
      hi: 'आपातकालीन कोष (Emergency Fund)',
      mr: 'आणीबाणी निधी (Emergency Fund)',
      bn: 'জরুরি তহবিল (Emergency Fund)',
      pa: 'ਐਮਰਜੈਂਸੀ ਫੰਡ (Emergency Fund)',
    }[lang] || title
  }
  if (tLower.includes('accident') || tLower.includes('pmsby')) {
    return {
      hi: 'दुर्घटना बीमा (PMSBY)',
      mr: 'अपघात विमा (PMSBY)',
      bn: 'দুর্ঘটনা বীমা (PMSBY)',
      pa: 'ਹਾਦਸਾ ਬੀਮਾ (PMSBY)',
    }[lang] || title
  }
  if (tLower.includes('life') || tLower.includes('pmjjby')) {
    return {
      hi: 'जीवन बीमा (PMJJBY)',
      mr: 'जीवन विमा (PMJJBY)',
      bn: 'জীবন বীমা (PMJJBY)',
      pa: 'ਜੀਵਨ ਬੀਮਾ (PMJJBY)',
    }[lang] || title
  }
  if (tLower.includes('home') || tLower.includes('house')) {
    return {
      hi: 'घर खरीदना या निर्माण',
      mr: 'घर खरेदी किंवा बांधकाम',
      bn: 'বাড়ি কেনা বা তৈরি',
      pa: 'ਘਰ ਖਰੀਦਣਾ ਜਾਂ ਬਣਾਉਣਾ',
    }[lang] || title
  }
  if (tLower.includes('vehicle') || tLower.includes('car') || tLower.includes('bike')) {
    return {
      hi: 'वाहन खरीद',
      mr: 'वाहन खरेदी',
      bn: 'গাড়ি কেনা',
      pa: 'ਵਾਹਨ ਖਰੀਦਣਾ',
    }[lang] || title
  }
  if (tLower.includes('education')) {
    return {
      hi: 'बच्चों की उच्च शिक्षा',
      mr: 'मुलांचे उच्च शिक्षण',
      bn: 'সন্তানদের উচ্চশিক্ষা',
      pa: 'ਬੱਚਿਆਂ ਦੀ ਉੱਚ ਸਿੱਖਿਆ',
    }[lang] || title
  }
  if (tLower.includes('retirement') || tLower.includes('nps') || tLower.includes('ppf')) {
    return {
      hi: 'सेवानिवृत्ति सुरक्षा (PPF/NPS)',
      mr: 'निवृत्ती नियोजन (PPF/NPS)',
      bn: 'অবসর পরিকল্পনা (PPF/NPS)',
      pa: 'ਰਿਟਾਇਰਮੈਂਟ ਸੁਰੱਖਿਆ (PPF/NPS)',
    }[lang] || title
  }

  return title
}

/**
 * Returns localized decision card (explainability)
 */
export function getLocalizedDecisionCard(card, lang = 'en') {
  if (!card) return { action: '', why: '', if_ignored: '' }
  const rawAction = card.action || ''
  const rawWhy = card.why || ''
  const rawIgnored = card.if_ignored || ''

  if (lang === 'en') {
    return { action: rawAction, why: rawWhy, if_ignored: rawIgnored }
  }

  // If already in target script, keep it
  if (detectScriptLanguage(rawAction) === lang) {
    return { action: rawAction, why: rawWhy, if_ignored: rawIgnored }
  }

  const aLower = rawAction.toLowerCase()
  if (aLower.includes('suraksha') || aLower.includes('pmjjby') || aLower.includes('insurance') || aLower.includes('bima')) {
    return {
      action: {
        hi: 'पीएम सुरक्षा बीमा योजना (PMSBY) और पीएम जीवन ज्योति बीमा योजना (PMJJBY) में नामांकन करें',
        mr: 'पीएम सुरक्षा विमा योजना (PMSBY) आणि जीवन ज्योती विमा योजना (PMJJBY) मध्ये नोंदणी करा',
        bn: 'পিএম সুরক্ষা বীমা যোজনা (PMSBY) এবং পিএম জীবন জ্যোতি বীমা যোজনায় (PMJJBY) নাম নথিভুক্ত করুন',
        pa: 'ਪੀਐਮ ਸੁਰੱਖਿਆ ਬੀਮਾ ਯੋਜਨਾ (PMSBY) ਅਤੇ ਪੀਐਮ ਜੀਵਨ ਜਯੋਤੀ ਬੀਮਾ ਯੋਜਨਾ (PMJJBY) ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਵੋ',
      }[lang] || rawAction,
      why: {
        hi: 'ये कम लागत वाली सरकारी योजनाएं दुर्घटना या असमय मृत्यु की स्थिति में आपके परिवार के वित्तीय भविष्य को मजबूत सुरक्षा प्रदान करती हैं।',
        mr: 'या कमी खर्चाच्या सरकारी योजना अपघातात किंवा संकटसमयी आपल्या कुटुंबाला आवश्यक जीवन आणि अपघात संरक्षण देतात.',
        bn: 'এই স্বল্প খরচের সরকারি প্রকল্পগুলি দুর্ঘটনা বা অপ্রত্যাশিত বিপদে পরিবারের আর্থিক ভবিষ্যৎ নিশ্চিত করে।',
        pa: 'ਇਹ ਘੱਟ ਲਾਗਤ ਵਾਲੀਆਂ ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਹਾਦਸੇ ਜਾਂ ਅਣਕਿਆਸੀ ਮੌਤ ਦੀ ਸਥਿਤੀ ਵਿੱਚ ਤੁਹਾਡੇ ਪਰਿਵਾਰ ਨੂੰ ਜ਼ਰੂਰੀ ਸੁਰੱਖਿਆ ਪ੍ਰਦਾਨ ਕਰਦੀਆਂ ਹਨ।',
      }[lang] || rawWhy,
      if_ignored: {
        hi: 'बिना बीमा अप्रत्याशित संकट आने पर परिवार को भारी आर्थिक आघात झेलना पड़ सकता है।',
        mr: 'विमा नसल्यास संकटकाळात कुटुंबावर अचानक मोठा आर्थिक ताण येऊ शकतो.',
        bn: 'বীমা সুরক্ষা না থাকলে আকস্মিক বিপদে পরিবার বড় ধরনের আর্থিক সংকটে পড়তে পারে।',
        pa: 'ਬੀਮਾ ਸੁਰੱਖਿਆ ਤੋਂ ਬਿਨਾਂ ਅਣਚਾਹੇ ਸੰਕਟ ਵੇਲੇ ਪਰਿਵਾਰ ਨੂੰ ਭਾਰੀ ਆਰਥਿਕ ਧੱਕਾ ਲੱਗ ਸਕਦਾ ਹੈ।',
      }[lang] || rawIgnored,
    }
  }

  if (aLower.includes('emergency') || aLower.includes('surplus') || aLower.includes('saving')) {
    return {
      action: {
        hi: 'आपातकालीन फंड को और मजबूत करने के लिए मासिक अधिशेष की नियमित बचत जारी रखें',
        mr: 'आपत्कालीन निधी अधिक मजबूत करण्यासाठी मासिक शिलकीची नियमित बचत सुरू ठेवा',
        bn: 'জরুরি তহবিল আরও শক্তিশালী করতে মাসিক উদ্বৃত্ত অর্থ নিয়মিত সঞ্চয় করতে থাকুন',
        pa: 'ਐਮਰਜੈਂਸੀ ਫੰਡ ਨੂੰ ਹੋਰ ਮਜ਼ਬੂਤ ਕਰਨ ਲਈ ਮਹੀਨਾਵਾਰ ਬਚਤ ਲਗਾਤਾਰ ਜਾਰੀ ਰੱਖੋ',
      }[lang] || rawAction,
      why: {
        hi: 'पर्याप्त आपातकालीन कोष आपको अप्रत्याशित खर्चों के समय मुख्य बचत तोड़ने या नया कर्ज लेने से बचाता है।',
        mr: 'पुरेसा आपत्कालीन निधी अनपेक्षित खर्चाच्या वेळी मुख्य बचतीला धक्का न लावता किंवा कर्ज न घेता संरक्षण देतो.',
        bn: 'পর্যাপ্ত জরুরি তহবিল অপ্রত্যাশিত খরচের সময় মূল সঞ্চয় না ভেঙে আর্থিক স্থিতিশীলতা বজায় রাখতে সাহায্য করে।',
        pa: 'ਢੁਕਵਾਂ ਐਮਰਜੈਂਸੀ ਫੰਡ ਅਣਕਿਆਸੇ ਖਰਚਿਆਂ ਵੇਲੇ ਕਰਜ਼ਾ ਲੈਣ ਤੋਂ ਬਚਾਉਂਦਾ ਹੈ।',
      }[lang] || rawWhy,
      if_ignored: {
        hi: 'अनियोजित खर्च आने पर आपको उच्च ब्याज वाला नया कर्ज लेना पड़ सकता है।',
        mr: 'अचानक खर्चाच्या वेळी नवीन जास्त व्याजाचे कर्ज घ्यावे लागू शकते.',
        bn: 'জরুরি খরচের কারণে উচ্চ সুদে নতুন ঋণ নিতে হতে পারে।',
        pa: "ਅਣਕਿਆਸੇ ਖਰਚੇ ਆਉਣ 'ਤੇ ਉੱਚ ਵਿਆਜ ਵਾਲਾ ਨਵਾਂ ਕਰਜ਼ਾ ਲੈਣਾ ਪੈ ਸਕਦਾ ਹੈ।",
      }[lang] || rawIgnored,
    }
  }

  if (aLower.includes('debt') || aLower.includes('emi') || aLower.includes('loan')) {
    return {
      action: {
        hi: 'अपने मौजूदा कर्ज की नियमित समीक्षा करें ताकि ब्याज लागत न्यूनतम रहे',
        mr: 'आपल्या चालू कर्जांचे पुनरावलोकन करा जेणेकरून व्याजाचा खर्च कमी राहील',
        bn: 'আপনার বর্তমান ঋণ নিয়মিত পর্যালোচনা করুন যাতে সুদের বোঝা নিয়ন্ত্রণে থাকে',
        pa: 'ਆਪਣੇ ਮੌਜੂਦਾ ਕਰਜ਼ਿਆਂ ਦੀ ਨਿਯਮਿਤ ਸਮੀਖਿਆ ਕਰੋ ਤਾਂ ਜੋ ਵਿਆਜ ਘੱਟ ਤੋਂ ਘੱਟ ਰਹੇ',
      }[lang] || rawAction,
      why: {
        hi: 'कम ऋण-से-आय (DTI) अनुपात बनाए रखने से आपका क्रेडिट स्कोर उत्तम रहता है और जोखिम कम होता है।',
        mr: 'कमी DTI प्रमाण राखल्याने तुमचा आर्थिक आरोग्य स्कोर चांगला राहतो आणि जोखीम नियंत्रणात राहते.',
        bn: 'কম DTI অনুপাত বজায় রাখলে আর্থিক স্বাস্থ্য স্কোর ভালো থাকে এবং ঝুঁকি নিয়ন্ত্রণে থাকে।',
        pa: 'ਘੱਟ DTI ਅਨੁਪਾਤ ਬਣਾਈ ਰੱਖਣ ਨਾਲ ਤੁਹਾਡਾ ਵਿੱਤੀ ਸਕੋਰ ਵਧੀਆ ਰਹਿੰਦਾ ਹੈ।',
      }[lang] || rawWhy,
      if_ignored: {
        hi: 'कर्ज प्रबंधन पर ध्यान न देने से ब्याज का बोझ बढ़ सकता है।',
        mr: 'कर्ज व्यवस्थापनाकडे दुर्लक्ष केल्यास व्याजाचा बोजा वाढू शकतो.',
        bn: 'ঋণ ব্যবস্থাপনায় অবহেলা করলে সুদের বোঝা বাড়তে পারে।',
        pa: 'ਕਰਜ਼ ਪ੍ਰਬੰਧਨ ਵੱਲ ਧਿਆਨ ਨਾ ਦੇਣ ਨਾਲ ਵਿਆਜ ਦਾ ਬੋਝ ਵਧ ਸਕਦਾ ਹੈ।',
      }[lang] || rawIgnored,
    }
  }

  return { action: rawAction, why: rawWhy, if_ignored: rawIgnored }
}

