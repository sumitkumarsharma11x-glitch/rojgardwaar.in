# ROJGARDWAAR.IN AdSense Readiness Audit
**Audit date:** 2026-10-23  
**Scope:** PR branch `north-east-job-portal-cleanup`  
**Important:** This is a repository/source audit. Live HTTP/browser verification was not possible from the audit environment, so deployment and runtime navigation are not marked as passed.

## 1. Science notes: static-page depth and indexing

All 36 static chapter pages under `science/{biology,physics,chemistry}/chapter-XX.html` are marked `noindex,follow` and have a matching canonical URL. This is the safe choice while content depth and factual accuracy remain under review. Do not remove `noindex` or add these pages to the XML sitemap yet.

A source-level sample/count review found the following word counts in the rendered main-content region (HTML tags removed; counts are approximate):
- Biology 2: about 1,977 words; substantially longer than the other pages and needs a factual/syllabus review.
- Biology 3–12: approximately 575–678 words each.
- Physics 1–12: approximately 575–664 words each.
- Chemistry 1–12: approximately 574–722 words each.
- Biology 1 is a much longer outlier (about 22.5 KB of HTML) and needs a full fact check separately.

Most chapters use a consistent structure: chapter topics, Hindi notes, English notes, exam focus, common mistakes, memory aids, quick revision, and source/correction links. This is a useful foundation, but a repeated template and short notes do not by themselves prove original, sufficiently comprehensive educational value. Some chapter titles/topic groupings also need to be reconciled against the exact class-wise NCERT syllabus before being described as NCERT-aligned.

### Required before indexing any chapter
1. Match the page to the exact class, subject, chapter title and current NCERT learning objectives; do not combine class-specific topics under a misleading chapter number.
2. Fact-check definitions, diagrams, examples, formulae, equations and claims against authoritative textbooks/educational sources.
3. Add worked examples, reasoning and misconception explanations that are specific to that chapter, not generic filler.
4. Verify the question bank's correct answers and explanations against the notes and source material; automated structure tests are not a scientific fact-check.
5. Run a visual/mobile browser review and check all links.
6. Only then consider removing `noindex` and adding that individual URL to the sitemap.

## 2. Sitemap and indexing source audit

The PR-branch `sitemap.xml` contains **15 URLs**, has **no query-string URLs**, and intentionally excludes the Science chapter pages. This is consistent with the current `noindex` decision. The sitemap includes the homepage, jobs hub, eligibility calculator, form-tools hub, three public tools, three Railway pages, and five policy/about/contact pages.

The PR-branch `robots.txt` allows crawling and points to `https://rojgardwaar.in/sitemap.xml`. This does not itself guarantee indexing; page-level robots directives and Google Search Console status still need checking.

Canonical tags were present in the inspected source for the homepage, jobs hub, eligibility calculator, form-tools hub, Railway hub, all five policy/about/contact pages, all three public tools, the Science hub, subject hubs and sampled chapter pages. The five policy/about/contact pages and three public tools had no explicit robots meta tag in the inspected source, which means the default is indexable unless another directive is supplied at HTTP/header level.

### Sitemap cautions
- Check that every listed URL returns HTTP 200 on the live site and has a canonical matching that URL.
- Confirm there are no `noindex` URLs in the sitemap.
- Keep `lastmod` dates accurate. The PR sitemap has newer dates for the main public pages but older 2026-10-03 dates for several policy pages; update them only if those pages were actually changed.
- After deployment, submit/re-submit the sitemap in Google Search Console and inspect representative URLs.

## 3. Automated tests and their limits

The PR description reports 68 tests passing, and the workflow associated with head commit `3824c440a391bc009f4ceb54c20b55a3614c1a19` completed successfully. The observed workflow jobs `validate` and `document-scanner-browser` both concluded successfully.

The Science question-bank test checks structure, bilingual prompts, four distinct options, valid answer indices, explanation presence, duplicate prompts, topic mapping, balanced answer positions and a minimum question count. These are useful checks but do not establish that every answer is factually correct, that the material matches the current NCERT syllabus, or that explanations are pedagogically adequate.

## 4. Deployment and navigation status

**Not verified from this environment.** Direct requests to the live domain could not be completed because network/DNS access was unavailable. Therefore no live HTTP status, rendered navigation, mobile menu, browser-console result, deployed sitemap, or Search Console indexing state is claimed as passed.

