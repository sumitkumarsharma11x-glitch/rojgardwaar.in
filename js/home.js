/**
 * Science Home Controller — Subject-first navigation
 * -----------------------------------------------------------------------
 * 1. LANDING : "Science Preparation" hero (one dominant CTA) + the THREE
 *              subject destinations (Biology / Physics / Chemistry —
 *              NCERT Class 6–10) + the learning journey
 *              (Notes → Practice → Mock Test) on a slim RailGaadi track
 *              + real-number stats strip + exam strip + final CTA.
 * 2. SUBJECT : the chosen subject's important chapters.
 *
 * NOTE (roadmap): class-first navigation (Class → Subject → Chapter) is
 * intentionally NOT used. The student always picks a SUBJECT first and
 * every chapter is an integrated NCERT Class 6–10 unit.
 *
 * URL shapes (deep-linkable):
 *   mock-test.html                 → landing
 *   mock-test.html?subject=biology → subject page
 * Chapter cards link to:
 *   chapter.html?subject=biology&chapter=chapter-01
 *
 * TRUTHFUL-NUMBERS RULE: every count shown on the landing page is
 * DERIVED from data/manifest.json at runtime (chapter totals, per-subject
 * chapter counts). Nothing is hardcoded that data could contradict. If the
 * manifest is missing/empty, the page degrades gracefully and keeps only
 * the long-standing deployed claims (37+ chapters, 150+ questions and
 * 5 × 30 mock tests per chapter).
 * -----------------------------------------------------------------------
 */
