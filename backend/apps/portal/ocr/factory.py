"""
OCR provider factory.

Reads the OCR_PROVIDER environment variable and returns the appropriate provider.
Default is "none" — safe for production until an OCR provider is configured.

Usage:
    from apps.portal.ocr.factory import get_ocr_provider
    provider = get_ocr_provider()
    result   = provider.extract(file_path)
"""
import os
import logging
from .base import OCRProvider

logger = logging.getLogger(__name__)

_PROVIDERS = {
    "none":               "apps.portal.ocr.none_provider.NoneProvider",
    "google_vision":      "apps.portal.ocr.google_vision_provider.GoogleVisionProvider",
    "google_document_ai": "apps.portal.ocr.google_document_ai_provider.GoogleDocumentAIProvider",
    "azure":              "apps.portal.ocr.azure_document_provider.AzureDocumentProvider",
}


def get_ocr_provider() -> OCRProvider:
    """Return a configured OCR provider instance based on OCR_PROVIDER env var."""
    provider_name = os.environ.get("OCR_PROVIDER", "none").lower()
    dotted_path   = _PROVIDERS.get(provider_name)

    if not dotted_path:
        logger.warning("Unknown OCR_PROVIDER '%s', falling back to 'none'.", provider_name)
        dotted_path = _PROVIDERS["none"]

    module_path, class_name = dotted_path.rsplit(".", 1)
    try:
        import importlib
        module = importlib.import_module(module_path)
        cls    = getattr(module, class_name)
        return cls()
    except Exception as exc:
        logger.error("Failed to load OCR provider '%s': %s. Using NoneProvider.", provider_name, exc)
        from .none_provider import NoneProvider
        return NoneProvider()
