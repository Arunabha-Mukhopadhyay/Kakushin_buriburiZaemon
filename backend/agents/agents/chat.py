"""Grounded chat replies for the Ask Saathi panel.

Uses Groq LLM for semantic understanding of user queries, grounded in the
user's actual financial profile and analysis data.
"""
from __future__ import annotations

import os
import json
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_CHAT_MODEL", "openai/gpt-oss-120b")


def _num(value, default=0.0) -> float:
    try:
        if value is None or value == "":
            return float(default)
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def _inr(value) -> str:
    amount = _num(value, default=float("nan"))
    if amount != amount:
        return "Not available"
    return "₹" + f"{round(amount):,}"


def _build_context(profile: dict, analysis: dict) -> str:
    """Build a rich context string from the user's profile and analysis."""
    metrics = analysis.get("financialMetrics") or analysis.get("financial_metrics") or {}
    income = _num(profile.get("monthlyIncome"))
    expenses = _num(profile.get("monthlyExpenses"))
    emi = _num(profile.get("monthlyEmi"))
    surplus = _num(metrics.get("monthly_surplus", income - expenses - emi))
    savings = _num(profile.get("existingSavings") or metrics.get("savings"))
    debt = _num(profile.get("existingDebt") or metrics.get("total_debt"))
    dti = _num(metrics.get("dti_ratio", (emi / income) if income > 0 else 0))
    runway = _num(metrics.get("emergency_months", (savings / expenses) if expenses > 0 else 0))

    risk_score = analysis.get("riskScore", analysis.get("risk_score", "unknown"))
    risk_category = str(analysis.get("riskCategory") or analysis.get("risk_category") or "unknown")
    schemes = analysis.get("eligibleSchemes") or analysis.get("eligible_schemes") or []
    goals = analysis.get("goals") or []
    scams = analysis.get("scamFlags") or analysis.get("scam_flags") or []
    paths = analysis.get("simulationPaths") or analysis.get("simulation_paths") or {}
    cards = analysis.get("decisionCards") or analysis.get("decision_cards") or []
    action_plan = analysis.get("actionPlan") or analysis.get("action_plan") or []

    context_parts = [
        f"=== USER FINANCIAL PROFILE ===",
        f"Monthly Income: {_inr(income)}",
        f"Monthly Expenses: {_inr(expenses)}",
        f"Monthly EMI / Debt Payments: {_inr(emi)}",
        f"Net Monthly Surplus: {_inr(surplus)}",
        f"Current Savings: {_inr(savings)}",
        f"Total Debt: {_inr(debt)}",
        f"Debt-to-Income Ratio (DTI): {(dti * 100):.1f}%",
        f"Emergency Runway: {runway:.1f} months of expenses covered",
        f"Age: {profile.get('age', 'Not provided')}",
        f"Employment Type: {profile.get('employmentType', 'Not provided')}",
        f"Risk Appetite: {profile.get('riskAppetite', 'moderate')}",
        f"Has Bank Account: {profile.get('hasBankAccount', True)}",
        f"Has Life Insurance: {profile.get('hasInsurance', False)}",
        f"Has Health Insurance: {profile.get('hasHealthInsurance', False)}",
        f"Location: {'Rural' if profile.get('isRural') else 'Urban'}, State: {profile.get('state', 'Not provided')}",
        "",
        f"=== RISK ANALYSIS ===",
        f"Financial Health Score: {risk_score}/100 ({risk_category} risk)",
    ]

    risk_breakdown = analysis.get("riskBreakdown") or analysis.get("risk_breakdown") or {}
    if risk_breakdown:
        context_parts.append("Risk Breakdown:")
        for factor, score in risk_breakdown.items():
            context_parts.append(f"  - {factor}: {score}/100")

    if schemes:
        context_parts.append("")
        context_parts.append("=== ELIGIBLE GOVERNMENT SCHEMES ===")
        for s in schemes:
            status = "Eligible" if s.get("eligible") else "Potentially Eligible"
            benefit = f" (Annual benefit: {_inr(s.get('annual_benefit'))})" if s.get("annual_benefit") else ""
            context_parts.append(f"  - {s.get('name', 'Unknown')}: {status}{benefit}")
            if s.get("how_to_apply"):
                context_parts.append(f"    How to apply: {s['how_to_apply']}")

    if goals:
        context_parts.append("")
        context_parts.append("=== FINANCIAL GOALS ===")
        for g in goals:
            amt = f" Target: {_inr(g.get('target_amount'))}" if g.get("target_amount") else ""
            horizon = f" in {g.get('horizon_months')} months" if g.get("horizon_months") else ""
            context_parts.append(f"  - {g.get('title', 'Goal')}{amt}{horizon} (Priority: {g.get('priority', '?')})")

    if scams:
        context_parts.append("")
        context_parts.append("=== SCAM ALERTS ===")
        for sc in scams:
            context_parts.append(f"  - {sc.get('scam_type', sc.get('pattern', 'Alert'))}: {sc.get('warning', 'Review carefully')}")

    if paths:
        context_parts.append("")
        context_parts.append("=== 36-MONTH SIMULATION (Monte Carlo) ===")
        for scenario, data in paths.items():
            pv = data.get("projected_value")
            nw = data.get("projected_net_worth")
            context_parts.append(f"  - {scenario}: Projected savings {_inr(pv)}, Net worth {_inr(nw)}")

    if cards:
        context_parts.append("")
        context_parts.append("=== KEY RECOMMENDATIONS ===")
        for c in cards:
            context_parts.append(f"  - {c.get('action', '')}: {c.get('why', '')}")

    if action_plan:
        context_parts.append("")
        context_parts.append("=== ACTION PLAN ===")
        for a in action_plan:
            context_parts.append(f"  - {a.get('task', '')}")

    return "\n".join(context_parts)