(function () {
  let manifest = null;
  let currentView = "landing"; // landing | subject
  let selectedSubject = null;

  const root = document.getElementById("rjd-home-root");

  /* =========================================================
     LANGUAGE HELPERS (preserved)
  ========================================================= */
  function isHindi() {
    return LanguageManager.getCurrent() === "hi";
  }

  function text(hi, en) {
    return isHindi() ? hi : en;
  }

  function pickLabel(labelObj) {
    if (!labelObj) return "";
    return labelObj[LanguageManager.getCurrent()] || labelObj.hi || labelObj.en || "";
  }

  /* =========================================================
     MANIFEST HELPERS (preserved)
  ========================================================= */
  function getSubjects() {
    return (manifest && Array.isArray(manifest.subjects)) ? manifest.subjects : [];
  }

  function findSubject(id) {
    return getSubjects().find((s) => s.subject === id) || null;
  }

  function totalChapters() {
    return getSubjects().reduce((n, s) => n + (s.chapters || []).length, 0);
  }

  /* =========================================================
     SMALL SVG ICON SET (consistent stroke style, no emoji art)
  ========================================================= */
  const SUBJECT_ICONS = {
    biology:
      '<svg viewBox="0 0 48 48" class="rjd-svg rjd-svg--bio" aria-hidden="true" focusable="false">' +
      '<path d="M24 42C13 42 6 33 6 22 6 12 13 6 24 6c0 12 8 18 18 18 0 10-8 18-18 18z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M24 42C24 28 30 16 40 10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M15 20c3-2 7-2 10 0M13 27c4-2 9-2 13 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity=".55"/></svg>',
    physics:
      '<svg viewBox="0 0 48 48" class="rjd-svg rjd-svg--phy" aria-hidden="true" focusable="false">' +
      '<circle cx="24" cy="24" r="4" fill="currentColor"/>' +
      '<ellipse cx="24" cy="24" rx="18" ry="7.5" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
      '<ellipse cx="24" cy="24" rx="18" ry="7.5" fill="none" stroke="currentColor" stroke-width="2.2" transform="rotate(60 24 24)"/>' +
      '<ellipse cx="24" cy="24" rx="18" ry="7.5" fill="none" stroke="currentColor" stroke-width="2.2" transform="rotate(-60 24 24)"/></svg>',
    chemistry:
      '<svg viewBox="0 0 48 48" class="rjd-svg rjd-svg--chem" aria-hidden="true" focusable="false">' +
      '<path d="M19 6h10M21 6v10L10 37a4 4 0 0 0 3.6 6h20.8A4 4 0 0 0 38 37L27 16V6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M14.5 30h19l3.4 6.6A2.5 2.5 0 0 1 34.6 41H13.4a2.5 2.5 0 0 1-2.3-4.4z" fill="currentColor" opacity=".28"/>' +
      '<circle cx="21" cy="35" r="1.6" fill="currentColor"/><circle cx="27" cy="37.5" r="1.2" fill="currentColor"/></svg>'
  };

  function subjectIcon(id, fallbackEmoji) {
    return SUBJECT_ICONS[id] || `<span class="rjd-subject-card__emoji">${fallbackEmoji || "📚"}</span>`;
  }

  /* ---------- Hero illustration (flat academic SVG, no emoji) ---------- */
  const HERO_ART = `
    <svg class="rjd-hero__illustration" viewBox="0 0 560 440" role="img"
         aria-label="${text("छात्र notebook में पढ़ रहा है", "Student studying with notebook")}"
         focusable="false">
      <!-- paper backdrop -->
      <rect x="18" y="14" width="524" height="412" rx="18" fill="#ffffff" stroke="#d9d3c1" stroke-width="2"/>
      <rect x="34" y="30" width="492" height="380" rx="12" fill="#f1efe6"/>
      <g fill="none" stroke="#e2ddcc" stroke-width="1.6">
        <path d="M46 210h468M46 244h468M46 278h468"/>
      </g>

      <!-- science motifs (subtle, static) -->
      <g class="rjd-hero__motif rjd-hero__motif--leaf">
        <path d="M84 96c22-26 58-30 84-24-4 28-24 56-56 60-14 2-26-4-32-14 0-8 2-16 4-22z" fill="#dcece3" stroke="#2f6b4f" stroke-width="3" stroke-linejoin="round"/>
        <path d="M96 128c18-18 40-34 62-44" fill="none" stroke="#2f6b4f" stroke-width="3" stroke-linecap="round"/>
      </g>
      <g class="rjd-hero__motif rjd-hero__motif--atom">
        <circle cx="452" cy="86" r="7" fill="#33547e"/>
        <g fill="none" stroke="#33547e" stroke-width="2.6" opacity=".9">
          <ellipse cx="452" cy="86" rx="34" ry="14"/>
          <ellipse cx="452" cy="86" rx="34" ry="14" transform="rotate(62 452 86)"/>
          <ellipse cx="452" cy="86" rx="34" ry="14" transform="rotate(-62 452 86)"/>
        </g>
      </g>
      <g class="rjd-hero__motif rjd-hero__motif--flask">
        <path d="M470 316h26M474 316v22l-14 26a8 8 0 0 0 7 12h32a8 8 0 0 0 7-12l-14-26v-22" fill="none" stroke="#a06a1a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M467 356h46l6 11a5 5 0 0 1-4.4 7.6h-49.2A5 5 0 0 1 461 367z" fill="#f6ead2" stroke="#a06a1a" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="483" cy="364" r="3" fill="#c1852c"/><circle cx="496" cy="369" r="2.2" fill="#c1852c"/>
      </g>

      <!-- desk -->
      <rect x="96" y="330" width="330" height="14" rx="7" fill="#c1852c"/>
      <rect x="96" y="344" width="10" height="52" fill="#1b2a4a"/>
      <rect x="416" y="344" width="10" height="52" fill="#1b2a4a"/>

      <!-- open notebook -->
      <g>
        <path d="M150 330c40-12 90-12 128 0v-2c-38-14-88-14-128-2z" fill="#1b2a4a" opacity=".18"/>
        <path d="M152 296c36-14 86-14 124 0l4 34c-42-12-90-12-128 0z" fill="#ffffff" stroke="#1b2a4a" stroke-width="3" stroke-linejoin="round"/>
        <path d="M408 296c-36-14-86-14-124 0l-4 34c42-12 90-12 128 0z" fill="#ffffff" stroke="#1b2a4a" stroke-width="3" stroke-linejoin="round"/>
        <path d="M280 292v40" stroke="#1b2a4a" stroke-width="3" stroke-linecap="round"/>
        <g stroke="#b9c0d4" stroke-width="2.4" stroke-linecap="round">
          <path d="M166 306c30-8 66-8 96 0M166 316c30-8 66-8 96 0"/>
          <path d="M394 306c-30-8-66-8-96 0M394 316c-30-8-66-8-96 0"/>
        </g>
        <path d="M160 298v32" stroke="#c1852c" stroke-width="2.6"/>
      </g>

      <!-- student (young school child, friendly NCERT-learning look) -->
      <g>
        <!-- small school body / uniform -->
        <path d="M188 330v-30c0-26 18-44 42-44s42 18 42 44v30z" fill="#24456f"/>
        <path d="M202 274h56v14c0 18-12 30-28 30s-28-12-28-30z" fill="#f8fafc"/>
        <path d="M230 270v48" stroke="#c1852c" stroke-width="3"/>
        <path d="M188 298c-14 5-21 16-21 32h21zM272 298c14 5 21 16 21 32h-21z" fill="#e9bd8f"/>
        <!-- larger child head -->
        <circle cx="230" cy="224" r="43" fill="#f0c39a"/>
        <!-- simple child hair -->
        <path d="M188 218c0-25 18-45 42-45s42 20 42 45v-8c0-25-17-43-42-43s-42 18-42 43z" fill="#2a1b14"/>
        <path d="M193 201c10-12 23-18 37-18 14 0 27 6 37 18" fill="none" stroke="#2a1b14" stroke-width="9" stroke-linecap="round"/>
        <!-- ears -->
        <circle cx="187" cy="227" r="7" fill="#e9bd8f"/><circle cx="273" cy="227" r="7" fill="#e9bd8f"/>
        <!-- bright child expression -->
        <circle cx="215" cy="230" r="3.7" fill="#23180f"/><circle cx="245" cy="230" r="3.7" fill="#23180f"/>
        <circle cx="204" cy="243" r="5" fill="#e9a99a" opacity=".55"/><circle cx="256" cy="243" r="5" fill="#e9a99a" opacity=".55"/>
        <path d="M220 249c5 6 15 6 20 0" fill="none" stroke="#8a5a3d" stroke-width="3" stroke-linecap="round"/>
        <!-- little collar -->
        <path d="M216 264l14 12 14-12" fill="#fff" stroke="#d8dde5" stroke-width="1.5"/>
        <!-- writing arm -->
        <path d="M267 304c15 5 23 13 27 25l-27-5z" fill="#24456f"/>
        <path d="M291 325c8 2 12 6 12 10h-16z" fill="#f0c39a"/>
        <!-- pencil -->
        <rect x="303" y="296" width="7" height="34" rx="2" transform="rotate(24 303 296)" fill="#c1852c"/>
        <path d="M309 328l6 10-11-2z" fill="#23180f"/>
        <!-- school badge -->
        <circle cx="230" cy="299" r="7" fill="#c1852c"/><path d="M227 299l3 3 5-6" fill="none" stroke="#fff" stroke-width="1.8"/>
      </g>

      <!-- gold stamp -->
      <g class="rjd-hero__stamp" fill="none" stroke="#c1852c" stroke-width="2.4">
        <circle cx="112" cy="366" r="30" stroke-dasharray="5 6"/>
        <text x="112" y="362" text-anchor="middle" font-size="11" font-weight="700" fill="#c1852c" stroke="none">NCERT</text>
        <text x="112" y="376" text-anchor="middle" font-size="11" font-weight="700" fill="#c1852c" stroke="none">6–10</text>
      </g>
    </svg>`;

  /* ---------- RailGaadi track glyph (small, subtle) ---------- */
  const TRAIN_GLYPH = `
    <svg class="rjd-track__train" viewBox="0 0 44 30" aria-hidden="true" focusable="false">
      <rect x="4" y="6" width="22" height="14" rx="4" fill="#1b2a4a"/>
      <rect x="26" y="10" width="12" height="10" rx="2" fill="#1b2a4a"/>
      <rect x="8" y="10" width="6" height="5" rx="1" fill="#f1efe6"/>
      <rect x="29" y="12" width="5" height="4" rx="1" fill="#c1852c"/>
      <circle cx="12" cy="24" r="4" fill="#1b2a4a"/><circle cx="32" cy="24" r="4" fill="#1b2a4a"/>
      <circle cx="12" cy="24" r="1.4" fill="#f1efe6"/><circle cx="32" cy="24" r="1.4" fill="#f1efe6"/>
    </svg>`;

  /* =========================================================
     SUBJECT COPY (approved hooks; falls back to manifest data)
  ========================================================= */
  const SUBJECT_COPY = {
    biology: {
      hook: { hi: "Life को समझने से शुरुआत करो।", en: "Start by understanding life itself." },
      desc: {
        hi: "Cells से लेकर Environment तक — NCERT-based concepts और exam-oriented practice।",
        en: "From cells to the environment — NCERT-based concepts and exam-oriented practice."
      },
      cta: { hi: "Biology शुरू करें →", en: "Start Biology →" }
    },
    physics: {
      hook: { hi: "Force समझ लिया? अब देखिए Exam में सवाल कैसे बनता है।", en: "Understood force? Now see how the exam asks it." },
      desc: {
        hi: "Motion, Light और Energy — concept से लेकर exam-oriented questions तक।",
        en: "Motion, light and energy — from concept to exam-oriented questions."
      },
      cta: { hi: "Physics शुरू करें →", en: "Start Physics →" }
    },
    chemistry: {
      hook: { hi: "Reaction सिर्फ equation नहीं — समझो कि होता क्यों है।", en: "A reaction is not just an equation — understand why it happens." },
      desc: {
        hi: "Elements, Compounds और Reactions — NCERT concepts, exam के हिसाब से।",
        en: "Elements, compounds and reactions — NCERT concepts, tuned for the exam."
      },
      cta: { hi: "Chemistry शुरू करें →", en: "Start Chemistry →" }
    }
  };

  /* =========================================================
     URL / HISTORY (deep links: ?subject=biology) — preserved
  ========================================================= */
  function readSubjectFromURL() {
    const id = new URLSearchParams(window.location.search).get("subject");
    return id && findSubject(id) ? id : null;
  }

  function pushSubject(id) {
    try {
      if (id) {
        window.history.pushState({ subject: id }, "", `?subject=${id}`);
      } else {
        window.history.pushState({ subject: null }, "", window.location.pathname);
      }
    } catch (err) {
      /* file:// or embedded contexts — navigation still works without URL sync */
    }
  }

  /* =========================================================
     SMOOTH SCROLL (landing-internal only; no routing changes)
  ========================================================= */
  function goToSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      try { window.scrollTo(0, el.offsetTop || 0); } catch (e2) { /* ignore */ }
    }
  }

  /* =========================================================
     LANDING — hero + subjects + journey (RailGaadi) + stats +
     exams + final CTA. All numbers derived from the manifest.
  ========================================================= */
  function renderLanding() {
    currentView = "landing";
    selectedSubject = null;

    const subjects = getSubjects();
    const total = totalChapters();
    const chapterStat = total > 0 ? String(total) : "37+"; /* deployed fallback claim */

    root.innerHTML = `
      <!-- ================= HERO ================= -->
      <section class="rjd-hero">
        <div class="rjd-hero__inner">
          <div class="rjd-hero__text">
            <div class="rjd-hero__pill">${text("SSC • RAILWAY • STATE EXAMS", "SSC • RAILWAY • STATE EXAMS")}</div>
            <h1 class="rjd-hero__title">
              ${text(
                `Science की तैयारी अब सिर्फ पढ़ाई नहीं —<br>एक <em>सही Preparation Journey</em> है।`,
                `Science preparation is no longer just reading —<br>it's <em>the right preparation journey</em>.`
              )}
            </h1>
            <p class="rjd-hero__sub">
              ${text(
                "NCERT Class 6–10 के Concepts, Practice Questions और Mock Tests — एक ही जगह।",
                "NCERT Class 6–10 concepts, practice questions and mock tests — all in one place."
              )}
            </p>
            <div class="rjd-hero__actions">
              <button type="button" class="rjd-gold-btn" data-goto="rjd-subjects">
                ${text("Preparation शुरू करें →", "Start Preparing →")}
              </button>
              <button type="button" class="rjd-hero__cta-link" data-goto="rjd-journey">
                ${text("या Practice से शुरू करें", "Or start with Practice")}
              </button>
            </div>
            <div class="rjd-hero__chips" aria-label="${text("तैयारी का तरीका", "How it works")}">
              <span class="rjd-hero__chip">${text("NCERT Class 6–10", "NCERT Class 6–10")}</span>
              <span class="rjd-hero__chip">${text("Notes → Practice → Mock Test", "Notes → Practice → Mock Test")}</span>
            </div>
          </div>
          <div class="rjd-hero__visual">${HERO_ART}</div>
        </div>
      </section>

      <!-- ================= SUBJECTS (main destination) ================= -->
      <section class="rjd-home-section" id="rjd-subjects">
        <h2 class="rjd-home-section__title">${text("विषय चुनें", "Choose Your Subject")}</h2>
        <p class="rjd-home-section__sub">
          ${text(
            "पहले Subject, फिर Chapter — Notes, Practice और Mock Test सब एक ही जगह।",
            "First a subject, then a chapter — notes, practice and mock tests, all in one place."
          )}
        </p>

        ${
          subjects.length
            ? `<div class="rjd-subject-grid">
                ${subjects
                  .map((subj) => {
                    const key = subj.subject;
                    const count = (subj.chapters || []).length;
                    const copy = SUBJECT_COPY[key];
                    const label = pickLabel(subj.label);
                    return `
                      <button type="button" class="rjd-subject-card rjd-subject-card--${key}" data-subject="${key}">
                        <span class="rjd-subject-card__icon">${subjectIcon(key, subj.icon)}</span>
                        <span class="rjd-subject-card__title">${copy ? (key === "biology" ? "Biology" : key === "physics" ? "Physics" : key === "chemistry" ? "Chemistry" : label) : label}</span>
                        <span class="rjd-subject-card__hook">${copy ? text(copy.hook.hi, copy.hook.en) : pickLabel(subj.tagline)}</span>
                        <span class="rjd-subject-card__desc">${copy ? text(copy.desc.hi, copy.desc.en) : (subj.classes || "NCERT Class 6–10")}</span>
                        <span class="rjd-subject-card__meta">
                          ${count > 0 ? `<b>${count}</b> ${text("Chapters", "Chapters")}` : text("Chapters जल्दी", "Chapters coming soon")}
                          <i>·</i> ${subj.classes || "NCERT Class 6–10"}
                        </span>
                        <span class="rjd-subject-card__btn">
                          ${copy ? text(copy.cta.hi, copy.cta.en) : text(`${label} देखें →`, `Explore ${label} →`)}
                        </span>
                      </button>
                    `;
                  })
                  .join("")}
              </div>
              <p class="rjd-subject-note">
                ${text(
                  "हर chapter में — Notes, Practice Questions और Exam जैसे Mock Tests।",
                  "Inside every chapter — notes, practice questions and exam-like mock tests."
                )}
              </p>`
            : `<div class="rjd-empty-state"><p>${text("डेटा लोड नहीं हो सका। कृपया पेज रिफ्रेश करें।", "Could not load data. Please refresh the page.")}</p></div>`
        }
      </section>

      <!-- ================= LEARNING JOURNEY on a RailGaadi track ================= -->
      <section class="rjd-home-section rjd-journey" id="rjd-journey">
        <h2 class="rjd-home-section__title">${text("कैसे चलेगी तैयारी?", "How the preparation runs")}</h2>
        <p class="rjd-home-section__sub">
          ${text(
            "RailGaadi के चार स्टेशन — रुके बिना, रोज़ थोड़ा आगे।",
            "Four RailGaadi stations — no stopping, a little forward every day."
          )}
        </p>

        <div class="rjd-track" aria-hidden="true">
          ${TRAIN_GLYPH}
          <div class="rjd-track__rail"></div>
          <div class="rjd-track__stations">
            <span class="rjd-track__station is-current">${text("समझो", "Learn")}</span>
            <span class="rjd-track__station">${text("अभ्यास", "Practice")}</span>
            <span class="rjd-track__station">Mock Test</span>
            <span class="rjd-track__station">${text("सुधारो", "Improve")}</span>
          </div>
        </div>

        <div class="rjd-steps">
          <div class="rjd-step">
            <div class="rjd-step__head"><span class="rjd-step__num">01</span><h3>Notes</h3></div>
            <p class="rjd-step__lead">${text("पहले Concept समझो।", "First, understand the concept.")}</p>
            <p class="rjd-step__copy">${text("Chapter के important concepts को पढ़ो और जरूरत पड़ने पर दोबारा revise करो।", "Read the important concepts of the chapter and revise them whenever needed.")}</p>
            <button type="button" class="rjd-step__btn" data-goto="rjd-subjects">${text("Notes देखें →", "View Notes →")}</button>
          </div>
          <div class="rjd-step">
            <div class="rjd-step__head"><span class="rjd-step__num">02</span><h3>Practice</h3></div>
            <p class="rjd-step__lead">${text("अब खुद को Check करो।", "Now check yourself.")}</p>
            <p class="rjd-step__copy">${text("Concept समझ आया? उसी topic पर questions solve करके देखो।", "Concept understood? Solve questions on the same topic and see.")}</p>
            <button type="button" class="rjd-step__btn" data-goto="rjd-subjects">${text("Practice शुरू करें →", "Start Practice →")}</button>
          </div>
          <div class="rjd-step">
            <div class="rjd-step__head"><span class="rjd-step__num">03</span><h3>Mock Test</h3></div>
            <p class="rjd-step__lead">${text("अब Exam जैसा Test दो।", "Now take an exam-like test.")}</p>
            <p class="rjd-step__copy">${text("समय के साथ questions solve करो और अपना performance देखो।", "Solve questions against the clock and watch your performance.")}</p>
            <button type="button" class="rjd-step__btn" data-goto="rjd-subjects">${text("Mock Test दें →", "Take Mock Test →")}</button>
          </div>
        </div>

        <p class="rjd-journey__improve">
          ${text(
            "<b>सुधारो:</b> Result देखो और जो सवाल गलत हुए, उनकी अलग से दोबारा practice करो।",
            "<b>Improve:</b> check your result and re-practise the questions you got wrong."
          )}
        </p>
        <p class="rjd-journey__hint">
          ${text(
            "तीनों steps हर chapter के अंदर मिलते हैं — ऊपर से Subject चुनकर कोई भी chapter खोलो।",
            "All three steps live inside every chapter — pick a subject above and open any chapter."
          )}
        </p>
      </section>

      <!-- ================= SLIM STATS STRIP (derived) ================= -->
      <section class="rjd-home-section rjd-stats-strip-wrap">
        <div class="rjd-stats-strip">
          <div class="rjd-stats-strip__item">
            <span class="rjd-stats-strip__num">${chapterStat}</span>
            <span class="rjd-stats-strip__label">${text("Chapters", "Chapters")}</span>
          </div>
          <div class="rjd-stats-strip__item">
            <span class="rjd-stats-strip__num">150+</span>
            <span class="rjd-stats-strip__label">${text("Questions / Chapter", "Questions / Chapter")}</span>
          </div>
          <div class="rjd-stats-strip__item">
            <span class="rjd-stats-strip__num">5 × 30</span>
            <span class="rjd-stats-strip__label">${text("Mock Tests / Chapter", "Mock Tests / Chapter")}</span>
          </div>
          <div class="rjd-stats-strip__item">
            <span class="rjd-stats-strip__num">6–10</span>
            <span class="rjd-stats-strip__label">${text("NCERT Classes", "NCERT Classes")}</span>
          </div>
        </div>
      </section>

      <!-- ================= EXAM RELEVANCE (compact) ================= -->
      <section class="rjd-home-section rjd-exams-strip-wrap">
        <h2 class="rjd-exams-strip__title">${text("किस परीक्षा के लिए तैयारी?", "Preparing for which exam?")}</h2>
        <div class="rjd-exams-strip">
          <div class="rjd-exams-strip__group">
            <b>SSC</b>
            <span>CGL · CHSL · MTS · GD</span>
          </div>
          <div class="rjd-exams-strip__group">
            <b>${text("Railway", "Railway")}</b>
            <span>NTPC · Group D · ALP</span>
          </div>
          <div class="rjd-exams-strip__group">
            <b>${text("State", "State")}</b>
            <span>SI · REET · Patwari</span>
          </div>
        </div>
      </section>

      <!-- ================= FINAL CTA (mirrors hero path) ================= -->
      <section class="rjd-final">
        <div class="rjd-final__inner">
          <h2 class="rjd-final__title">
            ${text(
              "जो chapter पढ़ा है,<br>उसी chapter के questions अभी solve करो।",
              "Already read a chapter?<br>Solve its questions right now."
            )}
          </h2>
          <p class="rjd-final__sub">
            ${text("Subject चुनो → Chapter खोलो → Practice और Mock Test।", "Pick a subject → open a chapter → practise and take a mock test.")}
          </p>
          <button type="button" class="rjd-gold-btn" data-goto="rjd-subjects">
            ${text("Mock Test शुरू करें →", "Start a Mock Test →")}
          </button>
        </div>
      </section>
    `;

    /* Subject destinations → existing subject navigation (preserved) */
    root.querySelectorAll("[data-subject]").forEach((btn) => {
      btn.addEventListener("click", () => openSubject(btn.dataset.subject));
    });

    /* Landing-internal scroll CTAs (no routing changes) */
    root.querySelectorAll("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", () => goToSection(btn.dataset.goto));
    });
  }

  /* =========================================================
     RAILWAY MOCK TEST HUB — modern landing
  ========================================================= */
  function renderRailwayLanding() {
    currentView = "landing";
    selectedSubject = null;

    root.innerHTML = `
      <section class="rjd-mock-hero">
        <div class="rjd-mock-hero__inner">
          <div class="rjd-mock-hero__copy">
            <div class="rjd-mock-kicker">🚆 RAILWAY MOCK TEST • RRB • RPF • RPSF</div>
            <h1>Railway Exam की तैयारी<br><span>अब और भी आसान</span></h1>
            <p>Mock Tests, Practice Questions और Performance Analysis के साथ अपनी तैयारी को सही दिशा दें।</p>
            <div class="rjd-mock-feature-row">
              <div><b>Latest Pattern</b><small>Exam-focused practice</small></div>
              <div><b>Chapter-wise</b><small>Targeted preparation</small></div>
              <div><b>Full Mock Tests</b><small>Real-test experience</small></div>
              <div><b>Detailed Result</b><small>Know your performance</small></div>
            </div>
            <div class="rjd-mock-actions">
              <a class="rjd-mock-primary" href="railway-technician-grade-3.html">Railway Mock Test शुरू करें →</a>
              <a class="rjd-mock-secondary" href="railway-exams.html">Railway Exams देखें</a>
            </div>
          </div>
          <div class="rjd-mock-hero-art" aria-hidden="true">
            <div class="rjd-train-scene">
              <div class="rjd-train-sky"></div>
              <div class="rjd-train-track"></div>
              <div class="rjd-train">
                <div class="rjd-train-front"><i></i><i></i><b>INDIAN<br>RAILWAYS</b></div>
                <div class="rjd-train-coach"></div>
                <div class="rjd-train-coach"></div>
              </div>
              <div class="rjd-cloud c1"></div><div class="rjd-cloud c2"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="rjd-mock-stats">
        <div><strong>10+</strong><span>Railway Exams</span></div>
        <div><strong>50+</strong><span>Mock Tests / Exam</span></div>
        <div><strong>100</strong><span>Questions / Test</span></div>
        <div><strong>90</strong><span>Minutes</span></div>
        <div><strong>Full</strong><span>Performance Analysis</span></div>
        <div><strong>✓</strong><span>Updated Content</span></div>
      </section>

      <section class="rjd-mock-section">
        <div class="rjd-mock-heading">
          <div>
            <span>CHOOSE YOUR PREPARATION</span>
            <h2>🚆 Railway Exam Categories</h2>
            <p>अपनी परीक्षा चुनें और Mock Test से तैयारी शुरू करें।</p>
          </div>
          <div class="rjd-mock-note">📘 Exam pattern & syllabus focused</div>
        </div>

        <div class="rjd-railway-grid">
          <article class="rjd-railway-card featured">
            <div class="rjd-card-icon red">🔧</div><span class="rjd-popular">POPULAR</span>
            <h3>RRB Technician<br>Grade-III</h3>
            <p>Complete mock test series with subject-wise preparation.</p>
            <div class="rjd-card-pills"><b>50 Mock Tests</b><b>100 Questions</b><b>90 Minutes</b></div>
            <a href="railway-technician-grade-3.html">Mock Test शुरू करें →</a>
          </article>

          <article class="rjd-railway-card">
            <div class="rjd-card-icon blue">👥</div>
            <h3>RRB Group D</h3>
            <p>Practice and mock tests for Railway Group D preparation.</p>
            <div class="rjd-card-pills"><b>Test Series</b><b>Practice</b><b>PYQ</b></div>
            <span class="disabled">Coming Soon</span>
          </article>

          <article class="rjd-railway-card">
            <div class="rjd-card-icon green">⚙</div>
            <h3>RRB Technician<br>Grade-I Signal</h3>
            <p>Subject-wise practice and full mock test preparation.</p>
            <div class="rjd-card-pills"><b>50 Mock Tests</b><b>100 Questions</b><b>90 Minutes</b></div>
            <a href="railway-technician-grade-1-signal.html">Mock Test शुरू करें →</a>
          </article>

          <article class="rjd-railway-card">
            <div class="rjd-card-icon purple">🛠</div>
            <h3>RRB JE</h3>
            <p>Technical exam preparation with practice and mock tests.</p>
            <div class="rjd-card-pills"><b>Full Tests</b><b>Practice</b><b>PYQ</b></div>
            <span class="disabled">Coming Soon</span>
          </article>

          <article class="rjd-railway-card">
            <div class="rjd-card-icon orange">🚆</div>
            <h3>RRB ALP</h3>
            <p>Build speed, accuracy and confidence with exam practice.</p>
            <div class="rjd-card-pills"><b>Full Tests</b><b>Practice</b><b>PYQ</b></div>
            <span class="disabled">Coming Soon</span>
          </article>

          <article class="rjd-railway-card">
            <div class="rjd-card-icon violet">📋</div>
            <h3>RRB NTPC</h3>
            <p>Practice for graduate and undergraduate Railway posts.</p>
            <div class="rjd-card-pills"><b>Mock Tests</b><b>Practice</b><b>PYQ</b></div>
            <span class="disabled">Coming Soon</span>
          </article>

          <article class="rjd-railway-card">
            <div class="rjd-card-icon teal">🛡️</div>
            <h3>RPF Constable</h3>
            <p>Railway Protection Force exam-focused practice.</p>
            <div class="rjd-card-pills"><b>Mock Tests</b><b>Practice</b><b>Analysis</b></div>
            <span class="disabled">Coming Soon</span>
          </article>

          <article class="rjd-railway-card">
            <div class="rjd-card-icon gold">🎯</div>
            <h3>RPF SI</h3>
            <p>Focused preparation with practice and test-based revision.</p>
            <div class="rjd-card-pills"><b>Mock Tests</b><b>Practice</b><b>Analysis</b></div>
            <span class="disabled">Coming Soon</span>
          </article>
        </div>
      </section>

      <section class="rjd-mock-journey">
        <div><span>01</span><b>Exam चुनें</b><small>अपनी Railway परीक्षा select करें</small></div>
        <i>→</i>
        <div><span>02</span><b>Practice करें</b><small>Topic और chapter पर पकड़ बनाएं</small></div>
        <i>→</i>
        <div><span>03</span><b>Mock Test दें</b><small>Exam जैसे माहौल में test दें</small></div>
        <i>→</i>
        <div><span>04</span><b>Result सुधारें</b><small>गलतियों को पहचानकर दोबारा practice करें</small></div>
      </section>
    `;
  }

  /* =========================================================
     SUBJECT PAGE — chapters of one subject (preserved)
  ========================================================= */
  function renderSubject() {
    if (!selectedSubject) return renderRailwayLanding();
    currentView = "subject";

    const chapters = selectedSubject.chapters || [];
    const subjectName = pickLabel(selectedSubject.label);

    root.innerHTML = `
      <section class="rjd-rail-hero">
        <span class="rjd-rail-hero__badge">
          🚂 ${text("Science Preparation", "Science Preparation")}
        </span>
        <h1 class="rjd-rail-hero__title">
          <span class="rjd-rail-hero__icon">${subjectIcon(selectedSubject.subject, selectedSubject.icon)}</span>
          ${subjectName.toUpperCase ? subjectName.toUpperCase() : subjectName}
        </h1>
        <p class="rjd-rail-hero__subtitle">
          ${selectedSubject.classes || "NCERT Class 6–10"}
          ·
          ${chapters.length} ${text("Important Chapters", "Important Chapters")}
        </p>
      </section>

      <div class="rjd-rail-breadcrumb">
        <button type="button" class="rjd-rail-crumb is-done" data-back-landing>${text("विषय", "Subject")}</button>
        <span class="rjd-rail-crumb__sep">→</span>
        <span class="rjd-rail-crumb is-active">${text("अध्याय", "Chapter")}</span>
      </div>

      <div class="rjd-rail-grid rjd-rail-grid--wide">
        ${chapters
          .map(
            (ch) => `
          <a
            class="rjd-rail-card rjd-rail-card--chapter"
            href="chapter.html?subject=${selectedSubject.subject}&chapter=${ch.chapter}"
          >
            <span class="rjd-rail-card__badge">${ch.code || ""}</span>
            <span class="rjd-rail-card__icon">📖</span>
            <span class="rjd-rail-card__label">${pickLabel(ch.name)}</span>
            <span class="rjd-rail-card__desc">${pickLabel(ch.desc)}</span>
            <span class="rjd-rail-card__meta">${text("NCERT Class 6–10", "NCERT Class 6–10")}</span>
            <span class="rjd-rail-card__cta">${text("पढ़ाई शुरू करें →", "Start Learning →")}</span>
          </a>
        `
          )
          .join("")}
      </div>

      <div style="text-align:center; padding-bottom: 32px;">
        <button type="button" class="rjd-btn rjd-btn--ghost" id="rjd-back-landing">${text("← सभी विषय देखें", "← View All Subjects")}</button>
      </div>
    `;

    document.getElementById("rjd-back-landing").addEventListener("click", backToLanding);

    root.querySelectorAll("[data-back-landing]").forEach((btn) => {
      btn.addEventListener("click", backToLanding);
    });
  }

  function openSubject(id) {
    const subj = findSubject(id);
    if (!subj) {
      UIManager.toast(
        text("यह विषय उपलब्ध नहीं है।", "This subject is not available."),
        "warn",
        4000
      );
      return;
    }
    if (!manifest) {
      UIManager.toast(
        text("कोई डेटा उपलब्ध नहीं। कृपया बाद में पुनः प्रयास करें।", "No data available. Please try again later."),
        "warn",
        4000
      );
      return;
    }
    selectedSubject = subj;
    pushSubject(id);
    renderSubject();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function backToLanding() {
    selectedSubject = null;
    pushSubject(null);
    renderRailwayLanding();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  /* =========================================================
     LANGUAGE TOGGLE (preserved)
  ========================================================= */
  function renderLangToggle() {
    const btn = document.getElementById("rjd-lang-toggle");
    if (!btn) return;
    btn.querySelectorAll("[data-lang]").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.lang === LanguageManager.getCurrent());
    });
  }

  /* =========================================================
     BOOT — load manifest, honour ?subject= deep links (preserved)
  ========================================================= */
  async function boot() {
    try {
      const res = await fetch("data/manifest.json");
      if (res.ok) manifest = await res.json();
    } catch (err) {
      console.warn("Manifest load failed", err);
    }

    const params = new URLSearchParams(window.location.search);
    const deepLinked = readSubjectFromURL();
    const chapter = params.get("chapter");

    // Subject-only legacy URLs are now redirected to the dedicated
    // subject hubs. Chapter deep-links remain on chapter.html.
    const subjectHubMap = {
      biology: "science/biology/index.html",
      physics: "science/physics/index.html",
      chemistry: "science/chemistry/index.html"
    };

    if (deepLinked && !chapter && subjectHubMap[deepLinked]) {
      window.location.replace(subjectHubMap[deepLinked]);
      return;
    }

    if (deepLinked) {
      selectedSubject = findSubject(deepLinked);
    }

    if (selectedSubject) renderSubject();
    else renderRailwayLanding();

    renderLangToggle();
  }

  document.getElementById("rjd-lang-toggle")?.addEventListener("click", (e) => {
    const target = e.target.closest("[data-lang]");
    if (!target) return;
    LanguageManager.setLanguage(target.dataset.lang);
  });

  LanguageManager.onChange(() => {
    renderLangToggle();
    if (currentView === "landing" || !selectedSubject) renderRailwayLanding();
    else renderSubject();
  });

  window.addEventListener("popstate", () => {
    const id = readSubjectFromURL();
    selectedSubject = id ? findSubject(id) : null;
    if (selectedSubject) renderSubject();
    else renderRailwayLanding();
  });

  boot();
})();
