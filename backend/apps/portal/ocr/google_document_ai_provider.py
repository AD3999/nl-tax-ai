"""
Google Document AI OCR provider.

Requires: pip install google-cloud-documentai
Env vars:
  GOOGLE_APPLICATION_CREDENTIALS
  GOOGLE_DOCAI_PROJECT_ID
  GOOGLE_DOCAI_LOCATION  (e.g. "eu")
  GOOGLE_DOCAI_PROCESSOR_ID
Set OCR_PROVIDER=google_document_ai to activate.
"""
import logging
import os
from .base import OCRProvider, OCRResult

logger = logging.getLogger(__name__)


class GoogleDocumentAIProvider(OCRProvider):
    def __init__(self):
        self._project  = os.environ.get("GOOGLE_DOCAI_PROJECT_ID", "")
        self._location = os.environ.get("GOOGLE_DOCAI_LOCATION", "eu")
        self._processor = os.environ.get("GOOGLE_DOCAI_PROCESSOR_ID", "")
        try:
            from google.cloud import documentai  # noqa: F401
            self._available = bool(self._project and self._processor)
        except ImportError:
            logger.warning("google-cloud-documentai not installed.")
            self._available = False

    def extract(self, file_path: str) -> OCRResult:
        if not self._available:
            return OCRResult(text="", confidence=0.0, provider="google_document_ai",
                             raw_response={"error": "google-cloud-documentai unavailable"})
        try:
            from google.cloud import documentai
            client  = documentai.DocumentProcessorServiceClient()
            name    = client.processor_path(self._project, self._location, self._processor)
            with open(file_path, "rb") as f:
                content = f.read()
            raw_doc  = documentai.RawDocument(content=content, mime_type="application/pdf")
            request  = documentai.ProcessRequest(name=name, raw_document=raw_doc)
            result   = client.process_document(request=request)
            doc      = result.document
            return OCRResult(
                text=doc.text,
                confidence=0.95,
                pages=[p.layout.text_anchor.content for p in doc.pages] if doc.pages else [],
                provider="google_document_ai",
            )
        except Exception as exc:
            logger.error("GoogleDocumentAIProvider error: %s", exc)
            return OCRResult(text="", confidence=0.0, provider="google_document_ai",
                             raw_response={"error": str(exc)})
