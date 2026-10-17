import os
from dotenv import load_dotenv

load_dotenv()


def get_groq_api_key() -> str:
    """Return the configured Groq API key from environment."""
    key = os.getenv("GROQ_API_KEY", "").strip()
    if key and not key.startswith("your_"):
        return key
    return ""


def get_groq_chat_model() -> str:
    return os.getenv("GROQ_CHAT_MODEL", "qwen/qwen3.8-27b")


def get_groq_model() -> str:
    return os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
