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
  const stored = localStorage.getItem('arthsaathi_mock_mode')
  if (stored !== null) return stored === 'true'
  return import.meta.env.VITE_USE_MOCK === 'true'
}

export function setMockMode(enabled) {
  localStorage.setItem('arthsaathi_mock_mode', String(Boolean(enabled)))
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
          service: data.service || 'ArthSaathi Agent API',
        }
      }
    } catch {
      // try next candidate
    }
  }
  return { online: false, url: DEFAULT_API_BASE, service: null }
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