SYSTEM_PROMPT = """You are FinMate, a warm, knowledgeable, and empathetic AI financial advisor for everyday Indians.

YOUR BEHAVIOR:
1. UNDERSTAND the user's question deeply — what they actually want to know, not just keyword matching
2. REASON about the answer using their specific financial data provided in context
3. RESPOND with personalized, actionable advice grounded in their actual numbers
4. Be conversational but precise — use their real figures, not vague generalizations
5. Explain WHY — don't just state facts, explain the reasoning behind your advice
6. Use Indian financial context (PPF, NPS, PMSBY, SIP, FD, etc.)
7. If a question is about affordability, calculate the actual impact on their budget
8. If they ask about risk score, explain what factors contributed and how to improve
9. Always be encouraging but honest — don't sugarcoat bad financial situations

FORMATTING:
- Use clear paragraphs, not walls of text
- Use **bold** for key numbers and recommendations
- Use bullet points (•) for lists
- Keep responses under 250 words unless the question demands detail
- End with a specific, actionable next step when relevant

IMPORTANT: Your answers must be SPECIFIC to this user's data. Never give generic advice.
If a user asks "why is my risk score X?", explain using their actual DTI, runway, debt, etc.
If they ask "can I afford X?", calculate using their actual surplus.
"""


def _groq_chat(message: str, context: str, history: list) -> str | None:
    """Call Groq API for a semantically aware response."""
    if not GROQ_API_KEY:
        return None

    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Here is my complete financial profile and analysis:\n\n{context}"},
            {"role": "assistant", "content": "I've reviewed your complete financial profile. I'm ready to help you with any questions about your finances. What would you like to know?"},
        ]

        # Add conversation history (last 10 exchanges max)
        for entry in (history or [])[-10:]:
            role = "assistant" if entry.get("role") == "bot" else "user"
            messages.append({"role": role, "content": entry.get("text", "")})

        # Add the current question
        messages.append({"role": "user", "content": message})

        candidate_models = [GROQ_MODEL, "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]
        last_error = None
        for model in candidate_models:
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.5,
                    max_tokens=600,
                    top_p=0.9,
                )
                reply = response.choices[0].message.content
                if reply and reply.strip():
                    return reply.strip()
            except Exception as ex:
                last_error = ex
                continue

        if last_error:
            logger.warning(f"[Chat] All Groq models failed: {last_error}")
        return None

    except Exception as e:
        logger.warning(f"[Chat] Groq API setup failed: {e}")
        return None


