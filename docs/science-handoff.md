# Science / Mock-Test Handoff — 25 October 2026

## Purpose and publication rule

This document is a handoff for a future human reviewer or contractor. It records known findings and separates reported observations from checks actually documented in the repository. Do not present a question bank as academically verified merely because JSON parsing or structural tests pass.

**Current recommendation:** temporarily hide/disable Science practice and mock-test entry points until the relevant question banks pass content review. Preserve the source question data under `data/`; do not delete it as part of the visibility change. Keep Science pages `noindex,follow` and out of the sitemap until review and live-site checks pass.

This handoff does **not** itself hide pages, remove payment buttons, issue refunds, merge PRs, or deploy changes.

## Inventory: numbers need reconciliation

Two counts are currently in circulation and must not be conflated:

- The 25 October audit note on branch `science-quality-gap-audit-2026-10-25` reports **5,750 questions across 36 topic-guide banks**: Biology 1,800; Physics 2,050; Chemistry 1,900.
- A separate project review reported **4,547 questions considered genuine/usable**. The exact inclusion criteria behind this number have not been reconciled with the 5,750-file inventory.

Do not silently choose one count for marketing. First document what “question count” and “usable/original” mean, then recalculate from the current files.

Other reported findings that require verification against the latest files:
- Railway: 200 questions reportedly reused across 50 mock tests (i.e. the same 100-question set reused across tests was observed/reported). Audit the actual mock definitions and runtime selection before publishing a definitive count.
- Chemistry Chapter 3: reviewer assessment is **87 distinct/useful questions and 63 repeated/template variants** in the current PR #26 version. Treat this as a manual review finding, not a validator-certified classification.

## Chemistry Chapter 3 status

