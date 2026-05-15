#!/usr/bin/env python3
"""
Forum Q&A Scraper
-----------------
Extracts real tax questions and answers from:
  1. Reddit r/DutchTaxes + r/Netherlands + r/Expats (via Reddit API / PRAW)
  2. expatforum.nl (HTML scraping, respectful rate-limiting)

Output: structured QA pairs in the qa_pair.schema.json format.

Setup:
    pip install praw requests beautifulsoup4 lxml tqdm
    Copy .env.example to .env and fill in Reddit API credentials

Reddit API setup:
    1. Go to https://www.reddit.com/prefs/apps
    2. Create a new "script" app
    3. Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT in .env
"""

import json, os, re, time, hashlib, logging, argparse
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────
# TAX KEYWORD FILTERS — only keep tax-relevant threads
# ──────────────────────────────────────────────────────────────────
TAX_KEYWORDS_REQUIRED = [
    "belasting", "tax", "aangifte", "zzp", "freelanc", "inkomstenbelasting",
    "btw", "vat", "heffing", "aftrek", "deduct", "zelfstandig", "ondernemer",
    "expat", "30%", "30 procent", "toeslagen", "toeslag", "zvw",
    "box 1", "box 2", "box 3", "huurtoesla", "zorgtoesla",
]

TAX_KEYWORDS_BOOST = [
    "zelfstandigenaftrek", "startersaftrek", "mkb", "arbeidskorting",
    "heffingskorting", "wet dba", "schijnzelfstandigheid", "jaarruimte",
    "lijfrente", "kia investering", "voorlopige aanslag",
]

def is_tax_relevant(text: str, min_keywords: int = 1) -> bool:
    text_lower = text.lower()
    count = sum(1 for kw in TAX_KEYWORDS_REQUIRED if kw in text_lower)
    return count >= min_keywords


# ──────────────────────────────────────────────────────────────────
# REDDIT SCRAPER (requires PRAW)
# ──────────────────────────────────────────────────────────────────

def scrape_reddit(
    subreddits: list[str],
    search_queries: list[str],
    output_dir: str,
    year: int,
    max_posts_per_query: int = 50,
) -> list[dict]:
    """
    Search Reddit for Dutch tax Q&A and extract structured QA pairs.
    Requires PRAW and Reddit API credentials in environment variables.
    """
    try:
        import praw
    except ImportError:
        log.error("praw not installed. Run: pip install praw")
        return []

    client_id     = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    user_agent    = os.getenv("REDDIT_USER_AGENT", "NLTaxAI-Research-Bot/1.0")

    if not client_id or not client_secret:
        log.error("REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET not set in environment")
        return []

    reddit = praw.Reddit(client_id=client_id, client_secret=client_secret, user_agent=user_agent)

    qa_pairs = []
    seen_ids = set()

    for subreddit_name in subreddits:
        subreddit = reddit.subreddit(subreddit_name)
        for query in search_queries:
            log.info(f"Searching r/{subreddit_name} for: '{query}'")
            try:
                for submission in subreddit.search(query, limit=max_posts_per_query, time_filter="year"):
                    if submission.id in seen_ids:
                        continue
                    seen_ids.add(submission.id)

                    full_text = f"{submission.title} {submission.selftext}"
                    if not is_tax_relevant(full_text):
                        continue

                    # Find the best answer (top comment with most upvotes and substance)
                    submission.comments.replace_more(limit=0)
                    best_answers = sorted(
                        [c for c in submission.comments if hasattr(c, "body") and len(c.body) > 100],
                        key=lambda c: c.score,
                        reverse=True
                    )[:3]

                    if not best_answers:
                        continue

                    qa = build_reddit_qa(submission, best_answers, subreddit_name, year)
                    if qa:
                        qa_pairs.append(qa)

            except Exception as e:
                log.warning(f"Error searching r/{subreddit_name} for '{query}': {e}")
            time.sleep(1.0)  # Rate limiting

    log.info(f"Extracted {len(qa_pairs)} Q&A pairs from Reddit")
    return qa_pairs