def _deterministic_fallback(question: str, profile: dict, analysis: dict) -> str:
    """Regex-based fallback when Groq is unavailable."""
    import re
    metrics = analysis.get("financialMetrics") or analysis.get("financial_metrics") or {}
    income = _num(profile.get("monthlyIncome"))
    expenses = _num(profile.get("monthlyExpenses"))
    emi = _num(profile.get("monthlyEmi"))
    surplus = _num(metrics.get("monthly_surplus", income - expenses - emi))
    savings = _num(profile.get("existingSavings") or metrics.get("savings"))
    debt = _num(profile.get("existingDebt") or metrics.get("total_debt"))
    dti = _num(metrics.get("dti_ratio", (emi / income) if income > 0 else 0))
    runway = _num(metrics.get("emergency_months", (savings / expenses) if expenses > 0 else 0))
    risk_score = analysis.get("riskScore", analysis.get("risk_score", "unknown"))
    risk_category = str(analysis.get("riskCategory") or analysis.get("risk_category") or "unknown")
    schemes = analysis.get("eligibleSchemes") or analysis.get("eligible_schemes") or []
    paths = analysis.get("simulationPaths") or analysis.get("simulation_paths") or {}

    q = question.lower()

    if re.search(r"afford|buy|car|house|loan|purchase|emi|bike|phone|vacation|borrow", q):
        safe_emi = round(surplus * 0.4)
        if surplus > 0:
            return (
                f"With your monthly surplus of **{_inr(surplus)}**, you can safely take on a new EMI "
                f"of up to **{_inr(safe_emi)}** (40% of surplus). Your current DTI is {(dti*100):.1f}%. "
                f"Emergency runway: {runway:.1f} months."
            )
        return f"Your surplus is **{_inr(surplus)}** — taking on new debt would be risky right now."

    if re.search(r"risk|score|health|why.*\d", q):
        return (
            f"Your financial health score is **{risk_score}/100** ({risk_category} risk). "
            f"Key factors: DTI at {(dti*100):.1f}%, emergency runway {runway:.1f} months, "
            f"debt of {_inr(debt)}. Improving any of these will raise your score."
        )

    if re.search(r"invest|surplus|mutual fund|sip|save|stocks|ppf|fd|allocation", q):
        if surplus <= 0:
            return "Build a surplus first before investing. Cut non-essential expenses."
        return (
            f"With **{_inr(surplus)}/month** surplus: allocate ~20% to liquid savings, "
            f"~30% to PPF/NPS for tax-free returns, and ~50% to index fund SIPs for long-term growth."
        )

    if re.search(r"emergency|runway|buffer|contingency", q):
        target = expenses * 6
        gap = target - savings
        return (
            f"You have **{runway:.1f} months** of runway ({_inr(savings)} saved). "
            f"Target: 6 months = {_inr(target)}. Gap: {_inr(max(0, gap))}."
        )

    if re.search(r"scheme|government|pmsby|pmjjby|pmay|apy|nps", q):
        if not schemes:
            return "Consider PMSBY (₹20/yr accident cover) and PMJJBY (₹436/yr life cover) as a starting point."
        names = [s.get("name", "") for s in schemes[:5]]
        return f"You're matched with: {', '.join(names)}. Ask me about any specific scheme for details."

    if re.search(r"debt|dti|ratio|credit|owe", q):
        return (
            f"Total debt: **{_inr(debt)}**, monthly EMI: **{_inr(emi)}**, "
            f"DTI: **{(dti*100):.1f}%**. {'Safe range.' if dti < 0.35 else 'Consider reducing debt.'}"
        )

    optimal = (paths.get("optimal") or {}).get("projected_value")
    return (
        f"Your snapshot: Income {_inr(income)}/mo, expenses {_inr(expenses)}/mo, "
        f"surplus **{_inr(surplus)}**. Health score: {risk_score}/100. "
        f"Emergency runway: {runway:.1f} months. "
        + (f"Projected savings (optimal): {_inr(optimal)}. " if optimal else "")
        + "Ask me anything specific — affordability, investments, schemes, or goals!"
    )


def build_chat_reply(
    message: str,
    profile: dict | None = None,
    analysis: dict | None = None,
    history: list | None = None,
) -> str:
    """Answer from the user's profile and analysis — Groq LLM first, deterministic fallback second."""
    profile = profile or {}
    analysis = analysis or {}
    question = (message or "").strip()

    if not question:
        return "Please ask me a question about your finances!"

    # Build rich context for the LLM
    context = _build_context(profile, analysis)

    # Try Groq LLM first for semantic understanding
    groq_reply = _groq_chat(question, context, history)
    if groq_reply:
        return groq_reply

    # Fallback to deterministic regex-based replies
    return _deterministic_fallback(question, profile, analysis)
