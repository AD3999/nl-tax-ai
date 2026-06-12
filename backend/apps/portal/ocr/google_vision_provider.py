"""
Google Vision API OCR provider.

Requires: pip install google-cloud-vision
Env vars: GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)
Set OCR_PROVIDER=google_vision to activate.
"""
import logging
from .base import OCRProvider, OCRResult

logger = logging.getLogger(__name__)


class GoogleVisionProvider(OCRProvider):
    def __init__(self):
        try:
            from google.cloud import vision  # noqa: F401
            self._available = True
        except ImportError:
            logger.warning("google-cloud-vision not installed; GoogleVisionProvider unavailable.")
            self._available = False

    def extract(self, file_path: str) -> OCRResult:
        if not self._available:
            return OCRResult(text="", confidence=0.0, provider="google_vision",
                             raw_response={"error": "google-cloud-vision not installed"})
        try:
            from google.cloud import vision
            client = vision.ImageAnnotatorClient()
            with open(file_path, "rb") as f:
                content = f.read()
            image    = vision.Image(content=content)
            response = client.text_detection(image=image)
            texts    = response.text_annotations
            if not texts:
                return OCRResult(text="", confidence=0.5, provider="google_vision")
            full_text = texts[0].description
            return OCRResult(
                text=full_text,
                confidence=0.9,
                provider="google_vision",
                raw_response={"annotation_count": len(texts)},
            )
        except Exception as exc:
            logger.error("GoogleVisionProvider error: %s", exc)
            return OCRResult(text="", confidence=0.0, provider="google_vision",
                             raw_response={"error": str(exc)})
