"""
ArthSaathi — RAG Retriever

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



@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    return SentenceTransformer(EMBEDDING_MODEL)



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

    embedding = model.encode([text], show_progress_bar=False)
    embedding = np.array(embedding, dtype="float32")

    distances, indices = index.search(embedding, top_k)

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx == -1:
            continue
        result = dict(metadata[idx])
        result["score"] = float(dist)          # L2 distance — lower = more similar
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
