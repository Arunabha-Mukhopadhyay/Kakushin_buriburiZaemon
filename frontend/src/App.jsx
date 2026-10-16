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

/* ─── Web Speech TTS Helpers ─────────────────────────────────────────────────── */
function speakText(text, onEnd) {
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
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.lang = 'en-IN'
  utterance.rate = 1.0
  utterance.pitch = 1.0
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
      preferredLang: profile.preferredLang || 'en',
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
                ? 'Connecting…'
                : backendStatus.online
                ? 'Agents live'
                : 'Agents offline'}
            </span>
          )}

          {/* Mode Switcher */}
          <button
            type="button"
            className={`mode-toggle-btn ${mockActive ? 'mock' : 'live'}`}
            onClick={toggleMockMode}
            title={mockActive ? 'Switch to Live FastAPI Backend' : 'Switch to Demo Mock Mode'}
          >
            <Radio size={12} />
            <span>{mockActive ? 'Demo mode' : 'Live analysis'}</span>
          </button>
        </div>
      </header>

      {screen === 'welcome' && (
        <Welcome
          onStart={(focus = 'overview') => {
            setFocusView(focus)
            setScreen('onboarding')
          }}
          mockActive={mockActive}
          backendOnline={backendStatus.online}
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
          onSwitchToMock={() => {
            setMockMode(true)
            setMockActive(true)
            submitProfile(null, true)
          }}
        />
      )}
      {screen === 'loading' && <Loading mockActive={mockActive} />}
      {screen === 'dashboard' && (
        <Dashboard
          analysis={analysis}
          profile={profile}
          mockActive={mockActive}
          initialFocus={focusView}
          onVoice={() => setScreen('voice')}
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
          onBack={() => setScreen(analysis ? 'dashboard' : 'welcome')}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   WELCOME
   ═══════════════════════════════════════════════════════════════════════════════ */
function Welcome({ onStart, mockActive, backendOnline }) {
  return (
    <main className="welcome page-enter">
      <div className="welcome-copy">
        <div className="eyebrow">
          <span className="eyebrow-dot" /> AI-Powered Financial Companion
        </div>
        <h1>
          Your money, <em>decoded.</em>
        </h1>
        <p className="hero-text">
          Get a complete financial health check in under 30 seconds — risk scoring,
          smart scheme matching, and 36-month future projections.
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
              <b>Risk Analysis</b>
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
              <b>Scheme Matching</b>
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
              <b>Future Simulation</b>
              <span>1,000 Monte Carlo paths &rarr;</span>
            </div>
          </button>
        </div>

        <button className="primary-button hero-button" onClick={() => onStart('overview')}>
          Start complete analysis <ArrowRight size={18} />
        </button>
        <div className="trust-line">
          <ShieldCheck size={14} /> No sign-up required · 100% private
          {!mockActive && backendOnline && (
            <span style={{ color: 'var(--teal)', marginLeft: '10px' }}>
              · Agents online
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
        <span>Groq LLM Powered</span>
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
          <ChevronLeft size={18} /> Back
        </button>
        <div className="eyebrow">
          {focusView === 'risk' && 'Selected Focus: Risk Analysis'}
          {focusView === 'schemes' && 'Selected Focus: Scheme Matching'}
          {focusView === 'simulation' && 'Selected Focus: Future Simulation'}
          {(!focusView || focusView === 'overview') && 'Your starting point'}
        </div>
        <h1>
          Let's put your money
          <br />
          <em>in context.</em>
        </h1>
        <p>A few honest numbers are enough to begin. You can leave optional details blank.</p>
      </div>
      <div className="form-panel">
        <div className="stepper">
          <span className={step >= 1 ? 'active' : ''}>
            01 <b>Snapshot</b>
          </span>
          <i />
          <span className={step >= 2 ? 'active' : ''}>
            02 <b>Context</b>
          </span>
          <i />
          <span className={step >= 3 ? 'active' : ''}>
            03 <b>Goals</b>
          </span>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e) }}>
          {step === 1 && (
            <section className="form-step">
              <div className="section-kicker">The essentials</div>
              <h2>What does your month look like?</h2>
              <div className="field-grid">
                <Field
                  label="Monthly income"
                  name="monthlyIncome"
                  value={profile.monthlyIncome}
                  update={update}
                  required
                  prefix="₹"
                />
                <Field
                  label="Monthly expenses"
                  name="monthlyExpenses"
                  value={profile.monthlyExpenses}
                  update={update}
                  required
                  prefix="₹"
                />
                <Field
                  label="Monthly EMI / debt payments"
                  name="monthlyEmi"
                  value={profile.monthlyEmi}
                  update={update}
                  prefix="₹"
                />
                <Field
                  label="Current savings"
                  name="existingSavings"
                  value={profile.existingSavings}
                  update={update}
                  prefix="₹"
                />
                <Field
                  label="Existing debt"
                  name="existingDebt"
                  value={profile.existingDebt}
                  update={update}
                  prefix="₹"
                />
                <Field
                  label="People financially dependent on you"
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
                  label="Preferred language"
                  name="preferredLang"
                  value={profile.preferredLang}
                  update={update}
                  options={[
                    ['en', 'English'],
                    ['hi', 'Hindi / Hinglish'],
                    ['mr', 'Marathi'],
                    ['kn', 'Kannada'],
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
                Back
              </button>
            )}
            {step < 3 ? (
              <button type="button" className="primary-button" onClick={next}>
                Continue <ArrowRight size={17} />
              </button>
            ) : (
              <button type="submit" className="primary-button">
                Analyze my picture <ArrowRight size={17} />
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
function Loading({ mockActive }) {
  return (
    <main className="loading page-enter">
      <div className="loader-mark">
        <LoaderCircle size={42} />
      </div>
      <div className="eyebrow">Working through your picture</div>
      <h1>
        Finding the useful
        <br />
        <em>signal.</em>
      </h1>
      <p>
        {mockActive
          ? 'Generating simulated profile analysis…'
          : 'Running credibility checks, parallel agents, Monte Carlo simulation, and language adaptation…'}
      </p>
      <div className="loading-track">
        <span />
      </div>
      <small>{mockActive ? 'Just a second…' : 'Agent pipeline takes about 5 to 15 seconds.'}</small>
    </main>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DASHBOARD — Unified layout, single chatbot, no duplicate voice buttons
   ═══════════════════════════════════════════════════════════════════════════════ */
function Dashboard({ analysis, profile, mockActive, initialFocus = 'overview', onVoice, onNew }) {
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
          <BarChart3 size={16} /> All Insights
        </button>
        <button
          className={activeView === 'risk' ? 'side-link active' : 'side-link'}
          onClick={() => setActiveView('risk')}
        >
          <ShieldCheck size={16} /> Risk Analysis
        </button>
        <button
          className={activeView === 'schemes' ? 'side-link active' : 'side-link'}
          onClick={() => setActiveView('schemes')}
        >
          <Landmark size={16} /> Scheme Matching
        </button>
        <button
          className={activeView === 'simulation' ? 'side-link active' : 'side-link'}
          onClick={() => setActiveView('simulation')}
        >
          <TrendingUp size={16} /> Future Simulation
        </button>
        <button
          className="side-link"
          onClick={onVoice}
        >
          <Mic size={16} /> Voice Assistant
        </button>
        <div className="sidebar-bottom">
          <div className="mode-pill">
            <span className="live-dot" /> {mockActive ? 'Demo mode' : 'Live agent analysis'}
          </div>
          <button className="new-analysis" onClick={onNew}>
            Start new analysis <ArrowRight size={14} />
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
            <BarChart3 size={13} /> All Data
          </button>
          <button
            type="button"
            className={`view-pill ${activeView === 'risk' ? 'active' : ''}`}
            onClick={() => setActiveView('risk')}
          >
            <ShieldCheck size={13} /> Risk Analysis Only
          </button>
          <button
            type="button"
            className={`view-pill ${activeView === 'schemes' ? 'active' : ''}`}
            onClick={() => setActiveView('schemes')}
          >
            <Landmark size={13} /> Scheme Matching Only
          </button>
          <button
            type="button"
            className={`view-pill ${activeView === 'simulation' ? 'active' : ''}`}
            onClick={() => setActiveView('simulation')}
          >
            <TrendingUp size={13} /> Future Simulation Only
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
              <span>Health Score</span>
            </div>
            <div className="hero-stat">
              <strong className="hero-stat-value">{money(m.monthly_surplus)}</strong>
              <span>Monthly Surplus</span>
            </div>
            <div className="hero-stat">
              <strong className="hero-stat-value">
                {m.emergency_months != null ? `${Number(m.emergency_months).toFixed(1)} mo` : '—'}
              </strong>
              <span>Emergency Runway</span>
            </div>
            <div className="hero-stat">
              <strong className="hero-stat-value">{percent(m.dti_ratio)}</strong>
              <span>Debt-to-Income</span>
            </div>
          </div>
        </div>

        {/* Credibility engine score and flags */}
        {(activeView === 'overview' || activeView === 'risk') && (
          <Credibility data={analysis} />
        )}

        {/* Accessibility narrative generated by Accessibility Agent */}
        {analysis.finalResponse && (activeView === 'overview' || activeView === 'risk') && (
          <div className="narrative-box">
            <div className="section-kicker" style={{ marginBottom: '8px' }}>
              <Sparkles size={14} style={{ marginRight: '6px' }} />
              FinMate's Personalized Assessment
            </div>
            <p>{analysis.finalResponse}</p>
          </div>
        )}

        <div className="dashboard-grid">
          {(activeView === 'overview' || activeView === 'risk') && (
            <>
              <Overview data={analysis} profile={profile} />
              <Risk data={analysis} />
              <Scams data={analysis} />
              <Narrative data={analysis} />
            </>
          )}

          {(activeView === 'overview' || activeView === 'schemes') && (
            <>
              <Schemes data={analysis} />
              <Actions data={analysis} />
            </>
          )}

          {(activeView === 'overview' || activeView === 'simulation') && (
            <>
              <Simulation data={analysis} />
              <Goals data={analysis} />
            </>
          )}
        </div>
      </div>

      <Chatbot analysis={analysis} profile={profile} />
    </main>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DATA SECTIONS
   ═══════════════════════════════════════════════════════════════════════════════ */
function Credibility({ data }) {
  const score = data.credibilityScore ?? 100
  const flags = data.credibilityFlags || []
  const isHigh = score >= 80

  return (
    <div className={`credibility-strip ${isHigh ? 'high' : 'warning'}`}>
      <div className="credibility-left">
        <ShieldCheck size={18} color={isHigh ? 'var(--teal)' : 'var(--gold)'} />
        <div>
          <b>Data Credibility Check: </b>
          <span>
            {isHigh
              ? 'Input metrics look consistent and plausible.'
              : 'Potential inconsistencies detected in input data.'}
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

function Overview({ data, profile }) {
  const m = data.financialMetrics || {}
  const income = m.annual_income ? m.annual_income / 12 : profile?.monthlyIncome
  const expenses = profile?.monthlyExpenses

  return (
    <section className="dash-section overview-section span-2">
      <SectionHeading icon={Wallet} eyebrow="Financial overview" title="The month at a glance" />
      <div className="metric-grid">
        <Metric label="Monthly income" value={money(income)} />
        <Metric label="Monthly expenses" value={money(expenses)} />
        <Metric label="Monthly surplus" value={money(m.monthly_surplus)} accent />
        <Metric
          label="Emergency runway"
          value={
            m.emergency_months != null ? `${Number(m.emergency_months).toFixed(1)} mo` : 'Not available'
          }
        />
        <Metric label="Debt-to-income" value={percent(m.dti_ratio)} />
        <Metric label="Savings" value={money(m.savings)} />
        <Metric label="Total debt" value={money(m.total_debt)} />
        <Metric label="Annual income" value={money(m.annual_income)} />
        <Metric
          label="Income volatility"
          value={m.income_volatility ? 'Volatile (gig/farmer)' : 'Stable'}
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

function Risk({ data }) {
  const score = data.riskScore ?? 0
  const category = (data.riskCategory || 'unknown').toLowerCase()
  const tagClass = category === 'low' ? 'good' : category === 'high' ? 'danger' : 'moderate'

  return (
    <section className="dash-section risk-section">
      <SectionHeading icon={ShieldCheck} eyebrow="Financial health" title="Risk, in context" />
      <div className="risk-score">
        <div className="score-ring" style={{ '--score': `${score}%` }}>
          <strong>{data.riskScore ?? '—'}</strong>
          <span>/100</span>
        </div>
        <div>
          <span className={`status-tag ${tagClass}`}>{titleCase(category)} risk</span>
          <p>Composite score from debt, surplus, runway, stability, and savings.</p>
        </div>
      </div>
      <div className="factor-list">
        {Object.entries(data.riskBreakdown || {})
          .slice(0, 5)
          .map(([key, value]) => (
            <div key={key}>
              <span>{titleCase(key)}</span>
              <b>{value}/100</b>
              <i>
                <em style={{ width: `${Math.min(100, Number(value) || 0)}%` }} />
              </i>
            </div>
          ))}
      </div>
    </section>
  )
}

function Simulation({ data }) {
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
        eyebrow="Future simulation"
        title="Three ways the next 36 months could unfold"
      />
      <div className="simulation-note">
        <span className="info-dot">i</span> Modeled via 1,000 Monte Carlo iterations. Scenarios to plan
        around, not guaranteed predictions.
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
                  labelFormatter={(label) => `Month ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="status_quo"
                  stroke="#6b7da0"
                  fill="transparent"
                  strokeWidth={2}
                  name="Status quo"
                />
                <Area
                  type="monotone"
                  dataKey="moderate"
                  stroke="#4f8ffa"
                  fill="url(#accentFill)"
                  strokeWidth={2.5}
                  name="Moderate"
                />
                <Area
                  type="monotone"
                  dataKey="optimal"
                  stroke="#f0c866"
                  fill="transparent"
                  strokeWidth={2}
                  name="Optimal"
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
                  <span>{titleCase(key)}</span>
                  <b>{money(path.projected_value)}</b>
                  {path.projected_net_worth != null && (
                    <small>Net worth {money(path.projected_net_worth)}</small>
                  )}
                  {path.success_prob != null && (
                    <small>
                      {Math.round(path.success_prob * 100)}% goal chance
                      {path.goal_evaluated_at != null ? ` at month ${path.goal_evaluated_at}` : ''}
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

function Scams({ data }) {
  const scams = data.scamFlags || []
  return (
    <section className="dash-section">
      <SectionHeading icon={AlertTriangle} eyebrow="Scam detection" title="Stay one step ahead" />
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
          text="No relevant scam match was returned."
          subtle="That is not a guarantee of safety."
        />
      )}
    </section>
  )
}

function Schemes({ data }) {
  const schemes = data.eligibleSchemes || []
  return (
    <section className="dash-section">
      <SectionHeading icon={Landmark} eyebrow="Government schemes" title="Worth a closer look" />
      {schemes.length ? (
        schemes.map((item, index) => (
          <div className="scheme-row" key={index}>
            <div className="scheme-icon">
              <Landmark size={15} />
            </div>
            <div>
              <b>{item.name}</b>
              <p>{item.gap || item.how_to_apply || 'Supporting information available.'}</p>
              {item.annual_benefit > 0 && (
                <small style={{ color: 'var(--teal)', fontSize: '10px' }}>
                  Benefit: {money(item.annual_benefit)}
                </small>
              )}
            </div>
            <span className={`status-tag ${item.eligible ? 'good' : 'pending'}`}>
              {item.eligibility_status || (item.eligible ? 'Eligible' : 'Potential')}
            </span>
          </div>
        ))
      ) : (
        <Empty text="No scheme matches available." />
      )}
    </section>
  )
}

function Goals({ data }) {
  return (
    <section className="dash-section">
      <SectionHeading icon={Target} eyebrow="Financial goals" title="What matters to you" />
      {data.goals?.length ? (
        data.goals.map((goal, index) => (
          <div className="goal-row" key={index}>
            <div className="goal-number">0{index + 1}</div>
            <div>
              <b>{goal.title}</b>
              <p>
                {goal.target_amount != null ? money(goal.target_amount) : 'Target not set'}{' '}
                {goal.horizon_months != null ? `· ${goal.horizon_months} months` : ''}
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

function Narrative({ data }) {
  return (
    <section className="dash-section span-2 narrative">
      <SectionHeading icon={Sparkles} eyebrow="Explainability" title="The story in the numbers" />
      {data.decisionCards?.length ? (
        data.decisionCards.map((card, index) => (
          <div className="narrative-row" key={index}>
            <span>0{index + 1}</span>
            <div>
              <b>{card.action}</b>
              <p>{card.why}</p>
              {card.if_ignored && (
                <small style={{ color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                  Context: {card.if_ignored}
                </small>
              )}
            </div>
          </div>
        ))
      ) : (
        <Empty text="Explanation is not available." />
      )}
    </section>
  )
}

function Actions({ data }) {
  return (
    <section className="dash-section span-2 actions-section">
      <div className="actions-heading">
        <SectionHeading icon={Check} eyebrow="Coach plan" title="Your next few moves" />
        <span className="action-count">{data.actionPlan?.length || 0} actions</span>
      </div>
      {data.actionPlan?.length ? (
        data.actionPlan.map((item, index) => (
          <div className="action-row" key={index}>
            <span className="action-check">{index + 1}</span>
            <div>
              <b>{item.task}</b>
              <p>
                {item.daily_amount ? `${money(item.daily_amount)} / day · ` : ''}
                {item.deadline || 'When it feels right'}
                {item.scheme ? ` · ${item.scheme}` : ''}
              </p>
            </div>
          </div>
        ))
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
function Chatbot({ analysis, profile }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [listening, setListening] = useState(false)
  const [speakingIdx, setSpeakingIdx] = useState(null)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text:
        analysis?.finalResponse ||
        'Hi! I\'m your FinMate — ask me anything about your finances. I can help with affordability, investments, risk score, government schemes, and more!',
    },
  ])

  const suggestions = [
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
      speakText(text, () => setSpeakingIdx(null))
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
      const reply = await askSaathi(q, profile, analysis, history)
      const replyText = reply || 'I could not generate a response. Please try again.'
      setMessages((current) => [...current, { role: 'bot', text: replyText }])
      if (shouldSpeak) {
        speakText(replyText, () => setSpeakingIdx(null))
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

    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-IN'
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
              <b>Ask FinMate</b>
              <small>AI-powered answers with voice & speech</small>
            </div>
            <button onClick={() => { stopSpeaking(); setOpen(false) }} aria-label="Close chat">
              <X size={16} />
            </button>
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
                    title={speakingIdx === index ? 'Stop audio' : 'Listen out loud (TTS)'}
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
          {/* Suggestion chips — show only when few messages */}
          {messages.length <= 2 && (
            <div className="chat-chips">
              {suggestions.map((s, i) => (
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
              placeholder={listening ? "Listening to your voice..." : "Ask about your finances…"}
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
        <span>{open ? 'Close' : 'Ask FinMate'}</span>
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   VOICE — Full-Duplex Voice Assistant (STT Speech Recognition + TTS Audio Output)
   ═══════════════════════════════════════════════════════════════════════════════ */
function Voice({ analysis, profile, onBack }) {
  const [status, setStatus] = useState('ready') // 'ready' | 'listening' | 'processing' | 'speaking' | 'error'
  const [message, setMessage] = useState('')
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const recognitionRef = useRef(null)

  function speakReply(text) {
    setStatus('speaking')
    speakText(text, () => {
      setStatus('ready')
    })
  }

  function handleVoiceInput(query) {
    const q = query.trim()
    if (!q) {
      setStatus('ready')
      return
    }
    setStatus('processing')
    setMessage('')
    askSaathi(q, profile || {}, analysis || {}, [])
      .then((reply) => {
        const text = reply || 'I reviewed your financial profile and metrics, but was unable to generate a response. Please ask again.'
        setResponse(text)
        speakReply(text)
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

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-IN'
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
      // When user stops speaking, process the captured transcript
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
      speakReply(response)
    }
  }

  return (
    <main className="voice-page page-enter">
      <button className="back-button" onClick={() => { stopSpeaking(); onBack(); }}>
        <ChevronLeft size={18} /> Back to your picture
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
        <div className="eyebrow">Interactive Voice Assistant</div>
        <h1>
          Talk it through
          <br />
          <em>with FinMate.</em>
        </h1>
        <p>
          Ask anything about your financial analysis aloud. FinMate listens with Speech-to-Text (STT)
          and answers aloud with Text-to-Speech (TTS).
        </p>
        <div className={`voice-status ${status}`}>
          <span />{' '}
          {status === 'ready'
            ? 'Ready to listen'
            : status === 'listening'
            ? 'Listening to you…'
            : status === 'processing'
            ? 'Analyzing your finances…'
            : status === 'speaking'
            ? 'FinMate is speaking…'
            : 'Microphone issue'}
        </div>

        {transcript && (
          <div className="narrative-box" style={{ textAlign: 'left', marginBottom: '16px' }}>
            <div className="section-kicker" style={{ marginBottom: '6px' }}>You asked:</div>
            <p style={{ margin: 0, color: 'var(--text)', fontWeight: 500 }}>{transcript}</p>
          </div>
        )}

        {response && (
          <div className="narrative-box" style={{ textAlign: 'left', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div className="section-kicker">FinMate's Analysis:</div>
              <button
                type="button"
                className="secondary-button"
                style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={status === 'speaking' ? stop : reListen}
              >
                {status === 'speaking' ? <VolumeX size={13} /> : <Volume2 size={13} />}
                {status === 'speaking' ? 'Mute audio' : 'Play audio (TTS)'}
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
            <X size={17} /> {status === 'speaking' ? 'Stop audio' : 'Stop listening'}
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
            {status === 'processing' ? 'Analyzing with Groq…' : 'Start speaking'}
          </button>
        )}

        <small className="voice-note">
          Full duplex voice: Browser STT (voice input) + Groq AI analysis + Browser TTS (voice audio output).
        </small>
      </div>
    </main>
  )
}

export default App
