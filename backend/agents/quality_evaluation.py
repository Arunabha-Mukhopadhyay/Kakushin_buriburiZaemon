"""Aggregate human-annotated quality evaluation cases into comparable metrics."""
from __future__ import annotations

import argparse
import json
from collections.abc import Iterable, Mapping
from pathlib import Path


def _ratio(numerator: int, denominator: int) -> float | None:
    return round(numerator / denominator, 4) if denominator else None


def _percentile(values: list[float], percentile: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = max(0, int((percentile / 100) * len(ordered) + 0.999999) - 1)
    return round(ordered[index], 2)


def evaluate_quality(cases: Iterable[Mapping[str, object]]) -> dict[str, object]:
    """Score annotations, not model self-reports.

    Cases supply claim/context counts, expected/predicted credibility labels,
    and optional end-to-end latency in milliseconds. Metrics are ``None``
    when their denominator is zero or labels are unavailable.
    """
    totals = {
        "claims": 0,
        "supported_claims": 0,
        "hallucinated_claims": 0,
        "retrieved_chunks": 0,
        "relevant_chunks": 0,
        "credibility_cases": 0,
        "credibility_correct": 0,
        "true_positive": 0,
        "false_positive": 0,
        "false_negative": 0,
    }
    latencies: list[float] = []

    for case in cases:
        claims = int(case.get("claims_total", 0))
        supported = int(case.get("supported_claims", 0))
        hallucinated = int(case.get("hallucinated_claims", 0))
        retrieved = int(case.get("retrieved_chunks", 0))
        relevant = int(case.get("relevant_chunks", 0))
        if min(claims, supported, hallucinated, retrieved, relevant) < 0:
            raise ValueError("Evaluation counts cannot be negative")
        if supported > claims or hallucinated > claims or relevant > retrieved:
            raise ValueError("Annotation counts exceed their totals")

        totals["claims"] += claims
        totals["supported_claims"] += supported
        totals["hallucinated_claims"] += hallucinated
        totals["retrieved_chunks"] += retrieved
        totals["relevant_chunks"] += relevant

        expected = case.get("credibility_expected_credible")
        predicted = case.get("credibility_predicted_credible")
        if expected is not None and predicted is not None:
            expected_credible = bool(expected)
            predicted_credible = bool(predicted)
            totals["credibility_cases"] += 1
            totals["credibility_correct"] += expected_credible == predicted_credible
            totals["true_positive"] += not expected_credible and not predicted_credible
            totals["false_positive"] += expected_credible and not predicted_credible
            totals["false_negative"] += not expected_credible and predicted_credible

        latency = case.get("latency_ms")
        if latency is not None:
            latency_value = float(latency)
            if latency_value < 0:
                raise ValueError("Latency cannot be negative")
            latencies.append(latency_value)

    precision = _ratio(totals["true_positive"], totals["true_positive"] + totals["false_positive"])
    recall = _ratio(totals["true_positive"], totals["true_positive"] + totals["false_negative"])
    f1 = (
        round(2 * precision * recall / (precision + recall), 4)
        if precision is not None and recall is not None and precision + recall
        else (0.0 if precision == 0 or recall == 0 else None)
    )

    return {
        "groundedness": _ratio(totals["supported_claims"], totals["claims"]),
        "hallucination_rate": _ratio(totals["hallucinated_claims"], totals["claims"]),
        "context_precision": _ratio(totals["relevant_chunks"], totals["retrieved_chunks"]),
        "credibility_accuracy": _ratio(totals["credibility_correct"], totals["credibility_cases"]),
        "credibility_precision": precision,
        "credibility_recall": recall,
        "credibility_f1": f1,
        "latency_ms": {
            "count": len(latencies),
            "p50": _percentile(latencies, 50),
            "p95": _percentile(latencies, 95),
        },
        "sample_counts": {
            "claims": totals["claims"],
            "retrieved_chunks": totals["retrieved_chunks"],
            "credibility_cases": totals["credibility_cases"],
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Score human-annotated ArthSaathi evaluation cases.")
    parser.add_argument("annotations", type=Path, help="JSONL file containing one reviewed case per line")
    args = parser.parse_args()

    with args.annotations.open(encoding="utf-8") as annotation_file:
        cases = [json.loads(line) for line in annotation_file if line.strip()]
    print(json.dumps(evaluate_quality(cases), indent=2))


if __name__ == "__main__":
    main()