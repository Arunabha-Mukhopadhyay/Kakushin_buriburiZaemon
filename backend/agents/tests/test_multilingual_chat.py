from agents.chat import build_chat_reply, _detect_script_language

def test_script_detection():
    assert _detect_script_language("मी गाडी घेऊ शकतो का?") == "mr"
    assert _detect_script_language("क्या मैं कार लोन ले सकता हूँ?") == "hi"
    assert _detect_script_language("আমি কি গাড়ি লোন নিতে পারি?") == "bn"
    assert _detect_script_language("ਕੀ ਮੈਂ ਕਾਰ ਲੋਨ ਲੈ ਸਕਦਾ ਹਾਂ?") == "pa"
    assert _detect_script_language("Can I afford a car EMI?") is None

def test_multilingual_chat_replies():
    profile = {
        "monthlyIncome": 60000,
        "monthlyExpenses": 35000,
        "monthlyEmi": 5000,
        "existingSavings": 120000,
        "existingDebt": 50000,
    }
    analysis = {
        "financialMetrics": {
            "monthly_surplus": 20000,
            "dti_ratio": 0.083,
            "emergency_months": 3.4,
        },
        "riskScore": 75,
        "riskCategory": "low",
    }

    # Test Marathi fallback/reply
    reply_mr = build_chat_reply("मी गाडी घेऊ शकतो का?", profile=profile, analysis=analysis, language="mr")
    assert reply_mr is not None
    assert len(reply_mr) > 20

    # Test Hindi fallback/reply
    reply_hi = build_chat_reply("क्या मैं नई कार ले सकता हूँ?", profile=profile, analysis=analysis, language="hi")
    assert reply_hi is not None
    assert len(reply_hi) > 20

    # Test Punjabi fallback/reply
    reply_pa = build_chat_reply("ਕੀ ਮੈਂ ਕਾਰ ਲੈ ਸਕਦਾ ਹਾਂ?", profile=profile, analysis=analysis, language="pa")
    assert reply_pa is not None
    assert len(reply_pa) > 20

    # Test Bengali fallback/reply
    reply_bn = build_chat_reply("আমি কি গাড়ি কিনতে পারি?", profile=profile, analysis=analysis, language="bn")
    assert reply_bn is not None
    assert len(reply_bn) > 20
