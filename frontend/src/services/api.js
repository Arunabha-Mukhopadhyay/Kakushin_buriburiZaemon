import { createMockAnalysis } from '../mocks/analysisResponse'

const ENV_API_BASE = import.meta.env.VITE_API_BASE_URL
const ENV_SERVER_BASE = import.meta.env.VITE_SERVER_BASE_URL

const DEFAULT_API_BASE = ENV_API_BASE || 'http://localhost:8000'
const DEFAULT_SERVER_BASE = ENV_SERVER_BASE || 'http://localhost:3001'

// Candidate endpoints to handle localhost vs 127.0.0.1 vs Vite proxy
const AGENT_API_CANDIDATES = [
  DEFAULT_API_BASE,
  'http://127.0.0.1:8000',
  '/api/agents',
  'http://localhost:3001/api/agents',
  'http://127.0.0.1:3001/api/agents',
]

const VOICE_SERVER_CANDIDATES = [
  DEFAULT_SERVER_BASE,
  'http://127.0.0.1:3001',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  '/api/voice',
]

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
 */
function clientSynthesizeChat(question, profile = {}, analysis = {}) {
  const q = question.toLowerCase()
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

  // 1. Affordability / Car / House / Loan / Purchase / EMI
  if (/afford|buy|car|house|loan|purchase|spend|emi|bike|phone|iphone|vacation|borrow/.test(q)) {
    const safeEmi = Math.round(surplus * 0.4)
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

  // 2. Investment / Surplus Roadmap
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

  // 3. Emergency Fund / Runway
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

  // 4. Schemes
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

  // 5. Debt & DTI
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

  // 6. Overall Profile Summary / Default
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
 */
export async function askSaathi(message, profile, analysis, history = []) {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 450))
    return clientSynthesizeChat(message, profile, analysis)
  }

  for (const base of AGENT_API_CANDIDATES) {
    try {
      const url = base.endsWith('/') ? `${base}chat` : `${base}/chat`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, profile, analysis, history }),
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

  // Fallback to client synthesis if backend /chat is unreachable
  return clientSynthesizeChat(message, profile, analysis)
}

