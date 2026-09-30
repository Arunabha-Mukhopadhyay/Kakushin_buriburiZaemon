import pytest

from quality_evaluation import evaluate_quality


def test_evaluates_quality_rates_from_annotations():
    result = evaluate_quality([
        {
            "claims_total": 4,
            "supported_claims": 3,
            "hallucinated_claims": 1,
            "retrieved_chunks": 5,
            "relevant_chunks": 4,
            "credibility_expected_credible": False,
            "credibility_predicted_credible": False,
            "latency_ms": 100,
        },
        {
            "claims_total": 2,
            "supported_claims": 2,
            "hallucinated_claims": 0,
            "retrieved_chunks": 3,
            "relevant_chunks": 2,
            "credibility_expected_credible": True,
            "credibility_predicted_credible": False,
            "latency_ms": 300,
        },
    ])

    assert result["groundedness"] == 0.8333
    assert result["hallucination_rate"] == 0.1667
    assert result["context_precision"] == 0.75
    assert result["credibility_accuracy"] == 0.5
    assert result["credibility_precision"] == 0.5
    assert result["credibility_recall"] == 1.0
    assert result["credibility_f1"] == 0.6667
    assert result["latency_ms"] == {"count": 2, "p50": 100.0, "p95": 300.0}


def test_empty_evaluation_has_undefined_rates():
    result = evaluate_quality([])

    assert result["groundedness"] is None
    assert result["hallucination_rate"] is None
    assert result["context_precision"] is None
    assert result["credibility_accuracy"] is None
    assert result["latency_ms"] == {"count": 0, "p50": None, "p95": None}


def test_rejects_inconsistent_annotations():
    with pytest.raises(ValueError, match="exceed their totals"):
        evaluate_quality([{"claims_total": 1, "supported_claims": 2}])