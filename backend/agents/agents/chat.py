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

from config import get_groq_api_key, get_groq_chat_model

GROQ_API_KEY = get_groq_api_key()
GROQ_MODEL = get_groq_chat_model()


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
    key = get_groq_api_key()
    if not key:
        return None

    try:
        from groq import Groq
        client = Groq(api_key=key)

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

        candidate_models = ["qwen/qwen3.8-27b", GROQ_MODEL, "openai/gpt-oss-120b"]
        last_error = None
        for model in candidate_models:
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.6,
                    max_tokens=800,
                    top_p=0.9,
                )
                msg_obj = response.choices[0].message
                reply = msg_obj.content or getattr(msg_obj, "reasoning", "")
                if reply and reply.strip():
                    return reply.strip()
            except Exception as ex:
                last_error = ex
                logger.warning(f"[Chat] Groq model {model} error: {ex}")
                continue

        if last_error:
            logger.warning(f"[Chat] All Groq models failed: {last_error}")
        return None

    except Exception as e:
        logger.warning(f"[Chat] Groq API setup failed: {e}")
        return None


def _deterministic_fallback(question: str, profile: dict, analysis: dict) -> str:
    """Empathetic, human-readable guidance when external LLM is offline."""
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
                f"Looking closely at your cash flow, you currently have a healthy monthly surplus of **{_inr(surplus)}**.\n\n"
                f"As a prudent rule of thumb, keeping any new EMI to a maximum of 40% of your surplus (**{_inr(safe_emi)}/month**) "
                f"protects you against unexpected pinches. Your current Debt-to-Income (DTI) ratio is **{(dti*100):.1f}%** "
                f"with an emergency buffer of **{runway:.1f} months**. As long as your purchase stays within this range, you're in safe waters!"
            )
        return (
            f"Looking at your current monthly cash flow, your essential living expenses and existing commitments take up all your income (surplus: {_inr(surplus)}).\n\n"
            "Taking on an extra EMI right now would stretch your budget dangerously thin. I strongly suggest holding off on large new commitments until we trim discretionary spending or pay down current loans."
        )

    if re.search(r"risk|score|health|why.*\d", q):
        return (
            f"Your current financial health score is **{risk_score}/100**, placing you in the **{risk_category} risk tier**.\n\n"
            f"Here is what shapes your rating right now:\n"
            f"• **Debt-to-Income Ratio:** {(dti*100):.1f}% of your monthly earnings goes to debt servicing ({'Comfortable' if dti < 0.35 else 'Higher than ideal'})\n"
            f"• **Emergency Runway:** You have {runway:.1f} months of expenses saved ({'Solid foundation' if runway >= 3 else 'Building this to 3–6 months will quickly boost your score'})\n"
            f"• **Total Debt Load:** {_inr(debt)}\n\n"
            "Every rupee redirected toward paying down debt or growing your emergency reserve will directly improve this score."
        )

    if re.search(r"invest|surplus|mutual fund|sip|save|stocks|ppf|fd|allocation", q):
        if surplus <= 0:
            return (
                "Before jumping into new investments, the most urgent step is carving out a positive monthly buffer. "
                "Let's look at reducing flexible expenses so you can free up even ₹2,000–₹3,000 a month to get started safely."
            )
        growth_sip = round(surplus * 0.50)
        safe_buffer = round(surplus * 0.30)
        liquid_reserve = round(surplus * 0.20)
        return (
            f"With your consistent monthly surplus of **{_inr(surplus)}**, you are in a great position to build lasting wealth! "
            f"Here is a balanced, practical allocation tailored to everyday goals:\n\n"
            f"• **Long-Term Growth (50% — {_inr(growth_sip)}/month):** Start a monthly Systematic Investment Plan (SIP) in a low-cost broad market index fund (like Nifty 50 or Flexi-Cap) to beat inflation over 5+ years.\n"
            f"• **Guaranteed Stability (30% — {_inr(safe_buffer)}/month):** Direct this toward Public Provident Fund (PPF) or a high-grade recurring deposit for risk-free, predictable compounding.\n"
            f"• **Liquid Emergency Shield (20% — {_inr(liquid_reserve)}/month):** Keep this in a high-interest savings account or liquid fund until you accumulate at least 6 months of living expenses ({_inr(expenses * 6)}).\n\n"
            "Would you like me to tailor these numbers for a specific timeline, like buying a home or retirement?"
        )

    if re.search(r"emergency|runway|buffer|contingency", q):
        target = expenses * 6
        gap = max(0, target - savings)
        months_to_target = max(1, round(gap / max(1, surplus * 0.4))) if surplus > 0 else "N/A"
        return (
            f"Your current emergency runway is **{runway:.1f} months** ({_inr(savings)} in liquid savings against {_inr(expenses)} in monthly expenses).\n\n"
            f"For peace of mind, a standard 6-month safety reserve for you is **{_inr(target)}** (leaving a gap of **{_inr(gap)}**). "
            + (f"By dedicating just 40% of your monthly surplus ({_inr(round(surplus * 0.4))}) to this goal, you will have your full safety cushion ready in approximately **{months_to_target} months**!" if surplus > 0 else "Focusing on building this cushion should be your first priority.")
        )

    if re.search(r"scheme|government|pmsby|pmjjby|pmay|apy|nps", q):
        if not schemes:
            return (
                "You haven't matched with specific niche schemes yet, but two essential government programs apply to almost every Indian citizen:\n\n"
                "1. **PM Suraksha Bima Yojana (PMSBY):** ₹2 lakh accidental coverage for just ₹20/year.\n"
                "2. **PM Jeevan Jyoti Bima Yojana (PMJJBY):** ₹2 lakh term life coverage for ₹436/year.\n\n"
                "Both can be activated directly through your bank account."
            )
        names = [s.get("name", "") for s in schemes[:4]]
        return (
            f"Based on your profile, you are eligible for high-impact welfare programs including: **{', '.join(names)}**.\n\n"
            "Each of these provides subsidized protection or direct financial assistance. Feel free to ask me for exact eligibility criteria or step-by-step application guidance for any of them!"
        )

    if re.search(r"debt|dti|ratio|credit|owe", q):
        return (
            f"Here is your current debt profile:\n\n"
            f"• **Total Outstanding Debt:** {_inr(debt)}\n"
            f"• **Monthly EMI Commitments:** {_inr(emi)}\n"
            f"• **Debt-to-Income (DTI) Ratio:** {(dti*100):.1f}%\n\n"
            + ("Your debt load is well within a safe threshold (below 35% of income)." if dti < 0.35 else "Your debt-to-income is somewhat high. Prioritize clearing high-interest obligations first.")
        )

    optimal = (paths.get("optimal") or {}).get("projected_value")
    return (
        f"Here is your quick financial summary:\n\n"
        f"• Monthly Income: {_inr(income)} | Living Expenses: {_inr(expenses)}\n"
        f"• Monthly Net Surplus: **{_inr(surplus)}**\n"
        f"• Financial Health Score: **{risk_score}/100** ({risk_category})\n"
        f"• Emergency Buffer: {runway:.1f} months\n"
        + (f"• Projected 36-Month Savings (Optimized): **{_inr(optimal)}**\n\n" if optimal else "\n")
        + "What would you like to explore next? I can help you evaluate a large purchase, plan investments, or optimize debt payments."
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
