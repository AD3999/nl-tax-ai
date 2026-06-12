"""
Abstract OCR provider interface.

All concrete providers must subclass OCRProvider and implement extract().
The contract: given a file path or bytes, return an OCRResult with raw text
and a confidence score. Downstream AI extraction reads the text — it never
touches the raw document directly.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class OCRResult:
    text: str                          # full extracted text
    confidence: float                  # 0.0 – 1.0
    pages: list[str] = field(default_factory=list)  # per-page text (optional)
    provider: str = "unknown"
    raw_response: Optional[dict] = None


class OCRProvider(ABC):
    """Base class for all OCR providers."""

    @abstractmethod
    def extract(self, file_path: str) -> OCRResult:
        """
        Extract text from a document file at file_path.
        Returns an OCRResult. Never raises — on failure return confidence=0.0.
        """
        ...

    def extract_bytes(self, data: bytes, mime_type: str = "application/pdf") -> OCRResult:
        """Optional: extract from raw bytes. Defaults to writing a temp file."""
        import tempfile, os
        suffix = ".pdf" if "pdf" in mime_type else ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
            f.write(data)
            tmp = f.name
        try:
            return self.extract(tmp)
        finally:
            os.unlink(tmp)