After merge/deploy, manually test:
- Homepage desktop/mobile navigation and all primary destinations.
- Science hub → subject hub → chapter pages.
- Mock-test start, timer, answer selection, submission, scoring, review and topic filters.
- Login/register/account navigation (where applicable).
- Form tools: photo/signature resize, document scanner and image/PDF flows.
- About, Contact, Privacy Policy, Terms and Disclaimer.
- 404 handling, canonical tags, robots directives and sitemap URLs.

## 5. Decision

**Do not index the 36 Science chapter pages yet.** Keep the current `noindex,follow` protection until per-chapter syllabus alignment, factual review, depth improvements and browser testing are documented. Do not claim live deployment or AdSense approval readiness solely from passing CI. The next priority is to improve and fact-check chapters systematically, then run live-site checks after deployment.


## 6. Follow-up work recorded on the audit branch (2026-10-23)

### Learning diagrams and curriculum transparency
- Added a notebook-style concept map to the 35 Biology/Physics/Chemistry static pages other than Biology 1, which already has its own cell illustration.
- Updated the concept maps to show the first three topic headings with short summaries drawn from each page's own notes.
- Added a visible curriculum note to all 36 static pages explaining that the chapter numbers are RojgarDwaar's own topic-guide sequence, not the official NCERT chapter sequence.
- Removed the inaccurate “Class 9 Biology Chapter 1 / NCERT-aligned concepts” claim from Biology Chapter 1; it is now presented as an original “Cell & Tissue” concept guide.

### Official NCERT mapping issue discovered
The current NCERT Grade 9 Science textbook, *Exploration* (First Edition, April 2026), lists 13 chapters. In that official book, “Cell: The Building Block of Life” is Chapter 2, “Tissues in Action” is Chapter 3, “Describing Motion Around Us” is Chapter 4, “Exploring Mixtures and their Separation” is Chapter 5, “Reproduction: How Life Continues” is Chapter 11, and “Patterns in Life: Diversity and Classification” is Chapter 12. The site's 36 Biology/Physics/Chemistry sequence is a cross-topic guide and must not be represented as a one-to-one reproduction of the official NCERT chapter numbering.
- Official current Grade 9 book: https://ncert.nic.in/textbook/pdf/iesc1ps.pdf
- Official NCERT textbook portal: https://ncert.nic.in/textbook.php

### Question-bank structure and explanation improvements
- Structural checks were run across the 36 question banks: bilingual prompts, four distinct options, valid correct-answer index, explanation presence, exact duplicate prompts and answer-position balance.
- The checked bank sizes are 5,750 questions in total (Biology: 12 × 150; Physics: 7 × 150 plus 5 × 200; Chemistry: 2 × 200 plus 10 × 150).
- Rewrote the short Physics explanations in all 12 chapters to add the relevant definition, rule, formula or reasoning.
- Replaced generic boilerplate explanations in Chemistry Chapters 3–12 and improved short explanations in Chemistry Chapters 1–2.
- Improved short explanations in Biology Chapters 1, 2, 5 and 10.
- The automated structural checks show no missing bilingual prompts/options/explanations, duplicate prompts, or invalid answer indices in the checked banks. This is **not** a full scientific fact-check: each answer still needs source-by-source verification, particularly calculations, chemistry reactions, classification exceptions, and syllabus scope.

### Remaining before this can be considered high quality
1. Manually verify every correct answer and explanation against the relevant current official textbook or a trusted primary educational source; add worked calculations where appropriate.
2. Expand chapters with only brief notes into deeper teaching material: worked examples, common misconceptions, practice activities and original diagrams that explain the mechanism—not just topic headings.
3. Run HTML validation and browser tests on the updated branch.
4. After merge/deployment, verify live pages, navigation, sitemap and robots directives in a browser and Google Search Console.
5. Keep the 36 Science pages noindex,follow until the per-chapter source review and live visual tests are complete.


### Additional correction after the NCERT mapping review
- Changed the visible labels on the 35 Biology/Physics/Chemistry pages to “Topic Guide” rather than “Chapter” to reduce the risk of implying official NCERT chapter numbering.
- Corrected the Biology reproduction notes and MCQs that overgeneralised asexual reproduction as always using mitosis. The revised explanation distinguishes mitosis in many eukaryotes from binary fission in prokaryotes such as bacteria.
- This is an initial fact-check correction, not evidence that every scientific claim across the full question bank has been independently verified.
