# Full Verification Triage — 25 October 2026

## Scope and method
Fetched and parsed all 36 `questions.json` files on `north-east-job-portal-cleanup` (Biology, Physics, Chemistry guides 1–12). This is a machine-assisted triage scan, not a certified academic audit. Counts are measured using normalized Unicode text length <180 characters, plus a pattern-based search for explanations that repeat the stem instead of teaching the concept.

## Inventory
| Subject | Guides | Questions |
|---|---:|---:|
| Biology | 12 | 1,800 |
| Physics | 12 | 2,050 |
| Chemistry | 12 | 1,900 |
| **Total** | **36** | **5,750** |

## Triage findings across the 5,750 questions
- Hindi general explanations under 180 normalized characters: **5,075**.
- English general explanations under 180 normalized characters: **4,963**.
- Four-option explanation arrays present on the base branch: **150 Hindi**, **40 English** questions, all in Biology guide 1. Expected schema: `optionExplanations.hi/en`, each with four non-empty strings.
- Explanation boilerplate/stem-repeat regex signals: **785**. This is a flag count, not a confirmed defect count; each must be manually judged.
- The prior structural scan found no exact normalized Hindi prompt duplicates within individual banks. That does not exclude cross-bank duplicates, English duplicates, paraphrases or semantic duplicates.
- All 36 files parsed as JSON during this scan. The scan's metrics do not prove the answer keys or facts are correct.

## Highest-priority banks for manual review
Chemistry guide 7: 96 boilerplate signals; guide 12: 85; guide 11: 83; guide 10: 80; guide 3: 72; guide 5: 72; guide 4: 66.
Physics guide 7: 36; guide 6: 27.
These are review priorities only, not a claim that every flagged question is wrong.

## Verified sample defects and corrections already made on the quality branch
1. Chemistry guide 2 Hindi and English examples were inconsistent: Hindi mentioned “चाकमक”/sulfur dioxide while English mentioned magnesium/magnesium oxide. Hindi was aligned to the magnesium example.
2. Hindi wording about chemical changes was corrected to avoid saying they are “अनुक्रमणीय” (reversible) where English said “mostly irreversible”; wording now qualifies that many chemical changes are not easily reversed under ordinary conditions.
3. Rusting heading was made clearer.
4. Chemistry question `chem2_q103` now explains that melting wax is physical because no new substance forms, while burning wax is a separate chemical process. It now has four option explanations in Hindi and English.
5. Both changed JSON files were fetched again and validated; the Hindi/English example alignment and four-option explanation arrays for `chem2_q103` were confirmed.

## Current NCERT Grade 9 mapping basis
The official NCERT Grade 9 Science textbook `Exploration` (First Edition, April 2026) has 13 integrated science chapters:
1. Exploration: Entering the World of Secondary Science
2. Cell: The Building Block of Life
3. Tissues in Action
4. Describing Motion Around Us
5. Exploring Mixtures and their Separation
6. How Forces Affect Motion
7. Work, Energy, and Simple Machines
8. Journey Inside the Atom
9. Atomic Foundations of Matter
10. Sound Waves: Characteristics and Applications
11. Reproduction: How Life Continues
12. Patterns in Life: Diversity and Classification
13. Earth as a System: Energy, Matter, and Life

Source: https://ncert.nic.in/textbook/pdf/iesc1ps.pdf

Candidate topic overlap (must be confirmed against detailed learning outcomes):
- Biology guide 1 → Grade 9 Ch. 2; guide 2 → Ch. 11; guide 3 → Ch. 3; guide 4 → Ch. 12; guide 12 → Ch. 13.
- Physics guide 2 → Ch. 4; guide 3 → Ch. 6; guide 5 → Ch. 7; guide 7 → Ch. 10.
- Chemistry guide 3 → Ch. 5; guide 4/5 → Ch. 9 (only partial overlap; atomic foundations/matter must be checked); guide 6 → Ch. 8.
These are only candidate relationships. The other guides remain unmapped or may need to be labelled cross-grade/enrichment. Do not claim all 36 guides map to current Grade 9.

## Content policy
NCERT states textbooks are copyrighted and republication/hosting of textbook copies by other websites is prohibited without permission. Use original explanations, examples and diagrams; link to official NCERT pages where permitted.
Source: https://ncert.nic.in/textbook.php

## Live website and CI
Direct production URLs were attempted through the available web environment, but `robots.txt`, sitemap and sample Science pages were inaccessible to the fetch tool. Production HTTP status, canonical response, mobile rendering, navigation and mock-test behavior remain **unverified**, not failed.
The latest quality-branch commit had no workflow run/status entries returned by the GitHub connector, so CI is **not confirmed**. Do not merge or deploy until checks are run and reviewed.

## Acceptance gates still open
- Question-by-question scientific correctness and answer-key review across 5,750 items.
- Full Hindi-English parity review.
- Semantic near-duplicate review and manual distractor-quality review.
- Complete mapping of all 36 guides to exact class, textbook edition, chapter and learning outcome.
- Notes, original diagrams, examples, accessibility text and mobile review for all guides.
- Live production testing and CI.
- Final AdSense readiness review. No audit can guarantee AdSense approval.
