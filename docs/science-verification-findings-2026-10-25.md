# Science Content Verification Findings — 25 October 2026

Scope: targeted repository review of representative Biology, Physics and Chemistry topic-guide metadata and question files on `north-east-job-portal-cleanup`, plus an attempted live-site fetch. This is a targeted review, not certification of all 5,750 questions.

## Confirmed inventory from the prior full-bank structural scan
- 36 question-bank files: Biology 1,800; Physics 2,050; Chemistry 1,900; total 5,750.
- Structural validation does not establish factual accuracy, syllabus fit, bilingual parity or quality of distractors.
- Earlier explanation-length and option-explanation counts are triage indicators, not academic verdicts.

## High-confidence findings from representative files

### C1 — Hindi/English example mismatch in Chemistry guide 2 (high priority)
File: `data/science/chemistry/chapter-02/meta.json`
- Hindi example says burning “चाकमाक” produces “गंधक डाइऑक्साइड”.
- English counterpart says burning magnesium produces magnesium oxide.
- These are different examples and different products. They must be made scientifically equivalent in both languages. The English example “burning magnesium produces magnesium oxide” is a clear, standard example; if chosen, use its accurate Hindi translation too.
- The Hindi term “चाकमाक” appears inconsistent with the English “magnesium” and should not be silently retained.

### C2 — Hindi concept reverses/contradicts the English concept (high priority)
Same file:
- Hindi says chemical changes are “प्रायः अनुक्रमणीय”.
- English says “mostly irreversible”.
- “अनुक्रमणीय” is not the correct Hindi equivalent for “irreversible” and can change the meaning. Use “प्रायः अनुत्क्रमणीय” only with the appropriate scientific qualification; do not imply every chemical change is irreversible.

### C3 — Chemistry topic terminology and example need clarification (high priority)
Same file:
- Topic “मोचन (जंग) एवं उसकी रोकथाम” uses a questionable term for rusting. Prefer clear student-facing wording such as “लोहे में जंग लगना एवं उसकी रोकथाम”.
- “चूने के जल में घुलने पर ... नया पदार्थ बनता है” is imprecise. Distinguish dissolving lime from the chemical reaction of quicklime (calcium oxide) with water to form calcium hydroxide. State the intended reactants and product.
- Avoid using colour/gas/heat alone as proof of chemical change; these are clues, not individually sufficient tests in every case.

### C4 — Question explanation is repetitive and not a teaching explanation (high priority)
File: `data/science/chemistry/chapter-02/questions.json`, `chem2_q103`
- Hindi explanation repeats the question stem and then asserts that “भौतिक परिवर्तन” matches it, without explaining the underlying concept. It also contains a stray full-width CJK full stop (`。`).
- English explanation is much shorter (“The state changed, the substance stayed”) than Hindi. The languages do not provide comparable instructional depth.
- Rewrite both versions consistently: melting wax changes state but does not form a new substance; therefore it is a physical change. If the question says “wax getting hot and melting”, distinguish the melting process from burning wax, which is a chemical change.

### C5 — Chapter path and chapter number need an explicit mapping (medium/high priority)
File: `data/science/biology/chapter-02/meta.json`
- Path is `chapter-02`, while metadata says `chapterNumber: 9` and `code: B09`.
- This may reflect a custom guide sequence mapped to an official textbook chapter, but the mapping is not explicit in the fields inspected. It can confuse users and page navigation/SEO if one field is treated as the public chapter number.
- Add separate fields such as `guideNumber`, `officialTextbook`, `textbookEdition`, `officialChapterNumber`, and `learningOutcomes`; only populate official values after checking the correct class/language/edition.