def build_reddit_qa(submission, top_comments: list, subreddit: str, year: int) -> Optional[dict]:
    """Convert a Reddit thread into a structured QA pair."""
    question = submission.title
    if not question or len(question) < 15:
        return None

    best_answer = top_comments[0].body if top_comments else ""
    if not best_answer or len(best_answer) < 50:
        return None

    # Clean markdown
    best_answer_clean = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", best_answer)
    best_answer_clean = re.sub(r"[*_~`#>]", "", best_answer_clean).strip()

    uid = hashlib.sha256(f"{submission.id}".encode()).hexdigest()[:8]

    # Infer user type from content
    user_types = []
    full = (question + " " + submission.selftext).lower()
    if any(w in full for w in ["zzp", "freelanc", "zelfstandig", "ondernemer", "eenmanszaak"]):
        user_types.append("zzp")
    if any(w in full for w in ["expat", "30%", "30 procent", "international"]):
        user_types.append("expat")
    if any(w in full for w in ["dga", "bv ", "directeur"]):
        user_types.append("dga")
    if not user_types:
        user_types = ["all"]

    # Infer tags
    tags = []
    for kw in TAX_KEYWORDS_REQUIRED + TAX_KEYWORDS_BOOST:
        if kw in full:
            tags.append(kw.replace(" ", "_"))
    tags = list(set(tags))[:10]

    return {
        "id": f"QA-{year}-R{uid}",
        "year": year,
        "question_nl": question,
        "question_en": None,  # To be translated later
        "question_fa": None,  # To be translated later
        "question_variants": [],
        "answer": {
            "short_nl": best_answer_clean[:200],
            "detailed_nl": best_answer_clean,
            "conditions_that_change_answer": [],
        },
        "rule_ids": [],  # To be mapped later
        "source_url": f"https://reddit.com{submission.permalink}",
        "source_type": f"reddit_r_{subreddit.lower()}",
        "original_thread_url": f"https://reddit.com{submission.permalink}",
        "user_types": user_types,
        "tags": tags,
        "difficulty": "intermediate",
        "verification_status": "pending",
        "expected_ai_behavior": "answer_with_caveat",
        "_raw": {
            "reddit_id": submission.id,
            "subreddit": subreddit,
            "score": submission.score,
            "num_comments": submission.num_comments,
            "created_utc": submission.created_utc,
            "top_answer_score": top_comments[0].score if top_comments else 0,
            "all_answers_preview": [c.body[:200] for c in top_comments],
        }
    }


# ──────────────────────────────────────────────────────────────────
# EXPATFORUM.NL SCRAPER
# ──────────────────────────────────────────────────────────────────

EXPATFORUM_SEARCH_URLS = [
    "https://www.expatforum.nl/forums/netherlands-expat-forum-the-netherlands/taxes-legal/",
    "https://www.expatforum.nl/forums/netherlands-expat-forum-the-netherlands/finances-banking/",
]

EXPAT_SEARCH_QUERIES = [
    "tax zzp freelance", "belasting aangifte", "30 percent ruling",
    "box 1 box 2 box 3", "zorgtoeslag", "income tax netherlands",
]

HEADERS_EF = {
    "User-Agent": "Mozilla/5.0 (compatible; NLTaxAI-Research-Bot/1.0)",
    "Accept-Language": "en-US,en;q=0.9",
}


def scrape_expatforum(output_dir: str, year: int, max_threads: int = 100) -> list[dict]:
    """Scrape expatforum.nl for tax-related Q&A threads."""
    session = requests.Session()
    session.headers.update(HEADERS_EF)
    qa_pairs = []
    seen_urls = set()

    for forum_url in EXPATFORUM_SEARCH_URLS:
        log.info(f"Scraping forum listing: {forum_url}")
        try:
            resp = session.get(forum_url, timeout=15)
            resp.raise_for_status()
        except Exception as e:
            log.error(f"Failed: {forum_url} — {e}")
            continue

        soup = BeautifulSoup(resp.text, "lxml")
        # Find thread links
        thread_links = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "threads" in href and href not in seen_urls:
                full_url = href if href.startswith("http") else f"https://www.expatforum.nl{href}"
                thread_links.append(full_url)
                seen_urls.add(href)

        for thread_url in thread_links[:max_threads]:
            qa = scrape_expatforum_thread(thread_url, session, year)
            if qa:
                qa_pairs.append(qa)
            time.sleep(1.5)

    log.info(f"Extracted {len(qa_pairs)} Q&A pairs from expatforum.nl")
    return qa_pairs


