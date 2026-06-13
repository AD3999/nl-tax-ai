# Content Design — TaxWijs

> Writing principles, tone of voice, and terminology standards for NL/EN/FA content across the product.

---

## 1. Tone of Voice

### Dutch (NL) — Primary

**Target:** A knowledgeable friend who understands taxes and speaks plainly.

| ✓ Do | ✗ Don't |
|------|---------|
| "Uw zelfstandigenaftrek is €1.200" | "De aftrekpost ex artikel 3.76 Wet IB 2001 bedraagt..." |
| "U hoeft dit jaar geen startersaftrek meer te claimen, maar doe het nog wel — het is het laatste jaar" | "Conform de huidige wetgeving..." |
| "Vergeet de ZVW-bijdrage niet — dat is 4,85% extra" | (just not mentioning it) |
| Use "u" (formal) for all Dutch content | "jij/je" — too informal for tax context |

### English (EN)

Plain English, no jargon. Non-native speakers are a primary audience.

- Use short sentences (< 20 words)
- Define every Dutch term on first use: "Jaaropgave (annual income statement)"
- "You" not "one" or "the user"
- Present tense where possible

### Persian/Farsi (FA)

Formal Persian, not colloquial. Target: educated Iranian professionals.

- Use proper Persian tax vocabulary (not Dutch tax terms transliterated)
- Numbers: use Arabic-Indic numerals (۱٬۲۰۰ not 1,200) in running text; Western numerals in tables
- RTL layout required everywhere Persian appears
- Month names in Persian: فروردین not ژانویه
- Don't translate Dutch names of organizations (Belastingdienst stays as is)

---

## 2. Terminology Glossary

| Dutch Term | English | Persian | Notes |
|-----------|---------|---------|-------|
| Zelfstandigenaftrek | Self-employment deduction | کسر خوداشتغالی | €1,200 in 2026 |
| Startersaftrek | Starter's deduction | کسر شروع فعالیت | Last year in 2026! |
| MKB-winstvrijstelling | SME profit exemption | معافیت سود کسب‌وکار کوچک | 12.7% |
| ZVW-bijdrage | Health insurance contribution | حق بیمه سلامت | 4.85% — often missed |
| Urencriterium | Hours criterion | معیار ساعت کاری | 1,225 hrs/year |
| Aangifte | Tax return / declaration | اظهارنامه مالیاتی | |
| Jaaropgave | Annual income statement | صورت درآمد سالانه | From employer |
| Belastingdienst | Dutch Tax Authority | اداره مالیات هلند | Never translate the name |
| Toeslagen | Benefits / allowances | کمک‌هزینه‌های دولتی | Includes zorgtoeslag, huurtoeslag |
| Box 1 / Box 2 / Box 3 | Box 1 / Box 2 / Box 3 | جعبه ۱ / جعبه ۲ / جعبه ۳ | Keep "Box" in all languages |
| Wet DBA | Wet DBA | قانون دیبی‌ای | Never translate the law name |
| ZZP | ZZP (self-employed) | فریلنسر (ZZP) | Use both ZZP + Persian gloss |

---

## 3. Numeric Formatting

| Type | NL | EN | FA |
|------|----|----|-----|
| Currency | €1.200,00 | €1,200.00 | €۱٬۲۰۰ |
| Percentage | 4,85% | 4.85% | ۴٫۸۵٪ |
| Large number | €72.000 | €72,000 | €۷۲٬۰۰۰ |
| Threshold | €38.883 | €38,883 | €۳۸٬۸۸۳ |

---

## 4. Error Message Standards

Error messages must be:
- **Actionable:** Tell the user what to do, not just what went wrong
- **Non-blaming:** Never "You entered an invalid..." → "This field needs..."
- **In the user's language:** Never mix languages in an error

```
NL: "Het bestand is te groot. Upload een bestand kleiner dan 25 MB."
EN: "The file is too large. Please upload a file smaller than 25 MB."
FA: "فایل بیش از حد بزرگ است. لطفاً فایلی کوچک‌تر از ۲۵ مگابایت آپلود کنید."
```

---

## 5. Notification Copy Templates

### Document uploaded successfully

```
NL: "Uw [JAAROPGAVE] is ontvangen en wordt verwerkt."
EN: "Your [Annual income statement] has been received and is being processed."
FA: "اسناد شما دریافت شد و در حال پردازش است."
```

### Document needs review

```
NL: "Een document heeft uw aandacht nodig: [document_filename]"
EN: "A document needs your attention: [document_filename]"
FA: "یک سند نیاز به بررسی دارد: [document_filename]"
```

### Readiness score reached 80

```
NL: "Dossier gereed voor beoordeling — score 80%"
EN: "Engagement ready for review — score 80%"
FA: "پرونده آماده بررسی است — امتیاز ۸۰٪"
```
