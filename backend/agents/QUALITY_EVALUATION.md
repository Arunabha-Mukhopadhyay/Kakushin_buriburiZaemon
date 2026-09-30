# Quality Evaluation

The scorecard expects human-reviewed annotations. Do not use generated model judgments as ground truth.

Create a JSONL file with one response per line:

```json
{"claims_total":4,"supported_claims":3,"hallucinated_claims":1,"retrieved_chunks":5,"relevant_chunks":4,"credibility_expected_credible":false,"credibility_predicted_credible":false,"latency_ms":36088}
```

Annotate claims in the final response and decision cards against the request, computed metrics, and any retrieved sources. Count a claim as supported only when those inputs or sources substantiate it. Label retrieved chunks relevant only when they support the query. For credibility labels, `true` means the input passes the reviewed consistency criteria; derive the prediction from whether the credibility engine returns any flags. Reviewers should label cases independently and resolve disagreements before aggregating.

Run the scorecard from `backend/agents`:

```sh
.venv/bin/python quality_evaluation.py path/to/reviewed-cases.jsonl
```

Groundedness is supported claims divided by total claims. Hallucination rate is unsupported/false claims divided by total claims. Context precision is relevant retrieved chunks divided by all retrieved chunks. Credibility accuracy, precision, recall, and F1 compare the engine's flag/no-flag prediction against reviewed labels. Latency reports nearest-rank p50 and p95 from `latency_ms` values.

The scorecard returns `null` when a metric has no labeled denominator. A single API response is not enough to estimate quality rates; use a representative set covering normal cases, edge cases, and failure modes. The API's `latencyBreakdownMs` reports per-stage timing; `latencyMs` remains end-to-end wall time.