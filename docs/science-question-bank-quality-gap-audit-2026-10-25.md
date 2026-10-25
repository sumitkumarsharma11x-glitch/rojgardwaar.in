# Science Question Bank Quality Gap Audit — 25 October 2026

## Purpose
This audit separates structural checks from actual academic validation. A valid JSON file or balanced answer keys do not prove that every question is scientifically correct, syllabus-aligned, original, or well explained.

## Verified inventory on `north-east-job-portal-cleanup`
| Subject | Topic-guide banks | Questions |
|---|---:|---:|
| Biology | 12 | 1,800 |
| Physics | 12 | 2,050 |
| Chemistry | 12 | 1,900 |
| **Total** | **36** | **5,750** |

The checked bank files support a total of **5,750**, not 5,780. Do not add 30 questions merely to match the larger claim; reconcile the source of that number first.

## Structural scan observations
- All 36 expected bank files were found and parsed during the scan.
- The scan found explanation fields on all questions.
- Exact normalized Hindi prompt duplicates were not detected in the scanned banks. This is only an exact-match check; it does not detect paraphrases, near-duplicates, repeated reasoning patterns, or copied questions.
- The existing test suite checks structural properties such as answer-index bounds, four distinct options, bilingual prompt/options, duplicates, answer-position balance and topic metadata. These checks do not establish factual accuracy.
- Many general explanations are very short. The heuristic flagged **4,840 Hindi** and **4,936 English** explanation entries under 180 characters. A short explanation is not automatically wrong, but these counts indicate a broad review requirement.
- Option-by-option explanations are largely absent: the scan flagged **5,600 Hindi** and **5,710 English** missing option-explanation arrays. The intended schema is `optionExplanations: { "hi": [four strings], "en": [four strings] }`.

## Pilot change in this branch
In `data/science/biology/chapter-02/questions.json`, questions `ch2_q201`–`ch2_q210` now have bilingual, four-option explanations explaining why the correct answer fits and why each distractor does not. This is a **10-question pilot**, not a claim that the full bank is complete or scientifically audited. The other 140 questions in this bank and the remaining 5,740 questions still need review/enrichment.

## Required completion gates
1. **Academic review:** verify each stem, each of the four options, the keyed answer, and each explanation against the appropriate current NCERT chapter/syllabus and reliable primary educational sources. Record source and review status per chapter.
2. **Originality and reasoning:** run normalized and semantic duplicate checks; reject trivial rewordings, ambiguous stems, giveaway options, and questions where multiple answers could be defended. Build genuinely varied recall, application, data interpretation and misconception-diagnosis items.
3. **Bilingual parity:** ensure Hindi and English express the same scientific meaning and difficulty, with correct terminology and no answer clues introduced by translation.
4. **Explanations:** add four option-specific explanations in both languages, not boilerplate. Explain the underlying concept and why each distractor is incorrect.
5. **Validation:** parse every JSON bank; assert unique IDs, four distinct options in both languages, valid correct index, all required bilingual strings, four non-empty option explanations per language, reasonable explanation depth, and no accidental answer leakage. Review flagged cases manually.
6. **Syllabus transparency:** these 36 entries are custom topic guides, not automatically the official chapter numbering of every current NCERT textbook. Label and map them honestly by class, textbook edition, subject and topic.
7. **Publication / AdSense:** keep science pages `noindex,follow` and excluded from sitemap until chapter reviews, navigation, mobile rendering, original diagrams/examples, and policy/contact pages have been checked. After deployment, verify live status codes, canonicals, robots, sitemap consistency and Google Search Console. Passing an audit cannot guarantee AdSense approval.
8. **Merge/deploy gate:** do not merge or publish this quality pilot until the project owner reviews it and the full automated checks pass. This branch does not itself mean that the live site changed.

## Status as of this commit
- [x] Inventory count reconciled to 5,750.
- [x] Initial structural audit completed.
- [x] Bilingual option-explanation pilot for 10 Biology topic-guide questions.
- [ ] Full 5,750-question factual and syllabus audit.
- [ ] Full bilingual explanation coverage.
- [ ] Semantic near-duplicate review.
- [ ] Live production verification.
- [ ] Final AdSense readiness review.

## Important limitation
The counts above are machine-assisted audit signals, not a human-certified fact check of every question. Do not describe the 5,750-question bank as fully audited until the remaining gates have evidence.
