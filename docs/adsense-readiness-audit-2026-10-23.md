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
