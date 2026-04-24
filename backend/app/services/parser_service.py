import json
from pathlib import Path

import pdfplumber


def extract_text(file_path: str) -> str:
    """
    Extract text from a PDF, TXT, or JSON policy file.
    """
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return _extract_pdf_text(path)
    if suffix == ".txt":
        return path.read_text(encoding="utf-8", errors="ignore").strip()
    if suffix == ".json":
        return _extract_json_text(path)

    raise ValueError("Unsupported file type. Upload a PDF, TXT, or JSON file.")


def _extract_pdf_text(path: Path) -> str:
    text_parts: list[str] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_parts.append(page_text.strip())
    return "\n\n".join(text_parts).strip()


def _extract_json_text(path: Path) -> str:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return json.dumps(data, indent=2, ensure_ascii=False)


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Chunk the policy text using a sliding window with overlap.

    chunk_size: target characters per chunk (400–600 range per spec).
    overlap: characters shared between adjacent chunks for context continuity.
    Only chunks with at least 100 characters are kept to avoid noise.
    """
    cleaned = text.strip()
    if not cleaned:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(cleaned):
        end = min(start + chunk_size, len(cleaned))
        chunk = cleaned[start:end].strip()
        if len(chunk) >= 100:
            chunks.append(chunk)
        start += chunk_size - overlap  # advance with overlap

    return chunks