### C6 — Mixed grade range is too broad without per-topic grade labels (medium/high priority)
Files: `data/science/physics/chapter-02/meta.json` and `data/science/chemistry/chapter-02/meta.json`
- Metadata states `classRange: "6-10"` while bundling concepts such as velocity-time graphs, acceleration and chemical changes in one guide.
- A range alone does not tell a learner which grade's expected depth is being followed. Map each section/question to the intended class and learning outcome, or clearly label this as a cross-grade guide.
- Do not present the 36 topic-guide numbering as official NCERT chapter numbering unless the mapping is verified.

## Live website verification result
Attempted direct fetches of:
- `https://rojgardwaar.in/robots.txt`
- `https://rojgardwaar.in/sitemap.xml`
- `https://rojgardwaar.in/science/index.html`
- `https://rojgardwaar.in/science/biology/chapter-02.html`

The environment returned DNS name-resolution failures (`Temporary failure in name resolution`). This means live HTTP status, mobile rendering, navigation, JavaScript console, mock-test interaction, canonical response and sitemap/robots behavior could not be verified here. It does **not** prove the website is down.

Repository files inspected on `north-east-job-portal-cleanup`:
- `robots.txt` allows crawling and points to `https://rojgardwaar.in/sitemap.xml`.
- `sitemap.xml` exists in the branch and Science pages are intentionally excluded while they remain under review.
- Sample Science pages have `noindex,follow` and canonical tags. Every page still needs a full consistency check before publication.

## Official syllabus reference
NCERT's current online textbook portal must be used with the correct class, subject, language and edition. Its Class IX Science page lists the current “Exploration” book and chapters; NCERT also explicitly notes that its textbooks are copyrighted and cannot simply be republished/hosted by another website. Prefer original explanations and diagrams, with links to official material where permitted.

- NCERT Class IX Science textbook page: https://ncert.nic.in/textbook.php?iesc1=9-12
- NCERT general textbook portal and copyright notice: https://ncert.nic.in/textbook.php

## Required fixes before acceptance
1. Correct C1–C4 in the source metadata/question bank, preserving Hindi-English meaning and scientific precision.
2. Define a transparent guide-number ↔ official textbook chapter/learning-outcome mapping for all 36 guides.
3. Run semantic near-duplicate detection and human adjudication; exact-string checks are insufficient.
4. Review distractors for plausibility, ambiguity, answer giveaways and multiple defensible answers.
5. Add four reviewed option-specific explanations per question in both languages; compare instructional depth across languages.
6. Check every note's concepts, examples, equations, diagrams, accessibility text and sources.
7. Run all repository tests/CI on the proposed PR and inspect the actual results.
8. From a network that resolves production, verify all live URLs, 200/404 status, canonical and noindex, sitemap validity/URL consistency, mobile layouts, navigation, mock-test timer/submission/scoring/review, forms, policy pages and browser console.
9. Keep Science pages noindex and out of the sitemap until academic and technical acceptance gates pass. AdSense approval cannot be guaranteed.

## Status
Targeted verification has identified concrete content-quality defects. The full 5,750-question scientific audit, complete 36-guide NCERT mapping, live website tests and final AdSense readiness remain open. Do not claim these are complete until evidence is recorded.


## Follow-up fixes applied in the verification branch
- Chemistry guide 2 Hindi example now matches the English example: burning magnesium produces magnesium oxide.
- Corrected the Hindi wording for chemical changes and clarified that many are not easily reversible rather than making an absolute claim.
- Replaced the unclear rusting heading with “लोहे में जंग लगना एवं उसकी रोकथाम”.
- Clarified the quicklime + water example and cautioned against treating colour/gas/temperature signs alone as proof of a chemical change.
- Rewrote Chemistry question `chem2_q103` explanation in both languages and added four option-specific explanations per language.
- Re-fetched the edited files and confirmed both JSON files parse, the Hindi/English magnesium example is aligned, and `chem2_q103` has four Hindi and four English option explanations.

These fixes address the named examples only. They do not certify the rest of Chemistry guide 2 or the other 5,550+ questions. Full-bank academic review and CI still remain open.
