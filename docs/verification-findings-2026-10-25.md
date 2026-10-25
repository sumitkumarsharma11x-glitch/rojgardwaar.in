# Verification Findings — 25 October 2026

## Scope and method
This is a targeted source-and-repository verification pass, not a certified audit of every one of the 5,750 questions. Repository files were fetched from `north-east-job-portal-cleanup`; live production URLs were also attempted from the available environment but DNS resolution failed (`Temporary failure in name resolution`). That means live status is **unverified**, not that the site is down.

## 1. Inventory
The 36 chapter question-bank files were previously enumerated and their counts reconciled to:
- Biology: 1,800
- Physics: 2,050
- Chemistry: 1,900
- Total: 5,750

## 2. Confirmed syllabus-label risk
The official NCERT/CIET Grade 9 book *Exploration* lists integrated Science chapters including:
- Chapter 2: *Cell: The Building Block of Life*
- Chapter 3: *Tissues in Action*
- Chapter 11: *Reproduction: How Life Continues*
Source links:
- NCERT textbook portal: https://ncert.nic.in/textbook.php?iesc1=9-12
- NCERT ePathshala chapter list: https://epathshala.ncert.gov.in/topicc.php?id=0906

Repository metadata sample:
- Biology guide folder `chapter-01` is titled “Cell & Tissue” and contains cell and tissue topics; it spans the concepts of NCERT Grade 9 Chapters 2 and 3 rather than mapping to a single official chapter.
- Biology guide folder `chapter-02` is titled “Reproduction & Life Continuity”; its metadata field `chapterNumber` is 9 while the folder is `chapter-02`, and the current NCERT Grade 9 book lists reproduction as Chapter 11. This is a high-risk labeling ambiguity, not necessarily a science error. Clearly label these as custom topic guides and add an explicit edition-specific NCERT mapping.
- Physics and Chemistry metadata use `classRange: 6-10` rather than a single class/textbook edition. Their concepts may be useful cross-grade, but they cannot be marked as one-to-one NCERT chapter mappings without a learning-outcome map for each target class and edition.

## 3. High-priority candidate corrections found in sample metadata
These are concrete editorial/factual-risk flags from the inspected metadata; review and correct before publication.

### Physics — Motion & Time
In `data/science/physics/chapter-02/meta.json`, a `thinkBeforeAnswer` item says: “ग्राफ क्षैतिज रेखा हो तो वस्तु विरामावस्था में है” (“If the graph is a horizontal line, the object is at rest”).
- **Problem:** This is overgeneralized. A horizontal line on a position–time graph indicates constant position/rest, but a horizontal line on a speed–time graph can indicate constant speed, not rest. A graph must be named.
- **Suggested correction:** “स्थिति–समय (position–time) ग्राफ में क्षैतिज रेखा वस्तु के विराम को दर्शाती है; चाल–समय ग्राफ में क्षैतिज रेखा नियत चाल दर्शा सकती है।”
- English: “A horizontal line on a position–time graph indicates rest; on a speed–time graph, it can indicate constant speed.”

### Chemistry — Physical & Chemical Changes
In `data/science/chemistry/chapter-02/meta.json`:
- The concept text says chemical changes are “प्रायः अनुक्रमणीय”. This is unclear/incorrect terminology for the likely intended idea of “often irreversible.” Replace with “कई रासायनिक परिवर्तन आसानी से उत्क्रमणीय नहीं होते, हालांकि सभी रासायनिक परिवर्तन अनिवार्य रूप से अपरिवर्तनीय नहीं हैं.”
- The rusting heading uses “मोचन (जंग)”; this is confusing for students. Prefer “लोहे में जंग लगना एवं उसकी रोकथाम”.
- The example “जले हुए चाकमाक से नया गंधक डाइऑक्साइड बनता है” appears malformed/ambiguous. If the intended reaction is sulfur burning, state it directly: “गंधक के जलने पर सल्फर डाइऑक्साइड बनती है”; do not retain “चाकमाक” unless that is genuinely the intended material and is chemically explained.
These flags are based on text review and should be resolved against the relevant textbook edition before approval.

## 4. Technical verification — repository vs live
Repository samples inspected:
- `robots.txt` contains `Allow: /` and points to `https://rojgardwaar.in/sitemap.xml`.
- The sitemap file was inspected in the repository; Science pages are intended to remain excluded until review.
- Sample Science hub, Biology subject hub and Biology Chapter 2 HTML contain a viewport meta tag, canonical link and `noindex,follow`.
- The sample Biology Chapter 2 HTML has its canonical set to `https://rojgardwaar.in/science/biology/chapter-02.html`.
Live tests attempted:
- `https://rojgardwaar.in/robots.txt`
- `https://rojgardwaar.in/sitemap.xml`
- `https://rojgardwaar.in/science/index.html`
- `https://rojgardwaar.in/science/biology/chapter-02.html`
All failed from this environment because DNS could not resolve. Therefore no HTTP status, rendered mobile layout, browser console, navigation flow, mock-test interaction, or live canonical/noindex response has been verified.

## 5. Acceptance checklist for the final gate
- [ ] Correct the physics graph statement so it names the graph type.
- [ ] Correct/clarify the chemistry terminology and example.
- [ ] Add class + textbook edition + official chapter/learning outcome mappings for all 36 topic guides.
- [ ] Run bilingual semantic duplicate detection and human review of near-duplicates.
- [ ] Complete option-by-option explanations in both languages and check their correctness.
- [ ] Test every question's stem, four options, correct key and explanations against the mapped syllabus/source.
- [ ] Run a full bank validator and preserve machine-readable results.
- [ ] Test live site from a working network: HTTP status, navigation, responsive/mobile, console, keyboard access, mock-test timer/submit/scoring/review, canonical, noindex and sitemap.
- [ ] Keep all unreviewed Science pages `noindex,follow` and out of sitemap.
- [ ] Request AdSense review only after useful original content and technical/policy checks are complete.

## Conclusion
A targeted verification pass identified concrete wording and syllabus-mapping risks that a structural JSON test would not catch. The 5,750-question bank is **not yet fully fact-checked**, live production is **not verified**, and AdSense approval/readiness cannot be certified from the current evidence.
