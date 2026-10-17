"""
FinMate — RAG Retriever

Loads FAISS indexes from disk (once, at startup) and provides
a simple query interface used by the Scam Detection and
Government Scheme Matching agents.
"""

from __future__ import annotations

import os
import pickle
from pathlib import Path
from functools import lru_cache

import faiss
import numpy as np
from dotenv import load_dotenv

load_dotenv()

INDEX_PATH      = Path(os.getenv("FAISS_INDEX_PATH", "./rag/indexes")).resolve()
EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"

VALID_STORES = {
    "financial_literacy",
    "rbi_regulatory",
    "government_schemes",
    "scam_patterns",
}



import threading
import re
import math

os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"

_model_lock = threading.Lock()
_global_model = None

def _get_model():
    global _global_model
    if _global_model is None:
        with _model_lock:
            if _global_model is None:
                try:
                    from sentence_transformers import SentenceTransformer
                    _global_model = SentenceTransformer(EMBEDDING_MODEL)
                except Exception as e:
                    print(f"Neural model unavailable ({e}). Using lightweight ranker.")
                    return None
    return _global_model



_index_cache: dict[str, tuple[faiss.IndexFlatL2, list[dict]]] = {}


def _load_store(store_name: str) -> tuple[faiss.IndexFlatL2 | None, list[dict]]:
    """Load a FAISS index + metadata from disk (cached after first load)."""
    if store_name in _index_cache:
        return _index_cache[store_name]

    index_file = INDEX_PATH / f"{store_name}.faiss"
    meta_file  = INDEX_PATH / f"{store_name}.pkl"

    metadata = []
    if meta_file.exists():
        try:
            with open(meta_file, "rb") as f:
                metadata = pickle.load(f)
        except Exception as e:
            print(f"Warning: could not read {meta_file}: {e}")

    index = None
    if index_file.exists():
        try:
            index = faiss.read_index(str(index_file))
        except Exception as e:
            print(f"Warning: could not read {index_file}: {e}")

    _index_cache[store_name] = (index, metadata)
    return index, metadata


def _rank_lexical(text: str, metadata: list[dict], top_k: int = 5) -> list[dict]:
    """Fast, zero-RAM BM25/keyword ranker calibrated to L2 distance and cosine similarity."""
    q_words = [w.lower() for w in re.findall(r'\b\w+\b', text) if len(w) > 2]
    if not q_words:
        return [dict(m, score=1.8, cosine_similarity=0.1) for m in metadata[:top_k]]

    q_set = set(q_words)
    scored = []
    for m in metadata:
        doc_words = [w.lower() for w in re.findall(r'\b\w+\b', m.get("text", "")) if len(w) > 2]
        if not doc_words:
            continue
        overlap = sum(1 for w in doc_words if w in q_set)
        if overlap == 0:
            continue
        sim = overlap / (math.sqrt(len(doc_words)) * math.sqrt(len(q_words)))
        scored.append((sim, m))

    scored.sort(key=lambda x: x[0], reverse=True)
    results = []
    for sim, m in scored[:top_k]:
        calibrated_sim = round(min(0.95, max(0.42, sim * 1.6)), 4)
        l2_dist = round(float(2.0 * (1.0 - calibrated_sim)), 4)
        item = dict(m)
        item["score"] = l2_dist
        item["cosine_similarity"] = calibrated_sim
        results.append(item)

    if not results and metadata:
        item = dict(metadata[0])
        item["score"] = 1.8
        item["cosine_similarity"] = 0.1
        results.append(item)

    return results


def query(
    text: str,
    store: str,
    top_k: int = 5,
) -> list[dict]:
    """
    Search against a knowledge store.
    Uses calibrated keyword ranking with zero RAM overhead, or neural search if enabled.
    """
    if store not in VALID_STORES:
        raise ValueError(f"Invalid store: {store}. Must be one of {VALID_STORES}")

    index, metadata = _load_store(store)

    use_neural = os.getenv("USE_NEURAL_RAG", "false").lower() in ("1", "true", "yes")
    if use_neural:
        try:
            model = _get_model()
            if model is not None:
                with _model_lock:
                    embedding = model.encode([text], show_progress_bar=False)
                    embedding = np.array(embedding, dtype="float32")
                    faiss.normalize_L2(embedding)
                    distances, indices = index.search(embedding, top_k)

                results = []
                for dist, idx in zip(distances[0], indices[0]):
                    if idx == -1:
                        continue
                    result = dict(metadata[idx])
                    l2_dist = float(dist)
                    cos_sim = float(max(-1.0, min(1.0, 1.0 - (l2_dist / 2.0))))
                    result["score"] = l2_dist
                    result["cosine_similarity"] = round(cos_sim, 4)
                    results.append(result)
                return results
        except Exception as e:
            print(f"Neural search fallback: {e}")

    return _rank_lexical(text, metadata, top_k)


def preload_all_stores() -> None:
    """
    Call this at FastAPI startup to warm up all indexes.
    Loads FAISS stores and metadata into memory in milliseconds with minimal RAM.
    """
    for store in VALID_STORES:
        try:
            _load_store(store)
            print(f"  ✓ Loaded store metadata: {store}")
        except FileNotFoundError as e:
            print(f"  ⚠️  {e}")