def scrape_expatforum_thread(url: str, session: requests.Session, year: int) -> Optional[dict]:
    """Scrape a single expatforum.nl thread into a QA pair."""
    try:
        resp = session.get(url, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        log.error(f"Thread fetch failed: {url} — {e}")
        return None

    soup = BeautifulSoup(resp.text, "lxml")

    # Get thread title (question)
    title_el = soup.find("h1") or soup.find("title")
    if not title_el:
        return None
    question = title_el.get_text(strip=True)

    if not is_tax_relevant(question):
        return None

    # Get all posts
    posts = []
    for post_div in soup.find_all("div", class_=re.compile(r"message-body|post-body|bbWrapper", re.I)):
        text = post_div.get_text(" ", strip=True)
        if len(text) > 80:
            posts.append(text)

    if len(posts) < 2:
        return None  # Need at least question + answer

    first_post = posts[0]
    # Best answer = longest substantive reply
    answers = sorted(posts[1:], key=len, reverse=True)
    best_answer = answers[0] if answers else ""

    if len(best_answer) < 80:
        return None

    uid = hashlib.sha256(url.encode()).hexdigest()[:8]

    user_types = []
    full = (question + " " + first_post).lower()
    if any(w in full for w in ["zzp", "freelanc", "self-employed"]):
        user_types.append("zzp")
    if any(w in full for w in ["expat", "30%", "30 percent"]):
        user_types.append("expat")
    if not user_types:
        user_types = ["expat", "all"]

    return {
        "id": f"QA-{year}-EF{uid}",
        "year": year,
        "question_nl": question,
        "question_en": question,
        "question_fa": None,
        "question_variants": [],
        "answer": {
            "short_nl": best_answer[:200],
            "short_en": best_answer[:200],
            "detailed_nl": best_answer,
            "detailed_en": best_answer,
            "conditions_that_change_answer": [],
        },
        "rule_ids": [],
        "source_url": url,
        "source_type": "expatforum",
        "original_thread_url": url,
        "user_types": user_types,
        "tags": ["expat", "forum", str(year)],
        "difficulty": "intermediate",
        "verification_status": "pending",
        "expected_ai_behavior": "answer_with_caveat",
    }


# ──────────────────────────────────────────────────────────────────
# SAVE + CLI
# ──────────────────────────────────────────────────────────────────

def save_qa_pairs(qa_pairs: list[dict], output_dir: str, source: str, year: int):
    os.makedirs(output_dir, exist_ok=True)
    out_file = os.path.join(output_dir, f"qa_{source}_{year}.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(qa_pairs, f, ensure_ascii=False, indent=2)
    log.info(f"Saved {len(qa_pairs)} QA pairs to {out_file}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape forum Q&A into structured tax QA pairs")
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--output", default="data/raw/")
    parser.add_argument("--reddit", action="store_true", help="Scrape Reddit (requires REDDIT_CLIENT_ID env var)")
    parser.add_argument("--expatforum", action="store_true", help="Scrape expatforum.nl")
    parser.add_argument("--max-posts", type=int, default=100, help="Max posts per Reddit query")
    args = parser.parse_args()

    if not args.reddit and not args.expatforum:
        log.info("No source specified. Use --reddit and/or --expatforum. Running both with defaults.")
        args.reddit = True
        args.expatforum = True

    REDDIT_SUBREDDITS = ["DutchTaxes", "Netherlands", "Expats", "DutchFinance"]
    REDDIT_QUERIES = [
        "zzp belasting 2026", "zelfstandigenaftrek 2026",
        "box 1 tax netherlands freelance", "30 percent ruling netherlands",
        "dutch income tax return aangifte", "zvw bijdrage zzp",
        "huurtoeslag zzp ondernemer", "wet dba schijnzelfstandigheid",
        "mkb winstvrijstelling freelancer", "startersaftrek 2026",
    ]

    all_qa = []

    if args.reddit:
        reddit_qa = scrape_reddit(REDDIT_SUBREDDITS, REDDIT_QUERIES, args.output, args.year, args.max_posts)
        save_qa_pairs(reddit_qa, args.output, "reddit", args.year)
        all_qa.extend(reddit_qa)

    if args.expatforum:
        ef_qa = scrape_expatforum(args.output, args.year)
        save_qa_pairs(ef_qa, args.output, "expatforum", args.year)
        all_qa.extend(ef_qa)

    if all_qa:
        save_qa_pairs(all_qa, args.output, "combined", args.year)
        log.info(f"Total QA pairs collected: {len(all_qa)}")
