import { createMockAnalysis } from '../mocks/analysisResponse'
import { detectScriptLanguage } from '../utils/i18n'

function formatUrl(url) {
  if (!url || url === 'undefined' || url === 'null') return ''
  const trimmed = url.trim().replace(/\/$/, '')
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`
  }
  return trimmed
}

const isBrowser = typeof window !== 'undefined'
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const isHttps = isBrowser && window.location.protocol === 'https:'

const ENV_API_BASE = formatUrl(import.meta.env.VITE_API_BASE_URL)
const ENV_SERVER_BASE = formatUrl(import.meta.env.VITE_SERVER_BASE_URL)

// Automatically use the live Render agents service if on production without custom env var
const PRODUCTION_AGENT_API = 'https://finmate-agents.onrender.com'
const DEFAULT_API_BASE = ENV_API_BASE || (isLocalhost ? 'http://localhost:8000' : PRODUCTION_AGENT_API)
const DEFAULT_SERVER_BASE = ENV_SERVER_BASE || (isLocalhost ? 'http://localhost:3001' : 'https://finmate-server.onrender.com')

// When running on HTTPS, never call insecure http:// to prevent browser mixed content blocks
const AGENT_API_CANDIDATES = Array.from(
  new Set(
    [
      DEFAULT_API_BASE,
      PRODUCTION_AGENT_API,
      isLocalhost ? 'http://127.0.0.1:8000' : null,
      '/api/agents',
      isLocalhost ? 'http://localhost:3001/api/agents' : null,
      isLocalhost ? 'http://127.0.0.1:3001/api/agents' : null,
    ].filter((url) => Boolean(url) && (!isHttps || url.startsWith('https://') || url.startsWith('/')))
  )
)

const VOICE_SERVER_CANDIDATES = Array.from(
  new Set(
    [
      DEFAULT_SERVER_BASE,
      isLocalhost ? 'http://127.0.0.1:3001' : null,
      '/api/voice',
    ].filter((url) => Boolean(url) && (!isHttps || url.startsWith('https://') || url.startsWith('/')))
  )
)

/**
 * Check if mock mode is currently enabled.
 * Defaults to VITE_USE_MOCK setting (if 'false', defaults to live mode).
 * Allows user override saved in localStorage.
 */
export function isMockMode() {
  const stored = localStorage.getItem('finmate_mock_mode')
  if (stored !== null) return stored === 'true'
  return import.meta.env.VITE_USE_MOCK === 'true'
}

export function setMockMode(enabled) {
  localStorage.setItem('finmate_mock_mode', String(Boolean(enabled)))
}

/**
 * Checks whether the Python FastAPI backend is online and responding.
 */
export async function checkBackendStatus() {
  for (const base of AGENT_API_CANDIDATES) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
      const res = await fetch(`${base}/`, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        return {
          online: true,
          url: base,
          service: data.service || 'FinMate Agent API',
        }
      }
    } catch {
      // try next candidate
    }
  }
  return { online: false, url: DEFAULT_API_BASE, service: null }
}

/**
 * Checks whether the Express voice server is reachable.
 * A missing ElevenLabs key still counts as online; `configured` reports credentials.
 */
export async function checkVoiceStatus() {
  for (const base of VOICE_SERVER_CANDIDATES) {
    try {
      const url = base === '/api/voice' ? '/api/voice/health' : `${base}/api/voice/health`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!res.ok) continue
      const data = await res.json().catch(() => ({}))
      return {
        online: true,
        configured: Boolean(data.configured),
        url: base,
      }
    } catch {
      // try next candidate
    }
  }
  return { online: false, configured: false, url: DEFAULT_SERVER_BASE }
}

/**
 * Calls FastAPI POST /analyze or returns mock data based on mock mode.
 */
export async function analyzeProfile(profile, options = {}) {
  const useMock = options.forceMock ?? isMockMode()

  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 850))
    return createMockAnalysis(profile)
  }

  let lastNetworkError = null

  for (const base of AGENT_API_CANDIDATES) {
    try {
      const url = base.endsWith('/') ? `${base}analyze` : `${base}/analyze`
      const controller = new AbortController()
      // Agent graph runs LangGraph and vector search, allow up to 45s
      const timeoutId = setTimeout(() => controller.abort(), 45000)

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        let detailMsg = `Analysis failed (${response.status})`
        try {
          const errorData = await response.json()
          if (Array.isArray(errorData.detail)) {
            detailMsg = errorData.detail
              .map((d) => {
                const loc = Array.isArray(d.loc)
                  ? d.loc.filter((part) => part !== 'body').join('.')
                  : ''
                return `${loc ? loc + ': ' : ''}${d.msg}`
              })
              .join('; ')
          } else if (typeof errorData.detail === 'string') {
            detailMsg = errorData.detail
          } else if (errorData.message) {
            detailMsg = errorData.message
          }
        } catch {
          const raw = await response.text().catch(() => '')
          if (raw) detailMsg = `Server error (${response.status}): ${raw}`
        }
        throw new Error(detailMsg)
      }

      return await response.json()
    } catch (err) {
      // If it's a validation error or server response error (not a fetch network failure), rethrow immediately
      const isNetworkError =
        err.name === 'AbortError' ||
        err.name === 'TypeError' ||
        err.name === 'SyntaxError' ||
        err.name === 'SecurityError' ||
        err.message?.includes('pattern') ||
        err.message?.includes('fetch') ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('Failed to fetch')

      if (!isNetworkError) {
        throw err
      }

      lastNetworkError = err
      // Otherwise, loop to try the next candidate host
    }
  }

  throw new Error(
    `Cannot connect to FastAPI backend at ${DEFAULT_API_BASE} or 127.0.0.1:8000. ` +
      `Ensure the Python agent service is running (cd backend/agents && uvicorn main:app --port 8000). ` +
      `You can also switch to Demo Mode to explore with mock data.`
  )
}

/**
 * Obtains an ElevenLabs signed WebSocket URL from the Express backend.
 */
export async function getVoiceToken() {
  let lastError = null

  for (const base of VOICE_SERVER_CANDIDATES) {
    try {
      const url = base === '/api/voice' ? '/api/voice/token' : `${base}/api/voice/token`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)

      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.signed_url) {
        throw new Error(body.error || body.details || `Voice service responded with status ${response.status}`)
      }
      return body.signed_url
    } catch (err) {
      lastError = err
      const isNetworkError =
        err.name === 'AbortError' ||
        err.name === 'TypeError' ||
        err.message?.includes('fetch')

      if (!isNetworkError) {
        throw err
      }
    }
  }

  throw new Error(
    lastError?.message ||
      `Voice server unreachable. Ensure the Express server is running on port 3001 (npm run dev in backend/server).`
  )
}

/**
 * Client-side intelligent financial advisor fallback
 * Grounded in the user's specific financial profile and computed analysis.
 * Supports Marathi (mr), Hindi (hi), Bengali (bn), Punjabi (pa), and English (en).
 */
function clientSynthesizeChat(question, profile = {}, analysis = {}, language = 'en') {
  const q = (question || '').toLowerCase()
  const targetLang = detectScriptLanguage(question) || language || 'en'
  const m = analysis.financialMetrics || {}
  const income = Number(profile.monthlyIncome || 0)
  const expenses = Number(profile.monthlyExpenses || 0)
  const emi = Number(profile.monthlyEmi || 0)
  const surplus = m.monthly_surplus != null ? Number(m.monthly_surplus) : income - expenses - emi
  const savings = Number(profile.existingSavings || m.savings || 0)
  const debt = Number(profile.existingDebt || m.total_debt || 0)
  const dti = m.dti_ratio != null ? Number(m.dti_ratio) : (income > 0 ? emi / income : 0)
  const runway = m.emergency_months != null ? Number(m.emergency_months) : (expenses > 0 ? savings / expenses : 0)
  const riskScore = analysis.riskScore ?? 'unknown'
  const riskCat = (analysis.riskCategory || 'unknown').toUpperCase()
  const schemes = analysis.eligibleSchemes || []
  const sims = analysis.simulationPaths || {}

  const inr = (v) =>
    v == null || isNaN(v) ? 'Not available' : '₹' + Math.round(Number(v)).toLocaleString('en-IN')

  const safeEmi = Math.round(surplus * 0.4)

  // Multilingual Marathi responses
  if (targetLang === 'mr') {
    if (/afford|buy|car|house|loan|purchase|emi|गाडी|कार|घर|कर्ज|खरेदी|हप्ता/.test(q)) {
      if (surplus > 0) {
        return (
          `तुमच्या प्रत्यक्ष आर्थिक आकडेवारीवर आधारित:\n\n` +
          `• **मासिक उत्पन्न**: ${inr(income)}\n` +
          `• **मासिक घरखर्च**: ${inr(expenses)}/महिना\n` +
          `• **सध्याचे हप्ते (EMI)**: ${inr(emi)}/महिना (DTI: ${(dti * 100).toFixed(1)}%)\n` +
          `• **निव्वळ मासिक शिल्लक**: **${inr(surplus)}/महिना**\n\n` +
          `✅ **सल्ला**: तुमच्या **${inr(surplus)}** मासिक शिलकीमुळे तुमची आर्थिक स्थिती स्थिर आहे. ` +
          `तुम्ही जास्तीत जास्त **${inr(safeEmi)}/महिना** (शिलकीच्या ४०%) पर्यंतचा नवीन हप्ता सुरक्षितपणे भरू शकता, जेणेकरून भविष्यातील बचतीसाठी शिल्लक राहील.\n\n` +
          (runway < 6
            ? `⚠️ *आपत्कालीन निधी इशारा*: सध्याची बचत ${inr(savings)} ही ${runway.toFixed(1)} महिन्यांचा खर्च भागवू शकते. नवीन खर्चापूर्वी ६ महिन्यांचा आपत्कालीन निधी (${inr(expenses * 6)}) सुरक्षित ठेवा.`
            : `🎉 *सुरक्षित राखीव निधी*: तुमचा आपत्कालीन निधी भक्कम आहे (${runway.toFixed(1)} महिने - ${inr(savings)}).`)
        )
      } else {
        return `⚠️ **खबरदारी**: तुमची सध्याची मासिक शिल्लक ${inr(surplus)} आहे. आत्ता कोणतेही नवीन कर्ज किंवा हप्ता घेणे आर्थिक संकटाचे ठरेल. प्रथम अनावश्यक खर्च कमी करा.`
      }
    }
    if (/invest|surplus|sip|save|गुंतवणूक|बचत|फंड|शेअर/.test(q)) {
      const tier1 = Math.round(surplus * 0.2)
      const tier2 = Math.round(surplus * 0.3)
      const tier3 = Math.round(surplus * 0.5)
      return (
        `तुमच्या **${inr(surplus)}** मासिक शिलकीसाठी योग्य गुंतवणूक योजना:\n\n` +
        `1. **आपत्कालीन निधी (२०% ≈ ${inr(tier1)}/महिना)**: ६ महिन्यांचा घरखर्च (${inr(expenses * 6)}) होईपर्यंत सुरक्षित बँक खात्यात ठेवा.\n` +
        `2. **हमी परतावा (३०% ≈ ${inr(tier2)}/महिना)**: पीपीएफ (PPF) किंवा पोस्ट ऑफिस रिकरिंग डिपॉझिटमध्ये सुरक्षित वाढ.\n` +
        `3. **दीर्घकालीन संपत्ती (५०% ≈ ${inr(tier3)}/महिना)**: निफ्टी ५० किंवा लार्ज-कॅप इंडेक्स फंडामध्ये SIP.`
      )
    }
    return (
      `तुमचा आर्थिक सारांश:\n\n` +
      `• मासिक उत्पन्न: ${inr(income)} | मासिक खर्च: ${inr(expenses)}\n` +
      `• निव्वळ मासिक शिल्लक: **${inr(surplus)}/महिना**\n` +
      `• आपत्कालीन निधी: **${runway.toFixed(1)} महिने** (${inr(savings)})\n` +
      `• आर्थिक आरोग्य स्कोअर: **${riskScore}/100** (${riskCat})\n` +
      `• एकूण कर्ज: ${inr(debt)} (DTI: ${(dti * 100).toFixed(1)}%)\n\n` +
      `तुम्ही मला नवीन गाडी, घर, कर्ज किंवा बचतीविषयी कोणताही प्रश्न विचारू शकता!`
    )
  }

  // Multilingual Hindi responses
  if (targetLang === 'hi') {
    if (/afford|buy|car|house|loan|purchase|emi|गाड़ी|कार|घर|कर्ज|खरीद|लोन|किस्त/.test(q)) {
      if (surplus > 0) {
        return (
          `आपके वास्तविक वित्तीय आंकड़ों के अनुसार:\n\n` +
          `• **मासिक आय**: ${inr(income)}\n` +
          `• **मासिक खर्च**: ${inr(expenses)}/माह\n` +
          `• **वर्तमान EMI**: ${inr(emi)}/माह (DTI: ${(dti * 100).toFixed(1)}%)\n` +
          `• **शुद्ध मासिक अधिशेष (सरप्लस)**: **${inr(surplus)}/माह**\n\n` +
          `✅ **सटीक सलाह**: आपके **${inr(surplus)}** के मासिक सरप्लस के साथ, आप अधिकतम **${inr(safeEmi)}/माह** (सरप्लस का 40%) तक की नई EMI सुरक्षित रूप से वहन कर सकते हैं।\n\n` +
          (runway < 6
            ? `⚠️ *इमरजेंसी फंड सतर्कता*: आपकी वर्तमान बचत ${inr(savings)} लगभग ${runway.toFixed(1)} महीने के खर्च के बराबर है। डाउन पेमेंट से पहले 6 महीने का बफर (${inr(expenses * 6)}) सुरक्षित करें।`
            : `🎉 *मजबूत सुरक्षा कवच*: आपका आपातकालीन फंड पर्याप्त है (${runway.toFixed(1)} महीने - ${inr(savings)})।`)
        )
      } else {
        return `⚠️ **सावधानी**: आपका वर्तमान मासिक सरप्लस ${inr(surplus)} है। अभी कोई नया कर्ज लेना बजट पर भारी दबाव डालेगा।`
      }
    }
    if (/invest|surplus|sip|save|निवेश|बचत|फंड|म्यूचुअल/.test(q)) {
      const tier1 = Math.round(surplus * 0.2)
      const tier2 = Math.round(surplus * 0.3)
      const tier3 = Math.round(surplus * 0.5)
      return (
        `आपके **${inr(surplus)}** मासिक सरप्लस के लिए अनुशंसित निवेश रणनीति:\n\n` +
        `1. **तरलता व सुरक्षा (20% ≈ ${inr(tier1)}/माह)**: 6 महीने के इमरजेंसी फंड (${inr(expenses * 6)}) तक लिक्विड फंड में।\n` +
        `2. **सुरक्षित रिटर्न (30% ≈ ${inr(tier2)}/माह)**: PPF या बैंक आरडी में कर-मुक्त सुनिश्चित विकास।\n` +
        `3. **दीर्घकालिक धन निर्माण (50% ≈ ${inr(tier3)}/माह)**: निफ्टी 50 इंडेक्स फंड में नियमित SIP।`
      )
    }
    return (
      `आपकी वित्तीय प्रोफ़ाइल का त्वरित विवरण:\n\n` +
      `• आय: ${inr(income)}/माह | खर्च: ${inr(expenses)}/माह\n` +
      `• शुद्ध सरप्लस: **${inr(surplus)}/माह**\n` +
      `• इमरजेंसी बैकअप: **${runway.toFixed(1)} महीने** (${inr(savings)})\n` +
      `• वित्तीय स्वास्थ्य स्कोर: **${riskScore}/100** (${riskCat})\n` +
      `• कुल कर्ज: ${inr(debt)} (DTI: ${(dti * 100).toFixed(1)}%)\n\n` +
      `आप मुझसे कार लोन, घर, निवेश या सरकारी योजनाओं पर कोई भी प्रश्न पूछ सकते हैं!`
    )
  }

  // Multilingual Bengali responses
  if (targetLang === 'bn') {
    if (/afford|buy|car|house|loan|purchase|গাড়ি|বাড়ি|লোন|কেনা|কিস্তি/.test(q)) {
      if (surplus > 0) {
        return (
          `আপনার প্রকৃত আর্থিক তথ্য অনুসারে:\n\n` +
          `• **মাসিক আয়**: ${inr(income)}\n` +
          `• **মাসিক খরচ**: ${inr(expenses)}/মাস\n` +
          `• **বর্তমান কিস্তি (EMI)**: ${inr(emi)}/মাস (DTI: ${(dti * 100).toFixed(1)}%)\n` +
          `• **মাসিক অতিরিক্ত সঞ্চয়**: **${inr(surplus)}/মাস**\n\n` +
          `✅ **উপদেশ**: আপনার অতিরিক্ত সঞ্চয় বিবেচনায় আপনি নিরাপদে প্রতি মাসে সর্বোচ্চ **${inr(safeEmi)}** পর্যন্ত নতুন কিস্তি নিতে পারেন।`
        )
      }
      return `⚠️ **সতর্কতা**: বর্তমানে আপনার মাসিক অতিরিক্ত সাশ্রয় কম (${inr(surplus)})। নতুন ঋণ নেওয়া ঝুঁকিপূর্ণ হবে।`
    }
    return (
      `আপনার আর্থিক সারসংক্ষেপ:\n\n` +
      `• মাসিক আয়: ${inr(income)} | মাসিক খরচ: ${inr(expenses)}\n` +
      `• অতিরিক্ত সঞ্চয়: **${inr(surplus)}/মাস**\n` +
      `• জরুরি ব্যাকআপ: **${runway.toFixed(1)} মাস** (${inr(savings)})\n` +
      `• স্বাস্থ্য স্কোর: **${riskScore}/100** (${riskCat})`
    )
  }

  // Multilingual Punjabi responses
  if (targetLang === 'pa') {
    if (/afford|buy|car|house|loan|purchase|ਗੱਡੀ|ਕਾਰ|ਘਰ|ਕਰਜ਼ਾ|ਲੋਨ|ਕਿਸ਼ਤ/.test(q)) {
      if (surplus > 0) {
        return (
          `ਤੁਹਾਡੇ ਅਸਲ ਵਿੱਤੀ ਅੰਕੜਿਆਂ ਮੁਤਾਬਕ:\n\n` +
          `• **ਮਾਸਿਕ ਆਮਦਨ**: ${inr(income)}\n` +
          `• **ਮਾਸਿਕ ਖਰਚੇ**: ${inr(expenses)}/ਮਹੀਨਾ\n` +
          `• **ਮੌਜੂਦਾ ਕਿਸ਼ਤ (EMI)**: ${inr(emi)}/ਮਹੀਨਾ (DTI: ${(dti * 100).toFixed(1)}%)\n` +
          `• **ਵਾਧੂ ਬੱਚਤ (ਸਰਪਲੱਸ)**: **${inr(surplus)}/ਮਹੀਨਾ**\n\n` +
          `✅ **ਸਲਾਹ**: ਤੁਸੀਂ ਵੱਧ ਤੋਂ ਵੱਧ **${inr(safeEmi)}/ਮਹੀਨਾ** (ਬੱਚਤ ਦਾ 40%) ਤੱਕ ਦੀ ਨਵੀਂ ਕਿਸ਼ਤ ਆਸਾਨੀ ਨਾਲ ਚੁਕਾ ਸਕਦੇ ਹੋ।`
        )
      }
      return `⚠️ **ਸਾਵਧਾਨੀ**: ਮੌਜੂਦਾ ਸਮੇਂ ਤੁਹਾਡੀ ਮਹੀਨਾਵਾਰ ਬੱਚਤ ਘੱਟ ਹੈ (${inr(surplus)})। ਨਵਾਂ ਲੋਨ ਲੈਣ ਤੋਂ ਬਚੋ।`
    }
    return (
      `ਤੁਹਾਡੀ ਵਿੱਤੀ ਸਥਿਤੀ ਦਾ ਸੰਖੇਪ:\n\n` +
      `• ਆਮਦਨ: ${inr(income)}/ਮਹੀਨਾ | ਖਰਚੇ: ${inr(expenses)}/ਮਹੀਨਾ\n` +
      `• ਵਾਧੂ ਬੱਚਤ: **${inr(surplus)}/ਮਹੀਨਾ**\n` +
      `• ਐਮਰਜੈਂਸੀ ਫੰਡ: **${runway.toFixed(1)} ਮਹੀਨੇ** (${inr(savings)})\n` +
      `• ਸਿਹਤ ਸਕੋਰ: **${riskScore}/100** (${riskCat})`
    )
  }

  // English Response
  if (/afford|buy|car|house|loan|purchase|spend|emi|bike|phone|iphone|vacation|borrow/.test(q)) {
    if (surplus > 0) {
      return (
        `Based on your actual financial numbers:\n\n` +
        `• **Monthly Income**: ${inr(income)}\n` +
        `• **Current Living Costs**: ${inr(expenses)}/mo\n` +
        `• **Existing EMI Obligations**: ${inr(emi)}/mo (DTI: ${(dti * 100).toFixed(1)}%)\n` +
        `• **Net Monthly Surplus**: **${inr(surplus)}/month**\n\n` +
        `✅ **Verdict**: With your surplus of **${inr(surplus)}**, you have solid financial stability! ` +
        `You can safely afford a new monthly EMI of up to **${inr(safeEmi)}** (40% of surplus) while still retaining ${inr(surplus - safeEmi)}/month for savings and investments.\n\n` +
        (runway < 6
          ? `⚠️ *Emergency Buffer Caution*: Your current savings of ${inr(savings)} cover ${runway.toFixed(1)} months. Avoid dipping into this reserve for down payments until your 6-month buffer (${inr(expenses * 6)}) is protected.`
          : `🎉 *Safe Cushion*: Your emergency runway is strong at ${runway.toFixed(1)} months (${inr(savings)}).`)
      )
    } else {
      return (
        `⚠️ **Caution**: Your current monthly surplus is ${inr(surplus)}. Taking on any new loan or EMI right now would place severe strain on your finances. Focus on trimming non-essential costs or increasing income before making major commitments.`
      )
    }
  }

  if (/invest|surplus|mutual fund|sip|save|stocks|ppf|fd|allocation|portfolio|grow/.test(q)) {
    if (surplus > 0) {
      const tier1 = Math.round(surplus * 0.2)
      const tier2 = Math.round(surplus * 0.3)
      const tier3 = Math.round(surplus * 0.5)
      const optVal = sims.optimal?.projected_value

      return (
        `Here is an allocation strategy customized for your **${inr(surplus)} monthly surplus** and **${profile.riskAppetite || 'moderate'}** risk appetite:\n\n` +
        `1. **Liquidity & Safety (20% ≈ ${inr(tier1)}/mo)**: High-yield savings or liquid mutual funds until your emergency fund hits 6 months (${inr(expenses * 6)}).\n` +
        `2. **Guaranteed Compounding (30% ≈ ${inr(tier2)}/mo)**: Public Provident Fund (PPF) for guaranteed 7.1% tax-free returns under Section 80C, or APY/NPS.\n` +
        `3. **Long-Term Growth (50% ≈ ${inr(tier3)}/mo)**: Systematic Investment Plan (SIP) in low-cost Nifty 50 and Midcap Index Funds for inflation-beating wealth creation.\n\n` +
        (optVal
          ? `💡 *Trajectory*: Staying disciplined on this plan projects your modeled savings to reach **${inr(optVal)}** in 36 months!`
          : '')
      )
    } else {
      return `With little or no monthly surplus right now, focus on building a minimal cash reserve before locking funds into long-term market investments.`
    }
  }

  if (/emergency|runway|buffer|contingency|reserve|safety/.test(q)) {
    const target = expenses * 6
    const gap = target - savings
    return (
      `Here is where your emergency cushion stands:\n\n` +
      `• **Current Savings**: ${inr(savings)}\n` +
      `• **Monthly Expenses**: ${inr(expenses)}\n` +
      `• **Runway**: **${runway.toFixed(1)} months** of living expenses\n` +
      `• **Recommended 6-Month Buffer**: ${inr(target)}\n\n` +
      (runway >= 6
        ? `🎉 **Superb!** You have ${runway.toFixed(1)} months of coverage, safely exceeding the 6-month safety benchmark. You can invest extra surplus with confidence.`
        : `📌 **Next Step**: You are ${inr(gap)} short of the 6-month mark. Allocating ${inr(Math.round(surplus * 0.5))}/mo from your surplus will achieve full coverage in about ${Math.max(1, Math.round(gap / (surplus * 0.5)))} months.`)
    )
  }

  if (/scheme|government|pmsby|pmjjby|pmay|apy|nps|subsidy/.test(q)) {
    if (!schemes.length) {
      return `Every Indian bank account holder should activate **PMSBY** (₹20/yr accidental cover) and **PMJJBY** (₹436/yr life cover). Ask your bank branch or use net banking.`
    }
    const items = schemes.map((s) => {
      const status = s.eligible ? 'Eligible' : 'Potentially Eligible'
      const ben = s.annual_benefit ? ` (Annual benefit: ${inr(s.annual_benefit)})` : ''
      const hint = s.gap ? `\n   *Note*: ${s.gap}` : (s.how_to_apply ? `\n   *How to apply*: ${s.how_to_apply}` : '')
      return `• **${s.name}** [${status}]${ben}${hint}`
    })
    return `Here are the government schemes matched to your profile:\n\n${items.join('\n\n')}`
  }

  if (/debt|dti|ratio|borrow|credit|owe/.test(q)) {
    const dtiPct = (dti * 100).toFixed(1)
    let statusText =
      dti <= 0.2
        ? '✅ **Low Debt**: Your debt takes up a very small share of income.'
        : dti <= 0.35
        ? 'ℹ️ **Moderate**: Debt is within acceptable safety parameters.'
        : '⚠️ **High**: Over 35% of income is committed to EMIs. Prioritize aggressive debt reduction.'
    return (
      `Your debt and leverage review:\n\n` +
      `• **Total Outstanding Debt**: ${inr(debt)}\n` +
      `• **Monthly EMI**: ${inr(emi)}\n` +
      `• **Debt-to-Income (DTI)**: **${dtiPct}%** of monthly income\n\n` +
      statusText
    )
  }

  // Default summary
  return (
    `Here is your financial picture at a glance, with FinMate:\n\n` +
    `• **Income**: ${inr(income)}/mo | **Expenses**: ${inr(expenses)}/mo\n` +
    `• **Surplus**: **${inr(surplus)}/month** (ready to save & invest)\n` +
    `• **Emergency Runway**: **${runway.toFixed(1)} months** (${inr(savings)} saved)\n` +
    `• **Health Score**: **${riskScore}/100** (${riskCat} Risk)\n` +
    `• **Debt Load**: ${inr(debt)} (DTI: ${(dti * 100).toFixed(1)}%)\n\n` +
    `You can ask me questions like:\n` +
    `👉 *"Can I afford a 15,000 EMI for a new car?"*\n` +
    `👉 *"Where should I invest my ${inr(surplus)} surplus?"*\n` +
    `👉 *"What government schemes can I apply for?"*`
  )
}

/**
 * Ask FinMate — connects to backend /chat endpoint with local fallback.
 * Sends language code and tries live backend first even in mock mode.
 */
export async function askSaathi(message, profile, analysis, history = [], language = 'en') {
  const targetLang = detectScriptLanguage(message) || language || 'en'

  // Attempt live backend first so users get genuine Groq AI replies
  for (const base of AGENT_API_CANDIDATES) {
    try {
      const url = base.endsWith('/') ? `${base}chat` : `${base}/chat`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25000)

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, profile, analysis, history, language: targetLang }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        if (data.reply) return data.reply
      }
    } catch {
      // try next candidate or fallback
    }
  }

  // If mock mode or backend unavailable, provide client-side dynamic synthesis
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 300))
  }
  return clientSynthesizeChat(message, profile, analysis, targetLang)
}

