"""
ArthSaathi — RAG Ingestion Script

Run this ONCE to embed all 20 knowledge base documents
and save 4 domain-separated FAISS indexes to disk.

Usage:
    cd backend/agents
    python -m rag.ingest

Output:
    rag/indexes/financial_literacy.faiss
    rag/indexes/financial_literacy.pkl
    rag/indexes/rbi_regulatory.faiss
    rag/indexes/rbi_regulatory.pkl
    rag/indexes/government_schemes.faiss
    rag/indexes/government_schemes.pkl
    rag/indexes/scam_patterns.faiss
    rag/indexes/scam_patterns.pkl
"""

from __future__ import annotations

import os
import re
import pickle
from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()


KNOWLEDGE_BASE_PATH = Path(
    os.getenv("KNOWLEDGE_BASE_PATH", "../knowledge_base")
).resolve()

INDEX_OUTPUT_PATH = Path(
    os.getenv("FAISS_INDEX_PATH", "./rag/indexes")
).resolve()

EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"

CHUNK_SIZE    = 600   # target tokens per chunk (approx 4 chars/token → ~150 words)
CHUNK_OVERLAP = 80    # overlap between chunks to preserve context across boundaries

STORES = {
    "financial_literacy": KNOWLEDGE_BASE_PATH / "financial_literacy",
    "rbi_regulatory":     KNOWLEDGE_BASE_PATH / "rbi_regulatory",
    "government_schemes": KNOWLEDGE_BASE_PATH / "government_schemes",
    "scam_patterns":      KNOWLEDGE_BASE_PATH / "scam_patterns",
}



def split_by_headings(text: str) -> list[str]:
    """Split markdown on ## or ### headings — keeps each section semantically whole."""
    sections = re.split(r"\n(?=#{1,3} )", text.strip())
    return [s.strip() for s in sections if s.strip()]


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """
    First split by headings, then further chunk any section
    that is too long (by approximate word count).
    """
    heading_chunks = split_by_headings(text)
    final_chunks: list[str] = []

    for section in heading_chunks:
        words = section.split()
        if len(words) <= chunk_size // 4:
            final_chunks.append(section)
        else:
            start = 0
            step  = chunk_size // 4 - overlap // 4
            while start < len(words):
                chunk = " ".join(words[start : start + chunk_size // 4])
                final_chunks.append(chunk)
                start += step

    return final_chunks



def load_documents(store_path: Path) -> list[dict]:
    """Load all .md files from a store directory."""
    docs = []
    for md_file in sorted(store_path.glob("*.md")):
        text = md_file.read_text(encoding="utf-8")
        chunks = chunk_text(text)
        for i, chunk in enumerate(chunks):
            docs.append({
                "text":       chunk,
                "source":     md_file.name,
                "chunk_idx":  i,
                "store":      store_path.name,
            })
        print(f"  ✓ {md_file.name} → {len(chunks)} chunks")
    return docs


def build_faiss_index(
    docs: list[dict],
    model: SentenceTransformer,
) -> tuple[faiss.IndexFlatL2, list[dict]]:
    """Embed documents and build a FAISS IndexFlatL2."""
    texts = [d["text"] for d in docs]
    print(f"  Embedding {len(texts)} chunks...")
    embeddings = model.encode(texts, show_progress_bar=True, batch_size=32)
    embeddings = np.array(embeddings, dtype="float32")

    dim   = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    return index, docs


def save_index(index: faiss.IndexFlatL2, metadata: list[dict], name: str) -> None:
    """Save FAISS index + metadata to disk."""
    INDEX_OUTPUT_PATH.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(INDEX_OUTPUT_PATH / f"{name}.faiss"))
    with open(INDEX_OUTPUT_PATH / f"{name}.pkl", "wb") as f:
        pickle.dump(metadata, f)
    print(f"  💾 Saved → rag/indexes/{name}.faiss + .pkl")



def main() -> None:
    print(f"\n{'='*55}")
    print("ArthSaathi RAG Ingestion")
    print(f"Knowledge base: {KNOWLEDGE_BASE_PATH}")
    print(f"Output path:    {INDEX_OUTPUT_PATH}")
    print(f"{'='*55}\n")

    print("Loading embedding model (paraphrase-multilingual-MiniLM-L12-v2)...")
    model = SentenceTransformer(EMBEDDING_MODEL)
    print("Model loaded.\n")

    for store_name, store_path in STORES.items():
        if not store_path.exists():
            print(f"⚠️  Skipping {store_name} — path not found: {store_path}")
            continue

        print(f"── {store_name} ──")
        docs  = load_documents(store_path)
        index, metadata = build_faiss_index(docs, model)
        save_index(index, metadata, store_name)
        print(f"  Total: {len(docs)} chunks indexed\n")

    print("✅ All FAISS indexes built successfully.")
    print(f"   Run the FastAPI server to start serving queries.\n")


if __name__ == "__main__":
    main()
