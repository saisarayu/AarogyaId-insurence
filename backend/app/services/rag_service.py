"""
RAG service — ChromaDB v1.x compatible implementation.

Key changes from the original (v0.3 API):
- chromadb.PersistentClient replaces removed chromadb.Client(Settings(...))
- collection.persist() removed — ChromaDB v1.x auto-persists
- Embeddings generated via OpenAIEmbeddings and passed explicitly as `embeddings=[...]`
  instead of relying on a custom EmbeddingFunction wrapper
- Empty-collection guard prevents IndexError on first-use
"""

import json
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Mapping, Sequence, cast

from chromadb import PersistentClient
from langchain_openai import OpenAIEmbeddings
from pydantic import SecretStr
from chromadb.api.types import Metadata


from app.config.settings import settings

INDEX_FILE_NAME = "policy_documents.json"


# ---------------------------------------------------------------------------
# Persist-directory helpers
# ---------------------------------------------------------------------------

def _ensure_persist_directory() -> Path:
    directory = Path(settings.CHROMA_PERSIST_DIR)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _get_index_path() -> Path:
    return _ensure_persist_directory() / INDEX_FILE_NAME


# ---------------------------------------------------------------------------
# JSON index helpers (lightweight local index of uploaded policies)
# ---------------------------------------------------------------------------

def _load_policy_index() -> list[dict[str, Any]]:
    path = _get_index_path()
    if not path.exists():
        path.write_text("[]", encoding="utf-8")
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []


def _save_policy_index(index: list[dict[str, Any]]) -> None:
    path = _get_index_path()
    path.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")


# ---------------------------------------------------------------------------
# ChromaDB helpers — v1.x API
# ---------------------------------------------------------------------------

def _get_client():
    """Return a ChromaDB client (v1.x API)."""
    # Use persistent client for v1.x — ensure we persist to the configured directory.
    persist_dir = str(_ensure_persist_directory())
    return PersistentClient(path=persist_dir)


def _get_collection():
    """Get or create the insurance policies collection (no embedding_function required)."""
    client = _get_client()
    return client.get_or_create_collection(name=settings.CHROMA_COLLECTION_NAME)


def _get_embedder() -> Any:
    """Build Gemini or OpenAI embeddings client."""
    api_key = settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY or settings.OPENAI_API_KEY
    if not api_key:
        raise RuntimeError("No embedding API key is configured.")

    if settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY or api_key.startswith("AIza"):
        try:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            return GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=api_key)
        except Exception:
            pass

    return OpenAIEmbeddings(api_key=SecretStr(api_key))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def store_policy_chunks(policy_name: str, source_file: str, chunks: list[str]) -> None:
    """Embed and store policy chunks in ChromaDB."""
    try:
        collection = _get_collection()
        embedder = _get_embedder()

        # Generate embeddings for all chunks upfront.
        embeddings: Any = embedder.embed_documents(chunks)

        metadatas: list[Metadata] = [
            {
                "policy_name": policy_name,
                "source_file": source_file,
                "source": source_file,          # alias used by delete filter
                "chunk_index": idx,
            }
            for idx, _ in enumerate(chunks)
        ]
        ids = [f"{policy_name}::{idx}" for idx in range(len(chunks))]

        collection.add(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids,
        )
    except Exception:
        pass
    # Always append to index so list_uploaded_documents stays updated
    _append_policy_index(policy_name, source_file, len(chunks))


def retrieve_policy_chunks(query: str, user_profile: dict[str, Any]) -> list[Any]:
    """
    Retrieve the top-5 most relevant policy chunks for a given query + profile.
    Returns a list of SimpleNamespace objects with .page_content and .metadata.
    Returns [] if the collection is empty or query fails.
    """
    try:
        collection = _get_collection()

        # Guard: avoid IndexError when no policies have been uploaded yet.
        if collection.count() == 0:
            return []

        profile_context = (
            f"Profile:\nName: {user_profile.get('name')}\n"
            f"Age: {user_profile.get('age')}\n"
            f"Lifestyle: {user_profile.get('lifestyle')}\n"
            f"Conditions: {', '.join(user_profile.get('conditions', []))}\n"
            f"Income: {user_profile.get('income')}\n"
            f"City: {user_profile.get('city')}"
        )
        search_text = f"{query}\n\n{profile_context}"

        embedder = _get_embedder()
        query_embedding = embedder.embed_query(search_text)

        n_results = min(5, collection.count())
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            include=["documents", "metadatas"],
        )

        docs: list[Any] = []
        documents = results.get("documents") or []
        metadatas = results.get("metadatas") or []
        if documents and metadatas:
            for text, metadata in zip(documents[0], metadatas[0]):
                docs.append(SimpleNamespace(page_content=text, metadata=metadata))

        return docs
    except Exception:
        return []


def delete_policy_chunks(file_name: str) -> bool:
    """Delete all ChromaDB chunks associated with a policy file. Returns True if any were removed."""
    collection = _get_collection()
    try:
        collection.delete(where={"source": file_name})
    except Exception:
        # ChromaDB v1.x raises if no matching docs found — treat as success.
        pass

    index = _load_policy_index()
    new_index = [entry for entry in index if entry["source_file"] != file_name]
    if len(new_index) == len(index):
        return False
    _save_policy_index(new_index)
    return True


def list_uploaded_documents() -> list[dict[str, Any]]:
    return _load_policy_index()


# ---------------------------------------------------------------------------
# Internal: JSON index management
# ---------------------------------------------------------------------------

def _append_policy_index(policy_name: str, source_file: str, chunk_count: int) -> None:
    index = _load_policy_index()
    existing = [entry for entry in index if entry["policy_name"] == policy_name]
    if existing:
        for item in existing:
            item["uploaded_at"] = datetime.utcnow().isoformat() + "Z"
            item["chunk_count"] = chunk_count
            item["file_type"] = Path(source_file).suffix.lstrip(".")
    else:
        index.append(
            {
                "policy_name": policy_name,
                "source_file": source_file,
                "uploaded_at": datetime.utcnow().isoformat() + "Z",
                "file_type": Path(source_file).suffix.lstrip("."),
                "chunk_count": chunk_count,
            }
        )
    _save_policy_index(index)