#!/usr/bin/env python3
"""
Belastingdienst.nl Scraper
--------------------------
Scrapes official Dutch tax authority pages and converts them into structured
JSON documents tagged by year and topic.

Usage:
    pip install requests beautifulsoup4 lxml tqdm
    python scrape_belastingdienst.py --year 2026 --output data/raw/
    python scrape_belastingdienst.py --url-list urls.txt --output data/raw/

Notes:
    - Respects robots.txt (checks before scraping each domain)
    - Rate-limited to 1 request/second to avoid server load
    - Skips already-scraped URLs (uses content hash for dedup)
    - Outputs one JSON file per source URL
"""

import json, os, time, hashlib, re, logging, argparse
from datetime import datetime, date
from urllib.robotparser import RobotFileParser
from typing import Optional

import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────
# TARGET URLs — all known Belastingdienst pages relevant to ZZP/IB
# ──────────────────────────────────────────────────────────────────
BELASTINGDIENST_URLS: list[dict] = [
    # Box 1 — Tarieven
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/tarieven_boxen/",
     "topic": "box1_brackets", "category": "tax_rates"},

    # Heffingskortingen
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/algemene-heffingskorting/",
     "topic": "algemene_heffingskorting", "category": "credits"},
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/arbeidskorting/",
     "topic": "arbeidskorting", "category": "credits"},
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/inkomensafhankelijke-combinatiekorting/",
     "topic": "iack", "category": "credits"},

    # Ondernemersaftrek
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/ondernemersaftrek/zelfstandigenaftrek/",
     "topic": "zelfstandigenaftrek", "category": "deductions"},
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/ondernemersaftrek/startersaftrek/",
     "topic": "startersaftrek", "category": "deductions"},
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/ondernemersaftrek/mkb-winstvrijstelling/",
     "topic": "mkb_winstvrijstelling", "category": "deductions"},
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/investeringsaftrek/kleinschaligheidsinvesteringsaftrek/",
     "topic": "kia", "category": "deductions"},

    # ZVW
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/ondernemer/zorgverzekeringswet/",
     "topic": "zvw", "category": "social_insurance"},

    # Lijfrente
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/aftrek_en_bijdragen/aftrekbare_kosten/lijfrentepremie/",
     "topic": "lijfrente_jaarruimte", "category": "deductions"},

    # Box 2
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/aanmerkelijk_belang/tarief_box_2/",
     "topic": "box2_rates", "category": "tax_rates"},

    # Box 3
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/vermogen/belasting-betalen-over-uw-vermogen/",
     "topic": "box3_rates", "category": "tax_rates"},

    # BTW
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/hoe_werkt_de_btw/btw-tarieven/",
     "topic": "btw", "category": "vat"},
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/hoe_werkt_de_btw/kleine-ondernemersregeling/",
     "topic": "kor", "category": "vat"},
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw-aangifte-doen-en-betalen/",
     "topic": "deadlines", "category": "compliance"},

    # Toeslagen
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/toeslagen/zorgtoeslag/",
     "topic": "zorgtoeslag", "category": "benefits"},
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/toeslagen/huurtoeslag/",
     "topic": "huurtoeslag", "category": "benefits"},
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/toeslagen/kinderopvangtoeslag/",
     "topic": "kinderopvangtoeslag", "category": "benefits"},

    # Wet DBA
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/ondernemer/wet_deregulering_beoordeling_arbeidsrelaties/",
     "topic": "wet_dba", "category": "compliance"},

    # DGA
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/bv_en_andere_rechtspersonen/directeur-grootaandeelhouder/gebruikelijk_loon/",
     "topic": "dga_salary", "category": "compliance"},

    # 30% Ruling
    {"url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/internationaal/werken_in_het_buitenland/werknemers_die_naar_nederland_komen/30_procent_regeling/",
     "topic": "expat_30pct", "category": "expat"},
]

# ──────────────────────────────────────────────────────────────────
# SCRAPER CORE
# ──────────────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; NLTaxAI-Research-Bot/1.0; +https://nltaxai.example/bot)",
    "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml",
}


