const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const SUBJECTS = ["biology", "physics", "chemistry"];
const CHAPTERS = Array.from({ length: 12 }, (_, i) => `chapter-${String(i + 1).padStart(2, "0")}`);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function getQuestions(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.questions)) return data.questions;
  return [];
}

function correctIndex(q) {
  return Number.isInteger(q.correctAnswer) ? q.correctAnswer : q.correct;
}

test("all 36 Science chapters have usable bilingual question banks", () => {
  let checked = 0;

  for (const subject of SUBJECTS) {
    for (const chapter of CHAPTERS) {
      const base = path.join("data", "science", subject, chapter);
      const meta = readJson(path.join(base, "meta.json"));
      const questions = getQuestions(readJson(path.join(base, "questions.json")));

      assert.ok(meta.chapterName?.hi && meta.chapterName?.en, `${base}: bilingual chapter title`);
      assert.ok(meta.notes?.hi?.concept && meta.notes?.en?.concept, `${base}: bilingual notes`);
      assert.ok(questions.length >= 150, `${base}: expected at least 150 questions, got ${questions.length}`);

      const ids = new Set();
      const hindiPrompts = new Set();
      const answerCounts = [0, 0, 0, 0];
      const declaredTopics = new Set((meta.topics || []).map(topic => topic.id));
      const usedTopics = new Set(questions.map(q => q.topic).filter(Boolean));
      assert.ok(usedTopics.size > 0, `${base}: question bank has no topic tags`);
      for (const topicId of usedTopics) {
        assert.ok(declaredTopics.has(topicId), `${base}: topic "${topicId}" is missing from meta.topics`);
      }
      for (const topicId of declaredTopics) {
        assert.ok(usedTopics.has(topicId), `${base}: meta topic "${topicId}" has no matching questions`);
      }

      for (const [i, q] of questions.entries()) {
        const label = `${base}/questions.json question ${i + 1}`;
        assert.ok(q.id, `${label}: missing id`);
        assert.ok(!ids.has(q.id), `${label}: duplicate id ${q.id}`);
        ids.add(q.id);

        const hiPrompt = q.question?.hi?.trim();
        assert.ok(hiPrompt, `${label}: missing Hindi prompt`);
        assert.ok(q.question?.en?.trim(), `${label}: missing English prompt`);
        assert.ok(!hindiPrompts.has(hiPrompt), `${label}: duplicate Hindi prompt`);
        hindiPrompts.add(hiPrompt);

        assert.ok(Array.isArray(q.options?.hi) && q.options.hi.length === 4, `${label}: expected four Hindi options`);
        assert.ok(Array.isArray(q.options?.en) && q.options.en.length === 4, `${label}: expected four English options`);
        assert.equal(new Set(q.options.hi.map(x => String(x).trim())).size, 4, `${label}: duplicate Hindi options`);
        assert.equal(new Set(q.options.en.map(x => String(x).trim())).size, 4, `${label}: duplicate English options`);

        const answer = correctIndex(q);
        assert.ok(Number.isInteger(answer) && answer >= 0 && answer < 4, `${label}: invalid correct answer index`);
        answerCounts[answer] += 1;

        assert.ok(q.explanation?.hi?.trim(), `${label}: missing Hindi explanation`);
        assert.ok(q.explanation?.en?.trim(), `${label}: missing English explanation`);

        for (const language of ["hi", "en"]) {
          const optionExplanations = q.optionExplanations?.[language];
          if (optionExplanations !== undefined) {
            assert.ok(Array.isArray(optionExplanations) && optionExplanations.length === 4,
              `${label}: ${language} option explanations must align with four options`);
          }
        }
      }

      const spread = Math.max(...answerCounts) - Math.min(...answerCounts);
      assert.ok(spread <= 1,
        `${base}: correct-answer positions are imbalanced (${answerCounts.join(", ")})`);
      checked += 1;
    }
  }

  assert.equal(checked, 36);
});

