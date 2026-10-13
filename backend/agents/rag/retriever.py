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
from sentence_transformers import SentenceTransformer
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

os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"

_model_lock = threading.Lock()
_global_model: SentenceTransformer | None = None

def _get_model() -> SentenceTransformer:
    global _global_model
    if _global_model is None:
        with _model_lock:
            if _global_model is None:
                _global_model = SentenceTransformer(EMBEDDING_MODEL)
    return _global_model



_index_cache: dict[str, tuple[faiss.IndexFlatL2, list[dict]]] = {}


def _load_store(store_name: str) -> tuple[faiss.IndexFlatL2, list[dict]]:
    """Load a FAISS index + metadata from disk (cached after first load)."""
    if store_name in _index_cache:
        return _index_cache[store_name]

    index_file = INDEX_PATH / f"{store_name}.faiss"
    meta_file  = INDEX_PATH / f"{store_name}.pkl"

    if not index_file.exists():
        raise FileNotFoundError(
            f"FAISS index not found: {index_file}\n"
            "Run: python -m rag.ingest"
        )

    index = faiss.read_index(str(index_file))
    with open(meta_file, "rb") as f:
        metadata = pickle.load(f)

    _index_cache[store_name] = (index, metadata)
    return index, metadata



def query(
    text: str,
    store: str,
    top_k: int = 5,
) -> list[dict]:
    """
    Semantic search against a FAISS store.

    Args:
        text:  Query string (any of en/hi/mr/kn — model handles multilingually)
        store: One of "financial_literacy" | "rbi_regulatory" |
               "government_schemes" | "scam_patterns"
        top_k: Number of results to return

    Returns:
        List of dicts with keys: text, source, chunk_idx, store, score
    """
    if store not in VALID_STORES:
        raise ValueError(f"Invalid store: {store}. Must be one of {VALID_STORES}")

    model = _get_model()
    index, metadata = _load_store(store)

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
        # With normalized vectors: distance = 2*(1 - cos_sim), so cos_sim = 1 - distance/2
        l2_dist = float(dist)
        cos_sim = float(max(-1.0, min(1.0, 1.0 - (l2_dist / 2.0))))
        result["score"] = l2_dist
        result["cosine_similarity"] = round(cos_sim, 4)
        results.append(result)

    return results


def preload_all_stores() -> None:
    """
    Call this at FastAPI startup to warm up all indexes.
    Prevents cold-start latency on first agent invocation.
    """
    _get_model()  # load embedding model
    for store in VALID_STORES:
        try:
            _load_store(store)
            print(f"  ✓ Loaded FAISS store: {store}")
        except FileNotFoundError as e:
            print(f"  ⚠️  {e}")
