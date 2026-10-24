import { useEffect, useMemo, useState, useRef } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Check,
  ChevronLeft,
  CircleDollarSign,
  DollarSign,
  Globe,
  GraduationCap,
  Heart,
  Home,
  Landmark,
  LoaderCircle,
  MessageCircle,
  Mic,
  MicOff,
  Plane,
  Radio,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Volume2,
  VolumeX,
  Wallet,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  analyzeProfile,
  askSaathi,
  checkBackendStatus,
  checkVoiceStatus,
  getVoiceToken,
  isMockMode,
  setMockMode,
} from './services/api'
import { money, percent, titleCase } from './utils/format'
import {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  getLanguageConfig,
  detectScriptLanguage,
  t,
  DICTIONARY,
  getLocalizedRiskCategory,
  getLocalizedScenarioName,
  getLocalizedAssessment,
  getLocalizedScheme,
  getLocalizedAction,
  getLocalizedGoalTitle,
  getLocalizedDecisionCard,
} from './utils/i18n'

/* ─── Web Speech TTS Helpers ─────────────────────────────────────────────────── */
function speakText(text, onEnd, lang = 'en') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  window.speechSynthesis.cancel()
  const clean = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\*\*|__|\*|_|`|#/g, '')
    .replace(/\|[^\n]+\|/g, '')
    .replace(/[-]{3,}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, '. ')
    .trim()
  if (!clean) return false
  const targetLang = detectScriptLanguage(clean) || lang || 'en'
  const langConfig = getLanguageConfig(targetLang)
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.lang = langConfig.ttsLocale || 'en-IN'
  utterance.rate = 1.0
  utterance.pitch = 1.0

  try {
    const voices = window.speechSynthesis.getVoices() || []
    const prefix = targetLang.toLowerCase()
    const matchingVoice = voices.find(
      (v) =>
        v.lang &&
        (v.lang.toLowerCase().startsWith(prefix) ||
          v.lang.toLowerCase().replace('_', '-').startsWith(langConfig.ttsLocale.toLowerCase()))
    )
    if (matchingVoice) {
      utterance.voice = matchingVoice
    }
  } catch {}

  if (onEnd) utterance.onend = onEnd
  utterance.onerror = () => { if (onEnd) onEnd() }
  window.speechSynthesis.speak(utterance)
  return true
}

function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   INITIAL PROFILE
   ═══════════════════════════════════════════════════════════════════════════════ */
const initialProfile = {
  userId: `demo-${Date.now()}`,
  monthlyIncome: '',
  monthlyExpenses: '',
  monthlyEmi: '',
  existingSavings: '',
  existingDebt: '',
  dependents: 0,
  employmentType: 'salaried',
  age: '',
  gender: '',
  state: '',
  isRural: false,
  casteCategory: '',
  landHoldingAcres: '',
  businessType: '',
  hasBankAccount: true,
  hasInsurance: false,
  hasHealthInsurance: false,
  riskAppetite: 'moderate',
  preferredLang: 'en',
  suspiciousInput: '',
  userMessage: '',
}

/* ═══════════════════════════════════════════════════════════════════════════════
   GOAL PRESETS
   ═══════════════════════════════════════════════════════════════════════════════ */
const GOAL_PRESETS = [
  { id: 'emergency', icon: Shield, label: 'Emergency Fund', desc: '6 months of expenses' },
  { id: 'house', icon: Home, label: 'Buy a House', desc: 'Down payment savings' },
  { id: 'education', icon: GraduationCap, label: 'Education', desc: 'Self or children' },
  { id: 'retirement', icon: TrendingUp, label: 'Retirement', desc: 'Long-term wealth' },
  { id: 'vehicle', icon: Briefcase, label: 'Vehicle / Asset', desc: 'Car, bike, or equipment' },
  { id: 'travel', icon: Plane, label: 'Travel / Vacation', desc: 'Dream trip planning' },
  { id: 'health', icon: Heart, label: 'Health Insurance', desc: 'Medical protection' },
  { id: 'debt', icon: DollarSign, label: 'Clear Debt', desc: 'Become debt-free' },
  { id: 'custom', icon: Target, label: 'Custom Goal', desc: 'Your own target' },
]

/* ═══════════════════════════════════════════════════════════════════════════════
   APP COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
function App() {
  const [screen, setScreen] = useState('welcome')
  const [focusView, setFocusView] = useState('overview')
  const [profile, setProfile] = useState(initialProfile)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [mockActive, setMockActive] = useState(isMockMode())
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true })
  const [voiceStatus, setVoiceStatus] = useState({ online: false, configured: false, checking: true })
  const [voicePanelOpen, setVoicePanelOpen] = useState(false)

  // Multilingual State
  const [currentLang, setCurrentLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('finmate_lang') || DEFAULT_LANGUAGE
    }
    return DEFAULT_LANGUAGE
  })
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langDropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function changeLanguage(newLang) {
    setCurrentLang(newLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('finmate_lang', newLang)
    }
    setProfile((prev) => ({ ...prev, preferredLang: newLang }))
    setLangMenuOpen(false)
  }

  // Probe backend on mount and periodically
  useEffect(() => {
    let mounted = true
    async function verifyBackend() {
      const [status, voice] = await Promise.all([checkBackendStatus(), checkVoiceStatus()])
      if (mounted) {
        setBackendStatus({ online: status.online, checking: false, url: status.url })
        setVoiceStatus({ online: voice.online, configured: voice.configured, checking: false, url: voice.url })
      }
    }
    verifyBackend()
    const interval = setInterval(verifyBackend, 15000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  function toggleMockMode() {
    const nextMode = !mockActive
    setMockMode(nextMode)
    setMockActive(nextMode)
  }

  function update(name, value) {
    setProfile((current) => ({ ...current, [name]: value }))
  }

  async function submitProfile(event, forceMock = false) {
    if (event) event.preventDefault()
    setError('')

    const inc = Number(profile.monthlyIncome)
    if (!profile.monthlyIncome || inc <= 0 || profile.monthlyExpenses === '') {
      setError('Please add valid monthly income and expenses to continue.')
      return
    }

    setScreen('loading')

    const cleanPayload = {
      userId: profile.userId || `user-${Date.now()}`,
      monthlyIncome: Math.max(1, inc),
      monthlyExpenses: Math.max(0, Number(profile.monthlyExpenses || 0)),
      monthlyEmi: Math.max(0, Number(profile.monthlyEmi || 0)),
      existingSavings: Math.max(0, Number(profile.existingSavings || 0)),
      existingDebt: Math.max(0, Number(profile.existingDebt || 0)),
      dependents: Math.max(0, parseInt(profile.dependents || 0, 10)),
      employmentType: profile.employmentType || 'salaried',
      age: profile.age ? Math.min(120, Math.max(1, parseInt(profile.age, 10))) : null,
      gender: profile.gender || null,
      state: profile.state ? profile.state.trim() : null,
      isRural: Boolean(profile.isRural),
      casteCategory: profile.casteCategory || null,
      landHoldingAcres: profile.landHoldingAcres ? Math.max(0, Number(profile.landHoldingAcres)) : null,
      businessType: profile.businessType ? profile.businessType.trim() : null,
      hasBankAccount: Boolean(profile.hasBankAccount),
      hasInsurance: Boolean(profile.hasInsurance),
      hasHealthInsurance: Boolean(profile.hasHealthInsurance),
      riskAppetite: profile.riskAppetite || 'moderate',
      preferredLang: currentLang || profile.preferredLang || 'en',
      suspiciousInput: profile.suspiciousInput ? profile.suspiciousInput.trim() : null,
      userMessage: profile.userMessage ? profile.userMessage.trim() : null,
    }

    try {
      const result = await analyzeProfile(cleanPayload, { forceMock: forceMock || mockActive })
      setAnalysis(result)
      setScreen('dashboard')
    } catch (cause) {
      setError(cause.message || 'We could not complete the analysis.')
      setScreen('onboarding')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setScreen('welcome')} aria-label="Go to FinMate home">
          <span className="brand-mark">F</span>
          <span>
            Fin<span>Mate</span>
          </span>
        </button>

        <div className="header-actions">
          {!mockActive && (
            <span
              className={`conn-pill ${backendStatus.online ? 'online' : 'offline'}`}
              title={
                backendStatus.online
                  ? `Connected to the agent API at ${backendStatus.url || 'port 8000'}`
                  : 'Agent API not detected on port 8000 or through /api/agents'
              }
            >
              <span className="conn-dot" />
              {backendStatus.checking
                ? t(currentLang, 'connecting', 'Connecting…')
                : backendStatus.online
                ? t(currentLang, 'agentsLive', 'Agents live')
                : t(currentLang, 'agentsOffline', 'Agents offline')}
            </span>
          )}

          {/* Multilingual Selector Dropdown */}
          <div className="lang-dropdown-container" ref={langDropdownRef}>
            <button
              type="button"
              className="lang-select-btn"
              onClick={() => setLangMenuOpen((prev) => !prev)}
              aria-label={t(currentLang, 'selectLanguage', 'Select Language')}
              title="Change Language / भाषा निवडा / भाषा चुनें / ভাষা নির্বাচন / ਭਾਸ਼ਾ ਚੁਣੋ"
            >
              <Globe size={14} />
              <span>{getLanguageConfig(currentLang).native}</span>
            </button>
            {langMenuOpen && (
              <div className="lang-menu">
                {LANGUAGES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    className={`lang-menu-item ${currentLang === item.code ? 'active' : ''}`}
                    onClick={() => changeLanguage(item.code)}
                  >
                    <span className="lang-native">{item.native}</span>
                    <span className="lang-label">({item.label})</span>
                    {currentLang === item.code && <Check size={14} className="lang-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mode Switcher */}
          <button
            type="button"
            className={`mode-toggle-btn ${mockActive ? 'mock' : 'live'}`}
            onClick={toggleMockMode}
            title={mockActive ? 'Switch to Live FastAPI Backend' : 'Switch to Demo Mock Mode'}
          >
            <Radio size={12} />
            <span>{mockActive ? t(currentLang, 'demoMode', 'Demo mode') : t(currentLang, 'liveAnalysis', 'Live analysis')}</span>
          </button>

          {/* Voice FinMate (ElevenLabs AI) — available anytime, even while entering data */}
          <button
            type="button"
            className="voice-finmate-topbtn"
            onClick={() => setVoicePanelOpen(true)}
            title="Open Voice FinMate (ElevenLabs AI with real-time scheme knowledge)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(245, 166, 35, 0.45)',
              background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.2), rgba(232, 131, 10, 0.08))',
              color: '#f5a623',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(245, 166, 35, 0.15)',
              transition: 'all 0.2s ease',
            }}
          >
            <Volume2 size={14} />
            <span>Voice FinMate</span>
          </button>
        </div>
      </header>

      {/* Voice FinMate Sidebar — ElevenLabs Agent Embedded Panel (Global Overlay) */}
      <VoiceFinMateSidebar
        open={voicePanelOpen}
        onClose={() => setVoicePanelOpen(false)}
        profile={profile}
        analysis={analysis}
      />

      {screen === 'welcome' && (
        <Welcome
          onStart={(focus = 'overview') => {
            setFocusView(focus)
            setScreen('onboarding')
          }}
          mockActive={mockActive}
          backendOnline={backendStatus.online}
          currentLang={currentLang}
        />
      )}
      {screen === 'onboarding' && (
        <Onboarding
          profile={profile}
          update={update}
          focusView={focusView}
          onBack={() => setScreen('welcome')}
          onSubmit={submitProfile}
          error={error}
          mockActive={mockActive}
          backendOnline={backendStatus.online}
          currentLang={currentLang}
          onSwitchToMock={() => {
            setMockMode(true)
            setMockActive(true)
            submitProfile(null, true)
          }}
          onOpenVoice={() => setVoicePanelOpen(true)}
        />
      )}
      {screen === 'loading' && <Loading mockActive={mockActive} currentLang={currentLang} />}
      {screen === 'dashboard' && (
        <Dashboard
          analysis={analysis}
          profile={profile}
          mockActive={mockActive}
          initialFocus={focusView}
          currentLang={currentLang}
          onVoice={() => setScreen('voice')}
          onOpenVoice={() => setVoicePanelOpen(true)}
          onNew={() => {
            setProfile(initialProfile)
            setAnalysis(null)
            setFocusView('overview')
            setScreen('onboarding')
          }}
        />
      )}
      {screen === 'voice' && (
        <Voice
          analysis={analysis}
          profile={profile}
          currentLang={currentLang}
          onBack={() => setScreen(analysis ? 'dashboard' : 'welcome')}
        />
      )}

      {/* Persistent Multilingual Chatbot */}
      {screen !== 'voice' && (
        <Chatbot analysis={analysis} profile={profile} currentLang={currentLang} />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   WELCOME
   ═══════════════════════════════════════════════════════════════════════════════ */
function Welcome({ onStart, mockActive, backendOnline, currentLang = 'en' }) {
  return (
    <main className="welcome page-enter">
      <div className="welcome-copy">
        <div className="eyebrow">
          <span className="eyebrow-dot" /> {t(currentLang, 'welcomeBadge', 'AI-Powered Financial Companion')}
        </div>
        <h1>
          {currentLang === 'hi' ? <>आपका धन, <em>स्पष्ट और सुरक्षित।</em></>
           : currentLang === 'mr' ? <>तुमचा पैसा, <em>स्पष्ट आणि सुरक्षित।</em></>
           : currentLang === 'bn' ? <>আপনার অর্থ, <em>স্পষ্ট ও নির্ভুল।</em></>
           : currentLang === 'pa' ? <>ਤੁਹਾਡਾ ਪੈਸਾ, <em>ਸਪੱਸ਼ਟ ਅਤੇ ਸੁਰੱਖਿਅਤ।</em></>
           : <>Your money, <em>decoded.</em></>}
        </h1>
        <p className="hero-text">
          {t(
            currentLang,
            'welcomeSubheading',
            'Get a complete financial health check in under 30 seconds — risk scoring, smart scheme matching, and 36-month future projections.'
          )}
        </p>

        {/* Interactive Feature Cards — select a specific pillar or explore all */}
        <div className="welcome-features">
          <button
            type="button"
            className="feature-card feature-card-btn"
            onClick={() => onStart('risk')}
            title="Focus specifically on Risk Scoring & AI Pipeline"
          >
            <div className="feature-icon"><ShieldCheck size={20} /></div>
            <div>
              <b>{t(currentLang, 'tabRisk', 'Risk Analysis')}</b>
              <span>9-agent AI pipeline &rarr;</span>
            </div>
          </button>
          <button
            type="button"
            className="feature-card feature-card-btn"
            onClick={() => onStart('schemes')}
            title="Focus specifically on Government Welfare Schemes"
          >
            <div className="feature-icon feature-icon--gold"><Landmark size={20} /></div>
            <div>
              <b>{t(currentLang, 'tabSchemes', 'Scheme Matching')}</b>
              <span>50+ govt schemes &rarr;</span>
            </div>
          </button>
          <button
            type="button"
            className="feature-card feature-card-btn"
            onClick={() => onStart('simulation')}
            title="Focus specifically on Monte Carlo Simulation"
          >
            <div className="feature-icon feature-icon--teal"><TrendingUp size={20} /></div>
            <div>
              <b>{t(currentLang, 'tabSimulation', 'Future Simulation')}</b>
              <span>1,000 Monte Carlo paths &rarr;</span>
            </div>
          </button>
        </div>

        <button className="primary-button hero-button" onClick={() => onStart('overview')}>
          {t(currentLang, 'startOverview', 'Start complete analysis')} <ArrowRight size={18} />
        </button>
        <div className="trust-line">
          <ShieldCheck size={14} /> No sign-up required · 100% private
          {!mockActive && backendOnline && (
            <span style={{ color: 'var(--teal)', marginLeft: '10px' }}>
              · {t(currentLang, 'agentsLive', 'Agents online')}
            </span>
          )}
        </div>
      </div>
      <div className="welcome-orbit" aria-hidden="true">
        <div className="orbit-ring ring-one" />
        <div className="orbit-ring ring-two" />
        <div className="orbit-core">
          <CircleDollarSign size={32} />
          <span>
            Clarity
            <br />
            <b>starts here</b>
          </span>
        </div>
        <div className="orbit-chip chip-one">
          <TrendingUp size={14} /> Future scenarios
        </div>
        <div className="orbit-chip chip-two">
          <ShieldCheck size={14} /> Scam detection
        </div>
        <div className="orbit-chip chip-three">
          <Target size={14} /> Personalized goals
        </div>
      </div>
      <div className="welcome-foot">
        <span>9 AI Agents</span>
        <span>Monte Carlo Simulation</span>
        <span>Gemini AI Powered</span>
      </div>
    </main>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ONBOARDING — 3-step form with Goals builder in Step 3
   ═══════════════════════════════════════════════════════════════════════════════ */
function Onboarding({
  profile,
  update,
  focusView = 'overview',
  onBack,
  onSubmit,
  error,
  mockActive,
  backendOnline,
  onSwitchToMock,
  currentLang = 'en',
  onOpenVoice,
}) {
  const [step, setStep] = useState(1)
  const [selectedGoals, setSelectedGoals] = useState([])
  const [customGoalAmount, setCustomGoalAmount] = useState('')
  const [customGoalMonths, setCustomGoalMonths] = useState('')
  const next = () => setStep((value) => Math.min(value + 1, 3))

  function toggleGoal(goalId) {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    )
  }

  // Build userMessage from selected goals + custom text
  function buildGoalMessage() {
    const goalNames = selectedGoals
      .map((id) => GOAL_PRESETS.find((g) => g.id === id)?.label)
      .filter(Boolean)
    let message = profile.userMessage || ''
    if (goalNames.length > 0) {
      const goalText = `My financial goals: ${goalNames.join(', ')}.`
      if (customGoalAmount) {
        message = `${goalText} Target amount: ₹${customGoalAmount}.`
      } else {
        message = goalText
      }
      if (customGoalMonths) {
        message += ` Timeline: ${customGoalMonths} months.`
      }
      // Append any custom text the user typed
      if (profile.userMessage && !profile.userMessage.startsWith('My financial goals:')) {
        message += ` ${profile.userMessage}`
      }
    }
    return message
  }

  function handleSubmit(e) {
    // Update userMessage with goals before submitting
    const goalMessage = buildGoalMessage()
    if (goalMessage) {
      update('userMessage', goalMessage)
      // Wait a tick for state to update
      setTimeout(() => onSubmit(e, false), 50)
    } else {
      onSubmit(e, false)
    }
  }

  return (
    <main className="onboarding page-enter">
      <div className="form-intro">
        <button className="back-button" onClick={onBack}>
          <ChevronLeft size={18} /> {t(currentLang, 'prevStep', 'Back')}
        </button>
        <div className="eyebrow">
          {focusView === 'risk' && 'Selected Focus: Risk Analysis'}
          {focusView === 'schemes' && 'Selected Focus: Scheme Matching'}
          {focusView === 'simulation' && 'Selected Focus: Future Simulation'}
          {(!focusView || focusView === 'overview') && (t(currentLang, 'formTitle', 'Your starting point'))}
        </div>
        <h1>
          {currentLang === 'hi' ? <>आइए आपके वित्तीय स्थिति को <br /><em>स्पष्ट रूप से समझें।</em></>
           : currentLang === 'mr' ? <>चला, तुमचे पैसे <br /><em>योग्य संदर्भात पाहूया.</em></>
           : currentLang === 'bn' ? <>আসুন আপনার অর্থ <br /><em>সঠিকভাবে পর্যালোচনা করি।</em></>
           : currentLang === 'pa' ? <>ਆਓ ਤੁਹਾਡੇ ਪੈਸੇ ਨੂੰ <br /><em>ਸਹੀ ਢੰਗ ਨਾਲ ਸਮਝੀਏ।</em></>
           : <>Let's put your money<br /><em>in context.</em></>}
        </h1>
        <p>{t(currentLang, 'formSubtitle', 'A few honest numbers are enough to begin. You can leave optional details blank.')}</p>
      </div>

      <div className="form-panel">
        {/* Live Voice Assistant helper prompt right above the form */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(245,166,35,0.1), rgba(232,131,10,0.04))',
          border: '1px solid rgba(245,166,35,0.3)', borderRadius: '10px',
          padding: '10px 14px', marginBottom: '18px', fontSize: '13px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f5a623' }}>
            <Volume2 size={16} />
            <span style={{ color: 'var(--text, #fff)' }}>
              Entering details? <b>Voice FinMate</b> knows your inputs live & can discuss your scheme eligibility.
            </span>
          </div>
          {onOpenVoice && (
            <button
              type="button"
              onClick={onOpenVoice}
              style={{
                background: '#f5a623', color: '#000', border: 'none',
                borderRadius: '6px', padding: '6px 14px', fontWeight: 700,
                fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Talk to Voice FinMate
            </button>
          )}
        </div>

        <div className="stepper">
          <span className={step >= 1 ? 'active' : ''}>
            01 <b>{t(currentLang, 'stepFinancials', 'Snapshot')}</b>
          </span>
          <i />
          <span className={step >= 2 ? 'active' : ''}>
            02 <b>{t(currentLang, 'stepDemographics', 'Context')}</b>
          </span>
          <i />
          <span className={step >= 3 ? 'active' : ''}>
            03 <b>{t(currentLang, 'stepGoals', 'Goals')}</b>
          </span>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e) }}>
          {step === 1 && (
            <section className="form-step">
              <div className="section-kicker">01 / 03</div>
              <h2>{t(currentLang, 'formTitle', 'What does your month look like?')}</h2>
              <div className="field-grid">
                <Field
                  label={t(currentLang, 'monthlyIncome', 'Monthly income')}
                  name="monthlyIncome"
                  value={profile.monthlyIncome}
                  update={update}
                  required
                  prefix="₹"
                />
                <Field
                  label={t(currentLang, 'monthlyExpenses', 'Monthly expenses')}
                  name="monthlyExpenses"
                  value={profile.monthlyExpenses}
                  update={update}
                  required
                  prefix="₹"
                />
                <Field
                  label={t(currentLang, 'monthlyEmi', 'Monthly EMI / debt payments')}
                  name="monthlyEmi"
                  value={profile.monthlyEmi}
                  update={update}
                  prefix="₹"
                />
                <Field
                  label={t(currentLang, 'existingSavings', 'Current savings')}
                  name="existingSavings"
                  value={profile.existingSavings}
                  update={update}
                  prefix="₹"
                />
                <Field
                  label={t(currentLang, 'existingDebt', 'Existing debt')}
                  name="existingDebt"
                  value={profile.existingDebt}
                  update={update}
                  prefix="₹"
                />
                <Field
                  label={t(currentLang, 'dependents', 'People financially dependent on you')}
                  name="dependents"
                  value={profile.dependents}
                  update={update}
                  type="number"
                />
              </div>
              <div className="helper">
                <Sparkles size={15} /> Your data powers deterministic analysis and scheme matching.
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="form-step">
              <div className="section-kicker">Useful context</div>
              <h2>What else shapes your decisions?</h2>
              <div className="field-grid">
                <Field label="Age" name="age" value={profile.age} update={update} type="number" />
                <SelectField
                  label="Gender"
                  name="gender"
                  value={profile.gender}
                  update={update}
                  options={[
                    ['', 'Select gender (optional)'],
                    ['female', 'Female'],
                    ['male', 'Male'],
                    ['other', 'Other'],
                  ]}
                />
                <SelectField
                  label="Employment type"
                  name="employmentType"
                  value={profile.employmentType}
                  update={update}
                  options={[
                    ['salaried', 'Salaried'],
                    ['self_employed', 'Self-employed'],
                    ['gig', 'Gig worker'],
                    ['farmer', 'Farmer'],
                    ['daily_wage', 'Daily wage'],
                    ['unemployed', 'Unemployed'],
                  ]}
                />
                <SelectField
                  label="Risk appetite"
                  name="riskAppetite"
                  value={profile.riskAppetite}
                  update={update}
                  options={[
                    ['conservative', 'Conservative'],
                    ['moderate', 'Moderate'],
                    ['aggressive', 'Aggressive'],
                  ]}
                />
                <SelectField
                  label={t(currentLang, 'selectLanguage', 'Preferred language')}
                  name="preferredLang"
                  value={profile.preferredLang}
                  update={update}
                  options={[
                    ['en', 'English'],
                    ['hi', 'हिंदी (Hindi)'],
                    ['mr', 'मराठी (Marathi)'],
                    ['bn', 'বাংলা (Bengali)'],
                    ['pa', 'ਪੰਜਾਬੀ (Punjabi)'],
                    ['kn', 'ಕನ್ನಡ (Kannada)'],
                  ]}
                />
                <Field label="State" name="state" value={profile.state} update={update} type="text" />
                <SelectField
                  label="Caste category"
                  name="casteCategory"
                  value={profile.casteCategory}
                  update={update}
                  options={[
                    ['', 'Select category (optional)'],
                    ['general', 'General'],
                    ['obc', 'OBC'],
                    ['sc', 'SC'],
                    ['st', 'ST'],
                  ]}
                />
                <div className="field">
                  <span>Business / work type</span>
                  <input
                    type="text"
                    value={profile.businessType}
                    onChange={(e) => update('businessType', e.target.value)}
                    placeholder="e.g. Retail shop, IT services, Farming, Teaching"
                  />
                  <span className="field-helper">
                    Describe your work or business for better scheme matching
                  </span>
                </div>
                {profile.employmentType === 'farmer' && (
                  <Field
                    label="Land holding (acres)"
                    name="landHoldingAcres"
                    value={profile.landHoldingAcres}
                    update={update}
                    type="number"
                  />
                )}
              </div>
              <div className="toggle-row">
                <Toggle
                  label="I have a bank account"
                  value={profile.hasBankAccount}
                  onChange={(value) => update('hasBankAccount', value)}
                />
                <Toggle
                  label="I have life / term insurance"
                  value={profile.hasInsurance}
                  onChange={(value) => update('hasInsurance', value)}
                />
                <Toggle
                  label="I have health insurance"
                  value={profile.hasHealthInsurance}
                  onChange={(value) => update('hasHealthInsurance', value)}
                />
                <Toggle
                  label="I live in a rural area"
                  value={profile.isRural}
                  onChange={(value) => update('isRural', value)}
                />
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="form-step">
              <div className="section-kicker">Your financial goals</div>
              <h2>What are you working towards?</h2>

              {/* Goal Preset Cards */}
              <div className="goals-builder">
                <h3>Select your goals (choose one or more)</h3>
                <div className="goal-preset-grid">
                  {GOAL_PRESETS.map((goal) => {
                    const Icon = goal.icon
                    const isSelected = selectedGoals.includes(goal.id)
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        className={`goal-preset ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleGoal(goal.id)}
                      >
                        <Icon size={18} />
                        <span>{goal.label}</span>
                        <small style={{ color: 'var(--muted)', fontWeight: 400 }}>{goal.desc}</small>
                      </button>
                    )
                  })}
                </div>

                {/* Custom fields when goals are selected */}
                {selectedGoals.length > 0 && (
                  <div className="goal-custom-fields">
                    <Field
                      label="Target amount (optional)"
                      name="_goalAmount"
                      value={customGoalAmount}
                      update={(_, v) => setCustomGoalAmount(v)}
                      prefix="₹"
                    />
                    <Field
                      label="Timeline in months (optional)"
                      name="_goalMonths"
                      value={customGoalMonths}
                      update={(_, v) => setCustomGoalMonths(v)}
                      type="number"
                    />
                  </div>
                )}
              </div>

              <label className="full-field">
                <span>
                  Additional details or message <small>Optional</small>
                </span>
                <textarea
                  value={profile.userMessage}
                  onChange={(event) => update('userMessage', event.target.value)}
                  placeholder="For example: I want to build an emergency fund of 2 lakhs, or I'm planning to buy a house in 5 years."
                />
              </label>
              <label className="full-field">
                <span>
                  Something you want checked for scams <small>Optional</small>
                </span>
                <textarea
                  value={profile.suspiciousInput}
                  onChange={(event) => update('suspiciousInput', event.target.value)}
                  placeholder="Paste a suspicious SMS, WhatsApp message, KYC request, or prize offer."
                />
              </label>
              <div className="review-strip">
                <Check size={18} />
                <span>
                  <b>Ready when you are.</b> We'll analyze credibility, metrics, risk factors, schemes,
                  goals, and 36-month scenarios.
                </span>
              </div>
            </section>
          )}

          {error && (
            <div className="error-box">
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div>{error}</div>
                {!mockActive && !backendOnline && (
                  <div className="error-actions">
                    <button type="button" className="error-btn" onClick={onSwitchToMock}>
                      Switch to Demo Mode to test UI
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-actions">
            {step > 1 && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setStep((value) => value - 1)}
              >
                {t(currentLang, 'prevStep', 'Back')}
              </button>
            )}
            {step < 3 ? (
              <button type="button" className="primary-button" onClick={next}>
                {t(currentLang, 'nextStep', 'Continue')} <ArrowRight size={17} />
              </button>
            ) : (
              <button type="submit" className="primary-button">
                {t(currentLang, 'submitAnalyze', 'Analyze my picture')} <ArrowRight size={17} />
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FORM HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */
function Field({ label, name, value, update, type = 'number', required = false, prefix }) {
  return (
    <label className="field">
      <span>
        {label} {required && <small>Required</small>}
      </span>
      <div className="input-wrap">
        {prefix && <b>{prefix}</b>}
        <input
          type={type}
          min="0"
          value={value}
          required={required}
          onChange={(event) => update(name, event.target.value)}
        />
      </div>
    </label>
  )
}

function SelectField({ label, name, value, update, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => update(name, event.target.value)}>
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <button
      type="button"
      className={`toggle ${value ? 'on' : ''}`}
      onClick={() => onChange(!value)}
    >
      <span className="toggle-knob" />
      <span>{label}</span>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   LOADING
   ═══════════════════════════════════════════════════════════════════════════════ */
function Loading({ mockActive, currentLang = 'en' }) {
  return (
    <main className="loading page-enter">
      <div className="loader-mark">
        <LoaderCircle size={42} />
      </div>
      <div className="eyebrow">{t(currentLang, 'connecting', 'Working through your picture')}</div>
      <h1>
        {t(currentLang, 'loadingTitle', 'Finding the useful signal.')}
      </h1>
      <p>
        {mockActive
          ? t(currentLang, 'demoMode', 'Generating simulated profile analysis…')
          : t(currentLang, 'loadingSubtitle', 'Running credibility checks, parallel agents, Monte Carlo simulation, and language adaptation…')}
      </p>
      <div className="loading-track">
        <span />
      </div>
      <small>{mockActive ? 'Just a second…' : 'Agent pipeline takes about 5 to 15 seconds.'}</small>
    </main>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   VOICE FINMATE CONTEXT ENGINE — Real-Time Evaluation & Enrichment
   Evaluates 11 Central Schemes deterministically so Voice Agent has 100% accurate
   eligibility & step-by-step enrollment knowledge even before backend analysis finishes.
   ═══════════════════════════════════════════════════════════════════════════════ */
const ELEVENLABS_AGENT_ID = 'agent_5001kxqs893vf74aph60e2z7x5sr'

function evaluateSchemesComprehensive(profile, analysis) {
  const p = profile || {}
  const age = Number(p.age || 0)
  const income = Number(p.monthlyIncome || 0)
  const annual = income * 12
  const gender = (p.gender || '').toLowerCase()
  const rural = Boolean(p.isRural)
  const emp = (p.employmentType || 'salaried').toLowerCase()
  const caste = (p.casteCategory || 'general').toLowerCase()
  const bank = p.hasBankAccount !== false && p.hasBankAccount !== 'no'
  const ins = Boolean(p.hasInsurance)
  const h_ins = Boolean(p.hasHealthInsurance)
  const land = Number(p.landHoldingAcres || 0)
  const business = (p.businessType || '').trim()

  const schemes = [
    {
      id: 'pmjdy',
      name: 'Pradhan Mantri Jan Dhan Yojana (PMJDY)',
      eligible: !bank,
      benefit: 'Zero-balance bank account, free RuPay debit card with ₹2 Lakh accidental insurance, and ₹10,000 overdraft facility.',
      why: !bank ? 'User does not currently have a formal bank account.' : 'User already has a bank account.',
      howToApply: 'Visit any public/private bank branch or Bank Mitra kiosk with your Aadhaar card and 2 passport photos. Account is opened on the spot with zero opening balance.',
      documents: ['Aadhaar Card', '2 Passport Photos', 'Address proof (if Aadhaar address differs)'],
      portal: 'https://pmjdy.gov.in',
    },
    {
      id: 'pmsby',
      name: 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
      eligible: !ins && bank && age >= 18 && age <= 70,
      benefit: '₹2,00,000 accidental death/total disability cover for only ₹20/year premium auto-debited from savings account.',
      why: (!ins && bank && age >= 18 && age <= 70) ? `Eligible (Age ${age}, has bank account, no existing accident insurance).` : (age > 0 && (age < 18 || age > 70)) ? `Age ${age} outside 18–70 eligibility.` : !bank ? 'Requires active savings account.' : 'Already insured.',
      howToApply: 'Ask your bank branch to enable PMSBY auto-debit of ₹20/year on your savings account, or activate it directly via your bank\'s Net Banking / Mobile Banking app under "Government Schemes" / "Social Security".',
      documents: ['Bank Account Passbook / Number', 'Aadhaar Card with Consent for Auto-debit'],
      portal: 'https://jansuraksha.gov.in',
    },
    {
      id: 'pmjjby',
      name: 'Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)',
      eligible: !ins && bank && age >= 18 && age <= 50,
      benefit: '₹2,00,000 term life insurance cover for death due to any cause for ₹436/year premium auto-debited annually.',
      why: (!ins && bank && age >= 18 && age <= 50) ? `Eligible (Age ${age}, has bank account, no existing term life insurance).` : (age > 0 && (age < 18 || age > 50)) ? `Age ${age} outside 18–50 eligibility.` : !bank ? 'Requires active savings account.' : 'Already insured.',
      howToApply: 'Visit your bank branch or activate through Mobile/Net Banking. Premium of ₹436/year is deducted automatically on 1st June each year upon simple self-declaration of good health.',
      documents: ['Bank Account Passbook', 'Aadhaar Card', 'Simple Self-Declaration of Good Health'],
      portal: 'https://jansuraksha.gov.in',
    },
    {
      id: 'apy',
      name: 'Atal Pension Yojana (APY)',
      eligible: age >= 18 && age <= 40 && emp !== 'salaried',
      benefit: 'Guaranteed lifetime monthly pension of ₹1,000 to ₹5,000 from age 60, continuing to spouse, and entire corpus returned to nominee.',
      why: (age >= 18 && age <= 40 && emp !== 'salaried') ? `Eligible (Age ${age}, unorganized/self-employed/gig worker).` : emp === 'salaried' ? 'Salaried employees with EPFO are generally excluded from government co-contribution.' : (age > 0) ? `Age ${age} outside 18–40 window.` : 'Available for age 18-40 non-salaried workers.',
      howToApply: 'Fill out the APY Subscriber Registration Form at any commercial bank or post office branch where you have a savings account. Provide Aadhaar and nominee details.',
      documents: ['Savings Bank Account Passbook', 'Aadhaar Card', 'Mobile Number linked to bank', 'Nominee Details (Aadhaar & relationship)'],
      portal: 'https://npscra.nsdl.co.in',
    },
    {
      id: 'pmkisan',
      name: 'PM Kisan Samman Nidhi (PM-KISAN)',
      eligible: emp === 'farmer' || land > 0,
      benefit: '₹6,000 per year directly transferred to bank account in 3 equal installments of ₹2,000 every 4 months.',
      why: (emp === 'farmer' || land > 0) ? `Eligible (Farmer with landholding of ${land || 'agricultural'} acres).` : 'Open to landholding farmer families.',
      howToApply: 'Register online at pmkisan.gov.in under "New Farmer Registration" or visit nearest Common Service Centre (CSC) with land record details. Complete e-KYC using OTP or biometric.',
      documents: ['Land Records (Khasra/Khatauni/7/12 extract)', 'Aadhaar Card', 'Bank Account Passbook (Aadhaar-seeded)'],
      portal: 'https://pmkisan.gov.in',
    },
    {
      id: 'mudra',
      name: 'Pradhan Mantri MUDRA Yojana (PMMY)',
      eligible: (['self_employed', 'business', 'gig'].includes(emp) || Boolean(business)) && (annual === 0 || annual < 1500000),
      benefit: 'Collateral-free micro enterprise loan: Shishu (up to ₹50,000), Kishore (₹50,000–₹5 Lakh), or Tarun (₹5 Lakh–₹10 Lakh).',
      why: (['self_employed', 'business', 'gig'].includes(emp) || Boolean(business)) ? 'Eligible as small business/self-employed enterprise.' : 'Targeted at non-corporate micro/small businesses and self-employed individuals.',
      howToApply: 'Apply online on the Udyami Mitra portal (udyamimitra.in) or submit the MUDRA loan application directly to any public/private bank, RRB, or MFI with business quotation/plan.',
      documents: ['Proof of Identity (Aadhaar/PAN)', 'Proof of Address', 'Quotation of machinery/items to be purchased', 'Business proof (Udyam Registration if available)', 'Last 6 months bank statement'],
      portal: 'https://udyamimitra.in',
    },
    {
      id: 'pmay',
      name: rural ? 'Pradhan Mantri Awas Yojana — Gramin (PMAY-G)' : 'Pradhan Mantri Awas Yojana — Urban (PMAY-U)',
      eligible: annual === 0 || annual < 1800000,
      benefit: 'Interest subsidy up to ₹2.67 Lakh on home loan (CLSS) or financial grant of ₹1.2–₹1.3 Lakh for rural pucca house construction.',
      why: `Eligible based on annual household income (income ceiling ₹18 Lakh) with no existing pucca house.`,
      howToApply: rural ? 'Gram Panchayat prepares beneficiary list based on SECC data; register at pmayg.nic.in or Gram Panchayat office.' : 'Apply online at pmaymis.gov.in under "Citizen Assessment" or submit PMAY application to your housing loan lender/bank.',
      documents: ['Aadhaar Card of all family members', 'Income Certificate / Salary Slips / ITR', 'Bank Account Statement', 'Affidavit confirming no pucca house in India', 'Land/Property documents (if construction)'],
      portal: rural ? 'https://pmayg.nic.in' : 'https://pmaymis.gov.in',
    },
    {
      id: 'pmjay',
      name: 'Ayushman Bharat — PM Jan Arogya Yojana (PM-JAY)',
      eligible: !h_ins && (annual === 0 || annual < 300000 || rural),
      benefit: '₹5,00,000 per family per year completely cashless and paperless hospitalization cover for secondary and tertiary care at empaneled hospitals.',
      why: (!h_ins && (annual < 300000 || rural)) ? 'Eligible based on low-income / rural classification without existing health insurance.' : 'Targeted at families without private health insurance in low-income/rural category.',
      howToApply: 'Visit mera.pmjay.gov.in and click "Am I Eligible" to search by mobile number or ration card, or visit the "Ayushman Mitra" helpdesk at any empaneled government or private hospital with your Aadhaar and Ration Card to generate your Golden Card on the spot.',
      documents: ['Ration Card / BPL Card', 'Aadhaar Card of each beneficiary', 'Mobile number for OTP verification'],
      portal: 'https://mera.pmjay.gov.in',
    },
    {
      id: 'standup',
      name: 'Stand-Up India Scheme',
      eligible: caste === 'sc' || caste === 'st' || gender === 'female',
      benefit: 'Bank composite loan from ₹10 Lakh to ₹1 Crore for setting up greenfield enterprise in manufacturing, services, or trading.',
      why: (caste === 'sc' || caste === 'st' || gender === 'female') ? `Eligible (Beneficiary meets SC/ST/Female entrepreneur criteria).` : 'Reserved for SC/ST individuals or women entrepreneurs.',
      howToApply: 'Register at the Stand-Up Mitra portal (standupmitra.in) or visit your nearest scheduled commercial bank branch. Handholding agencies like SIDBI assist with DPR (Detailed Project Report).',
      documents: ['Identity & Address Proof (Aadhaar/PAN)', 'Caste Certificate (for SC/ST)', 'Project Report / Business Plan', 'Partnership deed / Incorporation (if company)', 'Promoter contribution proof (min 15%)'],
      portal: 'https://standupmitra.in',
    },
    {
      id: 'svanidhi',
      name: 'PM SVANidhi (Street Vendor\'s AtmaNirbhar Nidhi)',
      eligible: ['informal', 'gig', 'self_employed'].includes(emp) && (annual === 0 || annual < 600000),
      benefit: 'Working capital micro-loan: ₹10,000 (1st loan), ₹20,000 (2nd loan), up to ₹50,000 (3rd loan) with 7% interest subsidy & up to ₹1,200/year cashback on digital UPI transactions.',
      why: 'Eligible for urban/semi-urban micro vendors and service providers.',
      howToApply: 'Apply on pmsvanidhi.mohua.gov.in portal or via PM SVANidhi mobile app, or through nearest CSC center with Certificate of Vending or Letter of Recommendation from Municipality.',
      documents: ['Certificate of Vending / Urban Local Body ID Card / Letter of Recommendation (LoR)', 'Aadhaar Card', 'Bank Account details', 'Mobile linked to Aadhaar'],
      portal: 'https://pmsvanidhi.mohua.gov.in',
    },
    {
      id: 'ssy',
      name: 'Sukanya Samriddhi Yojana (SSY)',
      eligible: gender === 'female' || (Number(p.dependents || 0) > 0),
      benefit: '8.2% guaranteed sovereign annual interest (tax-free Section 80C), deposit ₹250 to ₹1.5 Lakh/year for girl child under 10.',
      why: 'Available for families with a girl child under 10 years of age.',
      howToApply: 'Visit any post office branch or commercial bank (SBI, PNB, etc.) with the girl child\'s birth certificate and parent/guardian Aadhaar. Minimum opening deposit is ₹250.',
      documents: ['Girl Child Birth Certificate', 'Parent/Guardian Identity & Address Proof (Aadhaar/PAN)', 'Passport size photographs'],
      portal: 'https://www.indiapost.gov.in',
    },
  ]

  // If backend analysis already produced eligibleSchemes, merge with our detailed enrollment knowledge
  if (analysis?.eligibleSchemes && analysis.eligibleSchemes.length > 0) {
    const backendNames = new Set(
      analysis.eligibleSchemes.filter(s => s.eligible).map(s => (s.name || '').toLowerCase())
    )
    for (const s of schemes) {
      const match = Array.from(backendNames).some(bn => bn.includes(s.id) || s.name.toLowerCase().includes(bn))
      if (match) s.eligible = true
    }
  }

  return schemes
}

function buildFinancialContext(profile, analysis) {
  const p = profile || {}
  const a = analysis || {}
  const m = a.financialMetrics || {}
  const inr = (v) => v == null || isNaN(v) ? 'N/A' : '₹' + Math.round(Number(v)).toLocaleString('en-IN')

  const income = Number(p.monthlyIncome || 0)
  const expenses = Number(p.monthlyExpenses || 0)
  const emi = Number(p.monthlyEmi || 0)
  const savings = Number(p.existingSavings || m.savings || 0)
  const debt = Number(p.existingDebt || m.total_debt || 0)
  const surplus = m.monthly_surplus != null ? Number(m.monthly_surplus) : (income - expenses - emi)
  const dti = m.dti_ratio != null ? Number(m.dti_ratio) : (income > 0 ? (emi / income) : 0)
  const runway = m.emergency_months != null ? Number(m.emergency_months) : (expenses > 0 ? (savings / expenses) : 0)
  const riskScore = a.riskScore ?? (income > 0 ? Math.min(85, Math.max(35, Math.round(50 + (surplus > 0 ? 15 : -15) - (dti * 20) + (runway * 3)))) : 'Pending Input')
  const riskCat = a.riskCategory || (riskScore >= 70 ? 'Moderate-Low Risk' : riskScore >= 50 ? 'Moderate Risk' : 'High Risk')

  const allSchemes = evaluateSchemesComprehensive(p, a)
  const eligibleSchemes = allSchemes.filter(s => s.eligible)
  const ineligibleSchemes = allSchemes.filter(s => !s.eligible)

  const eligibleSchemesDetailed = eligibleSchemes.map((s, idx) => [
    `${idx + 1}. ${s.name}`,
    `   • BENEFIT: ${s.benefit}`,
    `   • WHY YOU QUALIFY: ${s.why}`,
    `   • HOW TO ENROLL (STEP-BY-STEP): ${s.howToApply}`,
    `   • REQUIRED DOCUMENTS: ${s.documents.join(', ')}`,
    `   • OFFICIAL PORTAL / BRANCH: ${s.portal}`,
  ].join('\n')).join('\n\n') || 'No schemes qualify based on current inputs.'

  const ineligibleSchemesSummary = ineligibleSchemes.map(s => `• ${s.name}: ${s.why}`).join('\n')

  const scams = (a.scamFlags || [])
    .map(s => `${s.scam_type}: ${s.warning}`)
    .join('; ') || 'No active scam warnings flagged.'

  const goals = (a.goals || [])
    .map(g => `${g.title}${g.target_amount ? ` (${inr(g.target_amount)})` : ''}${g.horizon_months ? ` in ${g.horizon_months} months` : ''}`)
    .join(', ') || (p.userMessage || 'No specific goals set yet')

  const sims = a.simulationPaths || {}
  const simSummary = sims.optimal
    ? `36-Month Projections: Status Quo = ${inr(sims.status_quo?.projected_value)}, Moderate = ${inr(sims.moderate?.projected_value)}, Optimal = ${inr(sims.optimal?.projected_value)}`
    : 'Simulation ready to run once submitted.'

  const cards = (a.decisionCards || [])
    .map(c => c.action)
    .join('; ') || 'Tailored decision cards will appear after submission.'

  const plan = (a.actionPlan || [])
    .map(t => t.task)
    .join('; ') || 'Step-by-step action plan will appear after submission.'

  const fullContext = [
    `=== USER FINANCIAL PROFILE (ENTERED BY USER) ===`,
    `Name / ID: ${p.userId || 'Friend'}`,
    `Age: ${p.age || 'Not provided'}, Gender: ${p.gender || 'Not specified'}`,
    `State: ${p.state || 'India'}, Location: ${p.isRural ? 'Rural' : 'Urban / Semi-Urban'}`,
    `Employment Type: ${p.employmentType || 'salaried'}`,
    `Has Bank Account: ${p.hasBankAccount !== false ? 'Yes' : 'No'}`,
    `Has Insurance: ${p.hasInsurance ? 'Yes' : 'No'}, Health Insurance: ${p.hasHealthInsurance ? 'Yes' : 'No'}`,
    `Land Holding: ${p.landHoldingAcres ? `${p.landHoldingAcres} acres` : 'None / Not specified'}`,
    `Business Type: ${p.businessType || 'None / Not specified'}`,
    `Caste / Category: ${p.casteCategory || 'General'}`,
    `Dependents: ${p.dependents || 0}`,
    `Preferred Language: ${p.preferredLang || 'en'}`,
    ``,
    `=== COMPUTED FINANCIAL HEALTH METRICS ===`,
    `Monthly Income: ${inr(income)}`,
    `Monthly Expenses: ${inr(expenses)}`,
    `Monthly EMI / Debt: ${inr(emi)}`,
    `Monthly Surplus (Savings Capacity): ${inr(surplus)}`,
    `Current Savings: ${inr(savings)}`,
    `Outstanding Debt: ${inr(debt)}`,
    `Debt-to-Income (DTI) Ratio: ${(dti * 100).toFixed(1)}%`,
    `Emergency Runway: ${runway.toFixed(1)} months`,
    `Financial Health Score: ${riskScore}/100 (${riskCat})`,
    ``,
    `=== ELIGIBLE GOVERNMENT SCHEMES & ENROLLMENT GUIDE (CRITICAL KNOWLEDGE) ===`,
    eligibleSchemesDetailed,
    ``,
    `=== OTHER SCHEMES (CURRENT STATUS) ===`,
    ineligibleSchemesSummary,
    ``,
    `=== FINANCIAL GOALS ===`,
    goals,
    ``,
    `=== 36-MONTH SIMULATION ===`,
    simSummary,
    ``,
    `=== RECOMMENDATIONS & DECISION CARDS ===`,
    cards,
    ``,
    `=== ACTION PLAN ===`,
    plan,
    ``,
    `=== SCAM ALERTS ===`,
    scams,
  ].join('\n')

  return {
    fullContext,
    eligibleSchemes,
    ineligibleSchemes,
    income,
    expenses,
    surplus,
    riskScore,
    riskCat,
  }
}

function VoiceFinMateSidebar({ open, onClose, profile, analysis }) {
  const widgetContainerRef = useRef(null)
  const [syncKey, setSyncKey] = useState(0)

  // Re-create the widget whenever the panel opens or syncKey changes
  useEffect(() => {
    if (!open || !widgetContainerRef.current) return

    // Clear any existing widget
    widgetContainerRef.current.innerHTML = ''

    const widget = document.createElement('elevenlabs-convai')
    widget.setAttribute('agent-id', ELEVENLABS_AGENT_ID)

    // Build the user's financial context with live scheme matcher
    const { fullContext, eligibleSchemes, income, surplus, riskScore, riskCat } = buildFinancialContext(profile, analysis)
    const inr = (v) => v == null || isNaN(v) ? 'N/A' : '₹' + Math.round(Number(v)).toLocaleString('en-IN')

    const hasIncome = income > 0
    const schemeCount = eligibleSchemes.length
    const topSchemeNames = eligibleSchemes.slice(0, 3).map(s => s.name).join(', ')

    // ── System Prompt Override ──
    const systemPrompt = [
      `You are FinMate, a warm, multilingual AI financial companion built for Indian citizens.`,
      `You have real-time access to the user's exact financial details, computed metrics, and government welfare scheme eligibility.`,
      `Always respond in the user's preferred language: ${profile?.preferredLang === 'hi' ? 'Hindi' : profile?.preferredLang === 'mr' ? 'Marathi' : profile?.preferredLang === 'kn' ? 'Kannada' : 'English'}. If the user speaks in Hindi or Hinglish, speak in Hindi.`,
      `Keep your spoken responses natural, encouraging, and under 3 to 4 sentences so it is pleasant to listen to.`,
      ``,
      `=== LIVE USER FINANCIAL DATA & SCHEMES KNOWLEDGE ===`,
      fullContext,
      ``,
      `=== HOW TO ANSWER USER QUESTIONS ===`,
      `1. WHEN ASKED "WHAT SCHEMES AM I ELIGIBLE FOR?":`,
      `   - Name the specific schemes from the ELIGIBLE GOVERNMENT SCHEMES section above (e.g. ${topSchemeNames || 'PMSBY, APY'}).`,
      `   - Mention the concrete benefit for each (e.g. "₹2 Lakh accident cover for just ₹20 per year").`,
      `2. WHEN ASKED "HOW CAN I ENROLL?" OR "WHERE DO I APPLY?":`,
      `   - Read the exact step-by-step instructions from the HOW TO ENROLL section above for that scheme.`,
      `   - Tell the user which bank, portal, or CSC to visit, and what documents to take (Aadhaar, passbook, photos).`,
      `3. WHEN ASKED ABOUT THEIR NUMBERS:`,
      `   - Income is ${inr(income)}, Monthly Surplus is ${inr(surplus)}, Health Score is ${riskScore}/100.`,
      `   - Never hallucinate different numbers. Always use the exact values listed above.`,
      `4. IF USER IS STILL FILLING THE FORM:`,
      `   - Cheerfully guide them on what to fill next and how their answers unlock additional government schemes.`,
    ].join('\n')

    widget.setAttribute('override-prompt', systemPrompt)

    // ── Dynamic Variables for agents configured with {{placeholders}} ──
    const dynamicVars = {
      user_financial_context: fullContext,
      user_name: profile?.userId || 'Friend',
      monthly_income: inr(income),
      monthly_surplus: inr(surplus),
      health_score: String(riskScore),
      risk_category: riskCat,
      eligible_schemes_count: String(schemeCount),
      eligible_schemes_list: topSchemeNames,
      how_to_enroll: eligibleSchemes.map(s => `${s.name}: ${s.howToApply}`).join(' | '),
      preferred_language: profile?.preferredLang || 'en',
    }
    widget.setAttribute('dynamic-variables', JSON.stringify(dynamicVars))

    widget.style.width = '100%'
    widgetContainerRef.current.appendChild(widget)

    return () => {
      if (widgetContainerRef.current) {
        widgetContainerRef.current.innerHTML = ''
      }
    }
  }, [open, syncKey])

  if (!open) return null

  const { eligibleSchemes, income, surplus, riskScore } = buildFinancialContext(profile, analysis)
  const inr = (v) => v == null || isNaN(v) ? 'N/A' : '₹' + Math.round(Number(v)).toLocaleString('en-IN')

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 1000, backdropFilter: 'blur(3px)',
        }}
        onClick={onClose}
      />
      {/* Slide-in panel from right */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '430px',
        maxWidth: '96vw', background: 'var(--surface, #12151c)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 1001, display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f5a623, #e8830a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Volume2 size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text, #fff)' }}>
                Voice FinMate
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted, #888)', marginTop: '1px' }}>
                Powered by ElevenLabs AI · Live Scheme Knowledge
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px',
              width: 32, height: 32, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--muted, #888)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Live Context Status Bar */}
        <div style={{
          padding: '12px 20px', fontSize: '12px',
          color: 'var(--muted, #888)', lineHeight: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(245, 166, 35, 0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: '#34d399', boxShadow: '0 0 6px #34d399',
            }} />
            <span>
              <b style={{ color: 'var(--text, #fff)' }}>{eligibleSchemes.length} Schemes Matched</b>
              {income > 0 && ` · Income ${inr(income)}`}
              {riskScore && ` · Score ${riskScore}/100`}
            </span>
          </div>
          <button
            onClick={() => setSyncKey(k => k + 1)}
            title="Sync latest typed values with Voice Agent"
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '6px', padding: '3px 8px', fontSize: '10px',
              color: 'var(--text, #fff)', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            ↻ Sync Form
          </button>
        </div>

        {/* ElevenLabs Widget Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            ref={widgetContainerRef}
            style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '11px', color: 'var(--muted, #777)', textAlign: 'center',
        }}>
          Ask: <i>"What schemes am I eligible for?"</i> or <i>"How do I enroll in PMSBY?"</i>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DASHBOARD — Unified layout, single chatbot, no duplicate voice buttons
   ═══════════════════════════════════════════════════════════════════════════════ */
function Dashboard({
  analysis,
  profile,
  mockActive,
  initialFocus = 'overview',
  onVoice,
  onNew,
  currentLang = 'en',
  onOpenVoice,
}) {
  const [activeView, setActiveView] = useState(initialFocus || 'overview')
  const m = analysis.financialMetrics || {}
  const riskScore = analysis.riskScore ?? 0
  const riskCat = (analysis.riskCategory || 'unknown').toLowerCase()

  return (
    <main className="dashboard page-enter">
      <aside className="sidebar">
        <div className="side-label">YOUR FINMATE</div>
        <button
          className={activeView === 'overview' ? 'side-link active' : 'side-link'}
          onClick={() => setActiveView('overview')}
        >
          <BarChart3 size={16} /> {t(currentLang, 'tabOverview', 'All Insights')}
        </button>
        <button
          className={activeView === 'risk' ? 'side-link active' : 'side-link'}
          onClick={() => setActiveView('risk')}
        >
          <ShieldCheck size={16} /> {t(currentLang, 'tabRisk', 'Risk Analysis')}
        </button>
        <button
          className={activeView === 'schemes' ? 'side-link active' : 'side-link'}
          onClick={() => setActiveView('schemes')}
        >
          <Landmark size={16} /> {t(currentLang, 'tabSchemes', 'Scheme Matching')}
        </button>
        <button
          className={activeView === 'simulation' ? 'side-link active' : 'side-link'}
          onClick={() => setActiveView('simulation')}
        >
          <TrendingUp size={16} /> {t(currentLang, 'tabSimulation', 'Future Simulation')}
        </button>
        <button
          className="side-link"
          onClick={onVoice}
        >
          <Mic size={16} /> {t(currentLang, 'talkWithVoice', 'Voice Assistant')}
        </button>
        <button
          className="side-link"
          onClick={onOpenVoice}
          style={{ background: 'linear-gradient(90deg, rgba(245,166,35,0.12), transparent)', color: '#f5a623', fontWeight: 600 }}
        >
          <Volume2 size={16} /> Voice FinMate
        </button>
        <div className="sidebar-bottom">
          <div className="mode-pill">
            <span className="live-dot" /> {mockActive ? t(currentLang, 'demoMode', 'Demo mode') : t(currentLang, 'liveAnalysis', 'Live agent analysis')}
          </div>
          <button className="new-analysis" onClick={onNew}>
            {t(currentLang, 'startNew', 'Start new analysis')} <ArrowRight size={14} />
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        {/* Quick Filter Pill Switcher */}
        <div className="view-filter-bar">
          <span className="view-filter-label">Filter View:</span>
          <button
            type="button"
            className={`view-pill ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            <BarChart3 size={13} /> {t(currentLang, 'tabOverview', 'All Data')}
          </button>
          <button
            type="button"
            className={`view-pill ${activeView === 'risk' ? 'active' : ''}`}
            onClick={() => setActiveView('risk')}
          >
            <ShieldCheck size={13} /> {t(currentLang, 'tabRisk', 'Risk Analysis Only')}
          </button>
          <button
            type="button"
            className={`view-pill ${activeView === 'schemes' ? 'active' : ''}`}
            onClick={() => setActiveView('schemes')}
          >
            <Landmark size={13} /> {t(currentLang, 'tabSchemes', 'Scheme Matching Only')}
          </button>
          <button
            type="button"
            className={`view-pill ${activeView === 'simulation' ? 'active' : ''}`}
            onClick={() => setActiveView('simulation')}
          >
            <TrendingUp size={13} /> {t(currentLang, 'tabSimulation', 'Future Simulation Only')}
          </button>
        </div>

        {/* Hero Summary Card */}
        <div className="dash-hero">
          <div className="dash-hero-left">
            <div className="eyebrow">
              {activeView === 'risk' && 'Focused Pipeline: Risk & Vulnerability'}
              {activeView === 'schemes' && 'Focused Pipeline: Welfare & Scheme Matching'}
              {activeView === 'simulation' && 'Focused Pipeline: 36-Month Monte Carlo Simulation'}
              {activeView === 'overview' && 'Your financial picture'}
            </div>
            <h1>
              {activeView === 'risk' && <>Risk <em>Profile.</em></>}
              {activeView === 'schemes' && <>Eligible <em>Schemes.</em></>}
              {activeView === 'simulation' && <>Future <em>Projections.</em></>}
              {activeView === 'overview' && <>Analysis <em>complete.</em></>}
            </h1>
            <p>
              {activeView === 'risk' && 'Comprehensive 9-agent risk factor assessment, debt sustainability, and scam vulnerability.'}
              {activeView === 'schemes' && 'Verified central and state government schemes matched to your income, occupation, and demographics.'}
              {activeView === 'simulation' && '1,000 Monte Carlo paths forecasting savings growth, inflation risk, and financial goal horizons.'}
              {activeView === 'overview' && `9 AI agents analyzed your profile in ${analysis?.latencyMs ? `${analysis.latencyMs}ms` : 'real time'}.`}
            </p>
          </div>
          <div className="dash-hero-stats">
            <div className="hero-stat">
              <div className={`hero-stat-ring ${riskCat === 'low' ? 'good' : riskCat === 'high' ? 'danger' : 'moderate'}`}>
                <strong>{riskScore}</strong>
              </div>
              <span>{t(currentLang, 'metricHealth', 'Health Score')} ({getLocalizedRiskCategory(riskCat, currentLang)})</span>
            </div>
            <div className="hero-stat">
              <strong className="hero-stat-value">{money(m.monthly_surplus)}</strong>
              <span>{t(currentLang, 'metricSurplus', 'Monthly Surplus')}</span>
            </div>
            <div className="hero-stat">
              <strong className="hero-stat-value">
                {m.emergency_months != null ? `${Number(m.emergency_months).toFixed(1)} mo` : '—'}
              </strong>
              <span>{t(currentLang, 'metricRunway', 'Emergency Runway')}</span>
            </div>
            <div className="hero-stat">
              <strong className="hero-stat-value">{percent(m.dti_ratio)}</strong>
              <span>{t(currentLang, 'metricDti', 'Debt-to-Income')}</span>
            </div>
          </div>
        </div>

        {/* Credibility engine score and flags */}
        {(activeView === 'overview' || activeView === 'risk') && (
          <Credibility data={analysis} currentLang={currentLang} />
        )}

        {/* Accessibility narrative generated by Accessibility Agent */}
        {analysis.finalResponse && (activeView === 'overview' || activeView === 'risk') && (
          <div className="narrative-box">
            <div className="section-kicker" style={{ marginBottom: '8px' }}>
              <Sparkles size={14} style={{ marginRight: '6px' }} />
              {t(currentLang, 'assessmentTitle', "FinMate's Personalized Assessment")}
            </div>
            <p>{getLocalizedAssessment(analysis, currentLang)}</p>
          </div>
        )}

        <div className="dashboard-grid">
          {(activeView === 'overview' || activeView === 'risk') && (
            <>
              <Overview data={analysis} profile={profile} currentLang={currentLang} />
              <Risk data={analysis} currentLang={currentLang} />
              <Scams data={analysis} currentLang={currentLang} />
              <Narrative data={analysis} currentLang={currentLang} />
            </>
          )}

          {(activeView === 'overview' || activeView === 'schemes') && (
            <>
              <Schemes data={analysis} currentLang={currentLang} />
              <Actions data={analysis} currentLang={currentLang} />
            </>
          )}

          {(activeView === 'overview' || activeView === 'simulation') && (
            <>
              <Simulation data={analysis} currentLang={currentLang} />
              <Goals data={analysis} currentLang={currentLang} />
            </>
          )}
        </div>
      </div>
    </main>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DATA SECTIONS
   ═══════════════════════════════════════════════════════════════════════════════ */
function Credibility({ data, currentLang = 'en' }) {
  const score = data.credibilityScore ?? 100
  const flags = data.credibilityFlags || []
  const isHigh = score >= 80

  return (
    <div className={`credibility-strip ${isHigh ? 'high' : 'warning'}`}>
      <div className="credibility-left">
        <ShieldCheck size={18} color={isHigh ? 'var(--teal)' : 'var(--gold)'} />
        <div>
          <b>{t(currentLang, 'credibilityCheck', 'Data Credibility Check: ')}</b>
          <span>
            {isHigh
              ? t(currentLang, 'credibilityPlausible', 'Input metrics look consistent and plausible.')
              : t(currentLang, 'credibilityWarning', 'Potential inconsistencies detected in input data.')}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="credibility-badge">{score}/100</span>
        {flags.length > 0 && (
          <div className="credibility-flags">
            {flags.map((flag, idx) => (
              <span key={idx} className="flag-tag">
                {flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Overview({ data, profile, currentLang = 'en' }) {
  const m = data.financialMetrics || {}
  const income = m.annual_income ? m.annual_income / 12 : profile?.monthlyIncome
  const expenses = profile?.monthlyExpenses

  return (
    <section className="dash-section overview-section span-2">
      <SectionHeading
        icon={Wallet}
        eyebrow={t(currentLang, 'overviewEyebrow', 'Financial overview')}
        title={t(currentLang, 'overviewTitle', 'The month at a glance')}
      />
      <div className="metric-grid">
        <Metric label={t(currentLang, 'monthlyIncome', 'Monthly income')} value={money(income)} />
        <Metric label={t(currentLang, 'monthlyExpenses', 'Monthly expenses')} value={money(expenses)} />
        <Metric label={t(currentLang, 'metricSurplus', 'Monthly surplus')} value={money(m.monthly_surplus)} accent />
        <Metric
          label={t(currentLang, 'metricRunway', 'Emergency runway')}
          value={
            m.emergency_months != null
              ? `${Number(m.emergency_months).toFixed(1)} ${t(currentLang, 'months', 'mo')}`
              : '—'
          }
        />
        <Metric label={t(currentLang, 'metricDti', 'Debt-to-income')} value={percent(m.dti_ratio)} />
        <Metric label={t(currentLang, 'metricSavings', 'Savings')} value={money(m.savings)} />
        <Metric label={t(currentLang, 'metricDebt', 'Total debt')} value={money(m.total_debt)} />
        <Metric label={t(currentLang, 'metricAnnualIncome', 'Annual income')} value={money(m.annual_income)} />
        <Metric
          label={t(currentLang, 'metricVolatility', 'Income volatility')}
          value={
            m.income_volatility
              ? t(currentLang, 'volatilityVolatile', 'Volatile (gig/farmer)')
              : t(currentLang, 'volatilityStable', 'Stable')
          }
        />
      </div>
    </section>
  )
}

function Metric({ label, value, accent }) {
  return (
    <div className={`metric ${accent ? 'accent' : ''}`}>
      <span>{label}</span>
      <strong>{value || 'Not available'}</strong>
    </div>
  )
}

function Risk({ data, currentLang = 'en' }) {
  const score = data.riskScore ?? 0
  const category = (data.riskCategory || 'unknown').toLowerCase()
  const tagClass = category === 'low' ? 'good' : category === 'high' ? 'danger' : 'moderate'

  return (
    <section className="dash-section risk-section">
      <SectionHeading
        icon={ShieldCheck}
        eyebrow={t(currentLang, 'healthEyebrow', 'Financial health')}
        title={t(currentLang, 'healthTitle', 'Risk, in context')}
      />
      <div className="risk-score">
        <div className="score-ring" style={{ '--score': `${score}%` }}>
          <strong>{data.riskScore ?? '—'}</strong>
          <span>/100</span>
        </div>
        <div>
          <span className={`status-tag ${tagClass}`}>{getLocalizedRiskCategory(category, currentLang)}</span>
          <p>{t(currentLang, 'compositeScoreDesc', 'Composite score from debt, surplus, runway, stability, and savings.')}</p>
        </div>
      </div>
      <div className="factor-list">
        {Object.entries(data.riskBreakdown || {})
          .slice(0, 5)
          .map(([key, value]) => {
            const factorKey =
              key.includes('debt') ? 'scoreDebt'
              : key.includes('emergency') ? 'scoreEmergency'
              : key.includes('income') ? 'scoreIncome'
              : key.includes('surplus') ? 'scoreSurplus'
              : key.includes('investment') ? 'scoreInvestment'
              : key
            return (
              <div key={key}>
                <span>{t(currentLang, factorKey, titleCase(key))}</span>
                <b>{value}/100</b>
                <i>
                  <em style={{ width: `${Math.min(100, Number(value) || 0)}%` }} />
                </i>
              </div>
            )
          })}
      </div>
    </section>
  )
}

function Simulation({ data, currentLang = 'en' }) {
  const paths = data.simulationPaths || {}
  const chartData = useMemo(() => {
    return Array.from({ length: 36 }, (_, index) => {
      const row = { month: index + 1 }
      Object.entries(paths).forEach(([key, path]) => {
        row[key] = path.monthly_data?.[index]?.median ?? null
      })
      return row
    })
  }, [paths])

  return (
    <section className="dash-section span-2 simulation-section">
      <SectionHeading
        icon={TrendingUp}
        eyebrow={t(currentLang, 'simEyebrow', 'Future simulation')}
        title={t(currentLang, 'simTitle', 'Three ways the next 36 months could unfold')}
      />
      <div className="simulation-note">
        <span className="info-dot">i</span> {t(currentLang, 'simNote', 'Modeled via 1,000 Monte Carlo iterations. Scenarios to plan around, not guaranteed predictions.')}
      </div>
      {Object.keys(paths).length ? (
        <>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="accentFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f8ffa" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#4f8ffa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(99,130,180,0.1)" vertical={false} />
                <XAxis dataKey="month" stroke="#6b7da0" tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#6b7da0"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#131829',
                    border: '1px solid rgba(99,130,180,0.2)',
                    borderRadius: 8,
                    color: '#eef1f8',
                  }}
                  formatter={(value) => money(value)}
                  labelFormatter={(label) => `${t(currentLang, 'atMonth', 'Month')} ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="status_quo"
                  stroke="#6b7da0"
                  fill="transparent"
                  strokeWidth={2}
                  name={getLocalizedScenarioName('status_quo', currentLang)}
                />
                <Area
                  type="monotone"
                  dataKey="moderate"
                  stroke="#4f8ffa"
                  fill="url(#accentFill)"
                  strokeWidth={2.5}
                  name={getLocalizedScenarioName('moderate', currentLang)}
                />
                <Area
                  type="monotone"
                  dataKey="optimal"
                  stroke="#f0c866"
                  fill="transparent"
                  strokeWidth={2}
                  name={getLocalizedScenarioName('optimal', currentLang)}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="scenario-stats">
            {['status_quo', 'moderate', 'optimal'].map((key) => {
              const path = paths[key]
              if (!path) return null
              return (
                <div key={key} className="scenario-pill">
                  <span>{getLocalizedScenarioName(key, currentLang)}</span>
                  <b>{money(path.projected_value)}</b>
                  {path.projected_net_worth != null && (
                    <small>{t(currentLang, 'netWorth', 'Net worth')} {money(path.projected_net_worth)}</small>
                  )}
                  {path.success_prob != null && (
                    <small>
                      {Math.round(path.success_prob * 100)}% {t(currentLang, 'goalChance', 'goal chance')}
                      {path.goal_evaluated_at != null ? ` (${t(currentLang, 'atMonth', 'at month')} ${path.goal_evaluated_at})` : ''}
                    </small>
                  )}
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <Empty text="Simulation data is not available yet." />
      )}
    </section>
  )
}

function Scams({ data, currentLang = 'en' }) {
  const scams = data.scamFlags || []
  return (
    <section className="dash-section">
      <SectionHeading
        icon={AlertTriangle}
        eyebrow={t(currentLang, 'scamEyebrow', 'Scam detection')}
        title={t(currentLang, 'scamTitle', 'Stay one step ahead')}
      />
      {scams.length ? (
        scams.map((item, index) => (
          <div className="alert-card" key={index}>
            <AlertTriangle size={18} />
            <div>
              <b>{item.scam_type || item.pattern || 'Potential match'}</b>
              <p>{item.warning || item.evidence || 'Review the retrieved evidence carefully.'}</p>
              <small>Confidence {percent(item.confidence)}</small>
            </div>
          </div>
        ))
      ) : (
        <Empty
          icon={ShieldCheck}
          text={t(currentLang, 'noScamMatch', 'No relevant scam match was returned.')}
          subtle={t(currentLang, 'notSafetyGuarantee', 'That is not a guarantee of safety.')}
        />
      )}
    </section>
  )
}

function Schemes({ data, currentLang = 'en' }) {
  const schemes = data.eligibleSchemes || []
  return (
    <section className="dash-section">
      <SectionHeading
        icon={Landmark}
        eyebrow={t(currentLang, 'schemesEyebrow', 'Government schemes')}
        title={t(currentLang, 'schemesTitle', 'Worth a closer look')}
      />
      {schemes.length ? (
        schemes.map((item, index) => {
          const loc = getLocalizedScheme(item, currentLang)
          return (
            <div className="scheme-row" key={index}>
              <div className="scheme-icon">
                <Landmark size={15} />
              </div>
              <div>
                <b>{loc.name}</b>
                <p>{loc.guide}</p>
                {item.annual_benefit > 0 && (
                  <small style={{ color: 'var(--teal)', fontSize: '10px' }}>
                    {t(currentLang, 'annualBenefit', 'Benefit')}: {money(item.annual_benefit)}
                  </small>
                )}
              </div>
              <span className={`status-tag ${item.eligible ? 'good' : 'pending'}`}>
                {item.eligible ? t(currentLang, 'eligibleBadge', 'Eligible') : t(currentLang, 'potentialBadge', 'Potential')}
              </span>
            </div>
          )
        })
      ) : (
        <Empty text="No scheme matches available." />
      )}
    </section>
  )
}

function Goals({ data, currentLang = 'en' }) {
  return (
    <section className="dash-section">
      <SectionHeading
        icon={Target}
        eyebrow={t(currentLang, 'goalsEyebrow', 'Financial goals')}
        title={t(currentLang, 'goalsTitle', 'What matters to you')}
      />
      {data.goals?.length ? (
        data.goals.map((goal, index) => (
          <div className="goal-row" key={index}>
            <div className="goal-number">0{index + 1}</div>
            <div>
              <b>{getLocalizedGoalTitle(goal.title, currentLang)}</b>
              <p>
                {goal.target_amount != null ? money(goal.target_amount) : t(currentLang, 'targetNotSet', 'Target not set')}{' '}
                {goal.horizon_months != null ? `· ${goal.horizon_months} ${t(currentLang, 'months', 'months')}` : ''}
              </p>
            </div>
            <span className="priority">P{goal.priority ?? '—'}</span>
          </div>
        ))
      ) : (
        <Empty text="No explicit goals were found in your message." />
      )}
    </section>
  )
}

function Narrative({ data, currentLang = 'en' }) {
  return (
    <section className="dash-section span-2 narrative">
      <SectionHeading
        icon={Sparkles}
        eyebrow={t(currentLang, 'explainabilityEyebrow', 'Explainability')}
        title={t(currentLang, 'explainabilityTitle', 'The story in the numbers')}
      />
      {data.decisionCards?.length ? (
        data.decisionCards.map((card, index) => {
          const locCard = getLocalizedDecisionCard(card, currentLang)
          return (
            <div className="narrative-row" key={index}>
              <span>0{index + 1}</span>
              <div>
                <b>{locCard.action}</b>
                <p>{locCard.why}</p>
                {locCard.if_ignored && (
                  <small style={{ color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                    Context: {locCard.if_ignored}
                  </small>
                )}
              </div>
            </div>
          )
        })
      ) : (
        <Empty text="Explanation is not available." />
      )}
    </section>
  )
}

function Actions({ data, currentLang = 'en' }) {
  return (
    <section className="dash-section span-2 actions-section">
      <div className="actions-heading">
        <SectionHeading
          icon={Check}
          eyebrow={t(currentLang, 'coachEyebrow', 'Coach plan')}
          title={t(currentLang, 'coachTitle', 'Your next few moves')}
        />
        <span className="action-count">{data.actionPlan?.length || 0} {t(currentLang, 'actionsCount', 'actions')}</span>
      </div>
      {data.actionPlan?.length ? (
        data.actionPlan.map((item, index) => {
          const locAction = getLocalizedAction(item, currentLang)
          return (
            <div className="action-row" key={index}>
              <span className="action-check">{index + 1}</span>
              <div>
                <b>{locAction.task}</b>
                <p>
                  {item.daily_amount ? `${money(item.daily_amount)} / day · ` : ''}
                  {locAction.deadline || 'When it feels right'}
                  {item.scheme ? ` · ${item.scheme}` : ''}
                </p>
              </div>
            </div>
          )
        })
      ) : (
        <Empty text="Your action plan is not available." />
      )}
    </section>
  )
}

function SectionHeading({ icon: Icon, eyebrow, title }) {
  return (
    <div className="section-heading">
      <div className="section-icon">
        <Icon size={16} />
      </div>
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
    </div>
  )
}

function Empty({ text, subtle, icon: Icon = CircleDollarSign }) {
  return (
    <div className="empty">
      <Icon size={18} />
      <span>
        {text}
        <small>{subtle}</small>
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CHATBOT — Single "Ask FinMate" with STT (Speech-to-Text) & TTS (Text-to-Speech)
   ═══════════════════════════════════════════════════════════════════════════════ */
function Chatbot({ analysis, profile, currentLang = 'en' }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [listening, setListening] = useState(false)
  const [speakingIdx, setSpeakingIdx] = useState(null)
  const [chatLang, setChatLang] = useState(currentLang || 'en')
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (currentLang) setChatLang(currentLang)
  }, [currentLang])

  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text:
        analysis?.finalResponse ||
        'Hi! I\'m your FinMate — ask me anything about your finances. I can help with affordability, investments, risk score, government schemes, and more!',
    },
  ])

  const activeSuggestions = DICTIONARY[chatLang]?.quickPrompts || [
    'Why is my risk score this value?',
    'Can I afford a new EMI?',
    'Where should I invest my surplus?',
    'What government schemes am I eligible for?',
    'How is my emergency fund?',
    'How can I reduce my debt?',
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function toggleSpeak(text, index) {
    if (speakingIdx === index) {
      stopSpeaking()
      setSpeakingIdx(null)
    } else {
      setSpeakingIdx(index)
      speakText(text, () => setSpeakingIdx(null), chatLang)
    }
  }

  async function sendQuestion(questionText, shouldSpeak = false) {
    const q = (questionText || input).trim()
    if (!q || sending) return
    setInput('')
    setSending(true)
    const history = messages.map((message) => ({ role: message.role, text: message.text }))
    setMessages((current) => [...current, { role: 'user', text: q }])
    try {
      const reply = await askSaathi(q, profile, analysis, history, chatLang)
      const replyText = reply || 'I could not generate a response. Please try again.'
      setMessages((current) => [...current, { role: 'bot', text: replyText }])
      if (shouldSpeak) {
        speakText(replyText, () => setSpeakingIdx(null), chatLang)
      }
    } catch {
      setMessages((current) => [...current, { role: 'bot', text: 'Something went wrong. Please try again.' }])
    } finally {
      setSending(false)
    }
  }

  function send(event) {
    if (event) event.preventDefault()
    sendQuestion(input, false)
  }

  function toggleVoiceInput() {
    if (listening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      setListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    const langConfig = getLanguageConfig(chatLang)
    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = langConfig.sttLocale || 'en-IN'
    recognitionRef.current = rec

    rec.onstart = () => {
      stopSpeaking()
      setListening(true)
    }

    rec.onresult = (event) => {
      let speech = ''
      for (let i = 0; i < event.results.length; i++) {
        speech += event.results[i][0].transcript
      }
      if (speech.trim()) {
        sendQuestion(speech, true)
      }
    }

    rec.onerror = () => {
      setListening(false)
    }

    rec.onend = () => {
      setListening(false)
    }

    try {
      rec.start()
    } catch {
      setListening(false)
    }
  }

  function askSuggestion(text) {
    setInput(text)
    setTimeout(() => {
      sendQuestion(text, false)
    }, 100)
  }

  return (
    <div className={`chatbot ${open ? 'open' : ''}`}>
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              <b>{t(chatLang, 'chatHeader', 'Ask FinMate')}</b>
              <small>{t(chatLang, 'chatSubheader', 'Multilingual financial advice with voice & speech')}</small>
            </div>
            <button onClick={() => { stopSpeaking(); setOpen(false) }} aria-label="Close chat">
              <X size={16} />
            </button>
          </div>

          {/* Multilingual Switcher Pills inside chat */}
          <div className="chat-lang-bar">
            <span className="chat-lang-label">{t(chatLang, 'chatLangPrompt', 'Language:')}</span>
            {LANGUAGES.map((item) => (
              <button
                key={item.code}
                type="button"
                className={`chat-lang-chip ${chatLang === item.code ? 'active' : ''}`}
                onClick={() => setChatLang(item.code)}
                title={item.native}
              >
                {item.native}
              </button>
            ))}
          </div>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div className={`chat-message ${message.role}`} key={index}>
                {message.text}
                {message.role === 'bot' && (
                  <button
                    type="button"
                    className={`chat-speak-btn ${speakingIdx === index ? 'active' : ''}`}
                    onClick={() => toggleSpeak(message.text, index)}
                    title={speakingIdx === index ? t(chatLang, 'chatStopAudio', 'Stop audio') : t(chatLang, 'chatListenTTS', 'Listen out loud (TTS)')}
                    aria-label={speakingIdx === index ? 'Stop audio' : 'Listen out loud'}
                  >
                    {speakingIdx === index ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                )}
              </div>
            ))}
            {sending && (
              <div className="chat-thinking">
                <span /><span /><span />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion chips */}
          {messages.length <= 2 && (
            <div className="chat-chips">
              {activeSuggestions.map((s, i) => (
                <button key={i} className="chat-chip" onClick={() => askSuggestion(s)} type="button">
                  {s}
                </button>
              ))}
            </div>
          )}

          <form className="chat-form" onSubmit={send}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={listening ? t(chatLang, 'chatListening', 'Listening to your voice…') : t(chatLang, 'chatPlaceholder', 'Ask anything in your language…')}
              aria-label="Ask a financial question"
            />
            <button
              type="button"
              className={`chat-mic ${listening ? 'listening' : ''}`}
              onClick={toggleVoiceInput}
              title={listening ? "Listening... click to stop" : "Speak question (STT)"}
              aria-label={listening ? "Stop voice listening" : "Start voice listening"}
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button className="chat-send" aria-label="Send question" disabled={sending}>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}
      <button
        className="chat-launcher"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open financial chat"
      >
        <MessageCircle size={18} />
        <span>{open ? 'Close' : t(currentLang, 'chatHeader', 'Ask FinMate')}</span>
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   VOICE — Full-Duplex Voice Assistant (STT Speech Recognition + TTS Audio Output)
   ═══════════════════════════════════════════════════════════════════════════════ */
function Voice({ analysis, profile, currentLang = 'en', onBack }) {
  const [status, setStatus] = useState('ready') // 'ready' | 'listening' | 'processing' | 'speaking' | 'error'
  const [message, setMessage] = useState('')
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [voiceLang, setVoiceLang] = useState(currentLang || 'en')
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (currentLang) setVoiceLang(currentLang)
  }, [currentLang])

  function speakReply(text, lang = voiceLang) {
    setStatus('speaking')
    speakText(text, () => {
      setStatus('ready')
    }, lang)
  }

  function handleVoiceInput(query) {
    const q = query.trim()
    if (!q) {
      setStatus('ready')
      return
    }
    setStatus('processing')
    setMessage('')
    askSaathi(q, profile || {}, analysis || {}, [], voiceLang)
      .then((reply) => {
        const text = reply || 'I reviewed your financial profile and metrics, but was unable to generate a response. Please ask again.'
        setResponse(text)
        speakReply(text, voiceLang)
      })
      .catch(() => {
        setStatus('error')
        setMessage('Could not connect to the analysis engine. Please try again.')
      })
  }

  function startBrowserVoice() {
    stopSpeaking()
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMessage('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      setStatus('error')
      return
    }

    const langConfig = getLanguageConfig(voiceLang)
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = langConfig.sttLocale || 'en-IN'
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setStatus('listening')
      setTranscript('')
      setResponse('')
      setMessage('')
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript
      }
      setTranscript(finalTranscript)
    }

    recognition.onerror = (event) => {
      setStatus('error')
      setMessage(`Microphone error: ${event.error}`)
    }

    recognition.onend = () => {
      setTranscript((captured) => {
        if (captured && captured.trim()) {
          handleVoiceInput(captured)
        } else {
          setStatus('ready')
        }
        return captured
      })
    }

    try {
      recognition.start()
    } catch {
      setStatus('error')
      setMessage('Could not start microphone. Please check browser permissions.')
    }
  }

  function stop() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    stopSpeaking()
    setStatus('ready')
  }

  function reListen() {
    if (response) {
      speakReply(response, voiceLang)
    }
  }

  return (
    <main className="voice-page page-enter">
      <button className="back-button" onClick={() => { stopSpeaking(); onBack(); }}>
        <ChevronLeft size={18} /> {t(voiceLang, 'voiceCloseBtn', 'Back to Dashboard')}
      </button>
      <div className="voice-card">
        <div className={`voice-orb ${status}`}>
          {status === 'listening' ? (
            <Mic size={32} />
          ) : status === 'speaking' ? (
            <Volume2 size={32} />
          ) : status === 'processing' ? (
            <LoaderCircle className="spin" size={32} />
          ) : (
            <MicOff size={32} />
          )}
        </div>
        <div className="eyebrow">{t(voiceLang, 'voiceTitle', 'Interactive Voice Assistant')}</div>
        <h1>
          {voiceLang === 'hi' ? 'बोलकर बात करें' : voiceLang === 'mr' ? 'बोलून संवाद साधा' : voiceLang === 'bn' ? 'কথা বলে আলোচনা করুন' : voiceLang === 'pa' ? 'ਬੋਲ ਕੇ ਗੱਲਬਾਤ ਕਰੋ' : 'Talk it through'}
          <br />
          <em>with FinMate.</em>
        </h1>
        <p>
          {t(voiceLang, 'voiceSubtitle', 'Speak naturally in any Indian language. FinMate will listen and speak back with tailored guidance.')}
        </p>

        {/* Multilingual Selector Chips for Voice */}
        <div className="voice-lang-bar">
          {LANGUAGES.map((item) => (
            <button
              key={item.code}
              type="button"
              className={`voice-lang-chip ${voiceLang === item.code ? 'active' : ''}`}
              onClick={() => {
                stop()
                setVoiceLang(item.code)
              }}
            >
              <span>{item.native}</span>
            </button>
          ))}
        </div>

        <div className={`voice-status ${status}`}>
          <span />{' '}
          {status === 'ready'
            ? t(voiceLang, 'voiceReady', 'Ready — Click the microphone to speak')
            : status === 'listening'
            ? t(voiceLang, 'voiceListening', 'Listening… speak now')
            : status === 'processing'
            ? t(voiceLang, 'voiceProcessing', 'Analyzing your query with FinMate agents…')
            : status === 'speaking'
            ? t(voiceLang, 'voiceSpeaking', 'FinMate is speaking…')
            : 'Microphone issue'}
        </div>

        {transcript && (
          <div className="narrative-box" style={{ textAlign: 'left', marginBottom: '16px' }}>
            <div className="section-kicker" style={{ marginBottom: '6px' }}>{t(voiceLang, 'voiceTranscriptLabel', 'You Said:')}</div>
            <p style={{ margin: 0, color: 'var(--text)', fontWeight: 500 }}>{transcript}</p>
          </div>
        )}

        {response && (
          <div className="narrative-box" style={{ textAlign: 'left', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div className="section-kicker">{t(voiceLang, 'voiceResponseLabel', 'FinMate Replied:')}</div>
              <button
                type="button"
                className="secondary-button"
                style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={status === 'speaking' ? stop : reListen}
              >
                {status === 'speaking' ? <VolumeX size={13} /> : <Volume2 size={13} />}
                {status === 'speaking' ? t(voiceLang, 'voiceStopBtn', 'Stop Audio') : t(voiceLang, 'voiceReListenBtn', 'Listen Again')}
              </button>
            </div>
            <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{response}</p>
          </div>
        )}

        {message && (
          <div className="error-box" style={{ textAlign: 'left', marginBottom: '16px' }}>
            <AlertTriangle size={16} /> {message}
          </div>
        )}

        {status === 'listening' || status === 'speaking' ? (
          <button className="secondary-button voice-stop" onClick={stop}>
            <X size={17} /> {status === 'speaking' ? t(voiceLang, 'voiceStopBtn', 'Stop Audio') : t(voiceLang, 'chatListening', 'Stop listening')}
          </button>
        ) : (
          <button
            className="primary-button"
            onClick={startBrowserVoice}
            disabled={status === 'processing'}
          >
            {status === 'processing' ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Mic size={17} />
            )}{' '}
            {status === 'processing' ? t(voiceLang, 'voiceProcessing', 'Analyzing with Gemini…') : t(voiceLang, 'voiceStartBtn', 'Start Speaking')}
          </button>
        )}

        <small className="voice-note">
          Full duplex multilingual voice: Speech-to-Text (STT) + Gemini AI analysis + Text-to-Speech (TTS).
        </small>
      </div>
    </main>
  )
}

export default App
