FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock* ./
RUN pip install --no-cache-dir uv && uv pip install --system -r <(uv pip compile pyproject.toml 2>/dev/null || true) || pip install --no-cache-dir fastapi uvicorn[standard] langgraph==0.2.69 langchain-core langchain-google-genai sentence-transformers faiss-cpu "numpy<2.0.0" scipy python-dotenv pydantic httpx

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
