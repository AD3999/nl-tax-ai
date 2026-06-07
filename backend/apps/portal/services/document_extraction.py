"""
Document extraction service.

Architecture principles:
  - AI extraction is candidate-only. Never authoritative.
  - Accountant MUST approve extracted values before they affect any calculation.
  - This service classifies documents and extracts candidate fields.
  - For MVP: uses filename/MIME heuristics + optional Claude text extraction.
    Full OCR is deferred — clean review workflow is the priority.
"""
from __future__ import annotations
import re
import json
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

DOCUMENT_TYPE_HINTS = {
    "jaaropgave": ["jaaropgave", "jaaropgaaf", "year statement", "loonopgave"],
    "payslip":    ["loonstrook", "payslip", "salaris", "salary slip"],
    "invoice":    ["factuur", "invoice", "rekening"],
    "receipt":    ["bon", "receipt", "kassabon"],
    "bank_statement": ["rekeningafschrift", "bankafschrift", "bank statement", "statement"],
    "mortgage_statement": ["hypotheek", "mortgage", "annuiteiten"],
    "pension_statement":  ["pensioen", "pension", "lijfrente", "aov"],
    "kvk_extract": ["kvk", "kamer van koophandel", "chamber of commerce"],
    "vat_report":  ["btw", "vat", "omzetbelasting", "aangifte omzetbelasting"],
    "contract":    ["contract", "overeenkomst", "opdracht"],
    "id_document": ["paspoort", "passport", "rijbewijs", "identity", "bsn"],
    "tax_letter":  ["belastingdienst", "aanslag", "beschikking", "belasting"],
}

EXPENSE_CATEGORY_HINTS = {
    "laptop":      ["laptop", "computer", "macbook", "dell", "lenovo", "asus"],
    "phone":       ["iphone", "samsung", "telefoon", "phone", "mobile"],
    "internet":    ["internet", "kpn", "ziggo", "vodafone", "t-mobile", "fiber"],
    "software":    ["adobe", "microsoft", "office", "slack", "github", "subscription", "abonnement"],
    "travel":      ["ns ", "trein", "train", "ov-chipkaart", "flight", "uber"],
    "accountant":  ["accountant", "boekhouder", "belastingadviseur"],
    "marketing":   ["google ads", "facebook", "instagram", "linkedin", "advertentie"],
    "insurance":   ["verzekering", "insurance", "aov", "arbeidsongeschiktheid"],
    "training":    ["cursus", "training", "opleiding", "workshop", "udemy", "coursera"],
}


def classify_document_type(filename: str, mime_type: str, text_content: str = "") -> str:
    """Heuristic classification from filename and extracted text."""
    combined = f"{filename} {text_content}".lower()
    for doc_type, hints in DOCUMENT_TYPE_HINTS.items():
        if any(hint in combined for hint in hints):
            return doc_type
    return "unknown"


def extract_amounts(text: str) -> list[dict]:
    """Extract currency amounts from text. Returns list of {amount, context}."""
    # Match: €1.234,56 or EUR 1234.56 or 1.234,56 EUR
    pattern = r"(?:€|EUR)\s*([\d.]+[,.][\d]+)|(\d+[,.][\d]+)\s*(?:€|EUR)"
    matches = []
    for m in re.finditer(pattern, text, re.IGNORECASE):
        raw = m.group(1) or m.group(2)
        # Normalise Dutch thousands-separator: 1.234,56 → 1234.56
        normalised = raw.replace(".", "").replace(",", ".")
        try:
            amount = float(normalised)
            context = text[max(0, m.start()-40):m.end()+40].strip()
            matches.append({"amount": amount, "context": context})
        except ValueError:
            pass
    return matches