File: `data/science/chemistry/chapter-03/questions.json`  
PR: [#26](https://github.com/sumitkumarsharma11x-glitch/rojgardwaar.in/pull/26)  
Branch: `chemistry-chapter-03-quality-fix`

Reviewer-reported status:
- Q1–Q87: 87 distinct/useful questions, subject to remaining answer, distractor, explanation and NCERT fact checks.
- Q88–Q150: 63 items should be replaced, not lightly paraphrased. They were reported as three templated versions of the same 21 concepts; some stems ask for a method while the answer is a mixture/property/product, and some “scientific reason” questions give only method names.
- Answer positions were reported as 0/1/2/3 = 38/40/37/35, which fails the repository's stated balance condition (maximum count difference no greater than 1).
- Review also flagged weak “Only…” distractors in `c3q01`, `c3q02`, `c3q13`, `c3q25`, `c3q30`; near-duplicates `c3q06/07` and `c3q26/27`; and weak distractors in Q57.
- The reviewer has not yet completed a full read of every Q31–Q150 option explanation or a full NCERT alignment check.

Required work before considering the bank complete:
1. Replace Q88–Q150 with 63 genuinely different questions that do not repeat Q1–Q87's tested facts or reasoning patterns.
2. Create a concept coverage matrix before writing: one row per question with concept, skill (recall/application/data interpretation/misconception), source, and reviewer status.
3. Rebalance answer positions to the intended counts 37/38/37/38 without changing which answer is scientifically correct.
4. Improve the listed weak options and near-duplicates.
5. Review every stem, all four options, correct key, general explanation, and all eight option-specific explanations (four Hindi + four English) for correctness and specificity.
6. Verify Class 9 NCERT alignment against the exact textbook edition/syllabus used by the site. Mark out-of-syllabus enrichment transparently rather than pretending it is NCERT-required.
7. Run the repository's actual tests and record command, commit SHA, output and warnings.

## Validator and checks

- The current repository tree contains `tests/validator.test.js` and `scripts/validate-exams.js`.
- `scripts/validate-exams.js` validates the eligibility dataset (`data/exams.json`); it is **not** the Chemistry question-bank validator.
- A file named `validate_chapter.py` was **not found** in the inspected branch tree as of this handoff. The reviewer reported running such a validator externally, but its exact source/version and command are not currently recorded in this repository.
- Before relying on a reported `ERRORS: 0`, locate and version the exact chapter validator, document how to run it, and ensure it checks schema, answer balance, duplicates/near-duplicates, weak distractors, explanation quality and topic mapping. Structural success is not scientific verification.

Suggested AI-assisted review prompt (use as a starting point, not as proof of correctness):

> Audit the attached question bank against the specified current NCERT textbook chapter and syllabus. For every question, independently verify the stem, all options, keyed answer, general explanation, and each option-specific explanation in Hindi and English. Build a concept map and flag exact duplicates, paraphrases, repeated reasoning templates, ambiguous questions, mismatched stem/answer types, weak or giveaway distractors, translation mismatches, unsupported facts, and out-of-syllabus content. Do not rewrite first: return a numbered evidence-based issue list with a source/page or section for each factual claim. Then propose replacements only for rejected items, each testing a distinct concept or reasoning skill not already covered. Mark uncertain items for human review. Never claim that a question is verified without evidence.

## Railway mock tests and payment safety

Before re-enabling mock tests:
- Compare every mock's selected question IDs and normalized stems. Confirm that each mock has the advertised count and meaningful coverage, rather than repeated use of the same small set.
- Preserve raw data in `data/railway/`; hide only the public practice/mock navigation and entry points while the review is pending.
- Search the homepage, Study Centre, subject hubs, Railway hubs, account pages, mock-test pages, metadata, sitemap, and any promotional banners for claims such as “50 mock tests” or “5,000 questions.” Remove unsupported claims or replace them only with counts verified from the current data.
- Inspect the Razorpay/payment flow before making it unavailable. Determine whether any successful premium payments exist using the authorized payment records/dashboard. If payments exist, identify affected customers and follow the applicable refund/communication process. If no purchases have occurred, disable/remove purchase entry points until the product is ready. Do not infer payment status from the repository alone.
- Verify that disabled routes cannot still be reached directly by URL, and check mobile navigation as well as desktop.

## Candidate files/areas to inspect for temporarily hiding practice

Do a fresh tree search and inspect references before editing; filenames may change:
- Homepage and navigation: `index.html`, shared navigation/script files and Study Centre links.
- Science subject hubs and static notes: `science/biology/`, `science/physics/`, `science/chemistry/`, and corresponding chapter HTML pages.
- Mock/practice runtime and routing: `chapter.html`, `mock-test.html` if present, `js/` modules, question/topic links and account/premium pages.
- Railway mock pages and data: `railway/` and `data/railway/`.
- Public URL exposure: `sitemap.xml`, robots/noindex directives, canonical tags, internal links and any manifest/config listing.
- Payment integration: search for `Razorpay`, checkout/order creation, payment verification, premium access flags and purchase buttons.

Prefer a clear central feature flag or deliberate route gating where the architecture supports it, instead of deleting question data or making scattered edits. Do not break the eligibility calculator, free document tools, or North-East jobs functionality.

## Pull requests and branch caution

- [PR #24 — Improve AdSense readiness while preserving study resources](https://github.com/sumitkumarsharma11x-glitch/rojgardwaar.in/pull/24)  
  Branch: `north-east-job-portal-cleanup`. It contains the North-East/jobs and eligibility-site work **plus** Science/Mock Test work: Study Centre links, 36 static Science pages, chapter content, tests, routing fixes and SEO/noindex/sitemap changes. It is not a clean jobs-only PR. The PR description reports 68 tests passing, but those checks do not establish full factual accuracy.
- [PR #25 — Add bilingual option-explanation pilot and Science quality gap audit](https://github.com/sumitkumarsharma11x-glitch/rojgardwaar.in/pull/25)  
  Branch: `science-quality-gap-audit-2026-10-25`. It contains the Science audit and a 10-question Biology Chapter 2 option-explanation pilot. The audit records 5,750 banked questions and large remaining explanation/review gaps.
- [PR #26 — Chemistry Chapter 3 question work](https://github.com/sumitkumarsharma11x-glitch/rojgardwaar.in/pull/26)  
  Branch: `chemistry-chapter-03-quality-fix`. It is based on the North-East cleanup branch and contains the Chemistry Chapter 3 edits. Do not merge as-is while the reported 63 repeated/template items and answer-position imbalance remain.

Do not merge PR #24, #25, or #26 blindly. First decide the desired clean base and separate the independent North-East/eligibility changes from Science content changes. A clean approach is to keep the jobs/eligibility PR limited to that product, create a dedicated Science/content branch from the agreed base, and cherry-pick or recreate only reviewed Science changes. Re-check PR base/head ancestry and CI after restructuring. Never rewrite a shared branch without confirming which changes are needed.

## Hiring handoff checklist

A future reviewer should be given:
- This file and the current question-bank inventory.
- The exact textbook/edition/syllabus and approved reference sources.
- A per-question review ledger with status: pending / fact checked / language checked / duplicate checked / approved.
- A written definition of “unique/original question” and duplicate thresholds.
- Validator source, pinned runtime/dependencies, command and expected output.
- A list of public pages currently hidden and the exact conditions for re-enabling them.
- A sign-off gate requiring both automated checks and human academic review.

**Do not promise AdSense approval.** Content quality, originality, policy compliance, site usability and actual Google review all matter; passing a local audit cannot guarantee approval.