def check_robots_allowed(url: str, session: requests.Session) -> bool:
    """Check robots.txt before scraping."""
    from urllib.parse import urlparse
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = RobotFileParser()
    rp.set_url(robots_url)
    try:
        resp = session.get(robots_url, timeout=10, headers=HEADERS)
        rp.parse(resp.text.splitlines())
        return rp.can_fetch(HEADERS["User-Agent"], url)
    except Exception:
        return True  # assume allowed if robots.txt unreachable


def extract_numbers(text: str) -> list[dict]:
    """Extract monetary amounts and percentages from text."""
    numbers = []
    # Percentages: 35,75% or 35.75%
    for m in re.finditer(r"(\d+[,\.]\d+)\s*%", text):
        numbers.append({"type": "percentage", "value": float(m.group(1).replace(",", ".")), "context": text[max(0, m.start()-50):m.end()+50]})
    # Euro amounts: €38.883 or € 38.883 or 38.883 euro
    for m in re.finditer(r"€\s*([\d\.]+(?:[\.,]\d+)?)", text):
        raw = m.group(1).replace(".", "").replace(",", ".")
        try:
            numbers.append({"type": "eur_amount", "value": float(raw), "context": text[max(0, m.start()-50):m.end()+50]})
        except ValueError:
            pass
    return numbers


def extract_dates(text: str) -> list[str]:
    """Extract dates mentioned in the text."""
    dates = []
    for m in re.finditer(r"\b(20\d{2})\b", text):
        dates.append(m.group(1))
    for m in re.finditer(r"\b(\d{1,2}\s+(?:januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+20\d{2})\b", text, re.IGNORECASE):
        dates.append(m.group(1))
    return list(set(dates))


def scrape_page(url: str, topic: str, category: str, year: int, session: requests.Session) -> Optional[dict]:
    """
    Fetch and parse a Belastingdienst.nl page.
    Returns a structured document or None if failed.
    """
    try:
        log.info(f"Fetching: {url}")
        resp = session.get(url, timeout=15, headers=HEADERS)
        resp.raise_for_status()
    except Exception as e:
        log.error(f"Failed to fetch {url}: {e}")
        return None

    soup = BeautifulSoup(resp.text, "lxml")

    # Remove navigation, footer, breadcrumbs — keep main content
    for tag in soup.find_all(["nav", "footer", "header", "aside"]):
        tag.decompose()
    for cls in ["breadcrumb", "navigation", "cookie", "search"]:
        for el in soup.find_all(class_=re.compile(cls, re.I)):
            el.decompose()

    # Extract title
    title_el = soup.find("h1") or soup.find("title")
    title = title_el.get_text(strip=True) if title_el else url.split("/")[-2]

    # Extract main content — Belastingdienst.nl uses specific content divs
    content_div = (
        soup.find("div", class_=re.compile(r"content|main|article", re.I)) or
        soup.find("main") or
        soup.find("body")
    )

    # Get all paragraph text
    paragraphs = []
    for el in (content_div or soup).find_all(["p", "li", "td", "h2", "h3", "h4"]):
        text = el.get_text(" ", strip=True)
        if len(text) > 30:  # skip very short fragments
            paragraphs.append({"tag": el.name, "text": text})

    full_text = " ".join(p["text"] for p in paragraphs)

    # Extract tables
    tables = []
    for tbl in (content_div or soup).find_all("table"):
        rows = []
        headers = [th.get_text(strip=True) for th in tbl.find_all("th")]
        for tr in tbl.find_all("tr"):
            cells = [td.get_text(strip=True) for td in tr.find_all("td")]
            if cells:
                rows.append(dict(zip(headers, cells)) if headers else cells)
        if rows:
            tables.append({"headers": headers, "rows": rows})

    # Build structured document
    content_hash = hashlib.sha256(full_text.encode()).hexdigest()[:16]
    doc = {
        "id": f"BD-{year}-{topic.upper()[:8]}-{content_hash}",
        "source": "belastingdienst.nl",
        "url": url,
        "title": title,
        "year": year,
        "scraped_at": datetime.utcnow().isoformat(),
        "topic": topic,
        "category": category,
        "language": "nl",
        "user_types": infer_user_types(topic),
        "paragraphs": paragraphs[:50],  # cap at 50 paragraphs
        "tables": tables,
        "numbers_extracted": extract_numbers(full_text),
        "years_mentioned": extract_dates(full_text),
        "content_hash": content_hash,
        "char_count": len(full_text),
        "tags": build_tags(topic, category, year),
        "verification_status": "raw_scraped",
    }

    return doc