test("all 36 Science chapters meet the minimum notes-depth and originality checklist", () => {
  const genericPatterns = [
    /Study .* with definitions, examples, comparisons and applications/i,
    /Understand the core idea of/i,
    /Connect each major concept with an example/i,
    /Distinguish closely related terms and processes/i,
    /Apply the concept to simple real-life or exam situations/i,
    /Core definitions and concepts/i,
    /Important properties and examples/i,
    /Comparison and reasoning questions/i,
    /Application-based questions/i,
    /मुख्य परिभाषा समझें/,
    /मुख्य गुणों को उदाहरणों के साथ जोड़ें/,
    /प्रश्न को ध्यान से पढ़कर विकल्प चुनें/
  ];

  for (const subject of SUBJECTS) {
    for (const chapter of CHAPTERS) {
      const base = path.join("data", "science", subject, chapter);
      const meta = readJson(path.join(base, "meta.json"));
      for (const language of ["hi", "en"]) {
        const notes = meta.notes?.[language];
        assert.ok(notes, `${base}: missing ${language} notes`);
        assert.ok(typeof notes.concept === "string" && notes.concept.trim().length >= 180,
          `${base}: ${language} concept needs meaningful explanation`);
        assert.ok(typeof notes.example === "string" && notes.example.trim().length >= 60,
          `${base}: ${language} example needs a concrete, useful explanation`);
        assert.ok(Array.isArray(notes.sections) && notes.sections.length >= 4,
          `${base}: ${language} notes need at least four sections`);
        assert.ok(Array.isArray(notes.keyPoints) && notes.keyPoints.length >= 4,
          `${base}: ${language} needs at least four specific key points`);
        assert.ok(Array.isArray(notes.examFocus) && notes.examFocus.length >= 3,
          `${base}: ${language} needs at least three specific exam-focus points`);
        const text = [notes.example, ...(notes.keyPoints || []), ...(notes.examFocus || [])].join("\\n");
        for (const pattern of genericPatterns) {
          assert.doesNotMatch(text, pattern, `${base}: generic/filler notes detected in ${language}`);
        }
      }
    }
  }
});

test("all 36 Science chapters have static, canonical, source-transparent notes pages", () => {
  for (const subject of SUBJECTS) {
    for (const chapter of CHAPTERS) {
      const file = path.join(ROOT, "science", subject, `${chapter}.html`);
      assert.ok(fs.existsSync(file), `${subject}/${chapter}: missing static notes page`);
      const html = fs.readFileSync(file, "utf8");
      assert.match(html, /<meta name="robots" content="noindex,follow">/i,
        `${subject}/${chapter}: keep noindex until the full fact/source review is complete`);
      assert.match(html, /<link rel="canonical" href="https:\/\/rojgardwaar\.in\/science\//i,
        `${subject}/${chapter}: missing static canonical URL`);
      assert.match(html, /https:\/\/ncert\.nic\.in\/textbook\.php/i,
        `${subject}/${chapter}: missing official textbook reference`);
      assert.match(html, /pages\/contact\.html/i,
        `${subject}/${chapter}: missing correction/feedback route`);
      assert.match(html.trim(), /<\/html>$/i,
        `${subject}/${chapter}: malformed HTML ending`);
    }
  }
});

test("Science hubs connect static Notes and interactive Practice/Mock Tests", () => {
  for (const subject of SUBJECTS) {
    const hub = fs.readFileSync(path.join(ROOT, "science", subject, "index.html"), "utf8");
    for (const chapter of CHAPTERS) {
      const n = chapter.slice(-2);
      assert.ok(hub.includes(`href="chapter-${n}.html"`),
        `${subject}: chapter ${n} Notes link must use its static page`);
      assert.ok(hub.includes(`chapter=${n}&open=practice`),
        `${subject}: chapter ${n} must retain its interactive Practice link`);
      assert.ok(hub.includes(`chapter=${n}&open=mocktests`),
        `${subject}: chapter ${n} must retain its interactive Mock Test link`);
    }
  }
});
