"""
No-op OCR provider (default).

Returns an empty result with confidence=0.0.
Used when OCR_PROVIDER=none (the default) — no external API calls are made.
The document upload flow still works; the AI extraction step is skipped.
"""
from .base import OCRProvider, OCRResult


class NoneProvider(OCRProvider):
    def extract(self, file_path: str) -> OCRResult:
        return OCRResult(text="", confidence=0.0, provider="none")