def infer_user_types(topic: str) -> list[str]:
    topic_map = {
        "zelfstandigenaftrek": ["zzp"], "startersaftrek": ["zzp"],
        "mkb_winstvrijstelling": ["zzp"], "kia": ["zzp"],
        "zvw": ["zzp"], "btw": ["zzp", "dga"], "kor": ["zzp"],
        "wet_dba": ["zzp"], "dga_salary": ["dga"],
        "box2_rates": ["dga"], "expat_30pct": ["expat"],
        "zorgtoeslag": ["all"], "huurtoeslag": ["all"],
        "kinderopvangtoeslag": ["all"], "box1_brackets": ["all"],
        "box3_rates": ["all"], "algemene_heffingskorting": ["all"],
        "arbeidskorting": ["employee", "zzp"], "iack": ["employee", "zzp"],
        "lijfrente_jaarruimte": ["zzp", "employee"],
    }
    return topic_map.get(topic, ["all"])


def build_tags(topic: str, category: str, year: int) -> list[str]:
    return [topic, category, str(year), "belastingdienst", "official"]


def run_scraper(
    urls: list[dict],
    output_dir: str,
    year: int,
    delay_seconds: float = 1.2,
    force_rescrape: bool = False,
):
    os.makedirs(output_dir, exist_ok=True)
    session = requests.Session()
    session.headers.update(HEADERS)

    results = {"scraped": 0, "skipped": 0, "failed": 0}
    index = []

    for entry in urls:
        url = entry["url"]
        topic = entry["topic"]
        category = entry["category"]

        # Output filename based on topic
        out_file = os.path.join(output_dir, f"bd_{year}_{topic}.json")

        if os.path.exists(out_file) and not force_rescrape:
            log.info(f"Skipping {topic} — already scraped (use --force to rescrape)")
            results["skipped"] += 1
            continue

        if not check_robots_allowed(url, session):
            log.warning(f"robots.txt disallows: {url} — skipping")
            results["skipped"] += 1
            continue

        doc = scrape_page(url, topic, category, year, session)

        if doc:
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(doc, f, ensure_ascii=False, indent=2)
            log.info(f"Saved {out_file} ({doc['char_count']} chars, {len(doc['tables'])} tables)")
            results["scraped"] += 1
            index.append({"file": out_file, "url": url, "topic": topic, "id": doc["id"]})
        else:
            results["failed"] += 1

        time.sleep(delay_seconds)  # Rate limiting — be a good citizen

    # Write index file
    index_path = os.path.join(output_dir, f"index_{year}.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump({"year": year, "scraped_at": datetime.utcnow().isoformat(), "documents": index}, f, indent=2)

    log.info(f"Done. Scraped: {results['scraped']}, Skipped: {results['skipped']}, Failed: {results['failed']}")
    log.info(f"Index written to {index_path}")
    return results


# ──────────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape Belastingdienst.nl into structured JSON")
    parser.add_argument("--year", type=int, default=date.today().year, help="Tax year to tag documents with")
    parser.add_argument("--output", default="data/raw/", help="Output directory")
    parser.add_argument("--url-list", help="Optional file with additional URLs (one per line)")
    parser.add_argument("--delay", type=float, default=1.2, help="Seconds between requests (default: 1.2)")
    parser.add_argument("--force", action="store_true", help="Re-scrape even if file exists")
    args = parser.parse_args()

    target_urls = BELASTINGDIENST_URLS.copy()

    if args.url_list and os.path.exists(args.url_list):
        with open(args.url_list) as f:
            for line in f:
                line = line.strip()
                if line and line.startswith("http"):
                    target_urls.append({"url": line, "topic": "other", "category": "other"})

    run_scraper(target_urls, args.output, args.year, args.delay, args.force)
