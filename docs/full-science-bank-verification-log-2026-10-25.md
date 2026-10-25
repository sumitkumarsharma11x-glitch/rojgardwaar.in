# ROJGARDWAAR.IN — Full Question Bank Structural Verification Log
Date: 2026-10-25
Repository branch reviewed: `north-east-job-portal-cleanup`
Quality-fix branch: `science-quality-gap-audit-2026-10-25`

## Executive result
All 36 expected question JSON files were fetched and parsed in the repository scan. Their declared question counts total 5,750:
- Biology: 12 files × 150 = 1,800
- Physics: seven files × 150 plus five files × 200 = 2,050
- Chemistry: two files × 200 plus ten files × 150 = 1,900
- Total: 5,750

This verifies the inventory and JSON parsing for the reviewed branch; it does **not** mean the 5,750 items are scientifically certified.

## Full-bank triage findings
The bank-by-bank machine scan found:
- 5,075 Hindi general explanations shorter than 180 normalized characters.
- 4,963 English general explanations shorter than 180 normalized characters.
- 5,600 questions without a four-string `optionExplanations.hi` array.
- 5,710 questions without a four-string `optionExplanations.en` array.
- 785 explanations with a boilerplate-like phrase signal from a deliberately simple pattern scan.
- 150 questions with a four-option Hindi explanation array and 40 with a four-option English explanation array in the base branch. The draft quality branch adds bilingual explanations to Biology guide 2 questions 201–210 and Chemistry guide 2 question 103; those pilot edits are not included in the base-branch counts above.

Important: explanation length and boilerplate phrase counts are triage heuristics, not proof of incorrect science. Option-explanation counts are schema coverage, not a rating of quality. Weak distractors and semantic duplicates still require review.

## Targeted scientific/content issues fixed in the quality branch
1. Chemistry guide 2 Hindi example differed from its English counterpart (Hindi named a different material/product). The Hindi example was aligned to magnesium burning and magnesium oxide.
2. Hindi description of chemical changes used wording that could reverse the intended meaning of “irreversible”. It was corrected and qualified to avoid an absolute claim.
3. Rusting section heading was rewritten as “लोहे में जंग लगना एवं उसकी रोकथाम”.
4. Notes now distinguish reaction clues (colour/gas/temperature/precipitate) from the core criterion that a new substance forms, and clarify the quicklime-water example.
5. Chemistry question `chem2_q103` received clearer Hindi/English explanations and four separate option explanations per language. The updated JSON was re-fetched and parsed; the question has four Hindi and four English option explanations.

## NCERT mapping finding
NCERT's current Class IX Science textbook “Exploration” lists 13 integrated chapters. The site's 36 subject-based guides are a custom taxonomy and do not line up one-to-one with the current book's chapter numbers. Example: the website Biology guide path `biology/chapter-02` has metadata code `B09` and `chapterNumber: 9`, while its title is “Reproduction & Life Continuity”; this topic overlaps the current NCERT Class IX chapter “Reproduction: How Life Continues” (Chapter 11), not official Chapter 9. The guide numbering and official textbook numbering must be stored separately.

Primary reference: https://ncert.nic.in/textbook.php?iesc1=1-13
Current Grade IX textbook PDF: https://ncert.nic.in/textbook/pdf/iesc1ps.pdf

The workbook includes a 36-guide metadata review and candidate Class IX topic mappings. These are candidate mappings only; every question must be mapped to a specific class, edition and learning outcome before being labeled aligned. The guides marked class range “6-10” need per-question grade-level mapping or clear “cross-grade/enrichment” labeling.

## Live production checks
Direct web fetch attempts for `https://rojgardwaar.in/robots.txt`, `/sitemap.xml`, `/science/biology/index.html` and `/science/biology/chapter-02.html` were inaccessible from the current environment. Live status codes, page rendering, mobile layout, browser console, navigation, mock-test interactions, canonical response and sitemap consistency therefore remain **unverified**, not failed. Repository sample files contain `noindex,follow` and canonical tags; keep the Science pages out of the sitemap until academic review passes.

## CI status
The GitHub connector returned no workflow runs and no combined status entries for the current quality-branch commit queried. This is “no result returned by this connector query”, not a passing test. Confirm the PR's Checks tab directly before merging.

## Acceptance gates still open
- Scientific fact-check of all 5,750 stems, options, answer keys and explanations.
- Bilingual parity and age/grade-appropriate wording.
- Semantic near-duplicate detection and manual adjudication.
- Plausible distractor review (including ambiguity, giveaway patterns and multiple defensible answers).
- Four meaningful option-specific explanations in both languages for every question.
- Mapping all 36 guides and every question to class, edition and learning outcomes.
- Review all 36 notes pages for depth, worked examples, original diagrams, alt text and reliable references.
- Live desktop/mobile tests: navigation, 404, timer, answer selection/change, submit, scoring, review, filters, keyboard/accessibility and console errors.
- Live SEO checks: status codes, canonicals, robots, sitemap XML, noindex/sitemap consistency, internal links and Google Search Console.
- Final policy-page and AdSense readiness review.

Do not describe the full bank as “scientifically verified” or “AdSense-ready” until evidence for every gate has been recorded. AdSense approval itself cannot be guaranteed.


## Additional repository sitemap/robots verification
Parsed the repository branch's `sitemap.xml` as text:
- 15 `<loc>` URLs found and 15 `<lastmod>` fields.
- No duplicate URLs detected.
- No Science URLs included (appropriate while the Science content is still under review).
- All `lastmod` values match the expected `YYYY-MM-DD` format.
- `robots.txt` contains `User-agent: *`, `Allow: /`, and the sitemap URL.

This is a repository-file structural check only. It does not verify that the live server returns these exact files, that all 15 URLs return HTTP 200, or that every sitemap URL has a matching canonical tag.