def extract_date(text: str) -> str | None:
    """Extract first date-like string from text."""
    patterns = [
        r"\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b",
        r"\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b",
        r"\b(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+(\d{4})\b",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return m.group(0)
    return None


def guess_expense_category(text: str) -> str:
    lower = text.lower()
    for category, hints in EXPENSE_CATEGORY_HINTS.items():
        if any(hint in lower for hint in hints):
            return category
    return "other"


def extract_from_document(document) -> dict:
    """
    Main extraction entry point.

    1. Classify document type.
    2. Attempt text extraction from PDF (if pdfminer is available).
    3. Run heuristic extraction.
    4. If Anthropic API is available, run Claude extraction on text.
    5. Return extracted_json with confidence score.
    6. Create candidate ExtractedIncome / ExtractedExpense rows.
    """
    filename  = document.original_filename.lower()
    mime_type = document.mime_type.lower()
    text_content = ""

    # ── Step 1: Extract text from PDF ─────────────────────────────────────
    if "pdf" in mime_type:
        try:
            from pdfminer.high_level import extract_text as pdf_extract_text
            text_content = pdf_extract_text(document.file.path) or ""
        except Exception as e:
            logger.debug(f"PDF text extraction skipped: {e}")

    # ── Step 2: Classify ──────────────────────────────────────────────────
    doc_type = classify_document_type(filename, mime_type, text_content)

    # ── Step 3: Heuristic extraction ─────────────────────────────────────
    amounts = extract_amounts(text_content) if text_content else []
    date    = extract_date(text_content) if text_content else None

    # Supplier: first all-caps word sequence longer than 3 chars
    supplier_match = re.search(r"\b([A-Z][A-Z &.]{3,30})\b", text_content or "")
    supplier = supplier_match.group(1).title() if supplier_match else ""

    # Estimate largest amount as gross total
    total_gross = max((a["amount"] for a in amounts), default=0)

    # VAT: look for BTW line
    vat_amount = 0.0
    btw_match = re.search(r"(?:BTW|VAT|omzetbelasting)[^\d]*([\d.,]+)", text_content or "", re.IGNORECASE)
    if btw_match:
        try:
            vat_amount = float(btw_match.group(1).replace(".", "").replace(",", "."))
        except ValueError:
            pass

    expense_category = guess_expense_category(text_content + " " + filename) if doc_type in ("invoice", "receipt") else ""

    # Confidence: higher when we have more signals
    confidence = 0.0
    if doc_type != "unknown":
        confidence += 0.3
    if total_gross > 0:
        confidence += 0.3
    if date:
        confidence += 0.2
    if supplier:
        confidence += 0.1
    if text_content:
        confidence += 0.1

    # ── Step 4: Optional Claude enhancement ──────────────────────────────
    claude_result = {}
    if text_content and len(text_content) > 50:
        try:
            claude_result = _claude_extract(text_content[:3000], doc_type)
            if claude_result:
                confidence = min(1.0, confidence + 0.2)
        except Exception as e:
            logger.debug(f"Claude extraction skipped: {e}")

    extracted = {
        "document_type":   claude_result.get("document_type") or doc_type,
        "supplier_name":   claude_result.get("supplier_name") or supplier,
        "date":            claude_result.get("date") or date,
        "total_gross":     claude_result.get("total_gross") or total_gross,
        "total_net":       claude_result.get("total_net") or (total_gross - vat_amount if vat_amount else None),
        "vat_amount":      claude_result.get("vat_amount") or vat_amount or None,
        "currency":        "EUR",
        "expense_category": claude_result.get("expense_category") or expense_category or None,
        "income_type":     claude_result.get("income_type") or None,
        "confidence":      round(confidence, 2),
        "issues":          [],
    }

    if total_gross == 0 and not claude_result.get("total_gross"):
        extracted["issues"].append("Could not extract monetary amount — manual review required")

    # ── Step 5: Save extraction result to document ─────────────────────
    document.extracted_json   = extracted
    document.confidence_score = confidence
    document.document_type    = extracted["document_type"]

    if confidence >= 0.5:
        document.processing_status = "extracted"
    else:
        document.processing_status = "needs_review"

    document.save(update_fields=["extracted_json", "confidence_score", "document_type", "processing_status"])

    # ── Step 6: Create candidate income/expense rows ──────────────────
    if extracted["total_gross"] and extracted["total_gross"] > 0:
        _create_candidate_rows(document, extracted)

    return extracted


def _claude_extract(text: str, doc_type: str) -> dict:
    """
    Use Claude to extract structured data from document text.
    Returns dict or empty dict if unavailable.
    Always returns CANDIDATE data only.
    """
    import os
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return {}

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        system = (
            "You are a Dutch tax document parser. Extract structured data from the provided document text. "
            "Return ONLY valid JSON with these keys: "
            "document_type, supplier_name, date (YYYY-MM-DD), total_gross (number), total_net (number or null), "
            "vat_amount (number or null), expense_category (one of: laptop, phone, internet, software, travel, car, "
            "office, home_office, training, accountant, marketing, insurance, pension, equipment, meal, other, or null), "
            "income_type (one of: salary, zzp_revenue, dividend, benefit, foreign_income, other, or null). "
            "If you cannot determine a value, use null. Never guess tax implications."
        )

        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=400,
            system=system,
            messages=[{"role": "user", "content": f"Document type hint: {doc_type}\n\nDocument text:\n{text}"}],
        )
        content = response.content[0].text.strip()
        # Extract JSON from response
        json_match = re.search(r"\{.*\}", content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
    except Exception as e:
        logger.debug(f"Claude extraction error: {e}")

    return {}


def _create_candidate_rows(document, extracted: dict):
    """Create ExtractedIncome or ExtractedExpense candidate rows from extraction result."""
    from apps.portal.models import ExtractedIncome, ExtractedExpense

    engagement     = document.engagement
    client_profile = document.client_profile
    doc_type       = extracted.get("document_type", "unknown")
    gross          = extracted.get("total_gross") or 0

    if gross <= 0:
        return

    # Income documents
    if doc_type in ("jaaropgave", "payslip") or extracted.get("income_type"):
        income_type = extracted.get("income_type") or (
            "salary" if doc_type in ("jaaropgave", "payslip") else "other"
        )
        # Avoid exact duplicates
        if not ExtractedIncome.objects.filter(
            engagement=engagement,
            source_document=document,
        ).exists():
            ExtractedIncome.objects.create(
                engagement=engagement,
                client_profile=client_profile,
                source_document=document,
                income_type=income_type,
                description=f"From {document.original_filename}",
                gross_amount=Decimal(str(gross)),
                review_status="candidate",
            )

    # Expense documents
    elif doc_type in ("receipt", "invoice") or extracted.get("expense_category"):
        category = extracted.get("expense_category") or "other"
        vat      = extracted.get("vat_amount") or 0
        net      = extracted.get("total_net") or (gross - vat if vat else None)

        if not ExtractedExpense.objects.filter(
            engagement=engagement,
            source_document=document,
        ).exists():
            ExtractedExpense.objects.create(
                engagement=engagement,
                client_profile=client_profile,
                source_document=document,
                expense_category=category,
                description=f"From {document.original_filename}",
                amount_gross=Decimal(str(gross)),
                amount_net=Decimal(str(net)) if net else None,
                vat_amount=Decimal(str(vat)) if vat else None,
                supplier_name=extracted.get("supplier_name") or "",
                review_status="candidate",
            )
