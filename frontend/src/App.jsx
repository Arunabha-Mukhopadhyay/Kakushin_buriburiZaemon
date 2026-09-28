import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  ChevronLeft,
  CircleDollarSign,
  Headphones,
  Landmark,
  LoaderCircle,
  Mic,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
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
  checkBackendStatus,
  getVoiceToken,
  isMockMode,
  setMockMode,
} from './services/api'
import { money, percent, titleCase } from './utils/format'

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

function App() {
  const [screen, setScreen] = useState('welcome')
  const [profile, setProfile] = useState(initialProfile)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [mockActive, setMockActive] = useState(isMockMode())
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true })

  // Probe backend health on mount and periodically
  useEffect(() => {
    let mounted = true
    async function verifyBackend() {
      const status = await checkBackendStatus()
      if (mounted) {
        setBackendStatus({ online: status.online, checking: false, url: status.url })
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

    // Sanitize payload strictly according to backend FinancialProfileInput schema
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
        <button className="brand" onClick={() => setScreen('welcome')} aria-label="Go to ArthSaathi home">
          <span className="brand-mark">A</span>
          <span>
            Arth<span>Saathi</span>
          </span>
        </button>

        <div className="header-actions">
          {/* Connection status pill */}
          {!mockActive && (
            <span
              className={`conn-pill ${backendStatus.online ? 'online' : 'offline'}`}
              title={
                backendStatus.online
                  ? 'Connected to FastAPI Agent Service (port 8000)'
                  : 'FastAPI Agent Service not detected on port 8000'
              }
            >
              <span className="conn-dot" />
              {backendStatus.checking
                ? 'Connecting…'
                : backendStatus.online
                ? 'Backend live'
                : 'Backend offline'}
            </span>
          )}

          {/* Mode Switcher */}
          <button
            type="button"
            className={`mode-toggle-btn ${mockActive ? 'mock' : 'live'}`}
            onClick={toggleMockMode}
            title={mockActive ? 'Switch to Live FastAPI Backend' : 'Switch to Demo Mock Mode'}
          >
            <Radio size={13} />
            <span>{mockActive ? 'Demo mode' : 'Live analysis'}</span>
          </button>

          {analysis && (
            <button className="header-voice" onClick={() => setScreen('voice')}>
              <Mic size={16} /> Talk to Saathi
            </button>
          )}
        </div>
      </header>

      {screen === 'welcome' && (
        <Welcome
          onStart={() => setScreen('onboarding')}
          mockActive={mockActive}
          backendOnline={backendStatus.online}
        />
      )}
      {screen === 'onboarding' && (
        <Onboarding
          profile={profile}
          update={update}
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
          onVoice={() => setScreen('voice')}
          onNew={() => {
            setProfile(initialProfile)
            setAnalysis(null)
            setScreen('onboarding')
          }}
        />
      )}
      {screen === 'voice' && <Voice onBack={() => setScreen(analysis ? 'dashboard' : 'welcome')} />}
    </div>
  )
}

function Welcome({ onStart, mockActive, backendOnline }) {
  return (
    <main className="welcome page-enter">
      <div className="welcome-copy">
        <div className="eyebrow">
          <span className="eyebrow-dot" /> Your money, made clearer
        </div>
        <h1>
          A calmer way to make sense of your <em>money.</em>
        </h1>
        <p className="hero-text">
          ArthSaathi combines deterministic financial calculations, risk scoring, scam detection,
          government scheme matching, and 36-month future simulations into one grounded view.
        </p>
        <button className="primary-button hero-button" onClick={onStart}>
          Get started <ArrowRight size={18} />
        </button>
        <div className="trust-line">
          <ShieldCheck size={16} /> Built around your numbers, not promises
          {!mockActive && backendOnline && (
            <span style={{ color: 'var(--green)', marginLeft: '12px' }}>
              · Connected to Python Agent pipeline
            </span>
          )}
        </div>
      </div>
      <div className="welcome-orbit" aria-hidden="true">
        <div className="orbit-ring ring-one" />
        <div className="orbit-ring ring-two" />
        <div className="orbit-core">
          <CircleDollarSign size={36} />
          <span>
            Clarity
            <br />
            <b>starts here</b>
          </span>
        </div>
        <div className="orbit-chip chip-one">
          <TrendingUp size={15} /> Future scenarios
        </div>
        <div className="orbit-chip chip-two">
          <ShieldCheck size={15} /> Safer decisions
        </div>
        <div className="orbit-chip chip-three">
          <Target size={15} /> Your goals
        </div>
      </div>
      <div className="welcome-foot">
        <span>Financial health</span>
        <span>Risk awareness</span>
        <span>Actionable next steps</span>
      </div>
    </main>
  )
}

function Onboarding({
  profile,
  update,
  onBack,
  onSubmit,
  error,
  mockActive,
  backendOnline,
  onSwitchToMock,
}) {
  const [step, setStep] = useState(1)
  const next = () => setStep((value) => Math.min(value + 1, 3))

  return (
    <main className="onboarding page-enter">
      <div className="form-intro">
        <button className="back-button" onClick={onBack}>
          <ChevronLeft size={18} /> Back
        </button>
        <div className="eyebrow">Your starting point</div>
        <h1>
          Let’s put your money
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
            03 <b>Focus</b>
          </span>
        </div>
        <form onSubmit={(e) => onSubmit(e, false)}>
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
                <Field
                  label="Business / work type"
                  name="businessType"
                  value={profile.businessType}
                  update={update}
                  type="text"
                />
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
              <div className="section-kicker">Your focus</div>
              <h2>What would you like help with?</h2>
              <label className="full-field">
                <span>
                  Your message or financial goal <small>Optional</small>
                </span>
                <textarea
                  value={profile.userMessage}
                  onChange={(event) => update('userMessage', event.target.value)}
                  placeholder="For example: I want to build an emergency fund of 2 lakhs or buy a house in five years."
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
                  <b>Ready when you are.</b> We’ll analyze credibility, metrics, risk factors, schemes,
                  and 36-month scenarios.
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

function Loading({ mockActive }) {
  return (
    <main className="loading page-enter">
      <div className="loader-mark">
        <LoaderCircle size={44} />
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

function Dashboard({ analysis, profile, mockActive, onVoice, onNew }) {
  const [activeView, setActiveView] = useState('overview')

  return (
    <main className="dashboard page-enter">
      <aside className="sidebar">
        <div className="side-label">YOUR SAATHI</div>
        <button
          className={activeView === 'overview' ? 'side-link active' : 'side-link'}
          onClick={() => setActiveView('overview')}
        >
          <BarChart3 size={17} /> Overview
        </button>
        <button
          className={activeView === 'voice' ? 'side-link active' : 'side-link'}
          onClick={onVoice}
        >
          <Mic size={17} /> Voice assistant
        </button>
        <div className="sidebar-bottom">
          <div className="mode-pill">
            <span className="live-dot" /> {mockActive ? 'Demo mode' : 'Live agent analysis'}
          </div>
          <button className="new-analysis" onClick={onNew}>
            Start new analysis <ArrowRight size={15} />
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <div className="dashboard-heading">
          <div>
            <div className="eyebrow">Your financial picture</div>
            <h1>
              Good morning, <em>Saathi.</em>
            </h1>
            <p>
              Here’s the signal in your numbers, computed and explained.
              {analysis?.latencyMs && ` (Calculated in ${analysis.latencyMs}ms)`}
            </p>
          </div>
          <button className="voice-pill" onClick={onVoice}>
            <Mic size={17} /> Ask Saathi
          </button>
        </div>

        {/* Credibility engine score and flags */}
        <Credibility data={analysis} />

        {/* Accessibility narrative generated by Accessibility Agent */}
        {analysis.finalResponse && (
          <div className="narrative-box">
            <div className="section-kicker" style={{ marginBottom: '8px' }}>
              Saathi’s Personalized Assessment
            </div>
            <p>{analysis.finalResponse}</p>
          </div>
        )}

        <div className="dashboard-grid">
          <Overview data={analysis} profile={profile} />
          <Risk data={analysis} />
          <Simulation data={analysis} />
          <Scams data={analysis} />
          <Schemes data={analysis} />
          <Goals data={analysis} />
          <Narrative data={analysis} />
          <Actions data={analysis} />
        </div>
      </div>

      <Chatbot analysis={analysis} profile={profile} />
    </main>
  )
}

function Credibility({ data }) {
  const score = data.credibilityScore ?? 100
  const flags = data.credibilityFlags || []
  const isHigh = score >= 80

  return (
    <div className={`credibility-strip ${isHigh ? 'high' : 'warning'}`}>
      <div className="credibility-left">
        <ShieldCheck size={18} color={isHigh ? 'var(--green)' : 'var(--gold)'} />
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
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="modFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef574d" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#ef574d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2b3031" vertical={false} />
                <XAxis dataKey="month" stroke="#727979" tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#727979"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#191c1d',
                    border: '1px solid #363d3d',
                    borderRadius: 8,
                  }}
                  formatter={(value) => money(value)}
                  labelFormatter={(label) => `Month ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="status_quo"
                  stroke="#777f7e"
                  fill="transparent"
                  strokeWidth={2}
                  name="Status quo"
                />
                <Area
                  type="monotone"
                  dataKey="moderate"
                  stroke="#ef574d"
                  fill="url(#modFill)"
                  strokeWidth={2.5}
                  name="Moderate"
                />
                <Area
                  type="monotone"
                  dataKey="optimal"
                  stroke="#d0a66b"
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
                  {path.success_prob != null && (
                    <small>{Math.round(path.success_prob * 100)}% goal chance</small>
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
              <Landmark size={16} />
            </div>
            <div>
              <b>{item.name}</b>
              <p>{item.gap || item.how_to_apply || 'Supporting information available.'}</p>
              {item.annual_benefit > 0 && (
                <small style={{ color: 'var(--green)', fontSize: '10px' }}>
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
        <Icon size={17} />
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
      <Icon size={20} />
      <span>
        {text}
        <small>{subtle}</small>
      </span>
    </div>
  )
}

function Chatbot({ analysis, profile }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text:
        analysis.finalResponse ||
        'I can explain your surplus, risk score, goals, schemes, scam alerts, and modeled scenarios.',
    },
  ])

  function answer(question) {
    const text = question.toLowerCase()
    const metrics = analysis.financialMetrics || {}
    const amount = (value) => (value == null ? 'not available' : money(value))

    if (/surplus|left|save each month/.test(text))
      return `Your recorded monthly surplus is ${amount(
        metrics.monthly_surplus
      )}. This is income minus expenses and EMIs.`
    if (/risk|score|health/.test(text))
      return `Your calculated risk score is ${analysis.riskScore}/100 (${titleCase(
        analysis.riskCategory || 'unknown'
      )} risk).`
    if (/emergency|runway|buffer/.test(text))
      return `Your emergency runway is ${
        metrics.emergency_months == null
          ? 'not available'
          : `${Number(metrics.emergency_months).toFixed(1)} months`
      }.`
    if (/scam|otp|kyc|message/.test(text))
      return analysis.scamFlags?.length
        ? `Scam alert match: ${analysis.scamFlags[0].warning || analysis.scamFlags[0].pattern}. Always verify directly with official institutions.`
        : 'No relevant scam match was detected in your message.'
    if (/scheme|insurance|government/.test(text))
      return analysis.eligibleSchemes?.length
        ? analysis.eligibleSchemes
            .map(
              (scheme) =>
                `${scheme.name}: ${scheme.eligibility_status || (scheme.eligible ? 'eligible' : 'potential')}.`
            )
            .join(' ')
        : 'No matched government schemes recorded.'
    if (/goal|house|vehicle|retire/.test(text))
      return analysis.goals?.length
        ? analysis.goals
            .map(
              (goal) =>
                `${goal.title}${goal.target_amount != null ? ` (target: ${amount(goal.target_amount)})` : ''}${
                  goal.horizon_months != null ? ` in ${goal.horizon_months} months` : ''
                }.`
            )
            .join(' ')
        : 'No explicit financial goals were found.'
    if (/future|scenario|predict|projection|monte carlo/.test(text))
      return 'The chart displays modeled financial trajectories over 36 months using 1,000 Monte Carlo iterations.'
    if (/income|earn/.test(text))
      return `Your recorded monthly income is ${amount(profile.monthlyIncome)}.`
    if (/expense|spend/.test(text))
      return `Your recorded monthly expenses are ${amount(profile.monthlyExpenses)}.`
    return 'I can answer questions about your surplus, risk score, emergency runway, schemes, scams, goals, and scenarios.'
  }

  function send(event) {
    event.preventDefault()
    const question = input.trim()
    if (!question) return
    setMessages((current) => [
      ...current,
      { role: 'user', text: question },
      { role: 'bot', text: answer(question) },
    ])
    setInput('')
  }

  return (
    <div className={`chatbot ${open ? 'open' : ''}`}>
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              <b>Ask Saathi</b>
              <small>Answers from your analysis</small>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <X size={16} />
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div className={`chat-message ${message.role}`} key={index}>
                {message.text}
              </div>
            ))}
          </div>
          <form className="chat-form" onSubmit={send}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your numbers…"
              aria-label="Ask a financial question"
            />
            <button className="chat-send" aria-label="Send question">
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
        <Sparkles size={18} />
        <span>{open ? 'Close' : 'Ask Saathi'}</span>
      </button>
    </div>
  )
}

function Voice({ onBack }) {
  const [status, setStatus] = useState('ready')
  const [message, setMessage] = useState('')
  const [socket, setSocket] = useState(null)

  async function start() {
    setStatus('connecting')
    setMessage('')
    try {
      const signedUrl = await getVoiceToken()
      const connection = new WebSocket(signedUrl)
      connection.onopen = () => {
        setSocket(connection)
        setStatus('listening')
      }
      connection.onclose = () => {
        setSocket(null)
        setStatus('disconnected')
      }
      connection.onerror = () => {
        setStatus('error')
        setMessage('The voice service WebSocket connection could not be opened.')
      }
    } catch (error) {
      setStatus('error')
      setMessage(error.message)
    }
  }

  function stop() {
    socket?.close()
    setSocket(null)
    setStatus('disconnected')
  }

  return (
    <main className="voice-page page-enter">
      <button className="back-button" onClick={onBack}>
        <ChevronLeft size={18} /> Back to your picture
      </button>
      <div className="voice-card">
        <div className={`voice-orb ${status}`}>
          <Mic size={34} />
        </div>
        <div className="eyebrow">Voice assistant</div>
        <h1>
          Talk it through
          <br />
          <em>with Saathi.</em>
        </h1>
        <p>
          Ask about your financial picture in a natural conversation. Your browser receives a temporary
          connection from the backend.
        </p>
        <div className={`voice-status ${status}`}>
          <span />{' '}
          {status === 'ready'
            ? 'Ready to connect'
            : status === 'connecting'
            ? 'Connecting securely…'
            : status === 'listening'
            ? 'Listening'
            : status === 'disconnected'
            ? 'Disconnected'
            : 'Connection error'}
        </div>
        {message && (
          <div className="error-box">
            <AlertTriangle size={16} /> {message}
          </div>
        )}
        {status === 'listening' ? (
          <button className="secondary-button voice-stop" onClick={stop}>
            <X size={17} /> End conversation
          </button>
        ) : (
          <button className="primary-button" onClick={start} disabled={status === 'connecting'}>
            {status === 'connecting' ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Headphones size={17} />
            )}{' '}
            Start conversation
          </button>
        )}
        <small className="voice-note">
          Requires the Express backend on port 3001 with configured ElevenLabs credentials.
        </small>
      </div>
    </main>
  )
}

export default App
