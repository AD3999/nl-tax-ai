"""
Azure Form Recognizer / Document Intelligence OCR provider.

Requires: pip install azure-ai-formrecognizer
Env vars:
  AZURE_FORM_RECOGNIZER_ENDPOINT
  AZURE_FORM_RECOGNIZER_KEY
Set OCR_PROVIDER=azure to activate.
"""
import logging
import os
from .base import OCRProvider, OCRResult

logger = logging.getLogger(__name__)


class AzureDocumentProvider(OCRProvider):
    def __init__(self):
        self._endpoint = os.environ.get("AZURE_FORM_RECOGNIZER_ENDPOINT", "")
        self._key      = os.environ.get("AZURE_FORM_RECOGNIZER_KEY", "")
        try:
            from azure.ai.formrecognizer import DocumentAnalysisClient  # noqa: F401
            self._available = bool(self._endpoint and self._key)
        except ImportError:
            logger.warning("azure-ai-formrecognizer not installed.")
            self._available = False

    def extract(self, file_path: str) -> OCRResult:
        if not self._available:
            return OCRResult(text="", confidence=0.0, provider="azure",
                             raw_response={"error": "azure-ai-formrecognizer unavailable"})
        try:
            from azure.ai.formrecognizer import DocumentAnalysisClient
            from azure.core.credentials import AzureKeyCredential
            client = DocumentAnalysisClient(
                endpoint=self._endpoint,
                credential=AzureKeyCredential(self._key),
            )
            with open(file_path, "rb") as f:
                poller = client.begin_analyze_document("prebuilt-read", f)
            result = poller.result()
            full_text = "\n".join(
                line.content
                for page in result.pages
                for line in page.lines
            )
            return OCRResult(
                text=full_text,
                confidence=0.92,
                provider="azure",
                raw_response={"page_count": len(result.pages)},
            )
        except Exception as exc:
            logger.error("AzureDocumentProvider error: %s", exc)
            return OCRResult(text="", confidence=0.0, provider="azure",
                             raw_response={"error": str(exc)})
